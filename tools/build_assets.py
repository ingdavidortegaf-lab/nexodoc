#!/usr/bin/env python3
"""
Genera los recursos gráficos de NEXODOC a partir de una sola fuente:

  design/hero.svg          -> components/illustrations/HeroIllustration.tsx
  ICONS (abajo)            -> components/icons/CategoryIcon.tsx
  COLOMBIA (abajo)         -> components/illustrations/colombia-geo.ts

y deja design/build/assets.json para la vista previa estática.

Uso:  python3 tools/build_assets.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FE = ROOT / "frontend" / "src" / "components"

# --------------------------------------------------------------------------
# Conversión SVG -> JSX
# --------------------------------------------------------------------------
HYPHEN_ATTRS = [
    "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray",
    "stroke-opacity", "fill-opacity", "stop-color", "stop-opacity", "font-size",
    "font-weight", "text-anchor", "flood-color", "flood-opacity", "fill-rule",
    "clip-rule", "letter-spacing",
]


def to_jsx(svg: str) -> str:
    out = svg.replace(' class="', ' className="')
    for attr in HYPHEN_ATTRS:
        head, *rest = attr.split("-")
        camel = head + "".join(p.capitalize() for p in rest)
        out = out.replace(f" {attr}=", f" {camel}=")
    return out


# --------------------------------------------------------------------------
# 1. Ilustración del hero
# --------------------------------------------------------------------------
hero_src = (ROOT / "design" / "hero.svg").read_text(encoding="utf-8")
inner = re.search(r"<svg[^>]*>(.*)</svg>", hero_src, re.S).group(1).strip()

hero_html = re.sub(r'<enter n="(\d+)">', r'<g class="nx-enter" style="--i:\1">', hero_src).replace("</enter>", "</g>")

hero_jsx_inner = to_jsx(inner)
hero_jsx_inner = re.sub(r'<enter n="(\d+)">', r'<motion.g variants={layer} custom={\1}>', hero_jsx_inner)
hero_jsx_inner = hero_jsx_inner.replace("</enter>", "</motion.g>")
hero_jsx_inner = "\n".join("      " + line if line.strip() else "" for line in hero_jsx_inner.splitlines())

hero_tsx = f'''"use client";
/**
 * Ilustración principal: ecosistema documental de NEXODOC.
 * ARCHIVO GENERADO por tools/build_assets.py desde design/hero.svg.
 * Edita el SVG fuente y vuelve a ejecutar el script.
 *
 * - Entrada escalonada de cada capa con Motion.
 * - Flotación, flujo de conexiones y pulsos con CSS (globals.css, clases nx-*),
 *   desactivados con prefers-reduced-motion.
 */
import {{ motion, useReducedMotion, type Variants }} from "framer-motion";

export function HeroIllustration({{ className = "" }}: {{ className?: string }}) {{
  const reduce = useReducedMotion();
  const layer: Variants = {{
    hidden: {{ opacity: 0, y: reduce ? 0 : 24 }},
    show: (i: number) => ({{
      opacity: 1,
      y: 0,
      transition: {{ delay: 0.35 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }},
    }}),
  }};

  return (
    <motion.svg
      viewBox="0 0 600 560"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="nx-hero-title"
      className={{`nx-hero-svg h-auto w-full ${{className}}`}}
      initial="hidden"
      animate="show"
    >
{hero_jsx_inner}
    </motion.svg>
  );
}}
'''
(FE / "illustrations").mkdir(parents=True, exist_ok=True)
(FE / "illustrations" / "HeroIllustration.tsx").write_text(hero_tsx, encoding="utf-8")

# --------------------------------------------------------------------------
# 2. Iconografía de categorías (24x24, trazo 1.6, acento turquesa)
#    "m" = trazos en currentColor · "a" = trazos de acento
# --------------------------------------------------------------------------
ICONS: dict[str, dict[str, list[str]]] = {
    "notarial": {
        "m": ['<path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.5"/>',
              '<path d="M13.5 3 19 8.5V11"/>', '<path d="M13.5 3v5.5H19"/>',
              '<path d="M8.5 11.5h4M8.5 15h2.5"/>'],
        "a": ['<circle cx="17" cy="16.5" r="3.2"/>', '<path d="m15.4 19.3-.9 2.7 2.5-1 2.5 1-.9-2.7"/>'],
    },
    "property": {
        "m": ['<path d="M3.5 11 12 4l8.5 7"/>', '<path d="M5.5 9.5V20h13V9.5"/>'],
        "a": ['<path d="M10 20v-5h4v5"/>', '<path d="M15.5 6.2V4.5h2v3.3"/>'],
    },
    "civil": {
        "m": ['<circle cx="8.5" cy="7.5" r="2.8"/>', '<path d="M3 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6"/>'],
        "a": ['<circle cx="17.5" cy="10.5" r="2.2"/>', '<path d="M14.9 20c.2-2.5 1.2-4.2 2.6-4.2s2.4 1.7 2.6 4.2"/>'],
    },
    "business": {
        "m": ['<path d="M4 21V6.5L12 3v18"/>', '<path d="M12 9h8v12"/>', '<path d="M2.5 21h19"/>',
              '<path d="M7 9h2M7 12.5h2M7 16h2"/>'],
        "a": ['<path d="M15 13h2M15 16.5h2"/>'],
    },
    "records": {
        "m": ['<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V6z"/>'],
        "a": ['<path d="m8.8 12.2 2.2 2.2 4.4-4.6"/>'],
    },
    "apostille": {
        "m": ['<circle cx="10.5" cy="10.5" r="7"/>', '<path d="M3.5 10.5h14"/>',
              '<path d="M10.5 3.5c2 2 3 4.4 3 7s-1 5-3 7c-2-2-3-4.4-3-7s1-5 3-7z"/>'],
        "a": ['<circle cx="17.5" cy="17.5" r="3.2"/>', '<path d="m16.2 17.6 1 1 1.8-1.9"/>'],
    },
    "academic": {
        "m": ['<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/>',
              '<path d="M6.5 11v4.5c1.5 1.5 3.4 2.2 5.5 2.2s4-.7 5.5-2.2V11"/>'],
        "a": ['<path d="M21.5 9v5.2"/>', '<circle cx="21.5" cy="15.6" r="1"/>'],
    },
    "judicial": {
        "m": ['<path d="M12 4.5V20"/>', '<path d="M7.5 20h9"/>', '<path d="M5 7h14"/>',
              '<path d="m5 7-2.5 6M5 7l2.5 6M19 7l-2.5 6M19 7l2.5 6"/>'],
        "a": ['<path d="M2.5 13a2.5 2.5 0 0 0 5 0z"/>', '<path d="M16.5 13a2.5 2.5 0 0 0 5 0z"/>',
              '<circle cx="12" cy="4" r="1.2"/>'],
    },
    "transit": {
        "m": ['<path d="M4 16.5v-4l2-5.2A2 2 0 0 1 7.9 6h8.2a2 2 0 0 1 1.9 1.3l2 5.2v4"/>',
              '<path d="M4 12.5h16"/>', '<path d="M4 16.5V19h16v-2.5"/>', '<path d="M6.5 19v1.5M17.5 19v1.5"/>'],
        "a": ['<circle cx="7.5" cy="15" r="1"/>', '<circle cx="16.5" cy="15" r="1"/>'],
    },
    "archive": {
        "m": ['<path d="M3 4.5h18v4H3z"/>',
              '<path d="M4.5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V8.5"/>'],
        "a": ['<path d="M10 12.5h4"/>', '<path d="M8 16h8"/>'],
    },
}

cases = []
symbols = []
for name, parts in ICONS.items():
    m = "".join(parts["m"])
    a = "".join(parts["a"])
    cases.append(f'    case "{name}":\n      return (\n        <>\n          {to_jsx(m)}\n          <g stroke={{accent}}>{to_jsx(a)}</g>\n        </>\n      );')
    symbols.append(
        f'<symbol id="ic-{name}" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" '
        f'stroke-linecap="round" stroke-linejoin="round">{m}<g stroke="var(--icon-accent,#19B7B0)">{a}</g></g></symbol>'
    )

icon_tsx = f'''/**
 * Iconografía propia de las 10 categorías de NEXODOC.
 * ARCHIVO GENERADO por tools/build_assets.py. Retícula 24 px, trazo 1.6,
 * terminaciones redondeadas, un solo detalle en turquesa por icono.
 */
import type {{ CategoryIconName }} from "@/lib/data/categories";

interface Props {{
  name: CategoryIconName;
  className?: string;
  /** Color del detalle de acento. Por defecto, turquesa de marca. */
  accent?: string;
}}

export function CategoryIcon({{ name, className = "h-6 w-6", accent = "#19B7B0" }}: Props) {{
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={{1.6}}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={{className}}
      aria-hidden="true"
    >
      <Glyph name={{name}} accent={{accent}} />
    </svg>
  );
}}

function Glyph({{ name, accent }}: {{ name: CategoryIconName; accent: string }}) {{
  switch (name) {{
{chr(10).join(cases)}
  }}
}}
'''
(FE / "icons").mkdir(parents=True, exist_ok=True)
(FE / "icons" / "CategoryIcon.tsx").write_text(icon_tsx, encoding="utf-8")

# --------------------------------------------------------------------------
# 3. Mapa de Colombia (silueta simplificada, proyección equirectangular)
# --------------------------------------------------------------------------
OUTLINE = [  # (lon, lat) en sentido horario desde Punta Gallinas
    (-71.67, 12.46), (-71.95, 12.25), (-72.2, 12.05), (-72.25, 11.85), (-72.9, 11.6), (-73.6, 11.3),
    (-74.2, 11.27), (-74.35, 10.98), (-74.85, 11.08), (-75.25, 10.8), (-75.55, 10.42), (-75.7, 9.9),
    (-75.6, 9.45), (-76.0, 9.2), (-76.3, 8.9), (-76.75, 8.55), (-76.9, 8.1), (-77.05, 8.4),
    (-77.37, 8.67), (-77.2, 8.3), (-77.25, 7.9), (-77.6, 7.5), (-77.9, 7.22), (-77.65, 6.9),
    (-77.45, 6.6), (-77.35, 6.2), (-77.5, 5.55), (-77.3, 4.7), (-77.35, 4.1), (-77.05, 3.9),
    (-77.5, 3.3), (-77.8, 2.6), (-78.3, 2.45), (-78.6, 2.05), (-78.8, 1.8), (-79.0, 1.6),
    (-78.85, 1.4), (-78.3, 1.2), (-77.7, 0.85), (-77.2, 0.65), (-76.6, 0.25), (-76.0, 0.1),
    (-75.3, -0.15), (-74.8, -0.4), (-74.2, -0.95), (-73.6, -1.3), (-73.1, -1.8), (-72.4, -2.3),
    (-71.6, -2.25), (-70.7, -2.35), (-70.75, -3.8), (-70.3, -3.9), (-69.95, -4.23), (-69.7, -3.2),
    (-69.4, -1.2), (-69.6, -0.6), (-70.05, 0.55), (-69.4, 0.95), (-69.15, 1.05), (-68.2, 1.75),
    (-67.6, 1.75), (-67.1, 1.45), (-66.87, 1.22), (-67.05, 2.0), (-67.35, 2.8), (-67.8, 3.4),
    (-67.6, 4.5), (-67.8, 5.3), (-67.45, 6.2), (-68.5, 6.15), (-69.4, 6.1), (-70.1, 6.6),
    (-70.7, 7.05), (-71.4, 7.0), (-72.0, 7.05), (-72.45, 7.4), (-72.45, 7.9), (-72.8, 8.6),
    (-72.75, 9.2), (-73.0, 9.5), (-72.95, 10.0), (-72.7, 10.6), (-72.4, 11.1), (-72.2, 11.6),
    (-71.95, 11.65), (-71.3, 11.85), (-71.2, 12.2),
]
CITIES = [  # nombre, lon, lat, mostrar etiqueta, lado de la etiqueta
    ("Barranquilla", -74.80, 10.96, True, "right"),
    ("Cartagena", -75.51, 10.39, True, "left"),
    ("Santa Marta", -74.20, 11.24, False, "right"),
    ("Cúcuta", -72.50, 7.89, True, "right"),
    ("Bucaramanga", -73.12, 7.12, True, "right"),
    ("Medellín", -75.57, 6.25, True, "left"),
    ("Yopal", -72.40, 5.34, True, "right"),
    ("Pereira", -75.69, 4.81, False, "left"),
    ("Bogotá", -74.07, 4.71, True, "right"),
    ("Villavicencio", -73.63, 4.14, False, "right"),
    ("Cali", -76.53, 3.45, True, "left"),
    ("Pasto", -77.28, 1.21, True, "left"),
]

LON0, LAT0, K, PAD = -79.2, 12.7, 28.0, 14.0


def proj(lon: float, lat: float) -> tuple[float, float]:
    return round((lon - LON0) * K + PAD, 1), round((LAT0 - lat) * K + PAD, 1)


poly = [proj(*p) for p in OUTLINE]
xs, ys = [p[0] for p in poly], [p[1] for p in poly]
W, H = round(max(xs) + PAD), round(max(ys) + PAD)
outline_d = "M" + " L".join(f"{x} {y}" for x, y in poly) + " Z"


def inside(x: float, y: float) -> bool:
    hit = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            hit = not hit
        j = i
    return hit


STEP = 9.0
dots = []
y = PAD
while y < H:
    x = PAD + (STEP / 2 if int((y - PAD) / STEP) % 2 else 0)
    while x < W:
        if inside(x, y):
            dots.append((round(x, 1), round(y, 1)))
        x += STEP
    y += STEP
dots_d = "".join(f"M{x} {y}h0" for x, y in dots)
cities = [
    {"name": n, "x": proj(lo, la)[0], "y": proj(lo, la)[1], "label": lab, "side": side}
    for n, lo, la, lab, side in CITIES
]

geo_ts = f'''/**
 * Silueta simplificada de Colombia para la sección de cobertura.
 * ARCHIVO GENERADO por tools/build_assets.py (proyección equirectangular).
 * Es una ilustración de referencia, no cartografía oficial.
 */
export const COLOMBIA_VIEWBOX = "0 0 {W} {H}";
export const COLOMBIA_OUTLINE = "{outline_d}";
export const COLOMBIA_DOTS = "{dots_d}";
export const COLOMBIA_CITIES = {json.dumps(cities, ensure_ascii=False, indent=2)} as const;
'''
(FE / "illustrations" / "colombia-geo.ts").write_text(geo_ts, encoding="utf-8")

# --------------------------------------------------------------------------
# 4. Paquete para la vista previa estática
# --------------------------------------------------------------------------
build = ROOT / "design" / "build"
build.mkdir(parents=True, exist_ok=True)
(build / "assets.json").write_text(
    json.dumps(
        {
            "hero": hero_html,
            "symbols": "".join(symbols),
            "map": {"viewBox": f"0 0 {W} {H}", "outline": outline_d, "dots": dots_d, "cities": cities},
        },
        ensure_ascii=False,
    ),
    encoding="utf-8",
)
print(f"hero ok · {len(ICONS)} iconos · mapa {W}x{H} con {len(dots)} puntos")
