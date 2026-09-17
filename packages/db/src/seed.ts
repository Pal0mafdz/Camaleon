/**
 * Seed de datos demo para Camaleón.
 * Ejecutar: pnpm -F @camaleon/db db:seed
 *
 * Genera 6 meses de movimientos realistas para dos perfiles mexicanos.
 * Los montos y comercios están calibrados para que las preguntas del demo
 * ("¿me alcanza para un Mazda 3?", "¿a dónde se me va el dinero?") tengan
 * respuestas interesantes: hay fugas de dinero detectables y margen real.
 */
import { db } from "./index";
import {
  AGE_BANDS,
  AGE_MULT,
  BENCHMARK_CATEGORIES,
  CATEGORY_PCT,
  INCOME_BANDS,
} from "./peer-bands";
import { goals, peerBenchmarks, products, transactions, users } from "./schema";
import { buildMonths, makeRandom, type Seed } from "./synthetic/rng";

/** Cargos que se repiten idénticos cada mes. */
const KARLA_FIJOS: Seed[] = [
  { merchant: "Nómina Banorte", category: "ingreso", amount: 28_400, method: "nomina", day: 1 },
  {
    merchant: "Renta depto Narvarte",
    category: "vivienda",
    amount: -8_500,
    method: "transferencia",
    recurring: true,
    day: 3,
  },
  { merchant: "CFE", category: "servicios", amount: -410, recurring: true, day: 8 },
  { merchant: "Telcel", category: "servicios", amount: -399, recurring: true, day: 10 },
  { merchant: "Totalplay", category: "servicios", amount: -589, recurring: true, day: 12 },
  { merchant: "Spotify", category: "suscripciones", amount: -129, recurring: true, day: 14 },
  { merchant: "Netflix", category: "suscripciones", amount: -299, recurring: true, day: 15 },
  {
    merchant: "Adobe Creative Cloud",
    category: "suscripciones",
    amount: -689,
    recurring: true,
    day: 17,
  },
  { merchant: "Smart Fit", category: "salud", amount: -449, recurring: true, day: 5 },
  { merchant: "iCloud+", category: "suscripciones", amount: -49, recurring: true, day: 20 },
];

/**
 * Comercios variables: se muestrean con montos dentro de un rango.
 *
 * Calibración: los fijos de Karla suman 11,513/mes contra 28,400 de ingreso.
 * Estos rangos promedian ~9,500/mes de gasto variable, dejando un superávit
 * cercano a 7,400/mes — suficiente para que "¿me alcanza?" tenga respuesta
 * afirmativa con esfuerzo, que es la única versión interesante de la pregunta.
 * La comida a domicilio (Uber Eats + Rappi + Starbucks ≈ 3,000/mes) queda alta
 * a propósito: es la fuga que el agente debe encontrar y proponer recortar.
 */
const KARLA_VARIABLES: {
  merchant: string;
  category: string;
  min: number;
  max: number;
  perMonth: number;
  method?: string;
}[] = [
  { merchant: "OXXO", category: "super", min: 45, max: 160, perMonth: 8 },
  { merchant: "Uber Eats", category: "comida", min: 180, max: 420, perMonth: 6 },
  { merchant: "Uber", category: "transporte", min: 65, max: 190, perMonth: 6 },
  { merchant: "Starbucks", category: "comida", min: 78, max: 140, perMonth: 5 },
  { merchant: "Chedraui", category: "super", min: 620, max: 1_180, perMonth: 2 },
  { merchant: "Farmacias del Ahorro", category: "salud", min: 90, max: 320, perMonth: 1 },
  { merchant: "Cinépolis", category: "entretenimiento", min: 130, max: 320, perMonth: 1 },
  {
    merchant: "Amazon MX",
    category: "compras",
    min: 210,
    max: 850,
    perMonth: 2,
    method: "credito",
  },
  { merchant: "Zara", category: "compras", min: 380, max: 900, perMonth: 1, method: "credito" },
  { merchant: "Metro CDMX", category: "transporte", min: 30, max: 60, perMonth: 4 },
  { merchant: "Rappi", category: "comida", min: 150, max: 330, perMonth: 3 },
  {
    merchant: "Liverpool",
    category: "compras",
    min: 300,
    max: 1_100,
    perMonth: 1,
    method: "credito",
  },
];

