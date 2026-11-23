import Link from "next/link";
import { Accordion } from "@/components/ui/Accordion";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UiIcon } from "@/components/icons/UiIcon";
import { faqs } from "@/lib/data/content";

export function Faq() {
  return (
    <section id="preguntas" className="section-y" aria-labelledby="faq-title">
      <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="faq-title"
            eyebrow="Preguntas frecuentes"
            title="Lo que conviene saber antes de solicitar."
          />
          <Reveal delay={0.1} className="mt-8 rounded-xl bg-night p-6 text-white">
            <p className="font-display text-lg font-bold">¿Tu caso es particular?</p>
            <p className="mt-2 text-[0.9375rem] text-white/70">
              Descríbelo en el formulario y un gestor te dirá si es viable y qué necesitas, antes de cualquier pago.
            </p>
            <Link href="/solicitar" className="mt-5 inline-flex items-center gap-2 font-label font-semibold text-teal-300 hover:text-white">
              Contar mi caso <UiIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
        <Reveal delay={0.05}>
          <Accordion items={faqs} />
        </Reveal>
      </div>
    </section>
  );
}
