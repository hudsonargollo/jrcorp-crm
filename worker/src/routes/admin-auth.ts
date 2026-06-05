import type { Env } from "../types";

const ADMIN_TOKEN_TTL = 60 * 60 * 8; // 8-hour sessions

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function nanoid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Crypto helpers (Web Crypto API — available in Workers) ────────────────

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = await hashPassword(password, salt);
  // Constant-time comparison
  if (derived.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < derived.length; i++) {
    diff |= derived.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

// ── Token helpers ─────────────────────────────────────────────────────────

const ADMIN_TOKEN_PREFIX = "jrcorp:admin-token:";

export async function createAdminToken(kv: Env["JRCORP_KV"]): Promise<string> {
  const token = `adm_${nanoid()}`;
  await kv.put(`${ADMIN_TOKEN_PREFIX}${token}`, "admin", {
    expirationTtl: ADMIN_TOKEN_TTL,
  });
  return token;
}

export async function verifyAdminToken(kv: Env["JRCORP_KV"], token: string): Promise<boolean> {
  if (!token.startsWith("adm_")) return false;
  const val = await kv.get(`${ADMIN_TOKEN_PREFIX}${token}`);
  return val === "admin";
}

export function extractAdminBearer(request: Request): string | null {
  const auth = request.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

// ── Guard middleware ──────────────────────────────────────────────────────

export async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  const token = extractAdminBearer(request);
  if (!token) return json({ error: "Unauthorized" }, 401);
  const valid = await verifyAdminToken(env.JRCORP_KV, token);
  if (!valid) return json({ error: "Invalid or expired admin token" }, 401);
  return null; // ok
}

// ── Routes ────────────────────────────────────────────────────────────────

/** POST /api/admin/login */
export async function handleAdminLogin(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { email?: string; password?: string };

  if (!body.email || !body.password) {
    return json({ error: "email and password are required" }, 400);
  }

  const storedEmail = env.ADMIN_EMAIL;
  const storedHash = env.ADMIN_PASSWORD_HASH;

  if (!storedEmail || !storedHash) {
    return json({ error: "Admin credentials not configured" }, 500);
  }

  if (body.email.toLowerCase() !== storedEmail.toLowerCase()) {
    return json({ error: "Invalid credentials" }, 401);
  }

  const valid = await verifyPassword(body.password, storedHash);
  if (!valid) return json({ error: "Invalid credentials" }, 401);

  const token = await createAdminToken(env.JRCORP_KV);
  return json({ token, email: storedEmail });
}

/** GET /api/admin/me — verify token and return identity */
export async function handleAdminMe(request: Request, env: Env): Promise<Response> {
  const token = extractAdminBearer(request);
  if (!token) return json({ error: "Unauthorized" }, 401);
  const valid = await verifyAdminToken(env.JRCORP_KV, token);
  if (!valid) return json({ error: "Invalid or expired token" }, 401);
  return json({ email: env.ADMIN_EMAIL, role: "admin" });
}

/** POST /api/admin/logout */
export async function handleAdminLogout(request: Request, env: Env): Promise<Response> {
  const token = extractAdminBearer(request);
  if (token) await env.JRCORP_KV.delete(`${ADMIN_TOKEN_PREFIX}${token}`);
  return json({ ok: true });
}
