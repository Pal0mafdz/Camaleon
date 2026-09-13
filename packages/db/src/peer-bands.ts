/**
 * Bandas de edad e ingreso usadas tanto para generar la población sintética
 * (`seed.ts`) como para ubicar a un cliente real en ellas (`compareToPeers`
 * en `queries.ts`). Viven en un solo lugar para que generación y consulta
 * nunca se desalineen.
 */

export const AGE_BANDS = ["18-25", "26-35", "36-50", "51-65", "65+"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const INCOME_BANDS = [
  { id: "<15k", min: 0, max: 15_000 },
  { id: "15k-30k", min: 15_000, max: 30_000 },
  { id: "30k-60k", min: 30_000, max: 60_000 },
  { id: "60k+", min: 60_000, max: Number.POSITIVE_INFINITY },
] as const;
export type IncomeBand = (typeof INCOME_BANDS)[number]["id"];

export function bandForAge(age: number): AgeBand {
  if (age <= 25) return "18-25";
  if (age <= 35) return "26-35";
  if (age <= 50) return "36-50";
  if (age <= 65) return "51-65";
  return "65+";
}

export function bandForIncome(monthlyIncome: number): IncomeBand {
  const band = INCOME_BANDS.find((b) => monthlyIncome >= b.min && monthlyIncome < b.max);
  return band?.id ?? "60k+";
}

/** Categorías de gasto que se comparan. Coinciden con las de `transactions.category`. */
export const BENCHMARK_CATEGORIES = [
  "vivienda",
  "super",
  "transporte",
  "comida",
  "servicios",
  "suscripciones",
  "compras",
  "salud",
  "entretenimiento",
] as const;
export type BenchmarkCategory = (typeof BENCHMARK_CATEGORIES)[number];

/**
 * % del ingreso mensual que en promedio se va a cada categoría. Usado tanto
 * para generar la población sintética de comparación (`seed.ts`) como el
 * gasto variable de un perfil sintético individual (`synthetic/profile.ts`).
 */
export const CATEGORY_PCT: Record<BenchmarkCategory, number> = {
  vivienda: 0.28,
  super: 0.1,
  transporte: 0.07,
  comida: 0.09,
  servicios: 0.05,
  suscripciones: 0.02,
  compras: 0.06,
  salud: 0.04,
  entretenimiento: 0.03,
};

/** Ajustes por edad sobre el % base. Categoría ausente = sin ajuste (1x). */
export const AGE_MULT: Partial<Record<BenchmarkCategory, Record<AgeBand, number>>> = {
  entretenimiento: { "18-25": 1.6, "26-35": 1.2, "36-50": 0.9, "51-65": 0.6, "65+": 0.4 },
  salud: { "18-25": 0.5, "26-35": 0.7, "36-50": 1.0, "51-65": 1.4, "65+": 1.8 },
  vivienda: { "18-25": 0.8, "26-35": 1.1, "36-50": 1.1, "51-65": 0.9, "65+": 0.7 },
};
