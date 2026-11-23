import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export function buildMetadata({
  title,
  description,
  path = "/",
  noindex = false,
}: {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
}): Metadata {
  const url = `${siteConfig.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
    },
    twitter: { card: "summary_large_image", title: `${title} | ${siteConfig.name}`, description },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

/** Inserta datos estructurados escapando "<" para evitar inyección. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/icon.svg`,
  slogan: siteConfig.tagline,
  description: siteConfig.description,
  areaServed: { "@type": "Country", name: "Colombia" },
  ...(siteConfig.legal.companyName && { legalName: siteConfig.legal.companyName }),
  ...(siteConfig.legal.taxId && { taxID: siteConfig.legal.taxId }),
  ...(siteConfig.contact.email && {
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: siteConfig.contact.email,
      ...(siteConfig.contact.phone && { telephone: siteConfig.contact.phone }),
      areaServed: "CO",
      availableLanguage: "es",
    },
  }),
  sameAs: Object.values(siteConfig.social).filter(Boolean),
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  inLanguage: "es-CO",
});
