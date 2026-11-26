"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { UiIcon } from "@/components/icons/UiIcon";
import { asset } from "@/lib/site";

const SOURCES = {
  wide: { src: "/video/nexodoc-promo-horizontal.mp4", poster: "/video/nexodoc-promo-horizontal.jpg", ratio: "16 / 9" },
  square: { src: "/video/nexodoc-promo-cuadrado.mp4", poster: "/video/nexodoc-promo-cuadrado.jpg", ratio: "1 / 1" },
};

/**
 * Banner de video de la portada. Horizontal en escritorio y cuadrado en
 * celular (se elige al montar, así sólo se descarga uno). Se reproduce sin
 * sonido y en bucle cuando está a la vista; con «reducir movimiento» queda en
 * pausa y el usuario decide. Botón de pausa siempre disponible (WCAG 2.2.2).
 */
export function VideoBanner() {
  const ref = useRef<HTMLVideoElement>(null);
  const [format, setFormat] = useState<keyof typeof SOURCES>("wide");
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const pick = () => setFormat(mq.matches ? "square" : "wide");
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, []);

  // Reproducir sólo cuando el banner está a la vista (ahorra batería y datos)
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !reduce && v.dataset.userPaused !== "1") void v.play().catch(() => undefined);
        else if (!e.isIntersecting) v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [format]);

  const s = SOURCES[format];
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.dataset.userPaused = "0";
      void v.play();
    } else {
      v.dataset.userPaused = "1";
      v.pause();
    }
  };

  return (
    <section className="relative overflow-hidden bg-night py-16 text-white md:py-24" aria-labelledby="video-title">
      <div className="bg-dots-light pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-teal/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="container-site relative grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          <p className="font-label text-sm font-semibold uppercase tracking-[0.14em] text-teal-300">Así funciona</p>
          <h2 id="video-title" className="mt-4 text-h2 font-extrabold text-white">
            Tu documento en tres pasos, sin filas.
          </h2>
          <p className="mt-5 max-w-md text-lead text-white/70">
            Lo pides en línea, lo pagas con PSE, tarjeta o Nequi y sigues cada avance hasta recibirlo.
          </p>
          <ol className="mt-8 space-y-3">
            {["Diligencia el formulario del documento", "Paga en línea de forma segura", "Sigue tu pedido y recíbelo"].map((t, i) => (
              <li key={t} className="flex items-center gap-3 text-[0.9375rem] text-white/85">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 font-label text-sm font-bold text-teal-300 ring-1 ring-white/15">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/solicitar" variant="light" size="lg" arrow className="w-full sm:w-auto" magnetic={false}>
              Solicitar un documento
            </Button>
          </div>
        </div>

        <div className="relative">
          <div
            className="relative overflow-hidden rounded-xl bg-navy shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] ring-1 ring-white/10"
            style={{ aspectRatio: s.ratio }}
          >
            <video
              key={format}
              ref={ref}
              className={`h-full w-full object-cover transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
              muted
              loop
              playsInline
              preload="metadata"
              poster={asset(s.poster)}
              onCanPlay={() => setReady(true)}
              onLoadedData={() => setReady(true)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              aria-label="Video: cómo pedir un documento con NEXODOC en tres pasos"
            >
              <source src={asset(s.src)} type="video/mp4" />
            </video>
            {!ready && (
              // Póster mientras carga el video (evita un recuadro vacío)
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset(s.poster)} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pausar video" : "Reproducir video"}
              className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-night/70 text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-night"
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-white/50">
            <UiIcon name="info" className="h-3.5 w-3.5" /> Video sin sonido · 15 s
          </p>
        </div>
      </div>
    </section>
  );
}
