import { env } from "@camaleon/env/web";
import type { AgentStatus, McpActivity, Widget } from "@camaleon/shared";

/** Partes que el servidor emite en el stream (protocolo UI Message Stream de AI SDK v7). */
type StreamPart =
  | { type: "data-widget"; id?: string; data: Widget }
  | { type: "data-mcp"; id?: string; data: McpActivity }
  | { type: "data-status"; id?: string; data: AgentStatus }
  | { type: string; [k: string]: unknown };

export type AgentHandlers = {
  onWidget: (w: Widget) => void;
  onMcp: (a: McpActivity) => void;
  onStatus: (s: AgentStatus | null) => void;
  onError?: (message: string) => void;
};

export type AskInput = {
  question: string;
  userId: string;
  /** Qué hay pintado ahora mismo: el agente decide si añade o reemplaza. */
  canvas: { id: string; type: string }[];
  signal?: AbortSignal;
};

/**
 * Lector de SSE hecho a mano.
 *
 * No usamos `useChat` a propósito: el estado del lienzo vive en Zustand y las
 * partes llegan como eventos, no como mensajes. 40 líneas nos dan control total
 * y cero acoplamiento a la versión del cliente del SDK.
 *
 * Si `/converse` no pinta nada (sin API key, o el modelo falla), caemos al
 * guión de `/demo`: mismos datos reales de la base, razonamiento pre-escrito.
 * El lienzo nunca se queda vacío.
 */
export async function ask(input: AskInput, h: AgentHandlers): Promise<void> {
  const painted = await run("/converse", input, h);
  if (painted === 0) await run("/demo", input, h);
  h.onStatus(null);
}

/** Devuelve cuántos widgets pintó. 0 = el lienzo se quedaría vacío. */
async function run(path: string, input: AskInput, h: AgentHandlers): Promise<number> {
  let painted = 0;
  const counting: AgentHandlers = {
    ...h,
    onWidget: (w) => {
      painted++;
      h.onWidget(w);
    },
    // El error de /converse no se muestra: lo cubre el guión de respaldo.
    onError: path === "/converse" ? undefined : h.onError,
  };

  let res: Response;
  try {
    res = await fetch(`${env.VITE_SERVER_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: input.question,
        userId: input.userId,
        canvas: input.canvas,
      }),
      signal: input.signal,
    });
  } catch (_err) {
    if (input.signal?.aborted) return 1; // Cancelado a propósito: no hay respaldo.
    if (path !== "/converse") h.onError?.("No pude contactar al servidor");
    return 0;
  }

  if (!res.ok || !res.body) {
    if (path !== "/converse") h.onError?.(`El agente respondió ${res.status}`);
    return 0;
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;

    // Los frames SSE se separan por una línea en blanco.
    let sep = buffer.indexOf("\n\n");
    while (sep !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      dispatch(frame, counting);
      sep = buffer.indexOf("\n\n");
    }
  }

  return painted;
}

function dispatch(frame: string, h: AgentHandlers) {
  for (const line of frame.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;

    let part: StreamPart;
    try {
      part = JSON.parse(payload);
    } catch {
      continue; // Un frame roto no tumba el lienzo.
    }

    switch (part.type) {
      case "data-widget":
        h.onWidget((part as { data: Widget }).data);
        break;
      case "data-mcp":
        h.onMcp((part as { data: McpActivity }).data);
        break;
      case "data-status":
        h.onStatus((part as { data: AgentStatus }).data);
        break;
      case "error":
        h.onError?.(String((part as { errorText?: string }).errorText ?? "Algo falló"));
        break;
      default:
        break;
    }
  }
}
