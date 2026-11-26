"use client";

import Link from "next/link";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { UiIcon } from "@/components/icons/UiIcon";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { categories, type Category } from "@/lib/data/categories";

type Tone = "night" | "soft" | "plain" | "navy";

/**
 * Catálogo en retícula editorial: dos piezas destacadas al inicio, seis
 * tarjetas de lectura rápida y un cierre amplio para empresas. Cada tono
 * cambia fondo, tipografía y gráfico de apoyo para evitar repetición.
 */
const layout: { span: string; tone: Tone }[] = [
  { span: "md:col-span-2", tone: "night" },
  { span: "md:row-span-1", tone: "soft" },
  { span: "", tone: "plain" },
  { span: "", tone: "plain" },
  { span: "", tone: "plain" },
  { span: "", tone: "plain" },
  { span: "", tone: "plain" },
  { span: "", tone: "plain" },
  { span: "", tone: "plain" },
  { span: "md:col-span-2 lg:col-span-2", tone: "navy" },
];

export function ServicesCatalog({ withHeading = true }: { withHeading?: boolean }) {
  return (
    <section id="servicios" className="section-y" aria-labelledby={withHeading ? "servicios-title" : undefined}>
      <div className="container-site">
        {withHeading && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              id="servicios-title"
              eyebrow="Catálogo de servicios"
              title="Diez frentes documentales, un solo lugar para gestionarlos."
              description="Cada servicio te dice qué necesitas, qué entidad lo expide y cómo se gestiona. Sin letra pequeña."
            />
            <Link
              href="/servicios"
              className="group inline-flex shrink-0 items-center gap-2 font-label font-semibold text-night"
            >
              Ver todo el catálogo
              <UiIcon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}

        <SwipeHint className={withHeading ? "mt-8" : ""} />
        <RevealGroup className={`nx-rail-md grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${withHeading ? "mt-4 md:mt-14" : "mt-4 md:mt-0"}`} stagger={0.06}>
          {categories.map((c, i) => (
            <RevealItem key={c.slug} className={layout[i]?.span ?? ""}>
              <CategoryCard category={c} tone={layout[i]?.tone ?? "plain"} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/** Indicación en celular de que la fila se desliza. */
export function SwipeHint({ className = "", breakpoint = "md" }: { className?: string; breakpoint?: "sm" | "md" }) {
  return (
    <p className={`flex items-center gap-2 font-label text-sm font-semibold text-slate ${breakpoint === "sm" ? "sm:hidden" : "md:hidden"} ${className}`}>
      Desliza para ver más
      <UiIcon name="arrowRight" className="h-4 w-4 animate-[nx-nudge_1.6s_ease-in-out_infinite] motion-reduce:animate-none" />
    </p>
  );
}

export function CategoryCard({ category, tone }: { category: Category; tone: Tone }) {
  const dark = tone === "night" || tone === "navy";
  const featured = tone === "night" || tone === "navy";
  const surface: Record<Tone, string> = {
    night: "bg-night text-white",
    navy: "bg-navy text-white",
    soft: "bg-teal-soft text-night",
    plain: "bg-white text-night ring-1 ring-line hover:ring-night/20",
  };

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const visible = featured ? category.services.slice(0, 4) : category.services.slice(0, 3);
  const more = category.services.length - visible.length;

  return (
    <article
      onPointerMove={onMove}
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl p-7 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-lift md:p-8 ${surface[tone]}`}
    >
      {/* Brillo que sigue al cursor */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), ${
            dark ? "rgb(25 183 176 / 0.16)" : "rgb(25 183 176 / 0.10)"
          }, transparent 70%)`,
        }}
        aria-hidden="true"
      />
      {featured && <CardArt tone={tone} />}

      <div className="relative flex items-start justify-between gap-4">
        <span
          className={`grid h-12 w-12 place-items-center rounded-md transition-all duration-500 ease-out-expo ${
            dark
              ? "bg-white/10 text-white ring-1 ring-white/15 group-hover:bg-teal group-hover:text-night"
              : tone === "soft"
                ? "bg-white text-night group-hover:bg-night group-hover:text-white"
                : "bg-mist text-night group-hover:bg-night group-hover:text-white"
          }`}
        >
          <CategoryIcon name={category.icon} className="h-6 w-6" accent={dark ? "#6FE6DE" : "#19B7B0"} />
        </span>
        <span className={`font-label text-xs font-semibold ${dark ? "text-white/50" : "text-slate"}`}>
          {category.services.length} trámites
        </span>
      </div>

      <h3 className={`relative mt-6 font-display font-bold tracking-[-0.02em] ${featured ? "text-2xl md:text-[1.75rem]" : "text-h3"} ${dark ? "text-white" : ""}`}>
        <Link href={`/servicios/${category.slug}`} className="after:absolute after:inset-0 after:content-['']">
          {category.name}
        </Link>
      </h3>
      <p className={`relative mt-3 ${featured ? "max-w-md text-lead" : "text-[0.9375rem]"} ${dark ? "text-white/70" : "text-slate"}`}>
        {category.tagline}
      </p>

      <ul className={`relative mt-6 space-y-2 text-[0.9375rem] ${featured ? "md:max-w-md" : ""}`}>
        {visible.map((s) => (
          <li key={s.slug} className="flex items-start gap-2.5">
            <span className={`mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full ${dark ? "bg-teal-300" : "bg-teal"}`} aria-hidden="true" />
            <span className={dark ? "text-white/85" : "text-night/85"}>{s.name}</span>
          </li>
        ))}
        {more > 0 && <li className={`pl-4 text-sm ${dark ? "text-white/50" : "text-slate"}`}>y {more} más</li>}
      </ul>

      <span
        className={`relative mt-auto inline-flex items-center gap-2 pt-8 font-label text-[0.9375rem] font-semibold ${
          dark ? "text-teal-300" : "text-night"
        }`}
      >
        Ver servicios
        <UiIcon name="arrowRight" className="h-4 w-4 transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5" />
      </span>
    </article>
  );
}

/** Gráfico lineal de fondo para las tarjetas destacadas. */
function CardArt({ tone }: { tone: Tone }) {
  if (tone === "night") {
    return (
      <svg
        className="pointer-events-none absolute -bottom-6 -right-6 hidden h-64 w-64 text-white/10 transition-transform duration-700 ease-out-expo group-hover:-translate-y-2 group-hover:rotate-[-3deg] md:block"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        aria-hidden="true"
      >
        <rect x="70" y="30" width="96" height="124" rx="10" transform="rotate(8 118 92)" />
        <rect x="48" y="44" width="96" height="124" rx="10" />
        <path d="M64 72h52M64 86h64M64 100h40M64 114h56" />
        <circle cx="120" cy="146" r="14" stroke="#19B7B0" strokeOpacity="0.6" />
        <path d="m113 146 5 5 9-10" stroke="#19B7B0" strokeOpacity="0.6" />
      </svg>
    );
  }
  return (
    <svg
      className="pointer-events-none absolute -bottom-10 -right-4 hidden h-60 w-80 text-white/10 transition-transform duration-700 ease-out-expo group-hover:-translate-y-2 md:block"
      viewBox="0 0 320 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <rect x="40" y="60" width="96" height="120" rx="8" />
      <rect x="150" y="40" width="96" height="140" rx="8" />
      <rect x="96" y="100" width="96" height="120" rx="8" stroke="#19B7B0" strokeOpacity="0.55" />
      <path d="M56 84h60M56 98h44M166 64h60M166 78h48M112 124h60M112 138h44" />
    </svg>
  );
}
