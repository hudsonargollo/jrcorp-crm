"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type ServiceRecord, type Invoice, type Client } from "@/lib/api";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import { CalendarDays, Receipt, ShieldCheck, LogOut } from "lucide-react";

export default function ClientHome() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.replace("/login");
      return;
    }
    Promise.all([
      api.auth.me(),
      api.services.list(auth.tenantId()),
      api.invoices.list(auth.tenantId()),
    ])
      .then(([me, svcs, invs]) => {
        setClient(me);
        setServices(svcs);
        setInvoices(invs);
      })
      .catch(() => {
        auth.clear();
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Carregando...
      </div>
    );
  }

  if (!client) return null;

  const upcoming = services.filter(s => s.status === "SCHEDULED").length;
  const pendingAmount = invoices.filter(i => i.status === "PENDING").reduce((s, i) => s + i.amount, 0);
  const certCount = services.filter(s => s.certificateRef).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.companyName}</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{client.tenantId}</p>
        </div>
        <button
          onClick={() => { auth.clear(); router.push("/login"); }}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700"
        >
          <LogOut size={15} /> Sair
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><CalendarDays size={22} /></div>
          <div>
            <p className="text-xs text-gray-500">Próximos Serviços</p>
            <p className="text-2xl font-bold">{upcoming}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600"><Receipt size={22} /></div>
          <div>
            <p className="text-xs text-gray-500">A Pagar</p>
            <p className="text-2xl font-bold">R$ {pendingAmount.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-50 text-green-600"><ShieldCheck size={22} /></div>
          <div>
            <p className="text-xs text-gray-500">Certificados</p>
            <p className="text-2xl font-bold">{certCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Próximos Serviços</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Tipo</th>
              <th className="px-6 py-3 text-left">Data</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {services.slice(0, 5).map(s => (
              <tr key={s.serviceId}>
                <td className="px-6 py-3"><Badge value={s.type} /></td>
                <td className="px-6 py-3 text-gray-600">{s.scheduledDate}</td>
                <td className="px-6 py-3"><Badge value={s.status} /></td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400">Nenhum serviço agendado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
