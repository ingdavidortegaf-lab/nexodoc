import { redirect } from "next/navigation";

/** Enlaces antiguos del portal de clientes: llevan a la consulta del pedido. */
export default function PortalLoginPage() {
  redirect("/estado");
}
