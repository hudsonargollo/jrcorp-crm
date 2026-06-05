"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  ShieldCheck,
  Receipt,
  Leaf,
} from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clientes", icon: Users },
  { href: "/admin/schedule", label: "Agenda", icon: CalendarDays },
  { href: "/admin/certificates", label: "Certificados", icon: ShieldCheck },
  { href: "/admin/invoices", label: "Faturas", icon: Receipt },
];

const clientLinks = [
  { href: "/client", label: "Início", icon: LayoutDashboard },
  { href: "/client/services", label: "Meus Serviços", icon: CalendarDays },
  { href: "/client/request", label: "Solicitar Serviço", icon: FileText },
  { href: "/client/invoices", label: "Financeiro", icon: Receipt },
  { href: "/client/certificates", label: "Documentos", icon: ShieldCheck },
];

interface Props {
  role: "admin" | "client";
}

export function Sidebar({ role }: Props) {
  const pathname = usePathname();
  const links = role === "admin" ? adminLinks : clientLinks;

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-700">
        <Leaf className="text-brand-500" size={22} />
        <span className="font-bold text-lg tracking-tight">JR-CORP</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-brand-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-gray-700 text-xs text-gray-500">
        {role === "admin" ? "Painel Administrativo" : "Portal do Cliente"}
      </div>
    </aside>
  );
}
