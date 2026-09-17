# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Clientes Banorte en México que toman decisiones de dinero desde el teléfono, en
situaciones concretas: "¿a dónde se me va el dinero?", "¿me alcanza para un
auto / un viaje / una casa?", "¿pago la tarjeta o invierto en CETES?".

Dos personas demo (seed determinista en `packages/db/src/seed.ts`):

- **Karla** — CDMX (Narvarte). Nómina Banorte de $28,400/mes; renta $8,500,
  servicios y suscripciones; sobrante ~$7,400. Fugas: comida a domicilio
  (~$3,000/mes) y gasto discrecional.
- **Roberto** — Xalapa. Pensión IMSS $9,800 + renta de un local $6,500.
  Márgenes más apretados; gasto cotidiano alto (gasolina, salud, alimentos).

Audiencia inmediata de evaluación: jurado y ejecutivos en un **pitch/demo en
vivo** (hackathon o concurso). El producto debe convencer en los primeros
segundos y sostener la credibilidad de banca durante toda la demo.

## Product Purpose

Camaleón es un **asesor financiero de UI generativa**: no responde con texto,
responde **construyendo la pantalla que la persona necesita** con su dinero
real. Cada pregunta dispara un flujo agente → herramientas MCP → widgets
pintados en secuencia (stream SSE) que se animan al llegar. El lienzo se
reconstruye pregunta a pregunta; nunca mezcla respuestas.

Éxito: la persona entiende su situación y decide con datos reales sin leer
párrafos; la banca se siente como un asesor que arma la pantalla, no como un
chatbot.

## Positioning

"Un asesor que no te da pantallas: te arma la que necesitas, con tu dinero
real." Mecanismo que un chatbot bancario no puede copiar: la interfaz **es** la
respuesta. Datos del cliente (MCP Banorte) + datos del mundo (MCP research con
búsqueda web) combinados en widgets, siempre con un producto Banorte **y**
alternativas honestas; nunca empuja a ciegas.

## Operating Context

- Móvil-first (PWA instalable, `viewport-fit=cover`, teclado que redimensiona
  el viewport). En escritorio se presenta como hoja de teléfono sobre una mesa;
  en pantallas anchas hay un riel con marca y actividad MCP visible.
- Cuatro pestañas: **Inicio** (saldo, salud financiera, para gastar hoy;
  cargado de BD sin LLM), **Asesor** (el lienzo generativo en vivo), **Metas**
  (metas de ahorro creadas por el agente vía `create_savings_goal`, con
  progreso y detalle) e **Historial** (conversaciones previas; tocar una
  repinta ese lienzo y permite encadenar preguntas).
- Flujos guiados de decisión grande (auto, viaje, casa, inversión/deuda):
  entrevista de máximo 3 pasos con `question` de opciones concretas y luego un
  plan completo de 5–7 widgets. Preguntas puntuales: respuesta directa sin
  entrevista.
- Actividad MCP visible como evidencia de trabajo real (`get_balance`,
  `analyze_spending`, `search_web`…), con tiempos en ms.
- Demo con datos deterministas (6 meses de transacciones por persona); en
  producción, APIs de Banorte y búsqueda web (Tavily) con caché de respaldo.

## Capabilities and Constraints

- Catálogo de 23 widgets (`apps/server/src/widgets.ts`, `packages/shared`):
  planificación (`question`, `listing`, `destination`, `mapa`, `simulator`),
  decisión (`paths`, `gap`, `plan`, `timeline`), insight (`donut`, `trend`,
  `alert`, `product`), inicio (`balance`, `health`, `daily`), cierre (`chips`,
  siempre al final), y básicos (`metric`, `text`, `progress`, `checklist`,
  `actionCard`).
- Presupuesto por respuesta: 3–6 widgets. Un turno = una pregunta.
- Herramientas MCP Banorte: `get_balance`, `get_transactions`,
  `analyze_spending`, `project_cashflow`, `simulate_loan`, `get_products`,
  `get_goals`. Research: `search_web`, `fetch_page`.
- Locale: español de México únicamente. Moneda MXN con formato `$12,345.00`
  (`canvas/format.ts`). Cifras siempre tabulares.
- Principio de verdad: nunca inventar precios ni tasas; provienen de
  herramientas.
- Stack fijo: React + Vite + MUI + Zustand + Motion (framer-motion) en
  `apps/web`; Hono + Vercel AI en `apps/server`; SQLite + Drizzle.
- Sin modo oscuro de sistema (tema único claro con superficies de tinta
  deliberadas).

## Brand Commitments

- **Identidad Banorte oficial, vinculante.** Camaleón es un producto Banorte:
  rojo institucional como color de marca, tono de banca seria y contemporánea,
  y el logotipo `apps/web/public/logo.png` debe aparecer.
- Nombre del producto: **Camaleón**. Subtítulo de cuenta: "Cuenta Banorte".
- Voz del agente: asesor Banorte directo, sin jerga ("te faltan $12,400", no
  "diferencial patrimonial"), español mexicano conversacional, nunca juzga el
  gasto, cierra con una frase corta o guarda silencio porque el lienzo habla.
- Iconografía: `lucide-react`. Tipografía actual: Plus Jakarta Sans (Google
  Fonts). No es un compromiso vinculante; puede cambiar en un rediseño.

## Evidence on Hand

- Datos demo deterministas para Karla y Roberto (saldos, movimientos por
  categoría, metas) en `packages/db`.
- Log de herramientas MCP real durante cada turno (nombres, argumentos,
  resultados, latencia).
- Logotipo: `apps/web/public/logo.png`. Archivo de diseño de referencia:
  `figma.fig` en la raíz.
- **No hay** testimonios, cifras de adopción, prensa ni clientes reales:
  ningún diseño debe fabricarlos.

## Product Principles

1. **La interfaz es la respuesta.** Cada turno produce una pantalla legible de
   un vistazo; el texto es apoyo, nunca el vehículo.
2. **Una cifra protagonista, un dato de apoyo, una acción.** Composición de
   todo widget y de toda meta.
3. **Banca seria que impresiona.** La ambición visual y el movimiento nunca
   restan credibilidad: todo lo espectacular debe explicarse como claridad,
   jerarquía o evidencia de trabajo real.
4. **Datos reales, opciones honestas.** Siempre un producto Banorte y
   alternativas comparables; nunca inventar números.
5. **Nada aparece de golpe, nada estorba.** El movimiento narra la llegada de
   información y se apaga con `prefers-reduced-motion`.

## Accessibility & Inclusion

- Objetivos táctiles ≥44px; contraste AA en texto pequeño; foco visible.
- `prefers-reduced-motion` respetado en toda animación.
- Safe areas (notch, home indicator) y teclado que no cubre la barra de
  comando.
- Personas mayores (Roberto, pensionado): cifras grandes, lenguaje llano,
  un solo scroller.
