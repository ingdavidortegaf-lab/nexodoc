import { NextResponse } from "next/server";
import { backend, notConfigured, relay, unreachable } from "@/lib/backend";
import { siteConfig } from "@/lib/site";

/** Concilia la transacción con la que Wompi devuelve al cliente (?id=…). */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[A-Za-z0-9-]{5,64}$/.test(id)) return NextResponse.json({ error: "validation" }, { status: 422 });
  if (!siteConfig.apiUrl) return notConfigured();
  try {
    return relay(await backend(`/v1/payments/wompi/transactions/${id}`, req, { method: "GET" }));
  } catch {
    return unreachable();
  }
}
