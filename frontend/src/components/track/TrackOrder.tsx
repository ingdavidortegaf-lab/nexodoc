"use client";

import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { UiIcon } from "@/components/icons/UiIcon";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/forms/fields";
import { getForm } from "@/lib/data/forms";
import { formatCOP, zoneLabel, type DeliveryZone } from "@/lib/data/pricing";
import { requestStatuses, type RequestStatusCode } from "@/lib/data/statuses";
import { recallOrder } from "@/lib/cart";
import { trackSchema } from "@/lib/validation";

interface TrackEvent { to_status: RequestStatusCode; label: string; note: string | null; created_at: string }
interface TrackQuote {
  entity_fees: number; service_fee: number; vat_on_service: number; shipping_fee: number; total: number;
  credited: number; paid: number; amount_due: number; estimated_days_note: string; valid_until: string; payable: boolean;
}
interface TrackItem {
  code: string; service: string; service_slug: string | null; status: RequestStatusCode; status_label: string;
  summary: [string, string][]; events: TrackEvent[]; quote: TrackQuote | null;
  documents: { id: string; name: string; size: number; created_at: string }[];
}
interface TrackResult {
  code: string; created_at: string; applicant_name: string; verification_total: number; verification_paid: boolean;
  verification_payable: boolean; payments_enabled: boolean; items: TrackItem[];
  payments: { reference: string; purpose: string; amount: number; status: string; method: string | null; created_at: string }[];
}

/** Hitos que ve el cliente (agrupan los 13 estados internos). */
const milestones: { label: string; states: RequestStatusCode[] }[] = [
  { label: "Recibida", states: ["awaiting_verification", "received"] },
  { label: "En revisión", states: ["in_review", "needs_info"] },
  { label: "Cotización", states: ["quoting", "pending_payment"] },
  { label: "En gestión", states: ["confirmed", "in_progress", "awaiting_entity"] },
  { label: "Disponible", states: ["document_available"] },
  { label: "Entregada", states: ["delivered", "closed"] },
];
const tone = Object.fromEntries(requestStatuses.map((s) => [s.code, s.tone])) as Record<RequestStatusCode, string>;
const toneClass: Record<string, string> = {
  neutral: "bg-mist text-night",
  info: "bg-sky-50 text-sky-800",
  warning: "bg-amber-50 text-amber-800",
  accent: "bg-teal-soft text-teal-ink",
  success: "bg-emerald-50 text-emerald-800",
  danger: "bg-red-50 text-red-800",
};
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
const methodLabel: Record<string, string> = { PSE: "PSE", CARD: "Tarjeta", NEQUI: "Nequi", BANCOLOMBIA_TRANSFER: "Bancolombia" };
const paymentStatus: Record<string, string> = { approved: "Aprobado", pending: "Pendiente", declined: "Rechazado", voided: "Anulado", error: "Con error" };

