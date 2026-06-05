import type { Env, Client } from "../types";
import { getClient, putClient, listClients } from "../kv";

function nanoid() {
  return `cli_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGetClients(env: Env): Promise<Response> {
  const clients = await listClients(env.JRCORP_KV);
  return json(clients);
}

export async function handleGetClient(tenantId: string, env: Env): Promise<Response> {
  const client = await getClient(env.JRCORP_KV, tenantId);
  if (!client) return json({ error: "Client not found" }, 404);
  return json(client);
}

export async function handleCreateClient(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as Partial<Client>;

  if (!body.companyName || !body.taxId || !body.contactEmail) {
    return json({ error: "companyName, taxId and contactEmail are required" }, 400);
  }

  const client: Client = {
    tenantId: nanoid(),
    companyName: body.companyName,
    taxId: body.taxId,
    address: body.address ?? { street: "", city: "", state: "" },
    contactEmail: body.contactEmail,
    contactPhone: body.contactPhone ?? "",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  await putClient(env.JRCORP_KV, client);
  return json(client, 201);
}

export async function handleUpdateClient(tenantId: string, request: Request, env: Env): Promise<Response> {
  const existing = await getClient(env.JRCORP_KV, tenantId);
  if (!existing) return json({ error: "Client not found" }, 404);

  const body = await request.json() as Partial<Client>;
  const updated: Client = { ...existing, ...body, tenantId };
  await putClient(env.JRCORP_KV, updated);
  return json(updated);
}
