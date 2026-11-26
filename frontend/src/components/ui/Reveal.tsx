"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Aparición al hacer scroll, sin ocultar nada antes de que cargue el JavaScript.
 *
 * El contenido se envía visible desde el servidor. Al montar, sólo lo que está
 * por debajo de la pantalla se marca como «pendiente» y se anima al entrar.
 * Lo que ya está a la vista no se oculta nunca (antes, en celulares lentos, las
 * secciones quedaban en blanco hasta que cargaba Motion). Las transiciones viven
 * en globals.css (.nx-reveal) y respetan prefers-reduced-motion.
 */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // ya visible
    el.dataset.reveal = "pending";
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.reveal = "in";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

type Base = { children: ReactNode; className?: string; style?: CSSProperties; id?: string };

export function Reveal({ delay = 0, y = 28, children, className, style, id }: Base & { delay?: number; y?: number }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      id={id}
      className={`nx-reveal ${className ?? ""}`}
      style={{ ...style, ["--nx-y" as string]: `${y}px`, ["--nx-delay" as string]: `${delay}s` }}
    >
      {children}
    </div>
  );
}

/** Contenedor que escalona la aparición de sus hijos <RevealItem>. */
export function RevealGroup({ children, className, style, id, stagger = 0.08 }: Base & { stagger?: number }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} id={id} className={`nx-reveal-group ${className ?? ""}`} style={{ ...style, ["--nx-stagger" as string]: `${stagger}s` }}>
      {children}
    </div>
  );
}

export function RevealItem({ children, className, style, id }: Base) {
  return (
    <div id={id} className={`nx-reveal-item ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}
