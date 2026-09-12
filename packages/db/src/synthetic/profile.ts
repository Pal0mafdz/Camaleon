/**
 * Genera un perfil financiero sintético pero realista para un usuario real
 * (a diferencia de `seed.ts`, que solo siembra a Karla/Roberto y a la
 * población anónima de `peer_benchmarks`). Se usa al dar de alta una cuenta
 * nueva (`POST /auth/signup`) y para poblar retroactivamente cuentas viejas
 * sin movimientos (`synthetic/backfill.ts`), para que el asesor (MCP tools en
 * `packages/db/src/queries.ts`) tenga con qué trabajar desde el día uno en
 * vez de recibir ceros.
 *
 * Reutiliza el mismo modelo "% del ingreso por categoría, ajustado por edad"
 * que ya usa `seed.ts` para la población sintética de comparación
 * (`AGE_MULT`/`CATEGORY_PCT` en `../peer-bands`), así que el gasto generado
 * aquí es coherente con las bandas contra las que `compareToPeers()` compara.
 */
import {
  AGE_MULT,
  BENCHMARK_CATEGORIES,
  type BenchmarkCategory,
  bandForAge,
  CATEGORY_PCT,
} from "../peer-bands";
import type { transactions } from "../schema";
import { buildMonths, makeRandom, pick, pickOne, type Seed, type Variable } from "./rng";

type Row = typeof transactions.$inferInsert;

export type SyntheticGoal = {
  title: string;
  targetAmount: number;
  monthlyAmount: number;
  deadlineMonths: number;
};

export type SyntheticProfile = {
  age: number;
  occupation: string;
  monthlyIncome: number;
  balance: number;
  transactions: Row[];
  goal?: SyntheticGoal;
};

const OCCUPATIONS: { title: string; incomeRange: [number, number] }[] = [
  { title: "Empleado de oficina", incomeRange: [12_000, 22_000] },
  { title: "Comerciante", incomeRange: [10_000, 26_000] },
  { title: "Freelancer / diseñador", incomeRange: [15_000, 38_000] },
  { title: "Ingeniero de software", incomeRange: [32_000, 72_000] },
  { title: "Docente", incomeRange: [14_000, 24_000] },
  { title: "Enfermero/a", incomeRange: [13_000, 21_000] },
  { title: "Chofer / repartidor", incomeRange: [8_000, 16_000] },
  { title: "Contador", incomeRange: [18_000, 34_000] },
  { title: "Jubilado", incomeRange: [9_000, 19_000] },
  { title: "Estudiante con beca", incomeRange: [3_000, 9_000] },
];

/** Cargos recurrentes de los que se muestrea un subconjunto por usuario. */
const RECURRING_POOL: {
  merchant: string;
  category: string;
  min: number;
  max: number;
  day: number;
}[] = [
  { merchant: "CFE", category: "servicios", min: 250, max: 550, day: 8 },
  { merchant: "Telcel", category: "servicios", min: 250, max: 599, day: 10 },
  { merchant: "Totalplay", category: "servicios", min: 449, max: 799, day: 12 },
  { merchant: "Netflix", category: "suscripciones", min: 99, max: 299, day: 15 },
  { merchant: "Spotify", category: "suscripciones", min: 99, max: 179, day: 14 },
  { merchant: "Disney+", category: "suscripciones", min: 99, max: 229, day: 16 },
  { merchant: "Smart Fit", category: "salud", min: 349, max: 599, day: 5 },
];

/** Comercios variables por categoría; rango típico por transacción. */
const VARIABLE_POOL: {
  merchant: string;
  category: BenchmarkCategory;
  min: number;
  max: number;
  method?: string;
}[] = [
  { merchant: "OXXO", category: "super", min: 40, max: 180 },
  { merchant: "Soriana", category: "super", min: 300, max: 1_200 },
  { merchant: "Chedraui", category: "super", min: 300, max: 1_200 },
  { merchant: "Uber Eats", category: "comida", min: 150, max: 420 },
  { merchant: "Rappi", category: "comida", min: 130, max: 350 },
  { merchant: "Starbucks", category: "comida", min: 60, max: 150 },
  { merchant: "Uber", category: "transporte", min: 60, max: 200 },
  { merchant: "Metro/Metrobús", category: "transporte", min: 20, max: 60 },
  { merchant: "Gasolinera Pemex", category: "transporte", min: 300, max: 800 },
  { merchant: "Amazon MX", category: "compras", min: 200, max: 900, method: "credito" },
  { merchant: "Liverpool", category: "compras", min: 300, max: 1_200, method: "credito" },
  { merchant: "Farmacias del Ahorro", category: "salud", min: 90, max: 350 },
  { merchant: "Cinépolis", category: "entretenimiento", min: 120, max: 320 },
];

