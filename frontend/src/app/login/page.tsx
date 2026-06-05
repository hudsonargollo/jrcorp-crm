"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { Leaf } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"email" | "id">("email");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = mode === "email" ? { email: value } : { tenantId: value };
      const { tenantId, token } = await api.auth.login(body);
      auth.save(tenantId, token);
      router.push("/client");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <Link href="/" className="flex items-center gap-2 mb-8 text-gray-700">
        <Leaf className="text-green-600" size={22} />
        <span className="font-bold text-xl">JR-CORP</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        <h1 className="text-lg font-bold text-gray-900 mb-6">Entrar no Portal</h1>

        <div className="flex rounded-xl border border-gray-200 p-1 mb-6 gap-1">
          {(["email", "id"] as const).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${mode === m ? "bg-green-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
              {m === "email" ? "E-mail" : "ID do Cliente"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {mode === "email" ? "E-mail cadastrado" : "ID do Cliente (cli_...)"}
            </label>
            <input
              required
              value={value}
              onChange={e => setValue(e.target.value)}
              type={mode === "email" ? "email" : "text"}
              placeholder={mode === "email" ? "email@empresa.com" : "cli_..."}
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          Não tem conta?{" "}
          <Link href="/register" className="text-green-600 hover:underline">Cadastrar empresa</Link>
        </p>
      </div>
    </div>
  );
}
