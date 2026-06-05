import type { ServiceRecord, ServiceType } from "./types";

function nanoid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export function buildRecurringSchedule(
  tenantId: string,
  type: Extract<ServiceType, "DEDETIZACAO" | "COLETA_RESIDUOS">,
  startDate: string,
  cost: number
): ServiceRecord[] {
  const records: ServiceRecord[] = [];
  const now = new Date().toISOString();

  if (type === "DEDETIZACAO") {
    // Twice per year — every 180 days
    for (let i = 0; i < 2; i++) {
      records.push({
        serviceId: `srv_${nanoid()}`,
        tenantId,
        type,
        scheduledDate: i === 0 ? startDate : addDays(startDate, 180),
        status: "SCHEDULED",
        cost,
        createdAt: now,
      });
    }
  } else {
    // Monthly — 12 occurrences
    for (let i = 0; i < 12; i++) {
      records.push({
        serviceId: `srv_${nanoid()}`,
        tenantId,
        type,
        scheduledDate: addMonths(startDate, i),
        status: "SCHEDULED",
        cost,
        createdAt: now,
      });
    }
  }

  return records;
}

export function buildOnDemandService(
  tenantId: string,
  scheduledDate: string,
  cost: number
): ServiceRecord {
  return {
    serviceId: `srv_${nanoid()}`,
    tenantId,
    type: "HIGIENIZACAO",
    scheduledDate,
    status: "SCHEDULED",
    cost,
    createdAt: new Date().toISOString(),
  };
}
