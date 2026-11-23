"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { UiIcon } from "@/components/icons/UiIcon";
import { Button } from "@/components/ui/Button";
import { Check, Choice, Field, Select } from "@/components/forms/fields";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import { allServices } from "@/lib/data/categories";
import { getForm, payloadFields, summarize, validateItem } from "@/lib/data/forms";
import { countries } from "@/lib/data/geo";
import { formatCOP, getPricing, zoneLabel, type DeliveryZone } from "@/lib/data/pricing";
import { rememberOrder, useCart, type CartItem } from "@/lib/cart";
import { consentSchema, contactSchema, documentTypes, shippingSchema, type ContactInput, type ShippingInput } from "@/lib/validation";

type Status = "idle" | "sending" | "uploading" | "paying" | "success" | "error" | "not_configured";
type Errors = Record<string, string>;

interface Created {
  code: string;
  upload_token: string;
  items: { code: string; service: string }[];
  payment: { required: boolean; amount: number; enabled: boolean };
}

const serviceName = (slug: string) => (slug === "otro" ? "Otro documento" : allServices.find((s) => s.slug === slug)?.name ?? slug);
const ease = [0.22, 1, 0.36, 1] as const;

export function Checkout({ apiReady, publicApiUrl, fallback }: {
  apiReady: boolean;
  publicApiUrl: string;
  fallback: { whatsapp: string; email: string };
}) {
  const cart = useCart();
  const [contact, setContact] = useState<ContactInput>({
    applicantType: "persona", fullName: "", documentType: "CC", documentNumber: "", email: "", phone: "", city: "", company: "",
  });
  const [shipping, setShipping] = useState<ShippingInput>({ recipient: "", address: "", city: "", country: "Colombia", notes: "" });
  const [consents, setConsents] = useState({ dataConsent: false, termsConsent: false, marketingConsent: false });
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [itemErrors, setItemErrors] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ code: string; email: string; uploadFailed: number; payment: Created["payment"] } | null>(null);

  useEffect(() => {
    if (status === "success" || status === "not_configured") window.scrollTo({ top: 0 });
  }, [status]);

  const needsShipping = cart.items.some((i) => ["local", "nacional", "internacional"].includes(i.values.entrega));
  const international = cart.items.find((i) => i.values.entrega === "internacional");
  const verificationTotal = useMemo(
    () => cart.items.reduce((sum, i) => sum + (getPricing(i.service)?.verificationFee ?? 0), 0),
    [cart.items],
  );

  const setC = <K extends keyof ContactInput>(k: K, v: ContactInput[K]) => {
    setContact((c) => ({ ...c, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };
  const setS = <K extends keyof ShippingInput>(k: K, v: ShippingInput[K]) => {
    setShipping((s) => ({ ...s, [k]: v }));
    if (errors[`ship_${k}`]) setErrors((e) => ({ ...e, [`ship_${k}`]: "" }));
  };

  const fileCounts = (item: CartItem) =>
    Object.fromEntries(Object.entries(cart.files[item.id] ?? {}).map(([k, v]) => [k, v.length]));

  const validate = () => {
    const errs: Errors = {};
    const bad: Record<string, boolean> = {};
    for (const item of cart.items) {
      const e = validateItem(getForm(item.service), item.values, fileCounts(item));
      if (Object.values(e).some(Boolean)) bad[item.id] = true;
    }
    const c = contactSchema.safeParse(contact);
    if (!c.success) for (const i of c.error.issues) errs[String(i.path[0])] ??= i.message;
    if (needsShipping) {
      const s = shippingSchema.safeParse({ ...shipping, country: international ? international.values.pais_entrega || shipping.country : "Colombia" });
      if (!s.success) for (const i of s.error.issues) errs[`ship_${String(i.path[0])}`] ??= i.message;
    }
    const k = consentSchema.safeParse(consents);
    if (!k.success) for (const i of k.error.issues) errs[String(i.path[0])] ??= i.message;
    setErrors(errs);
    setItemErrors(bad);
    const ok = !Object.values(errs).some(Boolean) && !Object.keys(bad).length;
    if (!ok) {
      const first = Object.keys(bad).length ? "carrito-items" : `c-${Object.keys(errs).find((x) => errs[x])}`;
      document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return ok;
  };

  async function uploadAll(created: Created) {
    let failed = 0;
    for (const [index, item] of cart.items.entries()) {
      const target = created.items[index];
      if (!target) continue;
      for (const list of Object.values(cart.files[item.id] ?? {})) {
        for (const file of list) {
          const body = new FormData();
          body.append("file", file, file.name);
          const url = publicApiUrl
            ? `${publicApiUrl}/v1/orders/${created.code}/items/${target.code}/files`
            : `/api/pedidos/${created.code}/items/${target.code}/archivos`;
          const res = await fetch(url, { method: "POST", body, headers: { Authorization: `Bearer ${created.upload_token}` } }).catch(() => null);
          if (!res?.ok) failed++;
        }
      }
    }
    return failed;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    setMessage("");
    const email = contact.email.trim().toLowerCase();
    const items = cart.items.map((i) => ({
      service: i.service,
      fields: payloadFields(getForm(i.service), i.values),
      files_expected: Object.values(cart.files[i.id] ?? {}).reduce((n, l) => n + l.length, 0),
    }));
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          email,
          ...consents,
          website,
          shipping: needsShipping ? { ...shipping, country: international?.values.pais_entrega || shipping.country } : null,
          items,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 503 && json.error === "not_configured") return setStatus("not_configured");
      if (!res.ok) {
        setMessage(typeof json.detail === "string" ? json.detail : "Revisa los datos e inténtalo de nuevo.");
        return setStatus("error");
      }
      const created = json as Created;
      rememberOrder(created.code, email);

      setStatus("uploading");
      const uploadFailed = await uploadAll(created);
      cart.clear();

      if (created.payment.required && created.payment.enabled) {
        setStatus("paying");
        const pay = await fetch("/api/pagos/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: created.code, email, purpose: "verification" }),
        }).catch(() => null);
        const payJson = pay ? await pay.json().catch(() => ({})) : {};
        if (pay?.ok && typeof payJson.url === "string") {
          window.location.assign(payJson.url);
          return;
        }
      }
      setResult({ code: created.code, email, uploadFailed, payment: created.payment });
      setStatus("success");
    } catch {
      setMessage("No pudimos enviar tu pedido. Revisa tu conexión e inténtalo de nuevo.");
      setStatus("error");
    }
  };

  if (status === "success" && result) return <Success {...result} />;
  if (status === "not_configured") return <NotConfigured items={cart.items} fallback={fallback} onBack={() => setStatus("idle")} />;

  if (cart.ready && cart.items.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-lift ring-1 ring-night/5 md:p-14">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mist text-teal-ink">
          <UiIcon name="file" className="h-7 w-7" />
        </span>
        <h2 className="mt-6 font-display text-2xl font-bold">Tu carrito está vacío</h2>
        <p className="mx-auto mt-3 max-w-md text-slate">Elige el documento que necesitas, completa sus datos y agrégalo aquí.</p>
        <div className="mt-8 flex justify-center">
          <Button href="/solicitar" arrow>Elegir un documento</Button>
        </div>
      </div>
    );
  }

  const busy = status === "sending" || status === "uploading" || status === "paying";

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      <div className="space-y-8">
        {/* Documentos */}
        <section id="carrito-items" className="rounded-xl bg-white p-6 shadow-card ring-1 ring-night/5 md:p-8" aria-labelledby="h-docs">
          <div className="flex items-center justify-between gap-4">
            <h2 id="h-docs" className="font-display text-xl font-bold">Documentos ({cart.items.length})</h2>
            <Link href="/solicitar" className="inline-flex items-center gap-1.5 font-label text-sm font-semibold text-teal-ink">
              <UiIcon name="plus" className="h-4 w-4" /> Agregar otro
            </Link>
          </div>
          <ul className="mt-6 space-y-4">
            <AnimatePresence initial={false}>
              {cart.items.map((item) => {
                const spec = getForm(item.service);
                const lines = summarize(spec, item.values).slice(0, 4);
                const fee = getPricing(item.service)?.verificationFee ?? 0;
                const nFiles = Object.values(cart.files[item.id] ?? {}).reduce((n, l) => n + l.length, 0);
                const needsFiles = spec.fields.some((f) => f.type === "file" && f.required) && nFiles === 0;
                return (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease }}
                    className={`overflow-hidden rounded-lg p-5 ring-1 ${itemErrors[item.id] ? "bg-red-50/60 ring-red-300" : "bg-mist/60 ring-line"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-night">{serviceName(item.service)}</p>
                        <p className="mt-0.5 font-label text-sm text-slate">
                          {zoneLabel[item.values.entrega as DeliveryZone] ?? "Entrega por definir"}
                          {item.values.pais_entrega ? ` · ${item.values.pais_entrega}` : ""}
                          {item.values.copias ? ` · ${item.values.copias} ${item.values.copias === "1" ? "copia" : "copias"}` : ""}
                          {nFiles ? ` · ${nFiles} ${nFiles === 1 ? "archivo" : "archivos"}` : ""}
                        </p>
                      </div>
                      <p className="shrink-0 text-right font-label text-sm">
                        {fee > 0 ? (
                          <>
                            <span className="block text-slate">Verificación</span>
                            <strong className="tabular-nums text-night">{formatCOP(fee)}</strong>
                          </>
                        ) : (
                          <span className="text-slate">Se cotiza</span>
                        )}
                      </p>
                    </div>
                    {lines.length > 0 && (
                      <dl className="mt-3 grid gap-x-5 gap-y-1 text-sm sm:grid-cols-2">
                        {lines.map(([k, v]) => (
                          <div key={k} className="flex min-w-0 gap-1.5">
                            <dt className="shrink-0 text-slate">{k}:</dt>
                            <dd className="truncate font-medium text-night">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {(itemErrors[item.id] || needsFiles) && (
                      <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-700">
                        <UiIcon name="alert" className="h-4 w-4 shrink-0" />
                        {needsFiles ? "Vuelve a adjuntar el archivo (no se guarda al recargar la página)." : "Faltan datos de este documento."}
                      </p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Link href={`/solicitar/${item.service}?editar=${item.id}`} className="rounded-full px-3.5 py-1.5 font-label text-sm font-semibold text-night ring-1 ring-line-strong hover:bg-white">
                        Editar
                      </Link>
                      <button type="button" onClick={() => cart.remove(item.id)} className="rounded-full px-3.5 py-1.5 font-label text-sm font-semibold text-slate hover:bg-white hover:text-red-700">
                        Quitar
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </section>

        {/* Solicitante */}
        <section className="rounded-xl bg-white p-6 shadow-card ring-1 ring-night/5 md:p-8" aria-labelledby="h-you">
          <h2 id="h-you" className="font-display text-xl font-bold">Tus datos</h2>
          <p className="mt-1 text-sm text-slate">A este correo y WhatsApp te enviamos la confirmación y cada avance.</p>
          <div className="mt-6 space-y-5">
            <Choice
              name="applicantType"
              value={contact.applicantType}
              onChange={(v) => {
                setC("applicantType", v as "persona" | "empresa");
                setC("documentType", v === "empresa" ? "NIT" : "CC");
              }}
              options={[{ value: "persona", label: "Persona natural" }, { value: "empresa", label: "Empresa" }]}
            />
            <div id="c-fullName">
              <Field label={contact.applicantType === "empresa" ? "Nombre de quien solicita" : "Nombre completo"} error={errors.fullName} htmlFor="in-name">
                <input id="in-name" autoComplete="name" value={contact.fullName} onChange={(e) => setC("fullName", e.target.value)} className="input" />
              </Field>
            </div>
            {contact.applicantType === "empresa" && (
              <Field label="Razón social" htmlFor="in-company" optional>
                <input id="in-company" autoComplete="organization" value={contact.company} onChange={(e) => setC("company", e.target.value)} className="input" />
              </Field>
            )}
            <div className="grid gap-5 sm:grid-cols-[0.9fr_1.1fr]">
              <Field label="Tipo de documento" htmlFor="in-doctype">
                <Select id="in-doctype" value={contact.documentType} onChange={(v) => setC("documentType", v as ContactInput["documentType"])}>
                  {documentTypes.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </Select>
              </Field>
              <div id="c-documentNumber">
                <Field label="Número de documento" error={errors.documentNumber} htmlFor="in-docnum">
                  <input id="in-docnum" value={contact.documentNumber} onChange={(e) => setC("documentNumber", e.target.value)} className="input" />
                </Field>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div id="c-email">
                <Field label="Correo electrónico" error={errors.email} htmlFor="in-email" hint="Lo usarás con el número de pedido para consultar el estado.">
                  <input id="in-email" type="email" autoComplete="email" value={contact.email} onChange={(e) => setC("email", e.target.value)} className="input" />
                </Field>
              </div>
              <div id="c-phone">
                <Field label="Celular / WhatsApp" error={errors.phone} htmlFor="in-phone">
                  <input id="in-phone" type="tel" autoComplete="tel" placeholder="+57 300 000 0000" value={contact.phone} onChange={(e) => setC("phone", e.target.value)} className="input" />
                </Field>
              </div>
            </div>
            <div id="c-city">
              <Field label="Ciudad o país de residencia" error={errors.city} htmlFor="in-city">
                <input id="in-city" autoComplete="address-level2" value={contact.city} onChange={(e) => setC("city", e.target.value)} className="input" />
              </Field>
            </div>
          </div>
        </section>

        {needsShipping && (
          <section className="rounded-xl bg-white p-6 shadow-card ring-1 ring-night/5 md:p-8" aria-labelledby="h-ship">
            <h2 id="h-ship" className="font-display text-xl font-bold">Dirección de entrega</h2>
            <p className="mt-1 text-sm text-slate">Para los documentos que recibirás en físico. El costo del envío se incluye en la cotización.</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div id="c-ship_recipient" className="sm:col-span-2">
                <Field label="¿Quién recibe?" error={errors.ship_recipient} htmlFor="in-rec">
                  <input id="in-rec" autoComplete="name" value={shipping.recipient} onChange={(e) => setS("recipient", e.target.value)} className="input" />
                </Field>
              </div>
              <div id="c-ship_address" className="sm:col-span-2">
                <Field label="Dirección" error={errors.ship_address} htmlFor="in-addr">
                  <input id="in-addr" autoComplete="street-address" placeholder="Calle, número, apartamento, barrio" value={shipping.address} onChange={(e) => setS("address", e.target.value)} className="input" />
                </Field>
              </div>
              <div id="c-ship_city">
                <Field label="Ciudad" error={errors.ship_city} htmlFor="in-scity">
                  <input id="in-scity" autoComplete="address-level2" value={shipping.city} onChange={(e) => setS("city", e.target.value)} className="input" />
                </Field>
              </div>
              <Field label="País" htmlFor="in-country">
                {international ? (
                  <input id="in-country" value={international.values.pais_entrega ?? ""} readOnly className="input bg-mist" />
                ) : (
                  <Select id="in-country" value={shipping.country} onChange={(v) => setS("country", v)}>
                    <option value="Colombia">Colombia</option>
                    {countries.filter((c) => c !== "Otro").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <div className="sm:col-span-2">
                <Field label="Indicaciones" htmlFor="in-notes" optional>
                  <input id="in-notes" value={shipping.notes} onChange={(e) => setS("notes", e.target.value)} className="input" placeholder="Ej.: portería, horario de entrega" />
                </Field>
              </div>
            </div>
          </section>
        )}

        {/* Honeypot oculto para bots */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label>
            No completar
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>
      </div>

      {/* Resumen y pago */}
      <aside className="space-y-5 lg:sticky lg:top-28">
        <div className="rounded-xl bg-white p-6 shadow-lift ring-1 ring-night/5 md:p-8">
          <h2 className="font-display text-xl font-bold">Resumen del pedido</h2>
          <dl className="mt-5 divide-y divide-line text-[0.9375rem]">
            {cart.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-4 py-2.5">
                <dt className="min-w-0 truncate text-night/85">{serviceName(i.service)}</dt>
                <dd className="shrink-0 tabular-nums text-night">
                  {(getPricing(i.service)?.verificationFee ?? 0) > 0 ? formatCOP(getPricing(i.service)!.verificationFee) : "—"}
                </dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 pt-4">
              <dt className="font-semibold text-night">{verificationTotal > 0 ? "Pagas hoy" : "Total hoy"}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-night">{formatCOP(verificationTotal)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-slate">
            {verificationTotal > 0
              ? "Pagas sólo la verificación. Cuando la entidad confirme la disponibilidad te enviamos el valor final, del que descontamos lo que pagas hoy."
              : "Enviar el pedido no tiene costo. Te enviamos la cotización y pagas en línea cuando la apruebes."}
          </p>

          <div className="mt-6 space-y-4 border-t border-line pt-6">
            <div id="c-dataConsent">
              <Check id="k-data" checked={consents.dataConsent} onChange={(v) => setConsents((c) => ({ ...c, dataConsent: v }))} error={errors.dataConsent}>
                Autorizo el tratamiento de mis datos para gestionar este pedido, conforme a la{" "}
                <Link href="/legal/tratamiento-de-datos" target="_blank" className="font-semibold text-night underline underline-offset-4">Política de tratamiento de datos</Link>.
              </Check>
            </div>
            <div id="c-termsConsent">
              <Check id="k-terms" checked={consents.termsConsent} onChange={(v) => setConsents((c) => ({ ...c, termsConsent: v }))} error={errors.termsConsent}>
                Acepto los <Link href="/legal/terminos-y-condiciones" target="_blank" className="font-semibold text-night underline underline-offset-4">términos</Link> y la{" "}
                <Link href="/legal/politica-de-devoluciones" target="_blank" className="font-semibold text-night underline underline-offset-4">política de devoluciones</Link>, y entiendo que el documento lo expide la entidad responsable.
              </Check>
            </div>
            <Check id="k-mkt" checked={consents.marketingConsent} onChange={(v) => setConsents((c) => ({ ...c, marketingConsent: v }))}>
              Quiero recibir novedades de NEXODOC (opcional).
            </Check>
          </div>

          {!apiReady && (
            <p className="mt-5 flex gap-2.5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
              <UiIcon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
              El envío en línea se habilita al conectar el sistema de pedidos. Al continuar te mostramos cómo enviarlo por otro canal.
            </p>
          )}

          <AnimatePresence>
            {status === "error" && (
              <motion.p role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 flex gap-2.5 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                <UiIcon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <Button type="submit" size="lg" disabled={busy || !cart.ready} className="w-full" magnetic={false}>
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {status === "sending" ? "Enviando pedido…" : status === "uploading" ? "Subiendo archivos…" : "Abriendo el pago seguro…"}
                </span>
              ) : verificationTotal > 0 ? (
                `Pagar ${formatCOP(verificationTotal)}`
              ) : (
                "Enviar pedido"
              )}
            </Button>
          </div>
        </div>
        <PaymentMethods compact />
      </aside>
    </form>
  );
}

function Success({ code, email, uploadFailed, payment }: { code: string; email: string; uploadFailed: number; payment: Created["payment"] }) {
  const pendingPayment = payment.required && payment.enabled;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease }}
      className="mx-auto max-w-2xl rounded-xl bg-white p-8 text-center shadow-lift ring-1 ring-night/5 md:p-14"
      role="status"
    >
      <svg viewBox="0 0 80 80" className="mx-auto h-20 w-20" aria-hidden="true">
        <motion.circle cx="40" cy="40" r="36" fill="none" stroke="#19B7B0" strokeWidth="4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease }} />
        <motion.path d="m25 41 10 10 21-22" fill="none" stroke="#10243A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.55, ease }} />
      </svg>
      <h2 className="mt-8 text-h2 font-extrabold">Recibimos tu pedido.</h2>
      <p className="mx-auto mt-4 inline-flex rounded-full bg-mist px-4 py-2 font-label font-semibold tabular-nums text-night">Pedido {code}</p>
      <p className="mx-auto mt-5 max-w-md text-slate">
        {pendingPayment
          ? "Falta el pago de verificación para que empecemos. Puedes hacerlo ahora desde el estado de tu pedido."
          : <>Te enviaremos la cotización a <strong className="text-night">{email}</strong>. Guarda el número de pedido para consultar su estado.</>}
      </p>
      {uploadFailed > 0 && (
        <p className="mx-auto mt-5 flex max-w-md gap-2.5 rounded-lg bg-amber-50 p-4 text-left text-sm text-amber-900">
          <UiIcon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
          {uploadFailed === 1 ? "Un archivo no se pudo subir." : `${uploadFailed} archivos no se pudieron subir.`} Te los pediremos por correo; no tienes que repetir el pedido.
        </p>
      )}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button href={`/estado?codigo=${code}`} arrow magnetic={false}>
          {pendingPayment ? "Pagar y ver mi pedido" : "Ver estado del pedido"}
        </Button>
        <Button href="/solicitar" variant="secondary" magnetic={false}>
          Solicitar otro documento
        </Button>
      </div>
    </motion.div>
  );
}

function NotConfigured({ items, fallback, onBack }: { items: CartItem[]; fallback: { whatsapp: string; email: string }; onBack: () => void }) {
  const summary =
    "Pedido NEXODOC\n" +
    items
      .map((i, n) => `${n + 1}. ${serviceName(i.service)}\n${summarize(getForm(i.service), i.values).map(([k, v]) => `   ${k}: ${v}`).join("\n")}`)
      .join("\n");
  const wa = fallback.whatsapp ? `${fallback.whatsapp.split("?")[0]}?text=${encodeURIComponent(summary)}` : "";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-lift ring-1 ring-night/5 md:p-12" role="status">
      <span className="grid h-12 w-12 place-items-center rounded-md bg-amber-50 text-amber-700">
        <UiIcon name="info" className="h-6 w-6" />
      </span>
      <h2 className="mt-6 font-display text-2xl font-bold">El envío en línea aún no está habilitado.</h2>
      <p className="mt-3 text-slate">
        Tu información no se ha enviado ni almacenado. {wa || fallback.email ? "Puedes enviarnos el pedido por estos canales:" : "Pronto habilitaremos este canal."}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {wa && <Button href={wa} variant="light" magnetic={false}>Enviar por WhatsApp</Button>}
        {fallback.email && (
          <Button href={`mailto:${fallback.email}?subject=${encodeURIComponent("Pedido de documentos")}&body=${encodeURIComponent(summary)}`} variant="secondary" magnetic={false}>
            Enviar por correo
          </Button>
        )}
        <button type="button" onClick={onBack} className="h-11 rounded-full px-5 font-label font-semibold text-night hover:bg-night/5">Volver al carrito</button>
      </div>
    </motion.div>
  );
}
