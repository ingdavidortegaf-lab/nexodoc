/**
 * Catálogo de servicios de NEXODOC.
 *
 * Fuente única de verdad para: landing, buscador, páginas de categoría,
 * sitemap y datos estructurados. Si agregas un servicio aquí, aparece en
 * todos esos lugares sin duplicar contenido.
 *
 * Regla editorial: cada servicio declara la entidad responsable y su
 * modalidad. Ningún texto promete expedición inmediata.
 */

export type CategoryIconName =
  | "notarial"
  | "property"
  | "civil"
  | "business"
  | "records"
  | "apostille"
  | "academic"
  | "judicial"
  | "transit"
  | "archive";

/** Cómo se puede gestionar el servicio. */
export type Modality =
  | "remota" // NEXODOC lo gestiona sin presencia del cliente
  | "mixta" // parte remota, puede requerir firma o entrega física
  | "presencial"; // la ley exige comparecencia personal; NEXODOC prepara y acompaña

export interface Service {
  slug: string;
  name: string;
  summary: string;
  entity: string;
  modality: Modality;
  /** Términos que la gente escribe al buscar. Sin tildes, en minúscula. */
  keywords: string[];
}

export interface Category {
  slug: string;
  name: string;
  shortName: string;
  icon: CategoryIconName;
  tagline: string;
  description: string;
  audience: string[];
  entities: string[];
  requirements: string[];
  conditions: string[];
  services: Service[];
  seo: { title: string; description: string };
}

export const modalityLabel: Record<Modality, string> = {
  remota: "Gestión remota",
  mixta: "Remota con firma o entrega física",
  presencial: "Requiere presencia del titular",
};

