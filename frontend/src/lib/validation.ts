import { z } from "zod";

export const documentTypes = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "PPT", label: "Permiso por Protección Temporal" },
  { value: "PA", label: "Pasaporte" },
  { value: "NIT", label: "NIT (empresa)" },
] as const;

/** Datos del solicitante (una vez por pedido, en el carrito). */
export const contactSchema = z.object({
  applicantType: z.enum(["persona", "empresa"]),
  fullName: z.string().trim().min(5, "Escribe tu nombre completo.").max(120),
  documentType: z.enum(["CC", "CE", "PPT", "PA", "NIT"]),
  documentNumber: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9.-]{4,20}$/, "Número de documento no válido."),
  email: z.string().trim().toLowerCase().email("Correo no válido."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,18}$/, "Teléfono no válido. Incluye el indicativo si estás fuera de Colombia."),
  city: z.string().trim().min(2, "Indica tu ciudad o país.").max(80),
  company: z.string().trim().max(120).optional().default(""),
});

/** Dirección de entrega: sólo si algún documento se recibe en físico. */
export const shippingSchema = z.object({
  recipient: z.string().trim().min(5, "¿Quién recibe?").max(120),
  address: z.string().trim().min(6, "Escribe la dirección completa.").max(200),
  city: z.string().trim().min(2, "Indica la ciudad.").max(80),
  country: z.string().trim().min(2).max(60),
  notes: z.string().trim().max(200).optional().default(""),
});

/** Consentimientos (Ley 1581 de 2012). Nunca premarcados. */
export const consentSchema = z.object({
  dataConsent: z.literal(true, { errorMap: () => ({ message: "Necesitamos tu autorización para tratar tus datos." }) }),
  termsConsent: z.literal(true, { errorMap: () => ({ message: "Debes aceptar los términos y condiciones." }) }),
  marketingConsent: z.boolean().optional().default(false),
});

const itemSchema = z.object({
  service: z.string().regex(/^[a-z0-9-]{2,80}$/),
  fields: z.record(z.string().regex(/^[a-z][a-z0-9_]{0,39}$/), z.string().max(1200)),
  files_expected: z.number().int().min(0).max(5).default(0),
});

/**
 * Pedido completo que el BFF valida antes de reenviarlo al backend.
 * `website` es el honeypot: se acepta cualquier texto para poder responder
 * de forma neutra a los bots (si fallara la validación, les daría una pista).
 */
export const orderSchema = contactSchema.merge(consentSchema).extend({
  website: z.string().max(200).optional().default(""),
  shipping: shippingSchema.nullable().optional(),
  items: z.array(itemSchema).min(1, "Tu carrito está vacío.").max(10, "Máximo 10 documentos por pedido."),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ShippingInput = z.input<typeof shippingSchema>;
export type OrderPayload = z.output<typeof orderSchema>;

export const trackSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^ND-\d{4}-\d{6}$/, "El número de pedido tiene el formato ND-2026-000123."),
  email: z.string().trim().toLowerCase().email("Correo no válido."),
});

export const checkoutSchema = trackSchema.extend({
  purpose: z.enum(["verification", "quote"]),
  item: z
    .string()
    .regex(/^ND-\d{4}-\d{6}-\d{2}$/)
    .optional(),
});

/** Versión de la política aceptada; se guarda como prueba de autorización. */
export const PRIVACY_POLICY_VERSION = "2026-11-22";
