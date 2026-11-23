import { Suspense } from "react";
import { PaymentResult } from "@/components/payments/PaymentResult";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Resultado del pago",
  description: "Resultado de tu pago en NEXODOC.",
  path: "/pago/resultado",
  noindex: true,
});

export default function PaymentResultPage() {
  return (
    <section className="bg-hero grid min-h-screen place-items-center px-5 pb-20 pt-[104px]">
      <Suspense fallback={<div className="h-80 w-full max-w-xl animate-pulse rounded-xl bg-white/70" />}>
        <PaymentResult />
      </Suspense>
    </section>
  );
}
