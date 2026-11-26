"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UiIcon, type UiIconName } from "@/components/icons/UiIcon";
import { businessAudiences, businessFeatures } from "@/lib/data/content";

const featureIcons: UiIconName[] = ["clock", "layers", "file", "upload", "route", "user"];

/** Ejemplo ilustrativo de un lote empresarial (datos ficticios). */
const batch = [
  { ref: "50C-1847263", doc: "Tradición y libertad", status: "Documento disponible", tone: "done" },
  { ref: "50N-2093381", doc: "Tradición y libertad", status: "Documento disponible", tone: "done" },
  { ref: "470-118204", doc: "Tradición y libertad", status: "En gestión", tone: "progress" },
  { ref: "001-994512", doc: "Certificado catastral", status: "En espera de la entidad", tone: "wait" },
  { ref: "50S-40721955", doc: "Paz y salvo predial", status: "En cotización", tone: "info" },
] as const;

const toneClass = {
  done: "bg-teal/15 text-teal-300",
  progress: "bg-white/10 text-white",
  wait: "bg-amber-400/15 text-amber-200",
  info: "bg-sky-400/15 text-sky-200",
};

export function BusinessSection() {
  const reduce = useReducedMotion();
  return (
    <section id="empresas" className="section-y relative overflow-hidden bg-night text-white" aria-labelledby="empresas-title">
      <div className="bg-dots-light pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-teal/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="container-site relative">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <SectionHeading
            id="empresas-title"
            tone="dark"
            eyebrow="Servicios para empresas"
            title="Su operación documental, resuelta por un equipo dedicado."
            description="Para organizaciones que solicitan documentos cada semana y no pueden perder tiempo en filas, portales y seguimientos."
          />
          <Reveal delay={0.1} className="flex flex-col gap-6 lg:items-end">
            <ul className="flex flex-wrap gap-2 lg:justify-end" aria-label="Sectores que atendemos">
              {businessAudiences.map((a) => (
                <li key={a} className="rounded-full px-3.5 py-1.5 font-label text-sm font-medium text-white/85 ring-1 ring-white/15">
                  {a}
                </li>
              ))}
            </ul>
            <Button href="/solicitar?tipo=empresa" variant="light" size="lg" arrow className="w-full sm:w-auto" magnetic={false}>
              Solicitar una propuesta empresarial
            </Button>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-6 md:mt-16 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          {/* Tablero de lote: muestra cómo se ve una solicitud masiva */}
          <Reveal className="rounded-xl bg-white/[0.04] p-5 ring-1 ring-white/10 backdrop-blur md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-label text-sm text-white/55">Lote · Inmobiliaria</p>
                <p className="font-display text-lg font-bold">5 inmuebles · 3 tipos de documento</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-teal/15 px-3 py-1 font-label text-sm font-semibold text-teal-300">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-300" /> 40 % completado
              </span>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-teal"
                initial={{ width: reduce ? "40%" : 0 }}
                whileInView={{ width: "40%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              />
            </div>
            <ul className="mt-6 divide-y divide-white/10">
              {batch.map((row, i) => (
                <motion.li
                  key={row.ref}
                  initial={{ opacity: 0, x: reduce ? 0 : -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5"
                >
                  <span className="min-w-0">
                    <span className="block font-label text-[0.9375rem] font-semibold tabular-nums">{row.ref}</span>
                    <span className="block text-sm text-white/55">{row.doc}</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 font-label text-xs font-semibold ${toneClass[row.tone]}`}>
                    {row.status}
                  </span>
                </motion.li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-white/40">Ejemplo ilustrativo con datos ficticios.</p>
          </Reveal>

          <RevealGroup className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
            {businessFeatures.map((f, i) => (
              <RevealItem key={f.title} className="group bg-night p-4 transition-colors duration-500 hover:bg-navy sm:p-6 md:p-7">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-white/5 text-teal-300 ring-1 ring-white/10 transition-colors group-hover:bg-teal group-hover:text-night">
                  <UiIcon name={featureIcons[i]} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold leading-snug text-white sm:mt-5 sm:text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-white/65 sm:text-[0.9375rem]">{f.text}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
