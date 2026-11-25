# NEXODOC

Plataforma de gestión documental para personas y empresas en Colombia.
*"Conectamos personas, documentos y soluciones."*

| Carpeta | Contenido |
|---|---|
| `docs/ARCHITECTURE.md` | Análisis, fases, rutas, API, modelo de datos, estados, seguridad, integraciones, infraestructura |
| `docs/DESIGN_SYSTEM.md` | Color, tipografía, espaciado, iconografía, ilustración, movimiento, componentes, voz |
| `frontend/` | Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Zod |
| `backend/` | FastAPI · SQLAlchemy 2 (async) · PostgreSQL · Argon2 · JWT en cookies httpOnly |
| `design/` | Fuente SVG de la ilustración y plantilla de la vista previa |
| `design/build/nexodoc-preview.html` | Vista previa estática de la landing (se abre en cualquier navegador) |
| `tools/` | Generadores de recursos gráficos y de la vista previa |

---

## 1. Requisitos

- Node.js 20.9 o superior
- Python 3.12 o superior
- PostgreSQL 15 o superior (para el backend)

---

## 2. Frontend

```bash
cd frontend
cp .env.example .env.local      # completa NEXT_PUBLIC_SITE_URL y los datos de contacto
npm install
npm run dev                      # http://localhost:3000
```

Antes del primer despliegue:

```bash
npm run typecheck
npm run build
```

### Qué incluye

- Landing completa: navbar, hero con ilustración animada, buscador con autocompletado, catálogo de 10 categorías, cómo funciona, empresas, por qué elegir, cobertura con mapa de Colombia, preguntas frecuentes, CTA y footer.
- `/servicios` y 10 páginas `/servicios/[categoria]` generadas estáticamente, con requisitos, entidad responsable y condiciones.
- `/solicitar`: formulario en 3 pasos con validación (Zod), consentimientos Ley 1581, honeypot y estados de éxito, error y "sin backend".
- `/legal/*`: privacidad, tratamiento de datos, términos y devoluciones (**deben revisarse con un abogado**).
- `/portal/ingresar`: entrada al portal (fase 2), honesta mientras el backend no esté conectado.
- SEO: metadatos por página, `sitemap.xml`, `robots.txt`, Open Graph generado, JSON-LD (`Organization`, `WebSite`, `FAQPage`, `Service`, `BreadcrumbList`).
- Cabeceras de seguridad (CSP, HSTS, etc.) en `next.config.mjs`.

### Datos que se configuran por entorno

Correo, teléfono, WhatsApp, razón social, NIT, dirección y redes sociales se leen de `.env.local`. **Si una variable está vacía, ese dato no aparece en el sitio**: no se publican datos inventados.

### Contenido

Todo el texto comercial vive en `src/lib/data/`:

- `categories.ts` — catálogo (fuente única para landing, buscador, páginas, sitemap y JSON-LD)
- `content.ts` — hero, pasos, empresas, pilares, cifras, FAQ
- `legal.ts` — documentos legales
- `statuses.ts` — los 12 estados de una solicitud

### Despliegue

**Vercel (recomendado para empezar):** importa el repositorio, define *Root Directory* = `frontend`, agrega las variables de `.env.example` y despliega.
**Cloudflare:** usa el adaptador OpenNext para Cloudflare Workers, o pon Cloudflare como DNS + proxy delante de Vercel (modo SSL *Full (strict)*).

---

## 3. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # completa DATABASE_URL, JWT_SECRET y FIELD_ENCRYPTION_KEY
```

Cargar el catálogo desde el frontend (una sola fuente de verdad):

```bash
cd ../frontend && npx tsx scripts/export-catalog.ts > catalog.json
cd ../backend && python -m app.seed ../frontend/catalog.json
```

Ejecutar:

```bash
uvicorn app.main:app --reload    # http://localhost:8000/docs
pytest                           # máquina de estados y validación de archivos
```

Con Docker: `docker build -t nexodoc-api . && docker run --env-file .env -p 8000:8000 nexodoc-api`

En producción reemplaza `create_all` por migraciones de Alembic (`alembic init`, luego `alembic revision --autogenerate`).

### Conectar frontend y backend

En `frontend/.env.local` define `NEXODOC_API_URL=https://api.tudominio.co` y `NEXODOC_PROXY_SECRET` (el mismo valor que `PROXY_SECRET` del backend). Desde ese momento el carrito crea pedidos reales con código `ND-AAAA-NNNNNN` (cada documento: `ND-AAAA-NNNNNN-01`, `-02`…). Mientras esté vacía, el carrito informa que el envío en línea no está habilitado y no guarda nada.

### Pedidos, carrito y pagos (PSE, tarjeta, Nequi)

| Ruta | Qué hace |
|---|---|
| `/solicitar` | Más solicitados con precio "desde" + buscador de todo el catálogo |
| `/solicitar/[documento]` | Formulario propio de cada documento (registro civil, escritura, tradición, traducción, apostilla, antecedentes, Cámara de Comercio, vehículo; los demás usan uno genérico) |
| `/carrito` | Varios documentos en un pedido, datos del solicitante, dirección de entrega, consentimientos y pago |
| `/estado` | Consulta con número de pedido + correo: estado, historial, cotización y botón de pago |
| `/pago/resultado` | Regreso desde Wompi; confirma la transacción en el servidor |

**Pago en dos partes:** al enviar el pedido se paga el *valor de verificación* (si el servicio lo tiene). Cuando el gestor confirma con la entidad emite la cotización (`POST /v1/admin/requests/{código}/quote`) y el cliente paga el saldo desde `/estado`; lo pagado por verificación se descuenta. Los montos los calcula siempre el backend.

