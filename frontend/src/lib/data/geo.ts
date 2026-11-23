/**
 * Departamentos de Colombia y su capital (sugerencia de municipio).
 * El municipio se escribe libremente con sugerencias, porque hay más de 1.100.
 * Para una lista cerrada, carga la DIVIPOLA del DANE en este archivo.
 */
export const departments: { name: string; capital: string }[] = [
  { name: "Amazonas", capital: "Leticia" },
  { name: "Antioquia", capital: "Medellín" },
  { name: "Arauca", capital: "Arauca" },
  { name: "Atlántico", capital: "Barranquilla" },
  { name: "Bogotá, D.C.", capital: "Bogotá" },
  { name: "Bolívar", capital: "Cartagena de Indias" },
  { name: "Boyacá", capital: "Tunja" },
  { name: "Caldas", capital: "Manizales" },
  { name: "Caquetá", capital: "Florencia" },
  { name: "Casanare", capital: "Yopal" },
  { name: "Cauca", capital: "Popayán" },
  { name: "Cesar", capital: "Valledupar" },
  { name: "Chocó", capital: "Quibdó" },
  { name: "Córdoba", capital: "Montería" },
  { name: "Cundinamarca", capital: "Soacha" },
  { name: "Guainía", capital: "Inírida" },
  { name: "Guaviare", capital: "San José del Guaviare" },
  { name: "Huila", capital: "Neiva" },
  { name: "La Guajira", capital: "Riohacha" },
  { name: "Magdalena", capital: "Santa Marta" },
  { name: "Meta", capital: "Villavicencio" },
  { name: "Nariño", capital: "Pasto" },
  { name: "Norte de Santander", capital: "Cúcuta" },
  { name: "Putumayo", capital: "Mocoa" },
  { name: "Quindío", capital: "Armenia" },
  { name: "Risaralda", capital: "Pereira" },
  { name: "San Andrés y Providencia", capital: "San Andrés" },
  { name: "Santander", capital: "Bucaramanga" },
  { name: "Sucre", capital: "Sincelejo" },
  { name: "Tolima", capital: "Ibagué" },
  { name: "Valle del Cauca", capital: "Cali" },
  { name: "Vaupés", capital: "Mitú" },
  { name: "Vichada", capital: "Puerto Carreño" },
];

/** Municipios frecuentes por departamento (sugerencias; se puede escribir cualquier otro). */
export const frequentMunicipalities: Record<string, string[]> = {
  Antioquia: ["Medellín", "Bello", "Itagüí", "Envigado", "Rionegro", "Apartadó", "Turbo", "Caucasia", "Sabaneta"],
  Atlántico: ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Puerto Colombia"],
  "Bogotá, D.C.": ["Bogotá"],
  Bolívar: ["Cartagena de Indias", "Magangué", "Turbaco", "El Carmen de Bolívar"],
  Boyacá: ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa"],
  Caldas: ["Manizales", "La Dorada", "Chinchiná", "Villamaría"],
  Casanare: ["Yopal", "Aguazul", "Villanueva", "Tauramena", "Paz de Ariporo"],
  Cauca: ["Popayán", "Santander de Quilichao", "Puerto Tejada"],
  Cesar: ["Valledupar", "Aguachica", "Agustín Codazzi"],
  Córdoba: ["Montería", "Lorica", "Sahagún", "Cereté"],
  Cundinamarca: ["Soacha", "Fusagasugá", "Facatativá", "Zipaquirá", "Chía", "Girardot", "Mosquera", "Madrid", "Funza", "Cajicá"],
  Huila: ["Neiva", "Pitalito", "Garzón", "La Plata"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia"],
  Magdalena: ["Santa Marta", "Ciénaga", "Fundación"],
  Meta: ["Villavicencio", "Acacías", "Granada", "Puerto López"],
  Nariño: ["Pasto", "Tumaco", "Ipiales"],
  "Norte de Santander": ["Cúcuta", "Ocaña", "Pamplona", "Villa del Rosario", "Los Patios"],
  Quindío: ["Armenia", "Calarcá", "Montenegro", "Quimbaya"],
  Risaralda: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"],
  Santander: ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil"],
  Sucre: ["Sincelejo", "Corozal"],
  Tolima: ["Ibagué", "Espinal", "Melgar", "Honda"],
  "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago", "Buga", "Jamundí", "Yumbo"],
};

export const municipalitySuggestions = (department: string) => {
  const d = departments.find((x) => x.name === department);
  const list = frequentMunicipalities[department] ?? (d ? [d.capital] : []);
  return Array.from(new Set(list));
};

/** Países de destino frecuentes para envíos internacionales, apostillas y traducciones. */
export const countries = [
  "Estados Unidos", "España", "Canadá", "Chile", "México", "Panamá", "Argentina", "Perú", "Ecuador", "Brasil",
  "Alemania", "Italia", "Francia", "Reino Unido", "Países Bajos", "Suiza", "Australia", "Venezuela", "Costa Rica",
  "República Dominicana", "Otro",
];

export const languages = [
  "Español", "Inglés", "Francés", "Alemán", "Italiano", "Portugués", "Neerlandés", "Chino", "Japonés", "Árabe", "Ruso", "Otro",
];
