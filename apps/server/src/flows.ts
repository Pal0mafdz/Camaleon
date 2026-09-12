/**
 * FLUJOS MULTI-TURNO: auto (estilo Kavak), viaje (estilo Roamy) y casa
 * (estilo Zillow). Cada paso es un turno del agente: una decisión por
 * pantalla, y cada opción lleva un `ask` que dispara el siguiente turno.
 * Los números salen del mismo SQL que consultan las tools MCP.
 */
import { getBalance, listProducts } from "@camaleon/db/queries";
import type { Widget } from "@camaleon/shared";
import type { DemoScript, DemoStep } from "./demo";

// ─── Utilidades compartidas ──────────────────────────────────────────────────

function payment(principal: number, annualRatePct: number, months: number) {
  const i = annualRatePct / 100 / 12;
  if (i === 0) return Math.round(principal / months);
  return Math.round((principal * i) / (1 - (1 + i) ** -months));
}

function money(v: number) {
  return `$${Math.round(v).toLocaleString("es-MX")}`;
}

function status(label: string, wait = 220): DemoStep {
  return { kind: "status", phase: "thinking", label, wait };
}

function mcp(
  id: string,
  server: "banorte" | "research",
  tool: string,
  detail: string,
  ms: number,
): DemoStep[] {
  return [
    { kind: "mcp", activity: { id, server, tool, status: "running" }, wait: 260 },
    { kind: "mcp", activity: { id, server, tool, status: "ok", detail, ms }, wait: 140 },
  ];
}

function widget(w: Widget, wait = 380): DemoStep {
  return { kind: "widget", widget: w, wait };
}

function done(): DemoStep {
  return { kind: "status", phase: "done", label: "Listo", wait: 0 };
}

function chips(id: string, options: string[], label = "¿Y si…?"): DemoStep {
  return widget({ id, type: "chips", props: { label, options } }, 300);
}

async function balanceOf(userId: string) {
  const bal = await getBalance(userId);
  if (!bal) throw new Error(`Usuario desconocido: ${userId}`);
  return bal;
}

// ═══ FLUJO AUTO (estilo Kavak) ═══════════════════════════════════════════════

const AUTOS = [
  { title: "Mazda 3 2022", subtitle: "Seminuevo · 34,000 km", price: 339_900 },
  { title: "Mazda 2 2025", subtitle: "Nuevo · versión i Touring", price: 299_900 },
  { title: "Mazda 3 2025", subtitle: "Nuevo · el que preguntaste", price: 459_900 },
] as const;

export async function autoPaso1(userId: string): Promise<DemoScript> {
  const bal = await balanceOf(userId);
  const delivery = 3_199; // recorte discrecional detectado en analyze_spending
  return {
    title: "Auto · mensualidad",
    steps: [
      status("Antes de enseñarte autos, una pregunta…"),
      ...mcp("a1", "banorte", "get_balance", `superávit ${money(bal.monthlySurplus)}/mes`, 34),
      widget({
        id: "auto-q1",
        type: "question",
        props: {
          title: "¿Cuánto al mes te acomoda?",
          subtitle: "Con esto filtro qué autos sí van contigo.",
          step: 1,
          stepTotal: 3,
          options: [
            {
              label: `Hasta ${money(4_500)}`,
              sublabel: "Dentro de tu superávit actual",
              badge: "Cabe hoy",
              tone: "good",
              selected: false,
              ask: "Auto: hasta $4,500 al mes",
            },
            {
              label: `Hasta ${money(8_000)}`,
              sublabel: `Tu superávit ${money(bal.monthlySurplus)} + recorte de delivery ${money(delivery)}`,
              badge: "Cabe si recortas delivery",
              tone: "accent",
              selected: true,
              ask: "Auto: hasta $8,000 al mes",
            },
            {
              label: `${money(10_036)} · Mazda 3 nuevo`,
              sublabel: "La mensualidad del que preguntaste",
              badge: "No cabe hoy",
              tone: "warn",
              selected: false,
              ask: "Auto: hasta $10,036 al mes",
            },
          ],
          note: "Con tu nómina Banorte la tasa baja de 13.9% a 11.5% — son $412 menos al mes.",
        },
      }),
      done(),
    ],
  };
}

