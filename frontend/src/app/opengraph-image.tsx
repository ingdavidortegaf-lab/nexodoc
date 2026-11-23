import { ImageResponse } from "next/og";

export const alt = "NEXODOC · Conectamos personas, documentos y soluciones";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen Open Graph generada en build: marca, mensaje y paleta oficial. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #173B5E 0%, #10243A 70%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <path d="M4 7a3 3 0 0 1 3-3h13l8 8v13a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#FFFFFF" />
            <path d="M20 4v5a3 3 0 0 0 3 3h5z" fill="#19B7B0" />
            <path d="M10.5 22.5V13l8.5 9.5V13" fill="none" stroke="#10243A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>NEXODOC</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 950 }}>
            Los documentos que necesitas, gestionados de forma sencilla.
          </div>
          <div style={{ fontSize: 30, color: "#6FE6DE" }}>Conectamos personas, documentos y soluciones.</div>
        </div>
      </div>
    ),
    size,
  );
}