const ROBERTO_FIJOS: Seed[] = [
  { merchant: "Pensión IMSS", category: "ingreso", amount: 9_800, method: "nomina", day: 1 },
  {
    merchant: "Renta local Xalapa",
    category: "ingreso",
    amount: 6_500,
    method: "transferencia",
    day: 4,
  },
  { merchant: "CFE", category: "servicios", amount: -280, recurring: true, day: 9 },
  { merchant: "Telmex", category: "servicios", amount: -499, recurring: true, day: 11 },
  { merchant: "Predial", category: "servicios", amount: -320, recurring: true, day: 6 },
  { merchant: "Seguro GNP", category: "seguros", amount: -1_240, recurring: true, day: 18 },
];

const ROBERTO_VARIABLES: {
  merchant: string;
  category: string;
  min: number;
  max: number;
  perMonth: number;
  method?: string;
}[] = [
  { merchant: "Soriana", category: "super", min: 480, max: 1_350, perMonth: 4 },
  { merchant: "Farmacia Guadalajara", category: "salud", min: 180, max: 890, perMonth: 3 },
  { merchant: "Mercado Jáuregui", category: "super", min: 120, max: 480, perMonth: 5 },
  { merchant: "Gasolinera Pemex", category: "transporte", min: 300, max: 700, perMonth: 3 },
  { merchant: "Laboratorio Chopo", category: "salud", min: 350, max: 1_100, perMonth: 1 },
  { merchant: "Restaurante La Parroquia", category: "comida", min: 180, max: 520, perMonth: 2 },
];

/** PRNG determinista: el demo debe verse igual cada vez que se siembra. */
const rand = makeRandom(20_260_904);

const PRODUCTS: (typeof products.$inferInsert)[] = [
  {
    id: "credito-auto",
    kind: "credito_auto",
    name: "Crédito Auto Banorte",
    headline: "Hasta 60 meses con tasa fija",
    annualRatePct: 13.9,
    minAmount: 50_000,
    maxAmount: 1_500_000,
    bullets: JSON.stringify([
      "Enganche desde 20%",
      "Tasa fija todo el plazo",
      "Seguro de auto incluido el primer año",
    ]),
  },
  {
    id: "credito-auto-nomina",
    kind: "credito_auto",
    name: "Crédito Auto Nómina Banorte",
    headline: "Tasa preferencial si cobras tu nómina aquí",
    annualRatePct: 11.5,
    minAmount: 50_000,
    maxAmount: 900_000,
    bullets: JSON.stringify([
      "Tasa preferencial por nómina",
      "Sin comisión por apertura",
      "Domiciliación automática",
    ]),
  },
  {
    id: "pagare-banorte",
    kind: "inversion",
    name: "Pagaré Banorte",
    headline: "Rendimiento fijo garantizado a plazo",
    annualRatePct: 9.25,
    minAmount: 5_000,
    maxAmount: 5_000_000,
    bullets: JSON.stringify([
      "Plazos de 28 a 360 días",
      "Capital garantizado",
      "Renovación automática",
    ]),
  },
  {
    id: "fondo-deuda",
    kind: "inversion",
    name: "Fondo de deuda Banorte",
    headline: "Liquidez diaria con rendimiento variable",
    annualRatePct: 10.1,
    minAmount: 1_000,
    maxAmount: 10_000_000,
    bullets: JSON.stringify([
      "Disponibilidad en 24h",
      "Sin plazo forzoso",
      "Administrado por Banorte",
    ]),
  },
  {
    id: "hipoteca",
    kind: "hipoteca",
    name: "Hipoteca Banorte",
    headline: "Hasta 20 años con pagos fijos",
    annualRatePct: 10.75,
    minAmount: 300_000,
    maxAmount: 15_000_000,
    bullets: JSON.stringify([
      "Enganche desde 10%",
      "Pagos fijos en pesos",
      "Puedes hacer pagos anticipados sin penalización",
    ]),
  },
  {
    id: "credito-personal",
    kind: "credito_personal",
    name: "Crédito Personal Banorte",
    headline: "Dinero en tu cuenta el mismo día",
    annualRatePct: 24.9,
    minAmount: 10_000,
    maxAmount: 500_000,
    bullets: JSON.stringify([
      "Sin garantía",
      "Plazos de 12 a 60 meses",
      "Preaprobado si tienes nómina Banorte",
    ]),
  },
];

/** Password compartida de las cuentas demo. Nada de esto es seguro, es un hackathon. */
const DEMO_PASSWORD = "banorte123";

