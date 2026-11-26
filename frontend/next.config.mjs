/**
 * Cabeceras de seguridad aplicadas a todas las rutas.
 * Si agregas analítica u otra integración, amplía la CSP con sus dominios.
 * El pago con Wompi es una redirección completa a checkout.wompi.co, así que no
 * necesita permisos de script ni de iframe.
 */
const apiOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : "";
  } catch {
    return "";
  }
})();

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Los soportes se suben directo a la API cuando NEXT_PUBLIC_API_URL está definida
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

/**
 * STATIC_EXPORT=1 genera una versión estática (vitrina) para GitHub Pages:
 * sin API ni panel; los pedidos se envían por WhatsApp/correo. BASE_PATH es la
 * subruta del sitio (p. ej. "/nexodoc" en usuario.github.io/nexodoc).
 * Las cabeceras de seguridad sólo aplican en el despliegue con servidor (Vercel).
 */
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = staticExport ? process.env.BASE_PATH ?? "" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: staticExport ? { unoptimized: true } : { formats: ["image/avif", "image/webp"] },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(staticExport && { output: "export", trailingSlash: true, basePath }),
  ...(staticExport ? {} : { headers: securityHeaders }),
};

async function securityHeaders() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
}

export default nextConfig;
