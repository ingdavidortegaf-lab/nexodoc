import { redirect } from "next/navigation";

/** El portal con contraseña se reemplazó por la consulta con número de pedido + correo. */
export default function PortalHome() {
  redirect("/estado");
}
