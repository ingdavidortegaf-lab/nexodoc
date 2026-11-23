/**
 * Iconografía propia de las 10 categorías de NEXODOC.
 * ARCHIVO GENERADO por tools/build_assets.py. Retícula 24 px, trazo 1.6,
 * terminaciones redondeadas, un solo detalle en turquesa por icono.
 */
import type { CategoryIconName } from "@/lib/data/categories";

interface Props {
  name: CategoryIconName;
  className?: string;
  /** Color del detalle de acento. Por defecto, turquesa de marca. */
  accent?: string;
}

export function CategoryIcon({ name, className = "h-6 w-6", accent = "#19B7B0" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <Glyph name={name} accent={accent} />
    </svg>
  );
}

function Glyph({ name, accent }: { name: CategoryIconName; accent: string }) {
  switch (name) {
    case "notarial":
      return (
        <>
          <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.5"/><path d="M13.5 3 19 8.5V11"/><path d="M13.5 3v5.5H19"/><path d="M8.5 11.5h4M8.5 15h2.5"/>
          <g stroke={accent}><circle cx="17" cy="16.5" r="3.2"/><path d="m15.4 19.3-.9 2.7 2.5-1 2.5 1-.9-2.7"/></g>
        </>
      );
    case "property":
      return (
        <>
          <path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/>
          <g stroke={accent}><path d="M10 20v-5h4v5"/><path d="M15.5 6.2V4.5h2v3.3"/></g>
        </>
      );
    case "civil":
      return (
        <>
          <circle cx="8.5" cy="7.5" r="2.8"/><path d="M3 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6"/>
          <g stroke={accent}><circle cx="17.5" cy="10.5" r="2.2"/><path d="M14.9 20c.2-2.5 1.2-4.2 2.6-4.2s2.4 1.7 2.6 4.2"/></g>
        </>
      );
    case "business":
      return (
        <>
          <path d="M4 21V6.5L12 3v18"/><path d="M12 9h8v12"/><path d="M2.5 21h19"/><path d="M7 9h2M7 12.5h2M7 16h2"/>
          <g stroke={accent}><path d="M15 13h2M15 16.5h2"/></g>
        </>
      );
    case "records":
      return (
        <>
          <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V6z"/>
          <g stroke={accent}><path d="m8.8 12.2 2.2 2.2 4.4-4.6"/></g>
        </>
      );
    case "apostille":
      return (
        <>
          <circle cx="10.5" cy="10.5" r="7"/><path d="M3.5 10.5h14"/><path d="M10.5 3.5c2 2 3 4.4 3 7s-1 5-3 7c-2-2-3-4.4-3-7s1-5 3-7z"/>
          <g stroke={accent}><circle cx="17.5" cy="17.5" r="3.2"/><path d="m16.2 17.6 1 1 1.8-1.9"/></g>
        </>
      );
    case "academic":
      return (
        <>
          <path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c1.5 1.5 3.4 2.2 5.5 2.2s4-.7 5.5-2.2V11"/>
          <g stroke={accent}><path d="M21.5 9v5.2"/><circle cx="21.5" cy="15.6" r="1"/></g>
        </>
      );
    case "judicial":
      return (
        <>
          <path d="M12 4.5V20"/><path d="M7.5 20h9"/><path d="M5 7h14"/><path d="m5 7-2.5 6M5 7l2.5 6M19 7l-2.5 6M19 7l2.5 6"/>
          <g stroke={accent}><path d="M2.5 13a2.5 2.5 0 0 0 5 0z"/><path d="M16.5 13a2.5 2.5 0 0 0 5 0z"/><circle cx="12" cy="4" r="1.2"/></g>
        </>
      );
    case "transit":
      return (
        <>
          <path d="M4 16.5v-4l2-5.2A2 2 0 0 1 7.9 6h8.2a2 2 0 0 1 1.9 1.3l2 5.2v4"/><path d="M4 12.5h16"/><path d="M4 16.5V19h16v-2.5"/><path d="M6.5 19v1.5M17.5 19v1.5"/>
          <g stroke={accent}><circle cx="7.5" cy="15" r="1"/><circle cx="16.5" cy="15" r="1"/></g>
        </>
      );
    case "archive":
      return (
        <>
          <path d="M3 4.5h18v4H3z"/><path d="M4.5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V8.5"/>
          <g stroke={accent}><path d="M10 12.5h4"/><path d="M8 16h8"/></g>
        </>
      );
  }
}
