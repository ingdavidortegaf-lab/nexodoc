import { Suspense } from "react";
import { TrackOrder } from "@/components/track/TrackOrder";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Estado de tu pedido",
  description: "Consulta el estado de tu solicitud con el número de pedido y el correo con el que la hiciste.",
  path: "/estado",
});

export default function TrackPage() {
  return (
    <section className="bg-hero min-h-screen pt-[72px]">
      <div className="container-site pb-24 pt-10 lg:pt-14">
        <div className="max-w-2xl">
          <p className="font-label text-sm font-semibold text-teal-ink">Seguimiento en línea</p>
          <h1 className="mt-3 text-h2 font-extrabold">Estado de tu pedido</h1>
          <p className="mt-4 text-lead text-slate">
            Escribe el número de pedido y el correo con el que lo hiciste. Verás cada documento, su historial y, cuando esté
            lista, la cotización para pagarla en línea.
          </p>
        </div>
        <div className="mt-10">
          <Suspense fallback={<div className="h-56 animate-pulse rounded-xl bg-white/70" />}>
            <TrackOrder />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
