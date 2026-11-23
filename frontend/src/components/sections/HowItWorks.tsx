"use client";

import { AnimatePresence, motion, useInView, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { UiIcon, type UiIconName } from "@/components/icons/UiIcon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { processSteps } from "@/lib/data/content";

/** Estado que ve el cliente en su portal en cada paso del proceso. */
const stepStatus: { label: string; icon: UiIconName; note: string }[] = [
  { label: "Servicio elegido", icon: "search", note: "Requisitos y entidad visibles antes de empezar" },
  { label: "Recibida", icon: "file", note: "Te enviamos el código de tu solicitud" },
  { label: "En revisión", icon: "shield", note: "Un gestor valida que todo esté completo" },
  { label: "En cotización", icon: "layers", note: "Derechos de la entidad + honorario, por separado" },
  { label: "Confirmada", icon: "check", note: "Pago verificado, iniciamos la gestión" },
  { label: "En gestión", icon: "route", note: "Radicado ante la entidad, con seguimiento" },
  { label: "Documento disponible", icon: "upload", note: "Descarga privada o envío físico" },
];

export function HowItWorks() {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 70%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });

  return (
    <section id="como-funciona" className="section-y relative bg-mist" aria-labelledby="como-title">
      <div className="container-site grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="como-title"
            eyebrow="Cómo funciona"
            title="Siete pasos claros, de tu necesidad al documento."
            description="Nada empieza sin que conozcas los requisitos y el valor. Y cuando avanza, lo ves."
          />
          <StatusPanel active={active} />
        </div>

        <ol ref={listRef} className="relative">
          <div className="absolute bottom-6 left-[23px] top-6 w-px bg-line-strong" aria-hidden="true" />
          <motion.div
            className="absolute left-[23px] top-6 w-px origin-top bg-teal"
            style={{ scaleY: progress, bottom: 24 }}
            aria-hidden="true"
          />
          {processSteps.map((step, i) => (
            <Step key={step.title} index={i} title={step.title} text={step.text} onActive={setActive} active={active >= i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Step({
  index,
  title,
  text,
  active,
  onActive,
}: {
  index: number;
  title: string;
  text: string;
  active: boolean;
  onActive: (i: number) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <li ref={ref} className="relative flex gap-6 pb-12 last:pb-0">
      <span
        className={`relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full font-label text-base font-bold transition-all duration-500 ease-out-expo ${
          active ? "bg-night text-white shadow-[0_0_0_6px_rgb(25_183_176/0.18)]" : "bg-white text-slate ring-1 ring-line-strong"
        }`}
      >
        {index + 1}
      </span>
      <div className={`pt-2 transition-opacity duration-500 ${active ? "opacity-100" : "opacity-55"}`}>
        <h3 className="text-h3 font-bold">{title}</h3>
        <p className="mt-2 max-w-md text-slate">{text}</p>
      </div>
    </li>
  );
}

function StatusPanel({ active }: { active: number }) {
  const s = stepStatus[active];
  const pct = Math.round(((active + 1) / stepStatus.length) * 100);
  return (
    <div className="mt-10 hidden rounded-xl bg-white p-6 shadow-card ring-1 ring-night/5 md:block">
      <div className="flex items-center justify-between">
        <p className="font-label text-sm font-semibold text-slate">Estado de tu solicitud</p>
        <p className="font-label text-sm font-semibold tabular-nums text-night">{pct}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del ejemplo">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="relative mt-6 h-[68px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center gap-4"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-teal-soft text-teal-ink">
              <UiIcon name={s.icon} className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-display text-lg font-bold text-night">{s.label}</span>
              <span className="block text-sm text-slate">{s.note}</span>
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
