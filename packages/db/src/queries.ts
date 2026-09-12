/**
 * Consultas de negocio sobre la base. Las usa el servidor MCP de Banorte.
 * Todo lo que devuelve aquí es dinero real del usuario, no inventado por el LLM.
 */
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "./index";
import { goals, products, transactions, users } from "./schema";

export type SpendingRow = { category: string; total: number; count: number };
export type MerchantRow = { merchant: string; total: number; count: number };

export async function getUser(userId: string) {
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return row ?? null;
}

export async function listUsers() {
  return db.select().from(users);
}

/** Saldo, ingreso mensual y quema promedio de los últimos 3 meses. */
export async function getBalance(userId: string) {
  const user = await getUser(userId);
  if (!user) return null;

  const since = monthsAgo(3);
  const [agg] = await db
    .select({
      gastos: sql<number>`coalesce(sum(case when ${transactions.amount} < 0 then -${transactions.amount} else 0 end), 0)`,
      ingresos: sql<number>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} else 0 end), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.date, since)));

  const gastoMensual = Math.round((agg?.gastos ?? 0) / 3);
  const ingresoMensual = Math.round((agg?.ingresos ?? 0) / 3);

  return {
    userId,
    name: user.name,
    balance: user.balance,
    monthlyIncome: ingresoMensual || user.monthlyIncome,
    monthlySpend: gastoMensual,
    monthlySurplus: (ingresoMensual || user.monthlyIncome) - gastoMensual,
  };
}

export async function getTransactions(userId: string, limit = 40, category?: string) {
  const where = category
    ? and(eq(transactions.userId, userId), eq(transactions.category, category))
    : eq(transactions.userId, userId);

  return db.select().from(transactions).where(where).orderBy(desc(transactions.date)).limit(limit);
}

/** Gasto agrupado por categoría en los últimos N meses. */
export async function analyzeSpending(userId: string, months = 3) {
  const since = monthsAgo(months);

  const byCategory = await db
    .select({
      category: transactions.category,
      total: sql<number>`round(sum(-${transactions.amount}), 2)`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, since),
        sql`${transactions.amount} < 0`,
      ),
    )
    .groupBy(transactions.category)
    .orderBy(sql`sum(-${transactions.amount}) desc`);

  const byMerchant = await db
    .select({
      merchant: transactions.merchant,
      total: sql<number>`round(sum(-${transactions.amount}), 2)`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, since),
        sql`${transactions.amount} < 0`,
      ),
    )
    .groupBy(transactions.merchant)
    .orderBy(sql`sum(-${transactions.amount}) desc`)
    .limit(8);

  const recurring = await db
    .select({
      merchant: transactions.merchant,
      total: sql<number>`round(sum(-${transactions.amount}) / ${months}, 2)`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, since),
        eq(transactions.recurring, true),
      ),
    )
    .groupBy(transactions.merchant)
    .orderBy(sql`sum(-${transactions.amount}) desc`);

  const totalMensual = byCategory.reduce((acc, r) => acc + r.total, 0) / months;

  return {
    months,
    monthlyTotal: Math.round(totalMensual),
    byCategory: byCategory.map((r) => ({ ...r, monthly: Math.round(r.total / months) })),
    topMerchants: byMerchant.map((r) => ({ ...r, monthly: Math.round(r.total / months) })),
    recurring,
  };
}

/** Proyección simple de flujo: cuánto junta si aparta X al mes. */
export async function projectCashflow(userId: string, monthlySave: number, months: number) {
  const bal = await getBalance(userId);
  if (!bal) return null;

  const points: { label: string; value: number }[] = [];
  let acc = bal.balance;
  const start = new Date();

  for (let i = 1; i <= months; i++) {
    acc += monthlySave;
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    points.push({
      label: d.toLocaleDateString("es-MX", { month: "short" }),
      value: Math.round(acc),
    });
  }

  return {
    startingBalance: bal.balance,
    monthlySave,
    months,
    endingBalance: Math.round(acc),
    feasible: monthlySave <= bal.monthlySurplus,
    monthlySurplus: bal.monthlySurplus,
    points,
  };
}

export async function listProducts(kind?: string) {
  const rows = kind
    ? await db.select().from(products).where(eq(products.kind, kind))
    : await db.select().from(products);
  return rows.map((p) => ({ ...p, bullets: JSON.parse(p.bullets) as string[] }));
}

export async function listGoals(userId: string) {
  return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt));
}

export async function createGoal(input: {
  userId: string;
  title: string;
  targetAmount: number;
  monthlyAmount: number;
  deadlineMonths?: number;
}) {
  const [row] = await db
    .insert(goals)
    .values({
      userId: input.userId,
      title: input.title,
      targetAmount: input.targetAmount,
      monthlyAmount: input.monthlyAmount,
      deadlineMonths: input.deadlineMonths ?? null,
      currentAmount: 0,
      status: "activa",
    })
    .returning();
  return row;
}

function monthsAgo(n: number) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - n, d.getDate());
}
