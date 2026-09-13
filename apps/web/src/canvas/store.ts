import type { AgentStatus, McpActivity, Widget } from "@camaleon/shared";
import { create } from "zustand";

/** Las seis pestañas de la app. `inicio` y `asesor` comparten el lienzo. */
export type Tab = "inicio" | "asesor" | "metas" | "cuenta" | "historial" | "ajustes";

type CanvasState = {
  widgets: Widget[];
  mcp: McpActivity[];
  status: AgentStatus | null;
  /** Overrides locales de props (sliders, chips) — no vuelven al agente. */
  locals: Record<string, Record<string, unknown>>;
  panelOpen: boolean;
  /** Turno de conversación actual. Cada pregunta abre uno nuevo. */
  turn: number;
  /** En qué turno se pintó por última vez cada widget. */
  widgetTurn: Record<string, number>;
  /** Pestaña visible. Vive aquí para que cualquier pantalla pueda navegar. */
  tab: Tab;
  /** Id del usuario logueado (sincronizado desde `useAuth` en `auth-gate.tsx`). */
  userId: string;
  /** Charla abierta en el servidor. `null` = la próxima pregunta abre una nueva. */
  conversationId: number | null;
  /** Qué pinta el lienzo ahora: el inicio calculado, una charla, o nada. */
  canvasKind: "empty" | "home" | "chat";

  beginTurn: () => void;
  endTurn: () => void;
  upsertWidget: (w: Widget) => void;
  removeWidget: (id: string) => void;
  pushMcp: (a: McpActivity) => void;
  setStatus: (s: AgentStatus | null) => void;
  setLocal: (widgetId: string, patch: Record<string, unknown>) => void;
  clearCanvas: () => void;
  togglePanel: () => void;
  setTab: (tab: Tab) => void;
  setUserId: (userId: string) => void;
  setConversationId: (id: number | null) => void;
  setCanvasKind: (kind: "empty" | "home" | "chat") => void;
  /** Repinta el lienzo completo desde una fuente guardada (plan o historial). */
  paintWidgets: (widgets: Widget[]) => void;
};

export const useCanvas = create<CanvasState>((set) => ({
  widgets: [],
  mcp: [],
  status: null,
  locals: {},
  panelOpen: false,
  turn: 0,
  widgetTurn: {},
  tab: "inicio",
  userId: "",
  conversationId: null,
  canvasKind: "empty",

  // La actividad MCP es de la pregunta en curso, no del historial.
  beginTurn: () => set((s) => ({ turn: s.turn + 1, mcp: [] })),

  // Lo que el turno nuevo no volvió a pintar ya no aplica: sale del lienzo.
  // Sin esto los widgets del turno anterior se quedan pegados y las
  // respuestas se mezclan (el donut de gastos colgando bajo CETES).
  endTurn: () =>
    set((s) => {
      const widgets = s.widgets.filter((w) => s.widgetTurn[w.id] === s.turn);
      if (widgets.length === s.widgets.length) return {};
      const widgetTurn: Record<string, number> = {};
      const locals: Record<string, Record<string, unknown>> = {};
      for (const w of widgets) {
        widgetTurn[w.id] = s.turn;
        if (s.locals[w.id]) locals[w.id] = s.locals[w.id];
      }
      return { widgets, widgetTurn, locals };
    }),

  upsertWidget: (w) =>
    set((s) => {
      const widgetTurn = { ...s.widgetTurn, [w.id]: s.turn };
      const i = s.widgets.findIndex((x) => x.id === w.id);
      if (i === -1) return { widgets: [...s.widgets, w], widgetTurn };
      // Mismo id pero de un turno viejo: es un widget reciclado, así que
      // se mueve al final para respetar el orden del relato nuevo.
      if (s.widgetTurn[w.id] !== s.turn) {
        const next = s.widgets.slice();
        next.splice(i, 1);
        next.push(w);
        return { widgets: next, widgetTurn };
      }
      const next = s.widgets.slice();
      next[i] = w;
      return { widgets: next, widgetTurn };
    }),

  removeWidget: (id) => set((s) => ({ widgets: s.widgets.filter((w) => w.id !== id) })),

  pushMcp: (a) =>
    set((s) => {
      const i = s.mcp.findIndex((x) => x.id === a.id);
      if (i === -1) return { mcp: [...s.mcp, a] };
      const next = s.mcp.slice();
      next[i] = a;
      return { mcp: next };
    }),

  setStatus: (status) => set({ status }),

  setLocal: (widgetId, patch) =>
    set((s) => ({
      locals: { ...s.locals, [widgetId]: { ...s.locals[widgetId], ...patch } },
    })),

  // Empezar de cero también cierra la charla: la próxima pregunta abre una nueva.
  clearCanvas: () =>
    set({
      widgets: [],
      mcp: [],
      status: null,
      locals: {},
      widgetTurn: {},
      conversationId: null,
      canvasKind: "empty",
    }),

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  setTab: (tab) => set({ tab }),

  setUserId: (userId) => set({ userId }),

  setConversationId: (conversationId) => set({ conversationId }),

  setCanvasKind: (canvasKind) => set({ canvasKind }),

  // Un lienzo guardado llega entero, no widget por widget: se sella como un
  // turno propio para que el `endTurn` de la siguiente pregunta lo respete.
  paintWidgets: (widgets) =>
    set((s) => {
      const turn = s.turn + 1;
      const widgetTurn: Record<string, number> = {};
      for (const w of widgets) widgetTurn[w.id] = turn;
      return { widgets, widgetTurn, turn, locals: {}, mcp: [], status: null, canvasKind: "chat" };
    }),
}));
