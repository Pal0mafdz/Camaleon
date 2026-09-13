import type { McpActivity } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Check, Terminal, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { EASE_IOS, TOKENS, tabular } from "../app/theme";
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

const SERVER_LABEL: Record<McpActivity["server"], string> = {
  banorte: "mcp-banorte",
  research: "mcp-research",
  canvas: "lienzo",
};

/**
 * El nombre del servidor es texto de 12px, así que el color se elige por
 * contraste, no por gusto: el rojo vivo de marca se queda en 4.1:1 sobre
 * blanco y no llega a AA, por eso aquí se usa su variante profunda.
 * Sobre el riel de tinta del escritorio pasa lo contrario y hacen falta los
 * tonos claros.
 */
const SERVER_COLOR: Record<McpActivity["server"], string> = {
  banorte: TOKENS.redDeep,
  research: TOKENS.srvResearch,
  canvas: TOKENS.inkDim,
};

const SERVER_COLOR_DARK: Record<McpActivity["server"], string> = {
  banorte: TOKENS.srvBanorteOnDark,
  research: TOKENS.srvResearchOnDark,
  canvas: TOKENS.onDarkDim,
};

/** Pastilla del header: late mientras haya herramientas corriendo. */
export function McpBadge() {
  const mcp = useCanvas((s) => s.mcp);
  const toggle = useCanvas((s) => s.togglePanel);
  const open = useCanvas((s) => s.panelOpen);
  const { loop, t, reduced } = useMotionPrefs();
  const running = mcp.some((a) => a.status === "running");

  return (
    <MotionButton
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.94 }}
      transition={t(spring)}
      aria-label={`Actividad MCP, ${mcp.length} herramientas`}
      aria-expanded={open}
      sx={{
        ...TapTarget,
        borderRadius: "var(--radius-s)",
        px: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        color: "text.secondary",
        backgroundColor: TOKENS.card,
        boxShadow: `${TOKENS.glossLight}, ${TOKENS.hairline}, ${TOKENS.elev1}`,
      }}
    >
      <MotionBox
        animate={loop(
          running ? { scale: [1, 1.55, 1], opacity: [1, 0.45, 1] } : { scale: 1, opacity: 1 },
        )}
        transition={
          running && !reduced
            ? { repeat: Number.POSITIVE_INFINITY, duration: 1, ease: EASE_IOS }
            : t(springSoft)
        }
        sx={{
          width: 6,
          height: 6,
          borderRadius: "var(--radius-2xs)",
          flexShrink: 0,
          backgroundColor: running ? "primary.main" : "success.main",
        }}
      />
      <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.04em", ...tabular }}>
        MCP {mcp.length > 0 && `· ${mcp.length}`}
      </Typography>
    </MotionButton>
  );
}

/**
 * Hoja inferior con el log de herramientas. La prueba viva del MCP en móvil.
 * En escritorio el mismo dato vive fijo en el riel (`McpRail`) y esta hoja
 * no se monta: duplicar la superficie sería ruido, no redundancia útil.
 */
export function McpPanel() {
  const open = useCanvas((s) => s.panelOpen);
  const toggle = useCanvas((s) => s.togglePanel);
  const mcp = useCanvas((s) => s.mcp);
  const { t, reduced } = useMotionPrefs();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Una hoja modal se cierra con Escape y recibe el foco al abrir.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggle();
    };
    window.addEventListener("keydown", onKey);
    const id = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
    };
  }, [open, toggle]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <MotionBox
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onTap={toggle}
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 40,
              // Velo de tinta cálida, no negro puro: sobre fondo claro un negro
              // al 55% ensucia la hoja en vez de separarla.
              backgroundColor: TOKENS.tintInk32,
            }}
          />
          <MotionBox
            key="panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={t(springSoft)}
            drag={reduced ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90) toggle();
            }}
            className="paper-floating"
            role="dialog"
            aria-modal="true"
            aria-label="Actividad MCP"
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 41,
              maxHeight: "72%",
              display: "flex",
              flexDirection: "column",
              borderTopLeftRadius: "var(--radius-xl)",
              borderTopRightRadius: "var(--radius-xl)",
              pb: "var(--safe-bottom)",
            }}
          >
            <Box sx={{ display: "grid", placeItems: "center", pt: 1.5, pb: 0.5 }} aria-hidden>
              <Box
                sx={{
                  width: 40,
                  height: 4,
                  borderRadius: "var(--radius-2xs)",
                  backgroundColor: TOKENS.well,
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                pl: 2.5,
                pr: 1,
                pt: 0.5,
                pb: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Terminal size={15} color={TOKENS.inkDim} />
                <Typography variant="subtitle2">Actividad MCP</Typography>
              </Box>
              <MotionButton
                ref={closeRef}
                type="button"
                onClick={toggle}
                whileTap={{ scale: 0.9 }}
                transition={t(spring)}
                aria-label="Cerrar"
                sx={{
                  ...TapTarget,
                  borderRadius: "var(--radius-s)",
                  color: "text.secondary",
                }}
              >
                <X size={18} />
              </MotionButton>
            </Box>

            <Box
              className="no-scrollbar scroll-body"
              sx={{ px: 2, pb: 3, display: "grid", gap: 1 }}
            >
              <McpList activities={mcp} />
            </Box>
          </MotionBox>
        </>
      )}
    </AnimatePresence>
  );
}

