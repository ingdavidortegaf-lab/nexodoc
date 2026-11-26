import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const jakarta = loadJakarta("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });
const inter = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

export const fonts = {
  display: jakarta.fontFamily,
  body: inter.fontFamily,
};

export const C = {
  night: "#10243A",
  navy: "#173B5E",
  navy600: "#1D4A73",
  teal: "#19B7B0",
  tealDeep: "#139C96",
  tealInk: "#0B7A75",
  tealSoft: "#E6F7F6",
  mint: "#6FE6DE",
  mist: "#F4F7FA",
  line: "#CBD5E1",
  slate: "#64748B",
  white: "#FFFFFF",
  amber: "#F5B544",
};

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
