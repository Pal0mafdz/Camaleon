/**
 * mcp-banorte — el servidor MCP que expone el dinero del cliente.
 *
 * Es un servidor MCP de verdad (@modelcontextprotocol/sdk): el agente no lee la
 * base de datos, le pregunta a este servidor por el protocolo. Cada tool corre
 * SQL real contra Drizzle, no datos inventados.
 *
 * Se monta sobre streamable HTTP dentro de Hono (ver apps/server).
 */
import {
  analyzeSpending,
  createGoal,
  getBalance,
  getTransactions,
  listGoals,
  listProducts,
  projectCashflow,
} from "@camaleon/db/queries";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/** El SDK espera un "raw shape" (objeto plano de validadores), no un z.object. */
const userId = z.string().describe("Identificador del cliente, por ejemplo 'karla' o 'roberto'");

/** Serializa cualquier resultado como texto JSON: es lo que el modelo termina leyendo. */
function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

function notFound(what: string) {
  return { content: [{ type: "text" as const, text: `No encontré ${what}.` }], isError: true };
}

/**
 * Sistema de amortización francés: la mensualidad que deja el crédito en cero
 * exactamente al final del plazo.
 */
function monthlyPayment(principal: number, annualRatePct: number, months: number) {
  if (months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  const factor = (1 + r) ** months;
  return (principal * r * factor) / (factor - 1);
}

export function createBanorteServer() {
  const server = new McpServer({
    name: "mcp-banorte",
    version: "1.0.0",
  });

  server.registerTool(
    "get_balance",
    {
      title: "Consultar saldo",
      description:
        "Saldo actual del cliente más su ingreso, gasto y superávit mensual promedio de los últimos 3 meses. Empieza SIEMPRE por aquí: sin saber cuánto le sobra al mes no puedes responder si algo le alcanza.",
      inputSchema: { userId },
    },
    async ({ userId: uid }) => {
      const data = await getBalance(uid);
      return data ? json(data) : notFound(`al cliente ${uid}`);
    },
  );

  server.registerTool(
    "get_transactions",
    {
      title: "Listar movimientos",
      description:
        "Movimientos recientes del cliente, del más nuevo al más viejo. Montos negativos son gastos y positivos son ingresos. Úsalo cuando necesites evidencia concreta ('¿en qué gasté?'), no para sacar totales: para eso está analyze_spending.",
      inputSchema: {
        userId,
        limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe("Cuántos movimientos traer. Default 40."),
        category: z
          .string()
          .optional()
          .describe(
            "Filtra por categoría: comida, super, transporte, vivienda, servicios, suscripciones, compras, salud, entretenimiento, ingreso.",
          ),
      },
    },
    async ({ userId: uid, limit, category }) =>
      json(await getTransactions(uid, limit ?? 40, category)),
  );

  server.registerTool(
    "analyze_spending",
    {
      title: "Analizar gastos",
      description:
        "Desglose del gasto por categoría, comercios donde más se va el dinero y cargos recurrentes, promediado por mes. Esta es la tool que encuentra las fugas: úsala para responder '¿a dónde se me va el dinero?' y para proponer de dónde recortar cuando algo no alcanza.",
      inputSchema: {
        userId,
        months: z
          .number()
          .int()
          .min(1)
          .max(6)
          .optional()
          .describe("Meses hacia atrás a analizar. Default 3."),
      },
    },
    async ({ userId: uid, months }) => json(await analyzeSpending(uid, months ?? 3)),
  );

  server.registerTool(
    "project_cashflow",
    {
      title: "Proyectar ahorro",
      description:
        "Proyecta el saldo del cliente si guarda cierta cantidad cada mes durante N meses. Devuelve el saldo final, si es factible con su superávit real, y la serie mensual lista para graficar. Úsalo para convertir una meta vaga en una fecha concreta.",
      inputSchema: {
        userId,
        monthlySave: z.number().min(0).describe("Cuánto guardaría cada mes, en pesos."),
        months: z.number().int().min(1).max(120).describe("Horizonte en meses."),
      },
    },
    async ({ userId: uid, monthlySave, months }) => {
      const data = await projectCashflow(uid, monthlySave, months);
      return data ? json(data) : notFound(`al cliente ${uid}`);
    },
  );

  server.registerTool(
    "simulate_loan",
    {
      title: "Simular crédito",
      description:
        "Calcula la mensualidad de un crédito Banorte para un precio, enganche y plazo dados. Si no pasas productId usa el crédito de auto. Devuelve también cuánto se paga de intereses en total: eso es lo que hace la decisión honesta.",
      inputSchema: {
        price: z.number().min(1).describe("Precio total del bien, en pesos."),
        downPayment: z.number().min(0).describe("Enganche, en pesos."),
        termMonths: z.number().int().min(6).max(360).describe("Plazo en meses."),
        productId: z
          .string()
          .optional()
          .describe(
            "ID del producto: credito-auto, credito-auto-nomina, hipoteca, credito-personal. Default credito-auto.",
          ),
      },
    },
    async ({ price, downPayment, termMonths, productId }) => {
      const all = await listProducts();
      const product = all.find((p) => p.id === (productId ?? "credito-auto"));
      if (!product) return notFound(`el producto ${productId}`);

      if (product.annualRatePct == null) return notFound(`la tasa de ${product.id}`);

      const principal = Math.max(0, price - downPayment);
      const payment = monthlyPayment(principal, product.annualRatePct, termMonths);
      const totalPaid = payment * termMonths;

      return json({
        product: { id: product.id, name: product.name, annualRatePct: product.annualRatePct },
        price,
        downPayment,
        downPaymentPct: Math.round((downPayment / price) * 1000) / 10,
        principal,
        termMonths,
        monthlyPayment: Math.round(payment),
        totalPaid: Math.round(totalPaid),
        totalInterest: Math.round(totalPaid - principal),
      });
    },
  );

  server.registerTool(
    "get_products",
    {
      title: "Catálogo Banorte",
      description:
        "Productos de Banorte disponibles con su tasa real. Consúltalo antes de recomendar cualquier crédito o inversión: nunca inventes tasas ni nombres de productos.",
      inputSchema: {
        kind: z
          .string()
          .optional()
          .describe("Filtra por tipo: credito_auto, inversion, hipoteca, credito_personal."),
      },
    },
    async ({ kind }) => json(await listProducts(kind)),
  );

  server.registerTool(
    "get_goals",
    {
      title: "Metas del cliente",
      description:
        "Metas de ahorro que el cliente ya tiene abiertas, con lo que lleva acumulado. Revísalas antes de proponer una nueva: puede que ya exista.",
      inputSchema: { userId },
    },
    async ({ userId: uid }) => json(await listGoals(uid)),
  );

  server.registerTool(
    "create_savings_goal",
    {
      title: "Crear meta de ahorro",
      description:
        "EJECUTA una acción real: abre una meta de ahorro en la cuenta del cliente. No la llames por tu cuenta para 'mostrar' algo — propón la meta con un widget de acción y deja que el cliente confirme. El agente propone, el cliente dispone.",
      inputSchema: {
        userId,
        title: z.string().describe("Nombre de la meta, en español, como lo diría el cliente."),
        targetAmount: z.number().min(1).describe("Monto objetivo en pesos."),
        monthlyAmount: z.number().min(0).describe("Aportación mensual en pesos."),
        deadlineMonths: z.number().int().min(1).max(240).optional().describe("Plazo en meses."),
      },
      annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ userId: uid, title, targetAmount, monthlyAmount, deadlineMonths }) =>
      json(await createGoal({ userId: uid, title, targetAmount, monthlyAmount, deadlineMonths })),
  );

  return server;
}
