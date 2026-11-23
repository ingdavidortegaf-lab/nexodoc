import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface Props {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  id?: string;
}

export function SectionHeading({ eyebrow, title, description, align = "left", tone = "light", id }: Props) {
  const center = align === "center";
  const dark = tone === "dark";
  return (
    <Reveal className={`${center ? "mx-auto text-center" : ""} max-w-3xl`}>
      {eyebrow && (
        <p
          className={`mb-4 inline-flex items-center gap-2 font-label text-sm font-semibold ${
            dark ? "text-teal-300" : "text-teal-ink"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-teal-300" : "bg-teal"}`} aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <h2 id={id} className={`text-h2 font-bold ${dark ? "text-white" : "text-night"}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-5 text-lead ${center ? "mx-auto" : ""} max-w-2xl ${dark ? "text-white/70" : "text-slate"}`}>
          {description}
        </p>
      )}
    </Reveal>
  );
}
