import Link from "next/link";
import { Leaf, Shield, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="flex items-center gap-3 mb-6">
        <Leaf size={40} className="text-green-400" />
        <h1 className="text-5xl font-bold tracking-tight">JR-CORP</h1>
      </div>
      <p className="text-gray-400 text-lg mb-10 text-center max-w-md">
        Plataforma integrada de gestão de serviços ambientais e sanitários
      </p>
      <div className="flex gap-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <Shield size={18} />
          Painel Admin
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/client"
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Portal do Cliente
          <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}
