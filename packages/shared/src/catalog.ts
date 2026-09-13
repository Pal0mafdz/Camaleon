import { z } from "zod";

/**
 * CATÁLOGO CAMALEÓN
 *
 * Cada widget es un esquema PLANO (sin uniones ni recursión) porque cada uno se
 * expone al modelo como una herramienta independiente. Eso lo hace fiable con
 * cualquier proveedor (Gemini incluido) y hace que el stream llegue widget por
 * widget, listo para animarse de entrada.
 *
 * El agente NUNCA elige colores, tipografías ni tamaños: solo datos y semántica.
 */

const id = z
  .string()
  .optional()
  .describe("Id estable del widget. Reutiliza el mismo id para ACTUALIZAR un widget ya pintado.");

const tone = z
  .enum(["neutral", "good", "warn", "bad", "accent"])
  .default("neutral")
  .describe("Semántica de color. El tema decide el color real.");

const money = z.number().describe("Monto en pesos mexicanos, sin símbolo ni separadores.");

/** Acción ejecutable: dispara una herramienta MCP tras confirmación del usuario. */
const action = z
  .object({
    label: z.string().describe("Texto del botón, en imperativo. Ej: 'Crear mi apartado'"),
    tool: z.string().describe("Nombre de la herramienta MCP a ejecutar."),
    args: z.record(z.string(), z.unknown()).describe("Argumentos para la herramienta."),
    confirm: z.string().describe("Pregunta de confirmación antes de ejecutar."),
  })
  .optional()
  .describe("Acción real sobre la cuenta. El agente propone, el cliente dispone.");

/** Botón que reenvía una pregunta al agente (dispara un turno nuevo del lienzo). */
const ask = z
  .object({
    label: z.string().describe("Texto del botón. Ej: 'Analizar mis movimientos a fondo'."),
    ask: z.string().describe("Pregunta que se reenvía al agente al tocarlo."),
  })
  .optional()
  .describe("Botón que dispara un turno nuevo del agente.");

// ─── Widgets ────────────────────────────────────────────────────────────────

export const heroSchema = z.object({
  id,
  title: z.string().describe("Palabra grande recortada abajo. Ej: 'Japón', 'Mazda 3'."),
  pill: z.string().describe("Etiqueta corta arriba a la izquierda. Ej: '3 rutas posibles'."),
  imageQuery: z
    .string()
    .describe("Tema visual en inglés para la imagen de fondo. Ej: 'tokyo street night'."),
});

export const metricSchema = z.object({
  id,
  label: z.string().describe("Qué representa el número. Ej: 'Disponible hoy'."),
  value: money,
  unit: z.enum(["MXN", "pct", "months", "count"]).default("MXN"),
  delta: z.number().optional().describe("Cambio vs periodo anterior, en la misma unidad."),
  caption: z
    .string()
    .optional()
    .describe("Una línea de contexto. Ej: 'vs. $24,100 el mes pasado'."),
  tone,
});

export const gapSchema = z.object({
  id,
  title: z.string().describe("Ej: 'Te faltan para el enganche'."),
  target: money.describe("Monto objetivo."),
  current: money.describe("Monto con el que ya cuenta el usuario."),
  deadlineMonths: z.number().optional().describe("Meses disponibles para cerrar la brecha."),
  caption: z.string().optional(),
});

export const pathsSchema = z.object({
  id,
  title: z.string().describe("Ej: 'Tres caminos para lograrlo'."),
  options: z
    .array(
      z.object({
        label: z.string().describe("Nombre corto del camino. Ej: 'Ahorrar 8 meses'."),
        headline: z.string().describe("El dato que decide. Ej: '$6,250 al mes'."),
        bullets: z.array(z.string()).max(3).describe("Máximo 3 implicaciones concretas."),
        badge: z.string().optional().describe("Ej: 'Recomendado', 'Producto Banorte'."),
        tone,
      }),
    )
    .min(2)
    .max(4),
});

export const simulatorSchema = z.object({
  id,
  title: z.string().describe("Ej: 'Ajusta tu enganche'."),
  price: money.describe("Precio total del bien."),
  downPaymentMin: money,
  downPaymentMax: money,
  downPaymentInitial: money,
  termOptions: z.array(z.number()).describe("Plazos en meses. Ej: [24, 36, 48, 60]."),
  termInitial: z.number().describe("Plazo preseleccionado, en meses."),
  annualRatePct: z.number().describe("Tasa anual en porcentaje. Ej: 13.9"),
  action,
});

