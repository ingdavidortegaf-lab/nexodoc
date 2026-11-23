# NEXODOC · Sistema de diseño

Identidad digital para una LegalTech colombiana: **institucional sin ser burocrática, tecnológica sin ser fría.**
Los tokens viven en `frontend/src/app/globals.css` (bloque `@theme`, Tailwind v4) y se usan como clases: `bg-night`, `text-teal-ink`, `shadow-lift`, `rounded-xl`, `ease-out-expo`…

---

## 1. Principios

1. **Claridad antes que decoración.** Cada pantalla responde: qué es, qué necesito, qué sigue.
2. **Honestidad visible.** Entidad responsable, requisitos y condiciones siempre a la vista. Nunca "inmediato".
3. **Calma.** Mucho aire, una sola acción principal por bloque, movimiento que orienta y no distrae.
4. **Un acento.** El turquesa marca lo activo, lo completado y lo accionable. Si todo es turquesa, nada lo es.

---

## 2. Color

| Token | Hex | Uso |
|---|---|---|
| `night` | `#10243A` | Titulares, botón primario, bandas oscuras, footer |
| `navy` | `#173B5E` | Superficies secundarias, hover del primario, degradados |
| `navy-600` | `#1D4A73` | Luz de degradados en ilustraciones |
| `teal` | `#19B7B0` | Acento: estados activos, progreso, detalles de icono |
| `teal-600` | `#139C96` | Sombra del acento en ilustraciones |
| `teal-ink` | `#0B7A75` | Texto turquesa sobre blanco (contraste 5,2:1, AA) |
| `teal-300` | `#6FE6DE` | Texto turquesa sobre `night` |
| `teal-soft` | `#E6F7F6` | Fondos de etiquetas y tarjeta destacada clara |
| `mist` | `#F4F7FA` | Bandas alternas, campos, fondos suaves |
| `slate` | `#64748B` | Texto secundario (4,8:1 sobre blanco) |
| `line` / `line-strong` | `#E2E8F0` / `#CBD5E1` | Bordes y divisores |

