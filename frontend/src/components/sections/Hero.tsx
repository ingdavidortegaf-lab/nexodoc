"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { UiIcon } from "@/components/icons/UiIcon";
import { HeroIllustration } from "@/components/illustrations/HeroIllustration";
import { hero } from "@/lib/data/content";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const words = hero.title.split(" ");
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease },
  });

  return (
    <section className="bg-hero relative overflow-hidden pt-[72px]" aria-labelledby="hero-title">
      <div
        className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_70%_30%,black,transparent)]"
        aria-hidden="true"
      />
      <div className="container-site relative grid items-center gap-10 pb-28 pt-12 md:pt-16 lg:grid-cols-[1.02fr_1fr] lg:gap-6 lg:pb-36 lg:pt-20">
        <div className="max-w-2xl">
          <motion.p
            {...fade(0)}
            className="inline-flex items-center gap-2.5 rounded-full bg-white/80 py-1.5 pl-1.5 pr-4 font-label text-sm font-medium text-night shadow-inset backdrop-blur"
          >
            <span className="shrink-0 rounded-full bg-night px-2.5 py-0.5 text-xs font-semibold text-white">LegalTech</span>
            {hero.eyebrow}
          </motion.p>

          <h1 id="hero-title" className="mt-7 text-display font-extrabold text-night">
            {words.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                className="inline-block pr-[0.22em]"
                initial={{ opacity: 0, y: reduce ? 0 : "0.45em", filter: reduce ? "none" : "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.75, delay: 0.1 + i * 0.055, ease }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p {...fade(0.55)} className="mt-6 max-w-xl text-lead text-slate">
            {hero.description}
          </motion.p>

          <motion.div {...fade(0.7)} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href={hero.primaryCta.href} size="lg" arrow>
              {hero.primaryCta.label}
            </Button>
            <Button href={hero.secondaryCta.href} size="lg" variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </motion.div>

          <motion.ul {...fade(0.85)} className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
            {hero.assurances.map((a) => (
              <li key={a} className="inline-flex items-center gap-2 text-[0.9375rem] font-medium text-night/80">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-teal-soft text-teal-ink">
                  <UiIcon name="check" className="h-3 w-3" strokeWidth={2.6} />
                </span>
                {a}
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="relative mx-auto w-full max-w-[640px] lg:-mr-6">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
