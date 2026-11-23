import { LogoMark } from "@/components/ui/Logo";

/** Pantalla de carga: el documento de la marca "respira" mientras llega la página. */
export default function Loading() {
  return (
    <div className="grid min-h-[70vh] place-items-center pt-[72px]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-teal/20 motion-reduce:animate-none" />
          <LogoMark className="relative h-14 w-14" />
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-mist">
          <div className="h-full w-1/3 animate-[nx-loading_1.2s_ease-in-out_infinite] rounded-full bg-teal motion-reduce:animate-none" />
        </div>
        <span className="sr-only">Cargando…</span>
      </div>
    </div>
  );
}
