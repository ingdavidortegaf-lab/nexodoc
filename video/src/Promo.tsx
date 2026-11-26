import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { C, EASE_OUT, fonts } from "./theme";
import { Check, DocCard, LightBackdrop, NightBackdrop, Pop, Rise, Wordmark } from "./parts";

const ease = Easing.bezier(...EASE_OUT);

/** Medidas según el formato: horizontal (web), cuadrado (feed) o vertical (historias). */
function useLayout() {
  const { width, height } = useVideoConfig();
  const ratio = width / height;
  const landscape = ratio > 1.2;
  const portrait = ratio < 0.8;
  const square = !landscape && !portrait;
  const u = Math.min(width, height) / 1080; // escala respecto a 1080 px
  return { width, height, landscape, portrait, square, u, pad: (landscape ? 110 : 90) * u };
}

const Headline: React.FC<{ children: React.ReactNode; dark?: boolean; at?: number; size?: number }> = ({ children, dark, at = 0.15, size }) => {
  const { u, landscape, square } = useLayout();
  return (
    <Rise at={at}>
      <h1
        style={{
          margin: 0,
          fontFamily: fonts.display,
          fontWeight: 800,
          fontSize: (size ?? (landscape ? 104 : square ? 84 : 96)) * u,
          lineHeight: 1.02,
          letterSpacing: -3 * u,
          color: dark ? C.white : C.night,
        }}
      >
        {children}
      </h1>
    </Rise>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({ children, dark }) => {
  const { u } = useLayout();
  return (
    <Rise at={0}>
      <div
        style={{
          fontFamily: fonts.body,
          fontWeight: 600,
          fontSize: 34 * u,
          letterSpacing: 4 * u,
          textTransform: "uppercase",
          color: dark ? C.mint : C.tealInk,
          marginBottom: 22 * u,
        }}
      >
        {children}
      </div>
    </Rise>
  );
};

/* ---------- Escena 1: ¿Necesitas un documento? ---------- */
const SceneDocs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, landscape, pad } = useLayout();
  const cardW = (landscape ? 330 : 300) * u;
  const cards = [
    { label: "Registro civil", rot: -12, x: -1.05, y: 0.12, at: 0.35 },
    { label: "Escritura pública", rot: 2, x: 0, y: 0, at: 0.55, seal: true },
    { label: "Tradición y libertad", rot: 13, x: 1.05, y: 0.14, at: 0.75 },
  ];
  return (
    <AbsoluteFill style={{ flexDirection: landscape ? "row" : "column", padding: pad, alignItems: "center", gap: 40 * u }}>
      <NightBackdrop />
      <div style={{ position: "relative", flex: landscape ? 1 : undefined, width: landscape ? undefined : "100%" }}>
        <Eyebrow dark>Gestión documental · Colombia</Eyebrow>
        <Headline dark>¿Necesitas un documento?</Headline>
        <Rise at={0.6}>
          <p style={{ margin: `${28 * u}px 0 0`, fontFamily: fonts.body, fontSize: 44 * u, lineHeight: 1.35, color: "rgba(255,255,255,0.75)" }}>
            Registros civiles, escrituras, certificados y apostillas.
          </p>
        </Rise>
      </div>
      <div style={{ position: "relative", flex: 1, width: "100%", display: "grid", placeItems: "center" }}>
        {cards.map((c) => {
          const t = interpolate(frame, [c.at * fps, (c.at + 0.9) * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
          const float = Math.sin((frame + c.at * 40) / 22) * 8 * u;
          return (
            <div
              key={c.label}
              style={{
                position: "absolute",
                opacity: t,
                translate: `${c.x * cardW * 0.78}px ${c.y * cardW + (1 - t) * 160 * u + float}px`,
                rotate: `${c.rot * t}deg`,
              }}
            >
              <DocCard w={cardW} label={c.label} seal={c.seal && frame > (c.at + 0.9) * fps} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Escena 2: Pídelo en línea ---------- */
const typed = (text: string, frame: number, start: number, cps = 26, fps = 30) =>
  text.slice(0, Math.max(0, Math.floor(((frame - start) / fps) * cps)));

const SceneForm: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, landscape, square, pad } = useLayout();
  const fields = [
    { label: "Tipo de registro", value: "Nacimiento", at: 0.5 },
    { label: "Notaría o registraduría", value: "Notaría 5 de Medellín", at: 0.95 },
    { label: "Indicativo serial", value: "12345678", at: 1.6 },
  ];
  const press = interpolate(frame, [2.25 * fps, 2.35 * fps, 2.5 * fps], [1, 0.94, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const added = frame > 2.4 * fps;
  const phoneW = (landscape ? 470 : 560) * u;
  return (
    <AbsoluteFill style={{ flexDirection: landscape ? "row" : "column", padding: pad, alignItems: "center", gap: 56 * u }}>
      <LightBackdrop />
      <div style={{ position: "relative", flex: landscape ? 1 : undefined, width: landscape ? undefined : "100%" }}>
        <Eyebrow>Paso 1</Eyebrow>
        <Headline>Pídelo en línea, sin filas</Headline>
        <Rise at={0.5}>
          <p style={{ margin: `${28 * u}px 0 0`, fontFamily: fonts.body, fontSize: 44 * u, lineHeight: 1.35, color: C.slate }}>
            Un formulario guiado para cada documento.
          </p>
        </Rise>
      </div>
      <Rise at={0.2} y={80} style={{ position: "relative", flex: landscape ? undefined : 1, display: "grid", placeItems: square ? "start center" : "center", scale: square ? "0.62" : "1", transformOrigin: "top center" }}>
        <div
          style={{
            width: phoneW,
            borderRadius: 54 * u,
            background: C.night,
            padding: 16 * u,
            boxShadow: `0 ${40 * u}px ${80 * u}px -${30 * u}px rgba(16,36,58,0.55)`,
          }}
        >
          <div style={{ borderRadius: 40 * u, background: C.white, padding: `${34 * u}px ${30 * u}px`, display: "flex", flexDirection: "column", gap: 22 * u }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Wordmark size={34 * u} />
              <div style={{ position: "relative", width: 52 * u, height: 52 * u, borderRadius: 99, border: `${2 * u}px solid ${C.line}`, display: "grid", placeItems: "center" }}>
                <svg width={26 * u} height={26 * u} viewBox="0 0 24 24" fill="none" stroke={C.night} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 4.5h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.1l1.7-6.3H6.6" />
                </svg>
                {added && (
                  <Pop at={2.4} style={{ position: "absolute", top: -8 * u, right: -8 * u }}>
                    <div style={{ minWidth: 26 * u, height: 26 * u, borderRadius: 99, background: C.teal, color: C.night, fontFamily: fonts.body, fontWeight: 700, fontSize: 16 * u, display: "grid", placeItems: "center" }}>1</div>
                  </Pop>
                )}
              </div>
            </div>
            <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 36 * u, color: C.night, lineHeight: 1.1 }}>Registro civil de nacimiento</div>
            {fields.map((f) => (
              <div key={f.label}>
                <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 20 * u, color: C.night, marginBottom: 8 * u }}>{f.label}</div>
                <div
                  style={{
                    height: 62 * u,
                    borderRadius: 14 * u,
                    border: `${2 * u}px solid ${frame >= f.at * fps && frame < (f.at + 0.6) * fps ? C.teal : C.line}`,
                    padding: `0 ${18 * u}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontFamily: fonts.body,
                    fontSize: 24 * u,
                    color: C.night,
                  }}
                >
                  {typed(f.value, frame, f.at * fps, 26, fps)}
                  {frame > (f.at + 0.7) * fps && <Check size={26 * u} />}
                </div>
              </div>
            ))}
            <div
              style={{
                marginTop: 6 * u,
                height: 70 * u,
                borderRadius: 99,
                background: added ? C.teal : C.night,
                color: added ? C.night : C.white,
                fontFamily: fonts.body,
                fontWeight: 700,
                fontSize: 24 * u,
                display: "grid",
                placeItems: "center",
                scale: `${press}`,
              }}
            >
              {added ? "Agregado al carrito ✓" : "Agregar al carrito"}
            </div>
          </div>
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

/* ---------- Escena 3: Paga en línea ---------- */
const ScenePay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, landscape, pad } = useLayout();
  const methods = [
    { name: "PSE", detail: "Débito desde tu banco", at: 0.45 },
    { name: "Tarjeta", detail: "Crédito o débito", at: 0.6 },
    { name: "Nequi", detail: "Desde tu celular", at: 0.75 },
    { name: "Bancolombia", detail: "Botón de pago", at: 0.9 },
  ];
  const approved = frame > 1.8 * fps;
  return (
    <AbsoluteFill style={{ flexDirection: landscape ? "row" : "column", padding: pad, alignItems: "center", gap: 56 * u }}>
      <NightBackdrop glowX="30%" glowY="70%" />
      <div style={{ position: "relative", flex: landscape ? 1 : undefined, width: landscape ? undefined : "100%" }}>
        <Eyebrow dark>Paso 2</Eyebrow>
        <Headline dark>Paga con PSE, tarjeta o Nequi</Headline>
        <Rise at={0.5}>
          <p style={{ margin: `${28 * u}px 0 0`, fontFamily: fonts.body, fontSize: 44 * u, lineHeight: 1.35, color: "rgba(255,255,255,0.75)" }}>
            Pagos seguros procesados por Wompi.
          </p>
        </Rise>
      </div>
      <div style={{ position: "relative", flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 * u }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 * u }}>
          {methods.map((m) => (
            <Pop key={m.name} at={m.at}>
              <div style={{ borderRadius: 26 * u, padding: `${26 * u}px ${28 * u}px`, background: "rgba(255,255,255,0.07)", border: `${2 * u}px solid rgba(255,255,255,0.14)` }}>
                <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 44 * u, color: C.white }}>{m.name}</div>
                <div style={{ fontFamily: fonts.body, fontSize: 24 * u, color: "rgba(255,255,255,0.65)", marginTop: 4 * u }}>{m.detail}</div>
              </div>
            </Pop>
          ))}
        </div>
        {approved && (
          <Pop at={1.8}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 * u, borderRadius: 28 * u, padding: `${26 * u}px ${30 * u}px`, background: C.white }}>
              <Check size={64 * u} />
              <div>
                <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 40 * u, color: C.night }}>Pago aprobado</div>
                <div style={{ fontFamily: fonts.body, fontSize: 26 * u, color: C.slate }}>Pedido ND-2026-000123</div>
              </div>
            </div>
          </Pop>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Escena 4: Sigue tu pedido ---------- */
const SceneTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, landscape, portrait, pad } = useLayout();
  const steps = ["Recibida", "En revisión", "En gestión", "Documento disponible"];
  return (
    <AbsoluteFill style={{ flexDirection: landscape ? "row" : "column", padding: pad, alignItems: "center", gap: 56 * u }}>
      <LightBackdrop />
      <div style={{ position: "relative", flex: landscape ? 1 : undefined, width: landscape ? undefined : "100%" }}>
        <Eyebrow>Paso 3</Eyebrow>
        <Headline>Sigue tu pedido en línea</Headline>
        <Rise at={0.5}>
          <p style={{ margin: `${28 * u}px 0 0`, fontFamily: fonts.body, fontSize: 44 * u, lineHeight: 1.35, color: C.slate }}>
            Y recibe tu documento digital o físico.
          </p>
        </Rise>
      </div>
      <Rise at={0.2} y={60} style={{ position: "relative", flex: 1, width: "100%", display: "grid", placeItems: "center", scale: portrait ? "1.35" : "1" }}>
        <div style={{ width: "100%", maxWidth: 640 * u, borderRadius: 36 * u, background: C.white, padding: 40 * u, boxShadow: `0 ${30 * u}px ${70 * u}px -${30 * u}px rgba(16,36,58,0.35)` }}>
          <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 24 * u, color: C.slate }}>Pedido ND-2026-000123</div>
          <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 40 * u, color: C.night, margin: `${6 * u}px 0 ${30 * u}px` }}>Copia de escritura pública</div>
          {steps.map((s, i) => {
            const at = (0.6 + i * 0.45) * fps;
            const done = frame > at;
            const last = i === steps.length - 1;
            return (
              <div key={s} style={{ display: "flex", gap: 22 * u, alignItems: "stretch" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {done ? (
                    <Pop at={0.6 + i * 0.45}>
                      <Check size={44 * u} color={last ? C.tealDeep : C.teal} />
                    </Pop>
                  ) : (
                    <div style={{ width: 44 * u, height: 44 * u, borderRadius: 99, border: `${3 * u}px solid ${C.line}` }} />
                  )}
                  {!last && (
                    <div style={{ width: 4 * u, flex: 1, minHeight: 30 * u, background: C.line, position: "relative", overflow: "hidden" }}>
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: C.teal,
                          scale: `1 ${interpolate(frame, [at, at + 0.45 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}`,
                          transformOrigin: "top",
                        }}
                      />
                    </div>
                  )}
                </div>
                <div
                  style={{
                    paddingBottom: last ? 0 : 26 * u,
                    fontFamily: fonts.body,
                    fontWeight: last && done ? 700 : 500,
                    fontSize: 32 * u,
                    color: done ? C.night : C.slate,
                    lineHeight: `${44 * u}px`,
                  }}
                >
                  {s}
                </div>
              </div>
            );
          })}
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

/* ---------- Cierre ---------- */
const SceneEnd: React.FC = () => {
  const { u, portrait } = useLayout();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: 90 * u }}>
      <NightBackdrop glowX="50%" glowY="45%" />
      <Pop at={0.1}>
        <Wordmark size={(portrait ? 110 : 96) * u} dark />
      </Pop>
      <Rise at={0.45}>
        <p style={{ margin: `${36 * u}px 0 0`, fontFamily: fonts.display, fontWeight: 700, fontSize: 56 * u, lineHeight: 1.15, color: C.white, maxWidth: 1200 * u }}>
          Conectamos personas, documentos y soluciones.
        </p>
      </Rise>
      <Rise at={0.8}>
        <div
          style={{
            marginTop: 44 * u,
            display: "inline-flex",
            alignItems: "center",
            gap: 14 * u,
            padding: `${24 * u}px ${46 * u}px`,
            borderRadius: 99,
            background: C.teal,
            color: C.night,
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: 38 * u,
          }}
        >
          Solicita tu documento en línea →
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

/** Video promocional: 5 escenas encadenadas con transiciones. */
export const Promo: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = linearTiming({ durationInFrames: Math.round(0.4 * fps) });
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Documentos" durationInFrames={3 * fps}>
          <SceneDocs />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
        <TransitionSeries.Sequence name="Pídelo en línea" durationInFrames={3.4 * fps}>
          <SceneForm />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
        <TransitionSeries.Sequence name="Paga" durationInFrames={3 * fps}>
          <ScenePay />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={t} />
        <TransitionSeries.Sequence name="Seguimiento" durationInFrames={3.2 * fps}>
          <SceneTrack />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence name="Cierre" durationInFrames={2.6 * fps}>
          <SceneEnd />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/** Duración total: escenas menos los solapes de las 4 transiciones. */
export const promoDuration = (fps: number) => Math.round((3 + 3.4 + 3 + 3.2 + 2.6) * fps) - 4 * Math.round(0.4 * fps);
