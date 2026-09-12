/**
 * mcp-research — el servidor MCP que conoce el mundo fuera del banco.
 *
 * El banco sabe cuánto tiene el cliente; no sabe cuánto cuesta un Mazda 3 ni
 * qué pagan los CETES hoy. Esa mitad de la respuesta vive aquí.
 *
 * Estrategia de red: intenta Tavily si hay API key, y si no hay key o la red
 * falla cae al caché de demo. Nunca lanza excepción hacia el agente: una
 * búsqueda fallida devuelve el resultado cacheado o un texto honesto, pero el
 * lienzo jamás se queda a medias por un problema de wifi.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lookupCache } from "./cache";

const TAVILY_URL = "https://api.tavily.com/search";
const TIMEOUT_MS = 6_000;

type TavilyResponse = {
  answer?: string;
  results?: { title?: string; url?: string; content?: string }[];
};

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

/** Búsqueda en vivo. Devuelve null en cualquier falla — el caller decide el fallback. */
async function searchLive(query: string, maxResults: number) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        query,
        max_results: maxResults,
        include_answer: true,
        search_depth: "basic",
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as TavilyResponse;
    return {
      answer: data.answer ?? "",
      results: (data.results ?? []).map((r) => ({
        title: r.title ?? "",
        url: r.url ?? "",
        snippet: (r.content ?? "").slice(0, 400),
      })),
    };
  } catch {
    return null;
  }
}

export function createResearchServer() {
  const server = new McpServer({
    name: "mcp-research",
    version: "1.0.0",
  });

  server.registerTool(
    "search_web",
    {
      title: "Buscar en la web",
      description:
        "Busca información actual fuera del banco: precios de productos, costos de viaje, tasas de mercado, requisitos de trámites. Úsalo SIEMPRE que la pregunta mencione algo con un precio del mundo real (un coche, un viaje, una universidad) en vez de estimarlo tú. Devuelve una respuesta resumida y las fuentes.",
      inputSchema: {
        query: z
          .string()
          .describe(
            "Consulta en español, específica y con contexto mexicano. Ejemplo: 'precio Mazda 3 2026 México'.",
          ),
        maxResults: z
          .number()
          .int()
          .min(1)
          .max(8)
          .optional()
          .describe("Cuántas fuentes traer. Default 4."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ query, maxResults }) => {
      const live = await searchLive(query, maxResults ?? 4);
      if (live && live.results.length > 0) return json({ ...live, source: "live", query });

      const cached = lookupCache(query);
      if (cached)
        return json({ answer: cached.answer, results: cached.results, source: "cache", query });

      return json({
        answer: "",
        results: [],
        source: "none",
        query,
        note: "No hay resultados disponibles. Responde con lo que sepas y di explícitamente que el dato es aproximado.",
      });
    },
  );

  server.registerTool(
    "fetch_page",
    {
      title: "Leer una página",
      description:
        "Descarga una página web y devuelve su texto plano. Úsalo cuando search_web te dio una URL prometedora y necesitas el detalle completo, por ejemplo la tabla de versiones y precios de un auto.",
      inputSchema: {
        url: z.url().describe("URL completa, incluyendo https://"),
        maxChars: z
          .number()
          .int()
          .min(500)
          .max(20_000)
          .optional()
          .describe("Máximo de caracteres a devolver. Default 6000."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ url, maxChars }) => {
      try {
        const res = await fetch(url, {
          headers: { "user-agent": "Mozilla/5.0 (compatible; Camaleon/1.0)" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) return json({ url, text: "", error: `El servidor respondió ${res.status}.` });

        const html = await res.text();
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/\s+/g, " ")
          .trim();

        return json({ url, text: text.slice(0, maxChars ?? 6_000) });
      } catch {
        return json({
          url,
          text: "",
          error: "No se pudo leer la página. Usa lo que ya tengas de search_web.",
        });
      }
    },
  );

  return server;
}