export const categories: Category[] = [
  {
    slug: "servicios-notariales",
    name: "Servicios notariales",
    shortName: "Notariales",
    icon: "notarial",
    tagline: "Escrituras, autenticaciones y copias ante notarías de todo el país.",
    description:
      "Ubicamos y solicitamos copias de escrituras públicas en la notaría donde fueron otorgadas, gestionamos autenticaciones y preparamos los documentos para los trámites que exigen comparecer ante notario.",
    audience: ["Propietarios", "Herederos", "Abogados", "Colombianos en el exterior"],
    entities: ["Notarías del país (vigiladas por la Superintendencia de Notariado y Registro)"],
    requirements: [
      "Número de escritura, notaría y año de otorgamiento, si los conoces.",
      "Si no los conoces: nombre de los otorgantes, inmueble o matrícula inmobiliaria para la búsqueda.",
      "Documento de identidad del solicitante.",
    ],
    conditions: [
      "Las copias auténticas las expide la notaría que conserva el protocolo.",
      "Declaraciones, reconocimientos de firma y otorgamiento de escrituras exigen la presencia del titular con validación biométrica.",
      "Los derechos notariales los fija la tarifa vigente de la Superintendencia de Notariado y Registro.",
    ],
    services: [
      {
        slug: "copia-escritura-publica",
        name: "Copia de escritura pública",
        summary: "Copia simple o auténtica de una escritura otorgada en cualquier notaría del país.",
        entity: "Notaría que conserva el protocolo",
        modality: "remota",
        keywords: ["copia de escritura", "escritura publica", "copia autentica", "escrituras"],
      },
      {
        slug: "busqueda-de-escrituras",
        name: "Búsqueda de escrituras",
        summary: "Localizamos la escritura cuando no tienes el número, la notaría o el año.",
        entity: "Notarías y ORIP",
        modality: "remota",
        keywords: ["buscar escritura", "busqueda de escrituras", "no se el numero de escritura"],
      },
      {
        slug: "autenticacion-de-documentos",
        name: "Autenticación de documentos",
        summary: "Autenticación de copias frente a su original para trámites que la exigen.",
        entity: "Notaría",
        modality: "mixta",
        keywords: ["autenticar", "autenticacion", "copia autenticada"],
      },
      {
        slug: "poderes",
        name: "Poderes generales y especiales",
        summary: "Redacción guiada y coordinación del otorgamiento ante notaría o consulado.",
        entity: "Notaría o consulado de Colombia",
        modality: "presencial",
        keywords: ["poder", "poder especial", "poder general", "poder desde el exterior"],
      },
      {
        slug: "declaraciones-extraproceso",
        name: "Declaraciones extraproceso",
        summary: "Preparación del texto y agendamiento ante notaría para la declaración.",
        entity: "Notaría",
        modality: "presencial",
        keywords: ["declaracion extrajuicio", "declaracion extraproceso", "declaracion juramentada"],
      },
    ],
    seo: {
      title: "Copia de escrituras públicas y trámites notariales",
      description:
        "Solicita copias de escrituras públicas, búsqueda de escrituras y autenticaciones ante notarías de Colombia. Requisitos claros, cotización previa y seguimiento.",
    },
  },
  {
    slug: "inmobiliarios-registrales",
    name: "Servicios inmobiliarios y registrales",
    shortName: "Inmobiliarios",
    icon: "property",
    tagline: "Certificados de tradición, catastro y documentos para comprar o vender.",
    description:
      "Reunimos los documentos que respaldan un inmueble: certificado de tradición y libertad, información catastral, paz y salvos y copias de escrituras para el estudio de títulos antes de una compraventa.",
    audience: ["Compradores y vendedores", "Inmobiliarias", "Constructoras", "Abogados"],
    entities: [
      "Oficinas de Registro de Instrumentos Públicos (ORIP) · Superintendencia de Notariado y Registro",
      "IGAC o gestor catastral del municipio",
      "Secretarías de Hacienda municipales",
    ],
    requirements: [
      "Número de matrícula inmobiliaria (aparece en la escritura o en un certificado anterior).",
      "Si no lo tienes: dirección completa, municipio y nombre del propietario.",
      "Para paz y salvos: autorización del propietario cuando la entidad lo exija.",
    ],
    conditions: [
      "El certificado de tradición y libertad lo expide la ORIP de la jurisdicción del inmueble.",
      "La información catastral depende del gestor catastral de cada municipio.",
      "Un estudio de títulos jurídico lo debe firmar un abogado; nosotros reunimos y organizamos los soportes.",
    ],
    services: [
      {
        slug: "certificado-de-tradicion-y-libertad",
        name: "Certificado de tradición y libertad",
        summary: "Historial jurídico del inmueble: propietarios, hipotecas, embargos y limitaciones.",
        entity: "ORIP · Superintendencia de Notariado y Registro",
        modality: "remota",
        keywords: ["certificado de tradicion", "tradicion y libertad", "certificado de libertad", "matricula inmobiliaria"],
      },
      {
        slug: "consulta-matricula-inmobiliaria",
        name: "Consulta de matrícula inmobiliaria",
        summary: "Identificamos el folio de matrícula a partir de la dirección o el propietario.",
        entity: "ORIP",
        modality: "remota",
        keywords: ["numero de matricula", "folio de matricula", "matricula inmobiliaria"],
      },
      {
        slug: "certificado-catastral",
        name: "Certificado catastral",
        summary: "Área, avalúo y ficha predial del inmueble ante el gestor catastral.",
        entity: "IGAC o gestor catastral municipal",
        modality: "remota",
        keywords: ["certificado catastral", "avaluo catastral", "ficha catastral", "igac"],
      },
      {
        slug: "paz-y-salvo-predial",
        name: "Paz y salvo de impuesto predial",
        summary: "Certificado de que el inmueble está al día con el impuesto municipal.",
        entity: "Secretaría de Hacienda del municipio",
        modality: "mixta",
        keywords: ["paz y salvo predial", "impuesto predial", "paz y salvo"],
      },
      {
        slug: "carpeta-documental-compraventa",
        name: "Carpeta documental para compraventa",
        summary: "Tradición, escritura, catastro y paz y salvos reunidos y verificados en un solo expediente.",
        entity: "ORIP, notaría, catastro y municipio",
        modality: "remota",
        keywords: ["comprar casa", "vender casa", "documentos compraventa", "estudio de titulos"],
      },
    ],
    seo: {
      title: "Certificado de tradición y libertad y documentos inmobiliarios",
      description:
        "Gestionamos el certificado de tradición y libertad, consulta de matrícula, certificado catastral y paz y salvos para compraventas en Colombia.",
    },
  },
  {
    slug: "registros-civiles",
    name: "Registros civiles",
    shortName: "Registros civiles",
    icon: "civil",
    tagline: "Nacimiento, matrimonio y defunción, desde donde estés.",
    description:
      "Solicitamos copias de registros civiles en la notaría o registraduría donde se inscribieron, incluso si vives fuera de Colombia, y te orientamos cuando el registro necesita una corrección.",
    audience: ["Personas naturales", "Colombianos en el exterior", "Familias en sucesiones"],
    entities: ["Registraduría Nacional del Estado Civil", "Notarías con función registral"],
    requirements: [
      "Nombre completo del inscrito y fecha aproximada del hecho.",
      "Lugar de inscripción (notaría o registraduría) o número de serial si lo tienes.",
      "Documento del solicitante y parentesco cuando la oficina lo requiera.",
    ],
    conditions: [
      "La copia la expide la oficina que conserva el registro original.",
      "Algunas consultas son gratuitas en el canal oficial; si es así, te lo indicamos antes de cotizar.",
      "Las correcciones de fondo pueden requerir escritura pública o proceso judicial.",
    ],
    services: [
      {
        slug: "registro-civil-de-nacimiento",
        name: "Copia de registro civil de nacimiento",
        summary: "Copia para trámites nacionales o para apostillar en el exterior.",
        entity: "Notaría o Registraduría de inscripción",
        modality: "remota",
        keywords: ["registro civil", "registro de nacimiento", "partida de nacimiento"],
      },
      {
        slug: "registro-civil-de-matrimonio",
        name: "Registro civil de matrimonio",
        summary: "Copia del registro para sucesiones, visas o cambios de estado civil.",
        entity: "Notaría o Registraduría de inscripción",
        modality: "remota",
        keywords: ["registro de matrimonio", "acta de matrimonio"],
      },
      {
        slug: "registro-civil-de-defuncion",
        name: "Registro civil de defunción",
        summary: "Copia para sucesiones, pensiones y reclamaciones de seguros.",
        entity: "Notaría o Registraduría de inscripción",
        modality: "remota",
        keywords: ["registro de defuncion", "acta de defuncion", "partida de defuncion"],
      },
      {
        slug: "orientacion-correccion-registro",
        name: "Orientación para corrección de registro",
        summary: "Revisamos el error y te indicamos la vía: notarial, administrativa o judicial.",
        entity: "Notaría o Registraduría",
        modality: "mixta",
        keywords: ["corregir registro civil", "error en registro civil", "correccion"],
      },
    ],
    seo: {
      title: "Copia de registro civil de nacimiento, matrimonio y defunción",
      description:
        "Solicita copias de registros civiles en Colombia o desde el exterior. Te indicamos requisitos, oficina responsable y cotización antes de pagar.",
    },
  },
  {
    slug: "empresariales-comerciales",
    name: "Servicios empresariales y comerciales",
    shortName: "Empresariales",
    icon: "business",
    tagline: "Certificados de cámara de comercio, actas y documentos societarios.",
    description:
      "Obtenemos certificados de existencia y representación legal, matrícula mercantil y proponentes, y copias de actas y estatutos inscritos para licitaciones, bancos y procesos de contratación.",
    audience: ["Empresas", "Contadores", "Abogados", "Proponentes en licitaciones"],
    entities: ["Cámaras de Comercio (RUES)", "DIAN"],
    requirements: [
      "Razón social o NIT de la empresa.",
      "Cámara de comercio de domicilio, si la conoces.",
      "Para documentos internos de la sociedad: autorización del representante legal.",
    ],
    conditions: [
      "Los certificados los expide la cámara de comercio del domicilio principal.",
      "El RUT sólo lo descarga el titular o su representante con su usuario DIAN; te acompañamos en el proceso.",
    ],
    services: [
      {
        slug: "certificado-existencia-representacion",
        name: "Certificado de existencia y representación legal",
        summary: "Constitución, representantes, facultades y vigencia de la sociedad.",
        entity: "Cámara de comercio del domicilio",
        modality: "remota",
        keywords: ["camara de comercio", "existencia y representacion", "certificado de camara"],
      },
      {
        slug: "certificado-matricula-mercantil",
        name: "Certificado de matrícula mercantil",
        summary: "Para personas naturales comerciantes y establecimientos de comercio.",
        entity: "Cámara de comercio",
        modality: "remota",
        keywords: ["matricula mercantil", "establecimiento de comercio"],
      },
      {
        slug: "certificado-rup",
        name: "Certificado de Registro Único de Proponentes",
        summary: "Experiencia, capacidad financiera y clasificación para contratar con el Estado.",
        entity: "Cámara de comercio",
        modality: "remota",
        keywords: ["rup", "registro unico de proponentes", "proponentes", "licitacion"],
      },
      {
        slug: "copia-actas-estatutos",
        name: "Copia de actas y estatutos inscritos",
        summary: "Documentos societarios registrados para bancos, auditorías o litigios.",
        entity: "Cámara de comercio",
        modality: "remota",
        keywords: ["actas", "estatutos", "reforma estatutaria"],
      },
    ],
    seo: {
      title: "Certificado de cámara de comercio y documentos empresariales",
      description:
        "Certificados de existencia y representación legal, matrícula mercantil, RUP y copias de actas. Gestión documental para empresas en Colombia.",
    },
  },
  {
    slug: "antecedentes-certificados",
    name: "Antecedentes y certificados",
    shortName: "Antecedentes",
    icon: "records",
    tagline: "Judiciales, disciplinarios, fiscales y de medidas correctivas en un solo paquete.",
    description:
      "Consolidamos los certificados de antecedentes que piden empleadores y entidades contratantes, y los entregamos organizados en un solo expediente con su fecha de consulta.",
    audience: ["Personas en procesos de contratación", "Áreas de talento humano", "Contratistas del Estado"],
    entities: [
      "Policía Nacional",
      "Procuraduría General de la Nación",
      "Contraloría General de la República",
      "Registro Nacional de Medidas Correctivas",
    ],
    requirements: ["Tipo y número de documento de identidad.", "Autorización expresa del titular para consultar sus antecedentes."],
    conditions: [
      "Estos certificados son gratuitos en los canales oficiales. Nuestro valor es consolidarlos, verificarlos y entregarlos organizados; te lo decimos antes de cotizar.",
      "Sólo consultamos antecedentes con autorización del titular.",
    ],
    services: [
      {
        slug: "antecedentes-judiciales",
        name: "Certificado de antecedentes judiciales",
        summary: "Consulta ante la Policía Nacional.",
        entity: "Policía Nacional",
        modality: "remota",
        keywords: ["antecedentes judiciales", "pasado judicial", "policia"],
      },
      {
        slug: "antecedentes-disciplinarios",
        name: "Certificado de antecedentes disciplinarios",
        summary: "Expedido por la Procuraduría General de la Nación.",
        entity: "Procuraduría General de la Nación",
        modality: "remota",
        keywords: ["procuraduria", "antecedentes disciplinarios"],
      },
      {
        slug: "antecedentes-fiscales",
        name: "Certificado de antecedentes fiscales",
        summary: "Expedido por la Contraloría General de la República.",
        entity: "Contraloría General de la República",
        modality: "remota",
        keywords: ["contraloria", "antecedentes fiscales", "responsabilidad fiscal"],
      },
      {
        slug: "paquete-antecedentes-contratacion",
        name: "Paquete de antecedentes para contratación",
        summary: "Judiciales, disciplinarios, fiscales y medidas correctivas en un solo PDF organizado.",
        entity: "Policía, Procuraduría y Contraloría",
        modality: "remota",
        keywords: ["paquete antecedentes", "documentos para contrato", "medidas correctivas"],
      },
    ],
    seo: {
      title: "Certificados de antecedentes judiciales, disciplinarios y fiscales",
      description:
        "Consolidamos tus certificados de antecedentes para procesos de contratación en Colombia, con autorización del titular y entrega organizada.",
    },
  },
  {
    slug: "apostillas-legalizaciones",
    name: "Apostillas y legalizaciones",
    shortName: "Apostillas",
    icon: "apostille",
    tagline: "Documentos colombianos listos para surtir efecto en otro país.",
    description:
      "Revisamos que tu documento sea apostillable, gestionamos la apostilla o legalización ante la Cancillería y coordinamos la traducción oficial cuando el país de destino la exige.",
    audience: ["Colombianos en el exterior", "Estudiantes de intercambio", "Empresas con operaciones internacionales"],
    entities: ["Ministerio de Relaciones Exteriores (Cancillería)", "Traductores oficiales acreditados"],
    requirements: [
      "El documento original o su versión electrónica emitida por la entidad.",
      "País donde se presentará.",
      "Para títulos académicos: verificación previa de la institución o del Ministerio de Educación cuando aplique.",
    ],
    conditions: [
      "La apostilla la expide la Cancillería; la firma del funcionario debe estar registrada.",
      "Países que no son parte del Convenio de La Haya requieren legalización en lugar de apostilla.",
    ],
    services: [
      {
        slug: "apostilla-de-documentos",
        name: "Apostilla de documentos públicos",
        summary: "Registros civiles, certificados, sentencias, escrituras y más.",
        entity: "Cancillería",
        modality: "remota",
        keywords: ["apostilla", "apostillar", "cancilleria", "documento para el exterior"],
      },
      {
        slug: "legalizacion-de-documentos",
        name: "Legalización de documentos",
        summary: "Para países que no hacen parte del Convenio de La Haya.",
        entity: "Cancillería",
        modality: "remota",
        keywords: ["legalizar", "legalizacion"],
      },
      {
        slug: "traduccion-oficial",
        name: "Traducción oficial",
        summary: "Coordinamos la traducción con traductores oficiales acreditados.",
        entity: "Traductor oficial",
        modality: "remota",
        keywords: ["traduccion oficial", "traductor oficial", "traducir documento"],
      },
    ],
    seo: {
      title: "Apostilla y legalización de documentos en Colombia",
      description:
        "Gestionamos la apostilla y legalización de documentos colombianos ante la Cancillería, con revisión previa y traducción oficial cuando se requiere.",
    },
  },
  {
    slug: "academicos",
    name: "Servicios académicos",
    shortName: "Académicos",
    icon: "academic",
    tagline: "Diplomas, actas de grado y certificados de notas.",
    description:
      "Solicitamos copias de diplomas, actas de grado y certificados de notas ante colegios y universidades, y preparamos tus títulos para apostilla o convalidación.",
    audience: ["Egresados", "Estudiantes que viajan al exterior", "Áreas de talento humano"],
    entities: ["Instituciones educativas", "Secretarías de Educación", "Ministerio de Educación Nacional"],
    requirements: [
      "Nombre de la institución, programa y año de grado.",
      "Documento de identidad del egresado y autorización si lo solicita un tercero.",
    ],
    conditions: [
      "Cada institución define sus costos y tiempos de expedición.",
      "Si el colegio cerró, el archivo suele estar en la Secretaría de Educación; lo verificamos.",
    ],
    services: [
      {
        slug: "copia-diploma-acta-grado",
        name: "Copia de diploma y acta de grado",
        summary: "Duplicados o copias auténticas ante la institución.",
        entity: "Institución educativa",
        modality: "mixta",
        keywords: ["diploma", "acta de grado", "duplicado de diploma"],
      },
      {
        slug: "certificado-de-notas",
        name: "Certificado de notas",
        summary: "Calificaciones de bachillerato o educación superior.",
        entity: "Institución educativa",
        modality: "remota",
        keywords: ["certificado de notas", "calificaciones", "certificado de estudios"],
      },
      {
        slug: "preparacion-apostilla-titulos",
        name: "Preparación de títulos para apostilla",
        summary: "Verificación de firmas y trámite previo a la apostilla.",
        entity: "Institución y Ministerio de Educación",
        modality: "remota",
        keywords: ["apostillar diploma", "apostilla titulo", "titulo para el exterior"],
      },
      {
        slug: "orientacion-convalidacion",
        name: "Orientación para convalidación",
        summary: "Te guiamos con los documentos para convalidar un título extranjero.",
        entity: "Ministerio de Educación Nacional",
        modality: "remota",
        keywords: ["convalidacion", "convalidar titulo", "titulo extranjero"],
      },
    ],
    seo: {
      title: "Copia de diplomas, actas de grado y certificados de notas",
      description:
        "Solicita copias de diplomas, actas de grado y certificados de notas en Colombia, y prepara tus títulos para apostilla o convalidación.",
    },
  },
  {
    slug: "judiciales",
    name: "Servicios judiciales y jurídicos documentales",
    shortName: "Judiciales",
    icon: "judicial",
    tagline: "Consulta de procesos, copias de expedientes y certificados de despachos.",
    description:
      "Damos soporte documental a personas, abogados y empresas: consultamos el estado de procesos, gestionamos copias de providencias y certificados ante despachos judiciales cuando el solicitante está legitimado.",
    audience: ["Abogados y oficinas jurídicas", "Partes de un proceso", "Empresas"],
    entities: ["Rama Judicial", "Despachos judiciales del país"],
    requirements: [
      "Número de radicado del proceso (23 dígitos) o datos de las partes y el despacho.",
      "Calidad del solicitante: parte, apoderado o autorizado.",
    ],
    conditions: [
      "Las copias de expedientes con reserva sólo se entregan a partes o apoderados.",
      "Nuestro apoyo es documental y no reemplaza la representación de un abogado.",
    ],
    services: [
      {
        slug: "consulta-de-procesos",
        name: "Consulta y seguimiento de procesos",
        summary: "Estado y actuaciones de un proceso judicial con reporte periódico.",
        entity: "Rama Judicial",
        modality: "remota",
        keywords: ["consulta de procesos", "radicado", "estado del proceso"],
      },
      {
        slug: "copias-de-expedientes",
        name: "Copias de expedientes y providencias",
        summary: "Sentencias, autos y piezas procesales para partes legitimadas.",
        entity: "Despacho judicial",
        modality: "mixta",
        keywords: ["copia de sentencia", "copia de expediente", "providencia", "auto"],
      },
      {
        slug: "certificados-de-despacho",
        name: "Certificados de despachos judiciales",
        summary: "Constancias de existencia, estado o terminación de un proceso.",
        entity: "Despacho judicial",
        modality: "mixta",
        keywords: ["certificado judicial", "constancia de proceso", "certificado de despacho"],
      },
    ],
    seo: {
      title: "Consulta de procesos y copias de expedientes judiciales",
      description:
        "Apoyo documental para consultar procesos judiciales y obtener copias de providencias y certificados de despachos en Colombia.",
    },
  },
  {
    slug: "transito-transporte",
    name: "Servicios de tránsito y transporte",
    shortName: "Tránsito",
    icon: "transit",
    tagline: "Historial vehicular, comparendos y paz y salvos.",
    description:
      "Antes de comprar o vender un vehículo, reunimos su historial en el RUNT, el certificado de tradición del organismo de tránsito y el estado de multas, y te acompañamos con los documentos del traspaso.",
    audience: ["Compradores y vendedores de vehículos", "Empresas con flotas", "Concesionarios"],
    entities: ["RUNT", "Organismos de tránsito y secretarías de movilidad", "SIMIT"],
    requirements: ["Placa del vehículo.", "Documento del propietario para trámites que lo exijan."],
    conditions: [
      "El certificado de tradición vehicular lo expide el organismo de tránsito donde está matriculado.",
      "El traspaso exige firmas del comprador y vendedor según el organismo de tránsito.",
    ],
    services: [
      {
        slug: "certificado-tradicion-vehiculo",
        name: "Certificado de tradición de vehículo",
        summary: "Propietarios, prendas y limitaciones del vehículo.",
        entity: "Organismo de tránsito de matrícula",
        modality: "remota",
        keywords: ["tradicion vehiculo", "certificado de tradicion carro", "historial carro"],
      },
      {
        slug: "historial-vehicular-runt",
        name: "Historial vehicular RUNT",
        summary: "SOAT, revisión técnico-mecánica, trámites y novedades registradas.",
        entity: "RUNT",
        modality: "remota",
        keywords: ["runt", "historial vehicular", "consulta placa"],
      },
      {
        slug: "estado-comparendos",
        name: "Estado de comparendos y paz y salvo",
        summary: "Multas pendientes y certificado de paz y salvo del infractor o del vehículo.",
        entity: "SIMIT y organismo de tránsito",
        modality: "remota",
        keywords: ["comparendos", "multas", "simit", "paz y salvo de transito"],
      },
      {
        slug: "carpeta-traspaso",
        name: "Carpeta documental de traspaso",
        summary: "Documentos verificados para el traspaso de propiedad del vehículo.",
        entity: "Organismo de tránsito",
        modality: "mixta",
        keywords: ["traspaso", "traspaso de vehiculo", "vender carro"],
      },
    ],
    seo: {
      title: "Certificado de tradición vehicular, RUNT y comparendos",
      description:
        "Historial vehicular RUNT, certificado de tradición de vehículo, estado de comparendos y documentos para traspaso en Colombia.",
    },
  },
  {
    slug: "gestion-documental-empresarial",
    name: "Gestión documental empresarial",
    shortName: "Gestión documental",
    icon: "archive",
    tagline: "Archivos ordenados, digitalizados y fáciles de encontrar.",
    description:
      "Organizamos expedientes físicos y digitales, digitalizamos con indexación para búsqueda y operamos solicitudes documentales recurrentes para empresas que no pueden dedicar un equipo propio a ello.",
    audience: ["Empresas", "Inmobiliarias y administradores de propiedades", "Constructoras", "Firmas de abogados"],
    entities: ["Servicio propio de NEXODOC, con referencia a las buenas prácticas archivísticas del Archivo General de la Nación"],
    requirements: [
      "Diagnóstico inicial del volumen y estado del archivo.",
      "Acuerdo de confidencialidad y encargo de tratamiento de datos.",
    ],
    conditions: [
      "Cada proyecto se cotiza tras el diagnóstico.",
      "Los datos personales se tratan como encargado, según las instrucciones del responsable (tu empresa).",
    ],
    services: [
      {
        slug: "organizacion-de-expedientes",
        name: "Organización de expedientes",
        summary: "Clasificación, ordenación, foliación e inventario documental.",
        entity: "NEXODOC",
        modality: "mixta",
        keywords: ["organizar archivo", "expedientes", "inventario documental", "archivo"],
      },
      {
        slug: "digitalizacion",
        name: "Digitalización con indexación",
        summary: "Escaneo con metadatos para encontrar cualquier documento en segundos.",
        entity: "NEXODOC",
        modality: "mixta",
        keywords: ["digitalizacion", "escanear documentos", "archivo digital"],
      },
      {
        slug: "solicitudes-recurrentes",
        name: "Solicitudes recurrentes y masivas",
        summary: "Certificados por lote con seguimiento centralizado y reportes.",
        entity: "NEXODOC ante las entidades correspondientes",
        modality: "remota",
        keywords: ["solicitudes masivas", "certificados por lote", "volumen"],
      },
      {
        slug: "apoyo-tablas-retencion",
        name: "Apoyo en tablas de retención documental",
        summary: "Levantamiento de información y apoyo en instrumentos archivísticos.",
        entity: "NEXODOC",
        modality: "mixta",
        keywords: ["tablas de retencion", "trd", "gestion documental"],
      },
    ],
    seo: {
      title: "Gestión documental empresarial en Colombia",
      description:
        "Organización de expedientes, digitalización con indexación y solicitudes documentales masivas para empresas, inmobiliarias y firmas de abogados.",
    },
  },
];

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

export const allServices = categories.flatMap((category) =>
  category.services.map((service) => ({ ...service, category })),
);

export const totalServices = allServices.length;
