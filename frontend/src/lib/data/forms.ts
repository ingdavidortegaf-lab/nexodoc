/**
 * Formularios específicos por servicio: piden exactamente los datos que la
 * entidad necesita para ubicar el documento, así el gestor no tiene que volver
 * a llamar al cliente. Los servicios sin formulario propio usan `genericForm`.
 *
 * Las claves (`name`) viajan al backend tal cual (snake_case, máx. 40 campos).
 */
import { languages } from "@/lib/data/geo";
import type { DeliveryZone } from "@/lib/data/pricing";

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "radio"
  | "year"
  | "number"
  | "department"
  | "municipality"
  | "country"
  | "file";

export interface Option {
  value: string;
  label: string;
}

export interface FieldSpec {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: Option[];
  placeholder?: string;
  hint?: string;
  pattern?: { regex: string; message: string };
  maxLength?: number;
  min?: number;
  max?: number;
  defaultValue?: string;
  /** Mostrar sólo si otro campo tiene alguno de estos valores */
  showIf?: { field: string; in: string[] };
  /** Ocupa media fila en pantallas medianas */
  half?: boolean;
  /** Para municipality: campo de departamento del que depende */
  dependsOn?: string;
  /** Para file */
  maxFiles?: number;
}

export interface ServiceFormSpec {
  intro: string;
  fields: FieldSpec[];
  delivery: DeliveryZone[];
  /** "Ver ejemplo": dónde encuentra el cliente los datos */
  example?: { title: string; items: string[] };
  /** Texto antes del botón de agregar */
  note: string;
}

const opts = (...labels: [string, string][]): Option[] => labels.map(([value, label]) => ({ value, label }));
const yesNo = opts(["si", "Sí"], ["no", "No"]);
const purposes = opts(
  ["pasaporte", "Pasaporte o documento de identidad"],
  ["exterior", "Visa, residencia o trámite en el exterior"],
  ["nacionalidad", "Doble nacionalidad"],
  ["sucesion", "Sucesión o herencia"],
  ["pension", "Pensión o seguridad social"],
  ["matrimonio", "Matrimonio o unión marital"],
  ["estudio", "Estudio o trabajo"],
  ["apostilla", "Apostilla"],
  ["bancario", "Trámite bancario"],
  ["otro", "Otro"],
);

const comments = (placeholder: string): FieldSpec => ({
  name: "comentarios",
  label: "Comentarios u observaciones",
  type: "textarea",
  placeholder,
  maxLength: 800,
});

const location = (label: string): FieldSpec[] => [
  { name: "departamento", label: `Departamento ${label}`, type: "department", required: true, half: true },
  { name: "municipio", label: "Municipio", type: "municipality", required: true, half: true, dependsOn: "departamento" },
];

const copies: FieldSpec = {
  name: "copias",
  label: "Número de copias",
  type: "number",
  required: true,
  min: 1,
  max: 10,
  defaultValue: "1",
  half: true,
};

