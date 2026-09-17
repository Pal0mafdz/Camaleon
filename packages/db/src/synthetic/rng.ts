/**
 * PRNG determinista y generador de movimientos mensuales, compartidos entre
 * `seed.ts` (perfiles demo curados a mano) y `synthetic/profile.ts` (perfiles
 * generados para usuarios reales). Vivir en un solo lugar evita que ambos
 * mundos diverjan en cómo se "tira el dado".
 */
import type { transactions } from "../schema";

/** PRNG determinista: la misma semilla siempre produce la misma secuencia. */
export function makeRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

/** Flotante uniforme en [min, max], redondeado a 2 decimales. */
export function pick(rand: () => number, min: number, max: number) {
  return Math.round((min + rand() * (max - min)) * 100) / 100;
}

/** Elemento uniforme al azar de una lista no vacía. */
export function pickOne<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)] as T;
}

export type Seed = {
  merchant: string;
  category: string;
  amount: number;
  method?: string;
  recurring?: boolean;
  /** Día del mes en el que cae. */
  day: number;
};

export type Variable = {
  merchant: string;
  category: string;
  min: number;
  max: number;
  perMonth: number;
  method?: string;
};

type Row = typeof transactions.$inferInsert;

/** Genera N meses de movimientos (fijos idénticos + variables muestreados). */
export function buildMonths(
  rand: () => number,
  userId: string,
  fijos: Seed[],
  variables: Variable[],
  months: number,
): Row[] {
  const rows: Row[] = [];
  const today = new Date();

  for (let back = months - 1; back >= 0; back--) {
    const base = new Date(today.getFullYear(), today.getMonth() - back, 1);
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();

    for (const f of fijos) {
      rows.push({
        userId,
        date: new Date(base.getFullYear(), base.getMonth(), Math.min(f.day, daysInMonth), 9, 30),
        merchant: f.merchant,
        category: f.category,
        amount: f.amount,
        method: f.method ?? "debito",
        recurring: f.recurring ?? false,
      });
    }

    for (const v of variables) {
      for (let i = 0; i < v.perMonth; i++) {
        const day = 1 + Math.floor(rand() * daysInMonth);
        rows.push({
          userId,
          date: new Date(
            base.getFullYear(),
            base.getMonth(),
            day,
            8 + Math.floor(rand() * 13),
            Math.floor(rand() * 60),
          ),
          merchant: v.merchant,
          category: v.category,
          amount: -pick(rand, v.min, v.max),
          method: v.method ?? "debito",
          recurring: false,
        });
      }
    }
  }

  return rows.sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime());
}
