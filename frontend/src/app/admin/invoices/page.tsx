"use client";
import { useEffect, useState } from "react";
import { api, type Invoice, type Client } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { CheckCircle2 } from "lucide-react";

export default function InvoicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedClient, setSelectedClient] = useState("");

  useEffect(() => {
    api.clients.list().then(setClients);
  }, []);

  useEffect(() => {
    if (selectedClient) api.invoices.list(selectedClient).then(setInvoices);
  }, [selectedClient]);

  async function handlePay(invoice: Invoice) {
    const updated = await api.invoices.pay(invoice.tenantId, invoice.invoiceId);
    setInvoices(prev => prev.map(i => i.invoiceId === updated.invoiceId ? updated : i));
  }

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter(i => i.status === "PENDING").reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Faturas</h1>

      <div className="mb-5">
        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Selecionar cliente...</option>
          {clients.map(c => <option key={c.tenantId} value={c.tenantId}>{c.companyName}</option>)}
        </select>
      </div>

      {selectedClient && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500">Total Faturado</p>
            <p className="text-2xl font-bold text-gray-900">R$ {total.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500">A Receber</p>
            <p className="text-2xl font-bold text-orange-600">R$ {pending.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Descrição</th>
              <th className="px-6 py-3 text-left">Vencimento</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Valor</th>
              <th className="px-6 py-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map(i => (
              <tr key={i.invoiceId} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 text-gray-800">{i.description}</td>
                <td className="px-6 py-3 text-gray-500">{i.dueDate}</td>
                <td className="px-6 py-3"><Badge value={i.status} /></td>
                <td className="px-6 py-3 text-right font-medium text-gray-800">R$ {i.amount.toFixed(2)}</td>
                <td className="px-6 py-3">
                  {i.status === "PENDING" && (
                    <button onClick={() => handlePay(i)}
                      className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                      <CheckCircle2 size={14} /> Marcar Pago
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  {selectedClient ? "Nenhuma fatura encontrada" : "Selecione um cliente"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
