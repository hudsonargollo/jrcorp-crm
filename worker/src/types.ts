export interface Env {
  JRCORP_KV: KVNamespace;
}

export type ServiceType = "DEDETIZACAO" | "COLETA_RESIDUOS" | "HIGIENIZACAO";
export type ServiceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type ClientStatus = "active" | "suspended";

export interface Address {
  street: string;
  city: string;
  state: string;
}

export interface Client {
  tenantId: string;
  companyName: string;
  taxId: string;
  address: Address;
  contactEmail: string;
  contactPhone: string;
  status: ClientStatus;
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