export async function autoPaso2(userId: string): Promise<DemoScript> {
  await balanceOf(userId);
  const rate = 13.9;
  const monthly = (price: number) => payment(price - Math.round(price * 0.2), rate, 48);
  return {
    title: "Auto · opciones",
    steps: [
      status("Buscando autos que sí van contigo…"),
      ...mcp("a2", "research", "search_web", "3 autos dentro de tu rango", 540),
      widget({
        id: "auto-list",
        type: "listing",
        props: {
          title: "Estos sí van contigo",
          items: [
            {
              title: AUTOS[0].title,
              subtitle: AUTOS[0].subtitle,
              price: AUTOS[0].price,
              monthly: monthly(AUTOS[0].price),
              tag: "Dentro de tu alcance",
              tone: "good",
              imageQuery: "auto mazda seminuevo",
              ask: "Auto: ver el Mazda 3 2022 seminuevo",
            },
            {
              title: AUTOS[1].title,
              subtitle: AUTOS[1].subtitle,
              price: AUTOS[1].price,
              monthly: monthly(AUTOS[1].price),
              tag: "Dentro de tu alcance",
              tone: "good",
              imageQuery: "auto compacto nuevo",
              ask: "Auto: ver el Mazda 2 nuevo",
            },
            {
              title: AUTOS[2].title,
              subtitle: AUTOS[2].subtitle,
              price: AUTOS[2].price,
              monthly: monthly(AUTOS[2].price),
              tag: "Te queda a 12 meses",
              tone: "warn",
              imageQuery: "auto mazda rojo nuevo",
              ask: "Auto: ver el Mazda 3 nuevo",
            },
          ],
        },
      }),
      chips("auto-chips2", ["Auto: ver el Mazda 3 2022 seminuevo", "¿A dónde se me va el dinero?"]),
      done(),
    ],
  };
}

export async function autoDetalle(userId: string): Promise<DemoScript> {
  const bal = await balanceOf(userId);
  const price = AUTOS[0].price;
  const down = Math.round(price * 0.2);
  const m139 = payment(price - down, 13.9, 48);
  const m115 = payment(price - down, 11.5, 48);
  return {
    title: "Auto · detalle",
    steps: [
      status("Armando el expediente del auto…"),
      ...mcp("a3", "banorte", "simulate_loan", `${money(m139)}/mes a 48 meses`, 41),
      widget({
        id: "auto-detalle",
        type: "destination",
        props: {
          kicker: "Seminuevo certificado",
          title: "Mazda 3 2022",
          imageQuery: "auto mazda seminuevo volante",
          stats: [
            { label: "Kilometraje", value: "34,000 km" },
            { label: "Transmisión", value: "Automático" },
            { label: "Inspección", value: "150 pts" },
          ],
          sections: [
            {
              title: "Por qué te lo propongo",
              body: `Cuesta ${money(120_000)} menos que el nuevo, la mensualidad cabe en tu recorte de delivery y trae garantía de 1 año.`,
            },
          ],
          plan: {
            label: "Tu plan con Banorte",
            value: `${money(m139)}/mes · 48 meses · 13.9%`,
            badge: "Cabe ✓",
            note: `Enganche ${money(down)} — ya tienes ${money(bal.balance)}. Con nómina Banorte al 11.5% baja a ${money(m115)}/mes.`,
          },
          ask: { label: "Simular mi financiamiento", ask: "Auto: simular financiamiento" },
        },
      }),
      chips("auto-chips3", ["Auto: ver otras opciones", "Auto: simular financiamiento"]),
      done(),
    ],
  };
}

export async function autoSimulador(userId: string): Promise<DemoScript> {
  const bal = await balanceOf(userId);
  const price = AUTOS[0].price;
  return {
    title: "Auto · simulador",
    steps: [
      status("Abriendo el simulador…"),
      ...mcp("a4", "banorte", "simulate_loan", "escenarios 24-60 meses", 39),
      widget({
        id: "auto-sim",
        type: "simulator",
        props: {
          title: "Ajusta tu financiamiento",
          price,
          downPaymentMin: Math.round(price * 0.1),
          downPaymentMax: Math.round(price * 0.5),
          downPaymentInitial: Math.round(price * 0.2),
          termOptions: [24, 36, 48, 60],
          termInitial: 48,
          annualRatePct: 13.9,
          action: {
            label: "Ver mi plan para llegar",
            tool: "create_savings_goal",
            args: {
              userId,
              title: "Enganche Mazda 3 2022",
              targetAmount: Math.round(price * 0.2),
              monthlyAmount: bal.monthlySurplus,
              deadlineMonths: 5,
            },
            confirm: `Voy a crear un apartado de ${money(Math.round(price * 0.2))} para tu enganche. ¿Lo hago?`,
          },
        },
      }),
      widget({
        id: "auto-sim-alert",
        type: "alert",
        props: {
          title: "Tu tasa puede bajar",
          body: "Con tu nómina en Banorte aplicas al 11.5% en vez de 13.9%. En este auto son $412 menos cada mes.",
          tone: "accent",
        },
      }),
      chips("auto-chips4", ["Auto: mi plan para llegar", "Auto: ver otras opciones"]),
      done(),
    ],
  };
}

