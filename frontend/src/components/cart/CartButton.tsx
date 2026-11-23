"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart";

export function CartButton() {
  const { items, ready } = useCart();
  const count = ready ? items.length : 0;
  return (
    <Link
      href="/carrito"
      aria-label={count ? `Carrito, ${count} ${count === 1 ? "documento" : "documentos"}` : "Carrito"}
      className="relative grid h-11 w-11 place-items-center rounded-full text-night ring-1 ring-night/10 transition-colors hover:bg-night/5"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3.5 4.5h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.1l1.7-6.3H6.6" />
        <circle cx="9.5" cy="19.5" r="1.2" />
        <circle cx="17" cy="19.5" r="1.2" />
      </svg>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-teal px-1 font-label text-[0.6875rem] font-bold tabular-nums text-night"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