// --- Registro civil -----------------------------------------------------------
function registroCivil(tipo: "nacimiento" | "matrimonio" | "defuncion"): ServiceFormSpec {
  const extra: Record<typeof tipo, FieldSpec[]> = {
    nacimiento: [
      { name: "padres", label: "Nombres de los padres", type: "text", hint: "Ayuda a ubicar el registro si no tienes el serial.", maxLength: 200 },
    ],
    matrimonio: [
      { name: "conyuge_nombre", label: "Nombres y apellidos del otro cónyuge", type: "text", required: true, maxLength: 120 },
      { name: "anio_evento", label: "Año del matrimonio", type: "year", half: true },
    ],
    defuncion: [{ name: "anio_evento", label: "Año del fallecimiento", type: "year", half: true }],
  };
  return {
    intro:
      "Completa los datos del registro y de la notaría o registraduría donde está inscrito. Con el indicativo serial lo ubicamos más rápido; si no lo tienes, lo buscamos con los demás datos.",
    example: {
      title: "¿Dónde encuentro estos datos?",
      items: [
        "El indicativo serial es el número impreso arriba a la derecha del registro (p. ej. 12345678).",
        "En registros antiguos aparecen el tomo y el folio en lugar del serial.",
        "La notaría o registraduría figura en el encabezado («Oficina de registro»).",
        "Si no tienes una copia, indícanos el nombre completo del inscrito, su documento y el lugar de inscripción.",
      ],
    },
    fields: [
      { name: "tipo_registro", label: "Tipo de registro", type: "select", required: true, defaultValue: tipo,
        options: opts(["nacimiento", "Nacimiento"], ["matrimonio", "Matrimonio"], ["defuncion", "Defunción"]) },
      ...location("donde está inscrito"),
      { name: "oficina", label: "Notaría o registraduría", type: "text", required: true, maxLength: 120,
        placeholder: "Ej.: Notaría 5 de Medellín o Registraduría Auxiliar de Suba" },
      { name: "ubicacion", label: "Datos para ubicar el registro", type: "radio", required: true, defaultValue: "serial",
        options: opts(["serial", "Indicativo serial"], ["tomo_folio", "Tomo y folio"], ["no_se", "No los tengo"]) },
      { name: "indicativo_serial", label: "Indicativo serial", type: "text", required: true, maxLength: 20,
        pattern: { regex: "^[0-9A-Za-z-]{4,20}$", message: "Escribe sólo números y letras." },
        showIf: { field: "ubicacion", in: ["serial"] } },
      { name: "tomo", label: "Tomo", type: "text", required: true, half: true, maxLength: 10, showIf: { field: "ubicacion", in: ["tomo_folio"] } },
      { name: "folio", label: "Folio", type: "text", required: true, half: true, maxLength: 10, showIf: { field: "ubicacion", in: ["tomo_folio"] } },
      { name: "inscrito_nombre", label: "Nombres y apellidos del inscrito", type: "text", required: true, maxLength: 120 },
      { name: "inscrito_documento", label: "NUIP o cédula del inscrito", type: "text", half: true, maxLength: 20,
        hint: "Opcional si no lo conoces." },
      { name: "anio_inscripcion", label: "Año de inscripción (aproximado)", type: "year", half: true },
      ...extra[tipo],
      { name: "proposito", label: "¿Para qué lo necesitas?", type: "select", required: true, options: purposes },
      { name: "relacion", label: "Tu relación con el inscrito", type: "select", required: true,
        options: opts(["titular", "Soy el inscrito"], ["padre_madre", "Padre o madre"], ["hijo", "Hijo o hija"],
          ["conyuge", "Cónyuge o compañero(a)"], ["hermano", "Hermano o hermana"], ["apoderado", "Apoderado o abogado"], ["otro", "Otra"]) },
      { name: "datos_sensibles", label: "¿Es de un menor de edad o contiene datos sensibles (reconocimiento, adopción, cambio de sexo)?",
        type: "radio", required: true, options: yesNo,
        hint: "Estos registros sólo se entregan al titular, sus representantes o quien acredite interés legítimo. Te pediremos el soporte." },
      copies,
      comments("Ej.: lo necesito apostillado, es para un trámite de visa, etc."),
    ],
    delivery: ["digital", "local", "nacional", "internacional"],
    note:
      "Verificamos con la notaría o registraduría que el registro exista y te confirmamos el valor final por correo y WhatsApp antes de cualquier otro cobro.",
  };
}

// --- Notariales ---------------------------------------------------------------
const actTypes = opts(
  ["compraventa", "Compraventa"],
  ["hipoteca", "Hipoteca"],
  ["cancelacion_hipoteca", "Cancelación de hipoteca"],
  ["sucesion", "Sucesión"],
  ["donacion", "Donación"],
  ["sociedad", "Constitución o reforma de sociedad"],
  ["poder", "Poder"],
  ["propiedad_horizontal", "Reglamento de propiedad horizontal"],
  ["construccion", "Declaración de construcción"],
  ["matrimonio", "Matrimonio, divorcio o unión marital"],
  ["otro", "Otro o no lo sé"],
);

