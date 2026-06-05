"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type ServiceRecord } from "@/lib/api";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/Badge";

export default function ClientServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceRecord[]>([]);

  useEffect(() => {
    if (!auth.isAuthenticated()) { router.replace("/login"); return; }
    api.services.list(auth.tenantId()).then(setServices);
  }, [router]);

  const sorted = [...services].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Serviços</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Tipo</th>
              <th className="px-6 py-3 text-left">Data</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Valor</th>
              <th className="px-6 py-3 text-left">Certificado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(s => (
              <tr key={s.serviceId} className="hover:bg-gray-50/50">
                <td className="px-6 py-3"><Badge value={s.type} /></td>
                <td className="px-6 py-3 text-gray-600">{s.scheduledDate}</td>
                <td className="px-6 py-3"><Badge value={s.status} /></td>
                <td className="px-6 py-3 text-right text-gray-700">R$ {s.cost.toFixed(2)}</td>
                <td className="px-6 py-3 text-xs">
                  {s.certificateRef
                    ? <span className="text-green-600 font-medium">✓ Disponível</span>
                    : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Nenhum serviço agendado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
