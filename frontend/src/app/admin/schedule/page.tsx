"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type ServiceRecord, type Client } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { Plus, CheckCircle2, ExternalLink } from "lucide-react";

type FilterStatus = "ALL" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

export default function SchedulePage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [contractModal, setContractModal] = useState(false);
  const [completeModal, setCompleteModal] = useState<ServiceRecord | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);

  const [contractForm, setContractForm] = useState({
    tenantId: "",
    type: "DEDETIZACAO" as "DEDETIZACAO" | "COLETA_RESIDUOS",
    startDate: "",
    cost: "",
  });
  const [completeForm, setCompleteForm] = useState({
    certificateUrl: "",
    invoiceDescription: "",
  });

  useEffect(() => {
    Promise.all([api.services.all(), api.clients.list()]).then(([svcs, cls]) => {
      setServices(svcs);
      setClients(cls);
      setClientMap(Object.fromEntries(cls.map(c => [c.tenantId, c.companyName])));
    });
  }, []);

  const filtered = [...services]
    .filter(s => filter === "ALL" || s.status === filter)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  async function handleCreateContract(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.services.createContract({
        ...contractForm,
        cost: parseFloat(contractForm.cost),
      });
      setServices(prev => [...prev, ...created]);
      setContractModal(false);
      setContractForm({ tenantId: "", type: "DEDETIZACAO", startDate: "", cost: "" });
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!completeModal) return;
    setSaving(true);
    try {
      const { service } = await api.services.complete(
        completeModal.tenantId, completeModal.serviceId, completeForm
      );
      setServices(prev => prev.map(s => s.serviceId === service.serviceId ? service : s));
      setCompleteModal(null);
      setCompleteForm({ certificateUrl: "", invoiceDescription: "" });
    } finally {
      setSaving(false);
    }
  }

  const FILTER_TABS: { key: FilterStatus; label: string }[] = [
    { key: "ALL", label: "Todos" },
    { key: "SCHEDULED", label: "Agendados" },
    { key: "COMPLETED", label: "Concluídos" },
    { key: "CANCELLED", label: "Cancelados" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agenda de Serviços</h1>
        <button onClick={() => setContractModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {FILTER_TABS.map(({ key, label }) => {
          const count = key === "ALL" ? services.length : services.filter(s => s.status === key).length;
          return (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${filter === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
              <span className={`text-xs rounded-full px-1.5 ${filter === key ? "bg-gray-100" : "bg-gray-200/60"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Cliente</th>
              <th className="px-6 py-3 text-left">Tipo</th>
              <th className="px-6 py-3 text-left">Data</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Valor</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => (
              <tr key={s.serviceId} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 font-medium text-gray-800">
                  <div className="flex items-center gap-1">
                    <span>{clientMap[s.tenantId] ?? s.tenantId}</span>
                    <Link href={`/admin/clients/detail?id=${s.tenantId}`}
                      className="text-gray-300 hover:text-gray-500">
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-3"><Badge value={s.type} /></td>
                <td className="px-6 py-3 text-gray-600">{s.scheduledDate}</td>
                <td className="px-6 py-3"><Badge value={s.status} /></td>
                <td className="px-6 py-3 text-right text-gray-700 font-medium">
                  R$ {s.cost.toFixed(2)}
                </td>
                <td className="px-6 py-3 text-right">
                  {s.status !== "COMPLETED" && s.status !== "CANCELLED" && (
                    <button onClick={() => setCompleteModal(s)}
                      className="flex items-center gap-1 text-xs text-green-600 hover:underline ml-auto">
                      <CheckCircle2 size={13} /> Concluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                Nenhum serviço encontrado
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Contract modal */}
      {contractModal && (
        <Modal title="Novo Contrato Recorrente" onClose={() => setContractModal(false)}>
          <form onSubmit={handleCreateContract} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cliente *</label>
              <select required value={contractForm.tenantId}
                onChange={e => setContractForm(f => ({ ...f, tenantId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Selecione...</option>
                {clients.map(c => (
                  <option key={c.tenantId} value={c.tenantId}>{c.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select value={contractForm.type}
                onChange={e => setContractForm(f => ({ ...f, type: e.target.value as "DEDETIZACAO" | "COLETA_RESIDUOS" }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="DEDETIZACAO">Dedetização (2× por ano)</option>
                <option value="COLETA_RESIDUOS">Coleta de Resíduos (mensal)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data de Início *</label>
                <input required type="date" value={contractForm.startDate}
                  onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor/ocorrência (R$) *</label>
                <input required type="number" min="0" step="0.01" value={contractForm.cost}
                  onChange={e => setContractForm(f => ({ ...f, cost: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setContractModal(false)}
                className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {saving ? "Gerando..." : "Criar Contrato"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Complete modal */}
      {completeModal && (
        <Modal title="Concluir Serviço" onClose={() => setCompleteModal(null)}>
          <div className="flex items-center gap-2 mb-4">
            <Badge value={completeModal.type} />
            <span className="text-sm text-gray-500">{completeModal.scheduledDate}</span>
            <span className="text-xs text-gray-400">— {clientMap[completeModal.tenantId] ?? completeModal.tenantId}</span>
          </div>
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">URL do Certificado (opcional)</label>
              <input type="url" value={completeForm.certificateUrl}
                onChange={e => setCompleteForm(f => ({ ...f, certificateUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descrição da Fatura</label>
              <input value={completeForm.invoiceDescription}
                onChange={e => setCompleteForm(f => ({ ...f, invoiceDescription: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setCompleteModal(null)}
                className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {saving ? "Salvando..." : "Marcar como Concluído"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
