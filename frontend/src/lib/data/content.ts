/**
 * Contenido editorial de la landing. Separado de los componentes para que
 * el equipo comercial pueda ajustarlo sin tocar diseño ni lógica.
 */
import { categories, totalServices } from "./categories";
import { requestStatuses } from "./statuses";

export const hero = {
  eyebrow: "Gestión documental para personas y empresas en Colombia",
  title: "Los documentos que necesitas, gestionados de forma sencilla.",
  description:
    "Conectamos tus necesidades documentales con los canales y entidades correspondientes. Solicita, gestiona y consulta tus documentos desde una sola plataforma.",
  primaryCta: { label: "Solicitar un documento", href: "/solicitar" },
  secondaryCta: { label: "Explorar servicios", href: "/#servicios" },
  assurances: ["Pago en línea: PSE, tarjeta o Nequi", "Seguimiento con tu número de pedido", "Datos protegidos · Ley 1581"],
};

export const processSteps = [
  { title: "Selecciona el documento", text: "Búscalo por nombre o explora las categorías. Cada servicio te muestra requisitos, entidad responsable y precio de referencia." },
  { title: "Completa el formulario", text: "Guiado y propio de cada documento: te pedimos sólo los datos que la entidad necesita. Agrega varios documentos al carrito." },
  { title: "Paga la verificación en línea", text: "Con PSE, tarjeta o Nequi. Si el documento no requiere verificación, envías el pedido sin pagar." },
  { title: "Confirmamos con la entidad", text: "Verificamos que el documento exista y te enviamos el valor final: derechos de la entidad, honorario y envío." },
  { title: "Pagas el saldo", text: "Desde «Estado de tu pedido», descontando lo que ya pagaste. Sin cobros ocultos ni sorpresas." },
  { title: "Gestionamos la solicitud", text: "Radicamos y hacemos seguimiento ante la entidad. Ves cada cambio de estado con tu número de pedido." },
  { title: "Recibes tu documento", text: "En formato digital por correo o en físico en cualquier ciudad de Colombia o del exterior." },
];

export const businessAudiences = ["Inmobiliarias", "Abogados", "Constructoras", "Empresas", "Administradores de propiedades"];

export const businessFeatures = [
  { title: "Gestión documental recurrente", text: "Un equipo dedicado a tus solicitudes del mes, con acuerdos de servicio claros." },
  { title: "Solicitudes masivas", text: "Carga un listado de matrículas, placas o NIT y recibe todo en un solo expediente." },
  { title: "Organización de expedientes", text: "Clasificación, foliación e inventario de tus archivos físicos y digitales." },
  { title: "Digitalización", text: "Escaneo con indexación para encontrar cualquier documento en segundos." },
  { title: "Seguimiento centralizado", text: "Todas las solicitudes de tu equipo en un tablero, con reportes exportables." },
  { title: "Atención empresarial", text: "Un gestor de cuenta, facturación consolidada y canal prioritario." },
];

export const pillars = [
  {
    title: "Gestión centralizada",
    text: "Notarías, registro, cámaras de comercio, Cancillería y tránsito: una sola solicitud y un solo interlocutor, sin importar cuántas entidades intervengan.",
  },
  {
    title: "Seguimiento transparente",
    text: "Estados claros, desde «Recibida» hasta «Entregada», que consultas con tu número de pedido. Si la entidad tarda, lo ves: «En espera de respuesta de la entidad».",
  },
  {
    title: "Atención nacional",
    text: "Gestionamos de forma remota ante entidades de todo el país. Tú no tienes que desplazarte, ni siquiera si vives en el exterior.",
  },
  {
    title: "Tecnología y automatización",
    text: "Validación de archivos, notificaciones y trazabilidad de cada paso. La tecnología hace el trabajo repetitivo; las personas, el criterio.",
  },
];

/** Cifras verificables: salen del propio catálogo, no de supuestos. */
export const stats = [
  { value: categories.length, suffix: "", label: "categorías de servicio" },
  { value: totalServices, suffix: "", label: "trámites documentales" },
  { value: 32, suffix: "", label: "departamentos en nuestro alcance" },
  { value: requestStatuses.length, suffix: "", label: "estados de seguimiento" },
];

export const coverageCities = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga",
  "Cúcuta", "Pereira", "Villavicencio", "Yopal", "Pasto", "Santa Marta",
];

export const faqs = [
  {
    q: "¿Cómo solicito un documento?",
    a: "Busca el documento o elige su categoría, completa su formulario y agrégalo al carrito. Puedes pedir varios documentos en un mismo pedido. Al finalizar pagas la verificación (si aplica) y recibes un número de pedido para seguirlo en línea.",
  },
  {
    q: "¿Cómo puedo pagar?",
    a: "En línea con PSE, tarjeta débito o crédito, Nequi o botón Bancolombia, a través de Wompi. NEXODOC no ve ni guarda los datos de tu tarjeta. Primero pagas el valor de verificación y, cuando la entidad confirma, el saldo del valor final.",
  },
  {
    q: "¿Qué requisitos necesito?",
    a: "Depende del documento. Cada servicio indica sus requisitos: por ejemplo, para un certificado de tradición y libertad basta el número de matrícula inmobiliaria. Si no tienes un dato, te ayudamos a encontrarlo.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "El valor tiene dos partes: los derechos o tarifas que cobra la entidad (que no fijamos nosotros) y nuestro honorario de gestión. Ambos aparecen por separado en la cotización, antes de que pagues. Si un documento es gratuito en su canal oficial, te lo decimos.",
  },
  {
    q: "¿Cuánto tarda?",
    a: "Los tiempos dependen de la entidad que expide el documento. En la cotización te damos un estimado realista. No prometemos expedición inmediata, porque no depende de nosotros.",
  },
  {
    q: "¿Cómo recibo el documento?",
    a: "Los documentos electrónicos se envían a tu correo. Los físicos se envían por mensajería a la dirección que indiques, en Colombia o en el exterior, cuando la entidad los entrega en papel.",
  },
  {
    q: "¿Mis datos están protegidos?",
    a: "Tratamos tus datos conforme a la Ley 1581 de 2012: sólo para gestionar tu solicitud, con acceso restringido a tu expediente y almacenamiento cifrado. Nunca compartimos tus documentos por enlaces públicos.",
  },
  {
    q: "¿Puedo hacer seguimiento?",
    a: "Sí. En «Estado de tu pedido» escribes el número de pedido y tu correo y ves cada documento, su historial y la cotización. También te notificamos cuando algo cambia o cuando necesitamos información adicional.",
  },
  {
    q: "¿Hay reembolsos?",
    a: "Si no podemos gestionar tu solicitud por causas atribuibles a NEXODOC, te devolvemos el honorario. Los derechos ya pagados a una entidad sólo se reintegran si la entidad los devuelve. Los detalles están en la Política de devoluciones.",
  },
  {
    q: "¿NEXODOC es una entidad pública?",
    a: "No. Somos una empresa privada e independiente que gestiona solicitudes ante las entidades. Los documentos los expide siempre la entidad responsable, y puedes acudir directamente a ella si lo prefieres.",
  },
];

export const finalCta = {
  title: "Tu gestión documental comienza aquí.",
  text: "Encuentra el servicio que necesitas y deja que te acompañemos durante el proceso.",
  cta: { label: "Comenzar solicitud", href: "/solicitar" },
};
