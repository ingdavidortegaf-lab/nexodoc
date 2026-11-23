/**
 * Piezas de marketing para redes sociales. Se generan como PNG en build
 * (app/marketing/[pieza]) y se descargan en /marketing/<pieza>.png.
 * Los precios salen de pricing.ts: al cambiar tus tarifas, las piezas se actualizan.
 */
import type { DocArt } from "@/components/illustrations/DocIllustrations";
import { formatCOP, minFrom } from "@/lib/data/pricing";

export type Format = "post" | "historia" | "portada";

export const formats: Record<Format, { width: number; height: number; label: string }> = {
  post: { width: 1080, height: 1350, label: "Instagram / Facebook (4:5)" },
  historia: { width: 1080, height: 1920, label: "Historias y Reels (9:16)" },
  portada: { width: 1640, height: 624, label: "Portada de Facebook" },
};

export interface Piece {
  slug: string;
  format: Format;
  art: DocArt;
  eyebrow: string;
  title: string;
  text: string;
  price?: string;
  chips: string[];
  cta: string;
}

const from = (slug: string) => {
  const v = minFrom(slug);
  return v ? `Desde ${formatCOP(v)}` : undefined;
};

export const pieces: Piece[] = [
  {
    slug: "registro-civil", format: "post", art: "registro",
    eyebrow: "Registros civiles",
    title: "Tu registro civil, sin filas.",
    text: "Nacimiento, matrimonio o defunción. Copia digital o física en Colombia y en el exterior.",
    price: from("registro-civil-de-nacimiento"),
    chips: ["Formulario guiado", "Seguimiento en línea"],
    cta: "Solicítalo en línea",
  },
  {
    slug: "escritura-publica", format: "post", art: "escritura",
    eyebrow: "Servicios notariales",
    title: "La copia de tu escritura, desde casa.",
    text: "Con el número, el año y la notaría la solicitamos por ti. Copia simple o auténtica.",
    price: from("copia-escritura-publica"),
    chips: ["Cualquier notaría del país", "Digital o física"],
    cta: "Pídela en línea",
  },
  {
    slug: "certificado-tradicion", format: "post", art: "tradicion",
    eyebrow: "Inmobiliarios",
    title: "Certificado de tradición y libertad en tu correo.",
    text: "Sólo necesitas el número de matrícula inmobiliaria. Ideal para compraventas y créditos.",
    price: from("certificado-de-tradicion-y-libertad"),
    chips: ["Certificado electrónico", "Pago con PSE"],
    cta: "Solicítalo hoy",
  },
  {
    slug: "apostilla-traduccion", format: "post", art: "apostilla",
    eyebrow: "Apostillas y traducciones",
    title: "¿Vas a viajar? Prepara tus documentos.",
    text: "Revisamos que sean apostillables, gestionamos la apostilla y coordinamos la traducción oficial.",
    price: from("apostilla-de-documentos"),
    chips: ["Países del Convenio de La Haya", "Traductores oficiales"],
    cta: "Cotiza en línea",
  },
  {
    slug: "pago-pse", format: "post", art: "pago",
    eyebrow: "Pagos seguros",
    title: "Paga con PSE, tarjeta o Nequi.",
    text: "Pagos procesados por Wompi (Bancolombia). Primero verificamos tu documento y luego pagas el saldo.",
    chips: ["PSE", "Tarjeta", "Nequi", "Bancolombia"],
    cta: "Pide tu documento",
  },
  {
    slug: "seguimiento", format: "post", art: "seguimiento",
    eyebrow: "Seguimiento en línea",
    title: "Sabes en qué va tu trámite.",
    text: "Con tu número de pedido y tu correo ves cada estado, la cotización y descargas tu documento.",
    chips: ["Sin llamar", "Sin crear cuenta"],
    cta: "Consulta tu pedido",
  },
  {
    slug: "historia-documentos", format: "historia", art: "registro",
    eyebrow: "Gestión documental en Colombia",
    title: "Tus documentos, sin filas ni vueltas.",
    text: "Registros civiles, escrituras, certificados, apostillas y traducciones. Pide en línea y paga con PSE.",
    price: from("registro-civil-de-nacimiento"),
    chips: ["Registro civil", "Escrituras", "Tradición y libertad", "Apostillas"],
    cta: "Solicita en línea",
  },
  {
    slug: "portada-facebook", format: "portada", art: "seguimiento",
    eyebrow: "Conectamos personas, documentos y soluciones",
    title: "Los documentos que necesitas, gestionados de forma sencilla.",
    text: "Pide en línea · Paga con PSE, tarjeta o Nequi · Sigue tu pedido",
    chips: [],
    cta: "",
  },
];

export const getPiece = (slug: string) => pieces.find((p) => p.slug === slug);
