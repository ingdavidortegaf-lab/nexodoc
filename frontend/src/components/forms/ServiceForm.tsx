"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { UiIcon } from "@/components/icons/UiIcon";
import { Button } from "@/components/ui/Button";
import { Choice, DynamicField, Field, Select } from "@/components/forms/fields";
import { getForm, initialValues, isVisible, validateItem } from "@/lib/data/forms";
import { countries } from "@/lib/data/geo";
import { formatCOP, getPricing, zoneLabel, type DeliveryZone } from "@/lib/data/pricing";
import { useCart } from "@/lib/cart";

const ease = [0.22, 1, 0.36, 1] as const;

export function ServiceForm({ service, serviceName }: { service: string; serviceName: string }) {
  const spec = useMemo(() => getForm(service), [service]);
  const price = getPricing(service);
  const cart = useCart();
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const editId = params.get("editar");

  const [values, setValues] = useState<Record<string, string>>(() => initialValues(spec));
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);
  const [showExample, setShowExample] = useState(false);

  // Edición de un documento que ya está en el carrito
  useEffect(() => {
    if (!editId || !cart.ready) return;
    const item = cart.items.find((i) => i.id === editId && i.service === service);
    if (item) {
      setValues(item.values);
      setFiles(cart.files[editId] ?? {});
    }
  }, [editId, cart.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: "" } : e));
    setAdded(false);
  };
  const setFileList = (name: string, list: File[]) => {
    setFiles((f) => ({ ...f, [name]: list }));
    setErrors((e) => (e[name] ? { ...e, [name]: "" } : e));
  };

  const submit = (goToCart: boolean) => {
    const counts = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.length]));
    const errs = validateItem(spec, values, counts);
    if (values.entrega === "internacional" && !values.pais_entrega) errs.pais_entrega = "Elige el país de entrega.";
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      const first = Object.keys(errs).find((k) => errs[k]);
      document.querySelector<HTMLElement>(`[id^="f-${first}-"], #f-${first}`)?.focus();
      return;
    }
    if (editId && cart.items.some((i) => i.id === editId)) {
      cart.update(editId, values, files);
      router.push("/carrito");
      return;
    }
    cart.add({ service, values }, files);
    if (goToCart) return router.push("/carrito");
    setAdded(true);
    setValues(initialValues(spec));
    setFiles({});
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const fromFor = (zone: DeliveryZone) => {
    const f = price?.from;
    if (f === undefined) return undefined;
    return typeof f === "number" ? f : f[zone];
  };

  const visible = spec.fields.filter((f) => isVisible(f, values));

  return (
    <div className="rounded-xl bg-white p-6 shadow-lift ring-1 ring-night/5 md:p-10">
      <AnimatePresence>
        {added && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease }}
            className="mb-8 flex flex-col gap-4 rounded-lg bg-teal-soft p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-center gap-3 font-semibold text-night">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal text-night">
                <UiIcon name="check" className="h-4 w-4" strokeWidth={3} />
              </span>
              Agregamos {serviceName.toLowerCase()} a tu carrito.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button href="/carrito" size="md" magnetic={false} arrow>
                Ir al carrito ({cart.items.length})
              </Button>
              <Button href="/solicitar" variant="secondary" magnetic={false}>
                Otro documento
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-slate">{spec.intro}</p>
      {spec.example && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowExample((v) => !v)}
            aria-expanded={showExample}
            className="inline-flex items-center gap-2 rounded-full bg-mist px-4 py-2 font-label text-sm font-semibold text-night hover:bg-line"
          >
            <UiIcon name="info" className="h-4 w-4 text-teal-ink" />
            {spec.example.title}
            <UiIcon name="chevronDown" className={`h-4 w-4 transition-transform ${showExample ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {showExample && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease }}
                className="overflow-hidden"
              >
                <ul className="mt-3 space-y-2 rounded-lg bg-mist p-5 text-[0.9375rem] text-night/85">
                  {spec.example.items.map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <UiIcon name="check" className="mt-1 h-4 w-4 shrink-0 text-teal-ink" />
                      {t}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
        className="mt-8"
      >
        <div className="grid gap-x-5 gap-y-6 md:grid-cols-2">
          {visible.map((f) => (
            <div key={f.name} className={f.half ? "" : "md:col-span-2"}>
              <DynamicField spec={f} values={values} error={errors[f.name]} files={files[f.name] ?? []} onChange={set} onFiles={setFileList} />
            </div>
          ))}

          <div className="md:col-span-2">
            <Field label="¿Cómo deseas recibirlo?" error={errors.entrega} as="legend">
              <Choice
                name="entrega"
                value={values.entrega ?? ""}
                onChange={(v) => set("entrega", v)}
                options={spec.delivery.map((z) => {
                  const from = fromFor(z);
                  return { value: z, label: zoneLabel[z], detail: from ? `desde ${formatCOP(from)}` : undefined };
                })}
              />
            </Field>
          </div>
          {values.entrega === "internacional" && (
            <div className="md:col-span-2">
              <Field label="País de entrega" error={errors.pais_entrega} htmlFor="f-pais_entrega">
                <Select id="f-pais_entrega" value={values.pais_entrega ?? ""} onChange={(v) => set("pais_entrega", v)} placeholder="Selecciona el país">
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
        </div>

        <div className="mt-10 rounded-lg bg-mist p-5 text-[0.9375rem]">
          {price && price.verificationFee > 0 ? (
            <p className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold text-night">Valor de verificación</span>
              <span className="font-display text-xl font-bold tabular-nums text-night">{formatCOP(price.verificationFee)}</span>
            </p>
          ) : (
            <p className="font-semibold text-night">Sin pago para enviar la solicitud</p>
          )}
          <p className="mt-2 text-slate">
            {spec.note}
            {price && price.verificationFee > 0 && " El valor de verificación se descuenta del total."}
          </p>
          {price?.note && <p className="mt-2 text-slate">{price.note}</p>}
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => {
              setValues(initialValues(spec));
              setFiles({});
              setErrors({});
            }}
            className="h-11 rounded-full px-5 font-label font-semibold text-night ring-1 ring-line-strong hover:bg-night/5"
          >
            Limpiar
          </button>
          <div className="flex flex-col gap-3 sm:flex-row">
            {editId ? (
              <Button type="button" onClick={() => submit(true)} magnetic={false} arrow>
                Guardar cambios
              </Button>
            ) : (
              <>
                <Button type="submit" variant="secondary" magnetic={false}>
                  <span className="inline-flex items-center gap-2">
                    <UiIcon name="plus" className="h-4 w-4" /> Agregar al carrito
                  </span>
                </Button>
                <Button type="button" onClick={() => submit(true)} magnetic={false} arrow>
                  Solicitar ahora
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-slate sm:text-right">
          ¿Necesitas varios documentos? Agrégalos al carrito y paga todo en un solo pedido.{" "}
          <Link href="/carrito" className="font-semibold text-teal-ink underline underline-offset-4">Ver carrito</Link>
        </p>
      </form>
    </div>
  );
}
