import { Composition } from "remotion";
import { Promo, promoDuration } from "./Promo";

/**
 * Video promocional de NEXODOC en tres formatos:
 * - PromoBanner: horizontal para el banner de la portada (escritorio)
 * - PromoCuadrado: cuadrado para el banner en celular y el feed de Instagram/Facebook
 * - PromoHistoria: vertical para historias y Reels
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="PromoBanner" component={Promo} durationInFrames={promoDuration(30)} fps={30} width={1280} height={720} />
      <Composition id="PromoCuadrado" component={Promo} durationInFrames={promoDuration(30)} fps={30} width={1080} height={1080} />
      <Composition id="PromoHistoria" component={Promo} durationInFrames={promoDuration(30)} fps={30} width={1080} height={1920} />
    </>
  );
};
