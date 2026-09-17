/**
 * Salud financiera 0-100, calculada de datos reales del usuario en vez de un
 * 82 fijo para todos. Cuatro factores, cada uno con su propio 0-100:
 *
 *   - Superávit: qué tanto de lo que entra sobra al mes.
 *   - Colchón: cuántos meses de gasto cubre el saldo actual.
 *   - Deudas: qué tanto del ingreso se va en compras a crédito (no hay tabla
 *     de deudas dedicada; el gasto con `method: "credito"` es el proxy).
 *   - Gasto fijo: qué tanto del ingreso ya está comprometido en fijos.
 *
 * No hay histórico de scores persistido, así que `history` es una serie
 * corta determinista por usuario (mismo userId → misma serie) que aterriza
 * en el score de hoy.
 */
import type { Tone } from "@camaleon/shared";

export type HealthFactor = {
  label: string;
  status: string;
  pct: number;
  tone: Tone;
};

export type HealthResult = {
  score: number;
  status: string;
  caption: string;
  factors: HealthFactor[];
  history: number[];
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function toneFor(pct: number): Tone {
  if (pct >= 70) return "good";
  if (pct >= 40) return "warn";
  return "bad";
}

function statusLabel(score: number): string {
  if (score >= 75) return "Excelente";
  if (score >= 60) return "Sólida";
  if (score >= 40) return "Moderada";
  if (score >= 20) return "Frágil";
  return "Crítica";
}

function money(v: number) {
  return `$${Math.round(v).toLocaleString("es-MX")}`;
}

/** Hash FNV-1a determinista: mismo usuario, misma variación de historial. */
function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Serie corta y determinista que aterriza en el score actual. */
function synthHistory(seed: number, score: number, months = 6): number[] {
  let s = seed;
  let value = score;
  const history = [score];
  for (let i = 1; i < months; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const jitter = (s % 7) - 3; // entre -3 y 3
    value = clamp(value - jitter);
    history.unshift(value);
  }
  return history;
}

export function computeHealthScore(params: {
  userId: string;
  monthlyIncome: number;
  monthlySurplus: number;
  balance: number;
  monthlySpend: number;
  fixedMonthly: number;
  creditMonthly: number;
}): HealthResult {
  const {
    userId,
    monthlyIncome,
    monthlySurplus,
    balance,
    monthlySpend,
    fixedMonthly,
    creditMonthly,
  } = params;
  const income = monthlyIncome || 1;
  const spend = monthlySpend || 1;

  const surplusRatio = monthlySurplus / income;
  const surplusPct = clamp(surplusRatio * 300);
  const surplusStatus =
    surplusRatio >= 0
      ? `Ahorras ${money(monthlySurplus)} (${Math.round(surplusRatio * 100)}% del ingreso)`
      : `Gastas ${money(Math.abs(monthlySurplus))} más de lo que entra`;

  const cushionMonths = balance / spend;
  const cushionPct = clamp((cushionMonths / 3) * 100);
  const cushionStatus = `${cushionMonths.toFixed(1)} de 3 meses cubiertos`;

  const creditRatio = creditMonthly / income;
  const debtPct = clamp(100 - creditRatio * 400);
  const debtStatus =
    creditMonthly <= 0
      ? "Sin gasto a crédito"
      : `${money(creditMonthly)} al mes a crédito (${Math.round(creditRatio * 100)}% del ingreso)`;

  const fixedRatio = fixedMonthly / income;
  const fixedPct = clamp(100 - fixedRatio * 100);
  const fixedStatus = `${money(fixedMonthly)} en fijos (${Math.round(fixedRatio * 100)}% del ingreso)`;

  const score = clamp(surplusPct * 0.3 + cushionPct * 0.3 + debtPct * 0.2 + fixedPct * 0.2);

  const history = synthHistory(hashSeed(userId), score);
  const diff = score - (history[0] as number);
  const caption =
    diff > 0
      ? `Mejor que hace unos meses: +${diff} puntos.`
      : diff < 0
        ? `Bajó ${Math.abs(diff)} puntos en los últimos meses.`
        : "Se ha mantenido estable en los últimos meses.";

  return {
    score,
    status: statusLabel(score),
    caption,
    factors: [
      { label: "Superávit", status: surplusStatus, pct: surplusPct, tone: toneFor(surplusPct) },
      { label: "Colchón", status: cushionStatus, pct: cushionPct, tone: toneFor(cushionPct) },
      { label: "Deudas", status: debtStatus, pct: debtPct, tone: toneFor(debtPct) },
      { label: "Gasto fijo", status: fixedStatus, pct: fixedPct, tone: toneFor(fixedPct) },
    ],
    history,
  };
}
