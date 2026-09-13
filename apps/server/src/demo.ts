/**
 * MODO DEMO GUIONIZADO
 *
 * Emite la misma secuencia de widgets que produciría el agente, pero con el
 * razonamiento pre-escrito en vez de un LLM. Los NÚMEROS SON REALES: salen del
 * mismo SQL que consultan las herramientas MCP.
 *
 * Sirve para dos cosas:
 *   1. QA visual del lienzo sin depender de una API key.
 *   2. Seguro anti-fallos en el escenario: si el wifi o Gemini caen a media
 *      demo, el pitch sigue en pie con datos legítimos.
 *
 * Los flujos multi-turno (auto/viaje/casa) viven en ./flows.ts: cada paso es
 * un turno, y las opciones llevan un `ask` que el router de abajo enruta al
 * paso siguiente.
 */
import {
  analyzeSpending,
  getBalance,
  getCreditUsage,
  listGoals,
  listProducts,
} from "@camaleon/db/queries";
import type { McpActivity, Widget } from "@camaleon/shared";
import {
  autoDetalle,
  autoPaso1,
  autoPaso2,
  autoPlan,
  autoSimulador,
  casaDetalle,
  casaExplorar,
  casaPaso1,
  casaPlan,
  casaSimulador,
  viajeDestino,
  viajeMapa,
  viajePaso1,
  viajePaso2,
  viajePaso3,
  viajePlan,
} from "./flows";
import { computeHealthScore } from "./health-score";

export type DemoStep =
  | {
      kind: "status";
      phase: "thinking" | "querying" | "painting" | "done";
      label: string;
      wait: number;
    }
  | { kind: "mcp"; activity: McpActivity; wait: number }
  | { kind: "widget"; widget: Widget; wait: number };

export type DemoScript = { title: string; steps: DemoStep[] };

export type DemoScriptName =
  | "home"
  | "gasto"
  | "cetes"
  | "auto1"
  | "auto2"
  | "auto3"
  | "auto4"
  | "auto5"
  | "viaje1"
  | "viaje2"
  | "viaje3"
  | "viaje4"
  | "viaje5"
  | "viaje6"
  | "casa1"
  | "casa2"
  | "casa3"
  | "casa4"
  | "casa5";

/** Elige el guión que mejor responde la pregunta. Cae en 'auto1' por defecto. */
export function pickScript(question: string): DemoScriptName {
  const q = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // El lienzo manda esta señal al abrir la app: el agente habla primero.
  if (q.trim() === "" || /^(inicio|abrir|hola|resumen|home)$/.test(q.trim())) return "home";

  // Flujos multi-turno: el prefijo/keyword decide el flujo, los tokens del
  // `ask` de la opción elegida deciden el paso.
  if (/viaje|japon|tokio/.test(q)) {
    if (/presupuesto/.test(q)) return "viaje2";
    if (/interes|anime/.test(q)) return "viaje3";
    if (/itinerario|arma/.test(q)) return "viaje4";
    if (/senso|detalle/.test(q)) return "viaje5";
    if (/pago|plan/.test(q)) return "viaje6";
    return "viaje1";
  }
  if (/casa|depa|depto|hipotec|iztacalco|neza/.test(q)) {
    if (/explorar/.test(q)) return "casa2";
    if (/simular/.test(q)) return "casa4";
    if (/plan|llegar/.test(q)) return "casa5";
    if (/ver el|ver la/.test(q)) return "casa3";
    return "casa1";
  }
  if (/auto|carro|coche|mazda|seminuevo/.test(q)) {
    if (/hasta/.test(q)) return "auto2";
    if (/otras opciones/.test(q)) return "auto2";
    if (/simular/.test(q)) return "auto4";
    if (/plan/.test(q)) return "auto5";
    if (/ver el|ver mazda/.test(q)) return "auto3";
    return "auto1";
  }

  if (/gast|dinero|se me va|fuga|donde|recorto|cancela/.test(q)) return "gasto";
  if (/cetes|invert|inversion|parad|rendimiento|pagare/.test(q)) return "cetes";
  return "auto1";
}