export async function autoPlan(userId: string): Promise<DemoScript> {
  const bal = await balanceOf(userId);
  const down = Math.round(AUTOS[0].price * 0.2);
  const falta = Math.max(0, down - bal.balance);
  const mesesSolo = Math.max(1, Math.ceil(falta / bal.monthlySurplus));
  const conRecorte = bal.monthlySurplus + 3_199;
  const mesesRecorte = Math.max(1, Math.ceil(falta / conRecorte));
  return {
    title: "Auto · plan",
    steps: [
      status("Cerrando tu plan…"),
      ...mcp("a5", "banorte", "project_cashflow", `enganche en ${mesesRecorte} meses`, 45),
      widget({
        id: "auto-plan",
        type: "plan",
        props: {
          title: "Tu plan para estrenar",
          target: down,
          current: Math.min(bal.balance, down),
          caption: `Te faltan ${money(falta)} para el enganche del Mazda 3 2022.`,
          options: [
            {
              label: "Con tu superávit",
              sublabel: `${money(bal.monthlySurplus)} al mes → ${mesesSolo} meses`,
              tone: "neutral",
            },
            {
              label: "Recortando delivery",
              sublabel: `${money(conRecorte)} al mes → ${mesesRecorte} meses`,
              badge: "Recomendado",
              tone: "good",
            },
          ],
          timeline: [
            { when: "Hoy", label: `Ya tienes ${money(bal.balance)}` },
            { when: `En ${mesesRecorte} meses`, label: "Enganche completo" },
            {
              when: "Después",
              label: `Estrenas pagando ${money(payment(AUTOS[0].price - down, 13.9, 48))}/mes`,
            },
          ],
          action: {
            label: "Crear mi apartado del enganche",
            tool: "create_savings_goal",
            args: {
              userId,
              title: "Enganche Mazda 3 2022",
              targetAmount: down,
              monthlyAmount: conRecorte,
              deadlineMonths: mesesRecorte,
            },
            confirm: `Voy a crear un apartado de ${money(down)} con ${money(conRecorte)} mensuales. ¿Lo hago?`,
          },
        },
      }),
      chips("auto-chips5", ["¿A dónde se me va el dinero?", "Tengo $50,000 parados"]),
      done(),
    ],
  };
}

// ═══ FLUJO VIAJE (estilo Roamy) ══════════════════════════════════════════════

const VIAJE_TOTAL = 90_000;

export async function viajePaso1(userId: string): Promise<DemoScript> {
  const bal = await balanceOf(userId);
  return {
    title: "Viaje · presupuesto",
    steps: [
      status("Un viaje se planea con una pregunta a la vez…"),
      ...mcp("v1", "research", "search_web", "Japón 2 semanas: $95,000–$130,000", 620),
      widget({
        id: "viaje-q1",
        type: "question",
        props: {
          title: "¿Cuánto quieres invertir en este viaje?",
          subtitle: "Japón, 12-14 días. Vuelo, hospedaje y comida incluidos.",
          step: 1,
          stepTotal: 3,
          options: [
            {
              label: `Esencial · ${money(60_000)}`,
              sublabel: "Hostales, 10 días, una ciudad",
              tone: "neutral",
              selected: false,
              ask: "Viaje: presupuesto esencial de $60,000",
            },
            {
              label: `Clásico · ${money(90_000)}`,
              sublabel: "Hoteles 3★, 12 días, Tokio–Kioto–Osaka",
              badge: "Llegas en 10 meses",
              tone: "accent",
              selected: true,
              ask: "Viaje: presupuesto clásico de $90,000",
            },
            {
              label: `A lo grande · ${money(130_000)}`,
              sublabel: "Hoteles 4★, 14 días, sin apuros",
              tone: "neutral",
              selected: false,
              ask: "Viaje: presupuesto grande de $130,000",
            },
          ],
          note: `Dato Banorte: tienes ${money(bal.balance)} y te sobran ${money(bal.monthlySurplus)} al mes.`,
        },
      }),
      done(),
    ],
  };
}

