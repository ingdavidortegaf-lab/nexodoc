import { NextResponse } from "next/server";
import { backend, notConfigured, relay, unreachable } from "@/lib/backend";
import { siteConfig } from "@/lib/site";
import { checkoutSchema } from "@/lib/validation";

/** Crea el pago en Wompi (el backend calcula el monto) y devuelve la URL del checkout. */
export async function POST(req: Request) {
  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });
  if (!siteConfig.apiUrl) return notConfigured();
  try {
    return relay(await backend("/v1/payments/checkout", req, { method: "POST", json: parsed.data }));
  } catch {
    return unreachable();
  }
}
