import { NextResponse } from "next/server";
import { backend, notConfigured, relay, unreachable } from "@/lib/backend";
import { siteConfig } from "@/lib/site";
import { orderSchema, PRIVACY_POLICY_VERSION } from "@/lib/validation";

/** Crea el pedido del carrito: valida en servidor y lo reenvía al backend. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  }
  const { website, ...data } = parsed.data;
  if (website) {
    // Honeypot: respuesta neutra, sin guardar nada, para no dar pistas a los bots.
    return NextResponse.json({ code: "ND-0000-000000", upload_token: "", items: [], payment: { required: false, amount: 0, enabled: false } }, { status: 201 });
  }
  if (!siteConfig.apiUrl) return notConfigured();
  try {
    const res = await backend("/v1/orders", req, {
      method: "POST",
      json: { ...data, shipping: data.shipping ?? null, policyVersion: PRIVACY_POLICY_VERSION, source: "web" },
    });
    return relay(res);
  } catch {
    return unreachable();
  }
}