export async function viajePaso2(userId: string): Promise<DemoScript> {
  await balanceOf(userId);
  return {
    title: "Viaje · intereses",
    steps: [
      status("Perfecto. Ahora, tus gustos…"),
      widget({
        id: "viaje-q2",
        type: "question",
        props: {
          title: "¿Qué no te puedes perder?",
          subtitle: "Con esto armo tu ruta.",
          step: 2,
          stepTotal: 3,
          options: [
            {
              label: "Templos y cultura",
              sublabel: "Senso-ji, Fushimi Inari, castillos",
              tone: "accent",
              selected: true,
              ask: "Viaje: me interesan templos, comida y naturaleza",
            },
            {
              label: "Comida callejera",
              sublabel: "Mercados, ramen, izakayas",
              tone: "warn",
              selected: true,
              ask: "Viaje: me interesan templos, comida y naturaleza",
            },
            {
              label: "Naturaleza",
              sublabel: "Arashiyama, Nara, monte Fuji",
              tone: "good",
              selected: true,
              ask: "Viaje: me interesan templos, comida y naturaleza",
            },
            {
              label: "Anime y compras",
              sublabel: "Akihabara, Shibuya",
              tone: "neutral",
              selected: false,
              ask: "Viaje: me interesa anime y compras",
            },
          ],
        },
      }),
      done(),
    ],
  };
}

export async function viajePaso3(userId: string): Promise<DemoScript> {
  await balanceOf(userId);
  return {
    title: "Viaje · transporte",
    steps: [
      status("Último paso…"),
      ...mcp("v3", "research", "search_web", "JR Pass 14 días: ~$6,200", 480),
      widget({
        id: "viaje-q3",
        type: "question",
        props: {
          title: "¿Cómo te quieres mover?",
          step: 3,
          stepTotal: 3,
          options: [
            {
              label: "JR Pass · trenes bala",
              sublabel: `~${money(6_200)} · ilimitado entre ciudades`,
              badge: "Mejor para tu ruta",
              tone: "accent",
              selected: true,
              ask: "Viaje: arma mi itinerario con JR Pass",
            },
            {
              label: "Metro y locales",
              sublabel: `~${money(1_800)} · sólo si te quedas en una ciudad`,
              tone: "neutral",
              selected: false,
              ask: "Viaje: arma mi itinerario con metro",
            },
            {
              label: "Tours guiados",
              sublabel: `~${money(14_000)} · todo resuelto, menos libre`,
              tone: "neutral",
              selected: false,
              ask: "Viaje: arma mi itinerario con tours",
            },
          ],
          note: "Ritmo tranquilo: 3 lugares por día, con tiempo para perderte.",
        },
      }),
      done(),
    ],
  };
}

export async function viajeMapa(userId: string): Promise<DemoScript> {
  await balanceOf(userId);
  return {
    title: "Viaje · itinerario",
    steps: [
      status("Armando tu ruta…"),
      ...mcp("v4", "research", "search_web", "14 lugares · Tokio, Kioto, Osaka", 710),
      ...mcp("v5", "banorte", "project_cashflow", "gasto diario estimado ok", 36),
      widget({
        id: "viaje-mapa",
        type: "mapa",
        props: {
          title: "Japón clásico · 12 días",
          stops: [
            { n: 1, label: "Tokio", sublabel: "5 días", lat: 35.6762, lng: 139.6503 },
            { n: 2, label: "Kioto", sublabel: "4 días", lat: 35.0116, lng: 135.7681 },
            { n: 3, label: "Osaka", sublabel: "3 días", lat: 34.6937, lng: 135.5023 },
          ],
          card: {
            kicker: "Día 1 · Tokio",
            title: "Senso-ji",
            rating: "★ 4.7",
            body: "El templo más antiguo de Tokio. Llega antes de las 9 para verlo sin multitudes.",
            meta: "Gratis · 2h",
            ask: "Viaje: detalle de Senso-ji",
          },
          ask: { label: "¿Cómo lo pago?", ask: "Viaje: cómo lo pago" },
        },
      }),
      chips("viaje-chips4", ["Viaje: detalle de Senso-ji", "Viaje: cómo lo pago"]),
      done(),
    ],
  };
}