const escritura: ServiceFormSpec = {
  intro:
    "Busca en tu escritura el número, el año y la notaría. Con estos datos consultamos la disponibilidad y el costo de las copias.",
  example: {
    title: "¿Dónde encuentro estos datos?",
    items: [
      "En la primera hoja: «Escritura pública número 1234 de fecha 15 de marzo de 2010, Notaría Segunda de Bogotá».",
      "Si no tienes la escritura, el certificado de tradición del inmueble indica número, fecha y notaría de cada acto.",
      "Si no conoces ningún dato, usa el servicio «Búsqueda de escrituras».",
    ],
  },
  fields: [
    ...location("de la notaría"),
    { name: "notaria", label: "Notaría", type: "text", required: true, maxLength: 80, placeholder: "Ej.: Notaría 23 o Notaría Única de Yopal" },
    { name: "numero_escritura", label: "Número de escritura", type: "text", required: true, half: true, maxLength: 8,
      pattern: { regex: "^[0-9]{1,8}$", message: "Escribe sólo el número." } },
    { name: "anio", label: "Año de la escritura", type: "year", required: true, half: true },
    { name: "tipo_acto", label: "Tipo de acto", type: "select", required: true, options: actTypes },
    { name: "tipo_copia", label: "¿Qué copia necesitas?", type: "radio", required: true,
      options: opts(["autentica", "Auténtica (sello y firma del notario)"], ["simple", "Simple"], ["no_se", "No estoy seguro"]),
      hint: "Bancos, juzgados y oficinas de registro suelen pedir copia auténtica." },
    { name: "anexos", label: "¿Con anexos?", type: "radio", required: true,
      options: opts(["con", "Con anexos"], ["sin", "Sin anexos"], ["no_se", "No sé"]),
      hint: "Los anexos son planos, paz y salvos o poderes protocolizados con la escritura." },
    copies,
    comments("Ej.: trámite bancario, sucesión, compraventa, etc."),
  ],
  delivery: ["digital", "local", "nacional", "internacional"],
  note:
    "Consultamos con la notaría la disponibilidad de la escritura y el valor de las copias, y te informamos para que culmines el pago.",
};

const busquedaEscrituras: ServiceFormSpec = {
  intro: "Si no conoces el número de escritura, la buscamos con los datos de las personas o del inmueble.",
  fields: [
    ...location("donde se firmó (si lo sabes)"),
    { name: "notaria", label: "Notaría (si la conoces)", type: "text", maxLength: 80 },
    { name: "otorgantes", label: "Nombres de quienes firmaron", type: "textarea", required: true, maxLength: 400,
      placeholder: "Ej.: Juan Pérez (vendedor) y María Gómez (compradora)" },
    { name: "otorgantes_documentos", label: "Documentos de identidad de los otorgantes", type: "text", maxLength: 120 },
    { name: "matricula", label: "Matrícula inmobiliaria o dirección del inmueble", type: "text", maxLength: 160 },
    { name: "rango_anios", label: "Años aproximados", type: "text", half: true, maxLength: 30, placeholder: "Ej.: 2005 a 2010" },
    { name: "tipo_acto", label: "Tipo de acto", type: "select", half: true, options: actTypes },
    comments("Cuéntanos todo lo que recuerdes."),
  ],
  delivery: ["digital"],
  note: "Te informamos el resultado de la búsqueda. Si ubicamos la escritura, te cotizamos la copia.",
};

const autenticacion: ServiceFormSpec = {
  intro: "Adjunta el documento que necesitas autenticar o reconocer y cuéntanos su uso.",
  fields: [
    { name: "tipo_documento", label: "Documento", type: "text", required: true, maxLength: 120, placeholder: "Ej.: contrato de arrendamiento, diploma" },
    { name: "archivo", label: "Documento (PDF o imagen)", type: "file", maxFiles: 3, hint: "Opcional ahora; lo pediremos antes de la gestión." },
    ...location("donde estás"),
    copies,
    comments("Ej.: requiere reconocimiento de firma presencial."),
  ],
  delivery: ["local", "nacional"],
  note: "La autenticación de firma exige presencia del firmante; te indicamos la notaría y la cita.",
};

