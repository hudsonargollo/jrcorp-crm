"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { CheckCircle2, Send } from "lucide-react";

export default function RequestServicePage() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.isAuthenticated()) router.replace("/login");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.services.requestOnDemand({ tenantId: auth.tenantId(), scheduledDate: date });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar serviço");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <CheckCircle2 size={48} className="text-green-500" />
        <h2 className="text-xl font-semibold text-gray-800">Solicitação Enviada!</h2>
        <p className="text-gray-500 text-sm">Nossa equipe entrará em contato para confirmar.</p>
        <button onClick={() => { setDone(false); setDate(""); setNotes(""); }}
          className="mt-2 text-green-600 hover:underline text-sm">
          Nova Solicitação
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitar Higienização</h1>
      <p className="text-sm text-gray-500 mb-8">
        Serviço sob demanda — escolha a data desejada e envie sua solicitação.
      </p>

      <div className="max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Desejada *</label>
            <input
              required type="date" value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Descreva o local, área ou necessidades especiais..."
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors">
            <Send size={16} />
            {saving ? "Enviando..." : "Solicitar Serviço"}
          </button>
        </form>
      </div>
    </div>
  );
}
