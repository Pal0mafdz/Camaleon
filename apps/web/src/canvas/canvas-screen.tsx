import Box from "@mui/material/Box";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLayoutMode } from "../app/app-shell";
import { useAuth } from "../auth/store";
import { ask } from "./agent";
import { TableLight } from "./brand-band";
import { CanvasHeader } from "./canvas-header";
import { BootSkeleton, CanvasError, EmptyState, StatusPill } from "./canvas-states";
import { CommandBar, Suggestions } from "./command-bar";
import { McpPanel } from "./mcp-panel";
import { RenderWidget, widgetSpan, widgetSpanCompact } from "./renderer";
import { useCanvas } from "./store";
import { AnimatePresence, MotionBox } from "./widgets/shell";

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
  const canvasKind = useCanvas((s) => s.canvasKind);
  const setCanvasKind = useCanvas((s) => s.setCanvasKind);
  const clearCanvas = useCanvas((s) => s.clearCanvas);
  const userName = useAuth((s) => s.user?.name);

  const layout = useLayoutMode();
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const busy = status !== null;

  // El velo del header sigue al scroll píxel a píxel. `useScroll` va sobre
  // rAF y el valor viaja como MotionValue: ningún re-render por scroll.
  const { scrollY } = useScroll({ container: scrollRef });
  // La laca y el holograma de las tarjetas leen `--scroll-y` por CSS.
  useMotionValueEvent(scrollY, "change", (v) => {
    scrollRef.current?.style.setProperty("--scroll-y", String(Math.round(v)));
  });

  const onAsk = useCallback(
    (question: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // El inicio no es una charla: se calcula de la BD y cierra la anterior.
      const home = question.trim() === "inicio";
      if (home) setConversationId(null);
      setCanvasKind(home ? "home" : "chat");

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
    [
      userId,
      upsertWidget,
      pushMcp,
      setStatus,
      setConversationId,
      setCanvasKind,
      beginTurn,
      endTurn,
    ],
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
  // (al abrir la app o al cambiar de perfil) revisa la cuenta y pinta el lienzo
  // sin que nadie escriba nada. Si el inicio ya está pintado para este perfil,
  // volver a la pestaña no lo vuelve a pedir: perdería el scroll y la charla.
  const homeForRef = useRef<string | null>(null);
  useEffect(() => {
    if (tab !== "inicio") return;
    if (canvasKind === "home" && homeForRef.current === userId) return;
    homeForRef.current = userId;
    onAsk("inicio");
  }, [tab, onAsk, userId, canvasKind]);

  // `Asesor` es la charla: si el lienzo trae el inicio, se despeja para que la
  // pregunta nazca en blanco, y la barra recibe el foco para escribir ya.
  useEffect(() => {
    if (tab !== "asesor") return;
    if (useCanvas.getState().canvasKind === "home") {
      abortRef.current?.abort();
      clearCanvas();
    }
    const id = window.setTimeout(() => {
      const input = document.getElementById("camaleon-pregunta");
      if (input instanceof HTMLInputElement) input.focus({ preventScroll: true });
    }, 320);
    return () => window.clearTimeout(id);
  }, [tab, clearCanvas]);

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
      <TableLight scrollY={scrollY} />
      <CanvasHeader scrollY={scrollY} showMcp={sheetOwnsMcp} />

      {/* ── Lienzo: el ÚNICO dueño del scroll de esta pantalla ───────────────── */}
      <Box
        ref={scrollRef}
        className="no-scrollbar scroll-body"
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          pl: "calc(var(--gutter) + var(--safe-left))",
          pr: "calc(var(--gutter) + var(--safe-right))",
          pt: "calc(var(--header-h) + 8px)",
          pb: "calc(var(--dock-clearance) + var(--safe-bottom) + var(--dock-offset))",
          // Dos columnas siempre: en el teléfono solo salud y gasto de hoy las
          // comparten (`widgetSpanCompact`); en escritorio, todo lo compacto.
          display: "grid",
          gridTemplateColumns: "repeat(var(--canvas-cols, 2), minmax(0, 1fr))",
          alignItems: "stretch",
          alignContent: "start",
          gap: 1.5,
          "& > [data-span='2'], & > [data-span='full']": { gridColumn: "1 / -1" },
        }}
      >
        {empty && !busy && (
          <Box data-span="full">
            <EmptyState greeting={`Hola, ${userName ?? ""}`} />
          </Box>
        )}
        {empty && busy && (
          <Box data-span="full">
            <BootSkeleton />
          </Box>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          {widgets.map((w, i) => (
            <MotionBox
              key={w.id}
              data-span={layout === "wide" ? widgetSpan(w.type) : widgetSpanCompact(w.type)}
              sx={{ minWidth: 0, display: "grid" }}
            >
              <RenderWidget widget={w} order={i} onAsk={askHere} />
            </MotionBox>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {busy && status && !empty && (
            <Box data-span="full" sx={{ display: "flex" }}>
              <StatusPill label={status.label} />
            </Box>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <Box data-span="full">
              <CanvasError message={error} />
            </Box>
          )}
        </AnimatePresence>
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
