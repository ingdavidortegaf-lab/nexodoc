import { NextResponse } from "next/server";
import { backend, notConfigured, unreachable } from "@/lib/backend";
import { ACCESS, cookieFrom, readCookie, refreshSession, rewriteCookies } from "@/lib/adminProxy";
import { siteConfig } from "@/lib/site";

type Ctx = { params: Promise<{ path: string[] }> };

/** Rutas del API administrativo que el panel puede usar (lista cerrada). */
const ALLOWED = [
  /^orders$/,
  /^orders\/ND-\d{4}-\d{6}$/,
  /^requests\/ND-\d{4}-\d{6}-\d{2}\/(status|quote|files)$/,
  /^files\/[0-9a-f-]{36}\/download$/,
  /^me$/,
  /^audit$/,
];

async function proxy(req: Request, { params }: Ctx) {
  if (!siteConfig.apiUrl) return notConfigured();
  const path = (await params).path.join("/");
  if (!ALLOWED.some((r) => r.test(path))) return NextResponse.json({ detail: "Ruta no permitida" }, { status: 404 });

  const search = new URL(req.url).search;
  const body = req.method === "GET" ? undefined : await req.arrayBuffer();
  const contentType = req.headers.get("content-type");
  const call = (access: string | undefined) =>
    backend(`/v1/admin/${path}${search}`, req, {
      method: req.method,
      body,
      headers: { ...(contentType ? { "Content-Type": contentType } : {}), ...(access ? { Cookie: `${ACCESS}=${access}` } : {}) },
    });

  try {
    let res = await call(readCookie(req, ACCESS));
    let refreshed: Response | null = null;
    if (res.status === 401) {
      // Sesión vencida: renueva con la cookie de refresco y reintenta una vez
      refreshed = await refreshSession(req);
      if (refreshed) res = await call(cookieFrom(refreshed, ACCESS));
    }
    const out = NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
    return refreshed ? rewriteCookies(refreshed, out) : out;
  } catch {
    return unreachable();
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH };
