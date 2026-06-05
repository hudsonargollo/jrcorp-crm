import type { KVNamespace } from "@cloudflare/workers-types";
import type { Client, ServiceRecord, Invoice, Certificate } from "./types";

// Key builders
export const keys = {
  client: (tenantId: string) => `jrcorp:user:${tenantId}`,
  service: (tenantId: string, serviceId: string) => `jrcorp:service:${tenantId}:${serviceId}`,
  serviceIndex: (tenantId: string) => `jrcorp:service-index:${tenantId}`,
  invoice: (tenantId: string, invoiceId: string) => `jrcorp:invoice:${tenantId}:${invoiceId}`,
  invoiceIndex: (tenantId: string) => `jrcorp:invoice-index:${tenantId}`,
  certificate: (tenantId: string, certId: string) => `jrcorp:certificate:${tenantId}:${certId}`,
  certIndex: (tenantId: string) => `jrcorp:cert-index:${tenantId}`,
  clientIndex: () => `jrcorp:client-index`,
  authToken: (token: string) => `jrcorp:auth:${token}`,
};

export async function getClient(kv: KVNamespace, tenantId: string): Promise<Client | null> {
  return kv.get<Client>(keys.client(tenantId), "json");
}

export async function putClient(kv: KVNamespace, client: Client): Promise<void> {
  await kv.put(keys.client(client.tenantId), JSON.stringify(client));
  const index = await kv.get<string[]>(keys.clientIndex(), "json") ?? [];
  if (!index.includes(client.tenantId)) {
    index.push(client.tenantId);
    await kv.put(keys.clientIndex(), JSON.stringify(index));
  }
}

export async function listClients(kv: KVNamespace): Promise<Client[]> {
  const index = await kv.get<string[]>(keys.clientIndex(), "json") ?? [];
  const clients = await Promise.all(index.map(id => getClient(kv, id)));
  return clients.filter(Boolean) as Client[];
}

export async function getService(kv: KVNamespace, tenantId: string, serviceId: string): Promise<ServiceRecord | null> {
  return kv.get<ServiceRecord>(keys.service(tenantId, serviceId), "json");
}

export async function putService(kv: KVNamespace, service: ServiceRecord): Promise<void> {
  await kv.put(keys.service(service.tenantId, service.serviceId), JSON.stringify(service));
  const index = await kv.get<string[]>(keys.serviceIndex(service.tenantId), "json") ?? [];
  if (!index.includes(service.serviceId)) {
    index.push(service.serviceId);
    await kv.put(keys.serviceIndex(service.tenantId), JSON.stringify(index));
  }
}

export async function listServices(kv: KVNamespace, tenantId: string): Promise<ServiceRecord[]> {
  const index = await kv.get<string[]>(keys.serviceIndex(tenantId), "json") ?? [];
  const services = await Promise.all(index.map(id => getService(kv, tenantId, id)));
  return services.filter(Boolean) as ServiceRecord[];
}

export async function getInvoice(kv: KVNamespace, tenantId: string, invoiceId: string): Promise<Invoice | null> {
  return kv.get<Invoice>(keys.invoice(tenantId, invoiceId), "json");
}

export async function putInvoice(kv: KVNamespace, invoice: Invoice): Promise<void> {
  await kv.put(keys.invoice(invoice.tenantId, invoice.invoiceId), JSON.stringify(invoice));
  const index = await kv.get<string[]>(keys.invoiceIndex(invoice.tenantId), "json") ?? [];
  if (!index.includes(invoice.invoiceId)) {
    index.push(invoice.invoiceId);
    await kv.put(keys.invoiceIndex(invoice.tenantId), JSON.stringify(index));
  }
}

export async function listInvoices(kv: KVNamespace, tenantId: string): Promise<Invoice[]> {
  const index = await kv.get<string[]>(keys.invoiceIndex(tenantId), "json") ?? [];
  const invoices = await Promise.all(index.map(id => getInvoice(kv, tenantId, id)));
  return invoices.filter(Boolean) as Invoice[];
}

export async function getCertificate(kv: KVNamespace, tenantId: string, certId: string): Promise<Certificate | null> {
  return kv.get<Certificate>(keys.certificate(tenantId, certId), "json");
}

export async function putCertificate(kv: KVNamespace, cert: Certificate): Promise<void> {
  await kv.put(keys.certificate(cert.tenantId, cert.certId), JSON.stringify(cert));
  const index = await kv.get<string[]>(keys.certIndex(cert.tenantId), "json") ?? [];
  if (!index.includes(cert.certId)) {
    index.push(cert.certId);
    await kv.put(keys.certIndex(cert.tenantId), JSON.stringify(index));
  }
}

export async function listCertificates(kv: KVNamespace, tenantId: string): Promise<Certificate[]> {
  const index = await kv.get<string[]>(keys.certIndex(tenantId), "json") ?? [];
  const certs = await Promise.all(index.map(id => getCertificate(kv, tenantId, id)));
  return certs.filter(Boolean) as Certificate[];
}
