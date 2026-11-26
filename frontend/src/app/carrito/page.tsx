import { Checkout } from "@/components/cart/Checkout";
import { buildMetadata } from "@/lib/seo";
import { siteConfig, whatsappLink } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Carrito",
  description: "Revisa tus documentos, completa tus datos y paga en línea con PSE, tarjeta o Nequi.",
  path: "/carrito",
  noindex: true,
});

export default function CartPage() {
  return (
    <section className="bg-hero min-h-svh pt-[72px]">
      <div className="container-site pb-32 pt-10 lg:pb-24 lg:pt-14">
        <p className="font-label text-sm font-semibold text-teal-ink">Tu pedido</p>
        <h1 className="mt-3 text-h2 font-extrabold">Carrito</h1>
        <div className="mt-10">
          <Checkout
            apiReady={Boolean(siteConfig.apiUrl)}
            publicApiUrl={siteConfig.publicApiUrl}
            fallback={{ whatsapp: whatsappLink(), email: siteConfig.contact.email }}
          />
        </div>
      </div>
    </section>
  );
}
