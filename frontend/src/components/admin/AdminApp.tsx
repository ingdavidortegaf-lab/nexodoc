"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UiIcon } from "@/components/icons/UiIcon";
import { Button } from "@/components/ui/Button";
import { Check, Field, Select } from "@/components/forms/fields";
import { getForm } from "@/lib/data/forms";
import { formatCOP, zoneLabel, type DeliveryZone } from "@/lib/data/pricing";
import { requestStatuses, type RequestStatusCode } from "@/lib/data/statuses";

interface ListItem { code: string; service: string; status: RequestStatusCode; status_label: string }
interface OrderRow {
  code: string; created_at: string; applicant: string; email: string; city: string;
  verification_total: number; verification_paid: boolean; items: ListItem[];
}
interface AdminEvent { to_status: RequestStatusCode; label: string; note: string | null; visible_to_client: boolean; system: boolean; created_at: string }
interface AdminFile { id: string; name: string; kind: string; size: number; created_at: string }
interface AdminQuote { entity_fees: number; service_fee: number; vat_on_service: number; shipping_fee: number; total: number; credited: number; paid: number; amount_due: number; estimated_days_note: string; valid_until: string }
interface AdminItem {
  code: string; service: string; service_slug: string | null; status: RequestStatusCode; status_label: string;
  fields: Record<string, string>; verification_fee: number; can_quote: boolean;
  next_states: { code: RequestStatusCode; label: string; requires_note: boolean }[];
  events: AdminEvent[]; files: AdminFile[]; quote: AdminQuote | null;
}
interface OrderDetail {
  code: string; created_at: string;
  applicant: { type: string; full_name: string; company: string | null; email: string; phone: string; city: string; document_type: string; document_number: string };
  shipping: { recipient?: string; address?: string; city?: string; country?: string; notes?: string } | null;
  verification_total: number;
  payments: { reference: string; purpose: string; amount: number; status: string; method: string | null; created_at: string }[];
  items: AdminItem[];
}

const tone = Object.fromEntries(requestStatuses.map((s) => [s.code, s.tone])) as Record<RequestStatusCode, string>;
const toneClass: Record<string, string> = {
  neutral: "bg-mist text-night", info: "bg-sky-50 text-sky-800", warning: "bg-amber-50 text-amber-800",
  accent: "bg-teal-soft text-teal-ink", success: "bg-emerald-50 text-emerald-800", danger: "bg-red-50 text-red-800",
};
const fmt = (iso: string) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

async function api<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`/api/admin/${path}`, init);
  if (res.status === 401) window.location.assign("/admin/ingresar?error=sesion");
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: data as T };
}
const errorOf = (d: unknown) => (typeof (d as { detail?: unknown })?.detail === "string" ? (d as { detail: string }).detail : "No se pudo completar la acción.");

