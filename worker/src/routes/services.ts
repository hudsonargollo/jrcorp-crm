import type { Env, ServiceRecord, ServiceType, Invoice, Certificate } from "../types";
import { getService, putService, listServices, putInvoice, putCertificate, listCertificates } from "../kv";
import { buildRecurringSchedule, buildOnDemandService } from "../scheduler";

function nanoid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGetServices(tenantId: string, env: Env): Promise<Response> {
  const services = await listServices(env.JRCORP_KV, tenantId);
  return json(services);
}

export async function handleGetAllServices(env: Env): Promise<Response> {
  // Admin view — list via client index then gather all services
  const { listClients } = await import("../kv");
  const clients = await listClients(env.JRCORP_KV);
  const all = await Promise.all(clients.map(c => listServices(env.JRCORP_KV, c.tenantId)));
  return json(all.flat());
}

export async function handleCreateContract(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    tenantId: string;
    type: ServiceType;
    startDate: string;
    cost: number;
  };

  if (!body.tenantId || !body.type || !body.startDate || body.cost === undefined) {
    return json({ error: "tenantId, type, startDate and cost are required" }, 400);
  }

  if (body.type === "HIGIENIZACAO") {
    return json({ error: "Use POST /api/request-service for on-demand services" }, 400);
  }

  const records = buildRecurringSchedule(
    body.tenantId,
    body.type as "DEDETIZACAO" | "COLETA_RESIDUOS",
    body.startDate,
    body.cost
  );

  await Promise.all(records.map(r => putService(env.JRCORP_KV, r)));
  return json(records, 201);
}

export async function handleRequestService(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    tenantId: string;
    scheduledDate: string;
    cost?: number;
  };

  if (!body.tenantId || !body.scheduledDate) {
    return json({ error: "tenantId and scheduledDate are required" }, 400);
  }

  const service = buildOnDemandService(body.tenantId, body.scheduledDate, body.cost ?? 0);
  await putService(env.JRCORP_KV, service);
  return json(service, 201);
}

export async function handleCompleteService(
  tenantId: string,
  serviceId: string,
  request: Request,
  env: Env
): Promise<Response> {
  const service = await getService(env.JRCORP_KV, tenantId, serviceId);
  if (!service) return json({ error: "Service not found" }, 404);

  const body = await request.json() as { certificateUrl?: string; invoiceDescription?: string };
  const now = new Date().toISOString();

  // Mark completed
  const updated: ServiceRecord = {
    ...service,
    status: "COMPLETED",
    completedAt: now,
  };

  // Auto-generate invoice
  const invoice: Invoice = {
    invoiceId: `inv_${nanoid()}`,
    tenantId,
    serviceId,
    amount: service.cost,
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    status: "PENDING",
    description: body.invoiceDescription ?? `${service.type} — ${service.scheduledDate}`,
    createdAt: now,
  };
  updated.invoiceRef = invoice.invoiceId;

  // Auto-generate certificate if URL provided
  if (body.certificateUrl) {
    const cert: Certificate = {
      certId: `cert_${nanoid()}`,
      tenantId,
      serviceId,
      type: service.type,
      issuedDate: now.split("T")[0],
      fileUrl: body.certificateUrl,
    };
    updated.certificateRef = cert.certId;
    await putCertificate(env.JRCORP_KV, cert);
  }

  await putService(env.JRCORP_KV, updated);
  await putInvoice(env.JRCORP_KV, invoice);

  return json({ service: updated, invoice });
}

export async function handleGetCertificates(tenantId: string, env: Env): Promise<Response> {
  const certs = await listCertificates(env.JRCORP_KV, tenantId);
  return json(certs);
}

export async function handleUploadCertificate(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    tenantId: string;
    serviceId: string;
    fileUrl: string;
    expiresAt?: string;
  };

  if (!body.tenantId || !body.serviceId || !body.fileUrl) {
    return json({ error: "tenantId, serviceId and fileUrl are required" }, 400);
  }

  const service = await getService(env.JRCORP_KV, body.tenantId, body.serviceId);
  if (!service) return json({ error: "Service not found" }, 404);

  const cert: Certificate = {
    certId: `cert_${nanoid()}`,
    tenantId: body.tenantId,
    serviceId: body.serviceId,
    type: service.type,
    issuedDate: new Date().toISOString().split("T")[0],
    fileUrl: body.fileUrl,
    expiresAt: body.expiresAt,
  };

  await putCertificate(env.JRCORP_KV, cert);

  // Link cert to service
  service.certificateRef = cert.certId;
  await putService(env.JRCORP_KV, service);

  return json(cert, 201);
}
