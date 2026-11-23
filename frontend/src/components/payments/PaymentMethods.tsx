import { UiIcon } from "@/components/icons/UiIcon";

const methods = [
  { name: "PSE", detail: "Débito desde tu banco" },
  { name: "Tarjeta", detail: "Crédito o débito" },
  { name: "Nequi", detail: "Desde tu celular" },
  { name: "Bancolombia", detail: "Botón de pago" },
];

/** Medios de pago disponibles en el checkout de Wompi. */
export function PaymentMethods({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "" : "rounded-xl bg-night p-6 text-white md:p-8"}>
      {!compact && (
        <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            <UiIcon name="lock" className="h-5 w-5 text-teal-300" /> Pagos en línea seguros
          </p>
          <p className="text-sm text-white/70">Procesados por Wompi (Bancolombia). NEXODOC no ve ni guarda los datos de tu tarjeta.</p>
        </div>
      )}
      <ul className={`grid grid-cols-2 gap-2.5 ${compact ? "" : "md:grid-cols-4"}`}>
        {methods.map((m) => (
          <li
            key={m.name}
            className={`rounded-lg px-4 py-3 ${compact ? "bg-mist text-night" : "bg-white/[0.07] ring-1 ring-white/10"}`}
          >
            <span className="block font-label font-bold">{m.name}</span>
            <span className={`block text-xs ${compact ? "text-slate" : "text-white/65"}`}>{m.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
