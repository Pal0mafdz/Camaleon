import type { Widget } from "./catalog";

/**
 * Contrato de streaming entre el agente y el lienzo.
 * Viaja como "data parts" del AI SDK v7: escribir el mismo `id` dos veces
 * reconcilia la parte, así que un update = un widget que se re-anima en pantalla.
 */

/** Persistente: cada widget pintado en el lienzo. */
export type WidgetPart = Widget;

/** Efímero (transient): la traza MCP que se muestra en el panel de actividad. */
export type McpActivity = {
  id: string;
  server: "banorte" | "research" | "canvas";
  tool: string;
  status: "running" | "ok" | "error";
  detail?: string;
  ms?: number;
};

/** Efímero: estado de alto nivel para el indicador del command bar. */
export type AgentStatus = {
  phase: "thinking" | "querying" | "painting" | "done";
  label: string;
};

/** Efímero: id de la conversación donde quedó guardado este turno. */
export type ConversationRef = { conversationId: number };

export type CamaleonDataParts = {
  widget: WidgetPart;
  mcp: McpActivity;
  status: AgentStatus;
  conversation: ConversationRef;
};
