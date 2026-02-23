import { AdminProvider } from "@/components/admin/admin-provider";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 bg-muted/40">{children}</main>
      </div>
    </AdminProvider>
  );
}
