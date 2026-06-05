"use client";
import { useEffect, useState } from "react";
import { api, type Client, type ServiceRecord } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { Users, CalendarDays, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);

  useEffect(() => {
    api.clients.list().then(setClients).catch(console.error);
    api.services.all().then(setServices).catch(console.error);
  }, []);

  const upcoming = services.filter(s => s.status === "SCHEDULED").length;
  const completed = services.filter(s => s.status === "COMPLETED").length;
  const activeClients = clients.filter(c => c.status === "active").length;

  const stats = [
    { label: "Clientes Ativos", value: activeClients, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Serviços Agendados", value: upcoming, icon: CalendarDays, color: "text-yellow-600 bg-yellow-50" },
    { label: "Serviços Concluídos", value: completed, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Total de Serviços", value: services.length, icon: AlertCircle, color: "text-purple-600 bg-purple-50" },
  ];

  const recent = [...services]
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
    .slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Serviços Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Data</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map(s => (
                <tr key={s.serviceId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{s.tenantId}</td>
                  <td className="px-6 py-3"><Badge value={s.type} /></td>
                  <td className="px-6 py-3 text-gray-600">{s.scheduledDate}</td>
                  <td className="px-6 py-3"><Badge value={s.status} /></td>
                  <td className="px-6 py-3 text-right text-gray-700 font-medium">
                    R$ {s.cost.toFixed(2)}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    Nenhum serviço encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
