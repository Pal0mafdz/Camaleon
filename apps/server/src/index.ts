import { google } from "@ai-sdk/google";
import { env } from "@camaleon/env/server";
import { createBanorteServer } from "@camaleon/mcp-banorte";
import { createResearchServer } from "@camaleon/mcp-research";
import type { AgentStatus, CamaleonDataParts, McpActivity, Widget } from "@camaleon/shared";
import { StreamableHTTPTransport } from "@hono/mcp";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { buildScript, pickScript } from "./demo";
import { callMcpTool, mcpTools } from "./mcp";
import { systemPrompt } from "./prompt";
import { widgetTools } from "./widgets";

type CamaleonMessage = UIMessage<never, CamaleonDataParts>;

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["content-type", "accept", "mcp-session-id", "mcp-protocol-version"],
    exposeHeaders: ["mcp-session-id"],
  }),
);

/* ------------------------------------------------------------------ */
/* Servidores MCP montados por HTTP streamable                         */
/* ------------------------------------------------------------------ */

const banorte = createBanorteServer();
const research = createResearchServer();
const banorteTransport = new StreamableHTTPTransport();
const researchTransport = new StreamableHTTPTransport();

app.all("/mcp/banorte", async (c) => {
  if (!banorte.isConnected()) await banorte.connect(banorteTransport);
  return banorteTransport.handleRequest(c);
});

app.all("/mcp/research", async (c) => {
  if (!research.isConnected()) await research.connect(researchTransport);
  return researchTransport.handleRequest(c);
});

/* ------------------------------------------------------------------ */
/* POST /converse — el agente construye la interfaz                    */
/* ------------------------------------------------------------------ */

app.post("/converse", async (c) => {
  const body = (await c.req.json()) as {
    question?: string;
    userId?: string;
    canvas?: { id: string; type: string }[];
  };

  const question = body.question?.trim();
  const userId = body.userId ?? "karla";
  const canvas = body.canvas ?? [];

  if (!question) return c.json({ error: "Falta la pregunta" }, 400);

  const stream = createUIMessageStream<CamaleonMessage>({
    execute: async ({ writer }) => {
      const status = (s: AgentStatus) =>
        writer.write({ type: "data-status", data: s, transient: true });
      const trace = (a: McpActivity) =>
        writer.write({ type: "data-mcp", id: a.id, data: a, transient: true });
      const paint = (w: Widget) => {
        status({ phase: "painting", label: "Dibujando…" });
        writer.write({ type: "data-widget", id: w.id, data: w });
      };

      status({ phase: "thinking", label: "Pensando…" });

      // El agente descubre sus herramientas por MCP, en vivo.
      const [banorteTools, researchTools] = await Promise.all([
        mcpTools("banorte", trace),
        mcpTools("research", trace),
      ]);

      status({ phase: "querying", label: "Consultando tu banco…" });

      const result = streamText({
        model: google("gemini-2.5-flash"),
        system: systemPrompt(userId, canvas),
        prompt: question,
        tools: { ...banorteTools, ...researchTools, ...widgetTools(paint) },
        stopWhen: stepCountIs(14),
      });

      await result.consumeStream({
        onError: (err) => {
          console.error("[converse]", err);
          writer.write({
            type: "data-status",
            data: { phase: "done", label: "Algo falló" },
            transient: true,
          });
        },
      });
    },
    onError: (err) => {
      console.error("[converse:stream]", err);
      return "El agente tropezó. Intenta de nuevo.";
    },
  });

  return createUIMessageStreamResponse({ stream });
});

/* ------------------------------------------------------------------ */
/* POST /demo — guión con datos reales, sin LLM                        */
/* ------------------------------------------------------------------ */

app.post("/demo", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    question?: string;
    userId?: string;
  };

  const userId = body.userId ?? "karla";
  const script = await buildScript(pickScript(body.question ?? ""), userId);

  const stream = createUIMessageStream<CamaleonMessage>({
    execute: async ({ writer }) => {
      for (const step of script.steps) {
        if (step.kind === "status") {
          writer.write({
            type: "data-status",
            data: { phase: step.phase, label: step.label },
            transient: true,
          });
        } else if (step.kind === "mcp") {
          writer.write({
            type: "data-mcp",
            id: step.activity.id,
            data: step.activity,
            transient: true,
          });
        } else {
          writer.write({ type: "data-widget", id: step.widget.id, data: step.widget });
        }

        if (step.wait > 0) await sleep(step.wait);
      }
    },
    onError: (err) => {
      console.error("[demo]", err);
      return "El guión tropezó.";
    },
  });

  return createUIMessageStreamResponse({ stream });
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* POST /execute — "el agente propone, el cliente dispone"             */
/* ------------------------------------------------------------------ */

const EXECUTABLE = new Set(["create_savings_goal"]);

app.post("/execute", async (c) => {
  const { tool, args } = (await c.req.json()) as {
    tool?: string;
    args?: Record<string, unknown>;
  };

  if (!tool || !EXECUTABLE.has(tool)) {
    return c.json({ error: `La acción "${tool}" no está permitida` }, 400);
  }

  try {
    const out = await callMcpTool("banorte", tool, args ?? {});
    const content = (out.content ?? []) as { type: string; text?: string }[];
    const text = content.find((p) => p.type === "text")?.text;
    return c.json({ ok: !out.isError, result: text ? JSON.parse(text) : null });
  } catch (err) {
    console.error("[execute]", err);
    return c.json({ error: err instanceof Error ? err.message : "Falló la ejecución" }, 500);
  }
});

app.get("/", (c) => c.text("OK"));

// idleTimeout: el agente encadena varias tools MCP antes de pintar; el default
// de Bun (10s) cortaría el stream a media conversación.
export default {
  port: Number(process.env.PORT ?? 3000),
  idleTimeout: 255,
  fetch: app.fetch,
};
