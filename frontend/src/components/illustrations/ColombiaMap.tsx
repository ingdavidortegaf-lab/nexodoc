"use client";

import { motion, useReducedMotion } from "framer-motion";
import { COLOMBIA_CITIES, COLOMBIA_DOTS, COLOMBIA_OUTLINE, COLOMBIA_VIEWBOX } from "./colombia-geo";

/**
 * Mapa de puntos de Colombia con las ciudades principales. Las líneas
 * representan conexiones digitales entre ciudades, no sedes físicas.
 */
const links: [string, string][] = [
  ["Barranquilla", "Medellín"],
  ["Medellín", "Bogotá"],
  ["Bogotá", "Cali"],
  ["Bogotá", "Yopal"],
  ["Bucaramanga", "Bogotá"],
  ["Cali", "Pasto"],
  ["Cúcuta", "Bucaramanga"],
  ["Cartagena", "Barranquilla"],
];

export function ColombiaMap({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const city = (n: string) => COLOMBIA_CITIES.find((c) => c.name === n)!;

  return (
    <svg viewBox={COLOMBIA_VIEWBOX} className={`h-auto w-full ${className}`} role="img" aria-labelledby="mapa-title">
      <title id="mapa-title">{`Mapa ilustrativo de Colombia con ciudades principales: ${COLOMBIA_CITIES.map((c) => c.name).join(", ")}`}</title>
      <path d={COLOMBIA_OUTLINE} fill="#FFFFFF" stroke="#173B5E" strokeOpacity={0.14} strokeWidth={1.2} strokeLinejoin="round" />
      <path d={COLOMBIA_DOTS} stroke="#173B5E" strokeOpacity={0.28} strokeWidth={3.2} strokeLinecap="round" />
      <g fill="none" stroke="#19B7B0" strokeWidth={1.4} strokeLinecap="round">
        {links.map(([a, b], i) => {
          const p = city(a);
          const q = city(b);
          const mx = (p.x + q.x) / 2 + (q.y - p.y) * 0.18;
          const my = (p.y + q.y) / 2 - (q.x - p.x) * 0.18;
          return (
            <motion.path
              key={`${a}-${b}`}
              d={`M${p.x} ${p.y} Q${mx} ${my} ${q.x} ${q.y}`}
              strokeOpacity={0.6}
              strokeDasharray="3 5"
              initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 1.2, delay: 0.3 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}
      </g>
      {COLOMBIA_CITIES.map((c, i) => (
        <g key={c.name}>
          <circle className="nx-ping" cx={c.x} cy={c.y} r={5} fill="#19B7B0" fillOpacity={0.35} style={{ animationDelay: `${-i * 0.4}s` }} />
          <circle cx={c.x} cy={c.y} r={4.2} fill="#19B7B0" stroke="#FFFFFF" strokeWidth={2} />
          {c.label && (
            <text
              x={c.side === "right" ? c.x + 9 : c.x - 9}
              y={c.y + 4}
              textAnchor={c.side === "right" ? "start" : "end"}
              fontSize={11.5}
              fontWeight={600}
              fill="#10243A"
              stroke="#F4F7FA"
              strokeWidth={3.5}
              paintOrder="stroke"
              style={{ fontFamily: "var(--font-inter), sans-serif" }}
            >
              {c.name}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
