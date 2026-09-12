import { env } from "@camaleon/env/web";
import type { AgentStatus, ConversationRef, McpActivity, Widget } from "@camaleon/shared";

/** Partes que el servidor emite en el stream (protocolo UI Message Stream de AI SDK v7). */
type StreamPart =
  | { type: "data-widget"; id?: string; data: Widget }
  | { type: "data-mcp"; id?: string; data: McpActivity }
  | { type: "data-status"; id?: string; data: AgentStatus }
  | { type: "data-conversation"; id?: string; data: ConversationRef }
  | { type: string; [k: string]: unknown };

export type AgentHandlers = {
  onWidget: (w: Widget) => void;
  onMcp: (a: McpActivity) => void;
  onStatus: (s: AgentStatus | null) => void;
  onError?: (message: string) => void;
  /** El servidor avisa en qué charla quedó guardado el turno. */
  onConversation?: (conversationId: number) => void;
};

export type AskInput = {
  question: string;
  userId: string;
  /** Qué hay pintado ahora mismo: el agente decide si añade o reemplaza. */
  canvas: { id: string; type: string }[];
  /** Charla a la que se encadena este turno. `null` abre una nueva. */
  conversationId?: number | null;
  signal?: AbortSignal;
};

/**
 * Lector de SSE hecho a mano.
 *
 * No usamos `useChat` a propósito: el estado del lienzo vive en Zustand y las
 * partes llegan como eventos, no como mensajes. 40 líneas nos dan control total
 * y cero acoplamiento a la versión del cliente del SDK.
 *
 * El agente real (`/converse`) es la única fuente. El guión de `/demo` solo se
 * usa si la URL trae `?demo=1` (presentaciones sin red o sin API key).
 * Un error de `/converse` se muestra tal cual: nunca se enmascara con un guión.
 */
const DEMO_MODE = new URLSearchParams(window.location.search).get("demo") === "1";

export async function ask(input: AskInput, h: AgentHandlers): Promise<void> {
  // "inicio" es la señal de apertura: el home sale de la BD, sin LLM.
  const path = input.question.trim() === "inicio" ? "/home" : DEMO_MODE ? "/demo" : "/converse";
  const painted = await run(path, input, h);
  if (painted === 0 && !input.signal?.aborted) {
    h.onError?.("El asesor no generó respuesta. Intenta de nuevo.");
  }
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
        conversationId: input.conversationId ?? null,
      }),
      signal: input.signal,
    });
  } catch (_err) {
    if (input.signal?.aborted) return 1; // Cancelado a propósito.
    h.onError?.("No pude contactar al servidor");
    return 1; // Ya se reportó el error.
  }

  if (!res.ok || !res.body) {
    h.onError?.(`El agente respondió ${res.status}`);
    return 1;
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
      case "data-conversation":
        h.onConversation?.((part as { data: ConversationRef }).data.conversationId);
        break;
      case "error":
        h.onError?.(String((part as { errorText?: string }).errorText ?? "Algo falló"));
        break;
      default:
        break;
    }
  }
}
