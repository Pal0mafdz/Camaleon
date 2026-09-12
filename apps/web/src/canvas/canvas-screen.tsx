import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ChevronDown, Sparkles } from "lucide-react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLayoutMode } from "../app/app-shell";
import { TOKENS } from "../app/theme";
import { ask } from "./agent";
import { CommandBar, Suggestions } from "./command-bar";
import { McpBadge, McpPanel } from "./mcp-panel";
import { RenderWidget } from "./renderer";
import { useCanvas } from "./store";
import {
  AnimatePresence,
  MotionBox,
  MotionButton,
  spring,
  springSoft,
  TapTarget,
  useMotionPrefs,
} from "./widgets/shell";

const USERS = [
  { id: "karla", name: "Karla", greeting: "Hola, Karla" },
  { id: "roberto", name: "Don Roberto", greeting: "Buenas, Don Roberto" },
] as const;

const SUGGESTIONS = [
  "¿Me alcanza para un Mazda 3?",
  "¿A dónde se me va el dinero?",
  "Tengo $50,000 parados",
];

export function CanvasScreen() {
  const widgets = useCanvas((s) => s.widgets);
  const status = useCanvas((s) => s.status);
  const upsertWidget = useCanvas((s) => s.upsertWidget);
  const pushMcp = useCanvas((s) => s.pushMcp);
  const setStatus = useCanvas((s) => s.setStatus);
  const clearCanvas = useCanvas((s) => s.clearCanvas);
  const beginTurn = useCanvas((s) => s.beginTurn);
  const endTurn = useCanvas((s) => s.endTurn);

  const layout = useLayoutMode();
  const { t } = useMotionPrefs();
  const [userIdx, setUserIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const user = USERS[userIdx];
  const busy = status !== null;

  // El header es transparente sobre el lienzo hasta que algo pasa por debajo:
  // ahí se materializa con velo y hairline. `useScroll` va sobre rAF, no sobre
  // un listener de scroll que forzaría reflows continuos.
  const [lifted, setLifted] = useState(false);
  const { scrollY } = useScroll({ container: scrollRef });
  useMotionValueEvent(scrollY, "change", (y) => setLifted(y > 8));

  const onAsk = useCallback(
    (question: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setError(null);
      beginTurn();
      setStatus({ phase: "thinking", label: "Pensando…" });

      void ask(
        {
          question,
          userId: user.id,
          canvas: useCanvas.getState().widgets.map((w) => ({ id: w.id, type: w.type })),
          signal: ctrl.signal,
        },
        {
          onWidget: upsertWidget,
          onMcp: pushMcp,
          onStatus: setStatus,
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
    [user.id, upsertWidget, pushMcp, setStatus, beginTurn, endTurn],
  );

  const onStop = useCallback(() => {
    abortRef.current?.abort();
    setStatus(null);
  }, [setStatus]);

  // La diferencia con un chat: aquí el agente habla primero. Al abrir la app
  // (o cambiar de usuario) revisa la cuenta y pinta el inicio sin que nadie
  // escriba nada. Si el usuario pregunta algo a media carga, el abort del
  // turno anterior lo resuelve.
  useEffect(() => {
    onAsk("inicio");
  }, [onAsk]);

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
      {/* ── Header flotante (imposter: fuera del flujo del scroll) ───────── */}
      <Box
        component="header"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          height: "var(--header-h)",
          pt: "var(--safe-top)",
          pl: "calc(var(--gutter) + var(--safe-left))",
          pr: "calc(var(--gutter) + var(--safe-right))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          transition:
            "background-color var(--dur-standard) var(--ease-ios), box-shadow var(--dur-standard) var(--ease-ios), backdrop-filter var(--dur-standard) var(--ease-ios)",
          backgroundColor: lifted ? TOKENS.canvasVeil : "transparent",
          backdropFilter: lifted ? "blur(18px) saturate(160%)" : "none",
          WebkitBackdropFilter: lifted ? "blur(18px) saturate(160%)" : "none",
          boxShadow: lifted ? `inset 0 -1px 0 ${TOKENS.tintInk8}` : "none",
        }}
      >
        <MotionButton
          type="button"
          onClick={() => {
            setUserIdx((i) => (i + 1) % USERS.length);
            clearCanvas();
          }}
          whileTap={{ scale: 0.96 }}
          transition={t(spring)}
          aria-label={`Perfil actual: ${user.name}. Cambiar de perfil`}
          sx={{
            ...TapTarget,
            justifyContent: "flex-start",
            gap: 0.5,
            px: 1,
            ml: -1,
            borderRadius: "var(--radius-pill)",
            color: "text.primary",
          }}
        >
          <Typography variant="subtitle1">{user.name}</Typography>
          <ChevronDown size={16} color={TOKENS.inkFaint} />
        </MotionButton>

        {sheetOwnsMcp && <McpBadge />}
      </Box>

      {/* ── Lienzo: el ÚNICO dueño del scroll de esta pantalla ───────────── */}
      <Box
        ref={scrollRef}
        className="no-scrollbar scroll-body"
        sx={{
          height: "100%",
          pl: "calc(var(--gutter) + var(--safe-left))",
          pr: "calc(var(--gutter) + var(--safe-right))",
          pt: "calc(var(--header-h) + 8px)",
          pb: "calc(var(--dock-clearance) + var(--safe-bottom))",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          // Sin esto flexbox aplasta los widgets contra la altura del shell
          // en vez de dejarlos crecer y hacer scroll.
          "& > *": { flexShrink: 0 },
        }}
      >
        {empty && !busy && <EmptyState greeting={user.greeting} />}
        {empty && busy && <BootSkeleton />}

        <AnimatePresence mode="popLayout" initial={false}>
          {widgets.map((w) => (
            <RenderWidget key={w.id} widget={w} onAsk={onAsk} />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {busy && status && !empty && <StatusPill label={status.label} />}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <MotionBox
              role="alert"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={t(springSoft)}
              sx={{
                borderRadius: "var(--radius-l)",
                p: 2,
                backgroundColor: TOKENS.card,
                boxShadow: `inset 0 0 0 1px ${TOKENS.tintRed32}, ${TOKENS.elev1}`,
              }}
            >
              <Typography variant="body2" sx={{ color: TOKENS.badInk }}>
                {error}
              </Typography>
            </MotionBox>
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
          height: "calc(var(--dock-clearance) + var(--safe-bottom))",
          zIndex: 25,
        }}
      />

      {empty && !busy && <Suggestions items={SUGGESTIONS} onAsk={onAsk} />}

      <CommandBar onAsk={onAsk} busy={busy} onStop={onStop} />

      {sheetOwnsMcp && <McpPanel />}
    </Box>
  );
}

function EmptyState({ greeting }: { greeting: string }) {
  const { t } = useMotionPrefs();

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={t({ ...springSoft, delay: 0.1 })}
      sx={{ pt: 5, px: 0.5 }}
    >
      <Typography variant="h1" component="h1">
        {greeting}
      </Typography>
      <Typography variant="h1" component="p" sx={{ color: "text.secondary" }}>
        ¿qué quieres lograr?
      </Typography>
      <Typography variant="body1" sx={{ color: "text.disabled", mt: 2.5, maxWidth: "30ch" }}>
        Esta app no tiene pantallas. Se construye sola, con tu dinero y tu pregunta.
      </Typography>
    </MotionBox>
  );
}

/**
 * Lo que se ve mientras el agente arma el primer lienzo. Sin esto la app abre
 * en blanco y se siente rota justo en el primer segundo, que es el que decide.
 * Las alturas imitan la silueta real del inicio: saldo grande, salud, gasto.
 */
function BootSkeleton() {
  const { reduced, t } = useMotionPrefs();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }} aria-hidden>
      {[190, 132, 108].map((h, i) => (
        <MotionBox
          key={h}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t({ ...springSoft, delay: 0.06 * i })}
          sx={{
            height: h,
            borderRadius: "var(--radius-l)",
            position: "relative",
            overflow: "hidden",
            backgroundColor: TOKENS.card,
            boxShadow: `${TOKENS.hairline}, ${TOKENS.elev1}`,
          }}
        >
          {!reduced && (
            <MotionBox
              initial={{ x: "-120%" }}
              animate={{ x: "120%" }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 1.6,
                delay: 0.12 * i,
                ease: "easeInOut",
              }}
              sx={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(100deg, transparent 20%, ${TOKENS.tintInk5} 50%, transparent 80%)`,
              }}
            />
          )}
        </MotionBox>
      ))}
    </Box>
  );
}

function StatusPill({ label }: { label: string }) {
  const { t, loop, reduced } = useMotionPrefs();
  const pulse = reduced ? undefined : { repeat: Number.POSITIVE_INFINITY, duration: 1.6 };

  return (
    <MotionBox
      layout
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={t(spring)}
      sx={{
        alignSelf: "flex-start",
        borderRadius: "var(--radius-pill)",
        px: 1.75,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        backgroundColor: TOKENS.card,
        boxShadow: `${TOKENS.hairline}, ${TOKENS.elev1}`,
      }}
    >
      <MotionBox
        animate={loop({ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] })}
        transition={pulse}
        sx={{ display: "grid", placeItems: "center", color: "primary.main" }}
      >
        <Sparkles size={14} />
      </MotionBox>
      <MotionBox animate={loop({ opacity: [0.55, 1, 0.55] })} transition={pulse}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {label}
        </Typography>
      </MotionBox>
    </MotionBox>
  );
}
