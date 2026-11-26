import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { UiIcon } from "@/components/icons/UiIcon";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { FinalCta } from "@/components/sections/FinalCta";
import { categories, getCategory, modalityLabel, type Modality } from "@/lib/data/categories";
import { formatCOP, minFrom } from "@/lib/data/pricing";
import { buildMetadata, JsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return buildMetadata({ title: category.seo.title, description: category.seo.description, path: `/servicios/${slug}` });
}

const modalityStyle: Record<Modality, string> = {
  remota: "bg-teal-soft text-teal-ink",
  mixta: "bg-sky-50 text-sky-800",
  presencial: "bg-amber-50 text-amber-800",
};

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const related = categories.filter((c) => c.slug !== slug).slice(0, 3);
  const url = `${siteConfig.url}/servicios/${slug}`;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: siteConfig.url },
              { "@type": "ListItem", position: 2, name: "Servicios", item: `${siteConfig.url}/servicios` },
              { "@type": "ListItem", position: 3, name: category.name, item: url },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: category.name,
            itemListElement: category.services.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Service",
                name: s.name,
                description: s.summary,
                serviceType: category.name,
                areaServed: { "@type": "Country", name: "Colombia" },
                provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
              },
            })),
          },
        ]}
      />

      <section className="bg-hero relative overflow-hidden pt-[72px]">
        <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_70%_at_90%_20%,black,transparent)]" aria-hidden="true" />
        <div className="container-site relative pb-16 pt-10 md:pb-20 md:pt-14">
          <nav aria-label="Ruta de navegación" className="font-label text-sm text-slate">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="inline-block py-2 hover:text-night">Inicio</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/servicios" className="inline-block py-2 hover:text-night">Servicios</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-semibold text-night">{category.shortName}</li>
            </ol>
          </nav>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <Reveal>
              <span className="grid h-16 w-16 place-items-center rounded-lg bg-night text-white shadow-lift">
                <CategoryIcon name={category.icon} className="h-8 w-8" accent="#6FE6DE" />
              </span>
              <h1 className="mt-7 text-display font-extrabold">{category.name}</h1>
              <p className="mt-6 max-w-2xl text-lead text-slate">{category.description}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href={`/solicitar?categoria=${category.slug}#catalogo`} size="lg" arrow>
                  Solicitar en esta categoría
                </Button>
                <Button href="#servicios-incluidos" size="lg" variant="secondary">
                  Ver servicios incluidos
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="rounded-xl bg-white/80 p-6 shadow-card ring-1 ring-night/5 backdrop-blur">
              <p className="font-label text-sm font-semibold text-slate">Pensado para</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {category.audience.map((a) => (
                  <li key={a} className="rounded-full bg-mist px-3 py-1.5 font-label text-sm font-medium text-night">
                    {a}
                  </li>
                ))}
              </ul>
              <p className="mt-6 font-label text-sm font-semibold text-slate">Entidades responsables</p>
              <ul className="mt-3 space-y-2 text-[0.9375rem] text-night/85">
                {category.entities.map((e) => (
                  <li key={e} className="flex gap-2.5">
                    <UiIcon name="building" className="mt-0.5 h-4 w-4 shrink-0 text-teal-ink" />
                    {e}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="servicios-incluidos" className="section-y">
        <div className="container-site grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-h2 font-bold">Servicios incluidos</h2>
            <RevealGroup className="mt-10 space-y-4">
              {category.services.map((s) => (
                <RevealItem
                  key={s.slug}
                  className="group rounded-xl bg-white p-6 ring-1 ring-line transition-all duration-500 ease-out-expo hover:shadow-lift hover:ring-night/15 md:p-7"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-xl">
                      <h3 id={s.slug} className="text-h3 font-bold">{s.name}</h3>
                      <p className="mt-2 text-slate">{s.summary}</p>
                      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div className="flex gap-1.5">
                          <dt className="text-slate">Entidad:</dt>
                          <dd className="font-medium text-night">{s.entity}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                      <span className={`rounded-full px-3 py-1 font-label text-xs font-semibold ${modalityStyle[s.modality]}`}>
                        {modalityLabel[s.modality]}
                      </span>
                      <span className="font-label text-sm text-slate md:text-right">
                        {minFrom(s.slug) ? (
                          <>
                            Desde <strong className="font-display text-lg font-bold tabular-nums text-night">{formatCOP(minFrom(s.slug)!)}</strong>
                          </>
                        ) : (
                          "Valor según cotización"
                        )}
                      </span>
                      <Link
                        href={`/solicitar/${s.slug}`}
                        className="inline-flex items-center gap-2 rounded-full bg-night px-4 py-2 font-label text-sm font-semibold text-white transition-colors hover:bg-navy"
                      >
                        Solicitar
                        <UiIcon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <Reveal className="rounded-xl bg-mist p-7">
              <h2 className="font-display text-lg font-bold">Requisitos</h2>
              <ul className="mt-4 space-y-3 text-[0.9375rem] text-night/85">
                {category.requirements.map((r) => (
                  <li key={r} className="flex gap-3">
                    <UiIcon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-ink" strokeWidth={2.4} />
                    {r}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.05} className="rounded-xl bg-white p-7 ring-1 ring-line">
              <h2 className="font-display text-lg font-bold">Condiciones de acceso</h2>
              <ul className="mt-4 space-y-3 text-[0.9375rem] text-slate">
                {category.conditions.map((c) => (
                  <li key={c} className="flex gap-3">
                    <UiIcon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
                    {c}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1} className="rounded-xl bg-night p-7 text-white">
              <p className="flex gap-3 text-[0.9375rem] text-white/80">
                <UiIcon name="clock" className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
                Los tiempos y derechos dependen de la entidad que expide el documento. Te los informamos en la cotización,
                antes de cualquier pago.
              </p>
            </Reveal>
          </aside>
        </div>
      </section>

      <section className="border-t border-line bg-mist/50 py-20">
        <div className="container-site">
          <h2 className="font-display text-2xl font-bold">Otras categorías</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {related.map((c) => (
              <Link
                key={c.slug}
                href={`/servicios/${c.slug}`}
                className="group flex items-center gap-4 rounded-xl bg-white p-5 ring-1 ring-line transition-all hover:shadow-card hover:ring-night/15"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-mist text-night transition-colors group-hover:bg-night group-hover:text-white">
                  <CategoryIcon name={c.icon} className="h-5 w-5" />
                </span>
                <span className="font-semibold">{c.name}</span>
                <UiIcon name="arrowRight" className="ml-auto h-4 w-4 shrink-0 text-slate transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <div className="pt-20">
        <FinalCta />
      </div>
    </>
  );
}