const GOAL_TEMPLATES: { title: string; pctOfIncome: [number, number]; months: [number, number] }[] =
  [
    { title: "Fondo de emergencia", pctOfIncome: [0.06, 0.12], months: [8, 18] },
    { title: "Viaje", pctOfIncome: [0.03, 0.08], months: [4, 10] },
    { title: "Enganche de auto", pctOfIncome: [0.08, 0.15], months: [10, 24] },
  ];

/** Hash simple (FNV-1a) para convertir un userId en una semilla de 32 bits. */
function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function shuffle<T>(rand: () => number, items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

function buildFijos(rand: () => number, monthlyIncome: number): Seed[] {
  const fijos: Seed[] = [
    {
      merchant: "Nómina",
      category: "ingreso",
      amount: Math.round(monthlyIncome),
      method: "nomina",
      day: 1,
    },
  ];

  if (rand() < 0.55) {
    fijos.push({
      merchant: "Renta",
      category: "vivienda",
      amount: -Math.round(monthlyIncome * pick(rand, 0.18, 0.35)),
      method: "transferencia",
      recurring: true,
      day: 3,
    });
  }

  const chosen = shuffle(rand, RECURRING_POOL).slice(0, 2 + Math.floor(rand() * 3));
  for (const item of chosen) {
    fijos.push({
      merchant: item.merchant,
      category: item.category,
      amount: -pick(rand, item.min, item.max),
      recurring: true,
      day: item.day,
    });
  }

  return fijos;
}

/** Reparte el % de ingreso esperado por categoría (ajustado por edad) entre 1-2 comercios. */
function buildVariables(
  rand: () => number,
  monthlyIncome: number,
  ageBand: ReturnType<typeof bandForAge>,
): Variable[] {
  const variables: Variable[] = [];

  for (const category of BENCHMARK_CATEGORIES) {
    const candidates = VARIABLE_POOL.filter((v) => v.category === category);
    if (candidates.length === 0) continue;

    const mult = AGE_MULT[category]?.[ageBand] ?? 1;
    const targetMonthly = monthlyIncome * CATEGORY_PCT[category] * mult;

    const chosen = shuffle(rand, candidates).slice(0, rand() < 0.5 ? 1 : 2);
    const share = targetMonthly / chosen.length;

    for (const c of chosen) {
      const avgAmount = (c.min + c.max) / 2;
      const perMonth = Math.min(12, Math.max(1, Math.round(share / avgAmount)));
      variables.push({
        merchant: c.merchant,
        category: c.category,
        min: c.min,
        max: c.max,
        perMonth,
        method: c.method,
      });
    }
  }

  return variables;
}

function buildGoal(rand: () => number, monthlyIncome: number): SyntheticGoal | undefined {
  if (rand() < 0.2) return undefined; // 20% arranca sin meta, como un usuario recién llegado

  const template = pickOne(rand, GOAL_TEMPLATES);
  const monthlyAmount = Math.round(
    monthlyIncome * pick(rand, template.pctOfIncome[0], template.pctOfIncome[1]),
  );
  const deadlineMonths = Math.round(pick(rand, template.months[0], template.months[1]));

  return {
    title: template.title,
    targetAmount: monthlyAmount * deadlineMonths,
    monthlyAmount,
    deadlineMonths,
  };
}

/**
 * Genera edad, ocupación, ingreso, saldo, ~6 meses de movimientos y (casi
 * siempre) una meta inicial para `userId`. Determinista: la misma cuenta
 * siempre genera el mismo perfil, así que correr el backfill de nuevo sobre
 * un usuario ya poblado no cambia sus datos.
 */
export function generateSyntheticProfile(userId: string): SyntheticProfile {
  const rand = makeRandom(hashSeed(userId));

  const age = Math.round(pick(rand, 18, 70));
  const ageBand = bandForAge(age);
  const occupation = pickOne(rand, OCCUPATIONS);
  const monthlyIncome = Math.round(
    pick(rand, occupation.incomeRange[0], occupation.incomeRange[1]),
  );
  const balance = Math.round(pick(rand, monthlyIncome * 0.5, monthlyIncome * 3));

  const fijos = buildFijos(rand, monthlyIncome);
  const variables = buildVariables(rand, monthlyIncome, ageBand);
  const transactionRows = buildMonths(rand, userId, fijos, variables, 6);
  const goal = buildGoal(rand, monthlyIncome);

  return {
    age,
    occupation: occupation.title,
    monthlyIncome,
    balance,
    transactions: transactionRows,
    goal,
  };
}
