import { Hero } from "@/components/sections/Hero";
import { DocumentSearch } from "@/components/sections/DocumentSearch";
import { ServicesCatalog } from "@/components/sections/ServicesCatalog";
import { PopularDocuments } from "@/components/sections/PopularDocuments";
import { VideoBanner } from "@/components/sections/VideoBanner";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { BusinessSection } from "@/components/sections/BusinessSection";
import { WhyNexodoc } from "@/components/sections/WhyNexodoc";
import { Coverage } from "@/components/sections/Coverage";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";
import { faqs } from "@/lib/data/content";
import { JsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = {
  alternates: { canonical: siteConfig.url },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <Hero />
      <VideoBanner />
      <DocumentSearch />
      <PopularDocuments />
      <ServicesCatalog />
      <HowItWorks />
      <BusinessSection />
      <WhyNexodoc />
      <Coverage />
      <Faq />
      <FinalCta />
    </>
  );
}
