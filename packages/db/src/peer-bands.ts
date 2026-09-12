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
