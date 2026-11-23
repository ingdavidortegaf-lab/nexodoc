import { LogoMark } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { UiIcon } from "@/components/icons/UiIcon";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Panel del equipo", description: "Acceso del equipo de NEXODOC", path: "/admin/ingresar", noindex: true });

type Props = { searchParams: Promise<{ error?: string }> };

const errors: Record<string, string> = {
  "1": "Correo o contraseña incorrectos.",
  limite: "Demasiados intentos. Espera unos minutos.",
  config: "El sistema de pedidos aún no está conectado (NEXODOC_API_URL).",
  sesion: "Tu sesión terminó. Vuelve a ingresar.",
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <section className="bg-hero grid min-h-screen place-items-center px-5 pb-20 pt-[104px]">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lift ring-1 ring-night/5 md:p-10">
        <LogoMark className="h-11 w-11" />
        <h1 className="mt-6 font-display text-2xl font-bold">Panel del equipo</h1>
        <p className="mt-2 text-slate">Acceso para gestores y administradores de NEXODOC.</p>
        {error && errors[error] && (
          <p role="alert" className="mt-5 flex gap-2.5 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <UiIcon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /> {errors[error]}
          </p>
        )}
        <form action="/api/admin/login" method="post" className="mt-6 space-y-5">
          <div>
            <label htmlFor="a-email" className="mb-2 block font-label text-sm font-semibold">Correo</label>
            <input id="a-email" name="email" type="email" autoComplete="username" required className="input" />
          </div>
          <div>
            <label htmlFor="a-pass" className="mb-2 block font-label text-sm font-semibold">Contraseña</label>
            <input id="a-pass" name="password" type="password" autoComplete="current-password" required className="input" />
          </div>
          <Button type="submit" className="w-full" magnetic={false}>Ingresar</Button>
        </form>
      </div>
    </section>
  );
}
