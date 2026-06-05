import clsx from "clsx";

const VARIANTS = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  PENDING: "bg-orange-100 text-orange-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  active: "bg-green-100 text-green-700",
  suspended: "bg-gray-100 text-gray-600",
  DEDETIZACAO: "bg-purple-100 text-purple-700",
  COLETA_RESIDUOS: "bg-teal-100 text-teal-700",
  HIGIENIZACAO: "bg-sky-100 text-sky-700",
} as const;

const LABELS: Record<string, string> = {
  DEDETIZACAO: "Dedetização",
  COLETA_RESIDUOS: "Coleta de Resíduos",
  HIGIENIZACAO: "Higienização",
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Vencido",
  active: "Ativo",
  suspended: "Suspenso",
};

export function Badge({ value }: { value: string }) {
  const cls = VARIANTS[value as keyof typeof VARIANTS] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", cls)}>
      {LABELS[value] ?? value}
    </span>
  );
}
