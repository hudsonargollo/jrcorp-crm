"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  api,
  type Client,
  type ServiceRecord,
  type Invoice,
  type Certificate,
} from "@/lib/api";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import {
  ArrowLeft, Building2, Mail, Phone, MapPin,
  CheckCircle2, Download, Plus, Receipt, CalendarDays, ShieldCheck,
} from "lucide-react";

type Tab = "services" | "invoices" | "certificates";

function ClientDetail() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id") ?? "";
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [tab, setTab] = useState<Tab>("services");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [completeTarget, setCompleteTarget] = useState<ServiceRecord | null>(null);
  const [completeForm, setCompleteForm] = useState({ certificateUrl: "", invoiceDescription: "" });
  const [contractModal, setContractModal] = useState(false);
  const [contractForm, setContractForm] = useState({
    type: "DEDETIZACAO" as "DEDETIZACAO" | "COLETA_RESIDUOS",
    startDate: "", cost: "",
  });

  useEffect(() => {
    if (!id) { router.replace("/admin/clients"); return; }
    Promise.all([
      api.clients.get(id),
      api.services.list(id),
      api.invoices.list(id),
      api.certificates.list(id),
    ])
      .then(([c, s, inv, cert]) => {
        setClient(c); setServices(s); setInvoices(inv); setCerts(cert);
      })
      .catch(() => router.replace("/admin/clients"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!completeTarget) return;
    setSaving(true);
    try {
      const { service, invoice } = await api.services.complete(id, completeTarget.serviceId, completeForm);
      setServices(prev => prev.map(s => s.serviceId === service.serviceId ? service : s));
      setInvoices(prev => [invoice, ...prev]);
      if (service.certificateRef) setCerts(await api.certificates.list(id));
      setCompleteTarget(null);
      setCompleteForm({ certificateUrl: "", invoiceDescription: "" });
    } finally { setSaving(false); }
  }

  async function handleContract(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.services.createContract({
        tenantId: id, type: contractForm.type,
        startDate: contractForm.startDate, cost: parseFloat(contractForm.cost),
      });
      setServices(prev => [...prev, ...created]);
      setContractModal(false);
      setContractForm({ type: "DEDETIZACAO", startDate: "", cost: "" });
    } finally { setSaving(false); }
  }

  async function handlePayInvoice(invoice: Invoice) {
    const updated = await api.invoices.pay(id, invoice.invoiceId);
    setInvoices(prev => prev.map(i => i.invoiceId === updated.invoiceId ? updated : i));
  }

  async function toggleStatus() {
    if (!client) return;
    const updated = await api.clients.update(id, {
      status: client.status === "active" ? "suspended" : "active",
    });
    setClient(updated);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-60 text-gray-400 text-sm animate-pulse">
      Carregando cliente...
    </div>
  );
  if (!client) return null;

  const pendingRevenue = invoices.filter(i => i.status === "PENDING").reduce((s, i) => s + i.amount, 0);
  const totalRevenue = invoices.reduce((s, i) => s + i.amount, 0);
  const upcomingCount = services.filter(s => s.status === "SCHEDULED").length;

  const TABS: { key: Tab; label: string; icon: typeof CalendarDays; count: number }[] = [
    { key: "services", label: "Serviços", icon: CalendarDays, count: services.length },
    { key: "invoices", label: "Faturas", icon: Receipt, count: invoices.length },
    { key: "certificates", label: "Certificados", icon: ShieldCheck, count: certs.length },
  ];

  return (
    <div>
      <Link href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft size={15} /> Todos os clientes
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Building2 className="text-green-700" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{client.companyName}</h1>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{client.tenantId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge value={client.status} />
            <button onClick={toggleStatus}
              className="text-xs border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg text-gray-600 transition-colors">
              {client.status === "active" ? "Suspender" : "Reativar"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Mail size={14} /><span className="truncate">{client.contactEmail}</span></div>
          <div className="flex items-center gap-2 text-sm text-gray-500"><Phone size={14} /><span>{client.contactPhone || "—"}</span></div>
          <div className="flex items-center gap-2 text-sm text-gray-500"><MapPin size={14} /><span>{client.address.city}/{client.address.state}</span></div>
          <div className="text-sm text-gray-500">CNPJ: <span className="text-gray-700">{client.taxId}</span></div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Agendados", value: upcomingCount.toString(), color: "text-blue-600" },
          { label: "Total faturado", value: `R$ ${totalRevenue.toFixed(2)}`, color: "text-green-600" },
          { label: "A receber", value: `R$ ${pendingRevenue.toFixed(2)}`, color: "text-orange-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-2 pt-2">
          <div className="flex">
            {TABS.map(({ key, label, icon: Icon, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${tab === key ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                <Icon size={15} /> {label}
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === key ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
          {tab === "services" && (
            <button onClick={() => setContractModal(true)}
              className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg mr-2 transition-colors">
              <Plus size={13} /> Novo Contrato
            </button>
          )}
        </div>

        {tab === "services" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Data</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-center">Cert.</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...services].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)).map(s => (
                <tr key={s.serviceId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3"><Badge value={s.type} /></td>
                  <td className="px-6 py-3 text-gray-600">{s.scheduledDate}</td>
                  <td className="px-6 py-3"><Badge value={s.status} /></td>
                  <td className="px-6 py-3 text-right text-gray-700 font-medium">R$ {s.cost.toFixed(2)}</td>
                  <td className="px-6 py-3 text-center text-xs">
                    {s.certificateRef ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {s.status !== "COMPLETED" && s.status !== "CANCELLED" && (
                      <button onClick={() => setCompleteTarget(s)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:underline ml-auto">
                        <CheckCircle2 size={13} /> Concluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Crie um contrato para começar.</td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "invoices" && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Descrição</th>
                <th className="px-6 py-3 text-left">Vencimento</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map(i => (
                <tr key={i.invoiceId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 text-gray-800">{i.description}</td>
                  <td className="px-6 py-3 text-gray-500">{i.dueDate}</td>
                  <td className="px-6 py-3"><Badge value={i.status} /></td>
                  <td className="px-6 py-3 text-right font-medium">R$ {i.amount.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right">
                    {i.status === "PENDING" && (
                      <button onClick={() => handlePayInvoice(i)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:underline ml-auto">
                        <CheckCircle2 size={13} /> Pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Nenhuma fatura</td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "certificates" && (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certs.map(c => (
              <div key={c.certId} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge value={c.type} />
                  <a href={c.fileUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Download size={13} /> PDF
                  </a>
                </div>
                <p className="text-xs text-gray-500">Emissão: <span className="text-gray-700">{c.issuedDate}</span></p>
                {c.expiresAt && <p className="text-xs text-gray-500">Validade: <span className="text-gray-700">{c.expiresAt}</span></p>}
                <p className="text-xs font-mono text-gray-300 mt-2 truncate">{c.certId}</p>
              </div>
            ))}
            {certs.length === 0 && (
              <p className="col-span-3 py-10 text-center text-gray-400 text-sm">Nenhum certificado emitido ainda.</p>
            )}
          </div>
        )}
      </div>

      {completeTarget && (
        <Modal title="Concluir Serviço" onClose={() => setCompleteTarget(null)}>
          <div className="flex items-center gap-2 mb-4">
            <Badge value={completeTarget.type} />
            <span className="text-sm text-gray-500">{completeTarget.scheduledDate}</span>
          </div>
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">URL do Certificado (PDF)</label>
              <input type="url" value={completeForm.certificateUrl}
                onChange={e => setCompleteForm(f => ({ ...f, certificateUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descrição da Fatura</label>
              <input value={completeForm.invoiceDescription}
                onChange={e => setCompleteForm(f => ({ ...f, invoiceDescription: e.target.value }))}
                placeholder={`${completeTarget.type} — ${completeTarget.scheduledDate}`}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setCompleteTarget(null)} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {saving ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {contractModal && (
        <Modal title="Novo Contrato Recorrente" onClose={() => setContractModal(false)}>
          <form onSubmit={handleContract} className="space-y-4">
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
                <label className="block text-xs text-gray-500 mb-1">Valor (R$) *</label>
                <input required type="number" min="0" step="0.01" value={contractForm.cost}
                  onChange={e => setContractForm(f => ({ ...f, cost: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setContractModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {saving ? "Gerando..." : "Criar Contrato"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-60 text-gray-400 text-sm">Carregando...</div>}>
      <ClientDetail />
    </Suspense>
  );
}
