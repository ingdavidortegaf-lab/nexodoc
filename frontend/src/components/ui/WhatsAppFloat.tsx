"use client";

import { usePathname } from "next/navigation";
import { UiIcon } from "@/components/icons/UiIcon";

/** Botón flotante de WhatsApp. Sólo aparece si NEXT_PUBLIC_WHATSAPP_NUMBER está configurado. */
export function WhatsAppFloat({ href }: { href: string }) {
  const pathname = usePathname();
  // En el carrito la barra inferior de pago ocupa ese espacio
  if (!href || pathname.startsWith("/pago") || pathname.startsWith("/admin") || pathname.startsWith("/carrito")) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_-10px_rgb(16_36_58/0.55)] transition-transform duration-300 ease-out-expo hover:scale-105 md:bottom-7 md:right-7"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <UiIcon name="whatsapp" className="h-7 w-7" />
    </a>
  );
}
