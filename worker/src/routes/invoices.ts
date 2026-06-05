import type { Env, Invoice } from "../types";
import { listInvoices, getInvoice, putInvoice } from "../kv";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGetInvoices(tenantId: string, env: Env): Promise<Response> {
  const invoices = await listInvoices(env.JRCORP_KV, tenantId);
  return json(invoices);
}

export async function handlePayInvoice(
  tenantId: string,
  invoiceId: string,
  env: Env
): Promise<Response> {
  const invoice = await getInvoice(env.JRCORP_KV, tenantId, invoiceId);
  if (!invoice) return json({ error: "Invoice not found" }, 404);

  const updated: Invoice = {
    ...invoice,
    status: "PAID",
    paidAt: new Date().toISOString(),
  };
  await putInvoice(env.JRCORP_KV, updated);
  return json(updated);
}