// --- Inmobiliarios ---------------------------------------------------------------
const tradicion: ServiceFormSpec = {
  intro: "Con el número de matrícula inmobiliaria expedimos el certificado de tradición y libertad del inmueble.",
  example: {
    title: "¿Dónde encuentro la matrícula?",
    items: [
      "En un certificado de tradición anterior: «Matrícula inmobiliaria 50C-1234567».",
      "En la escritura, en el recibo del impuesto predial o en la promesa de compraventa.",
      "El prefijo (50C, 001, 370…) identifica la oficina de registro.",
    ],
  },
  fields: [
    { name: "matricula", label: "Número de matrícula inmobiliaria", type: "text", required: true, maxLength: 20,
      placeholder: "Ej.: 50C-1234567", pattern: { regex: "^[0-9A-Za-z]{1,4}-?[0-9]{1,9}$", message: "Formato esperado: prefijo-número (50C-1234567)." } },
    ...location("del inmueble"),
    { name: "direccion_inmueble", label: "Dirección del inmueble", type: "text", maxLength: 160, hint: "Opcional; ayuda a confirmar que es el inmueble correcto." },
    copies,
    { name: "proposito", label: "¿Para qué lo necesitas?", type: "select",
      options: opts(["compraventa", "Compraventa"], ["credito", "Crédito hipotecario"], ["arriendo", "Arrendamiento"], ["sucesion", "Sucesión"], ["otro", "Otro"]) },
  ],
  delivery: ["digital"],
  note: "Te enviamos el certificado electrónico por correo apenas lo expida la Superintendencia de Notariado y Registro.",
};

// --- Apostillas y traducciones -----------------------------------------------------
const languageOptions = languages.map((l) => ({ value: l.toLowerCase(), label: l }));

const traduccion: ServiceFormSpec = {
  intro: "Adjunta el documento y elige los idiomas. Revisamos el número de hojas y te enviamos el valor antes de iniciar.",
  fields: [
    { name: "archivo", label: "Documento a traducir", type: "file", required: true, maxFiles: 5, hint: "PDF, JPG o PNG. Máximo 20 MB por archivo." },
    { name: "idioma_origen", label: "Idioma del documento", type: "select", required: true, half: true, options: languageOptions },
    { name: "idioma_destino", label: "Idioma al que deseas traducir", type: "select", required: true, half: true, options: languageOptions },
    { name: "pais_destino", label: "País donde lo presentarás", type: "country", required: true },
    { name: "apostillado", label: "¿El documento original está apostillado?", type: "radio", required: true,
      options: opts(["si", "Sí"], ["no", "No"], ["necesito", "No, y necesito apostillarlo"]) },
    { name: "autenticacion", label: "¿Requieres la apostilla de la firma del traductor?", type: "radio", required: true, options: yesNo,
      hint: "Algunos países exigen apostillar también la traducción oficial." },
    comments("Ej.: trámite migratorio, homologación de estudios, etc."),
  ],
  delivery: ["digital", "local", "nacional", "internacional"],
  note: "Te enviamos la cotización por correo; la traducción inicia cuando la apruebes.",
};

const apostilla: ServiceFormSpec = {
  intro: "Indica qué documento necesitas apostillar y en qué país lo vas a presentar.",
  fields: [
    { name: "tipo_documento", label: "Documento", type: "select", required: true,
      options: opts(["registro_civil", "Registro civil"], ["diploma", "Diploma o acta de grado"], ["notas", "Certificado de notas"],
        ["antecedentes", "Certificado de antecedentes"], ["notarial", "Escritura o documento notarial"],
        ["empresarial", "Documento de Cámara de Comercio"], ["otro", "Otro"]) },
    { name: "pais_destino", label: "País donde lo presentarás", type: "country", required: true },
    { name: "tiene_documento", label: "¿Tienes el documento?", type: "radio", required: true,
      options: opts(["si", "Sí, lo adjunto"], ["no", "No, necesito que lo solicitemos"]) },
    { name: "archivo", label: "Documento", type: "file", maxFiles: 3, showIf: { field: "tiene_documento", in: ["si"] } },
    { name: "entidad_emisora", label: "Entidad que lo expidió", type: "text", maxLength: 120, placeholder: "Ej.: Universidad Nacional, Notaría 3 de Cali" },
    { name: "traduccion", label: "¿También necesitas traducción oficial?", type: "radio", required: true, options: yesNo },
    comments("Ej.: el documento tiene más de un año de expedido."),
  ],
  delivery: ["digital", "nacional", "internacional"],
  note: "Revisamos que el documento sea apostillable y te confirmamos el valor final.",
};

