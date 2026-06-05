"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Certificate } from "@/lib/api";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import { Download, ShieldCheck } from "lucide-react";

export default function ClientCertificatesPage() {
  const router = useRouter();
  const [certs, setCerts] = useState<Certificate[]>([]);

  useEffect(() => {
    if (!auth.isAuthenticated()) { router.replace("/login"); return; }
    api.certificates.list(auth.tenantId()).then(setCerts);
  }, [router]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="text-green-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Documentos & Certificados</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Cofre de conformidade — todos os certificados legais emitidos para sua empresa.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {certs.map(c => (
          <div key={c.certId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <Badge value={c.type} />
              <a href={c.fileUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <Download size={14} /> Baixar
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Emissão: <span className="text-gray-700">{c.issuedDate}</span>
            </p>
            {c.expiresAt && (
              <p className="text-xs text-gray-500">
                Validade: <span className="text-gray-700">{c.expiresAt}</span>
              </p>
            )}
            <p className="text-xs font-mono text-gray-300 mt-2 truncate">{c.certId}</p>
          </div>
        ))}
        {certs.length === 0 && (
          <div className="col-span-3 py-20 text-center text-gray-400">
            Nenhum certificado disponível ainda.
            <br />
            <span className="text-xs">Os certificados aparecem aqui após a conclusão dos serviços.</span>
          </div>
        )}
      </div>
    </div>
  );
}
