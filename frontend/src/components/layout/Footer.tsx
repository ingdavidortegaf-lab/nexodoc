import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { UiIcon, type UiIconName } from "@/components/icons/UiIcon";
import { categories } from "@/lib/data/categories";
import { legalDocuments } from "@/lib/data/legal";
import { siteConfig, whatsappLink } from "@/lib/site";

const quickLinks = [
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Empresas", href: "/#empresas" },
  { label: "Preguntas frecuentes", href: "/#preguntas" },
  { label: "Solicitar documento", href: "/solicitar" },
  { label: "Estado de tu pedido", href: "/estado" },
];

export function Footer() {
  const { contact, legal, social } = siteConfig;
  const wa = whatsappLink();
  const socials = (
    [
      ["instagram", social.instagram, "Instagram"],
      ["linkedin", social.linkedin, "LinkedIn"],
      ["facebook", social.facebook, "Facebook"],
    ] as [UiIconName, string, string][]
  ).filter(([, url]) => url);

  return (
    <footer id="contacto" className="relative overflow-hidden bg-night text-white">
      <div className="bg-dots-light pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-site relative pb-10 pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr]">
          <div className="max-w-sm">
            <Logo tone="dark" />
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-white/65">
              Empresa colombiana independiente de gestión documental. Conectamos tus necesidades con las entidades
              correspondientes y te acompañamos en cada etapa. No somos una entidad pública.
            </p>
            {socials.length > 0 && (
              <ul className="mt-6 flex gap-2">
                {socials.map(([icon, url, label]) => (
                  <li key={label}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-white/15 transition-colors hover:bg-white/10"
                    >
                      <UiIcon name={icon} className="h-[18px] w-[18px]" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <FooterColumn title="Servicios">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/servicios/${c.slug}`} className="footer-link">
                  {c.shortName}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Enlaces rápidos">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="footer-link">
                  {l.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Contacto">
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} className="footer-link inline-flex items-center gap-2">
                  <UiIcon name="mail" className="h-4 w-4 text-teal-300" /> {contact.email}
                </a>
              </li>
            )}
            {contact.phone && (
              <li>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="footer-link inline-flex items-center gap-2">
                  <UiIcon name="phone" className="h-4 w-4 text-teal-300" /> {contact.phone}
                </a>
              </li>
            )}
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="footer-link inline-flex items-center gap-2">
                  <UiIcon name="whatsapp" className="h-4 w-4 text-teal-300" /> WhatsApp
                </a>
              </li>
            )}
            <li className="inline-flex items-center gap-2 text-white/65">
              <UiIcon name="pin" className="h-4 w-4 text-teal-300" /> {contact.city} · Atención nacional
            </li>
            <li className="pt-2">
              <Link href="/solicitar" className="inline-flex items-center gap-2 font-semibold text-teal-300 hover:text-white">
                Iniciar una solicitud <UiIcon name="arrowRight" className="h-4 w-4" />
              </Link>
            </li>
          </FooterColumn>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-white/55 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <p>
              © {new Date().getFullYear()} {legal.companyName || "NEXODOC"}
              {legal.taxId && ` · NIT ${legal.taxId}`}
              {legal.address && ` · ${legal.address}`}
            </p>
            <p className="max-w-xl">
              Los documentos son expedidos por las entidades responsables. Los derechos y tarifas oficiales los fija cada
              entidad y se informan por separado en la cotización.
            </p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalDocuments.map((d) => (
              <li key={d.slug}>
                <Link href={`/legal/${d.slug}`} className="hover:text-white">
                  {d.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-label text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-5 space-y-3 text-[0.9375rem]">{children}</ul>
    </div>
  );
}