/**
 * Población sintética para "comparado con gente como tú".
 *
 * En vez de guardar miles de perfiles con su historial completo, se genera
 * la muestra en memoria y solo se guardan los percentiles (p25/p50/p75) por
 * banda de edad + ingreso + categoría. Es la tabla `peer_benchmarks`: 180
 * filas (5 edades × 4 ingresos × 9 categorías), no una base de datos de
 * gente inventada.
 */

const PROFILES_PER_BAND = 400;

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return Math.round(sorted[idx] ?? 0);
}

type CategorySamples = Record<(typeof BENCHMARK_CATEGORIES)[number], number[]>;

function buildPeerBenchmarks(rand: () => number): (typeof peerBenchmarks.$inferInsert)[] {
  const rows: (typeof peerBenchmarks.$inferInsert)[] = [];

  for (const ageBand of AGE_BANDS) {
    for (const incomeBandDef of INCOME_BANDS) {
      const min = incomeBandDef.min;
      const max = Number.isFinite(incomeBandDef.max) ? incomeBandDef.max : min * 1.8;

      const samples = {} as CategorySamples;
      for (const category of BENCHMARK_CATEGORIES) samples[category] = [];

      for (let i = 0; i < PROFILES_PER_BAND; i++) {
        const income = min + rand() * (max - min);
        for (const category of BENCHMARK_CATEGORIES) {
          const mult = AGE_MULT[category]?.[ageBand] ?? 1;
          const base = income * CATEGORY_PCT[category] * mult;
          const noise = 0.7 + rand() * 0.6; // ±30% de variación entre perfiles
          samples[category].push(base * noise);
        }
      }

      for (const category of BENCHMARK_CATEGORIES) {
        const sorted = samples[category].sort((a, b) => a - b);
        rows.push({
          ageBand,
          incomeBand: incomeBandDef.id,
          category,
          p25: percentile(sorted, 0.25),
          p50: percentile(sorted, 0.5),
          p75: percentile(sorted, 0.75),
          sampleSize: PROFILES_PER_BAND,
        });
      }
    }
  }

  return rows;
}

async function main() {
  console.log("Limpiando tablas…");
  await db.delete(transactions);
  await db.delete(goals);
  await db.delete(products);
  await db.delete(peerBenchmarks);
  await db.delete(users);

  console.log("Sembrando usuarios…");
  const passwordHash = await Bun.password.hash(DEMO_PASSWORD);
  await db.insert(users).values([
    {
      id: "karla",
      name: "Karla Mendoza",
      email: "karla@banorte.demo",
      passwordHash,
      age: 28,
      occupation: "Diseñadora de producto",
      monthlyIncome: 28_400,
      balance: 43_820,
      uiMode: "estandar",
      theme: "claro",
      notificationsEnabled: true,
    },
    {
      id: "roberto",
      name: "Roberto Salas",
      email: "roberto@banorte.demo",
      passwordHash,
      age: 67,
      occupation: "Jubilado",
      monthlyIncome: 16_300,
      balance: 128_500,
      uiMode: "simple",
      theme: "claro",
      notificationsEnabled: true,
    },
  ]);

  console.log("Sembrando productos Banorte…");
  await db.insert(products).values(PRODUCTS);

  const karlaRows = buildMonths(rand, "karla", KARLA_FIJOS, KARLA_VARIABLES, 6);
  const robertoRows = buildMonths(rand, "roberto", ROBERTO_FIJOS, ROBERTO_VARIABLES, 6);

  console.log(`Sembrando ${karlaRows.length + robertoRows.length} movimientos…`);
  for (let i = 0; i < karlaRows.length; i += 100) {
    await db.insert(transactions).values(karlaRows.slice(i, i + 100));
  }
  for (let i = 0; i < robertoRows.length; i += 100) {
    await db.insert(transactions).values(robertoRows.slice(i, i + 100));
  }

  console.log("Sembrando referencias de comparación (población sintética)…");
  const benchmarkRows = buildPeerBenchmarks(rand);
  await db.insert(peerBenchmarks).values(benchmarkRows);

  console.log("Sembrando metas…");
  await db.insert(goals).values([
    {
      userId: "karla",
      title: "Fondo de emergencia",
      targetAmount: 85_000,
      currentAmount: 43_820,
      monthlyAmount: 3_000,
      deadlineMonths: 14,
      status: "activa",
    },
  ]);

  console.log("Listo.");
  console.log(`Login demo: karla@banorte.demo / ${DEMO_PASSWORD}`);
  console.log(`Login demo: roberto@banorte.demo / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
