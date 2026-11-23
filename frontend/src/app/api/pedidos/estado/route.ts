import { NextResponse } from "next/server";
import { backend, notConfigured, relay, unreachable } from "@/lib/backend";
import { siteConfig } from "@/lib/site";
import { trackSchema } from "@/lib/validation";

/** Estado del pedido con número + correo. */
export async function POST(req: Request) {
  const parsed = trackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  if (!siteConfig.apiUrl) return notConfigured();
  try {
    return relay(await backend("/v1/track", req, { method: "POST", json: parsed.data }));
  } catch {
    return unreachable();
  }
}
