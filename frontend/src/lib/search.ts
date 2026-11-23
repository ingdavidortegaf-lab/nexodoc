import { allServices, type Category, type Service } from "@/lib/data/categories";

export type SearchResult = Service & { category: Category; score: number };

/** Minúsculas y sin tildes: "Tradición" -> "tradicion". */
export const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "y", "un", "una", "para", "mi", "en"]);

const index = allServices.map((s) => ({
  service: s,
  name: normalize(s.name),
  keywords: s.keywords.map(normalize).join(" | "),
  summary: normalize(s.summary),
  extra: normalize(`${s.category.name} ${s.category.shortName} ${s.entity}`),
}));

/**
 * Búsqueda local, tolerante a tildes, que exige que cada palabra
 * significativa aparezca en el servicio. Ordena por relevancia.
 */
export function searchServices(query: string, categorySlug?: string | null, limit = 8): SearchResult[] {
  const q = normalize(query);
  const tokens = q.split(" ").filter((t) => t.length > 1 && !STOPWORDS.has(t));
  const pool = categorySlug ? index.filter((i) => i.service.category.slug === categorySlug) : index;

  if (!tokens.length) {
    return pool.slice(0, limit).map((i) => ({ ...i.service, score: 0 }));
  }

  return pool
    .map((i) => {
      let score = 0;
      for (const t of tokens) {
        if (i.name.startsWith(t)) score += 12;
        else if (i.name.includes(t)) score += 8;
        else if (i.keywords.includes(t)) score += 6;
        else if (i.summary.includes(t)) score += 3;
        else if (i.extra.includes(t)) score += 2;
        else return null; // todas las palabras deben coincidir
      }
      if (i.name.includes(q)) score += 10;
      if (i.keywords.includes(q)) score += 6;
      return { ...i.service, score };
    })
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export const popularSearches = [
  "Certificado de tradición y libertad",
  "Copia de escritura pública",
  "Registro civil de nacimiento",
  "Apostilla",
  "Cámara de comercio",
];
