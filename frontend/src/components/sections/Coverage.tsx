import { ColombiaMap } from "@/components/illustrations/ColombiaMap";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UiIcon } from "@/components/icons/UiIcon";
import { coverageCities } from "@/lib/data/content";

const regions = [
  { name: "Caribe", note: "Barranquilla, Cartagena, Santa Marta" },
  { name: "Andina", note: "Bogotá, Medellín, Bucaramanga, Pereira" },
  { name: "Pacífico", note: "Cali, Quibdó, Buenaventura, Pasto" },
  { name: "Orinoquía", note: "Villavicencio, Yopal, Arauca" },
  { name: "Amazonía", note: "Florencia, Mocoa, Leticia" },
  { name: "Insular", note: "San Andrés y Providencia" },
];

export function Coverage() {
  return (
    <section className="section-y relative overflow-hidden bg-mist" aria-labelledby="cobertura-title">
      <div className="container-site grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <SectionHeading
            id="cobertura-title"
            eyebrow="Cobertura nacional"
            title="Gestionamos ante entidades de todo el país, sin que te desplaces."
            description="Nuestra operación es digital y nuestra vocación es nacional. Trabajamos de forma remota con notarías, oficinas de registro, cámaras de comercio y organismos de cada región."
          />
          <Reveal delay={0.1}>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {regions.map((r) => (
                <li key={r.name} className="rounded-lg bg-white p-4 ring-1 ring-night/5">
                  <p className="font-display font-bold text-night">{r.name}</p>
                  <p className="mt-1 text-sm text-slate">{r.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-start gap-2.5 text-sm text-slate">
              <UiIcon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-teal-ink" />
              Atención 100 % remota. Las ciudades del mapa ilustran el alcance de la gestión; no corresponden a oficinas
              físicas.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="relative mx-auto w-full max-w-[460px]">
          <div className="absolute inset-[8%] rounded-full bg-teal/10 blur-3xl" aria-hidden="true" />
          <ColombiaMap className="relative" />
          <p className="sr-only">Ciudades destacadas: {coverageCities.join(", ")}.</p>
        </Reveal>
      </div>
    </section>
  );
}
