import Link from "next/link";
import { redirect } from "next/navigation";
import { ServicePicker } from "@/components/forms/ServicePicker";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import { PopularGrid } from "@/components/sections/PopularDocuments";
import { UiIcon } from "@/components/icons/UiIcon";
import { allServices, getCategory } from "@/lib/data/categories";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Solicitar un documento",
  description:
    "Elige el documento, diligencia sus datos y págalo en línea con PSE, tarjeta o Nequi. Registros civiles, escrituras, certificados, apostillas y traducciones.",
  path: "/solicitar",
});

type Props = { searchParams: Promise<{ servicio?: string; categoria?: string }> };

export default async function SolicitarPage({ searchParams }: Props) {
  const sp = await searchParams;
  // Compatibilidad con enlaces antiguos (/solicitar?servicio=…)
  if (sp.servicio && allServices.some((s) => s.slug === sp.servicio)) redirect(`/solicitar/${sp.servicio}`);
  const category = getCategory(sp.categoria ?? "")?.slug ?? null;

  return (
    <>
      <section className="bg-hero pt-[72px]">
        <div className="container-site pb-14 pt-12 lg:pt-16">
          <p className="font-label text-sm font-semibold text-teal-ink">Nueva solicitud</p>
          <h1 className="mt-4 max-w-3xl text-h2 font-extrabold">¿Qué documento necesitas?</h1>
          <p className="mt-5 max-w-2xl text-lead text-slate">
            Elige el documento, completa sus datos y agrégalo al carrito. Puedes pedir varios en un mismo pedido y pagarlos en
            línea.
          </p>
          <ol className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["file", "Diligencia el formulario del documento"],
              ["lock", "Paga en línea con PSE, tarjeta o Nequi"],
              ["route", "Sigue tu pedido con el número y tu correo"],
            ].map(([icon, text], i) => (
              <li key={text} className="flex items-center gap-3 rounded-lg bg-white/80 p-4 shadow-inset backdrop-blur">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-night font-label text-sm font-bold text-white">{i + 1}</span>
                <span className="flex items-center gap-2 text-[0.9375rem] font-medium text-night">
                  <UiIcon name={icon as "file"} className="hidden h-4 w-4 text-teal-ink sm:block" />
                  {text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {!category && (
        <section className="container-site py-14">
          <h2 className="mb-6 font-display text-2xl font-bold">Los más solicitados</h2>
          <PopularGrid />
        </section>
      )}

      <section className="border-t border-line bg-mist/50">
        <div className="container-site py-14">
          <h2 className="mb-8 font-display text-2xl font-bold">Todos los documentos</h2>
          <ServicePicker initialCategory={category} />
          <div className="mt-14 flex flex-col items-start gap-4 rounded-xl bg-white p-6 shadow-inset md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-night">¿No está en la lista?</p>
              <p className="text-slate">Cuéntanos qué necesitas y te enviamos una cotización.</p>
            </div>
            <Link href="/solicitar/otro" className="inline-flex items-center gap-2 font-label font-semibold text-teal-ink underline underline-offset-4">
              Solicitar otro documento <UiIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10">
            <PaymentMethods />
          </div>
        </div>
      </section>
    </>
  );
}
