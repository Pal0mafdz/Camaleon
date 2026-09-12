import { env } from "@camaleon/env/web";
import type { Widget } from "@camaleon/shared";

/**
 * Cliente REST de la capa persistente (metas, planes, historial).
 *
 * El stream del agente vive en `canvas/agent.ts`; aquí solo hay peticiones
 * cortas de lectura/escritura. El servidor (`apps/server/src/index.ts`) es el
 * dueño del contrato: estos tipos son su espejo, no una validación paralela.
 */

export type GoalStatus = "activa" | "pausada" | "completada";

export type Goal = {
  id: number;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyAmount: number;
  deadlineMonths: number | null;
  status: GoalStatus;
  createdAt: string;
};

export type NewGoal = {
  userId: string;
  title: string;
  targetAmount: number;
  monthlyAmount: number;
  deadlineMonths?: number;
};

/** Snapshot de un lienzo guardado por el agente. Se puede volver a pintar. */
export type Plan = {
  id: number;
  userId: string;
  title: string;
  question: string;
  widgets: Widget[];
  createdAt: string;
};

export type ConversationSummary = {
  id: number;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ConversationTurn = {
  id: number;
  conversationId: number;
  question: string;
  widgets: Widget[];
  createdAt: string;
};

export type Conversation = ConversationSummary & { messages: ConversationTurn[] };

/**
 * Única puerta de red de esta capa. El mensaje de error ya sale en español:
 * las pantallas lo pintan tal cual, sin traducir códigos.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.VITE_SERVER_URL}${path}`, init);
  } catch {
    throw new Error("No pude contactar al servidor");
  }
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
  // Frontera de confianza: del otro lado está nuestro propio servidor tipado.
  return (await res.json()) as T;
}

function body(method: "POST" | "PATCH", payload: unknown): RequestInit {
  return {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  };
}

export function listGoals(userId: string): Promise<Goal[]> {
  return request<Goal[]>(`/goals/${userId}`);
}

export function createGoal(input: NewGoal): Promise<Goal> {
  return request<Goal>("/goals", body("POST", input));
}

export function patchGoal(
  id: number,
  patch: { userId: string; status: GoalStatus },
): Promise<Goal> {
  return request<Goal>(`/goals/${id}`, body("PATCH", patch));
}

export function listPlans(userId: string): Promise<Plan[]> {
  return request<Plan[]>(`/plans/${userId}`);
}

export function listConversations(userId: string): Promise<ConversationSummary[]> {
  return request<ConversationSummary[]>(`/conversations/${userId}`);
}

export function getConversation(userId: string, id: number): Promise<Conversation> {
  return request<Conversation>(`/conversations/${userId}/${id}`);
}

/**
 * Aplana los turnos de una conversación en un solo lienzo.
 *
 * Se recorre en orden y se hace upsert por id: un widget que el agente volvió a
 * pintar en un turno posterior conserva su POSICIÓN original con el DATO nuevo.
 * Es la misma regla que usa `upsertWidget` en vivo, aplicada al historial.
 */
export function flattenTurns(turns: ConversationTurn[]): Widget[] {
  const out: Widget[] = [];
  const seen = new Map<string, number>();

  for (const turn of turns) {
    for (const widget of turn.widgets) {
      const at = seen.get(widget.id);
      if (at === undefined) {
        seen.set(widget.id, out.length);
        out.push(widget);
      } else {
        out[at] = widget;
      }
    }
  }

  return out;
}
