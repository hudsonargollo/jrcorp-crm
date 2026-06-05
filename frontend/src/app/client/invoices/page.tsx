"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Invoice } from "@/lib/api";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import { Download } from "lucide-react";

export default function ClientInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!auth.isAuthenticated()) { router.replace("/login"); return; }
    api.invoices.list(auth.tenantId()).then(setInvoices);
  }, [router]);

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter(i => i.status === "PENDING").reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Financeiro</h1>

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Faturado</p>
          <p className="text-xl font-bold text-gray-900">R$ {total.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Pendente</p>
          <p className="text-xl font-bold text-orange-600">R$ {pending.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Descrição</th>
              <th className="px-6 py-3 text-left">Vencimento</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Valor</th>
              <th className="px-6 py-3 text-left">Fatura</th>
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
                  <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Download size={14} /> PDF
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Nenhuma fatura</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
