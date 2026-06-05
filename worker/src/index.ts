import type { Env } from "./types";
import { handleGetClients, handleGetClient, handleCreateClient, handleUpdateClient } from "./routes/clients";
import {
  handleGetServices,
  handleGetAllServices,
  handleCreateContract,
  handleRequestService,
  handleCompleteService,
  handleGetCertificates,
  handleUploadCertificate,
} from "./routes/services";
import { handleGetInvoices, handlePayInvoice } from "./routes/invoices";
import { handleRegister, handleLogin, handleMe } from "./routes/auth";
import {
  handleAdminLogin,
  handleAdminMe,
  handleAdminLogout,
  requireAdmin,
} from "./routes/admin-auth";

// Allowed origins — Pages production + preview deployments
const ALLOWED_ORIGINS = [
  "https://jrcorp-frontend.pages.dev",
  "https://bfa43994.jrcorp-frontend.pages.dev",
  "http://localhost:3000",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith(".jrcorp-frontend.pages.dev"))
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

function notFound() {
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

function withCors(response: Response, origin: string | null): Response {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      let response: Response | null = null;

      // ── Admin auth (public) ───────────────────────────────────
      if (method === "POST" && path === "/api/admin/login") {
        response = await handleAdminLogin(request, env);
      } else if (method === "GET" && path === "/api/admin/me") {
        response = await handleAdminMe(request, env);
      } else if (method === "POST" && path === "/api/admin/logout") {
        response = await handleAdminLogout(request, env);

      // ── Client auth (public) ──────────────────────────────────
      } else if (method === "POST" && path === "/api/auth/register") {
        response = await handleRegister(request, env);
      } else if (method === "POST" && path === "/api/auth/login") {
        response = await handleLogin(request, env);
      } else if (method === "GET" && path === "/api/auth/me") {
        response = await handleMe(request, env);

      // ── Admin-only routes (require admin token) ───────────────
      } else if (path.startsWith("/api/admin/") || isAdminRoute(method, path)) {
        const guard = await requireAdmin(request, env);
        if (guard) { response = guard; }

        else if (method === "GET" && path === "/api/clients") {
          response = await handleGetClients(env);
        } else if (method === "POST" && path === "/api/clients") {
          response = await handleCreateClient(request, env);
        } else if (method === "GET" && path.match(/^\/api\/clients\/[^/]+$/)) {
          response = await handleGetClient(path.split("/")[3], env);
        } else if (method === "PATCH" && path.match(/^\/api\/clients\/[^/]+$/)) {
          response = await handleUpdateClient(path.split("/")[3], request, env);
        } else if (method === "GET" && path === "/api/services") {
          response = await handleGetAllServices(env);
        } else if (method === "POST" && path === "/api/contracts") {
          response = await handleCreateContract(request, env);
        } else if (method === "POST" && path.match(/^\/api\/clients\/[^/]+\/services\/[^/]+\/complete$/)) {
          const p = path.split("/");
          response = await handleCompleteService(p[3], p[5], request, env);
        } else if (method === "POST" && path === "/api/upload-certificate") {
          response = await handleUploadCertificate(request, env);
        } else if (method === "POST" && path.match(/^\/api\/clients\/[^/]+\/invoices\/[^/]+\/pay$/)) {
          const p = path.split("/");
          response = await handlePayInvoice(p[3], p[5], env);
        }

      // ── Client-scoped routes (require client token) ───────────
      } else if (method === "POST" && path === "/api/request-service") {
        response = await handleRequestService(request, env);
      } else if (method === "GET" && path.match(/^\/api\/clients\/[^/]+\/services$/)) {
        response = await handleGetServices(path.split("/")[3], env);
      } else if (method === "GET" && path.match(/^\/api\/clients\/[^/]+\/certificates$/)) {
        response = await handleGetCertificates(path.split("/")[3], env);
      } else if (method === "GET" && path.match(/^\/api\/clients\/[^/]+\/invoices$/)) {
        response = await handleGetInvoices(path.split("/")[3], env);
      }

      return withCors(response ?? notFound(), origin);
    } catch (err) {
      console.error(err);
      return withCors(
        new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
        origin
      );
    }
  },
} satisfies ExportedHandler<Env>;

/** Routes that are admin-only even though they don't start with /api/admin/ */
function isAdminRoute(method: string, path: string): boolean {
  if (method === "GET" && path === "/api/clients") return true;
  if (method === "POST" && path === "/api/clients") return true;
  if (method === "PATCH" && path.match(/^\/api\/clients\/[^/]+$/)) return true;
  if (method === "GET" && path === "/api/services") return true;
  if (method === "POST" && path === "/api/contracts") return true;
  if (method === "POST" && path === "/api/upload-certificate") return true;
  if (path.match(/\/complete$/)) return true;
  if (path.match(/\/pay$/)) return true;
  return false;
}
