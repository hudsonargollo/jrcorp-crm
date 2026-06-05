"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Invoice, type Client } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { CheckCircle2, ExternalLink, Search } from "lucide-react";

export default function InvoicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [selectedClient, setSelectedClient] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.clients.list().then(async cls => {
      setClients(cls);
      setClientMap(Object.fromEntries(cls.map(c => [c.tenantId, c.companyName])));
      // Load all invoices across all clients at once
      const all = await Promise.all(cls.map(c => api.invoices.list(c.tenantId)));
      setAllInvoices(all.flat());
      setLoading(false);
    });
  }, []);

  const displayed = allInvoices
    .filter(i => !selectedClient || i.tenantId === selectedClient)
    .filter(i => {
      if (!search) return true;
      const name = (clientMap[i.tenantId] ?? "").toLowerCase();
      return name.includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = displayed.reduce((s, i) => s + i.amount, 0);
  const pending = displayed.filter(i => i.status === "PENDING").reduce((s, i) => s + i.amount, 0);
  const paid = displayed.filter(i => i.status === "PAID").reduce((s, i) => s + i.amount, 0);

  async function handlePay(invoice: Invoice) {
    const updated = await api.invoices.pay(invoice.tenantId, invoice.invoiceId);
    setAllInvoices(prev => prev.map(i => i.invoiceId === updated.invoiceId ? updated : i));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Faturas</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente ou descrição..."
            className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-60" />
        </div>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Todos os clientes</option>
          {clients.map(c => <option key={c.tenantId} value={c.tenantId}>{c.companyName}</option>)}
        </select>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: `R$ ${total.toFixed(2)}`, color: "text-gray-900" },
          { label: "A receber", value: `R$ ${pending.toFixed(2)}`, color: "text-orange-600" },
          { label: "Recebido", value: `R$ ${paid.toFixed(2)}`, color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{loading ? "—" : value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Cliente</th>
              <th className="px-6 py-3 text-left">Descrição</th>
              <th className="px-6 py-3 text-left">Vencimento</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Valor</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayed.map(i => (
              <tr key={i.invoiceId} className="hover:bg-gray-50/50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-800">
                      {clientMap[i.tenantId] ?? i.tenantId}
                    </span>
                    <Link href={`/admin/clients/detail?id=${i.tenantId}`}
                      className="text-gray-300 hover:text-gray-500">
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-3 text-gray-600 max-w-xs truncate">{i.description}</td>
                <td className="px-6 py-3 text-gray-500">{i.dueDate}</td>
                <td className="px-6 py-3"><Badge value={i.status} /></td>
                <td className="px-6 py-3 text-right font-medium text-gray-800">
                  R$ {i.amount.toFixed(2)}
                </td>
                <td className="px-6 py-3 text-right">
                  {i.status === "PENDING" && (
                    <button onClick={() => handlePay(i)}
                      className="flex items-center gap-1 text-xs text-green-600 hover:underline ml-auto">
                      <CheckCircle2 size={13} /> Pago
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && displayed.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                Nenhuma fatura encontrada
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
