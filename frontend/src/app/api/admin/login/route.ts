import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";
import { rewriteCookies } from "@/lib/adminProxy";
import { siteConfig } from "@/lib/site";

/** Inicio de sesión del equipo (operadores y administradores). */
export async function POST(req: Request) {
  const back = (path: string) => NextResponse.redirect(new URL(path, req.url), { status: 303 });
  if (!siteConfig.apiUrl) return back("/admin/ingresar?error=config");
  const form = await req.formData();
  const res = await backend("/v1/auth/login", req, {
    method: "POST",
    json: { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") },
  }).catch(() => null);
  if (!res || !res.ok) return back(`/admin/ingresar?error=${res?.status === 429 ? "limite" : "1"}`);
  return rewriteCookies(res, back("/admin"));
}
