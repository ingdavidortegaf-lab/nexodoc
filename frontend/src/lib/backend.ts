import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site";

/**
 * Llamadas del BFF (route handlers) al backend FastAPI.
 * Envía la IP real del cliente firmada con NEXODOC_PROXY_SECRET, para que el
 * backend la registre como prueba del consentimiento y aplique límites por IP.
 */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0] || h.get("cf-connecting-ip") || "").trim();
}

export async function backend(path: string, req: Request, init: RequestInit & { json?: unknown } = {}) {
  const { json, headers, ...rest } = init;
  return fetch(`${siteConfig.apiUrl}${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      "User-Agent": req.headers.get("user-agent") ?? "",
      "X-Nexodoc-Proxy-Secret": process.env.NEXODOC_PROXY_SECRET ?? "",
      "X-Nexodoc-Client-IP": clientIp(req),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
}

/** Reenvía la respuesta del backend conservando el estado y el mensaje de error. */
export async function relay(res: Response) {
  const body = await res.json().catch(() => ({}));
  return NextResponse.json(body, { status: res.status });
}

export const notConfigured = () => NextResponse.json({ error: "not_configured" }, { status: 503 });
export const unreachable = () => NextResponse.json({ error: "unreachable", detail: "No pudimos conectar con el sistema de pedidos." }, { status: 502 });
