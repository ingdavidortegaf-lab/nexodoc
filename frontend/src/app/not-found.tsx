import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="bg-hero grid min-h-[80vh] place-items-center pt-[72px]">
      <div className="container-site max-w-xl text-center">
        <p className="font-label text-sm font-semibold text-teal-ink">Error 404</p>
        <h1 className="mt-3 text-h2 font-extrabold">Este documento no está en nuestro archivo.</h1>
        <p className="mt-4 text-lead text-slate">La página que buscas no existe o cambió de dirección.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/" arrow>
            Volver al inicio
          </Button>
          <Button href="/servicios" variant="secondary">
            Ver servicios
          </Button>
        </div>
      </div>
    </section>
  );
}