/** El mismo log, fijo en el riel del escritorio. Sin hoja, sin toque extra. */
export function McpRail() {
  const mcp = useCanvas((s) => s.mcp);
  const running = mcp.some((a) => a.status === "running");
  const { loop, reduced } = useMotionPrefs();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, px: 0.5 }}>
        <Terminal size={14} color={TOKENS.onDarkFaint} />
        <Typography variant="overline" sx={{ color: TOKENS.onDarkFaint, flex: 1 }}>
          Actividad MCP
        </Typography>
        <MotionBox
          animate={loop(
            running ? { scale: [1, 1.55, 1], opacity: [1, 0.45, 1] } : { scale: 1, opacity: 1 },
          )}
          transition={
            running && !reduced
              ? { repeat: Number.POSITIVE_INFINITY, duration: 1, ease: EASE_IOS }
              : undefined
          }
          sx={{
            width: 6,
            height: 6,
            borderRadius: "var(--radius-2xs)",
            backgroundColor: running ? TOKENS.red : TOKENS.goodOnDark,
          }}
        />
      </Box>

      <Box className="no-scrollbar scroll-body" sx={{ display: "grid", gap: 1, pr: 0.5 }}>
        <McpList activities={mcp} dark />
      </Box>
    </Box>
  );
}

function McpList({ activities, dark = false }: { activities: McpActivity[]; dark?: boolean }) {
  if (activities.length === 0) {
    return (
      <Typography
        variant="body2"
        sx={{ color: dark ? TOKENS.onDarkFaint : "text.secondary", px: 0.5, py: 2 }}
      >
        Todavía no se ha llamado ninguna herramienta.
      </Typography>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {activities.map((a) => (
        <McpRow key={a.id} activity={a} dark={dark} />
      ))}
    </AnimatePresence>
  );
}

function McpRow({ activity, dark }: { activity: McpActivity; dark: boolean }) {
  const color = (dark ? SERVER_COLOR_DARK : SERVER_COLOR)[activity.server];
  const { t, loop, reduced } = useMotionPrefs();

  return (
    <MotionBox
      layout="position"
      initial={{ opacity: 0, x: -16, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: 16 }}
      transition={t(springSoft)}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        px: 1.5,
        py: 1.25,
        borderRadius: "var(--radius-m)",
        // Fila hundida en la mesa (o en luz diluida sobre el riel).
        backgroundColor: dark ? TOKENS.tintWhite8 : TOKENS.sunken,
      }}
    >
      <Box sx={{ pt: 0.4, flexShrink: 0 }}>
        {activity.status === "running" ? (
          <MotionBox
            animate={loop({ rotate: 360 })}
            transition={
              reduced
                ? undefined
                : { repeat: Number.POSITIVE_INFINITY, duration: 0.9, ease: "linear" }
            }
            sx={{
              width: 13,
              height: 13,
              borderRadius: "var(--radius-2xs)",
              border: `2px solid ${color}`,
              borderTopColor: reduced ? color : "transparent",
            }}
          />
        ) : activity.status === "ok" ? (
          <MotionBox
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={t(spring)}
            sx={{
              color: dark ? TOKENS.goodOnDark : TOKENS.good,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Check size={13} strokeWidth={3} />
          </MotionBox>
        ) : (
          <Box
            sx={{
              color: dark ? TOKENS.badOnDark : TOKENS.bad,
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={13} strokeWidth={3} />
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color, fontWeight: 700, flexShrink: 0 }}>
            {SERVER_LABEL[activity.server]}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: dark ? TOKENS.onDark : "text.primary",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              // Los nombres de herramienta son cadenas sin espacios: sin esto
              // fuerzan scroll horizontal en el riel angosto.
              overflowWrap: "anywhere",
              minWidth: 0,
            }}
          >
            {activity.tool}
          </Typography>
        </Box>
        {activity.detail && (
          <Typography
            variant="body2"
            sx={{
              color: dark ? TOKENS.onDarkDim : "text.secondary",
              display: "block",
              mt: 0.25,
              overflowWrap: "anywhere",
            }}
          >
            {activity.detail}
          </Typography>
        )}
      </Box>

      {typeof activity.ms === "number" && (
        <Typography
          variant="caption"
          sx={{
            color: dark ? TOKENS.onDarkFaint : "text.secondary",
            flexShrink: 0,
            pt: 0.2,
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {activity.ms} ms
        </Typography>
      )}
    </MotionBox>
  );
}
