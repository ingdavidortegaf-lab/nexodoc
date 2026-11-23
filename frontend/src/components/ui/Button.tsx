"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { UiIcon } from "@/components/icons/UiIcon";

type Variant = "primary" | "secondary" | "ghost" | "light" | "outline-light";
type Size = "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full font-label font-semibold tracking-[-0.01em] " +
  "transition-[background-color,color,box-shadow,border-color] duration-300 ease-out-expo " +
  "disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-night text-white shadow-[0_8px_20px_-10px_rgb(16_36_58/0.6)] hover:bg-navy hover:shadow-glow",
  secondary: "bg-white text-night shadow-inset hover:bg-mist",
  ghost: "text-night hover:bg-night/5",
  light: "bg-teal text-night hover:bg-teal-300 hover:shadow-glow",
  "outline-light": "text-white ring-1 ring-white/25 hover:bg-white/10 hover:ring-white/40",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-7 text-base",
};

interface Common {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  magnetic?: boolean;
  className?: string;
}

/**
 * Botón con efecto magnético discreto (sólo con puntero fino y sin
 * prefers-reduced-motion). Se comporta como enlace si recibe `href`.
 */
export function Button(props: Common & ({ href: string } | ({ href?: undefined } & ComponentProps<"button">))) {
  const { children, variant = "primary", size = "md", arrow = false, magnetic = true, className = "", ...rest } = props;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.4 });

  const onMove = (e: React.PointerEvent) => {
    if (!magnetic || reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.18);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.28);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const content = (
    <>
      <span>{children}</span>
      {arrow && (
        <UiIcon name="arrowRight" className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
      )}
    </>
  );
  const cls = `group ${base} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <motion.span
      ref={ref}
      style={{ x, y }}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="inline-flex"
    >
      {"href" in rest && rest.href ? (
        <Link href={rest.href} className={cls}>
          {content}
        </Link>
      ) : (
        <button {...(rest as ComponentProps<"button">)} className={cls}>
          {content}
        </button>
      )}
    </motion.span>
  );
}
