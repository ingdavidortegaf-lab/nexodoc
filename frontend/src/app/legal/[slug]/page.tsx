import { notFound } from "next/navigation";
import Link from "next/link";
import { UiIcon } from "@/components/icons/UiIcon";
import { getLegalDocument, legalDocuments } from "@/lib/data/legal";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => legalDocuments.map((d) => ({ slug: d.slug }));

export async function generateMetadata({ params }: Params) {
  const doc = getLegalDocument((await params).slug);
  return doc ? buildMetadata({ title: doc.title, description: doc.intro.slice(0, 155), path: `/legal/${doc.slug}` }) : {};
}

export default async function LegalPage({ params }: Params) {
  const doc = getLegalDocument((await params).slug);
  if (!doc) notFound();

  const { legal, contact } = siteConfig;
  const complete = Boolean(legal.companyName && legal.taxId && legal.address && contact.email);
  const fill = (t: string) =>
    t
      .replaceAll("{empresa}", legal.companyName || "NEXODOC")
      .replaceAll("{nit}", legal.taxId || "en actualización")
      .replaceAll("{direccion}", legal.address || "en actualización")
      .replaceAll("{correo}", contact.email || "el canal de contacto indicado en este sitio");

  return (
    <section className="pt-[72px]">
      <div className="container-site grid gap-12 py-16 lg:grid-cols-[16rem_1fr] lg:py-24">
        <nav aria-label="Documentos legales" className="lg:sticky lg:top-28 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
            {legalDocuments.map((d) => (
              <li key={d.slug} className="shrink-0">
                <Link
                  href={`/legal/${d.slug}`}
                  aria-current={d.slug === doc.slug ? "page" : undefined}
                  className={`block rounded-lg px-4 py-2.5 font-label text-sm font-semibold transition-colors ${
                    d.slug === doc.slug ? "bg-night text-white" : "text-night hover:bg-mist"
                  }`}
                >
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-3xl">
          <p className="font-label text-sm font-semibold text-teal-ink">Documento legal</p>
          <h1 className="mt-3 text-h2 font-extrabold">{doc.title}</h1>
          <p className="mt-3 text-sm text-slate">Última actualización: {new Date(doc.updated).toLocaleDateString("es-CO", { dateStyle: "long" })}</p>
          {!complete && (
            <p className="mt-6 flex gap-2.5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
              <UiIcon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
              Versión preliminar: los datos de identificación del responsable están en actualización.
            </p>
          )}
          <p className="mt-8 text-lead text-night/85">{fill(doc.intro)}</p>
          {doc.sections.map((s) => (
            <section key={s.heading} className="mt-10">
              <h2 className="font-display text-xl font-bold">{s.heading}</h2>
              <div className="mt-3 space-y-3 text-slate">
                {s.body.map((p) => (
                  <p key={p}>{fill(p)}</p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </section>
  );
}
