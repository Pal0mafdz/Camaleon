import { createMCPClient } from "@ai-sdk/mcp";
import type { McpActivity } from "@camaleon/shared";
import type { ToolSet } from "ai";

/**
 * Clientes MCP del agente.
 *
 * Los dos servidores viven en este mismo proceso (montados en Hono), pero el
 * agente los consume por HTTP streamable igual que consumiría un MCP de un
 * tercero. Es MCP de verdad, no una llamada a función disfrazada.
 */

const PORT = Number(process.env.PORT ?? 3000);
const BASE = `http://127.0.0.1:${PORT}`;

export type McpServerName = "banorte" | "research";

const ENDPOINTS: Record<McpServerName, string> = {
  banorte: `${BASE}/mcp/banorte`,
  research: `${BASE}/mcp/research`,
};

type Client = Awaited<ReturnType<typeof createMCPClient>>;

const clients = new Map<McpServerName, Promise<Client>>();

function client(name: McpServerName): Promise<Client> {
  let existing = clients.get(name);
  if (!existing) {
    existing = createMCPClient({
      transport: { type: "http", url: ENDPOINTS[name] },
      clientName: "camaleon-agent",
    }).catch((err) => {
      clients.delete(name); // Un fallo no debe envenenar el caché.
      throw err;
    });
    clients.set(name, existing);
  }
  return existing;
}

/** Llama una tool MCP directamente (lo usa POST /execute). */
export async function callMcpTool(
  name: McpServerName,
  tool: string,
  args: Record<string, unknown>,
) {
  const c = await client(name);
  return c.callTool({ name: tool, arguments: args });
}

export type TraceFn = (a: McpActivity) => void;

/**
 * Trae las tools de un servidor MCP y las envuelve para que cada llamada
 * emita su traza al panel de actividad. La traza es parte del producto:
 * el usuario ve al agente consultando su banco en vivo.
 */
export async function mcpTools(name: McpServerName, trace: TraceFn): Promise<ToolSet> {
  const raw = (await client(name).then((c) => c.tools())) as ToolSet;
  const wrapped: ToolSet = {};

  for (const [toolName, tool] of Object.entries(raw)) {
    const original = tool.execute;
    if (!original) {
      wrapped[toolName] = tool;
      continue;
    }

    wrapped[toolName] = {
      ...tool,
      execute: async (args: unknown, options: Parameters<typeof original>[1]) => {
        const id = `${name}-${toolName}-${crypto.randomUUID().slice(0, 8)}`;
        const started = Date.now();
        trace({ id, server: name, tool: toolName, status: "running" });
        try {
          const out = await original(args, options);
          trace({ id, server: name, tool: toolName, status: "ok", ms: Date.now() - started });
          return out;
        } catch (err) {
          trace({
            id,
            server: name,
            tool: toolName,
            status: "error",
            ms: Date.now() - started,
            detail: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
      },
    } as ToolSet[string];
  }

  return wrapped;
}