// --- Antecedentes, empresas, tránsito -----------------------------------------------
const antecedentes: ServiceFormSpec = {
  intro: "Expedimos el certificado a nombre del titular. Necesitamos sus datos tal como aparecen en el documento de identidad.",
  fields: [
    { name: "titular_nombre", label: "Nombres y apellidos del titular", type: "text", required: true, maxLength: 120 },
    { name: "titular_tipo_doc", label: "Tipo de documento", type: "select", required: true, half: true,
      options: opts(["CC", "Cédula de ciudadanía"], ["CE", "Cédula de extranjería"], ["PA", "Pasaporte"], ["PPT", "PPT"]) },
    { name: "titular_documento", label: "Número de documento", type: "text", required: true, half: true, maxLength: 20,
      pattern: { regex: "^[0-9A-Za-z.-]{4,20}$", message: "Número no válido." } },
    { name: "proposito", label: "¿Para qué lo necesitas?", type: "select", options: opts(["empleo", "Empleo o contratación"], ["exterior", "Trámite en el exterior"], ["otro", "Otro"]) },
    comments("Ej.: lo necesito apostillado."),
  ],
  delivery: ["digital"],
  note: "Lo recibes en PDF con su código de verificación.",
};

const empresarial: ServiceFormSpec = {
  intro: "Con el NIT o la razón social expedimos el certificado ante la cámara de comercio correspondiente.",
  fields: [
    { name: "razon_social", label: "Razón social", type: "text", required: true, maxLength: 160 },
    { name: "nit", label: "NIT", type: "text", half: true, maxLength: 15, pattern: { regex: "^[0-9.-]{5,15}$", message: "NIT no válido." } },
    { name: "camara", label: "Cámara de comercio", type: "text", half: true, maxLength: 80, placeholder: "Ej.: Bogotá, Casanare" },
    copies,
    comments("Ej.: lo necesito para una licitación."),
  ],
  delivery: ["digital", "local", "nacional"],
  note: "Te enviamos el certificado electrónico con código de verificación.",
};

const vehiculo: ServiceFormSpec = {
  intro: "Con la placa y el organismo de tránsito expedimos el certificado del vehículo.",
  fields: [
    { name: "placa", label: "Placa", type: "text", required: true, half: true, maxLength: 7,
      pattern: { regex: "^[A-Za-z]{3}-?[0-9]{2}[0-9A-Za-z]$", message: "Formato esperado: ABC123 o ABC12D." } },
    { name: "organismo_transito", label: "Organismo de tránsito", type: "text", required: true, half: true, maxLength: 100,
      placeholder: "Ej.: Secretaría de Movilidad de Bogotá" },
    { name: "propietario_documento", label: "Documento del propietario", type: "text", maxLength: 20 },
    comments("Ej.: es para un traspaso."),
  ],
  delivery: ["digital", "local"],
  note: "Te confirmamos el valor del organismo de tránsito antes de expedirlo.",
};

export const genericForm: ServiceFormSpec = {
  intro: "Cuéntanos qué documento necesitas y todo dato que ayude a ubicarlo.",
  fields: [
    { name: "descripcion", label: "Describe lo que necesitas", type: "textarea", required: true, maxLength: 1200,
      placeholder: "Ej.: número de radicado, entidad, nombre del titular, país de destino…" },
    { name: "departamento", label: "Departamento", type: "department", half: true },
    { name: "municipio", label: "Municipio", type: "municipality", half: true, dependsOn: "departamento" },
    { name: "archivo", label: "Soportes (opcional)", type: "file", maxFiles: 3 },
  ],
  delivery: ["digital", "local", "nacional", "internacional"],
  note: "Un gestor revisa tu solicitud y te envía la cotización con el tiempo estimado de la entidad.",
};

