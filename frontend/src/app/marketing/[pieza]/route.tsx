import { ImageResponse } from "next/og";
import { DocIllustrationStatic } from "@/components/illustrations/DocIllustrations";
import { formats, getPiece, pieces, type Piece } from "@/lib/data/marketing";
import { siteConfig } from "@/lib/site";

/**
 * Piezas para redes sociales generadas en build como PNG:
 *   /marketing/registro-civil.png, /marketing/pago-pse.png, …
 * El contenido vive en src/lib/data/marketing.ts.
 */
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => pieces.map((p) => ({ pieza: `${p.slug}.png` }));

const C = { night: "#10243A", navy: "#173B5E", teal: "#19B7B0", mint: "#6FE6DE", white: "#FFFFFF" };

function Logo({ size = 56 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M4 7a3 3 0 0 1 3-3h13l8 8v13a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill={C.white} />
        <path d="M20 4v5a3 3 0 0 0 3 3h5z" fill={C.teal} />
        <path d="M10.5 22.5V13l8.5 9.5V13" fill="none" stroke={C.night} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ fontSize: size * 0.72, fontWeight: 800, letterSpacing: -1, color: C.white }}>NEXODOC</div>
    </div>
  );
}

const domain = siteConfig.url.includes("localhost") ? "" : siteConfig.url.replace(/^https?:\/\//, "");

function Vertical({ p, tall }: { p: Piece; tall: boolean }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: tall ? "110px 84px" : "72px 76px",
      background: `linear-gradient(160deg, ${C.navy} 0%, ${C.night} 62%)`, color: C.white, fontFamily: "sans-serif" }}>
      <Logo size={tall ? 64 : 52} />
      <div style={{ display: "flex", alignSelf: tall ? "stretch" : "center", marginTop: tall ? 90 : 40, borderRadius: 36, overflow: "hidden", boxShadow: "0 40px 80px -40px rgba(0,0,0,0.6)" }}>
        <DocIllustrationStatic art={p.art} width={tall ? 912 : 680} />
      </div>
      <div style={{ display: "flex", marginTop: tall ? 80 : 40, fontSize: tall ? 34 : 26, color: C.mint, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3 }}>
        {p.eyebrow}
      </div>
      <div style={{ display: "flex", marginTop: 18, fontSize: tall ? 92 : 66, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2.5 }}>{p.title}</div>
      <div style={{ display: "flex", marginTop: 20, fontSize: tall ? 38 : 30, lineHeight: 1.4, color: "rgba(255,255,255,0.78)" }}>{p.text}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 32 }}>
        {p.chips.map((c) => (
          <div key={c} style={{ display: "flex", padding: "12px 24px", borderRadius: 999, border: "2px solid rgba(255,255,255,0.22)", fontSize: tall ? 30 : 26, fontWeight: 600 }}>{c}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexGrow: 1 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", padding: "22px 40px", borderRadius: 999, background: C.teal, color: C.night, fontSize: tall ? 36 : 32, fontWeight: 800 }}>
          {p.cta} →
        </div>
        {p.price ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.65)" }}>{domain || "Valores de referencia"}</div>
            <div style={{ display: "flex", fontSize: tall ? 48 : 42, fontWeight: 800 }}>{p.price}</div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 28, color: "rgba(255,255,255,0.7)" }}>{domain}</div>
        )}
      </div>
    </div>
  );
}

function Cover({ p }: { p: Piece }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 96px",
      background: `linear-gradient(120deg, ${C.navy} 0%, ${C.night} 70%)`, color: C.white, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
        <Logo size={48} />
        <div style={{ display: "flex", marginTop: 36, fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{p.title}</div>
        <div style={{ display: "flex", marginTop: 22, fontSize: 30, color: C.mint }}>{p.text}</div>
      </div>
      <div style={{ display: "flex", width: 480, borderRadius: 32, overflow: "hidden" }}>
        <DocIllustrationStatic art={p.art} width={480} />
      </div>
    </div>
  );
}

type Ctx = { params: Promise<{ pieza: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const slug = (await params).pieza.replace(/\.png$/, "");
  const p = getPiece(slug);
  if (!p) return new Response("No encontrado", { status: 404 });
  const { width, height } = formats[p.format];
  return new ImageResponse(p.format === "portada" ? <Cover p={p} /> : <Vertical p={p} tall={p.format === "historia"} />, { width, height });
}
