import Link from "next/link";

/**
 * Marca NEXODOC: un documento con esquina doblada (turquesa) que contiene
 * una "N" trazada como conexión entre dos puntos.
 */
export function LogoMark({ tone = "light", className = "h-8 w-8" }: { tone?: "light" | "dark"; className?: string }) {
  const body = tone === "light" ? "#10243A" : "#FFFFFF";
  const stroke = tone === "light" ? "#FFFFFF" : "#10243A";
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M4 7a3 3 0 0 1 3-3h13l8 8v13a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill={body} />
      <path d="M20 4v5a3 3 0 0 0 3 3h5z" fill="#19B7B0" />
      <path
        d="M10.5 22.5V13l8.5 9.5V13"
        fill="none"
        stroke={stroke}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ tone = "light", href = "/" }: { tone?: "light" | "dark"; href?: string }) {
  const color = tone === "light" ? "text-night" : "text-white";
  return (
    <Link href={href} className={`group -my-1.5 inline-flex items-center gap-2.5 py-1.5 ${color}`} aria-label="NEXODOC, ir al inicio">
      <LogoMark tone={tone} className="h-8 w-8 transition-transform duration-500 ease-out-expo group-hover:-rotate-6" />
      <span className="font-display text-[1.32rem] leading-none tracking-[-0.02em]">
        <span className="font-extrabold">NEXO</span>
        <span className="font-medium">DOC</span>
      </span>
    </Link>
  );
}