export const serviceForms: Record<string, ServiceFormSpec> = {
  "registro-civil-de-nacimiento": registroCivil("nacimiento"),
  "registro-civil-de-matrimonio": registroCivil("matrimonio"),
  "registro-civil-de-defuncion": registroCivil("defuncion"),
  "copia-escritura-publica": escritura,
  "busqueda-de-escrituras": busquedaEscrituras,
  "autenticacion-de-documentos": autenticacion,
  "certificado-de-tradicion-y-libertad": tradicion,
  "traduccion-oficial": traduccion,
  "apostilla-de-documentos": apostilla,
  "antecedentes-judiciales": antecedentes,
  "antecedentes-disciplinarios": antecedentes,
  "antecedentes-fiscales": antecedentes,
  "certificado-existencia-representacion": empresarial,
  "certificado-matricula-mercantil": empresarial,
  "certificado-tradicion-vehiculo": vehiculo,
};

export const getForm = (slug: string): ServiceFormSpec => serviceForms[slug] ?? genericForm;

/** Valor por defecto de cada campo (para iniciar el formulario). */
export function initialValues(spec: ServiceFormSpec): Record<string, string> {
  const v: Record<string, string> = { entrega: spec.delivery[0] };
  for (const f of spec.fields) if (f.defaultValue) v[f.name] = f.defaultValue;
  return v;
}

export const isVisible = (f: FieldSpec, values: Record<string, string>) =>
  !f.showIf || f.showIf.in.includes(values[f.showIf.field] ?? "");

/** Validación de un documento del carrito. Devuelve errores por campo. */
export function validateItem(
  spec: ServiceFormSpec,
  values: Record<string, string>,
  fileCounts: Record<string, number>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const thisYear = new Date().getFullYear();
  for (const f of spec.fields) {
    if (!isVisible(f, values)) continue;
    const raw = (values[f.name] ?? "").trim();
    if (f.type === "file") {
      if (f.required && !(fileCounts[f.name] > 0)) errors[f.name] = "Adjunta el documento.";
      continue;
    }
    if (!raw) {
      if (f.required) errors[f.name] = f.type === "select" || f.type === "radio" ? "Selecciona una opción." : "Este dato es obligatorio.";
      continue;
    }
    if (f.maxLength && raw.length > f.maxLength) errors[f.name] = `Máximo ${f.maxLength} caracteres.`;
    else if (f.pattern && !new RegExp(f.pattern.regex).test(raw)) errors[f.name] = f.pattern.message;
    else if (f.type === "year") {
      const y = Number(raw);
      if (!Number.isInteger(y) || y < 1900 || y > thisYear) errors[f.name] = `Escribe un año entre 1900 y ${thisYear}.`;
    } else if (f.type === "number") {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < (f.min ?? 0) || n > (f.max ?? 999)) errors[f.name] = `Escribe un número entre ${f.min ?? 0} y ${f.max ?? 999}.`;
    } else if (f.type === "textarea" && f.name === "descripcion" && raw.length < 15) {
      errors[f.name] = "Danos un poco más de detalle (mínimo 15 caracteres).";
    }
  }
  if (!spec.delivery.includes(values.entrega as DeliveryZone)) errors.entrega = "Elige cómo quieres recibirlo.";
  return errors;
}

/** Campos visibles con valor, como pares etiqueta → valor legible (resumen del carrito y del pedido). */
export function summarize(spec: ServiceFormSpec, values: Record<string, string>): [string, string][] {
  const out: [string, string][] = [];
  for (const f of spec.fields) {
    if (f.type === "file" || !isVisible(f, values)) continue;
    const v = values[f.name];
    if (!v) continue;
    const label = f.options?.find((o) => o.value === v)?.label ?? v;
    out.push([f.label, label]);
  }
  return out;
}

/** Sólo los campos visibles con valor: lo que se envía al backend. */
export function payloadFields(spec: ServiceFormSpec, values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of spec.fields) {
    if (f.type === "file" || !isVisible(f, values)) continue;
    const v = (values[f.name] ?? "").trim();
    if (v) out[f.name] = f.options?.find((o) => o.value === v)?.label ?? v;
  }
  if (values.entrega) out.entrega = values.entrega;
  if (values.pais_entrega) out.pais_entrega = values.pais_entrega;
  return out;
}
