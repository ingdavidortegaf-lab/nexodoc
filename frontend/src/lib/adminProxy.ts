import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";

/**
 * Cookies de sesión del panel. El backend fija la de renovación en la ruta
 * /v1/auth; como el navegador habla con el frontend, se reescribe a "/"
 * para que la página /admin y el proxy la reciban (httpOnly, SameSite=Lax).
 */
export const ACCESS = "nx_access";
export const REFRESH = "nx_refresh";

export function rewriteCookies(res: Response, out: NextResponse) {
  for (const c of res.headers.getSetCookie()) {
    out.headers.append("Set-Cookie", c.replace(/Path=\/v1\/auth/i, "Path=/"));
  }
  return out;
}

export function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

/** Valor nuevo de una cookie dentro de los Set-Cookie de una respuesta. */
export function cookieFrom(res: Response, name: string): string | undefined {
  for (const c of res.headers.getSetCookie()) {
    const m = c.match(new RegExp(`^${name}=([^;]*)`));
    if (m) return m[1];
  }
  return undefined;
}

export async function refreshSession(req: Request) {
  const refresh = readCookie(req, REFRESH);
  if (!refresh) return null;
  const res = await backend("/v1/auth/refresh", req, { method: "POST", headers: { Cookie: `${REFRESH}=${refresh}` } });
  return res.ok ? res : null;
}
