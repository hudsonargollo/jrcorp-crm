"use client";
import { useEffect, useState } from "react";
import { api, type Client } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { Plus, Search } from "lucide-react";

type Form = Omit<Client, "tenantId" | "status" | "createdAt">;
const EMPTY: Form = {
  companyName: "",
  taxId: "",
  contactEmail: "",
  contactPhone: "",
  address: { street: "", city: "", state: "" },
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.clients.list().then(setClients);
  }, []);

  const filtered = clients.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.taxId.includes(search)
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.clients.create(form);
      setClients(prev => [created, ...prev]);
      setModal(false);
      setForm(EMPTY);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(client: Client) {
    const updated = await api.clients.update(client.tenantId, {
      status: client.status === "active" ? "suspended" : "active",
    });
    setClients(prev => prev.map(c => c.tenantId === updated.tenantId ? updated : c));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou CNPJ..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Empresa</th>
              <th className="px-6 py-3 text-left">CNPJ</th>
              <th className="px-6 py-3 text-left">Cidade</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => (
              <tr key={c.tenantId} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 font-medium text-gray-900">{c.companyName}</td>
                <td className="px-6 py-3 text-gray-500">{c.taxId}</td>
                <td className="px-6 py-3 text-gray-500">{c.address.city}/{c.address.state}</td>
                <td className="px-6 py-3 text-gray-500">{c.contactEmail}</td>
                <td className="px-6 py-3"><Badge value={c.status} /></td>
                <td className="px-6 py-3">
                  <button
                    onClick={() => toggleStatus(c)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {c.status === "active" ? "Suspender" : "Reativar"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  Nenhum cliente encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Novo Cliente" onClose={() => setModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Razão Social *</label>
                <input
                  required value={form.companyName}
                  onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">CNPJ *</label>
                <input
                  required value={form.taxId}
                  onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                <input
                  value={form.contactPhone}
                  onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Email *</label>
                <input
                  required type="email" value={form.contactEmail}
                  onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Endereço</label>
                <input
                  value={form.address.street}
                  onChange={e => setForm(f => ({ ...f, address: { ...f.address, street: e.target.value } }))}
                  placeholder="Rua / Av., número"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                <input
                  value={form.address.city}
                  onChange={e => setForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Estado (UF)</label>
                <input
                  value={form.address.state}
                  onChange={e => setForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))}
                  maxLength={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancelar
              </button>
              <button
                type="submit" disabled={saving}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "Salvando..." : "Criar Cliente"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
