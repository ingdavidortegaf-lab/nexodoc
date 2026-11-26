import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ServiceForm } from "@/components/forms/ServiceForm";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import { UiIcon } from "@/components/icons/UiIcon";
import { DocIllustration, serviceArt } from "@/components/illustrations/DocIllustrations";
import { allServices, modalityLabel } from "@/lib/data/categories";
import { formatCOP, minFrom } from "@/lib/data/pricing";
import { buildMetadata, JsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

type Params = { params: Promise<{ servicio: string }> };

const OTHER = {
  slug: "otro",
  name: "Otro documento",
  summary: "Cuéntanos qué documento necesitas y te enviamos una cotización.",
  entity: "Entidad responsable del documento",
  modality: "remota" as const,
  category: null,
};

const find = (slug: string) => (slug === "otro" ? OTHER : allServices.find((s) => s.slug === slug));

export const dynamicParams = false;
export const generateStaticParams = () => [...allServices.map((s) => ({ servicio: s.slug })), { servicio: "otro" }];

export async function generateMetadata({ params }: Params) {
  const { servicio } = await params;
  const s = find(servicio);
  if (!s) return {};
  return buildMetadata({
    title: `Solicitar ${s.name.toLowerCase()} en línea`,
    description: `${s.summary} Diligencia los datos, paga con PSE, tarjeta o Nequi y sigue tu pedido en línea.`,
    path: `/solicitar/${s.slug}`,
  });
}

export default async function ServiceRequestPage({ params }: Params) {
  const { servicio } = await params;
  const s = find(servicio);
  if (!s) notFound();
  const from = minFrom(s.slug);

  return (
    <section className="bg-hero min-h-svh pt-[72px]">
      {s.category && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Service",
            name: s.name,
            description: s.summary,
            serviceType: s.category.name,
            areaServed: { "@type": "Country", name: "Colombia" },
            provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
            ...(from && { offers: { "@type": "Offer", priceCurrency: "COP", price: from, url: `${siteConfig.url}/solicitar/${s.slug}` } }),
          }}
        />
      )}
      {/* Móvil: título → formulario → información. Escritorio: información a la izquierda, formulario a la derecha. */}
      <div className="container-site grid gap-10 pb-24 pt-10 lg:grid-cols-[0.72fr_1.28fr] lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-8 lg:pt-14">
        <div className="lg:col-start-1 lg:row-start-1">
          <nav aria-label="Ruta de navegación" className="font-label text-sm text-slate">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/solicitar" className="inline-block py-2 hover:text-night">Solicitar</Link></li>
              {s.category && (
                <>
                  <li aria-hidden="true">/</li>
                  <li><Link href={`/servicios/${s.category.slug}`} className="inline-block py-2 hover:text-night">{s.category.shortName}</Link></li>
                </>
              )}
            </ol>
          </nav>
          <h1 className="mt-5 text-h2 font-extrabold">{s.name}</h1>
          <p className="mt-4 text-lead text-slate">{s.summary}</p>

          {from && (
            <p className="mt-6 inline-flex items-baseline gap-2 rounded-full bg-white px-5 py-2.5 shadow-inset">
              <span className="font-label text-sm font-semibold text-slate">Desde</span>
              <span className="font-display text-xl font-extrabold tabular-nums text-night">{formatCOP(from)}</span>
            </p>
          )}
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Suspense fallback={<div className="h-[640px] animate-pulse rounded-xl bg-white/70" />}>
            <ServiceForm service={s.slug} serviceName={s.name} />
          </Suspense>
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
          {serviceArt[s.slug] && (
            <DocIllustration art={serviceArt[s.slug]} className="mb-8 hidden h-auto w-full max-w-sm rounded-xl lg:block" />
          )}
          <dl className="space-y-4 text-[0.9375rem]">
            <div className="flex gap-3">
              <UiIcon name="building" className="mt-0.5 h-5 w-5 shrink-0 text-teal-ink" />
              <div>
                <dt className="font-semibold text-night">Entidad que lo expide</dt>
                <dd className="text-slate">{s.entity}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <UiIcon name="route" className="mt-0.5 h-5 w-5 shrink-0 text-teal-ink" />
              <div>
                <dt className="font-semibold text-night">Modalidad</dt>
                <dd className="text-slate">{modalityLabel[s.modality]}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <UiIcon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-teal-ink" />
              <div>
                <dt className="font-semibold text-night">Tus datos, protegidos</dt>
                <dd className="text-slate">Tratamiento conforme a la Ley 1581 de 2012 y archivos en almacenamiento privado cifrado.</dd>
              </div>
            </div>
          </dl>

          <div className="mt-8">
            <PaymentMethods compact />
          </div>

          <p className="mt-8 rounded-lg bg-white/70 p-4 text-sm text-slate shadow-inset">
            NEXODOC es una empresa privada de gestión documental. No somos una entidad pública ni expedimos documentos: los
            solicitamos por ti ante la entidad responsable. También puedes hacer el trámite directamente ante ella.
          </p>
        </div>
      </div>
    </section>
  );
}