export async function viajeDestino(userId: string): Promise<DemoScript> {
  await balanceOf(userId);
  return {
    title: "Viaje · Senso-ji",
    steps: [
      status("Abriendo el destino…"),
      widget({
        id: "viaje-destino",
        type: "destination",
        props: {
          kicker: "Día 1 · Tokio",
          title: "Senso-ji",
          imageQuery: "viaje japon templo",
          stats: [
            { label: "Rating", value: "★ 4.7" },
            { label: "Tiempo", value: "2 h" },
            { label: "Entrada", value: "Gratis" },
          ],
          sections: [
            {
              title: "Por qué está en tu ruta",
              body: "Elegiste templos y comida callejera: la calle Nakamise que lleva al templo es de los mejores street food de Tokio.",
            },
            {
              title: "Datos útiles",
              body: "Abierto 6:00–17:00. A 18 min en metro ($28). Mejor antes de las 9 am.",
            },
          ],
          plan: {
            label: "Gasto estimado aquí",
            value: money(380),
            badge: "Cabe ✓",
            note: "Dentro de tu presupuesto diario de viaje.",
          },
          ask: { label: "¿Cómo pago el viaje?", ask: "Viaje: cómo lo pago" },
        },
      }),
      chips("viaje-chips5", ["Viaje: cómo lo pago", "Viaje: arma mi itinerario con JR Pass"]),
      done(),
    ],
  };
}

export async function viajePlan(userId: string): Promise<DemoScript> {
  const bal = await balanceOf(userId);
  const inversion = await listProducts("inversion");
  const pagare = inversion[0];
  const falta = Math.max(0, VIAJE_TOTAL - bal.balance);
  const mesesSimple = Math.max(1, Math.ceil(falta / bal.monthlySurplus));
  return {
    title: "Viaje · plan",
    steps: [
      status("Cerrando tu plan de pago…"),
      ...mcp(
        "v6",
        "banorte",
        "get_products",
        `${pagare?.name ?? "Pagaré Banorte"} ${pagare?.annualRatePct ?? 9.25}%`,
        33,
      ),
      widget({
        id: "viaje-plan",
        type: "plan",
        props: {
          title: "Cómo lo pagas",
          target: VIAJE_TOTAL,
          current: Math.min(bal.balance, VIAJE_TOTAL),
          caption: `Te faltan ${money(falta)} para el Japón clásico de ${money(VIAJE_TOTAL)}.`,
          options: [
            {
              label: "Apartado sin rendimiento",
              sublabel: `${money(bal.monthlySurplus)} al mes → ${mesesSimple} meses`,
              tone: "neutral",
            },
            {
              label: pagare?.name ?? "Pagaré Banorte",
              sublabel: `Al ${pagare?.annualRatePct ?? 9.25}% anual → ~${Math.max(1, mesesSimple - 1)}.5 meses`,
              badge: "Recomendado",
              tone: "accent",
            },
          ],
          timeline: [
            { when: "Hoy", label: `Ya tienes ${money(bal.balance)} (49%)` },
            { when: "Junio 2027", label: "Presupuesto completo — despegas" },
          ],
          action: {
            label: "Crear mi apartado del viaje",
            tool: "create_savings_goal",
            args: {
              userId,
              title: "Viaje a Japón",
              targetAmount: VIAJE_TOTAL,
              monthlyAmount: bal.monthlySurplus,
              deadlineMonths: mesesSimple,
            },
            confirm: `Voy a crear un apartado de ${money(VIAJE_TOTAL)} con ${money(bal.monthlySurplus)} mensuales. ¿Lo hago?`,
          },
        },
      }),
      chips("viaje-chips6", ["¿A dónde se me va el dinero?", "¿Me alcanza para un Mazda 3?"]),
      done(),
    ],
  };
}

// ═══ FLUJO CASA (estilo Zillow BuyAbility) ═══════════════════════════════════

const CASA = { title: "Depto Iztacalco 58 m²", price: 980_000, rate: 10.75 };

