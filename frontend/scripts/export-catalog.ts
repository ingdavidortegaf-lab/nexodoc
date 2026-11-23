/** Exporta el catálogo (con precios de verificación) a JSON para sembrar el backend. */
import { categories } from "../src/lib/data/categories";
import { getPricing, minFrom } from "../src/lib/data/pricing";

const out = categories.map(({ slug, name, services }) => ({
  slug,
  name,
  services: services.map(({ slug, name, entity, modality }) => ({
    slug,
    name,
    entity,
    modality,
    verificationFee: getPricing(slug)?.verificationFee ?? 0,
    priceFrom: minFrom(slug) ?? null,
  })),
}));
process.stdout.write(JSON.stringify(out, null, 2));
