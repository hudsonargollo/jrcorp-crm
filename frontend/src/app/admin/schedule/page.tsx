"use client";
import { useEffect, useState } from "react";
import { api, type ServiceRecord, type Client } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { Plus, CheckCircle2 } from "lucide-react";

export default function SchedulePage() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contractModal, setContractModal] = useState(false);
  const [completeModal, setCompleteModal] = useState<ServiceRecord | null>(null);
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
    api.services.all().then(setServices);
    api.clients.list().then(setClients);
  }, []);

  const clientMap = Object.fromEntries(clients.map(c => [c.tenantId, c.companyName]));

  const sorted = [...services].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

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
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!completeModal) return;
    setSaving(true);
    try {
      const { service, invoice } = await api.services.complete(
        completeModal.tenantId,
        completeModal.serviceId,
        completeForm
      );
      setServices(prev => prev.map(s => s.serviceId === service.serviceId ? service : s));
      setCompleteModal(null);
      setCompleteForm({ certificateUrl: "", invoiceDescription: "" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agenda de Serviços</h1>
        <button
          onClick={() => setContractModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Cliente</th>
              <th className="px-6 py-3 text-left">Tipo</th>
              <th className="px-6 py-3 text-left">Data</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Valor</th>
              <th className="px-6 py-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(s => (
              <tr key={s.serviceId} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 font-medium text-gray-800">
                  {clientMap[s.tenantId] ?? s.tenantId}
                </td>
                <td className="px-6 py-3"><Badge value={s.type} /></td>
                <td className="px-6 py-3 text-gray-600">{s.scheduledDate}</td>
                <td className="px-6 py-3"><Badge value={s.status} /></td>
                <td className="px-6 py-3 text-right text-gray-700 font-medium">
                  R$ {s.cost.toFixed(2)}
                </td>
                <td className="px-6 py-3">
                  {s.status !== "COMPLETED" && s.status !== "CANCELLED" && (
                    <button
                      onClick={() => setCompleteModal(s)}
                      className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                    >
                      <CheckCircle2 size={14} /> Concluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  Nenhum serviço agendado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {contractModal && (
        <Modal title="Novo Contrato Recorrente" onClose={() => setContractModal(false)}>
          <form onSubmit={handleCreateContract} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cliente *</label>
              <select
                required value={contractForm.tenantId}
                onChange={e => setContractForm(f => ({ ...f, tenantId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Selecione...</option>
                {clients.map(c => (
                  <option key={c.tenantId} value={c.tenantId}>{c.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de Serviço *</label>
              <select
                value={contractForm.type}
                onChange={e => setContractForm(f => ({ ...f, type: e.target.value as "DEDETIZACAO" | "COLETA_RESIDUOS" }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="DEDETIZACAO">Dedetização (2× por ano)</option>
                <option value="COLETA_RESIDUOS">Coleta de Resíduos (mensal)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data de Início *</label>
              <input
                required type="date" value={contractForm.startDate}
                onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valor por Ocorrência (R$) *</label>
              <input
                required type="number" min="0" step="0.01" value={contractForm.cost}
                onChange={e => setContractForm(f => ({ ...f, cost: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setContractModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {saving ? "Gerando..." : "Criar Contrato"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {completeModal && (
        <Modal title="Concluir Serviço" onClose={() => setCompleteModal(null)}>
          <p className="text-sm text-gray-500 mb-4">
            <Badge value={completeModal.type} /> — {completeModal.scheduledDate}
          </p>
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">URL do Certificado (opcional)</label>
              <input
                type="url" value={completeForm.certificateUrl}
                onChange={e => setCompleteForm(f => ({ ...f, certificateUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descrição da Fatura</label>
              <input
                value={completeForm.invoiceDescription}
                onChange={e => setCompleteForm(f => ({ ...f, invoiceDescription: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCompleteModal(null)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {saving ? "Salvando..." : "Marcar como Concluído"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
