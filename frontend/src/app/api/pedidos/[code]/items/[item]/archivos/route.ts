import { NextResponse } from "next/server";
import { backend, notConfigured, relay, unreachable } from "@/lib/backend";
import { siteConfig } from "@/lib/site";

type Ctx = { params: Promise<{ code: string; item: string }> };

/**
 * Carga de soportes a través del BFF. Se usa cuando NEXT_PUBLIC_API_URL no está
 * definida. En Vercel el cuerpo de una función está limitado (≈4,5 MB): para
 * archivos grandes define NEXT_PUBLIC_API_URL y el navegador sube directo a la API.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { code, item } = await params;
  if (!/^ND-\d{4}-\d{6}$/.test(code) || !/^ND-\d{4}-\d{6}-\d{2}$/.test(item)) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }
  if (!siteConfig.apiUrl) return notConfigured();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "validation", detail: "Falta el archivo" }, { status: 422 });
  const out = new FormData();
  out.append("file", file, file.name);
  try {
    const res = await backend(`/v1/orders/${code}/items/${item}/files`, req, {
      method: "POST",
      body: out,
      headers: { Authorization: req.headers.get("authorization") ?? "" },
    });
    return relay(res);
  } catch {
    return unreachable();
  }
}