**Precios:** se configuran en `frontend/src/lib/data/pricing.ts` (**los valores actuales son de ejemplo**) y se siembran en el backend con `export-catalog.ts` + `python -m app.seed`.

**Activar Wompi** (Bancolombia; incluye PSE, tarjetas, Nequi y botón Bancolombia):

1. Crea la cuenta en Wompi y copia, en *Desarrolladores*, la llave pública, el secreto de integridad y el secreto de eventos.
2. En `backend/.env`: `WOMPI_ENABLED=true`, `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` y `PUBLIC_SITE_URL`.
3. En el panel de Wompi, URL de eventos: `https://api.tudominio.co/v1/payments/wompi/events`.
4. Prueba primero con llaves `pub_test_…` (sandbox) y luego cambia a `pub_prod_…`.

### Panel del equipo (`/admin`)

Crea la cuenta de cada gestor (la contraseña se pide por consola):

```bash
cd backend && python -m app.create_user gestor@tudominio.co --rol operator --nombre "Nombre Apellido"
```

Entra en `/admin/ingresar`. Desde el panel: buscar pedidos, ver datos del solicitante y del documento, cambiar estados (sólo los permitidos), emitir cotizaciones (IVA calculado), subir el documento final (el cliente lo descarga en `/estado`) y descargar soportes. Cada consulta de datos personales queda en auditoría.

### Avisos por correo y WhatsApp

Se envían al crear el pedido, al aprobarse un pago, al emitir la cotización y en cada cambio de estado visible. Correo con Resend (`EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`) y WhatsApp con una plantilla aprobada por Meta (`WHATSAPP_*`). Sin configurar, no se envía nada y el pedido sigue normal.

### Imágenes de marketing

- **Sitio:** ilustraciones propias por documento en `src/components/illustrations/DocIllustrations.tsx` (tarjetas de "más solicitados", páginas de solicitud y seguimiento).
- **Redes sociales:** 8 piezas PNG listas en `marketing/` (6 posts 1080×1350, 1 historia 1080×1920, 1 portada de Facebook). Se generan desde `src/lib/data/marketing.ts` y se sirven en `/marketing/<pieza>.png`; **toman los precios de `pricing.ts`**, así que después de poner tus tarifas vuelve a descargarlas del sitio compilado.

**Prueba de punta a punta de la API** (crea un PostgreSQL temporal, no necesita uno instalado):

```bash
pip install pgserver
python backend/scripts/e2e_api.py backend
```

---

## 4. Recursos gráficos

La ilustración del hero, los 10 iconos de categoría y el mapa de Colombia se generan desde una sola fuente:

```bash
python3 tools/build_assets.py     # regenera los componentes .tsx y design/build/assets.json
```

Para reconstruir la vista previa estática:

```bash
cd frontend && npx tsx scripts/export-preview.ts > ../design/build/content.json
cd .. && python3 tools/build_preview.py
```

---

## 5. Antes de publicar

- [ ] Dominio definitivo en `NEXT_PUBLIC_SITE_URL` y verificación en Google Search Console.
- [ ] Datos legales y de contacto en `.env.local`.
- [ ] Revisión de las políticas legales por un abogado.
- [ ] Inscripción de bases de datos en el RNBD de la SIC, si la empresa está obligada.
- [ ] Secretos de producción generados (nunca reutilizar los de desarrollo).
- [ ] Bucket privado (Cloudflare R2) con cifrado y sin acceso público.
- [ ] Copias de seguridad diarias de PostgreSQL verificadas con una restauración de prueba.
- [ ] Revocar `UPDATE` y `DELETE` sobre `audit_log` al usuario de base de datos de la aplicación.
- [ ] Reemplazar los precios de ejemplo de `pricing.ts` por las tarifas reales y volver a sembrar el catálogo.
- [ ] Wompi en producción (llaves `pub_prod_…`) con la URL de eventos configurada y un pago real de prueba.
- [ ] `NEXODOC_PROXY_SECRET` / `PROXY_SECRET` y `BLIND_INDEX_KEY` generados para producción.

## 6. Próximas fases

| Fase | Trabajo |
|---|---|
| 2 · Portal | Hoy el cliente consulta con número + correo (`/estado`). El registro con contraseña está deshabilitado (`410`) hasta implementar verificación de correo con enlace de un solo uso |
| 3 · Panel admin | Panel `/admin` ya disponible. Pendiente: asignar pedidos a gestores, reportes y vista de auditoría |
| 4 · Integraciones | Wompi, correo (Resend) y WhatsApp ya integrados. Pendiente: n8n, Power BI |

## 7. Página pública en GitHub Pages

Vitrina estática (sin API, panel ni pagos; los pedidos se envían por WhatsApp o correo):
**https://ingdavidortegaf-lab.github.io/nexodoc/**

Se publica desde la rama `gh-pages`. Para actualizarla después de cambiar el sitio:

```bash
cd frontend
rm -rf .next out
STATIC_EXPORT=1 BASE_PATH=/nexodoc NEXT_PUBLIC_SITE_URL=https://ingdavidortegaf-lab.github.io/nexodoc \
NEXT_PUBLIC_WHATSAPP_NUMBER=573144809244 NEXT_PUBLIC_CONTACT_EMAIL=contacto@vertextechco.online \
npx next build   # antes, mueve fuera src/app/api, src/app/admin y src/app/portal (necesitan servidor)
```

Luego sube el contenido de `frontend/out` (más un archivo vacío `.nojekyll`) a la rama `gh-pages`.

Para que se publique sola con cada cambio, da a la cuenta el permiso de flujos (`gh auth refresh -h github.com -s workflow`) y copia `docs/github-pages-workflow.yml` a `.github/workflows/pages.yml`; luego en *Settings → Pages* elige *GitHub Actions*.
