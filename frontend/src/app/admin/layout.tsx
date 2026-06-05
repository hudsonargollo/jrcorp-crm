"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { adminAuth } from "@/lib/admin-auth";
import { api } from "@/lib/api";
import { LogOut, ShieldCheck } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) { setReady(true); return; }

    if (!adminAuth.isAuthenticated()) {
      router.replace("/admin/login");
      return;
    }

    // Verify token is still valid
    api.admin.me()
      .then(({ email }) => { setAdminEmail(email); setReady(true); })
      .catch(() => {
        adminAuth.clear();
        router.replace("/admin/login");
      });
  }, [router, isLoginPage]);

  // Login page renders without the shell
  if (isLoginPage) return <>{children}</>;

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Verificando acesso...</div>
      </div>
    );
  }

  async function handleLogout() {
    await api.admin.logout().catch(() => {});
    adminAuth.clear();
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck size={14} className="text-green-600" />
            <span>Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{adminEmail}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={13} /> Sair
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
