"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { UiIcon } from "@/components/icons/UiIcon";
import { categories } from "@/lib/data/categories";
import { serviceForms } from "@/lib/data/forms";
import { formatCOP, minFrom } from "@/lib/data/pricing";
import { searchServices } from "@/lib/search";

export function ServicePicker({ initialCategory }: { initialCategory: string | null }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(initialCategory);

  const groups = useMemo(() => {
    if (query.trim().length > 1) {
      const hits = new Set(searchServices(query, category, 60).map((r) => r.slug));
      return categories
        .map((c) => ({ ...c, services: c.services.filter((s) => hits.has(s.slug)) }))
        .filter((c) => c.services.length);
    }
    return category ? categories.filter((c) => c.slug === category) : categories;
  }, [query, category]);

  return (
    <div id="catalogo" className="scroll-mt-28">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-md">
          <span className="sr-only">Buscar un documento</span>
          <UiIcon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca: registro civil, escritura, apostilla…"
            className="input pl-12"
          />
        </label>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            onClick={() => setCategory(null)}
            aria-pressed={!category}
            className={`shrink-0 rounded-full px-4 py-2 font-label text-sm font-semibold ring-1 transition-colors ${!category ? "bg-night text-white ring-night" : "bg-white text-night ring-line hover:ring-night/30"}`}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug === category ? null : c.slug)}
              aria-pressed={category === c.slug}
              className={`shrink-0 rounded-full px-4 py-2 font-label text-sm font-semibold ring-1 transition-colors ${category === c.slug ? "bg-night text-white ring-night" : "bg-white text-night ring-line hover:ring-night/30"}`}
            >
              {c.shortName}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mt-10 rounded-xl bg-mist p-8 text-center">
          <p className="font-semibold text-night">No encontramos «{query}».</p>
          <p className="mt-2 text-slate">Descríbenos lo que necesitas y lo gestionamos.</p>
          <Link href="/solicitar/otro" className="mt-5 inline-flex items-center gap-2 font-label font-semibold text-teal-ink underline underline-offset-4">
            Solicitar otro documento <UiIcon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {groups.map((c) => (
            <section key={c.slug} aria-labelledby={`g-${c.slug}`}>
              <h3 id={`g-${c.slug}`} className="flex items-center gap-3 font-display text-lg font-bold">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-night text-white">
                  <CategoryIcon name={c.icon} className="h-5 w-5" accent="#6FE6DE" />
                </span>
                {c.name}
              </h3>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {c.services.map((s) => {
                  const from = minFrom(s.slug);
                  const guided = Boolean(serviceForms[s.slug]);
                  return (
                    <li key={s.slug}>
                      <Link
                        href={`/solicitar/${s.slug}`}
                        className="group flex h-full flex-col rounded-lg bg-white p-5 ring-1 ring-line transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-card hover:ring-night/20"
                      >
                        <span className="font-semibold text-night">{s.name}</span>
                        <span className="mt-1.5 line-clamp-2 text-sm text-slate">{s.summary}</span>
                        <span className="mt-auto flex items-center justify-between gap-3 pt-4 font-label text-sm">
                          <span className="text-slate">
                            {from ? (
                              <>Desde <strong className="tabular-nums text-night">{formatCOP(from)}</strong></>
                            ) : guided ? (
                              "Formulario guiado"
                            ) : (
                              "Según cotización"
                            )}
                          </span>
                          <UiIcon name="arrowRight" className="h-4 w-4 text-night transition-transform group-hover:translate-x-1" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