export const donutSchema = z.object({
  id,
  title: z.string().describe("Ej: 'A dónde se te va el dinero'."),
  slices: z
    .array(z.object({ label: z.string(), value: money }))
    .min(2)
    .max(7),
  centerLabel: z.string().optional().describe("Texto en el centro. Ej: 'Gasto mensual'."),
  detail: z
    .object({
      incomeTotal: money.describe("Ingreso mensual, para calcular % de lo que entra."),
      categories: z.array(
        z.object({
          label: z.string().describe("Debe coincidir con el label de un gajo."),
          monthly: money,
          history: z.array(money).min(2).max(6).describe("Gasto de la categoría, meses recientes."),
          note: z.string().optional().describe("Ej: 'Estable: $8,500 fijos (renta)'."),
          movements: z.array(z.object({ label: z.string(), amount: money })).max(4),
        }),
      ),
    })
    .optional()
    .describe("Detalle por gajo: al tocarlo se expande con % del ingreso e histórico."),
});

export const trendSchema = z.object({
  id,
  title: z.string(),
  points: z
    .array(z.object({ label: z.string().describe("Ej: 'Mar'"), value: money }))
    .min(2)
    .describe("Serie temporal ordenada de más antigua a más reciente."),
  tone,
});

export const timelineSchema = z.object({
  id,
  title: z.string(),
  steps: z
    .array(
      z.object({
        when: z.string().describe("Ej: 'Mes 3', 'Abril 2027'."),
        label: z.string(),
        detail: z.string().optional(),
        done: z.boolean().default(false),
      }),
    )
    .min(2)
    .max(6),
});

export const checklistSchema = z.object({
  id,
  title: z.string(),
  items: z.array(z.object({ label: z.string(), done: z.boolean().default(false) })).max(6),
});

export const chipsSchema = z.object({
  id,
  label: z.string().optional().describe("Ej: '¿Y si...?'"),
  options: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe("Preguntas de seguimiento cortas. Al tocarlas se reenvían al agente."),
});

export const actionCardSchema = z.object({
  id,
  title: z.string().describe("Ej: 'Crear apartado Japón'."),
  summary: z.string().describe("Qué va a pasar exactamente, en una línea."),
  action: z.object({
    label: z.string(),
    tool: z.string(),
    args: z.record(z.string(), z.unknown()),
    confirm: z.string(),
  }),
});

export const alertSchema = z.object({
  id,
  title: z.string(),
  body: z.string(),
  tone,
  detail: z
    .object({
      rows: z
        .array(z.object({ label: z.string(), value: money, count: z.number().optional() }))
        .max(5)
        .describe("Desglose del insight. Ej: Uber Eats $1,714 · 15 cargos."),
      note: z.string().optional().describe("Proyección o consecuencia. Ej: 'Al año son $38,388'."),
      ask,
    })
    .optional()
    .describe("Detalle expandible al tocar el aviso."),
});

export const productSchema = z.object({
  id,
  name: z.string().describe("Nombre del producto Banorte."),
  headline: z.string().describe("El número que importa. Ej: 'CAT 16.2%'."),
  bullets: z.array(z.string()).max(3),
  action,
});

export const progressSchema = z.object({
  id,
  title: z.string(),
  current: money,
  target: money,
  caption: z.string().optional(),
  tone,
  detail: z
    .object({
      timeline: z
        .array(z.object({ when: z.string(), label: z.string(), done: z.boolean().default(false) }))
        .min(2)
        .max(4),
      note: z.string().optional().describe("Ej: 'Si subes a $3,800 la cierras en 11 meses'."),
      ask,
    })
    .optional()
    .describe("Detalle expandible: el camino mes a mes hacia la meta."),
});

export const textSchema = z.object({
  id,
  body: z.string().describe("Narración breve del agente. Máximo 2 frases."),
});

// ─── Widgets de inicio (expandibles) ────────────────────────────────────────

export const balanceSchema = z.object({
  id,
  label: z.string().describe("Ej: 'Tu dinero hoy'."),
  value: money.describe("Saldo actual."),
  delta: z.number().optional().describe("Superávit mensual. Ej: 4788."),
  caption: z.string().optional().describe("Ej: 'Entran $28,400, salen $23,612'."),
  bars: z.array(money).min(3).max(12).describe("Serie corta de saldo/gasto para la mini-gráfica."),
  income: z.object({ label: z.string(), value: money, caption: z.string().optional() }),
  outgo: z.object({ label: z.string(), value: money, caption: z.string().optional() }),
  movements: z
    .array(z.object({ label: z.string(), amount: money }))
    .max(4)
    .describe("Movimientos grandes del mes (montos negativos = gasto)."),
  ask,
});

