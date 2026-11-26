import Link from "next/link";
import { UiIcon } from "@/components/icons/UiIcon";
import { DocIllustration, serviceArt } from "@/components/illustrations/DocIllustrations";
import { SwipeHint } from "@/components/sections/ServicesCatalog";
import { allServices } from "@/lib/data/categories";
import { formatCOP, getPricing, minFrom, zoneLabel, type DeliveryZone } from "@/lib/data/pricing";

/** Los más solicitados, con su formulario guiado y precio de referencia. */
export const featuredServices = [
  "registro-civil-de-nacimiento",
  "copia-escritura-publica",
  "certificado-de-tradicion-y-libertad",
  "apostilla-de-documentos",
  "traduccion-oficial",
  "registro-civil-de-matrimonio",
];

export function PopularGrid() {
  const top = featuredServices.map((slug) => allServices.find((s) => s.slug === slug)).filter((s) => s !== undefined);
  return (
    <>
      <SwipeHint breakpoint="sm" className="mb-3" />
      <ul className="nx-rail-sm grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((s) => {
          const p = getPricing(s.slug);
          const from = minFrom(s.slug);
          const zones = p?.from && typeof p.from === "object" ? (Object.entries(p.from) as [DeliveryZone, number][]) : [];
          return (
            <li key={s.slug}>
              <Link
                href={`/solicitar/${s.slug}`}
                className="group flex h-full flex-col rounded-xl bg-white p-6 shadow-card ring-1 ring-night/5 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-lift"
              >
                {serviceArt[s.slug] && (
                  <DocIllustration art={serviceArt[s.slug]} className="mb-5 h-auto w-full rounded-lg transition-transform duration-500 ease-out-expo group-hover:scale-[1.02]" />
                )}
                <span className="font-label text-xs font-semibold uppercase tracking-wider text-teal-ink">{s.category.shortName}</span>
                <span className="mt-2 font-display text-lg font-bold text-night">{s.name}</span>
                <span className="mt-2 text-sm text-slate">{s.summary}</span>
                <span className="mt-auto block pt-5">
                  <span className="block border-t border-line pt-4">
                    {from ? (
                      <>
                        <span className="font-label text-xs font-semibold uppercase tracking-wider text-slate">Desde</span>
                        <span className="block font-display text-2xl font-extrabold tabular-nums text-night">{formatCOP(from)}</span>
                        {zones.length > 1 && (
                          <span className="mt-1 block text-xs text-slate">
                            {zones.map(([z, v]) => `${zoneLabel[z]}: ${formatCOP(v)}`).join(" · ")}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="font-label text-sm font-semibold text-slate">Valor según disponibilidad</span>
                    )}
                  </span>
                  <span className="mt-5 inline-flex items-center gap-2 font-label font-semibold text-night">
                    Solicitar <UiIcon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-slate">
        Valores de referencia. El valor final se confirma en tu pedido antes de pagar el saldo.
      </p>
    </>
  );
}

/** Sección de la landing: más solicitados + consulta de pedido. */
export function PopularDocuments() {
  return (
    <section id="mas-solicitados" className="section-y bg-mist/60">
      <div className="container-site">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-label text-sm font-semibold text-teal-ink">Pide en línea, paga con PSE</p>
            <h2 className="mt-3 text-h2 font-bold">Los documentos más solicitados</h2>
            <p className="mt-4 text-lead text-slate">Formulario guiado, precio de referencia y pago en línea con PSE, tarjeta o Nequi.</p>
          </div>
          <Link href="/solicitar" className="inline-flex items-center gap-2 font-label font-semibold text-night">
            Ver todos los documentos <UiIcon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10">
          <PopularGrid />
        </div>
        <div className="mt-10 flex flex-col gap-5 rounded-xl bg-white p-6 shadow-inset md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-center gap-5">
            <DocIllustration art="seguimiento" className="hidden h-24 w-auto shrink-0 rounded-lg sm:block" />
            <div>
              <p className="font-display text-lg font-bold">¿Ya hiciste un pedido?</p>
              <p className="text-slate">Consulta su estado con el número de pedido y tu correo, sin llamar ni crear cuenta.</p>
            </div>
          </div>
          <Link href="/estado" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-night px-5 font-label font-semibold text-white transition-colors hover:bg-navy">
            Estado de tu pedido <UiIcon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
