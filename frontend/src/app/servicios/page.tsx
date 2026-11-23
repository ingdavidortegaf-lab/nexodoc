import { ServicesCatalog } from "@/components/sections/ServicesCatalog";
import { FinalCta } from "@/components/sections/FinalCta";
import { buildMetadata } from "@/lib/seo";
import { totalServices } from "@/lib/data/categories";

export const metadata = buildMetadata({
  title: "Servicios documentales en Colombia",
  description:
    "Catálogo de servicios de NEXODOC: trámites notariales, certificado de tradición y libertad, registros civiles, cámara de comercio, apostillas, antecedentes, tránsito y gestión documental empresarial.",
  path: "/servicios",
});

export default function ServiciosPage() {
  return (
    <>
      <section className="bg-hero pt-[72px]">
        <div className="container-site pb-4 pt-16 md:pt-24">
          <p className="font-label text-sm font-semibold text-teal-ink">Catálogo de servicios</p>
          <h1 className="mt-4 max-w-3xl text-display font-extrabold">Todos los trámites, organizados por lo que necesitas resolver.</h1>
          <p className="mt-6 max-w-2xl text-lead text-slate">
            {totalServices} trámites en 10 categorías. Cada uno indica requisitos, entidad responsable y modalidad de gestión.
          </p>
        </div>
      </section>
      <ServicesCatalog withHeading={false} />
      <FinalCta />
    </>
  );
}