export const healthSchema = z.object({
  id,
  score: z.number().min(0).max(100),
  status: z.string().describe("Ej: 'Sólida'."),
  caption: z.string().optional().describe("Ej: '+6 puntos desde julio'."),
  factors: z
    .array(
      z.object({
        label: z.string().describe("Ej: 'Superávit'."),
        status: z.string().describe("Ej: 'Fuerte', 'A medias'."),
        pct: z.number().min(0).max(100).describe("Qué tan bien está el factor, 0-100."),
        tone,
      }),
    )
    .max(4),
  history: z.array(z.number()).max(6).optional().describe("Score de meses recientes."),
  ask,
});

export const dailySchema = z.object({
  id,
  title: z.string().describe("Ej: 'Para gastar hoy'."),
  available: money.describe("Monto libre por día."),
  spent: money.describe("Lo que lleva gastado hoy."),
  caption: z.string().optional().describe("Ej: 'Sin tocar tus metas'."),
  breakdown: z
    .array(z.object({ label: z.string(), amount: money }))
    .max(5)
    .describe("Gastos de hoy. Ej: OXXO $86."),
  formula: z
    .array(z.object({ label: z.string(), amount: money }))
    .max(5)
    .optional()
    .describe("De dónde sale el número: entra X − fijos − aportación − colchón."),
  days: z
    .array(z.object({ label: z.string(), over: z.boolean().default(false) }))
    .max(31)
    .optional()
    .describe("Mini calendario del mes: over=true si se pasó ese día."),
  ask,
});

// ─── Widgets de flujo (una decisión por pantalla) ───────────────────────────

export const questionSchema = z.object({
  id,
  title: z.string().describe("La pregunta grande. Ej: '¿Cuánto al mes te acomoda?'."),
  subtitle: z.string().optional(),
  step: z.number().optional().describe("Paso actual del flujo."),
  stepTotal: z.number().optional(),
  options: z
    .array(
      z.object({
        label: z.string().describe("Ej: 'Hasta $8,000'."),
        sublabel: z.string().optional(),
        badge: z.string().optional().describe("Ej: 'Cabe si recortas delivery'."),
        tone,
        selected: z.boolean().default(false),
        ask: z.string().describe("Pregunta que se reenvía al agente al elegir esta opción."),
      }),
    )
    .min(2)
    .max(6),
  note: z.string().optional().describe("Dato Banorte de contexto al pie."),
});

export const listingSchema = z.object({
  id,
  title: z.string().optional().describe("Ej: 'Estos sí van contigo'."),
  items: z
    .array(
      z.object({
        title: z.string().describe("Ej: 'Mazda 3 2022 seminuevo'."),
        subtitle: z.string().optional().describe("Ej: '34,000 km · Iztacalco 58m²'."),
        price: money,
        monthly: money.optional().describe("Mensualidad estimada."),
        tag: z.string().optional().describe("Ej: 'Dentro de tu alcance'."),
        tone,
        imageQuery: z.string().optional().describe("Tema visual en inglés."),
        ask: z.string().optional().describe("Pregunta al agente al tocar la tarjeta."),
      }),
    )
    .min(1)
    .max(4),
});

export const mapaSchema = z.object({
  id,
  title: z.string().describe("Ej: 'Japón clásico · 12 días'."),
  stops: z
    .array(
      z.object({
        n: z.number(),
        label: z.string(),
        sublabel: z.string().optional(),
        lat: z.number().describe("Latitud real del lugar."),
        lng: z.number().describe("Longitud real del lugar."),
      }),
    )
    .min(1)
    .max(5)
    .describe("Paradas numeradas de la ruta, en orden, con coordenadas reales. Ej: 1 Tokio · 5 días."),
  card: z
    .object({
      kicker: z.string().describe("Ej: 'DÍA 1 · TOKIO'."),
      title: z.string().describe("Ej: 'Senso-ji'."),
      rating: z.string().optional().describe("Ej: '★ 4.7'."),
      body: z.string(),
      meta: z.string().optional().describe("Ej: 'Gratis · 2h'."),
      ask: z.string().optional(),
    })
    .describe("Tarjeta del lugar destacado, anclada abajo."),
  ask,
});

export const destinationSchema = z.object({
  id,
  kicker: z.string().optional().describe("Ej: 'DÍA 1 · TOKIO'."),
  title: z.string().describe("Ej: 'Senso-ji', 'Mazda 3 2022'."),
  imageQuery: z.string().describe("Tema visual en inglés para el hero."),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).max(3),
  sections: z
    .array(z.object({ title: z.string(), body: z.string() }))
    .max(3)
    .describe("Bloques de detalle. Ej: 'Por qué te lo propongo'."),
  plan: z
    .object({
      label: z.string().describe("Ej: 'Tu plan con Banorte'."),
      value: z.string().describe("Ej: '$7,412/mes · 48 meses · 13.9%'."),
      badge: z.string().optional().describe("Ej: 'Cabe ✓'."),
      note: z.string().optional().describe("Ej: 'Con nómina Banorte: 11.5% → $7,000/mes'."),
    })
    .optional(),
  ask,
});

