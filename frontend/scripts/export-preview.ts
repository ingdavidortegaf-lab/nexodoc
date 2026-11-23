/** Exporta el contenido para la vista previa estática (design/build/content.json). */
import { categories, modalityLabel } from "../src/lib/data/categories";
import * as content from "../src/lib/data/content";
import { legalDocuments } from "../src/lib/data/legal";
import { popularSearches } from "../src/lib/search";

process.stdout.write(
  JSON.stringify({
    categories,
    modalityLabel,
    ...content,
    popularSearches,
    legal: legalDocuments.map((d) => ({ slug: d.slug, shortTitle: d.shortTitle })),
  }),
);
