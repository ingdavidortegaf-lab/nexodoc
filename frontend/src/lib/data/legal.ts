/**
 * Documentos legales base. IMPORTANTE: son una estructura de partida
 * alineada con la Ley 1581 de 2012, el Decreto 1074 de 2015 y la Ley 1480
 * de 2011 (Estatuto del Consumidor). Deben ser revisados por un abogado
 * antes de publicarse.
 *
 * Marcadores que se reemplazan al renderizar con los datos de .env:
 * {empresa} {nit} {correo} {direccion}
 */
export interface LegalDocument {
  slug: string;
  title: string;
  shortTitle: string;
  updated: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
}

export const legalDocuments: LegalDocument[] = [
  {
    slug: "politica-de-privacidad",
    title: "Política de privacidad",
    shortTitle: "Privacidad",
    updated: "2026-11-22",
    intro:
      "Esta política explica qué información recogemos en el sitio web de NEXODOC, para qué la usamos y cómo la protegemos.",
    sections: [
      {
        heading: "Información que recogemos",
        body: [
          "Datos que nos entregas al solicitar un servicio: nombre, documento de identidad, correo, teléfono, ciudad y los datos del documento que necesitas.",
          "Archivos que adjuntas como soporte de tu solicitud.",
          "Datos técnicos mínimos para la seguridad del sitio, como dirección IP y registros de acceso.",
        ],
      },
      {
        heading: "Para qué la usamos",
        body: [
          "Gestionar tu solicitud ante la entidad correspondiente, enviarte la cotización y mantenerte informado del estado.",
          "Cumplir obligaciones legales, contables y tributarias.",
          "Prevenir fraude y accesos no autorizados.",
        ],
      },
      {
        heading: "Cómo la protegemos",
        body: [
          "Cifrado en tránsito y en reposo, acceso restringido por rol a cada expediente y registro de auditoría de cada consulta.",
          "Nunca compartimos tus documentos mediante enlaces públicos.",
        ],
      },
      {
        heading: "Cookies",
        body: ["Usamos únicamente cookies técnicas necesarias para el funcionamiento y la seguridad del sitio."],
      },
      {
        heading: "Contacto",
        body: ["Para cualquier consulta sobre privacidad escríbenos a {correo}."],
      },
    ],
  },
  {
    slug: "tratamiento-de-datos",
    title: "Política de tratamiento de datos personales",
    shortTitle: "Tratamiento de datos",
    updated: "2026-11-22",
    intro:
      "En cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1074 de 2015, {empresa} adopta la presente política para el tratamiento de los datos personales de sus clientes, usuarios y proveedores.",
    sections: [
      {
        heading: "Responsable del tratamiento",
        body: ["Razón social: {empresa}. NIT: {nit}. Domicilio: {direccion}. Correo para asuntos de datos personales: {correo}."],
      },
      {
        heading: "Finalidades",
        body: [
          "Recibir, validar, cotizar y gestionar solicitudes documentales ante entidades públicas y privadas.",
          "Enviar comunicaciones sobre el estado de las solicitudes por correo, mensaje de texto o WhatsApp.",
          "Facturación, atención de peticiones, quejas y reclamos, y cumplimiento de obligaciones legales.",
        ],
      },
      {
        heading: "Datos sensibles",
        body: [
          "Algunos documentos pueden contener datos sensibles. Su entrega es facultativa y sólo se tratan cuando son indispensables para el servicio solicitado y con autorización expresa del titular.",
        ],
      },
      {
        heading: "Derechos del titular",
        body: [
          "Conocer, actualizar y rectificar sus datos; solicitar prueba de la autorización; ser informado del uso dado a sus datos; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización y solicitar la supresión cuando no exista un deber legal o contractual de conservarlos; y acceder gratuitamente a sus datos.",
        ],
      },
      {
        heading: "Procedimiento para consultas y reclamos",
        body: [
          "Las solicitudes se reciben en {correo}. Las consultas se atienden en un máximo de diez (10) días hábiles y los reclamos en un máximo de quince (15) días hábiles, prorrogables en los términos de los artículos 14 y 15 de la Ley 1581 de 2012.",
        ],
      },
      {
        heading: "Conservación y supresión",
        body: [
          "Los documentos aportados para una solicitud se conservan mientras dure la gestión y por el plazo informado al cliente, tras el cual se eliminan de forma segura, salvo obligación legal de conservarlos.",
        ],
      },
      {
        heading: "Vigencia",
        body: ["Esta política rige desde su publicación y se mantendrá mientras {empresa} realice tratamiento de datos."],
      },
    ],
  },
  {
    slug: "terminos-y-condiciones",
    title: "Términos y condiciones",
    shortTitle: "Términos",
    updated: "2026-11-22",
    intro: "Estos términos regulan el uso de la plataforma y la contratación de los servicios de gestión documental de NEXODOC.",
    sections: [
      {
        heading: "Naturaleza del servicio",
        body: [
          "NEXODOC es una empresa privada que gestiona solicitudes documentales en nombre del cliente. No es una entidad pública ni expide documentos: estos los expide la entidad responsable en cada caso.",
          "El servicio de NEXODOC es de medio y no de resultado frente a decisiones o tiempos de las entidades.",
        ],
      },
      {
        heading: "Cotización y pago",
        body: [
          "Toda gestión se cotiza antes del pago, separando los derechos o tarifas de la entidad del honorario de gestión de NEXODOC.",
          "La gestión inicia sólo cuando el cliente aprueba la cotización y se confirma el pago.",
        ],
      },
      {
        heading: "Obligaciones del cliente",
        body: [
          "Entregar información veraz y completa, contar con legitimación para solicitar el documento y aportar las autorizaciones que la entidad exija.",
        ],
      },
      {
        heading: "Tiempos",
        body: [
          "Los tiempos informados son estimaciones basadas en la entidad. NEXODOC no garantiza expedición inmediata ni controla los plazos de las entidades.",
        ],
      },
      {
        heading: "Ley aplicable",
        body: ["Estos términos se rigen por las leyes de la República de Colombia, incluida la Ley 1480 de 2011."],
      },
    ],
  },
  {
    slug: "politica-de-devoluciones",
    title: "Política de devoluciones",
    shortTitle: "Devoluciones",
    updated: "2026-11-22",
    intro: "Así manejamos los reembolsos cuando una solicitud no puede completarse.",
    sections: [
      {
        heading: "Honorario de gestión",
        body: [
          "Si la solicitud no puede gestionarse por causas atribuibles a NEXODOC, reembolsamos el 100 % del honorario.",
          "Si el cliente cancela antes de que iniciemos la gestión ante la entidad, reembolsamos el honorario descontando únicamente los costos de transacción.",
        ],
      },
      {
        heading: "Derechos y tarifas de entidades",
        body: [
          "Los valores pagados a una entidad sólo pueden reintegrarse si la propia entidad los devuelve, conforme a sus procedimientos.",
        ],
      },
      {
        heading: "Cómo solicitar un reembolso",
        body: [
          "Escribe a {correo} indicando el código de tu solicitud. Respondemos en un máximo de quince (15) días hábiles y el reembolso se hace por el mismo medio de pago cuando sea posible.",
        ],
      },
      {
        heading: "Derecho de retracto",
        body: [
          "Cuando aplique el derecho de retracto del artículo 47 de la Ley 1480 de 2011, el cliente puede ejercerlo dentro de los cinco (5) días hábiles siguientes a la contratación, siempre que la prestación del servicio no haya comenzado con su acuerdo.",
        ],
      },
    ],
  },
];

export const getLegalDocument = (slug: string) => legalDocuments.find((d) => d.slug === slug);
