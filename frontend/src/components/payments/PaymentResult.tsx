"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { UiIcon } from "@/components/icons/UiIcon";
import { Button } from "@/components/ui/Button";
import { formatCOP } from "@/lib/data/pricing";
import { recallOrder } from "@/lib/cart";

type State = "checking" | "approved" | "pending" | "declined" | "error" | "unknown";
interface Tx { order_code: string | null; status: string; purpose: string | null; amount: number | null; method: string | null }

const methodLabel: Record<string, string> = { PSE: "PSE", CARD: "tarjeta", NEQUI: "Nequi", BANCOLOMBIA_TRANSFER: "Bancolombia" };

/**
 * Página a la que Wompi devuelve al cliente (?id=TRANSACCIÓN). El resultado
 * se confirma en el servidor consultando a Wompi; nunca se confía en la URL.
 * PSE puede quedar «pendiente» unos minutos: se vuelve a consultar.
 */
export function PaymentResult() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const [state, setState] = useState<State>(id ? "checking" : "unknown");
  const [tx, setTx] = useState<Tx | null>(null);
  const tries = useRef(0);

  useEffect(() => {
    if (!id) return;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      tries.current += 1;
      const res = await fetch(`/api/pagos/transaccion?id=${encodeURIComponent(id)}`).catch(() => null);
      const json: Tx | null = res?.ok ? await res.json().catch(() => null) : null;
      if (!json) {
        if (tries.current < 3) timer = setTimeout(check, 3000);
        else setState("error");
        return;
      }
      setTx(json);
      if (json.status === "approved") return setState("approved");
      if (["declined", "voided", "error"].includes(json.status)) return setState("declined");
      setState("pending");
      if (tries.current < 15) timer = setTimeout(check, 4000);
    };
    void check();
    return () => clearTimeout(timer);
  }, [id]);

  const code = tx?.order_code ?? recallOrder()?.code ?? null;
  const view = {
    checking: { icon: "clock", tone: "bg-mist text-teal-ink", title: "Confirmando tu pago…", text: "Estamos verificando la transacción con la pasarela de pagos." },
    approved: {
      icon: "check",
      tone: "bg-teal-soft text-teal-ink",
      title: "¡Pago aprobado!",
      text:
        tx?.purpose === "quote"
          ? "Recibimos tu pago. Iniciamos la gestión ante la entidad y te avisaremos cada avance."
          : "Recibimos el pago de verificación. Empezamos a revisar tu pedido y te enviaremos el valor final.",
    },
    pending: { icon: "clock", tone: "bg-amber-50 text-amber-700", title: "Pago en proceso", text: "Tu banco aún no confirma el pago. Puede tardar unos minutos; te avisaremos por correo cuando se apruebe." },
    declined: { icon: "alert", tone: "bg-red-50 text-red-700", title: "El pago no se completó", text: "La transacción fue rechazada o cancelada. No se realizó ningún cobro; puedes intentarlo de nuevo desde el estado de tu pedido." },
    error: { icon: "alert", tone: "bg-amber-50 text-amber-700", title: "No pudimos confirmar el pago", text: "Si el banco te hizo el cobro, el pago se reflejará en tu pedido en unos minutos. Consulta el estado más tarde." },
    unknown: { icon: "info", tone: "bg-mist text-teal-ink", title: "Sin información del pago", text: "No recibimos datos de una transacción. Consulta el estado de tu pedido." },
  }[state];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-xl rounded-xl bg-white p-8 text-center shadow-lift ring-1 ring-night/5 md:p-12"
      role="status"
      aria-live="polite"
    >
      <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${view.tone}`}>
        <UiIcon name={view.icon as "check"} className={`h-8 w-8 ${state === "checking" ? "animate-pulse" : ""}`} strokeWidth={state === "approved" ? 2.6 : 1.8} />
      </span>
      <h1 className="mt-6 font-display text-2xl font-bold">{view.title}</h1>
      <p className="mx-auto mt-3 max-w-md text-slate">{view.text}</p>
      {tx?.amount && state !== "checking" && (
        <p className="mx-auto mt-5 inline-flex flex-wrap justify-center gap-x-2 rounded-full bg-mist px-4 py-2 font-label text-sm font-semibold text-night">
          <span className="tabular-nums">{formatCOP(tx.amount)}</span>
          {tx.method && <span className="text-slate">· {methodLabel[tx.method] ?? tx.method}</span>}
          {code && <span className="text-slate">· Pedido {code}</span>}
        </p>
      )}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button href={code ? `/estado?codigo=${code}` : "/estado"} arrow magnetic={false}>
          Ver estado del pedido
        </Button>
        <Button href="/solicitar" variant="secondary" magnetic={false}>
          Solicitar otro documento
        </Button>
      </div>
    </motion.div>
  );
}