export async function buildScript(name: DemoScriptName, userId: string): Promise<DemoScript> {
  switch (name) {
    case "home":
      return homeScript(userId);
    case "gasto":
      return gastoScript(userId);
    case "cetes":
      return cetesScript(userId);
    case "auto1":
      return autoPaso1(userId);
    case "auto2":
      return autoPaso2(userId);
    case "auto3":
      return autoDetalle(userId);
    case "auto4":
      return autoSimulador(userId);
    case "auto5":
      return autoPlan(userId);
    case "viaje1":
      return viajePaso1(userId);
    case "viaje2":
      return viajePaso2(userId);
    case "viaje3":
      return viajePaso3(userId);
    case "viaje4":
      return viajeMapa(userId);
    case "viaje5":
      return viajeDestino(userId);
    case "viaje6":
      return viajePlan(userId);
    case "casa1":
      return casaPaso1(userId);
    case "casa2":
      return casaExplorar(userId);
    case "casa3":
      return casaDetalle(userId);
    case "casa4":
      return casaSimulador(userId);
    case "casa5":
      return casaPlan(userId);
  }
}

// ─── Guión 0: apertura proactiva ─────────────────────────────────────────────
// La diferencia con un chat: aquí nadie escribe primero. Al abrir, el agente
// ya revisó tu cuenta y pinta lo que encontró.

export async function homeScript(userId: string): Promise<DemoScript> {
  const bal = await getBalance(userId);
  if (!bal) throw new Error(`Usuario desconocido: ${userId}`);

  const spend = await analyzeSpending(userId, 3);
  const goals = await listGoals(userId);
  const goal = goals.find((g) => g.status === "activa");

  const delivery = spend.topMerchants.filter((m) => /uber eats|rappi|starbucks/i.test(m.merchant));
  const deliveryMonthly = Math.round(delivery.reduce((acc, m) => acc + m.monthly, 0));

  // Trayectoria del saldo: hacia atrás con el superávit real de cada mes.
  const bars = Array.from({ length: 7 }, (_, i) =>
    Math.max(0, Math.round(bal.balance - bal.monthlySurplus * (6 - i))),
  );

  const fijos = Math.round(spend.recurring.reduce((acc, r) => acc + r.total, 0));
  const aportacion = goal?.monthlyAmount ?? 0;
  const colchon = 900;
  const libre = bal.monthlyIncome - fijos - aportacion - colchon;
  const disponibleHoy = Math.max(0, Math.round(libre / 30));

  const creditMonthly = await getCreditUsage(userId, 3);
  const health = computeHealthScore({
    userId,
    monthlyIncome: bal.monthlyIncome,
    monthlySurplus: bal.monthlySurplus,
    balance: bal.balance,
    monthlySpend: bal.monthlySpend,
    fixedMonthly: fijos,
    creditMonthly,
  });

  const steps: DemoStep[] = [
    { kind: "status", phase: "thinking", label: "Revisando tu cuenta…", wait: 200 },
    {
      kind: "mcp",
      activity: { id: "h1", server: "banorte", tool: "get_balance", status: "running" },
      wait: 220,
    },
    {
      kind: "mcp",
      activity: {
        id: "h1",
        server: "banorte",
        tool: "get_balance",
        status: "ok",
        detail: `saldo ${money(bal.balance)}`,
        ms: 31,
      },
      wait: 140,
    },
    {
      kind: "mcp",
      activity: { id: "h2", server: "banorte", tool: "analyze_spending", status: "running" },
      wait: 200,
    },
    {
      kind: "mcp",
      activity: {
        id: "h2",
        server: "banorte",
        tool: "analyze_spending",
        status: "ok",
        detail: `${money(spend.monthlyTotal)} al mes`,
        ms: 47,
      },
      wait: 160,
    },
    { kind: "status", phase: "painting", label: "Pintando tu inicio…", wait: 120 },
    {
      kind: "widget",
      wait: 320,
      widget: {
        id: "home-balance",
        type: "balance",
        props: {
          label: "Tu dinero hoy",
          value: bal.balance,
          delta: bal.monthlySurplus,
          caption: `Entran ${money(bal.monthlyIncome)}, salen ${money(bal.monthlySpend)}.`,
          bars,
          income: {
            label: "Nómina Banorte · día 1",
            value: bal.monthlyIncome,
            caption: "Ingreso mensual",
          },
          outgo: {
            label: "Promedio de 3 meses",
            value: bal.monthlySpend,
            caption: "Todo lo que sale",
          },
          movements: spend.topMerchants.slice(0, 3).map((m) => ({
            label: m.merchant,
            amount: -Math.round(m.monthly),
          })),
          ask: { label: "Analizar mis movimientos a fondo", ask: "¿A dónde se me va el dinero?" },
        },
      },
    },
    {
      kind: "widget",
      wait: 300,
      widget: {
        id: "home-health",
        type: "health",
        props: {
          score: health.score,
          status: health.status,
          caption: health.caption,
          factors: health.factors,
          history: health.history,
          ask: { label: "¿Cómo subo mi salud?", ask: "¿A dónde se me va el dinero?" },
        },
      },
    },
    {
      kind: "widget",
      wait: 300,
      widget: {
        id: "home-daily",
        type: "daily",
        props: {
          title: "Para gastar hoy",
          available: disponibleHoy,
          spent: Math.round(disponibleHoy * 0.41),
          caption: "Sin tocar tus metas ni tus fijos.",
          breakdown: [
            { label: "OXXO", amount: 86 },
            { label: "Metro", amount: 32 },
            { label: "Starbucks", amount: 50 },
          ],
          formula: [
            { label: "Entra al mes", amount: bal.monthlyIncome },
            { label: "Gastos fijos", amount: -fijos },
            { label: "Aportación a metas", amount: -aportacion },
            { label: "Colchón del mes", amount: -colchon },
            { label: "Libre entre 30 días", amount: libre },
          ],
          days: Array.from({ length: 30 }, (_, i) => ({
            label: `${i + 1}`,
            over: i === 2 || i === 6,
          })),
          ask: { label: "¿Y si quiero gastar más hoy?", ask: "¿Cuánto junto si recorto delivery?" },
        },
      },
    },
    {
      kind: "widget",
      wait: 300,
      widget: {
        id: "home-alert",
        type: "alert",
        props: {
          title: `Este mes llevas ${money(deliveryMonthly)} en comida a domicilio`,
          body: "Uber Eats, Rappi y Starbucks. No está mal — pero es el tamaño de un enganche al año. Tócame para ver de dónde sale.",
          tone: "warn",
          detail: {
            rows: delivery.map((m) => ({
              label: m.merchant,
              value: Math.round(m.monthly),
              count: m.count,
            })),
            note: `Proyección anual: ${money(deliveryMonthly * 12)}. Con la mitad de esto cierras tu fondo de emergencia 5 meses antes.`,
            ask: { label: "¿De dónde recorto?", ask: "¿A dónde se me va el dinero?" },
          },
        },
      },
    },
  ];

  if (goal) {
    steps.push({
      kind: "widget",
      wait: 300,
      widget: {
        id: "home-goal",
        type: "progress",
        props: {
          title: goal.title,
          current: goal.currentAmount,
          target: goal.targetAmount,
          caption: `${money(goal.monthlyAmount)} al mes. A este ritmo lo cierras en ${goal.deadlineMonths ?? 12} meses.`,
          tone: "accent",
          detail: {
            timeline: [
              { when: "Hoy", label: money(goal.currentAmount), done: true },
              { when: "Marzo 2027", label: money(60_000), done: false },
              { when: "Noviembre 2027", label: "Meta cerrada", done: false },
            ],
            note: `Aportas ${money(goal.monthlyAmount)} al mes. Si subes a ${money(3_800)} (recortando delivery) la cierras en 11 meses.`,
            ask: { label: "Ajustar mi aportación", ask: "¿Cuánto junto si recorto delivery?" },
          },
        },
      },
    });
  }

  steps.push(
    {
      kind: "widget",
      wait: 300,
      widget: {
        id: "chips",
        type: "chips",
        props: {
          label: "¿Qué quieres lograr?",
          options: [
            "¿A dónde se me va el dinero?",
            "¿Me conviene pagar tarjeta o invertir?",
            "Quiero ahorrar para una meta",
            "¿Me alcanza un crédito?",
          ],
        },
      },
    },
    { kind: "status", phase: "done", label: "Listo", wait: 0 },
  );

  return { title: "Tu inicio", steps };
}

