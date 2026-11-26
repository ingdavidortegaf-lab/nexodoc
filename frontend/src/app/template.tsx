/**
 * Transición suave entre páginas (se vuelve a montar en cada navegación).
 * Es animación CSS: antes era Motion con opacity 0 inicial, y en celulares la
 * página completa quedaba en blanco hasta que cargaba el JavaScript (3–4 s).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="nx-page">{children}</div>;
}
