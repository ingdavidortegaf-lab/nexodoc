"use client";

/**
 * Carrito de documentos. Los datos de cada documento se guardan en el navegador
 * (localStorage) para no perderlos al navegar; los archivos adjuntos se
 * mantienen sólo en memoria, porque no deben quedar guardados en el equipo.
 * Si se recarga la página, el carrito pide volver a adjuntarlos.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  id: string;
  service: string; // slug o "otro"
  values: Record<string, string>;
  addedAt: number;
}

interface CartState {
  items: CartItem[];
  files: Record<string, Record<string, File[]>>; // itemId → campo → archivos
  ready: boolean;
  add: (item: Omit<CartItem, "id" | "addedAt">, files?: Record<string, File[]>) => string;
  update: (id: string, values: Record<string, string>, files?: Record<string, File[]>) => void;
  remove: (id: string) => void;
  setFiles: (id: string, field: string, files: File[]) => void;
  clear: () => void;
}

const STORAGE_KEY = "nexodoc.cart.v1";
const Ctx = createContext<CartState | null>(null);

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function load(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && typeof i.service === "string" && i.values).slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [files, setFilesState] = useState<CartState["files"]>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(load());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setItems(load());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* almacenamiento no disponible: el carrito funciona en memoria */
    }
  }, [items, ready]);

  const add = useCallback<CartState["add"]>((item, f) => {
    const id = newId();
    setItems((prev) => [...prev, { ...item, id, addedAt: Date.now() }].slice(0, 10));
    if (f) setFilesState((prev) => ({ ...prev, [id]: f }));
    return id;
  }, []);

  const update = useCallback<CartState["update"]>((id, values, f) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, values } : i)));
    if (f) setFilesState((prev) => ({ ...prev, [id]: f }));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setFilesState((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const setFiles = useCallback((id: string, field: string, list: File[]) => {
    setFilesState((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: list } }));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setFilesState({});
  }, []);

  const value = useMemo(() => ({ items, files, ready, add, update, remove, setFiles, clear }), [items, files, ready, add, update, remove, setFiles, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}

/** Último pedido enviado (para la página de resultado del pago y la consulta). */
const LAST_ORDER_KEY = "nexodoc.lastOrder";
export function rememberOrder(code: string, email: string) {
  try {
    window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ code, email }));
  } catch {
    /* sin almacenamiento: el cliente escribe los datos a mano */
  }
}
export function recallOrder(): { code: string; email: string } | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