export async function casaPaso1(userId: string): Promise<DemoScript> {
  const bal = await balanceOf(userId);
  const tope = Math.round(bal.monthlyIncome * 0.35);
  const grande = payment(2_400_000 - 240_000, CASA.rate, 240);
  return {
    title: "Casa · alcance",
    steps: [
      status("Calculando cuánta casa puedes hoy…"),
      ...mcp("h1", "banorte", "get_balance", `ingreso ${money(bal.monthlyIncome)}/mes`, 29),
      ...mcp("h2", "banorte", "simulate_loan", `tope ${money(tope)}/mes al 35%`, 42),
      widget({
        id: "casa-metric",
        type: "metric",
        props: {
          label: "Hoy te alcanza hasta",
          value: 1_050_000,
          unit: "MXN",
          caption: `Hipoteca Banorte ${CASA.rate}% a 20 años, 10% de enganche, pago máximo ${money(tope)}/mes (35% de tu ingreso).`,
          tone: "good",
        },
      }),
      widget({
        id: "casa-alert",
        type: "alert",
        props: {
          title: "El depa de $2.4M hoy no",
          body: `Su mensualidad sería ${money(grande)} — el 77% de tu ingreso. El límite sano es 35%. Pero hay opciones reales a tu alcance.`,
          tone: "warn",
        },
      }),
      widget({
        id: "casa-q1",
        type: "question",
        props: {
          title: "¿Por dónde empezamos?",
          step: 1,
          stepTotal: 2,
          options: [
            {
              label: "Ver opciones a mi alcance",
              sublabel: "Hasta $1,050,000, mensualidad que sí cabe",
              badge: "Recomendado",
              tone: "good",
              selected: true,
              ask: "Casa: explorar opciones",
            },
            {
              label: "Plan para el depa grande",
              sublabel: "Meta a 4-5 años, juntando enganche",
              tone: "neutral",
              selected: false,
              ask: "Casa: mi plan para llegar",
            },
          ],
        },
      }),
      done(),
    ],
  };
}

export async function casaExplorar(userId: string): Promise<DemoScript> {
  await balanceOf(userId);
  const m = (price: number) => payment(price - Math.round(price * 0.1), CASA.rate, 240);
  return {
    title: "Casa · explorar",
    steps: [
      status("Buscando propiedades…"),
      ...mcp("h3", "research", "search_web", "3 propiedades CDMX oriente", 680),
      widget({
        id: "casa-list",
        type: "listing",
        props: {
          title: "A tu alcance hoy",
          items: [
            {
              title: "Iztacalco · depto 58 m²",
              subtitle: "2 recámaras · remodelado",
              price: 980_000,
              monthly: m(980_000),
              tag: "Dentro de tu alcance",
              tone: "good",
              imageQuery: "departamento moderno",
              ask: "Casa: ver el depto en Iztacalco",
            },
            {
              title: "Neza · casa 74 m²",
              subtitle: "3 recámaras · patio",
              price: 1_020_000,
              monthly: m(1_020_000),
              tag: "Dentro de tu alcance",
              tone: "good",
              imageQuery: "casa fachada",
              ask: "Casa: ver la casa en Neza",
            },
            {
              title: "Narvarte · depto 65 m²",
              subtitle: "El que soñabas",
              price: 2_400_000,
              monthly: m(2_400_000),
              tag: "Meta a 4-5 años",
              tone: "warn",
              imageQuery: "departamento cdmx",
              ask: "Casa: mi plan para llegar",
            },
          ],
        },
      }),
      chips("casa-chips2", ["Casa: ver el depto en Iztacalco", "Casa: mi plan para llegar"]),
      done(),
    ],
  };
}

export async function casaDetalle(userId: string): Promise<DemoScript> {
  const bal = await balanceOf(userId);
  const down = Math.round(CASA.price * 0.1);
  const credito = payment(CASA.price - down, CASA.rate, 240);
  const total = credito + 180 + 200;
  return {
    title: "Casa · detalle",
    steps: [
      status("Abriendo la propiedad…"),
      ...mcp("h4", "banorte", "simulate_loan", `${money(total)}/mes real`, 38),
      widget({
        id: "casa-detalle",
        type: "destination",
        props: {
          kicker: "Iztacalco · CDMX",
          title: "Depto 58 m²",
          imageQuery: "departamento moderno interior",
          stats: [
            { label: "Superficie", value: "58 m²" },
            { label: "Recámaras", value: "2" },
            { label: "Precio", value: money(CASA.price) },
          ],
          sections: [
            {
              title: "Tu pago mensual real",
              body: `${money(total)} = crédito ${money(credito)} + predial ${money(180)} + mantenimiento ${money(200)}. Es el 33% de tu ingreso: cabe.`,
            },
            {
              title: "El enganche",
              body: `10% = ${money(down)}. Ya tienes ${money(bal.balance)}; te faltan ${money(Math.max(0, down - bal.balance))}.`,
            },
          ],
          plan: {
            label: "Tu pago mensual real",
            value: `${money(total)}/mes`,
            badge: "Cabe ✓",
            note: `Hipoteca Banorte ${CASA.rate}% a 20 años.`,
          },
          ask: { label: "Simular mi hipoteca", ask: "Casa: simular hipoteca" },
        },
      }),
      chips("casa-chips3", ["Casa: simular hipoteca", "Casa: explorar opciones"]),
      done(),
    ],
  };
}

