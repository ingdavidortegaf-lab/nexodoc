"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useRef, useState } from "react";
import { UiIcon } from "@/components/icons/UiIcon";
import type { FieldSpec } from "@/lib/data/forms";
import { countries, departments, municipalitySuggestions } from "@/lib/data/geo";

export const MAX_FILE_MB = 20;
const ACCEPT = "application/pdf,image/jpeg,image/png";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  optional,
  children,
  as = "label",
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  optional?: boolean;
  children: React.ReactNode;
  as?: "label" | "legend";
}) {
  const Label = as === "legend" ? "legend" : "label";
  const Wrapper = as === "legend" ? "fieldset" : "div";
  return (
    <Wrapper className={error ? "field-error" : ""}>
      <Label {...(as === "label" ? { htmlFor } : {})} className="mb-2 block font-label text-sm font-semibold text-night">
        {label} {optional && <span className="font-normal text-slate">(opcional)</span>}
      </Label>
      {children}
      {hint && !error && <p className="mt-2 text-sm text-slate">{hint}</p>}
      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-700"
          >
            <UiIcon name="alert" className="h-4 w-4 shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

export function Select({ id, value, onChange, children, placeholder }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input appearance-none pr-11">
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {children}
      </select>
      <UiIcon name="chevronDown" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
    </div>
  );
}

export function Check({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-night/85">
        <span className="relative mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
          <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0" />
          <span className={`h-5 w-5 rounded-md ring-1 transition-all duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-teal ${checked ? "bg-night ring-night" : error ? "bg-white ring-red-400" : "bg-white ring-line-strong"}`} />
          <motion.svg viewBox="0 0 24 24" className="pointer-events-none absolute h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="m5 12.5 4.2 4.2L19 7" initial={false} animate={{ pathLength: checked ? 1 : 0 }} transition={{ duration: 0.3 }} />
          </motion.svg>
        </span>
        <span>{children}</span>
      </label>
      {error && <p className="mt-1.5 pl-8 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}

/** Grupo de opciones tipo "pastilla" (radio accesible). */
export function Choice({ name, value, options, onChange, rows = false }: {
  name: string;
  value: string;
  options: { value: string; label: string; detail?: string }[];
  onChange: (v: string) => void;
  /** Filas a todo el ancho con el detalle a la derecha (en celular); pastillas desde sm. */
  rows?: boolean;
}) {
  return (
    <div className={rows ? "grid gap-2 sm:flex sm:flex-wrap sm:gap-2.5" : "flex flex-wrap gap-2.5"}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <label
            key={o.value}
            className={`flex min-h-12 cursor-pointer items-center gap-2.5 px-4 py-2 text-[0.9375rem] ring-1 transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal sm:min-h-11 ${
              rows ? "rounded-md sm:rounded-full" : "rounded-full"
            } ${active ? "bg-night text-white ring-night" : "bg-white text-night ring-line-strong hover:ring-night/40"}`}
          >
            <input type="radio" name={name} value={o.value} checked={active} onChange={() => onChange(o.value)} className="sr-only" />
            <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ring-1 ${active ? "ring-white" : "ring-line-strong"}`}>
              {active && <span className="h-2 w-2 rounded-full bg-teal-300" />}
            </span>
            <span className="font-medium">{o.label}</span>
            {o.detail && (
              <span className={`text-sm tabular-nums ${rows ? "ml-auto sm:ml-0" : ""} ${active ? "text-white/70" : "text-slate"}`}>{o.detail}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}

export function FilePicker({ id, files, onChange, maxFiles = 3 }: {
  id: string;
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const add = (list: FileList | null) => {
    if (!list) return;
    const all = Array.from(list);
    const valid = all.filter((f) => ACCEPT.split(",").includes(f.type) && f.size <= MAX_FILE_MB * 1024 * 1024);
    const next = [...files, ...valid];
    setNotice(
      valid.length < all.length
        ? `Algunos archivos no se agregaron: sólo PDF, JPG o PNG de hasta ${MAX_FILE_MB} MB.`
        : next.length > maxFiles
          ? `Puedes adjuntar hasta ${maxFiles} archivos.`
          : "",
    );
    onChange(next.slice(0, maxFiles));
    if (input.current) input.current.value = "";
  };

  return (
    <div>
      <label
        htmlFor={id}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-line-strong bg-mist/60 px-5 py-7 text-center transition-colors hover:border-teal hover:bg-teal-soft/40"
      >
        <UiIcon name="upload" className="h-6 w-6 text-teal-ink" />
        <span className="font-semibold text-night">Arrastra el archivo o haz clic para elegirlo</span>
        <span className="text-sm text-slate">PDF, JPG o PNG · máximo {MAX_FILE_MB} MB · hasta {maxFiles} archivos</span>
        <input
          ref={input}
          id={id}
          type="file"
          accept={ACCEPT}
          multiple={maxFiles > 1}
          className="sr-only"
          onChange={(e) => add(e.target.files)}
        />
      </label>
      {notice && (
        <p role="status" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-amber-800">
          <UiIcon name="info" className="h-4 w-4 shrink-0" /> {notice}
        </p>
      )}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-md bg-white px-4 py-2.5 text-sm shadow-inset">
              <span className="flex min-w-0 items-center gap-2">
                <UiIcon name="file" className="h-4 w-4 shrink-0 text-teal-ink" />
                <span className="truncate">{f.name}</span>
                <span className="shrink-0 text-slate">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
              </span>
              <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate hover:bg-night/5 hover:text-night" aria-label={`Quitar ${f.name}`}>
                <UiIcon name="close" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Campo del formulario de un servicio, según su especificación. */
export function DynamicField({ spec, values, error, files, onChange, onFiles }: {
  spec: FieldSpec;
  values: Record<string, string>;
  error?: string;
  files: File[];
  onChange: (name: string, value: string) => void;
  onFiles: (name: string, files: File[]) => void;
}) {
  const id = `f-${spec.name}-${useId().replace(/:/g, "")}`;
  const value = values[spec.name] ?? "";
  const set = (v: string) => onChange(spec.name, v);
  const common = { label: spec.label, hint: spec.hint, error, optional: !spec.required && spec.type !== "radio" };

  switch (spec.type) {
    case "textarea":
      return (
        <Field {...common} htmlFor={id}>
          <textarea id={id} rows={3} value={value} maxLength={spec.maxLength} placeholder={spec.placeholder} onChange={(e) => set(e.target.value)} className="input min-h-24 resize-y py-3" />
        </Field>
      );
    case "select":
      return (
        <Field {...common} htmlFor={id}>
          <Select id={id} value={value} onChange={set} placeholder="Selecciona una opción">
            {spec.options?.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      );
    case "radio":
      return (
        <Field {...common} as="legend">
          <Choice name={id} value={value} options={spec.options ?? []} onChange={set} />
        </Field>
      );
    case "department":
      return (
        <Field {...common} htmlFor={id}>
          <Select
            id={id}
            value={value}
            onChange={(v) => {
              set(v);
              onChange("municipio", "");
            }}
            placeholder="Selecciona el departamento"
          >
            {departments.map((d) => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </Select>
        </Field>
      );
    case "municipality": {
      const dep = values[spec.dependsOn ?? "departamento"] ?? "";
      const list = municipalitySuggestions(dep);
      return (
        <Field {...common} htmlFor={id} hint={spec.hint ?? (dep ? undefined : "Primero elige el departamento.")}>
          <input id={id} list={`${id}-list`} value={value} disabled={!dep} autoComplete="off" onChange={(e) => set(e.target.value)} className="input disabled:cursor-not-allowed disabled:bg-mist" placeholder={dep ? "Escribe o elige el municipio" : ""} maxLength={80} />
          <datalist id={`${id}-list`}>
            {list.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>
      );
    }
    case "country":
      return (
        <Field {...common} htmlFor={id}>
          <Select id={id} value={value} onChange={set} placeholder="Selecciona el país">
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
      );
    case "file":
      return (
        <Field {...common} htmlFor={id}>
          <FilePicker id={id} files={files} maxFiles={spec.maxFiles} onChange={(f) => onFiles(spec.name, f)} />
        </Field>
      );
    case "year":
      return (
        <Field {...common} htmlFor={id}>
          <input id={id} inputMode="numeric" value={value} placeholder={spec.placeholder ?? "Ej.: 2015"} maxLength={4} onChange={(e) => set(e.target.value.replace(/\D/g, ""))} className="input tabular-nums" />
        </Field>
      );
    case "number":
      return (
        <Field {...common} htmlFor={id}>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Menos" onClick={() => set(String(Math.max(spec.min ?? 0, Number(value || 0) - 1)))} className="grid h-13 w-13 shrink-0 place-items-center rounded-md text-xl font-semibold text-night shadow-inset hover:bg-mist">−</button>
            <input id={id} inputMode="numeric" value={value} onChange={(e) => set(e.target.value.replace(/\D/g, ""))} className="input text-center tabular-nums" maxLength={3} />
            <button type="button" aria-label="Más" onClick={() => set(String(Math.min(spec.max ?? 99, Number(value || 0) + 1)))} className="grid h-13 w-13 shrink-0 place-items-center rounded-md text-xl font-semibold text-night shadow-inset hover:bg-mist">+</button>
          </div>
        </Field>
      );
    default:
      return (
        <Field {...common} htmlFor={id}>
          <input id={id} value={value} maxLength={spec.maxLength} placeholder={spec.placeholder} onChange={(e) => set(e.target.value)} className="input" />
        </Field>
      );
  }
}
