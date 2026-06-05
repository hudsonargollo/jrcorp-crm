"use client";
import { useEffect, useState } from "react";
import { api, type Certificate, type Client } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { Upload, Download } from "lucide-react";

export default function CertificatesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tenantId: "", serviceId: "", fileUrl: "", expiresAt: "" });

  useEffect(() => {
    api.clients.list().then(setClients);
  }, []);

  useEffect(() => {
    if (selectedClient) api.certificates.list(selectedClient).then(setCerts);
  }, [selectedClient]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const cert = await api.certificates.upload(form);
      setCerts(prev => [cert, ...prev]);
      setModal(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificados</h1>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          <Upload size={16} /> Upload Certificado
        </button>
      </div>

      <div className="mb-5">
        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Selecionar cliente...</option>
          {clients.map(c => (
            <option key={c.tenantId} value={c.tenantId}>{c.companyName}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Tipo</th>
              <th className="px-6 py-3 text-left">Emissão</th>
              <th className="px-6 py-3 text-left">Validade</th>
              <th className="px-6 py-3 text-left">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {certs.map(c => (
              <tr key={c.certId} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 font-mono text-xs text-gray-500">{c.certId}</td>
                <td className="px-6 py-3"><Badge value={c.type} /></td>
                <td className="px-6 py-3 text-gray-600">{c.issuedDate}</td>
                <td className="px-6 py-3 text-gray-500">{c.expiresAt ?? "—"}</td>
                <td className="px-6 py-3">
                  <a href={c.fileUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline text-xs">
                    <Download size={14} /> Baixar
                  </a>
                </td>
              </tr>
            ))}
            {certs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  {selectedClient ? "Nenhum certificado encontrado" : "Selecione um cliente"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Upload de Certificado" onClose={() => setModal(false)}>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cliente *</label>
              <select required value={form.tenantId}
                onChange={e => setForm(f => ({ ...f, tenantId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Selecione...</option>
                {clients.map(c => <option key={c.tenantId} value={c.tenantId}>{c.companyName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ID do Serviço *</label>
              <input required value={form.serviceId}
                onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
                placeholder="srv_..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">URL do Arquivo *</label>
              <input required type="url" value={form.fileUrl}
                onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data de Validade</label>
              <input type="date" value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {saving ? "Enviando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
