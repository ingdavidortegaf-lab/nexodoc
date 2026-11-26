import type React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, EASE_OUT, fonts } from "./theme";

const ease = Easing.bezier(...EASE_OUT);

/** Entrada: aparece y sube. `at` en segundos desde el inicio de la escena. */
export const Rise: React.FC<{ at?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at = 0,
  y = 40,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = at * fps;
  return (
    <div
      style={{
        ...style,
        opacity: interpolate(frame, [start, start + 0.6 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
        translate: `0px ${interpolate(frame, [start, start + 0.8 * fps], [y, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })}px`,
      }}
    >
      {children}
    </div>
  );
};

/** Aparición con rebote suave (spring). */
export const Pop: React.FC<{ at?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at = 0, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at * fps, fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  return <div style={{ ...style, opacity: Math.min(1, s * 1.4), scale: `${0.6 + 0.4 * s}` }}>{children}</div>;
};

export const LogoMark: React.FC<{ size: number; dark?: boolean }> = ({ size, dark = false }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <path d="M4 7a3 3 0 0 1 3-3h13l8 8v13a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill={dark ? C.white : C.night} />
    <path d="M20 4v5a3 3 0 0 0 3 3h5z" fill={C.teal} />
    <path d="M10.5 22.5V13l8.5 9.5V13" fill="none" stroke={dark ? C.night : C.white} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Wordmark: React.FC<{ size: number; dark?: boolean }> = ({ size, dark = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
    <LogoMark size={size} dark={dark} />
    <div style={{ fontFamily: fonts.display, fontSize: size * 0.82, letterSpacing: -1, color: dark ? C.white : C.night, lineHeight: 1 }}>
      <span style={{ fontWeight: 800 }}>NEXO</span>
      <span style={{ fontWeight: 600 }}>DOC</span>
    </div>
  </div>
);

/** Tarjeta de documento con renglones, sello opcional y etiqueta. */
export const DocCard: React.FC<{ w: number; label: string; accent?: string; seal?: boolean; style?: React.CSSProperties }> = ({
  w,
  label,
  accent = C.teal,
  seal = false,
  style,
}) => {
  const h = w * 1.28;
  const u = w / 100;
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        borderRadius: 7 * u,
        background: C.white,
        boxShadow: `0 ${10 * u}px ${30 * u}px -${12 * u}px rgba(16,36,58,0.45)`,
        padding: 10 * u,
        display: "flex",
        flexDirection: "column",
        gap: 5 * u,
        ...style,
      }}
    >
      <div style={{ width: "55%", height: 6 * u, borderRadius: 3 * u, background: C.night }} />
      {[92, 76, 88, 64, 80].map((wd, i) => (
        <div key={i} style={{ width: `${wd}%`, height: 3.4 * u, borderRadius: 2 * u, background: C.line }} />
      ))}
      <div
        style={{
          marginTop: "auto",
          alignSelf: "flex-start",
          padding: `${2.5 * u}px ${6 * u}px`,
          borderRadius: 99,
          background: C.tealSoft,
          color: C.tealInk,
          fontFamily: fonts.body,
          fontWeight: 600,
          fontSize: 8.5 * u,
        }}
      >
        {label}
      </div>
      {seal && (
        <div
          style={{
            position: "absolute",
            right: -8 * u,
            bottom: 16 * u,
            width: 26 * u,
            height: 26 * u,
            borderRadius: 99,
            background: accent,
            display: "grid",
            placeItems: "center",
            boxShadow: `0 ${4 * u}px ${12 * u}px -${4 * u}px rgba(16,36,58,0.5)`,
          }}
        >
          <svg width={13 * u} height={13 * u} viewBox="0 0 24 24">
            <path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke={C.white} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
};

export const Check: React.FC<{ size: number; color?: string }> = ({ size, color = C.teal }) => (
  <div style={{ width: size, height: size, borderRadius: 99, background: color, display: "grid", placeItems: "center", flexShrink: 0 }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
      <path d="m5 12.5 4.2 4.2L19 7" fill="none" stroke={C.white} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/** Fondo azul noche con resplandor turquesa y retícula de puntos. */
export const NightBackdrop: React.FC<{ glowX?: string; glowY?: string }> = ({ glowX = "72%", glowY = "30%" }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 45) * 3;
  return (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg, ${C.navy} 0%, ${C.night} 62%)` }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at calc(${glowX} + ${drift}%) ${glowY}, rgba(25,183,176,0.28), transparent 45%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1.2px, transparent 1.4px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(70% 70% at 70% 35%, black, transparent)",
        }}
      />
    </div>
  );
};

/** Fondo claro de marca (escenas de producto). */
export const LightBackdrop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(60% 50% at 85% 10%, rgba(25,183,176,0.14), transparent 60%), linear-gradient(180deg, ${C.white} 0%, ${C.mist} 100%)`,
    }}
  />
);
