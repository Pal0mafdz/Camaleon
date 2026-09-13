import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { type ReactNode, useRef } from "react";
import { EASE_IOS, TOKENS } from "../app/theme";
import { TableLight } from "../canvas/brand-band";
import { AskPill } from "../canvas/widgets/bits";
import {
  MotionBox,
  springSoft,
  useMotionPrefs,
  WidgetShell,
  WidgetTitle,
} from "../canvas/widgets/shell";

/**
 * Cascarón de las pantallas de lista (Metas, Historial).
 *
 * El lienzo del asesor se construye solo; estas dos no. Aun así usan el mismo
 * material y la misma coreografía: la hoja baja y se apoya sobre la mesa
 * (`springSoft`), el header es un impostor fuera del scroll cuyo velo sigue al
 * scroll píxel a píxel —igual que en el lienzo— y al cambiar de pestaña la
 * hoja se levanta con desenfoque mientras la siguiente aterriza.
 */

/** Recorrido de scroll (px) en el que el velo pasa de invisible a pleno. */
const VEIL_TRAVEL = 56;

export function ScreenShell({ title, children }: { title: string; children: ReactNode }) {
  const { reduced } = useMotionPrefs();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const veil = useTransform(scrollY, [0, VEIL_TRAVEL], [0, 1]);
  const settle = useTransform(scrollY, [0, VEIL_TRAVEL], [0, 2]);
  // La laca de las tarjetas sigue al scroll también aquí.
  useMotionValueEvent(scrollY, "change", (v) => {
    scrollRef.current?.style.setProperty("--scroll-y", String(Math.round(v)));
  });

  return (
    <MotionBox
      initial={{ opacity: 0, y: 16, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.99, filter: "blur(6px)" }}
      transition={
        reduced
          ? { duration: 0 }
          : {
              default: springSoft,
              opacity: { duration: 0.18, ease: EASE_IOS },
              filter: { duration: 0.22, ease: EASE_IOS },
            }
      }
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 15,
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <TableLight scrollY={scrollY} />
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
        }}
      >
        <MotionBox
          aria-hidden
          className="canvas-veil"
          style={{ opacity: veil }}
          sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />
        <MotionBox style={{ y: settle }} sx={{ position: "relative", minWidth: 0 }}>
          <Typography variant="h4" component="h1" noWrap sx={{ color: "text.primary" }}>
            {title}
          </Typography>
        </MotionBox>
      </Box>

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
          pb: "calc(var(--tab-bar-h) + var(--safe-bottom) + 24px)",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          "& > *": { flexShrink: 0 },
        }}
      >
        {children}
      </Box>

      {/* Disuelve el contenido bajo la barra de pestañas en vez de cortarlo. */}
      <Box
        className="dock-scrim"
        aria-hidden
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "calc(var(--tab-bar-h) + var(--safe-bottom) + 56px)",
          zIndex: 25,
          "--dock-solid": "calc(var(--tab-bar-h) + var(--safe-bottom))",
        }}
      />
    </MotionBox>
  );
}

/** Línea de intro bajo el header: qué hay aquí y para qué sirve tocarlo. */
export function ScreenLede({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="body1"
      sx={{ color: "text.secondary", px: 0.5, mb: 0.5, maxWidth: "36ch" }}
    >
      {children}
    </Typography>
  );
}

/** Bloque con rótulo en versalitas. Separa "Mis planes" de la lista de metas. */
export function ScreenSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1.5 }}>
      <Typography variant="overline" component="h2" sx={{ color: "text.disabled", px: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

/**
 * Estado vacío con propósito: dice qué falta y ofrece el siguiente paso.
 * Nunca un icono gris con "sin datos": el vacío es una invitación concreta.
 */
export function ScreenEmpty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <WidgetShell>
      <WidgetTitle>{title}</WidgetTitle>
      <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: "36ch" }}>
        {body}
      </Typography>
      {action && (
        <Box sx={{ mt: 2 }}>
          <AskPill
            label={action.label}
            question={action.label}
            onAsk={() => action.onClick()}
            variant="ink"
          />
        </Box>
      )}
    </WidgetShell>
  );
}

/**
 * Aviso de la pantalla. `bad` nombra el problema y, si puede, ofrece la
 * salida (reintentar). Rojo solo aquí: es lo único que salió mal.
 */
export function ScreenNote({
  children,
  tone = "dim",
  action,
}: {
  children: ReactNode;
  tone?: "dim" | "bad";
  action?: { label: string; onClick: () => void };
}) {
  const bad = tone === "bad";

  return (
    <WidgetShell
      pad={2}
      sx={
        bad
          ? {
              boxShadow: `${TOKENS.glossLight}, inset 0 0 0 1.5px ${TOKENS.tintRed32}, ${TOKENS.elev1}`,
            }
          : undefined
      }
    >
      <Box role={bad ? "alert" : "status"}>
        <Typography
          variant={bad ? "h6" : "body2"}
          component="p"
          sx={{ color: bad ? TOKENS.badInk : "text.secondary", overflowWrap: "anywhere" }}
        >
          {children}
        </Typography>
        {action && (
          <Box sx={{ mt: 1.5 }}>
            <AskPill
              label={action.label}
              question={action.label}
              onAsk={() => action.onClick()}
              variant="paper"
            />
          </Box>
        )}
      </Box>
    </WidgetShell>
  );
}

/**
 * Huecos en la arena mientras llega la lista: la silueta de las filas que el
 * papel va a cubrir. Mismo material que `BootSkeleton`; sin tarjetas falsas.
 */
export function ListSkeleton({ rows = 3, heights }: { rows?: number; heights?: number[] }) {
  const { reduced, t } = useMotionPrefs();
  const list = heights ?? Array.from({ length: rows }, () => 84);

  return (
    <Box
      aria-busy
      aria-live="polite"
      aria-label="Cargando"
      sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
    >
      {list.map((h, i) => (
        <MotionBox
          // Solo importa la posición: las alturas se repiten.
          // biome-ignore lint/suspicious/noArrayIndexKey: alturas repetidas
          key={`hole-${i}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985 }}
          transition={t({ ...springSoft, delay: TOKENS.stagger * i })}
          sx={{
            height: h,
            borderRadius: "var(--radius-l)",
            position: "relative",
            overflow: "hidden",
            backgroundColor: TOKENS.sunken,
            boxShadow: `inset 0 1px 2px ${TOKENS.tintInk5}`,
          }}
        >
          {!reduced && (
            <MotionBox
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 1.6,
                delay: 0.12 * i,
                ease: EASE_IOS,
              }}
              sx={{ position: "absolute", inset: 0, backgroundColor: TOKENS.well }}
            />
          )}
        </MotionBox>
      ))}
    </Box>
  );
}