export function TrackOrder() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("codigo")?.toUpperCase() ?? "");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [data, setData] = useState<TrackResult | null>(null);

  const query = async (c: string, e: string) => {
    const parsed = trackSchema.safeParse({ code: c, email: e });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      return setErrors(errs);
    }
    setErrors({});
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/pedidos/estado", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 503) setMessage("La consulta en línea estará disponible muy pronto. Escríbenos y te contamos cómo va tu pedido.");
      else if (!res.ok) setMessage(typeof json.detail === "string" ? json.detail : "No pudimos consultar el pedido. Inténtalo de nuevo.");
      else setData(json as TrackResult);
    } catch {
      setMessage("No pudimos consultar el pedido. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  // Si viene del carrito o del pago, consulta automáticamente
  useEffect(() => {
    const last = recallOrder();
    const c = params.get("codigo")?.toUpperCase() ?? last?.code ?? "";
    if (last?.email && (!c || c === last.code)) {
      setCode(c);
      setEmail(last.email);
      void query(c, last.email);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pay = async (purpose: "verification" | "quote", item?: string) => {
    if (!data) return;
    setPaying(item ?? "verification");
    setMessage("");
    const res = await fetch("/api/pagos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: data.code, email: email.trim().toLowerCase(), purpose, item }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && typeof json.url === "string") return window.location.assign(json.url);
    setPaying(null);
    setMessage(typeof json.detail === "string" ? json.detail : "No pudimos abrir el pago. Inténtalo de nuevo.");
  };

  return (
    <div className="space-y-8">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void query(code, email);
        }}
        className="grid gap-5 rounded-xl bg-white p-6 shadow-card ring-1 ring-night/5 md:grid-cols-[1fr_1fr_auto] md:items-start md:p-8"
      >
        <Field label="Número de pedido" error={errors.code} htmlFor="t-code">
          <input id="t-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ND-2026-000123" autoComplete="off" className="input font-label tabular-nums" />
        </Field>
        <Field label="Correo electrónico" error={errors.email} htmlFor="t-email">
          <input id="t-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo con el que hiciste el pedido" autoComplete="email" className="input" />
        </Field>
        <div className="md:pt-7">
          <Button type="submit" disabled={loading} className="w-full md:w-auto" size="lg" magnetic={false}>
            {loading ? "Consultando…" : "Consultar"}
          </Button>
        </div>
      </form>

      <AnimatePresence>
        {message && (
          <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2.5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            <UiIcon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      {data && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-label text-sm font-semibold text-slate">Hola, {data.applicant_name}</p>
              <h2 className="font-display text-2xl font-bold tabular-nums">Pedido {data.code}</h2>
            </div>
            <p className="text-sm text-slate">Creado el {fmtDate(data.created_at)}</p>
          </div>

          {data.verification_payable && (
            <div className="flex flex-col gap-4 rounded-xl bg-night p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
              <div>
                <p className="font-display text-lg font-bold">Falta el pago de verificación</p>
                <p className="mt-1 text-white/75">Con este pago verificamos la disponibilidad de tus documentos. Se descuenta del valor final.</p>
              </div>
              <Button type="button" variant="light" onClick={() => pay("verification")} disabled={paying !== null} magnetic={false}>
                {paying === "verification" ? "Abriendo pago…" : `Pagar ${formatCOP(data.verification_total)}`}
              </Button>
            </div>
          )}

          {data.items.map((item) => (
            <ItemCard
              key={item.code}
              item={item}
              paying={paying === item.code}
              disabled={paying !== null}
              onPay={() => pay("quote", item.code)}
              onDownload={async (id) => {
                const res = await fetch("/api/pedidos/documento", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ code: data.code, email: email.trim().toLowerCase(), id }),
                }).catch(() => null);
                const json = res ? await res.json().catch(() => ({})) : {};
                if (res?.ok && typeof json.url === "string") window.location.assign(json.url);
                else setMessage("No pudimos generar el enlace de descarga. Inténtalo de nuevo.");
              }}
            />
          ))}

          {data.payments.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-card ring-1 ring-night/5 md:p-8">
              <h3 className="font-display text-lg font-bold">Pagos</h3>
              <ul className="mt-4 divide-y divide-line text-[0.9375rem]">
                {data.payments.map((p) => (
                  <li key={p.reference} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span>
                      <span className="font-medium text-night">{p.purpose === "verification" ? "Verificación" : "Cotización"}</span>
                      <span className="text-slate"> · {fmtDate(p.created_at)}{p.method ? ` · ${methodLabel[p.method] ?? p.method}` : ""}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="tabular-nums text-night">{formatCOP(p.amount)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 font-label text-xs font-semibold ${p.status === "approved" ? toneClass.success : p.status === "pending" ? toneClass.warning : toneClass.danger}`}>
                        {paymentStatus[p.status] ?? p.status}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function ItemCard({ item, paying, disabled, onPay, onDownload }: {
  item: TrackItem; paying: boolean; disabled: boolean; onPay: () => void; onDownload: (id: string) => void;
}) {
  const cancelled = item.status === "rejected_cancelled";
  const current = milestones.findIndex((m) => m.states.includes(item.status));
  const spec = item.service_slug ? getForm(item.service_slug) : null;
  const labelOf = (key: string) => spec?.fields.find((f) => f.name === key)?.label ?? (key === "entrega" ? "Entrega" : key.replace(/_/g, " "));
  // PostgreSQL (JSONB) no conserva el orden: se muestran en el orden del formulario
  const position = (key: string) => {
    const i = spec?.fields.findIndex((f) => f.name === key) ?? -1;
    return i === -1 ? 999 : i;
  };
  const summary = [...item.summary].sort((a, b) => position(a[0]) - position(b[0]));
  const q = item.quote;

  return (
    <article className="rounded-xl bg-white p-6 shadow-card ring-1 ring-night/5 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-label text-sm tabular-nums text-slate">{item.code}</p>
          <h3 className="mt-1 font-display text-xl font-bold">{item.service}</h3>
        </div>
        <span className={`self-start rounded-full px-3 py-1 font-label text-sm font-semibold ${toneClass[tone[item.status]] ?? toneClass.neutral}`}>
          {item.status_label}
        </span>
      </div>

      {!cancelled && (
        <ol className="mt-7 grid grid-cols-6 gap-1.5" aria-label="Avance">
          {milestones.map((m, i) => (
            <li key={m.label} className="min-w-0">
              <div className={`h-1.5 rounded-full ${i <= current ? "bg-teal" : "bg-mist"}`} />
              <span className={`mt-2 block truncate text-[0.6875rem] font-semibold sm:text-xs ${i <= current ? "text-night" : "text-slate"}`}>{m.label}</span>
            </li>
          ))}
        </ol>
      )}

      {item.documents?.length > 0 && (
        <div className="mt-7 rounded-lg bg-teal-soft p-5">
          <p className="flex items-center gap-2 font-semibold text-night">
            <UiIcon name="file" className="h-5 w-5 text-teal-ink" /> Tu documento está listo
          </p>
          <ul className="mt-3 space-y-2">
            {item.documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white px-4 py-3 text-sm shadow-inset">
                <span className="min-w-0 truncate font-medium text-night">{d.name}</span>
                <button type="button" onClick={() => onDownload(d.id)} className="inline-flex items-center gap-1.5 rounded-full bg-night px-4 py-1.5 font-label font-semibold text-white hover:bg-navy">
                  Descargar
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate">El enlace de descarga es privado y vence en pocos minutos.</p>
        </div>
      )}

      {q && (
        <div className="mt-7 rounded-lg bg-mist p-5">
          <p className="font-semibold text-night">Cotización</p>
          <dl className="mt-3 space-y-1.5 text-[0.9375rem]">
            {[
              ["Derechos de la entidad", q.entity_fees],
              ["Honorario de gestión", q.service_fee],
              ["IVA del honorario", q.vat_on_service],
              ...(q.shipping_fee ? [["Envío", q.shipping_fee] as [string, number]] : []),
              ...(q.credited ? [["Verificación pagada", -q.credited] as [string, number]] : []),
              ...(q.paid ? [["Pagado", -q.paid] as [string, number]] : []),
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between gap-4">
                <dt className="text-slate">{k}</dt>
                <dd className="tabular-nums text-night">{formatCOP(v as number)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-line pt-2.5">
              <dt className="font-semibold text-night">Saldo</dt>
              <dd className="font-display text-lg font-bold tabular-nums text-night">{formatCOP(q.amount_due)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-slate">
            {q.estimated_days_note} · Válida hasta el {new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" }).format(new Date(q.valid_until))}.
          </p>
          {q.payable && (
            <div className="mt-4">
              <Button type="button" onClick={onPay} disabled={disabled} magnetic={false} arrow>
                {paying ? "Abriendo pago…" : `Pagar ${formatCOP(q.amount_due)} con PSE, tarjeta o Nequi`}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-7 grid gap-8 md:grid-cols-2">
        <div>
          <h4 className="font-label text-sm font-semibold text-slate">Historial</h4>
          <ol className="mt-3 space-y-4 border-l-2 border-line pl-5">
            {[...item.events].reverse().map((e, i) => (
              <li key={`${e.created_at}-${i}`} className="relative">
                <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${i === 0 ? "bg-teal" : "bg-line-strong"}`} />
                <p className="font-medium text-night">{e.label}</p>
                <p className="text-xs text-slate">{fmtDate(e.created_at)}</p>
                {e.note && <p className="mt-1 text-sm text-night/80">{e.note}</p>}
              </li>
            ))}
          </ol>
        </div>
        {summary.length > 0 && (
          <div>
            <h4 className="font-label text-sm font-semibold text-slate">Datos del documento</h4>
            <dl className="mt-3 space-y-1.5 text-sm">
              {summary.map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="shrink-0 text-slate first-letter:uppercase">{labelOf(k)}:</dt>
                  <dd className="min-w-0 break-words font-medium text-night">{k === "entrega" ? (zoneLabel[v as DeliveryZone] ?? v) : v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </article>
  );
}