export const planSchema = z.object({
  id,
  title: z.string().describe("Ej: 'Cómo lo pagas'."),
  target: money,
  current: money,
  caption: z.string().optional().describe("Ej: 'Faltan $24,160 para el enganche'."),
  options: z
    .array(
      z.object({
        label: z.string().describe("Ej: 'Con tu superávit'."),
        sublabel: z.string().describe("Ej: '$4,788/mes → 5 meses'."),
        badge: z.string().optional(),
        tone,
      }),
    )
    .min(2)
    .max(3)
    .describe("Ritmos comparables para llegar. Incluye siempre uno con producto Banorte."),
  timeline: z
    .array(z.object({ when: z.string(), label: z.string() }))
    .max(4)
    .optional(),
  action,
});

// ─── Registro ───────────────────────────────────────────────────────────────

export const widgetSchemas = {
  hero: heroSchema,
  metric: metricSchema,
  gap: gapSchema,
  paths: pathsSchema,
  simulator: simulatorSchema,
  donut: donutSchema,
  trend: trendSchema,
  timeline: timelineSchema,
  checklist: checklistSchema,
  chips: chipsSchema,
  actionCard: actionCardSchema,
  alert: alertSchema,
  product: productSchema,
  progress: progressSchema,
  text: textSchema,
  balance: balanceSchema,
  health: healthSchema,
  daily: dailySchema,
  question: questionSchema,
  listing: listingSchema,
  mapa: mapaSchema,
  destination: destinationSchema,
  plan: planSchema,
} as const;

export type WidgetType = keyof typeof widgetSchemas;

export const widgetDescriptions: Record<WidgetType, string> = {
  hero: "Portada con imagen a sangre y una palabra gigante. Úsala UNA vez, al inicio, para nombrar el objetivo.",
  metric: "Un número grande con etiqueta. Para saldos, promedios, totales.",
  gap: "La brecha entre lo que hay y lo que se necesita. El widget que responde '¿me alcanza?'.",
  paths: "2 a 4 caminos comparables para lograr un objetivo. Incluye siempre una opción Banorte.",
  simulator:
    "Simulador interactivo enganche ↔ mensualidad. Se recalcula en el teléfono, sin volver a preguntarte.",
  donut: "Distribución de gasto por categoría.",
  trend: "Serie temporal: saldo, gasto o ahorro mes a mes.",
  timeline: "Los pasos en el tiempo para llegar a la meta.",
  checklist: "Requisitos o pendientes marcables.",
  chips: "Preguntas de seguimiento de un toque. Cierra SIEMPRE con este widget.",
  actionCard: "Tarjeta de confirmación para ejecutar algo real en la cuenta.",
  alert: "Aviso o insight que el usuario no pidió pero necesita saber.",
  product: "Producto Banorte relevante, presentado por su beneficio, no por su nombre.",
  progress: "Avance hacia una meta ya creada.",
  text: "Una o dos frases de narración. Úsalo con moderación: el lienzo habla por sí solo.",
  balance:
    "Saldo protagonista con mini-gráfica. Úsalo UNA vez, en el inicio. Al tocarlo se expande con entradas/salidas y movimientos grandes.",
  health: "Salud financiera 0-100 con sus factores. Solo para el inicio. Al tocarlo se expande.",
  daily: "Cuánto puede gastar hoy sin tocar sus metas. Solo para el inicio. Al tocarlo se expande.",
  question:
    "Una decisión por pantalla con tarjetas grandes. Para flujos guiados (viaje, auto, casa). Cada opción reenvía una pregunta al agente.",
  listing:
    "Tarjetas de producto comparables (autos, propiedades) con precio, mensualidad y si caben en el presupuesto.",
  mapa: "Ruta de viaje con paradas numeradas y una tarjeta de lugar destacado.",
  destination:
    "Detalle de un lugar, auto o propiedad: hero con foto, stats, por qué se propone y el plan Banorte.",
  plan: "Cómo pagar la meta: avance, ritmos comparables y acción para crear el apartado.",
};

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type WidgetProps = {
  [K in WidgetType]: z.infer<(typeof widgetSchemas)[K]>;
};

export type Widget = {
  [K in WidgetType]: { id: string; type: K; props: WidgetProps[K] };
}[WidgetType];

export type Tone = z.infer<typeof tone>;
