import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const users = sqliteTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  age: integer().notNull(),
  occupation: text().notNull(),
  /** Ingreso mensual neto en MXN. */
  monthlyIncome: real().notNull(),
  /** Saldo actual de la cuenta de nómina en MXN. */
  balance: real().notNull(),
  /** Modo de presentación: "estandar" | "simple" (Don Roberto). */
  uiMode: text().notNull().default("estandar"),
  /** Preferencia de tema: "claro" | "oscuro". La app hoy solo pinta claro. */
  theme: text().notNull().default("claro"),
  notificationsEnabled: integer({ mode: "boolean" }).notNull().default(true),
  createdAt: integer({ mode: "timestamp_ms" }).default(now).notNull(),
});

/** Sesión simple: el token opaco ES el id de la fila. Sin JWT, sin firma. */
export const sessions = sqliteTable("sessions", {
  token: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id),
  createdAt: integer({ mode: "timestamp_ms" }).default(now).notNull(),
  expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
});

/** Movimientos de la cuenta. Es la fuente de verdad del MCP de Banorte. */
export const transactions = sqliteTable("transactions", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: text()
    .notNull()
    .references(() => users.id),
  /** Fecha del movimiento (epoch ms). */
  date: integer({ mode: "timestamp_ms" }).notNull(),
  merchant: text().notNull(),
  /** Categoría normalizada: vivienda, super, transporte, comida, etc. */
  category: text().notNull(),
  /** Negativo = gasto, positivo = ingreso. MXN. */
  amount: real().notNull(),
  /** "debito" | "credito" | "transferencia" | "nomina" */
  method: text().notNull().default("debito"),
  /** 1 cuando es un cargo que se repite cada mes (suscripciones, renta). */
  recurring: integer({ mode: "boolean" }).notNull().default(false),
});

/** Metas de ahorro creadas por el agente (el botón de acción del lienzo). */
export const goals = sqliteTable("goals", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: text()
    .notNull()
    .references(() => users.id),
  title: text().notNull(),
  targetAmount: real().notNull(),
  currentAmount: real().notNull().default(0),
  monthlyAmount: real().notNull().default(0),
  deadlineMonths: integer(),
  /** "activa" | "pausada" | "completada" */
  status: text().notNull().default("activa"),
  createdAt: integer({ mode: "timestamp_ms" }).default(now).notNull(),
});

/** Snapshot→App: un lienzo guardado se vuelve una mini-app del usuario. */
export const plans = sqliteTable("plans", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: text()
    .notNull()
    .references(() => users.id),
  title: text().notNull(),
  question: text().notNull(),
  /** JSON serializado: Widget[] del lienzo. */
  widgets: text().notNull(),
  createdAt: integer({ mode: "timestamp_ms" }).default(now).notNull(),
});

/** Catálogo de productos Banorte para el cross-sell del agente. */
export const products = sqliteTable("products", {
  id: text().primaryKey(),
  /** "credito_auto" | "hipoteca" | "inversion" | "credito_personal" | "seguro" */
  kind: text().notNull(),
  name: text().notNull(),
  headline: text().notNull(),
  /** Tasa anual en porcentaje. */
  annualRatePct: real(),
  minAmount: real(),
  maxAmount: real(),
  /** JSON serializado: string[] con los beneficios. */
  bullets: text().notNull(),
});

/**
 * Percentiles de gasto de una población sintética (miles de perfiles
 * generados en `seed.ts`), agregados por banda de edad + ingreso + categoría.
 * No son datos de terceros reales: es lo que le da al asesor con quién
 * comparar a un cliente ("gastas más que el 72% de gente como tú").
 */
export const peerBenchmarks = sqliteTable("peer_benchmarks", {
  id: integer().primaryKey({ autoIncrement: true }),
  ageBand: text().notNull(),
  incomeBand: text().notNull(),
  category: text().notNull(),
  p25: real().notNull(),
  p50: real().notNull(),
  p75: real().notNull(),
  sampleSize: integer().notNull(),
});

/** Una charla con el asesor: agrupa turnos y el lienzo resultante. */
export const conversations = sqliteTable("conversations", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: text()
    .notNull()
    .references(() => users.id),
  /** Primer pregunta del usuario; sirve de título en el historial. */
  title: text().notNull(),
  createdAt: integer({ mode: "timestamp_ms" }).default(now).notNull(),
  updatedAt: integer({ mode: "timestamp_ms" }).default(now).notNull(),
});

/** Cada turno: la pregunta y los widgets que pintó el agente. */
export const messages = sqliteTable("messages", {
  id: integer().primaryKey({ autoIncrement: true }),
  conversationId: integer()
    .notNull()
    .references(() => conversations.id),
  question: text().notNull(),
  /** JSON serializado: Widget[] pintados en este turno. */
  widgets: text().notNull(),
  createdAt: integer({ mode: "timestamp_ms" }).default(now).notNull(),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type PeerBenchmark = typeof peerBenchmarks.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Product = typeof products.$inferSelect;