**Proporción orientativa por pantalla:** 70 % blanco/mist · 20 % night/navy · ≤10 % turquesa.
No usar `teal` (#19B7B0) para texto pequeño sobre blanco: usar `teal-ink`.

**Ritmo de fondos en la landing:** hero claro → buscador blanco elevado → catálogo blanco → cómo funciona `mist` → empresas `night` → por qué blanco → cobertura `mist` → FAQ blanco → CTA `navy→night` → footer `night`.

---

## 3. Tipografía

| Rol | Familia | Pesos | Clase |
|---|---|---|---|
| Display y titulares | Plus Jakarta Sans | 700–800 | `font-display` |
| Texto | Inter | 400–600 | `font-sans` (por defecto) |
| Interfaz, etiquetas y cifras | Manrope | 500–700 | `font-label` |

| Estilo | Tamaño | Interlineado | Tracking | Clase |
|---|---|---|---|---|
| Display (H1) | 40 → 70 px fluido | 1.03 | −0.035em | `text-display font-extrabold` |
| H2 | 32 → 50 px fluido | 1.07 | −0.03em | `text-h2 font-bold` |
| H3 | 20 px | 1.3 | −0.02em | `text-h3 font-bold` |
| Lead | 17 → 19 px | 1.6 | 0 | `text-lead` |
| Cuerpo | 17 px | 1.65 | 0 | por defecto |
| Etiqueta | 14 px | — | 0 | `font-label text-sm font-semibold` |

Reglas: titulares con `text-wrap: balance`; líneas de texto ≤ 70 caracteres; nada por debajo de 12 px; etiquetas en minúscula de oración (sin mayúsculas sostenidas).

---

## 4. Espaciado, radios y sombras

- **Contenedor:** `container-site` (máx. 1216 px, márgenes fluidos 20–40 px).
- **Secciones:** `section-y` (72 → 136 px verticales).
- **Retícula base:** múltiplos de 4 px; separación entre tarjetas 16 px (`gap-4`).

| Radio | Valor | Uso |
|---|---|---|
| `rounded-sm` | 10 px | Chips internos |
| `rounded-md` | 14 px | Campos, mosaicos de icono |
| `rounded-lg` | 20 px | Paneles pequeños |
| `rounded-xl` | 28 px | Tarjetas y módulos |
| `rounded-full` | — | Botones y etiquetas |

| Sombra | Uso |
|---|---|
| `shadow-card` | Tarjetas en reposo |
| `shadow-lift` | Hover, módulos flotantes (buscador, formulario) |
| `shadow-glow` | Hover del botón primario / turquesa |
| `shadow-inset` | Borde interior de 1 px en superficies blancas |

---

## 5. Iconografía

- Retícula 24 px, trazo 1.6 (categorías) o 1.7 (interfaz), terminaciones y uniones redondeadas.
- **Un detalle turquesa por icono de categoría** (sello, puerta, check…). Sobre fondos oscuros el acento pasa a `teal-300`.
- Fuente única: `tools/build_assets.py` genera `CategoryIcon.tsx`. Prohibido usar emojis como iconos.

| Categoría | Metáfora |
|---|---|
| Notariales | Documento con sello |
| Inmobiliarios | Casa con puerta destacada |
| Registros civiles | Adulto y niño |
| Empresariales | Edificio corporativo |
| Antecedentes | Escudo con verificación |
| Apostillas | Globo con sello |
| Académicos | Birrete con borla |
| Judiciales | Balanza |
| Tránsito | Frente de vehículo |
| Gestión documental | Caja de archivo |

---

## 6. Ilustración

- **Hero:** "ecosistema documental" — una solicitud real en seguimiento al centro, rodeada de escritura, certificado, expediente y entidad, unidos por conexiones con flujo animado.
- Formas pocas y seguras, cada una con base, sombra suave y luz de borde. Degradados sólo de luz (`navy-600 → night`, `#3FD6CE → teal-600`).
- **Mapa de Colombia:** silueta en puntos generada desde coordenadas reales simplificadas; ciudades con pulso; las líneas son conexiones digitales, nunca sedes.
- Sin fotografías de bancos de imágenes ni manos estrechándose.

---

## 7. Movimiento

| Token | Valor | Uso |
|---|---|---|
| `ease-out-expo` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entradas, hovers, transiciones |
| `ease-in-out-soft` | `cubic-bezier(0.65, 0, 0.35, 1)` | Bucles de flotación |
| Rápido | 200–300 ms | Hover, foco, chips |
| Medio | 400–600 ms | Paneles, pasos de formulario, acordeón |
| Lento | 700–900 ms | Entradas de sección y del hero |

| Patrón | Implementación |
|---|---|
| Entrada del hero (titular palabra a palabra) | `Hero.tsx` · Motion |
| Capas de la ilustración escalonadas | `HeroIllustration.tsx` · Motion |
| Flotación, flujo, pulso, destellos | CSS `nx-*` en `globals.css` |
| Aparición al hacer scroll | `Reveal`, `RevealGroup`, `RevealItem` |
| Botón magnético | `Button` (sólo ratón, desactivado con movimiento reducido) |
| Brillo que sigue el cursor | `CategoryCard` (variables `--mx`/`--my`) |
| Cifras que cuentan | `Counter` |
| Línea de tiempo con progreso de scroll | `HowItWorks` (`useScroll` + `useSpring`) |
| Pasos del formulario, éxito y error | `RequestForm` (deslizamiento, trazo del check, sacudida) |
| Transición entre páginas | `app/template.tsx` |
| Carga | `app/loading.tsx` |

**Siempre:** `prefers-reduced-motion` desactiva bucles, desplazamientos y desenfoques (sólo quedan fundidos).
Sólo se animan `transform` y `opacity` en bucles, para no afectar el rendimiento.

---

## 8. Componentes

| Componente | Archivo | Variantes |
|---|---|---|
| `Logo`, `LogoMark` | `ui/Logo.tsx` | `tone="light" \| "dark"` |
| `Button` | `ui/Button.tsx` | `primary`, `secondary`, `ghost`, `light`, `outline-light` · `md`, `lg` · `arrow` · `magnetic` |
| `SectionHeading` | `ui/SectionHeading.tsx` | `align`, `tone` |
| `Reveal` / `RevealGroup` / `RevealItem` | `ui/Reveal.tsx` | `delay`, `y`, `stagger` |
| `Counter` | `ui/Counter.tsx` | `value`, `suffix` |
| `Accordion` | `ui/Accordion.tsx` | patrón WAI-ARIA, un panel abierto |
| `CategoryIcon`, `UiIcon` | `icons/` | 10 + 27 glifos |
| `CategoryCard` | `sections/ServicesCatalog.tsx` | `night`, `navy`, `soft`, `plain` |
| `RequestForm` | `forms/RequestForm.tsx` | 3 pasos, estados éxito / error / sin backend |

Estados de interacción comunes: hover (elevación −4 px + `shadow-lift`), foco visible (anillo turquesa 2 px, desplazamiento 3 px), deshabilitado (50 % opacidad, sin puntero).

---

## 9. Voz y contenido

- Tú, cercano y preciso. Frases cortas, verbos concretos ("solicita", "revisamos", "te enviamos").
- Prohibido: "inmediato", "garantizado", "100 % seguro", "aliados oficiales", certificaciones no obtenidas, cifras de clientes inventadas.
- Siempre que aplique: "según la entidad", "antes de pagar", "te lo decimos".
- Las cifras públicas salen del catálogo (`stats` en `content.ts`), no de supuestos.
