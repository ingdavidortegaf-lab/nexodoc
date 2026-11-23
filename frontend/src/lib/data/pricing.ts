/**
 * Precios de NEXODOC por servicio (pesos colombianos, IVA incluido en el honorario).
 *
 * ⚠️  LOS VALORES DE ESTE ARCHIVO SON DE EJEMPLO. Reemplázalos por tus tarifas
 *     reales antes de publicar y vuelve a sembrar el backend:
 *       npx tsx scripts/export-catalog.ts > catalog.json && python -m app.seed catalog.json
 *
 * - verificationFee: se paga al enviar el pedido para que verifiquemos la
 *   disponibilidad del documento ante la entidad. Se descuenta del valor final.
 *   0 = el pedido se envía sin pago previo y se paga sólo la cotización.
 * - from: precio "desde" que se muestra en el sitio (informativo). Puede variar
 *   por zona de entrega. Si no hay valor se muestra "Según cotización".
 * - officialFee: tarifa oficial de la entidad, para que el cliente compare con el
 *   trámite directo. Déjala vacía si no la has verificado en la fuente oficial.
 *
 * El monto que se cobra lo calcula SIEMPRE el backend con los valores sembrados.
 */
export type DeliveryZone = "digital" | "local" | "nacional" | "internacional";

export interface ServicePricing {
  verificationFee: number;
  from?: Partial<Record<DeliveryZone, number>> | number;
  officialFee?: { label: string; source: string; url?: string };
  note?: string;
}

export const pricing: Record<string, ServicePricing> = {
  "registro-civil-de-nacimiento": {
    verificationFee: 15000,
    from: { digital: 39000, local: 59000, nacional: 109000, internacional: 289000 },
    note: "El valor final depende del número de copias y de la ciudad o país de entrega.",
  },
  "registro-civil-de-matrimonio": {
    verificationFee: 15000,
    from: { digital: 39000, local: 59000, nacional: 109000, internacional: 289000 },
    note: "El valor final depende del número de copias y de la ciudad o país de entrega.",
  },
  "registro-civil-de-defuncion": {
    verificationFee: 15000,
    from: { digital: 39000, local: 59000, nacional: 109000, internacional: 289000 },
    note: "El valor final depende del número de copias y de la ciudad o país de entrega.",
  },
  "copia-escritura-publica": {
    verificationFee: 19000,
    note: "Confirmamos con la notaría la disponibilidad y el número de hojas; luego te enviamos el valor final.",
  },
  "busqueda-de-escrituras": {
    verificationFee: 25000,
    note: "Cubre la búsqueda en la notaría. Si ubicamos la escritura, te cotizamos la copia.",
  },
  "certificado-de-tradicion-y-libertad": {
    verificationFee: 0,
    from: { digital: 35000 },
    note: "Certificado electrónico con validez legal, expedido por la Superintendencia de Notariado y Registro.",
  },
  "traduccion-oficial": {
    verificationFee: 0,
    note: "Revisamos el documento y el número de hojas traducidas y te enviamos el valor antes de iniciar.",
  },
  "apostilla-de-documentos": {
    verificationFee: 0,
    from: { digital: 69000 },
    note: "Más la tarifa de la Cancillería, si aplica.",
  },
};

export const getPricing = (slug: string): ServicePricing | undefined => pricing[slug];

/** El menor precio "desde" de un servicio (para tarjetas y listados). */
export function minFrom(slug: string): number | undefined {
  const f = pricing[slug]?.from;
  if (f === undefined) return undefined;
  if (typeof f === "number") return f;
  const values = Object.values(f).filter((v): v is number => typeof v === "number");
  return values.length ? Math.min(...values) : undefined;
}

const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
export const formatCOP = (value: number) => cop.format(value);

export const zoneLabel: Record<DeliveryZone, string> = {
  digital: "Copia digital",
  local: "Entrega en tu ciudad",
  nacional: "Envío nacional",
  internacional: "Envío internacional",
};
