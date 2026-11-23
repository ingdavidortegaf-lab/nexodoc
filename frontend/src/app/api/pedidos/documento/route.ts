import { NextResponse } from "next/server";
import { z } from "zod";
import { backend, notConfigured, relay, unreachable } from "@/lib/backend";
import { siteConfig } from "@/lib/site";
import { trackSchema } from "@/lib/validation";

const schema = trackSchema.extend({ id: z.string().uuid() });

/** Enlace de descarga (corta duración) del documento expedido. Exige número de pedido + correo. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });
  if (!siteConfig.apiUrl) return notConfigured();
  const { id, ...auth } = parsed.data;
  try {
    return relay(await backend(`/v1/track/documents/${id}`, req, { method: "POST", json: auth }));
  } catch {
    return unreachable();
  }
}
