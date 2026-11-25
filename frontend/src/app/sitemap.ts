import type { MetadataRoute } from "next";
import { allServices, categories } from "@/lib/data/categories";
import { legalDocuments } from "@/lib/data/legal";
import { serviceForms } from "@/lib/data/forms";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const u = (path: string) => `${siteConfig.url}${path}`;
  return [
    { url: u("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: u("/solicitar"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: u("/servicios"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...categories.map((c) => ({
      url: u(`/servicios/${c.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Páginas de solicitud por documento: los guiados primero
    ...allServices.map((s) => ({
      url: u(`/solicitar/${s.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: serviceForms[s.slug] ? 0.8 : 0.6,
    })),
    { url: u("/estado"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    ...legalDocuments.map((d) => ({
      url: u(`/legal/${d.slug}`),
      lastModified: new Date(d.updated),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