export async function casaSimulador(userId: string): Promise<DemoScript> {
  const bal = await balanceOf(userId);
  const down = Math.round(CASA.price * 0.1);
  return {
    title: "Casa · simulador",
    steps: [
      status("Abriendo el simulador de hipoteca…"),
      ...mcp("h5", "banorte", "simulate_loan", "plazos 15/20/25 años", 44),
      widget({
        id: "casa-sim",
        type: "simulator",
        props: {
          title: "Ajusta tu hipoteca",
          price: CASA.price,
          downPaymentMin: down,
          downPaymentMax: Math.round(CASA.price * 0.4),
          downPaymentInitial: down,
          termOptions: [180, 240, 300],
          termInitial: 240,
          annualRatePct: CASA.rate,
          action: {
            label: "Ver mi plan para llegar",
            tool: "create_savings_goal",
            args: {
              userId,
              title: "Enganche depto Iztacalco",
              targetAmount: down,
              monthlyAmount: bal.monthlySurplus,
              deadlineMonths: 12,
            },
            confirm: `Voy a crear un apartado de ${money(down)} para tu enganche. ¿Lo hago?`,
          },
        },
      }),
      chips("casa-chips4", ["Casa: mi plan para llegar", "Casa: explorar opciones"]),
      done(),
    ],
  };
}

export async function casaPlan(userId: string): Promise<DemoScript> {
  const bal = await balanceOf(userId);
  const inversion = await listProducts("inversion");
  const pagare = inversion[0];
  const down = 98_000;
  const falta = Math.max(0, down - bal.balance);
  const m1 = Math.max(1, Math.ceil(falta / bal.monthlySurplus));
  const m2 = Math.max(1, Math.ceil(falta / (bal.monthlySurplus + 3_199)));
  return {
    title: "Casa · plan",
    steps: [
      status("Armando tu plan de preparación…"),
      ...mcp("h6", "banorte", "project_cashflow", `enganche en ${m2} meses`, 47),
      widget({
        id: "casa-plan",
        type: "plan",
        props: {
          title: "Tu plan para el enganche",
          target: down,
          current: Math.min(bal.balance, down),
          caption: `Enganche de ${money(down)} (10% + gastos). Te faltan ${money(falta)}.`,
          options: [
            {
              label: "Con tu superávit",
              sublabel: `${money(bal.monthlySurplus)} al mes → ${m1} meses`,
              tone: "neutral",
            },
            {
              label: "+ recorte de delivery",
              sublabel: `${money(bal.monthlySurplus + 3_199)} al mes → ${m2} meses`,
              badge: "Recomendado",
              tone: "good",
            },
            {
              label: `+ ${pagare?.name ?? "Pagaré Banorte"}`,
              sublabel: `Rinde ${pagare?.annualRatePct ?? 9.25}% mientras juntas`,
              badge: "Producto Banorte",
              tone: "accent",
            },
          ],
          timeline: [
            { when: "Hoy", label: "Sin deudas ✓ · nómina Banorte ✓" },
            { when: `En ${m2} meses`, label: "Enganche completo" },
            { when: "Después", label: "Hipoteca pre-autorizada" },
          ],
          action: {
            label: "Crear mi subcuenta de enganche",
            tool: "create_savings_goal",
            args: {
              userId,
              title: "Enganche depto Iztacalco",
              targetAmount: down,
              monthlyAmount: bal.monthlySurplus + 3_199,
              deadlineMonths: m2,
            },
            confirm: `Voy a crear una subcuenta de ${money(down)} con ${money(bal.monthlySurplus + 3_199)} mensuales. ¿Lo hago?`,
          },
        },
      }),
      chips("casa-chips5", ["¿A dónde se me va el dinero?", "Tengo $50,000 parados"]),
      done(),
    ],
  };
}
