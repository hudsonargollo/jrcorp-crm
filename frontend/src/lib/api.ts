const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

function getToken(): string {
  if (typeof window === "undefined") return "";
  // Prefer admin token when present, fallback to client token
  return (
    localStorage.getItem("jrcorp_admin_token") ||
    localStorage.getItem("jrcorp_token") ||
    ""
  );
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Types (mirrors worker) ────────────────────────────────────────
export type ServiceType = "DEDETIZACAO" | "COLETA_RESIDUOS" | "HIGIENIZACAO";
export type ServiceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Client {
  tenantId: string;
  companyName: string;
  taxId: string;
  address: { street: string; city: string; state: string };
  contactEmail: string;
  contactPhone: string;
  status: "active" | "suspended";
  createdAt: string;
}

export interface ServiceRecord {
  serviceId: string;
  tenantId: string;
  type: ServiceType;
  scheduledDate: string;
  status: ServiceStatus;
  cost: number;
  certificateRef?: string;
  invoiceRef?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Invoice {
  invoiceId: string;
  tenantId: string;
  serviceId?: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  description: string;
  createdAt: string;
  paidAt?: string;
}

export interface Certificate {
  certId: string;
  tenantId: string;
  serviceId: string;
  type: ServiceType;
  issuedDate: string;
  fileUrl: string;
  expiresAt?: string;
}

// ── API calls ──────────────────────────────────────────────────────
export const api = {
  clients: {
    list: () => req<Client[]>("/api/clients"),
    get: (id: string) => req<Client>(`/api/clients/${id}`),
    create: (body: Omit<Client, "tenantId" | "status" | "createdAt">) =>
      req<Client>("/api/clients", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Client>) =>
      req<Client>(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  },
  services: {
    all: () => req<ServiceRecord[]>("/api/services"),
    list: (tenantId: string) => req<ServiceRecord[]>(`/api/clients/${tenantId}/services`),
    createContract: (body: { tenantId: string; type: ServiceType; startDate: string; cost: number }) =>
      req<ServiceRecord[]>("/api/contracts", { method: "POST", body: JSON.stringify(body) }),
    requestOnDemand: (body: { tenantId: string; scheduledDate: string; cost?: number }) =>
      req<ServiceRecord>("/api/request-service", { method: "POST", body: JSON.stringify(body) }),
    complete: (
      tenantId: string,
      serviceId: string,
      body: { certificateUrl?: string; invoiceDescription?: string }
    ) =>
      req<{ service: ServiceRecord; invoice: Invoice }>(
        `/api/clients/${tenantId}/services/${serviceId}/complete`,
        { method: "POST", body: JSON.stringify(body) }
      ),
  },
  certificates: {
    list: (tenantId: string) => req<Certificate[]>(`/api/clients/${tenantId}/certificates`),
    upload: (body: { tenantId: string; serviceId: string; fileUrl: string; expiresAt?: string }) =>
      req<Certificate>("/api/upload-certificate", { method: "POST", body: JSON.stringify(body) }),
  },
  invoices: {
    list: (tenantId: string) => req<Invoice[]>(`/api/clients/${tenantId}/invoices`),
    pay: (tenantId: string, invoiceId: string) =>
      req<Invoice>(`/api/clients/${tenantId}/invoices/${invoiceId}/pay`, { method: "POST" }),
  },
  auth: {
    register: (body: Omit<Client, "tenantId" | "status" | "createdAt">) =>
      req<{ client: Client; token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body: { email?: string; tenantId?: string }) =>
      req<{ tenantId: string; token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    me: () => req<Client>("/api/auth/me"),
  },
  admin: {
    login: (body: { email: string; password: string }) =>
      req<{ token: string; email: string }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    me: () => req<{ email: string; role: string }>("/api/admin/me"),
    logout: () => req<{ ok: boolean }>("/api/admin/logout", { method: "POST" }),
  },
};
