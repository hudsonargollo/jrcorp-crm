import { Sidebar } from "@/components/Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="client" />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
