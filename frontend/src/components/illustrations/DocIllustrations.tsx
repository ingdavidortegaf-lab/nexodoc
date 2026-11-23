/**
 * Ilustraciones de marketing de cada documento (SVG propio, paleta de marca).
 * Sin clases ni variables CSS: los mismos componentes se usan en el sitio y en
 * las piezas para redes generadas con next/og (app/marketing/[pieza]).
 */
import { Children, cloneElement, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";

const C = {
  night: "#10243A",
  navy: "#1D4A73",
  teal: "#19B7B0",
  tealDeep: "#139C96",
  tealSoft: "#E6F7F6",
  mint: "#6FE6DE",
  mist: "#F4F7FA",
  line: "#CBD5E1",
  paper: "#FFFFFF",
  amber: "#F5B544",
};

export type DocArt = "registro" | "matrimonio" | "escritura" | "tradicion" | "apostilla" | "traduccion" | "pago" | "seguimiento";

/** Hoja de papel con renglones. */
function Paper({ x, y, w, h, rot = 0, lines = 4, children }: { x: number; y: number; w: number; h: number; rot?: number; lines?: number; children?: ReactNode }) {
  return (
    <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x + 3} y={y + 5} width={w} height={h} rx="7" fill={C.night} opacity="0.12" />
      <rect x={x} y={y} width={w} height={h} rx="7" fill={C.paper} stroke={C.line} strokeWidth="1.2" />
      <rect x={x + 10} y={y + 12} width={w * 0.45} height="5" rx="2.5" fill={C.night} />
      {Array.from({ length: lines }).map((_, i) => (
        <rect key={i} x={x + 10} y={y + 26 + i * 10} width={w - 20 - (i % 2) * 14} height="3.5" rx="1.75" fill={C.line} />
      ))}
      {children}
    </g>
  );
}

