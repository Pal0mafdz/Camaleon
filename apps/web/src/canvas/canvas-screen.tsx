import Box from "@mui/material/Box";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLayoutMode } from "../app/app-shell";
import { useAuth } from "../auth/store";
import { ask } from "./agent";
import { CanvasHeader } from "./canvas-header";
import { BootSkeleton, CanvasError, EmptyState, StatusPill } from "./canvas-states";
import { CommandBar, Suggestions } from "./command-bar";
import { McpPanel } from "./mcp-panel";
import { RenderWidget } from "./renderer";
import { useCanvas } from "./store";
import { AnimatePresence } from "./widgets/shell";

const SUGGESTIONS = [
  "¿Me alcanza para un Mazda 3?",
  "¿A dónde se me va el dinero?",
  "Tengo $50,000 parados",
];

/**
 * El lienzo: la superficie que comparten las pestañas `Inicio` y `Asesor`.
 *
 * `Inicio` la llena desde la BD sin LLM; `Asesor` la deja abierta a cualquier
 * pregunta. Es la misma pantalla porque es el mismo material: cambiar de
 * pestaña no debería obligar a repintar lo que ya está en la mesa.
 */
export function CanvasScreen() {
  const widgets = useCanvas((s) => s.widgets);
  const status = useCanvas((s) => s.status);
  const upsertWidget = useCanvas((s) => s.upsertWidget);
  const pushMcp = useCanvas((s) => s.pushMcp);
  const setStatus = useCanvas((s) => s.setStatus);
  const beginTurn = useCanvas((s) => s.beginTurn);
  const endTurn = useCanvas((s) => s.endTurn);
  const tab = useCanvas((s) => s.tab);
  const setTab = useCanvas((s) => s.setTab);
  const userId = useCanvas((s) => s.userId);
  const setConversationId = useCanvas((s) => s.setConversationId);
  const userName = useAuth((s) => s.user?.name);

  const layout = useLayoutMode();
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const busy = status !== null;

  // El header se materializa cuando algo pasa por debajo. `useScroll` va sobre
  // rAF, no sobre un listener que forzaría reflows continuos.
  const [lifted, setLifted] = useState(false);
  const { scrollY } = useScroll({ container: scrollRef });
  useMotionValueEvent(scrollY, "change", (y) => setLifted(y > 8));

  const onAsk = useCallback(
    (question: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // El inicio no es una charla: se calcula de la BD y cierra la anterior.
      const home = question.trim() === "inicio";
      if (home) setConversationId(null);

      setError(null);
      beginTurn();
      setStatus({ phase: "thinking", label: "Pensando…" });

      void ask(
        {
          question,
          userId,
          canvas: useCanvas.getState().widgets.map((w) => ({ id: w.id, type: w.type })),
          conversationId: home ? null : useCanvas.getState().conversationId,
          signal: ctrl.signal,
        },
        {
          onWidget: upsertWidget,
          onMcp: pushMcp,
          onStatus: setStatus,
          onConversation: setConversationId,
          onError: (m) => {
            setError(m);
            setStatus(null);
          },
        },
      )
        .then(() => {
          if (!ctrl.signal.aborted) endTurn();
        })
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setError(e instanceof Error ? e.message : "No pude conectarme al agente");
          setStatus(null);
        });
    },
    [userId, upsertWidget, pushMcp, setStatus, setConversationId, beginTurn, endTurn],
  );

  // Toda pregunta que nace de un gesto es del asesor, aunque la haya disparado
  // una tarjeta del inicio: la pestaña sigue a la intención del usuario.
  const askHere = useCallback(
    (question: string) => {
      setTab("asesor");
      onAsk(question);
    },
    [onAsk, setTab],
  );

  const onStop = useCallback(() => {
    abortRef.current?.abort();
    setStatus(null);
  }, [setStatus]);

  // La diferencia con un chat: aquí el agente habla primero. Al entrar a Inicio
  // (al abrir la app, al cambiar de perfil o al volver de otra pestaña) revisa
  // la cuenta y pinta el lienzo sin que nadie escriba nada.
  useEffect(() => {
    if (tab !== "inicio") return;
    onAsk("inicio");
  }, [tab, onAsk]);

  const empty = widgets.length === 0;
  // En escritorio el log MCP vive fijo en el riel: duplicarlo en una hoja
  // sería una segunda superficie con el mismo dato.
  const sheetOwnsMcp = layout !== "wide";

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <CanvasHeader lifted={lifted} showMcp={sheetOwnsMcp} />

      {/* ── Lienzo: el ÚNICO dueño del scroll de esta pantalla ───────────── */}
      <Box
        ref={scrollRef}
        className="no-scrollbar scroll-body"
        sx={{
          height: "100%",
          pl: "calc(var(--gutter) + var(--safe-left))",
          pr: "calc(var(--gutter) + var(--safe-right))",
          pt: "calc(var(--header-h) + 8px)",
          pb: "calc(var(--dock-clearance) + var(--safe-bottom) + var(--dock-offset))",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          // Sin esto flexbox aplasta los widgets contra la altura del shell
          // en vez de dejarlos crecer y hacer scroll.
          "& > *": { flexShrink: 0 },
        }}
      >
        {empty && !busy && <EmptyState greeting={`Hola, ${userName ?? ""}`} />}
        {empty && busy && <BootSkeleton />}

        <AnimatePresence mode="popLayout" initial={false}>
          {widgets.map((w) => (
            <RenderWidget key={w.id} widget={w} onAsk={askHere} />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {busy && status && !empty && <StatusPill label={status.label} />}
        </AnimatePresence>

        <AnimatePresence>{error && <CanvasError message={error} />}</AnimatePresence>
      </Box>

      {/* Disuelve el contenido bajo la barra en vez de cortarlo en seco. */}
      <Box
        className="dock-scrim"
        aria-hidden
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "calc(var(--dock-clearance) + var(--safe-bottom) + var(--dock-offset))",
          zIndex: 25,
        }}
      />

      {empty && !busy && <Suggestions items={SUGGESTIONS} onAsk={askHere} />}

      <CommandBar onAsk={askHere} busy={busy} onStop={onStop} />

      {sheetOwnsMcp && <McpPanel />}
    </Box>
  );
}
