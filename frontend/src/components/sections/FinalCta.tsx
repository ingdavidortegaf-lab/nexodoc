import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { finalCta } from "@/lib/data/content";

export function FinalCta() {
  return (
    <section className="pb-24 md:pb-32" aria-labelledby="cta-title">
      <div className="container-site">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy to-night px-6 py-16 text-center text-white md:px-16 md:py-24">
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2"
            viewBox="0 0 900 900"
            fill="none"
            aria-hidden="true"
          >
            {[160, 240, 320, 400].map((r, i) => (
              <circle key={r} cx="450" cy="450" r={r} stroke="#FFFFFF" strokeOpacity={0.07 - i * 0.012} strokeDasharray={i % 2 ? "2 8" : undefined} />
            ))}
            <circle cx="450" cy="50" r="5" fill="#19B7B0" className="nx-twinkle" />
            <circle cx="130" cy="450" r="4" fill="#19B7B0" className="nx-twinkle nx-d2" />
            <circle cx="790" cy="560" r="4" fill="#19B7B0" className="nx-twinkle nx-d1" />
          </svg>
          <div className="relative mx-auto max-w-2xl">
            <h2 id="cta-title" className="text-h2 font-extrabold text-white">
              {finalCta.title}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lead text-white/70">{finalCta.text}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={finalCta.cta.href} variant="light" size="lg" arrow>
                {finalCta.cta.label}
              </Button>
              <Button href="/servicios" variant="outline-light" size="lg">
                Ver servicios
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
