"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Client, type ServiceRecord } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { Users, CalendarDays, CheckCircle, Clock, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.clients.list(), api.services.all()])
      .then(([cls, svcs]) => {
        setClients(cls);
        setServices(svcs);
        setClientMap(Object.fromEntries(cls.map(c => [c.tenantId, c.companyName])));
      })
      .finally(() => setLoading(false));
  }, []);

  const activeClients = clients.filter(c => c.status === "active").length;
  const scheduled = services.filter(s => s.status === "SCHEDULED").length;
  const completed = services.filter(s => s.status === "COMPLETED").length;

  // Upcoming in the next 30 days
  const today = new Date().toISOString().split("T")[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const upcoming = services
    .filter(s => s.status === "SCHEDULED" && s.scheduledDate >= today && s.scheduledDate <= in30)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const stats = [
    { label: "Clientes Ativos", value: activeClients, icon: Users, color: "bg-blue-50 text-blue-600", href: "/admin/clients" },
    { label: "Próximos 30 dias", value: upcoming.length, icon: Clock, color: "bg-yellow-50 text-yellow-600", href: "/admin/schedule" },
    { label: "Agendados (total)", value: scheduled, icon: CalendarDays, color: "bg-purple-50 text-purple-600", href: "/admin/schedule" },
    { label: "Concluídos", value: completed, icon: CheckCircle, color: "bg-green-50 text-green-600", href: "/admin/schedule" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <span className="text-xs text-gray-400">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:border-gray-200 transition-colors group">
            <div className={`p-3 rounded-xl ${color} shrink-0`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? "—" : value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming services */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">Próximos 30 dias</h2>
            <Link href="/admin/schedule" className="flex items-center gap-1 text-xs text-green-600 hover:underline">
              Ver agenda <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcoming.slice(0, 8).map(s => (
              <div key={s.serviceId} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 text-center shrink-0">
                    <p className="text-xs text-gray-400 leading-none">
                      {new Date(s.scheduledDate + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" }).toUpperCase()}
                    </p>
                    <p className="text-lg font-bold text-gray-900 leading-tight">
                      {new Date(s.scheduledDate + "T12:00:00").getDate()}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {clientMap[s.tenantId] ?? s.tenantId}
                    </p>
                    <Badge value={s.type} />
                  </div>
                </div>
                <span className="text-sm text-gray-600 font-medium shrink-0 ml-2">
                  R$ {s.cost.toFixed(2)}
                </span>
              </div>
            ))}
            {!loading && upcoming.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-gray-400">
                Nenhum serviço nos próximos 30 dias
              </p>
            )}
          </div>
        </div>

        {/* Recent clients */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-800">Clientes Recentes</h2>
            <Link href="/admin/clients" className="flex items-center gap-1 text-xs text-green-600 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {[...clients]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 8)
              .map(c => (
                <Link key={c.tenantId} href={`/admin/clients/detail?id=${c.tenantId}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.companyName}</p>
                    <p className="text-xs text-gray-400">{c.address.city}/{c.address.state} · {c.taxId}</p>
                  </div>
                  <Badge value={c.status} />
                </Link>
              ))}
            {!loading && clients.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-gray-400">
                Nenhum cliente cadastrado ainda
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