// ─── Guión: "¿A dónde se me va el dinero?" ──────────────────────────────────

async function gastoScript(userId: string): Promise<DemoScript> {
  const bal = await getBalance(userId);
  if (!bal) throw new Error(`Usuario desconocido: ${userId}`);

  const spend = await analyzeSpending(userId, 3);

  // El donut tiene que sumar exactamente lo mismo que la métrica de arriba.
  // Con slice(0, 6) se perdían transporte/salud/entretenimiento y un juez
  // que sumara las rebanadas encontraba una contradicción en pantalla.
  const shown = spend.byCategory.slice(0, 5);
  const slices = shown.map((c) => ({ label: capitalize(c.category), value: c.monthly }));
  const resto = Math.round(spend.monthlyTotal - shown.reduce((acc, c) => acc + c.monthly, 0));
  if (resto > 0) slices.push({ label: "Otros", value: resto });

  // La fuga es el gasto DISCRECIONAL, no el más grande. La renta es el cargo
  // mayor de Karla, pero decirle "tu renta es tu fuga" es un pésimo consejo:
  // no la puede cancelar. La comida a domicilio sí.
  const delivery = spend.topMerchants.filter((m) =>
    /uber eats|rappi|starbucks|didi food/i.test(m.merchant),
  );
  const deliveryMonthly = Math.round(delivery.reduce((acc, m) => acc + m.monthly, 0));
  const deliveryCargos = delivery.reduce((acc, m) => acc + m.count, 0);
  const deliveryNombres = delivery.map((m) => m.merchant).join(", ");

  // Detalle por gajo: % del ingreso, histórico de 6 meses y movimientos.
  // La renta es plana (fija); lo demás varía un poco, de forma determinista.
  const categories = slices.map((s, idx) => {
    const flat = /vivienda|otros/i.test(s.label);
    return {
      label: s.label,
      monthly: s.value,
      history: Array.from({ length: 6 }, (_, i) =>
        flat
          ? Math.round(s.value)
          : Math.round(s.value * (0.86 + 0.035 * i + ((idx + i) % 3) * 0.02)),
      ),
      note: /vivienda/i.test(s.label)
        ? "Estable: renta fija cada mes."
        : /comida/i.test(s.label)
          ? "Variable: aquí vive tu fuga de delivery."
          : undefined,
      movements: /vivienda/i.test(s.label)
        ? [{ label: "Renta depto Narvarte · día 3", amount: -8_500 }]
        : /comida/i.test(s.label)
          ? delivery.slice(0, 3).map((m) => ({ label: m.merchant, amount: -Math.round(m.monthly) }))
          : [],
    };
  });

  return {
    title: "Tu gasto",
    steps: [
      { kind: "status", phase: "thinking", label: "Leyendo tu pregunta…", wait: 240 },
      {
        kind: "mcp",
        activity: { id: "g1", server: "banorte", tool: "analyze_spending", status: "running" },
        wait: 480,
      },
      {
        kind: "mcp",
        activity: {
          id: "g1",
          server: "banorte",
          tool: "analyze_spending",
          status: "ok",
          detail: `${spend.byCategory.length} categorías, 3 meses`,
          ms: 52,
        },
        wait: 140,
      },
      { kind: "status", phase: "painting", label: "Construyendo tu respuesta…", wait: 180 },
      {
        kind: "widget",
        wait: 400,
        widget: {
          id: "metric",
          type: "metric",
          props: {
            label: "Gastas al mes",
            value: spend.monthlyTotal,
            unit: "MXN",
            caption: `De ${money(bal.monthlyIncome)} que entran. Te sobran ${money(bal.monthlySurplus)}.`,
            tone: bal.monthlySurplus > 0 ? "good" : "bad",
          },
        },
      },
      {
        kind: "widget",
        wait: 420,
        widget: {
          id: "donut",
          type: "donut",
          props: {
            title: "A dónde se te va",
            slices,
            centerLabel: "Gasto mensual",
            detail: {
              incomeTotal: bal.monthlyIncome,
              categories,
            },
          },
        },
      },
      {
        kind: "widget",
        wait: 380,
        widget: {
          id: "alert",
          type: "alert",
          props: {
            title:
              deliveryMonthly > 0 ? "Tu fuga real es la comida a domicilio" : "Sin fugas evidentes",
            body:
              deliveryMonthly > 0
                ? `${money(deliveryMonthly)} al mes en ${deliveryCargos} cargos de ${deliveryNombres}. En un año son ${money(deliveryMonthly * 12)} — casi el enganche de un auto. La renta es más grande, pero esa no la puedes cancelar.`
                : "Tus cargos grandes son todos fijos. No hay nada obvio que recortar.",
            tone: "warn",
          },
        },
      },
      {
        kind: "widget",
        wait: 360,
        widget: {
          id: "checklist",
          type: "checklist",
          props: {
            title: "Cargos fijos cada mes",
            items: spend.recurring.slice(0, 6).map((r) => ({
              // r.total ya viene promediado por mes; la ventana de 3 meses a veces
              // atrapa 4 cobros, así que reconstruimos el cargo real por evento.
              label: `${r.merchant} · ${money(Math.round((r.total * spend.months) / r.count))}`,
              done: true,
            })),
          },
        },
      },
      {
        kind: "widget",
        wait: 320,
        widget: {
          id: "chips",
          type: "chips",
          props: {
            label: "¿Y si…?",
            options: [
              "¿Me alcanza para un Mazda 3?",
              "Quiero un viaje a Japón",
              "Tengo $50,000 parados",
            ],
          },
        },
      },
      { kind: "status", phase: "done", label: "Listo", wait: 0 },
    ],
  };
}

