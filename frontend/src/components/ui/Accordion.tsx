"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState } from "react";
import { UiIcon } from "@/components/icons/UiIcon";

interface Item {
  q: string;
  a: string;
}

/** Acordeón accesible: un panel abierto a la vez, navegable con teclado. */
export function Accordion({ items, defaultOpen = 0 }: { items: Item[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const uid = useId();

  return (
    <div className="divide-y divide-line rounded-xl bg-white shadow-card ring-1 ring-night/5">
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${uid}-btn-${i}`;
        const panelId = `${uid}-panel-${i}`;
        return (
          <div key={item.q}>
            <h3 className="font-sans text-base">
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left font-semibold text-night transition-colors hover:text-navy md:px-8"
              >
                {item.q}
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-500 ease-out-expo ${
                    isOpen ? "rotate-45 bg-night text-white" : "bg-mist text-night"
                  }`}
                >
                  <UiIcon name="plus" className="h-4 w-4" strokeWidth={2} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl px-6 pb-6 text-slate md:px-8">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
