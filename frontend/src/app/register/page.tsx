"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { Leaf, CheckCircle2 } from "lucide-react";

type Step = 1 | 2 | 3;

interface FormData {
  companyName: string;
  taxId: string;
  contactEmail: string;
  contactPhone: string;
  street: string;
  city: string;
  state: string;
}

const EMPTY: FormData = {
  companyName: "",
  taxId: "",
  contactEmail: "",
  contactPhone: "",
  street: "",
  city: "",
  state: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 2) { setStep((step + 1) as Step); return; }
    setSaving(true);
    setError("");
    try {
      const { client, token } = await api.auth.register({
        companyName: form.companyName,
        taxId: form.taxId,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        address: { street: form.street, city: form.city, state: form.state },
      });
      auth.save(client.tenantId, token);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setSaving(false);
    }
  }

  const stepLabels = ["Empresa", "Endereço", "Confirmação"];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <Link href="/" className="flex items-center gap-2 mb-8 text-gray-700">
        <Leaf className="text-green-600" size={22} />
        <span className="font-bold text-xl">JR-CORP</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">

        {/* Step indicators */}
        {step < 3 && (
          <div className="flex items-center justify-between mb-8">
            {stepLabels.slice(0, 2).map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${step === i + 1 ? "bg-green-600 text-white" : step > i + 1 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${step === i + 1 ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                  {label}
                </span>
                {i < 1 && <div className="w-12 h-px bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        )}

        {/* Success screen */}
        {step === 3 ? (
          <div className="text-center py-4">
            <CheckCircle2 size={52} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cadastro realizado!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Sua conta foi criada com sucesso. Acesse o portal do cliente para acompanhar seus serviços.
            </p>
            <button
              onClick={() => router.push("/client")}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Acessar Portal
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              {step === 1 ? "Dados da Empresa" : "Endereço Comercial"}
            </h1>

            {step === 1 && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Razão Social *</label>
                  <input required value={form.companyName} onChange={set("companyName")}
                    placeholder="Empresa Ltda."
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CNPJ *</label>
                  <input required value={form.taxId} onChange={set("taxId")}
                    placeholder="00.000.000/0001-00"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">E-mail *</label>
                  <input required type="email" value={form.contactEmail} onChange={set("contactEmail")}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                  <input value={form.contactPhone} onChange={set("contactPhone")}
                    placeholder="(00) 00000-0000"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Logradouro</label>
                  <input value={form.street} onChange={set("street")}
                    placeholder="Rua / Avenida, número"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                    <input value={form.city} onChange={set("city")}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">UF</label>
                    <input value={form.state} onChange={set("state")} maxLength={2}
                      placeholder="BA"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <div className="flex gap-3 pt-1">
              {step > 1 && (
                <button type="button" onClick={() => setStep((step - 1) as Step)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Voltar
                </button>
              )}
              <button type="submit" disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                {saving ? "Criando conta..." : step === 2 ? "Criar Conta" : "Próximo"}
              </button>
            </div>
          </form>
        )}

        {step < 3 && (
          <p className="text-center text-xs text-gray-400 mt-5">
            Já tem conta?{" "}
            <Link href="/login" className="text-green-600 hover:underline">Entrar</Link>
          </p>
        )}
      </div>
    </div>
  );
}
