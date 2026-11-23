"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { UiIcon } from "@/components/icons/UiIcon";
import { CartButton } from "@/components/cart/CartButton";
import { mainNav } from "@/lib/site";

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-out-expo ${
        scrolled || open
          ? "bg-white/80 shadow-[0_1px_0_rgb(16_36_58/0.07)] backdrop-blur-xl backdrop-saturate-150"
          : "bg-transparent"
      }`}
    >
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-full focus:bg-night focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <nav className="container-site flex h-[72px] items-center justify-between gap-4" aria-label="Principal">
        <Logo />

        <ul className="hidden items-center gap-1 xl:flex">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="relative whitespace-nowrap rounded-full px-2.5 py-2 font-label text-[0.9375rem] font-medium text-night/75 transition-colors hover:text-night"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/estado"
            className="hidden items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 font-label text-[0.9375rem] font-semibold text-night transition-colors hover:bg-night/5 md:inline-flex xl:hidden"
          >
            <UiIcon name="route" className="h-4 w-4" />
            Mi pedido
          </Link>
          <CartButton />
          <div className="hidden sm:block">
            <Button href="/solicitar" size="md">
              Solicitar documento
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="grid h-11 w-11 place-items-center rounded-full text-night ring-1 ring-night/10 transition-colors hover:bg-night/5 xl:hidden"
          >
            <UiIcon name={open ? "close" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-movil"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100dvh - 72px)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-y-auto bg-white xl:hidden"
          >
            <motion.ul
              className="container-site flex flex-col gap-1 py-6"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } } }}
            >
              {[...mainNav, { label: "Carrito", href: "/carrito" }].map((item) => (
                <motion.li
                  key={item.href}
                  variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-line py-4 font-display text-2xl font-semibold text-night"
                  >
                    {item.label}
                    <UiIcon name="arrowRight" className="h-5 w-5 text-slate" />
                  </Link>
                </motion.li>
              ))}
              <motion.li variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="pt-6">
                <Button href="/solicitar" size="lg" className="w-full" arrow magnetic={false}>
                  Solicitar documento
                </Button>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
