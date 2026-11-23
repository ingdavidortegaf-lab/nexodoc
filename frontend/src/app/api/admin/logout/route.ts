import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const out = NextResponse.redirect(new URL("/admin/ingresar", req.url), { status: 303 });
  out.cookies.set("nx_access", "", { path: "/", maxAge: 0, httpOnly: true });
  out.cookies.set("nx_refresh", "", { path: "/", maxAge: 0, httpOnly: true });
  return out;
}
