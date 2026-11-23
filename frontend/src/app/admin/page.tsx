import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminApp } from "@/components/admin/AdminApp";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Panel del equipo", description: "Gestión de pedidos", path: "/admin", noindex: true });

export default async function AdminPage() {
  const jar = await cookies();
  if (!jar.get("nx_access") && !jar.get("nx_refresh")) redirect("/admin/ingresar");
  return (
    <section className="min-h-screen bg-mist pt-[72px]">
      <AdminApp />
    </section>
  );
}
