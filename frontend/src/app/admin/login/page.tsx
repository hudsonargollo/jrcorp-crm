"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { adminAuth } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@jrcorp.com");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token, email: confirmedEmail } = await api.admin.login({ email, password });
      adminAuth.save(confirmedEmail, token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
      <Link href="/" className="flex items-center gap-2 mb-10 text-white">
        <Leaf className="text-green-400" size={24} />
        <span className="font-bold text-2xl tracking-tight">JR-CORP</span>
      </Link>

      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm p-8 shadow-2xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-600/20 mb-6 mx-auto">
          <Lock className="text-green-400" size={22} />
        </div>
        <h1 className="text-xl font-bold text-white text-center mb-1">Painel Administrativo</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Acesso restrito à equipe JR-CORP</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
              <input
                required type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
              <input
                required
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-500 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors text-sm">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          <Link href="/" className="hover:text-gray-400 transition-colors">← Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}
