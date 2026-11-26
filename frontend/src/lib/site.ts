/**
 * Configuración del sitio. Los datos de contacto y legales vienen de
 * variables de entorno: nada se muestra si no está configurado, para no
 * publicar números o correos inventados.
 */
export const siteConfig = {
  name: "NEXODOC",
  tagline: "Conectamos personas, documentos y soluciones.",
  description:
    "Gestión documental, solicitud de certificados y trámites para personas y empresas en Colombia. Requisitos claros, cotización previa y seguimiento de cada solicitud.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "es_CO",
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
    /** Número en formato internacional sin "+", p. ej. 573001234567 */
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
    city: process.env.NEXT_PUBLIC_CONTACT_CITY ?? "Colombia",
  },
  legal: {
    companyName: process.env.NEXT_PUBLIC_LEGAL_NAME ?? "",
    taxId: process.env.NEXT_PUBLIC_LEGAL_NIT ?? "",
    address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "",
  },
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "",
  },
  /** URL del backend FastAPI. Si está vacía, el formulario no simula envíos. */
  apiUrl: process.env.NEXODOC_API_URL ?? "",
  /**
   * URL pública de la misma API, sólo para que el navegador suba los soportes
   * directamente (evita el límite de tamaño de las funciones del frontend).
   * Vacía = los archivos pasan por el BFF.
   */
  publicApiUrl: (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, ""),
};

/**
 * Ruta de un archivo de /public respetando la subruta del sitio (p. ej.
 * /nexodoc en GitHub Pages). Next no la agrega sola a <video>, <img> ni fetch.
 */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export const whatsappLink = (message = "Hola, quiero solicitar un documento con NEXODOC.") =>
  siteConfig.contact.whatsapp
    ? `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`
    : "";

export const mainNav = [
  { label: "Inicio", href: "/" },
  { label: "Solicitar", href: "/solicitar" },
  { label: "Servicios", href: "/servicios" },
  { label: "Empresas", href: "/#empresas" },
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Estado de tu pedido", href: "/estado" },
  { label: "Contacto", href: "/#contacto" },
];
