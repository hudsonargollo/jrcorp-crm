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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function notFound() {
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      let response: Response | null = null;

      // ── Auth ─────────────────────────────────────────────────
      if (method === "POST" && path === "/api/auth/register") {
        response = await handleRegister(request, env);
      } else if (method === "POST" && path === "/api/auth/login") {
        response = await handleLogin(request, env);
      } else if (method === "GET" && path === "/api/auth/me") {
        response = await handleMe(request, env);

      // ── Clients ──────────────────────────────────────────────
      } else if (method === "GET" && path === "/api/clients") {
        response = await handleGetClients(env);
      } else if (method === "POST" && path === "/api/clients") {
        response = await handleCreateClient(request, env);
      } else if (method === "GET" && path.match(/^\/api\/clients\/[^/]+$/)) {
        const tenantId = path.split("/")[3];
        response = await handleGetClient(tenantId, env);
      } else if (method === "PATCH" && path.match(/^\/api\/clients\/[^/]+$/)) {
        const tenantId = path.split("/")[3];
        response = await handleUpdateClient(tenantId, request, env);

      // ── Services ─────────────────────────────────────────────
      } else if (method === "GET" && path === "/api/services") {
        response = await handleGetAllServices(env);
      } else if (method === "GET" && path.match(/^\/api\/clients\/[^/]+\/services$/)) {
        const tenantId = path.split("/")[3];
        response = await handleGetServices(tenantId, env);
      } else if (method === "POST" && path === "/api/contracts") {
        response = await handleCreateContract(request, env);
      } else if (method === "POST" && path === "/api/request-service") {
        response = await handleRequestService(request, env);
      } else if (method === "POST" && path.match(/^\/api\/clients\/[^/]+\/services\/[^/]+\/complete$/)) {
        const parts = path.split("/");
        response = await handleCompleteService(parts[3], parts[5], request, env);

      // ── Certificates ─────────────────────────────────────────
      } else if (method === "GET" && path.match(/^\/api\/clients\/[^/]+\/certificates$/)) {
        const tenantId = path.split("/")[3];
        response = await handleGetCertificates(tenantId, env);
      } else if (method === "POST" && path === "/api/upload-certificate") {
        response = await handleUploadCertificate(request, env);

      // ── Invoices ─────────────────────────────────────────────
      } else if (method === "GET" && path.match(/^\/api\/clients\/[^/]+\/invoices$/)) {
        const tenantId = path.split("/")[3];
        response = await handleGetInvoices(tenantId, env);
      } else if (method === "POST" && path.match(/^\/api\/clients\/[^/]+\/invoices\/[^/]+\/pay$/)) {
        const parts = path.split("/");
        response = await handlePayInvoice(parts[3], parts[5], env);
      }

      return withCors(response ?? notFound());
    } catch (err) {
      console.error(err);
      return withCors(
        new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
  },
} satisfies ExportedHandler<Env>;
