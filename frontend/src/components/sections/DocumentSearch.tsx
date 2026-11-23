"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useId, useMemo, useRef, useState } from "react";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { UiIcon } from "@/components/icons/UiIcon";
import { Reveal } from "@/components/ui/Reveal";
import { categories, modalityLabel } from "@/lib/data/categories";
import { popularSearches, searchServices } from "@/lib/search";

/**
 * Buscador "¿Qué documento necesitas?" con autocompletado accesible
 * (patrón combobox de WAI-ARIA) y filtro por categoría.
 */
export function DocumentSearch() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const router = useRouter();

  const results = useMemo(() => searchServices(query, category, 7), [query, category]);
  const showList = focused && (query.trim().length > 0 || category !== null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      router.push(`/solicitar/${results[active].slug}`);
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  return (
    <section id="personas" className="relative z-10 -mt-20 lg:-mt-24" aria-labelledby="buscador-title">
      <div className="container-site">
        <Reveal className="rounded-xl bg-white p-6 shadow-lift ring-1 ring-night/5 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.6fr] lg:items-start lg:gap-12">
            <div>
              <h2 id="buscador-title" className="text-[1.75rem] font-bold leading-tight tracking-[-0.025em] md:text-[2rem]">
                ¿Qué documento necesitas?
              </h2>
              <p className="mt-3 text-slate">
                Escríbelo como lo dirías. Te mostramos el trámite, la entidad responsable y cómo se gestiona.
              </p>
            </div>

            <div>
              <div className="relative">
                <label htmlFor="buscador-documentos" className="sr-only">
                  Buscar documento por nombre
                </label>
                <div
                  className={`flex items-center gap-3 rounded-lg bg-mist px-5 ring-1 transition-all duration-300 ease-out-expo ${
                    focused ? "bg-white shadow-card ring-teal" : "ring-transparent"
                  }`}
                >
                  <UiIcon name="search" className="h-5 w-5 shrink-0 text-slate" />
                  <input
                    ref={inputRef}
                    id="buscador-documentos"
                    type="search"
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
                    autoComplete="off"
                    placeholder="Ej.: certificado de tradición, copia de escritura, apostilla…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActive(0);
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 160)}
                    onKeyDown={onKeyDown}
                    className="h-16 w-full bg-transparent text-base text-night outline-none placeholder:text-slate/80 md:text-lg"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        inputRef.current?.focus();
                      }}
                      className="grid h-8 w-8 place-items-center rounded-full text-slate hover:bg-night/5"
                      aria-label="Borrar búsqueda"
                    >
                      <UiIcon name="close" className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showList && (
                    <motion.ul
                      id={listId}
                      role="listbox"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-x-0 top-[calc(100%+8px)] z-20 max-h-[26rem] overflow-y-auto rounded-lg bg-white p-2 shadow-lift ring-1 ring-night/5"
                    >
                      {results.length === 0 ? (
                        <li className="px-4 py-6 text-center text-slate">
                          No encontramos «{query}». Cuéntanos qué necesitas en el{" "}
                          <Link href="/solicitar" className="font-semibold text-teal-ink underline underline-offset-4">
                            formulario de solicitud
                          </Link>
                          .
                        </li>
                      ) : (
                        results.map((r, i) => (
                          <li
                            key={r.slug}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === active}
                            onMouseEnter={() => setActive(i)}
                          >
                            <Link
                              href={`/solicitar/${r.slug}`}
                              className={`flex items-start gap-4 rounded-md px-4 py-3 transition-colors ${
                                i === active ? "bg-mist" : ""
                              }`}
                            >
                              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-night ring-1 ring-line">
                                <CategoryIcon name={r.category.icon} className="h-5 w-5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-night">{r.name}</span>
                                <span className="mt-0.5 block text-sm text-slate">
                                  {r.category.shortName} · {r.entity}
                                </span>
                              </span>
                              <span className="hidden shrink-0 self-center rounded-full bg-teal-soft px-2.5 py-1 font-label text-xs font-semibold text-teal-ink md:inline">
                                {modalityLabel[r.modality]}
                              </span>
                            </Link>
                          </li>
                        ))
                      )}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>

              <div
                className="-mx-6 mt-5 flex items-center gap-2 overflow-x-auto px-6 pb-1.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
                role="group"
                aria-label="Filtrar por categoría"
              >
                <span className="mr-1 shrink-0 font-label text-sm font-semibold text-slate">Categorías:</span>
                {categories.map((c) => {
                  const selected = category === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setCategory(selected ? null : c.slug);
                        setActive(0);
                        inputRef.current?.focus();
                      }}
                      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-label text-sm font-medium transition-all duration-300 ease-out-expo ${
                        selected ? "bg-night text-white" : "bg-white text-night ring-1 ring-line hover:ring-night/30"
                      }`}
                    >
                      <CategoryIcon
                        name={c.icon}
                        className="h-4 w-4"
                        accent={selected ? "#6FE6DE" : "#19B7B0"}
                      />
                      {c.shortName}
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 text-sm text-slate">
                Más buscados:{" "}
                {popularSearches.map((p, i) => (
                  <span key={p}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(p);
                        setCategory(null);
                        inputRef.current?.focus();
                      }}
                      className="font-medium text-night underline decoration-line underline-offset-4 transition-colors hover:decoration-teal"
                    >
                      {p}
                    </button>
                    {i < popularSearches.length - 1 && <span aria-hidden="true"> · </span>}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
