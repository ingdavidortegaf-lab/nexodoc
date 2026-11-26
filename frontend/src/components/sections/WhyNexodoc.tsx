import { Counter } from "@/components/ui/Counter";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UiIcon, type UiIconName } from "@/components/icons/UiIcon";
import { pillars, stats } from "@/lib/data/content";

const pillarIcons: UiIconName[] = ["layers", "route", "pin", "cpu"];

export function WhyNexodoc() {
  return (
    <section id="nosotros" className="section-y" aria-labelledby="nosotros-title">
      <div className="container-site">
        <div className="grid gap-8 md:gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <SectionHeading
              id="nosotros-title"
              eyebrow="Por qué elegir NEXODOC"
              title="Una forma más clara de resolver tus trámites documentales."
              description="Somos una empresa colombiana independiente. No reemplazamos a las entidades: te conectamos con ellas, ordenamos el proceso y respondemos por cada paso."
            />
            <Reveal delay={0.15} className="mt-10 rounded-xl border border-line bg-mist/60 p-6">
              <p className="flex items-start gap-3 text-[0.9375rem] text-night/80">
                <UiIcon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-teal-ink" />
                <span>
                  <strong className="font-semibold text-night">Transparencia primero.</strong> Si un documento es gratuito en su
                  canal oficial o puedes obtenerlo tú mismo en minutos, te lo decimos antes de cotizar.
                </span>
              </p>
            </Reveal>
          </div>

          <RevealGroup className="nx-rail-sm grid gap-4 sm:grid-cols-2">
            {pillars.map((p, i) => (
              <RevealItem
                key={p.title}
                className="group rounded-xl bg-white p-6 shadow-card ring-1 ring-night/5 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="relative grid h-12 w-12 place-items-center rounded-md bg-night text-white">
                  <UiIcon name={pillarIcons[i]} className="h-6 w-6" />
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-teal ring-4 ring-white transition-transform duration-500 group-hover:scale-125" />
                </span>
                <h3 className="mt-6 text-h3 font-bold">{p.title}</h3>
                <p className="mt-3 text-[0.9375rem] text-slate">{p.text}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <Reveal className="mt-10 grid grid-cols-2 gap-px md:mt-16 overflow-hidden rounded-xl bg-line ring-1 ring-line lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white px-5 py-6 md:px-8 md:py-10">
              <p className="font-display text-[clamp(2.25rem,1.6rem+2.4vw,3.5rem)] font-extrabold leading-none tracking-[-0.04em] text-night">
                <Counter value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-3 font-label text-sm font-medium text-slate">{s.label}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
