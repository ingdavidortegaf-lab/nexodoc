import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JsonLd, organizationLd, websiteLd } from "@/lib/seo";
import { WhatsAppFloat } from "@/components/ui/WhatsAppFloat";
import { CartProvider } from "@/lib/cart";
import { siteConfig, whatsappLink } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "NEXODOC | Gestión documental y solicitud de certificados en Colombia",
    template: "%s | NEXODOC",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "copia de escrituras públicas",
    "certificado de tradición y libertad",
    "gestión documental Colombia",
    "solicitud de documentos",
    "búsqueda de escrituras",
    "trámites notariales",
    "servicios documentales",
    "gestión documental empresarial",
  ],
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    url: siteConfig.url,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // Barra del navegador del mismo color que el encabezado (blanco), no azul noche
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  // Con el teclado abierto en Android, la página se ajusta en vez de quedar tapada
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${inter.variable} ${manrope.variable} ${jakarta.variable}`}>
      <body>
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <CartProvider>
          <Navbar />
          <main id="contenido">{children}</main>
          <Footer />
          <WhatsAppFloat href={whatsappLink()} />
        </CartProvider>
      </body>
    </html>
  );
}