function Seal({ cx, cy, r = 13 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <path d={`M${cx - 6} ${cy + r - 2} l-4 ${r} 7-4 3 6 3-${r}z M${cx + 6} ${cy + r - 2} l4 ${r} -7-4 -3 6 -3-${r}z`} fill={C.tealDeep} />
      <circle cx={cx} cy={cy} r={r} fill={C.teal} />
      <circle cx={cx} cy={cy} r={r - 4} fill="none" stroke={C.paper} strokeWidth="1.6" strokeDasharray="2 2" />
      <path d={`M${cx - 5} ${cy} l3.5 3.5 6.5-7`} fill="none" stroke={C.paper} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Backdrop({ children }: { children: ReactNode }) {
  return (
    <>
      <rect width="240" height="150" rx="18" fill={C.mist} />
      <circle cx="170" cy="62" r="62" fill={C.teal} opacity="0.1" />
      <circle cx="58" cy="118" r="34" fill={C.navy} opacity="0.06" />
      {children}
    </>
  );
}

const scenes: Record<DocArt, ReactNode> = {
  registro: (
    <Backdrop>
      <Paper x={70} y={22} w={100} h={110} lines={5}>
        <circle cx="96" cy="104" r="9" fill={C.tealSoft} stroke={C.teal} strokeWidth="1.6" />
        <circle cx="96" cy="101" r="3.2" fill={C.teal} />
        <path d="M89.5 110c1.5-3 3.8-4.5 6.5-4.5s5 1.5 6.5 4.5" fill={C.teal} />
      </Paper>
      <Seal cx={156} cy={108} />
      <rect x="30" y="40" width="30" height="20" rx="5" fill={C.paper} stroke={C.line} />
      <rect x="36" y="47" width="18" height="3" rx="1.5" fill={C.teal} />
      <rect x="36" y="53" width="12" height="3" rx="1.5" fill={C.line} />
    </Backdrop>
  ),
  matrimonio: (
    <Backdrop>
      <Paper x={66} y={24} w={108} h={106} lines={4} />
      <circle cx="108" cy="98" r="14" fill="none" stroke={C.amber} strokeWidth="5" />
      <circle cx="128" cy="98" r="14" fill="none" stroke={C.teal} strokeWidth="5" />
      <Seal cx={168} cy={44} r={11} />
    </Backdrop>
  ),
  escritura: (
    <Backdrop>
      <Paper x={58} y={30} w={92} h={102} rot={-8} lines={5} />
      <Paper x={84} y={20} w={96} h={108} lines={5}>
        <path d="M100 112 l14-12 14 12 v12 h-28z" fill={C.tealSoft} stroke={C.navy} strokeWidth="1.6" strokeLinejoin="round" />
        <rect x="110" y="114" width="7" height="10" fill={C.navy} />
      </Paper>
      <g transform="rotate(-14 182 104)">
        <rect x="160" y="96" width="44" height="20" rx="4" fill="none" stroke={C.teal} strokeWidth="2.4" />
        <rect x="167" y="103" width="30" height="5" rx="2.5" fill={C.teal} />
      </g>
    </Backdrop>
  ),
  tradicion: (
    <Backdrop>
      <path d="M44 84 l42-34 42 34 v46 h-84z" fill={C.paper} stroke={C.navy} strokeWidth="2" strokeLinejoin="round" />
      <path d="M36 88 l50-40 50 40" fill="none" stroke={C.night} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="76" y="100" width="20" height="30" rx="2" fill={C.navy} />
      <rect x="54" y="96" width="14" height="12" rx="2" fill={C.tealSoft} stroke={C.teal} />
      <Paper x={130} y={30} w={78} h={96} lines={4}>
        <rect x="140" y="92" width="58" height="18" rx="9" fill={C.tealSoft} />
        <path d="M148 101 l4 4 8-8" fill="none" stroke={C.tealDeep} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="164" y="99" width="26" height="4" rx="2" fill={C.teal} />
      </Paper>
    </Backdrop>
  ),
  apostilla: (
    <Backdrop>
      <Paper x={52} y={26} w={96} h={106} lines={5} />
      <circle cx="166" cy="72" r="34" fill={C.paper} stroke={C.navy} strokeWidth="2" />
      <ellipse cx="166" cy="72" rx="14" ry="34" fill="none" stroke={C.navy} strokeWidth="1.6" />
      <path d="M132 72h68 M137 55h58 M137 89h58" stroke={C.navy} strokeWidth="1.6" />
      <path d="M150 112 q30 18 62-6" fill="none" stroke={C.teal} strokeWidth="2.4" strokeDasharray="4 4" strokeLinecap="round" />
      <path d="M206 98 l8 6 -9 4" fill="none" stroke={C.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <Seal cx={128} cy={110} r={12} />
    </Backdrop>
  ),
  traduccion: (
    <Backdrop>
      <Paper x={34} y={30} w={78} h={96} lines={4}>
        <text x="46" y="112" fontSize="22" fontWeight="700" fill={C.navy} fontFamily="Arial, sans-serif">Aa</text>
      </Paper>
      <Paper x={128} y={30} w={78} h={96} lines={4}>
        <text x="140" y="112" fontSize="22" fontWeight="700" fill={C.tealDeep} fontFamily="Arial, sans-serif">Ññ</text>
      </Paper>
      <circle cx="120" cy="76" r="15" fill={C.night} />
      <path d="M113 72h13l-4-4 M127 80h-13l4 4" fill="none" stroke={C.mint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Backdrop>
  ),
  pago: (
    <Backdrop>
      <rect x="40" y="36" width="112" height="72" rx="12" fill={C.night} />
      <rect x="40" y="52" width="112" height="14" fill={C.navy} />
      <rect x="52" y="80" width="22" height="16" rx="3" fill={C.amber} />
      <rect x="84" y="86" width="52" height="5" rx="2.5" fill={C.mint} opacity="0.7" />
      <rect x="132" y="56" width="70" height="78" rx="12" fill={C.paper} stroke={C.line} />
      <rect x="146" y="70" width="42" height="6" rx="3" fill={C.night} />
      <circle cx="167" cy="104" r="16" fill={C.teal} />
      <path d="M160 104 l5 5 9-10" fill="none" stroke={C.paper} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Backdrop>
  ),
  seguimiento: (
    <Backdrop>
      <rect x="66" y="16" width="108" height="124" rx="16" fill={C.night} />
      <rect x="74" y="28" width="92" height="104" rx="9" fill={C.paper} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx="88" cy={46 + i * 22} r="6" fill={i < 3 ? C.teal : C.line} />
          {i < 3 && <path d={`M85 ${46 + i * 22} l2.2 2.2 4-4.4`} fill="none" stroke={C.paper} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
          {i < 3 && <rect x="87" y={52 + i * 22} width="2" height="10" fill={C.teal} />}
          <rect x="100" y={43 + i * 22} width={i === 2 ? 52 : 42} height="5" rx="2.5" fill={i === 2 ? C.night : C.line} />
        </g>
      ))}
      <rect x="150" y="96" width="62" height="26" rx="13" fill={C.teal} />
      <rect x="162" y="106" width="38" height="6" rx="3" fill={C.paper} />
    </Backdrop>
  ),
};

export function DocIllustration({ art, className, title, width }: { art: DocArt; className?: string; title?: string; width?: number }) {
  return (
    <svg
      viewBox="0 0 240 150"
      xmlns="http://www.w3.org/2000/svg"
      className={className || undefined}
      {...(width ? { width, height: Math.round((width * 150) / 240) } : {})}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {scenes[art]}
    </svg>
  );
}

/**
 * Expande los componentes internos (Paper, Seal, Backdrop) a elementos SVG
 * básicos. next/og (Satori) sólo acepta elementos intrínsecos dentro de <svg>.
 */
function flatten(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return node.map(flatten);
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<{ children?: ReactNode }>;
  if (typeof el.type === "function") return flatten((el.type as (p: unknown) => ReactNode)(el.props));
  if ((el.type as unknown) === Fragment) return flatten(el.props.children);
  return cloneElement(el, undefined, ...Children.toArray(el.props.children).map(flatten));
}

/** Versión para imágenes generadas (next/og): mismo dibujo, sólo elementos intrínsecos. */
export function DocIllustrationStatic({ art, width }: { art: DocArt; width: number }) {
  return (
    <svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg" width={width} height={Math.round((width * 150) / 240)}>
      {flatten(scenes[art])}
    </svg>
  );
}

/** Ilustración de cada servicio destacado. */
export const serviceArt: Record<string, DocArt> = {
  "registro-civil-de-nacimiento": "registro",
  "registro-civil-de-defuncion": "registro",
  "registro-civil-de-matrimonio": "matrimonio",
  "copia-escritura-publica": "escritura",
  "busqueda-de-escrituras": "escritura",
  "certificado-de-tradicion-y-libertad": "tradicion",
  "apostilla-de-documentos": "apostilla",
  "traduccion-oficial": "traduccion",
};