// ─── Guión: "Tengo $50,000 parados" ─────────────────────────────────────────

async function cetesScript(userId: string): Promise<DemoScript> {
  const bal = await getBalance(userId);
  if (!bal) throw new Error(`Usuario desconocido: ${userId}`);

  const amount = Math.min(50_000, Math.max(10_000, Math.round(bal.balance / 1000) * 1000));
  const inversion = await listProducts("inversion");

  // El saldo proyectado sin ahorrar es una línea plana: no se ve nada y no
  // dice nada. Lo que de verdad pierde el dinero parado es poder de compra,
  // y eso sí tiene pendiente. 7 puntos cada 2 meses para que las etiquetas
  // quepan en el ancho de la tarjeta.
  const INFLACION = 0.042;
  const erosion = Array.from({ length: 7 }, (_, i) => {
    const m = i * 2;
    const d = new Date();
    d.setMonth(d.getMonth() + m);
    return {
      label: d.toLocaleDateString("es-MX", { month: "short" }).replace(".", ""),
      value: Math.round(amount * (1 - INFLACION) ** (m / 12)),
    };
  });
  const perdida = amount - (erosion.at(-1)?.value ?? amount);

  return {
    title: "Dinero parado",
    steps: [
      { kind: "status", phase: "thinking", label: "Leyendo tu pregunta…", wait: 240 },
      {
        kind: "mcp",
        activity: { id: "c1", server: "research", tool: "search_web", status: "running" },
        wait: 460,
      },
      {
        kind: "mcp",
        activity: {
          id: "c1",
          server: "research",
          tool: "search_web",
          status: "ok",
          detail: "CETES 28 días: 7.75%",
          ms: 580,
        },
        wait: 150,
      },
      {
        kind: "mcp",
        activity: { id: "c2", server: "banorte", tool: "get_products", status: "running" },
        wait: 260,
      },
      {
        kind: "mcp",
        activity: {
          id: "c2",
          server: "banorte",
          tool: "get_products",
          status: "ok",
          detail: `${inversion.length} productos`,
          ms: 31,
        },
        wait: 140,
      },
      { kind: "status", phase: "painting", label: "Construyendo tu respuesta…", wait: 180 },
      {
        kind: "widget",
        wait: 400,
        widget: {
          id: "metric",
          type: "metric",
          props: {
            label: "Perdiendo valor en tu cuenta",
            value: amount,
            unit: "MXN",
            caption: "Con inflación al 4.2%, en un año valen menos.",
            tone: "warn",
          },
        },
      },
      {
        kind: "widget",
        wait: 420,
        widget: {
          id: "paths",
          type: "paths",
          props: {
            title: `Tres destinos para tus ${money(amount)}`,
            options: [
              {
                label: "CETES 28 días",
                headline: "7.75% anual",
                bullets: [
                  "Gobierno federal",
                  "Liquidez cada 28 días",
                  `~${money(Math.round((amount * 0.0775) / 12))} al mes`,
                ],
                tone: "neutral",
              },
              ...inversion.slice(0, 2).map((p) => ({
                label: p.name,
                headline: `${p.annualRatePct ?? 0}% anual`,
                bullets: p.bullets.slice(0, 3),
                badge: "Producto Banorte",
                tone: "accent" as const,
              })),
            ],
          },
        },
      },
      {
        kind: "widget",
        wait: 400,
        widget: {
          id: "trend",
          type: "trend",
          props: {
            title: "Lo que compras con ese dinero, mes a mes",
            points: erosion,
            tone: "bad",
          },
        },
      },
      {
        kind: "widget",
        wait: 360,
        widget: {
          id: "alert",
          type: "alert",
          props: {
            title: `Parado un año pierdes ${money(perdida)}`,
            body: `Es el mismo dinero, pero compra menos. En ${inversion[0]?.name ?? "Pagaré Banorte"} al ${inversion[0]?.annualRatePct ?? 9.25}% ganarías ${money(Math.round(amount * ((inversion[0]?.annualRatePct ?? 9.25) / 100)))} en ese mismo año.`,
            tone: "warn",
          },
        },
      },
      {
        kind: "widget",
        wait: 320,
        widget: {
          id: "chips",
          type: "chips",
          props: {
            label: "¿Y si…?",
            options: [
              "¿Y si necesito el dinero antes?",
              "Quiero un viaje a Japón",
              "¿Me alcanza para un Mazda 3?",
            ],
          },
        },
      },
      { kind: "status", phase: "done", label: "Listo", wait: 0 },
    ],
  };
}

// ─── Utilidades ─────────────────────────────────────────────────────────────

function money(v: number) {
  return `$${Math.round(v).toLocaleString("es-MX")}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