function Badge({ status, label }: { status: RequestStatusCode; label: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 font-label text-xs font-semibold ${toneClass[tone[status]] ?? toneClass.neutral}`}>{label}</span>;
}

export function AdminApp() {
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status_filter", filter);
    if (query.trim()) params.set("q", query.trim());
    const r = await api<OrderRow[]>(`orders${params.size ? `?${params}` : ""}`);
    if (r.ok) setRows(r.data);
    else setMessage(r.status === 503 ? "El sistema de pedidos no está conectado." : errorOf(r.data));
    setLoading(false);
  }, [filter, query]);

  const open = useCallback(async (code: string) => {
    setSelected(code);
    const r = await api<OrderDetail>(`orders/${code}`);
    if (r.ok) setDetail(r.data);
    else setMessage(errorOf(r.data));
  }, []);

  useEffect(() => {
    void api<{ name: string; role: string }>("me").then((r) => r.ok && setMe(r.data));
  }, []);
  useEffect(() => {
    void load();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c: Partial<Record<RequestStatusCode, number>> = {};
    for (const o of rows) for (const i of o.items) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [rows]);

  return (
    <div className="container-site py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Pedidos</h1>
          {me && <p className="text-sm text-slate">{me.name} · {me.role === "admin" ? "Administrador" : me.role === "supervisor" ? "Supervisor" : "Gestor"}</p>}
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="rounded-full px-4 py-2 font-label text-sm font-semibold text-night ring-1 ring-line-strong hover:bg-white">Cerrar sesión</button>
        </form>
      </div>

      {/* Resumen por estado: lo que requiere acción del equipo */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {(["received", "in_review", "quoting", "confirmed", "awaiting_entity"] as RequestStatusCode[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? "" : s)}
            className={`rounded-lg p-4 text-left ring-1 transition-colors ${filter === s ? "bg-night text-white ring-night" : "bg-white ring-line hover:ring-night/30"}`}
          >
            <span className="block font-display text-2xl font-bold tabular-nums">{counts[s] ?? 0}</span>
            <span className={`text-sm ${filter === s ? "text-white/75" : "text-slate"}`}>{requestStatuses.find((x) => x.code === s)?.label}</span>
          </button>
        ))}
      </div>

      {message && (
        <p role="alert" className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          {message}
          <button onClick={() => setMessage("")} aria-label="Cerrar aviso"><UiIcon name="close" className="h-4 w-4" /></button>
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(320px,0.8fr)_1.6fr] lg:items-start">
        {/* Lista */}
        <div className="rounded-xl bg-white p-4 shadow-card ring-1 ring-night/5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load();
            }}
            className="flex gap-2"
          >
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Código, correo o nombre" className="input h-11" aria-label="Buscar pedidos" />
            <button className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-night text-white" aria-label="Buscar"><UiIcon name="search" className="h-4 w-4" /></button>
          </form>
          <div className="mt-3">
            <Select id="adm-filter" value={filter} onChange={setFilter}>
              <option value="">Todos los estados</option>
              {requestStatuses.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
            </Select>
          </div>
          <ul className="mt-4 max-h-[70vh] divide-y divide-line overflow-y-auto">
            {loading && <li className="py-6 text-center text-sm text-slate">Cargando…</li>}
            {!loading && rows.length === 0 && <li className="py-6 text-center text-sm text-slate">No hay pedidos con ese filtro.</li>}
            {rows.map((o) => (
              <li key={o.code}>
                <button onClick={() => open(o.code)} className={`w-full rounded-md px-3 py-3 text-left transition-colors ${selected === o.code ? "bg-teal-soft" : "hover:bg-mist"}`}>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-label text-sm font-bold tabular-nums">{o.code}</span>
                    <span className="text-xs text-slate">{fmt(o.created_at)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-night">{o.applicant} · {o.city}</span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {o.items.map((i) => <Badge key={i.code} status={i.status} label={i.status_label} />)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Detalle */}
        <div>
          {!detail ? (
            <div className="grid min-h-[320px] place-items-center rounded-xl bg-white p-8 text-center text-slate shadow-card ring-1 ring-night/5">
              Selecciona un pedido para ver el detalle.
            </div>
          ) : (
            <OrderView detail={detail} reload={async () => { await open(detail.code); await load(); }} onError={setMessage} />
          )}
        </div>
      </div>
    </div>
  );
}

function OrderView({ detail, reload, onError }: { detail: OrderDetail; reload: () => Promise<void>; onError: (m: string) => void }) {
  const a = detail.applicant;
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-6 shadow-card ring-1 ring-night/5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold tabular-nums">{detail.code}</h2>
          <span className="text-sm text-slate">{fmt(detail.created_at)}</span>
        </div>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {[
            ["Solicitante", `${a.full_name}${a.company ? ` · ${a.company}` : ""}`],
            ["Documento", `${a.document_type} ${a.document_number}`],
            ["Correo", a.email],
            ["Celular", a.phone],
            ["Ciudad", a.city],
            ["Verificación", detail.verification_total ? formatCOP(detail.verification_total) : "Sin cobro previo"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2"><dt className="shrink-0 text-slate">{k}:</dt><dd className="min-w-0 break-words font-medium text-night">{v}</dd></div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`mailto:${a.email}?subject=${encodeURIComponent(`Pedido ${detail.code}`)}`} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label text-sm font-semibold ring-1 ring-line-strong hover:bg-mist"><UiIcon name="mail" className="h-4 w-4" /> Correo</a>
          <a href={`https://wa.me/${a.phone.replace(/\D/g, "").replace(/^3/, "573")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label text-sm font-semibold ring-1 ring-line-strong hover:bg-mist"><UiIcon name="whatsapp" className="h-4 w-4" /> WhatsApp</a>
        </div>
        {detail.shipping?.address && (
          <p className="mt-4 rounded-lg bg-mist p-3 text-sm">
            <strong>Entrega:</strong> {detail.shipping.recipient} · {detail.shipping.address}, {detail.shipping.city}, {detail.shipping.country}
            {detail.shipping.notes ? ` · ${detail.shipping.notes}` : ""}
          </p>
        )}
        {detail.payments.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm">
            {detail.payments.map((p) => (
              <li key={p.reference} className="flex flex-wrap justify-between gap-2">
                <span className="text-slate">{p.purpose === "verification" ? "Verificación" : "Cotización"} · {p.reference} · {fmt(p.created_at)}{p.method ? ` · ${p.method}` : ""}</span>
                <span className="font-medium tabular-nums">{formatCOP(p.amount)} · {p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {detail.items.map((item) => <ItemPanel key={item.code} item={item} reload={reload} onError={onError} />)}
    </div>
  );
}

function ItemPanel({ item, reload, onError }: { item: AdminItem; reload: () => Promise<void>; onError: (m: string) => void }) {
  const spec = item.service_slug ? getForm(item.service_slug) : null;
  const label = (k: string) => spec?.fields.find((f) => f.name === k)?.label ?? (k === "entrega" ? "Entrega" : k === "pais_entrega" ? "País de entrega" : k.replace(/_/g, " "));
  const pos = (k: string) => { const i = spec?.fields.findIndex((f) => f.name === k) ?? -1; return i === -1 ? 999 : i; };
  const fields = Object.entries(item.fields).sort((x, y) => pos(x[0]) - pos(y[0]));

  return (
    <article className="rounded-xl bg-white p-6 shadow-card ring-1 ring-night/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-label text-sm tabular-nums text-slate">{item.code}</p>
          <h3 className="font-display text-lg font-bold">{item.service}</h3>
        </div>
        <Badge status={item.status} label={item.status_label} />
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-2">
        <div>
          <h4 className="font-label text-sm font-semibold text-slate">Datos del formulario</h4>
          <dl className="mt-2 space-y-1 text-sm">
            {fields.map(([k, v]) => (
              <div key={k} className="flex gap-2"><dt className="shrink-0 text-slate first-letter:uppercase">{label(k)}:</dt><dd className="min-w-0 break-words font-medium">{k === "entrega" ? zoneLabel[v as DeliveryZone] ?? v : v}</dd></div>
            ))}
          </dl>
          <h4 className="mt-5 font-label text-sm font-semibold text-slate">Archivos</h4>
          {item.files.length === 0 ? <p className="mt-1 text-sm text-slate">Sin archivos.</p> : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {item.files.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 rounded-md bg-mist px-3 py-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {f.kind === "documento_final" && <span className="shrink-0 rounded bg-teal-soft px-1.5 py-0.5 text-xs font-semibold text-teal-ink">Final</span>}
                    <span className="truncate">{f.name}</span>
                  </span>
                  <button
                    className="shrink-0 font-label font-semibold text-teal-ink"
                    onClick={async () => {
                      const r = await api<{ url: string }>(`files/${f.id}/download`);
                      if (r.ok) window.open(r.data.url, "_blank", "noopener");
                      else onError(errorOf(r.data));
                    }}
                  >Descargar</button>
                </li>
              ))}
            </ul>
          )}
          <UploadFinal code={item.code} reload={reload} onError={onError} />
        </div>
        <div>
          <h4 className="font-label text-sm font-semibold text-slate">Historial</h4>
          <ol className="mt-2 space-y-3 border-l-2 border-line pl-4 text-sm">
            {[...item.events].reverse().map((e, i) => (
              <li key={`${e.created_at}-${i}`}>
                <p className="font-medium">{e.label} {!e.visible_to_client && <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800">interna</span>}{e.system && <span className="ml-1 rounded bg-mist px-1.5 py-0.5 text-xs text-slate">sistema</span>}</p>
                <p className="text-xs text-slate">{fmt(e.created_at)}</p>
                {e.note && <p className="mt-0.5 text-night/80">{e.note}</p>}
              </li>
            ))}
          </ol>
          {item.quote && (
            <p className="mt-4 rounded-lg bg-mist p-3 text-sm">
              Cotización: <strong>{formatCOP(item.quote.total)}</strong> · saldo {formatCOP(item.quote.amount_due)} · válida hasta {fmt(item.quote.valid_until)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 border-t border-line pt-5 xl:grid-cols-2">
        <StatusForm item={item} reload={reload} onError={onError} />
        {item.can_quote && <QuoteForm code={item.code} reload={reload} onError={onError} />}
      </div>
    </article>
  );
}

function StatusForm({ item, reload, onError }: { item: AdminItem; reload: () => Promise<void>; onError: (m: string) => void }) {
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);
  const target = item.next_states.find((s) => s.code === to);
  if (item.next_states.length === 0) {
    return <p className="text-sm text-slate">{item.status === "awaiting_verification" || item.status === "pending_payment" ? "Esperando el pago del cliente (se confirma automáticamente)." : "Sin acciones disponibles."}</p>;
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!to) return;
        if (target?.requires_note && !note.trim()) return onError("Este estado requiere una nota para el cliente.");
        setBusy(true);
        const r = await api(`requests/${item.code}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, note: note.trim() || null, visible_to_client: visible }),
        });
        setBusy(false);
        if (!r.ok) return onError(errorOf(r.data));
        setTo(""); setNote("");
        await reload();
      }}
      className="space-y-3"
    >
      <h4 className="font-label text-sm font-semibold">Cambiar estado</h4>
      <Select id={`to-${item.code}`} value={to} onChange={setTo} placeholder="Siguiente estado">
        {item.next_states.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
      </Select>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} placeholder={target?.requires_note ? "Nota para el cliente (obligatoria)" : "Nota (opcional)"} className="input min-h-20 py-3" aria-label="Nota" />
      <Check id={`vis-${item.code}`} checked={visible} onChange={setVisible}>Visible para el cliente (le enviamos aviso)</Check>
      <Button type="submit" disabled={!to || busy} magnetic={false}>{busy ? "Guardando…" : "Guardar estado"}</Button>
    </form>
  );
}

function QuoteForm({ code, reload, onError }: { code: string; reload: () => Promise<void>; onError: (m: string) => void }) {
  const [v, setV] = useState({ entity_fees: "", service_fee: "", shipping_fee: "0", estimated_days_note: "", valid_days: "5" });
  const [busy, setBusy] = useState(false);
  const n = (s: string) => Number(s.replace(/\D/g, "") || 0);
  const vat = Math.round(n(v.service_fee) * 0.19);
  const total = n(v.entity_fees) + n(v.service_fee) + vat + n(v.shipping_fee);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!n(v.service_fee) || v.estimated_days_note.trim().length < 5) return onError("Completa el honorario y el tiempo estimado.");
        setBusy(true);
        const r = await api(`requests/${code}/quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity_fees: n(v.entity_fees), service_fee: n(v.service_fee), shipping_fee: n(v.shipping_fee), estimated_days_note: v.estimated_days_note.trim(), valid_days: n(v.valid_days) || 5 }),
        });
        setBusy(false);
        if (!r.ok) return onError(errorOf(r.data));
        await reload();
      }}
      className="space-y-3 rounded-lg bg-teal-soft/50 p-4"
    >
      <h4 className="font-label text-sm font-semibold">Emitir cotización</h4>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Derechos entidad" htmlFor={`q1-${code}`}><input id={`q1-${code}`} inputMode="numeric" value={v.entity_fees} onChange={set("entity_fees")} className="input h-11" /></Field>
        <Field label="Honorario" htmlFor={`q2-${code}`}><input id={`q2-${code}`} inputMode="numeric" value={v.service_fee} onChange={set("service_fee")} className="input h-11" /></Field>
        <Field label="Envío" htmlFor={`q3-${code}`}><input id={`q3-${code}`} inputMode="numeric" value={v.shipping_fee} onChange={set("shipping_fee")} className="input h-11" /></Field>
        <Field label="Vigencia (días)" htmlFor={`q4-${code}`}><input id={`q4-${code}`} inputMode="numeric" value={v.valid_days} onChange={set("valid_days")} className="input h-11" /></Field>
      </div>
      <Field label="Tiempo estimado" htmlFor={`q5-${code}`}><input id={`q5-${code}`} value={v.estimated_days_note} onChange={set("estimated_days_note")} placeholder="Según la notaría: 3 a 5 días hábiles" className="input h-11" /></Field>
      <p className="text-sm">IVA del honorario: {formatCOP(vat)} · <strong>Total: {formatCOP(total)}</strong></p>
      <Button type="submit" disabled={busy} magnetic={false}>{busy ? "Enviando…" : "Enviar cotización al cliente"}</Button>
    </form>
  );
}

function UploadFinal({ code, reload, onError }: { code: string; reload: () => Promise<void>; onError: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 font-label text-sm font-semibold text-night ring-1 ring-line-strong hover:bg-mist">
      <UiIcon name="upload" className="h-4 w-4" />
      {busy ? "Subiendo…" : "Subir documento final"}
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="sr-only"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          const body = new FormData();
          body.append("file", file, file.name);
          body.append("kind", "documento_final");
          const r = await api(`requests/${code}/files`, { method: "POST", body });
          setBusy(false);
          if (!r.ok) return onError(errorOf(r.data));
          await reload();
        }}
      />
    </label>
  );
}
