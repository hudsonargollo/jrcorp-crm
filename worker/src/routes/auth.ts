import type { Env, Client } from "../types";
import { getClient, putClient } from "../kv";
import { keys } from "../kv";

function nanoid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------- Token helpers ------------------------------------------------

export async function createToken(kv: Env["JRCORP_KV"], tenantId: string): Promise<string> {
  const token = `tok_${nanoid()}`;
  // Token expires after 30 days
  await kv.put(keys.authToken(token), tenantId, { expirationTtl: 60 * 60 * 24 * 30 });
  return token;
}

export async function resolveToken(kv: Env["JRCORP_KV"], token: string): Promise<string | null> {
  return kv.get(keys.authToken(token));
}

export function extractBearer(request: Request): string | null {
  const auth = request.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

// ---------- Routes -------------------------------------------------------

/** POST /api/auth/register — client self-onboarding */
export async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Partial<Client & { password?: string }>;

  if (!body.companyName || !body.taxId || !body.contactEmail) {
    return json({ error: "companyName, taxId and contactEmail are required" }, 400);
  }

  // Naive duplicate check by taxId — scan all clients (acceptable at small KV scale)
  const { listClients } = await import("../kv");
  const existing = await listClients(env.JRCORP_KV);
  if (existing.find(c => c.taxId === body.taxId)) {
    return json({ error: "A client with this taxId already exists" }, 409);
  }

  const client: Client = {
    tenantId: `cli_${nanoid()}`,
    companyName: body.companyName,
    taxId: body.taxId,
    address: body.address ?? { street: "", city: "", state: "" },
    contactEmail: body.contactEmail,
    contactPhone: body.contactPhone ?? "",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  await putClient(env.JRCORP_KV, client);
  const token = await createToken(env.JRCORP_KV, client.tenantId);

  return json({ client, token }, 201);
}

/** POST /api/auth/login — returns token for existing client (email-based, no password in MVP) */
export async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { email?: string; tenantId?: string };

  const { listClients } = await import("../kv");
  const clients = await listClients(env.JRCORP_KV);

  const match = body.tenantId
    ? clients.find(c => c.tenantId === body.tenantId)
    : clients.find(c => c.contactEmail === body.email);

  if (!match) return json({ error: "Client not found" }, 404);
  if (match.status === "suspended") return json({ error: "Account suspended" }, 403);

  const token = await createToken(env.JRCORP_KV, match.tenantId);
  return json({ tenantId: match.tenantId, token });
}

/** GET /api/auth/me — returns client info for the current token */
export async function handleMe(request: Request, env: Env): Promise<Response> {
  const token = extractBearer(request);
  if (!token) return json({ error: "Unauthorized" }, 401);

  const tenantId = await resolveToken(env.JRCORP_KV, token);
  if (!tenantId) return json({ error: "Invalid or expired token" }, 401);

  const client = await getClient(env.JRCORP_KV, tenantId);
  if (!client) return json({ error: "Client not found" }, 404);

  return json(client);
}
