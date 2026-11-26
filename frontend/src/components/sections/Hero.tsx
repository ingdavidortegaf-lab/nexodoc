import { Button } from "@/components/ui/Button";
import { UiIcon } from "@/components/icons/UiIcon";
import { HeroIllustration } from "@/components/illustrations/HeroIllustration";
import { hero } from "@/lib/data/content";

/**
 * Portada. La entrada del texto es animación CSS (clases nx-rise / nx-word en
 * globals.css): se ve apenas carga la página, sin esperar al JavaScript. En
 * celulares lentos el titular aparecía 3–4 s tarde cuando dependía de Motion.
 */
export function Hero() {
  const words = hero.title.split(" ");
  const delay = (s: number) => ({ animationDelay: `${s}s` });

  return (
    <section className="bg-hero relative overflow-hidden pt-[72px]" aria-labelledby="hero-title">
      <div
        className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_70%_30%,black,transparent)]"
        aria-hidden="true"
      />
      <div className="container-site relative grid items-center gap-8 pb-16 pt-8 sm:gap-10 md:pb-24 md:pt-16 lg:grid-cols-[1.02fr_1fr] lg:gap-6 lg:pb-36 lg:pt-20">
        <div className="max-w-2xl">
          <p
            className="nx-rise inline-flex items-center gap-2.5 rounded-full bg-white/80 py-1.5 pl-1.5 pr-4 font-label text-sm font-medium text-night shadow-inset backdrop-blur"
            style={delay(0)}
          >
            <span className="shrink-0 rounded-full bg-night px-2.5 py-0.5 text-xs font-semibold text-white">LegalTech</span>
            <span className="leading-snug">{hero.eyebrow}</span>
          </p>

          <h1 id="hero-title" className="mt-6 text-display font-extrabold text-night sm:mt-7">
            {words.map((word, i) => (
              <span key={`${word}-${i}`} className="nx-word inline-block pr-[0.22em]" style={delay(0.05 + i * 0.045)}>
                {word}
              </span>
            ))}
          </h1>

          <p className="nx-rise mt-5 max-w-xl text-lead text-slate sm:mt-6" style={delay(0.4)}>
            {hero.description}
          </p>

          <div className="nx-rise mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center" style={delay(0.5)}>
            <Button href={hero.primaryCta.href} size="lg" arrow className="w-full sm:w-auto" magnetic={false}>
              {hero.primaryCta.label}
            </Button>
            <Button href={hero.secondaryCta.href} size="lg" variant="secondary" className="w-full sm:w-auto" magnetic={false}>
              {hero.secondaryCta.label}
            </Button>
          </div>

          <ul className="nx-rise mt-8 grid gap-3 sm:mt-9 sm:flex sm:flex-wrap sm:gap-x-6" style={delay(0.6)}>
            {hero.assurances.map((a) => (
              <li key={a} className="inline-flex items-center gap-2 text-[0.9375rem] font-medium text-night/80">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-soft text-teal-ink">
                  <UiIcon name="check" className="h-3 w-3" strokeWidth={2.6} />
                </span>
                {a}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] sm:max-w-[640px] lg:-mr-6">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
