/**
 * Estados de una solicitud. Debe coincidir con
 * backend/app/domain/request_status.py (mismos códigos).
 */
export const requestStatuses = [
  { code: "awaiting_verification", label: "Pendiente de pago de verificación", tone: "warning" },
  { code: "received", label: "Recibida", tone: "neutral" },
  { code: "in_review", label: "En revisión", tone: "info" },
  { code: "needs_info", label: "Requiere información", tone: "warning" },
  { code: "quoting", label: "En cotización", tone: "info" },
  { code: "pending_payment", label: "Pendiente de pago", tone: "warning" },
  { code: "confirmed", label: "Confirmada", tone: "info" },
  { code: "in_progress", label: "En gestión", tone: "accent" },
  { code: "awaiting_entity", label: "En espera de respuesta de la entidad", tone: "info" },
  { code: "document_available", label: "Documento disponible", tone: "success" },
  { code: "delivered", label: "Entregada", tone: "success" },
  { code: "closed", label: "Cerrada", tone: "neutral" },
  { code: "rejected_cancelled", label: "Rechazada o cancelada", tone: "danger" },
] as const;

export type RequestStatusCode = (typeof requestStatuses)[number]["code"];
