import type { Tone } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { TOKENS } from "../../app/theme";
import { toneColor, toneInk } from "../format";
import {
  AnimatePresence,
  MotionBox,
  MotionButton,
  spring,
  springSoft,
  useMotionPrefs,
} from "./shell";

/**
 * Piezas compartidas por los widgets expandibles.
 *
 * La regla que las une: expandir es un gesto, no una navegación. La tarjeta
 * crece EN SU SITIO y el resto del lienzo se acomoda con el mismo muelle.
 */

/** Pastilla teñida por semántica. El texto usa la variante `ink`: AA sobre blanco. */
export function TonePill({ tone, children }: { tone?: Tone; children: ReactNode }) {
  const theme = useTheme();
  const key = tone === "neutral" ? undefined : tone;

  return (
    <Box
      sx={{
        px: 1,
        py: 0.375,
        borderRadius: "var(--radius-pill)",
        flexShrink: 0,
        backgroundColor: alpha(toneColor(key, theme), 0.12),
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: toneInk(key, theme), fontWeight: 700, whiteSpace: "nowrap" }}
      >
        {children}
      </Typography>
    </Box>
  );
}

/**
 * Cabecera tocable de una tarjeta expandible.
 *
 * Es un `<button>` de verdad (no un div con `onTap`) para que el teclado y los
 * lectores de pantalla también puedan abrirla. Por eso NADA interactivo puede
 * vivir dentro: los botones del detalle van fuera, en la zona expandida.
 */
export function TapHeader({
  onToggle,
  expanded,
  children,
  sx,
}: {
  onToggle?: () => void;
  expanded?: boolean;
  children: ReactNode;
  sx?: object;
}) {
  const { t } = useMotionPrefs();
  if (!onToggle) return <Box sx={sx}>{children}</Box>;

  return (
    <MotionButton
      type="button"
      aria-expanded={expanded}
      whileTap={{ scale: 0.985 }}
      transition={t(spring)}
      onClick={onToggle}
      sx={{ display: "block", width: "100%", textAlign: "left", ...sx }}
    >
      {children}
    </MotionButton>
  );
}

/**
 * Contenido que crece en su sitio. El `overflow: hidden` es lo que hace el truco.
 *
 * Es la única animación de la app sobre una propiedad de layout (`height`):
 * `auto` no tiene equivalente en `transform` y la tarjeta TIENE que empujar el
 * lienzo. Deuda registrada en DESIGN.md §8.
 */
export function Expand({ open, children }: { open: boolean; children: ReactNode }) {
  const { t } = useMotionPrefs();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <MotionBox
          key="detail"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={t(springSoft)}
          sx={{ overflow: "hidden" }}
        >
          {children}
        </MotionBox>
      )}
    </AnimatePresence>
  );
}

/**
 * Botón-pastilla que reenvía una pregunta al agente y abre un turno nuevo.
 *
 * La flecha NUNCA va desnuda junto al texto: vive en su propio círculo, a ras
 * del padding derecho, y avanza al presionar. Es el detalle que separa un CTA
 * de agencia de un botón de plantilla.
 */
export function AskPill({
  label,
  question,
  onAsk,
  variant = "red",
}: {
  label: string;
  question: string;
  onAsk?: (q: string) => void;
  variant?: "red" | "ink";
}) {
  const { t } = useMotionPrefs();
  if (!onAsk) return null;

  return (
    <MotionButton
      type="button"
      whileTap={{ scale: 0.975 }}
      transition={t(spring)}
      onClick={() => onAsk(question)}
      initial="rest"
      whileHover="press"
      whileFocus="press"
      animate="rest"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        width: "100%",
        minHeight: "var(--tap-min)",
        pl: 2.5,
        pr: 0.75,
        py: 0.75,
        borderRadius: "var(--radius-pill)",
        backgroundColor: variant === "red" ? TOKENS.red : TOKENS.ink,
        boxShadow: TOKENS.elev1,
      }}
    >
      <Typography variant="button" sx={{ color: TOKENS.onDark, flex: 1, textAlign: "left" }}>
        {label}
      </Typography>
      <MotionBox
        variants={{ rest: { x: 0 }, press: { x: 3 } }}
        transition={t(spring)}
        sx={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-pill)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: TOKENS.onDark,
          backgroundColor: TOKENS.tintWhite14,
        }}
      >
        <ArrowRight size={16} strokeWidth={2.4} />
      </MotionBox>
    </MotionButton>
  );
}

/** Rótulo de sección dentro de un detalle: mismo peso que `Label`, con aire arriba. */
export function SectionLabel({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <Typography
      variant="overline"
      sx={{ display: "block", color: dark ? TOKENS.onDarkFaint : "text.disabled", mb: 1 }}
    >
      {children}
    </Typography>
  );
}

/**
 * Fila `etiqueta … monto` con la cifra alineada a la derecha. Se repite en
 * balance, donut, daily y alert, así que vive aquí una sola vez.
 */
export function AmountRow({
  label,
  amount,
  color,
  bold = false,
  dark = false,
}: {
  label: string;
  amount: string;
  color?: string;
  bold?: boolean;
  dark?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          minWidth: 0,
          color: dark ? TOKENS.onDark : "text.primary",
          overflowWrap: "anywhere",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          flexShrink: 0,
          fontWeight: bold ? 700 : 600,
          fontVariantNumeric: "tabular-nums",
          color: color ?? (dark ? TOKENS.onDark : "text.primary"),
        }}
      >
        {amount}
      </Typography>
    </Box>
  );
}

/**
 * Riel vertical con hitos. Lo comparten `timeline`, `progress` y `plan`:
 * antes eran tres copias del mismo SVG hecho con divs.
 */
export function Milestones({
  steps,
  dotColor,
}: {
  steps: { when: string; label: string; detail?: string; done?: boolean }[];
  /** Color del hito pendiente. El hito hecho siempre es verde. */
  dotColor: string;
}) {
  const { t } = useMotionPrefs();

  return (
    <Box sx={{ position: "relative", pl: 3 }}>
      <Box
        sx={{
          position: "absolute",
          left: 7,
          top: 6,
          bottom: 6,
          width: 1.5,
          borderRadius: "var(--radius-pill)",
          backgroundColor: TOKENS.tintInk12,
        }}
        aria-hidden
      />
      {steps.map((step) => (
        <Box
          key={`${step.when}-${step.label}`}
          sx={{ position: "relative", pb: 2, "&:last-of-type": { pb: 0 } }}
        >
          <MotionBox
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={t(spring)}
            sx={{
              position: "absolute",
              left: -23,
              top: 5,
              width: 10,
              height: 10,
              borderRadius: "var(--radius-pill)",
              backgroundColor: step.done ? TOKENS.good : dotColor,
              // El halo recorta el riel; va del color de la tarjeta, no del lienzo.
              boxShadow: `0 0 0 4px ${TOKENS.card}`,
            }}
            aria-hidden
          />
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            {step.when}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {step.label}
          </Typography>
          {step.detail && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {step.detail}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}

/** Nota destacada al pie de un detalle, teñida por semántica. */
export function Note({ tone, children }: { tone: "good" | "warn"; children: ReactNode }) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: "var(--radius-m)",
        backgroundColor: tone === "good" ? TOKENS.tintGood12 : TOKENS.tintWarn10,
      }}
    >
      <Typography variant="body2" sx={{ color: tone === "good" ? TOKENS.goodInk : TOKENS.warnInk }}>
        {children}
      </Typography>
    </Box>
  );
}
