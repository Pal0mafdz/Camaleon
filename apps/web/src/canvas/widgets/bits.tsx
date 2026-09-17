import type { Tone } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { TOKENS } from "../../app/theme";
import { toneColor, toneInk } from "../format";
import {
  AnimatePresence,
  Meter,
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

/**
 * Pastilla teñida por semántica. El texto usa la variante `ink`: AA sobre
 * blanco. Sobre el lingote (`dark`) el relleno es luz diluida y el texto la
 * variante `-on-dark`.
 */
export function TonePill({
  tone,
  children,
  dark = false,
}: {
  tone?: Tone;
  children: ReactNode;
  dark?: boolean;
}) {
  const theme = useTheme();
  const key = tone === "neutral" ? undefined : tone;
  const fill = toneColor(key, theme);
  const onDark =
    key === "good" ? TOKENS.goodOnDark : key === "bad" ? TOKENS.badOnDark : TOKENS.onDark;

  return (
    <Box
      sx={{
        px: 1,
        py: 0.375,
        borderRadius: "var(--radius-xs)",
        flexShrink: 0,
        maxWidth: "100%",
        backgroundColor: dark ? TOKENS.tintWhite14 : alpha(fill, 0.12),
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: dark ? onDark : toneInk(key, theme),
          fontWeight: 700,
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

/** Chevron que gira al abrir. La afordancia de toda cabecera expandible. */
export function Disclosure({ open, dark = false }: { open: boolean; dark?: boolean }) {
  const { t } = useMotionPrefs();
  return (
    <MotionBox
      aria-hidden
      animate={{ rotate: open ? 180 : 0 }}
      transition={t(spring)}
      sx={{
        width: 28,
        height: 28,
        borderRadius: "var(--radius-xs)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color: dark ? TOKENS.onDark : "text.secondary",
        backgroundColor: dark ? TOKENS.tintWhite14 : TOKENS.sunken,
      }}
    >
      <ChevronDown size={15} strokeWidth={2.4} />
    </MotionBox>
  );
}

/**
 * Cabecera tocable de una tarjeta expandible.
 *
 * Es un `<button>` de verdad (no un div con `onTap`) para que el teclado y los
 * lectores de pantalla también puedan abrirla. Por eso NADA interactivo puede
 * vivir dentro: los botones del detalle van fuera, en la zona expandida.
 *
 * `layout="position"`: cuando el detalle empuja, la cabecera se queda quieta
 * en vez de estirarse con el contenedor. `hint` pinta el chevron a la derecha.
 */
export function TapHeader({
  onToggle,
  expanded,
  children,
  hint = false,
  dark = false,
  sx,
}: {
  onToggle?: () => void;
  expanded?: boolean;
  children: ReactNode;
  /** Muestra el chevron de apertura alineado a la derecha. */
  hint?: boolean;
  dark?: boolean;
  sx?: object;
}) {
  const { t } = useMotionPrefs();
  if (!onToggle) return <Box sx={sx}>{children}</Box>;

  return (
    <MotionButton
      type="button"
      aria-expanded={expanded}
      layout="position"
      whileTap={{ scale: 0.985 }}
      transition={t(spring)}
      onClick={onToggle}
      sx={{
        display: hint ? "flex" : "block",
        alignItems: hint ? "flex-start" : undefined,
        gap: hint ? 1.5 : undefined,
        width: "100%",
        textAlign: "left",
        borderRadius: "var(--radius-m)",
        ...sx,
      }}
    >
      {hint ? (
        <>
          <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
          <Disclosure open={Boolean(expanded)} dark={dark} />
        </>
      ) : (
        children
      )}
    </MotionButton>
  );
}

/**
 * Contenido que crece en su sitio. El `overflow: hidden` es lo que hace el truco.
 *
 * Es la única animación de la app sobre una propiedad de layout (`height`):
 * `auto` no tiene equivalente en `transform` y la tarjeta TIENE que empujar el
 * lienzo. Deuda registrada en DESIGN.md §8. El contenido entra un poco después
 * de que el hueco empiece a abrirse y sale antes de que se cierre: nunca se ve
 * texto recortado a la mitad.
 */
export function Expand({ open, children }: { open: boolean; children: ReactNode }) {
  const { t, reduced } = useMotionPrefs();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <MotionBox
          key="detail"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={
            reduced
              ? { duration: 0 }
              : { height: springSoft, opacity: { duration: 0.2, ease: "easeOut" } }
          }
          sx={{ overflow: "hidden" }}
        >
          <MotionBox
            initial={{ y: -8 }}
            animate={{ y: 0 }}
            exit={{ y: -6 }}
            transition={t(springSoft)}
          >
            {children}
          </MotionBox>
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
  size = "md",
}: {
  label: string;
  question: string;
  onAsk?: (q: string) => void;
  variant?: "red" | "ink" | "paper";
  /** `sm` para pastillas en fila (chips de seguimiento); sigue midiendo 44px. */
  size?: "md" | "sm";
}) {
  const { t } = useMotionPrefs();
  if (!onAsk) return null;

  const bg = variant === "red" ? TOKENS.red : variant === "ink" ? TOKENS.ink : TOKENS.card;
  const fg = variant === "paper" ? TOKENS.ink : TOKENS.onDark;
  const disc = variant === "paper" ? TOKENS.sunken : TOKENS.tintWhite14;

  return (
    <MotionButton
      type="button"
      whileTap={{ scale: 0.97 }}
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
        width: size === "md" ? "100%" : "auto",
        minHeight: "var(--tap-min)",
        pl: size === "md" ? 2 : 1.5,
        pr: 0.75,
        py: 0.75,
        // Tecla de tarjeta, no píldora: mismo radio que todo control.
        borderRadius: "var(--radius-s)",
        backgroundColor: bg,
        boxShadow:
          variant === "paper"
            ? `${TOKENS.glossLight}, ${TOKENS.hairline}, ${TOKENS.elev1}`
            : `${TOKENS.glossInk}, ${TOKENS.elev1}`,
        transition: "background-color var(--dur-micro) var(--ease-ios)",
        "&:hover": variant === "red" ? { backgroundColor: TOKENS.redDeep } : undefined,
      }}
    >
      <Typography
        variant="button"
        sx={{ color: fg, flex: 1, textAlign: "left", minWidth: 0, overflowWrap: "anywhere" }}
      >
        {label}
      </Typography>
      <MotionBox
        variants={{ rest: { x: 0 }, press: { x: 3 } }}
        transition={t(spring)}
        sx={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-xs)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: fg,
          backgroundColor: disc,
        }}
      >
        <ArrowRight size={16} strokeWidth={2.4} />
      </MotionBox>
    </MotionButton>
  );
}

/**
 * Fila `rótulo … valor` con su barra debajo. Lo que comparten los factores
 * de `health`, las categorías del donut, las metas de `progress` y las filas
 * de `alert`: una sola pieza, un solo muelle, el mismo carril de arena.
 */
export function Bar({
  label,
  value,
  pct,
  color,
  height = 6,
  delay = 0,
  dark = false,
}: {
  label: string;
  /** Texto ya formateado (monto, porcentaje). */
  value?: string;
  /** 0–100. */
  pct: number;
  color: string;
  height?: number;
  delay?: number;
  dark?: boolean;
}) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 0.75 }}>
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            minWidth: 0,
            fontWeight: 600,
            color: dark ? TOKENS.onDark : "text.primary",
            overflowWrap: "anywhere",
          }}
        >
          {label}
        </Typography>
        {value && (
          <Typography
            variant="body2"
            sx={{
              flexShrink: 0,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color: dark ? TOKENS.onDarkDim : "text.secondary",
            }}
          >
            {value}
          </Typography>
        )}
      </Box>
      <Meter pct={pct} color={color} height={height} delay={delay} dark={dark} />
    </Box>
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
              borderRadius: "var(--radius-2xs)",
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
export function Note({
  tone,
  children,
}: {
  tone: "good" | "warn" | "bad" | "neutral";
  children: ReactNode;
}) {
  const bg =
    tone === "good"
      ? TOKENS.tintGood12
      : tone === "warn"
        ? TOKENS.tintWarn10
        : tone === "bad"
          ? TOKENS.tintBad8
          : TOKENS.sunken;
  const fg =
    tone === "good"
      ? TOKENS.goodInk
      : tone === "warn"
        ? TOKENS.warnInk
        : tone === "bad"
          ? TOKENS.badInk
          : TOKENS.inkDim;
  return (
    <Box sx={{ p: 1.75, borderRadius: "var(--radius-m)", backgroundColor: bg }}>
      <Typography variant="body2" sx={{ color: fg }}>
        {children}
      </Typography>
    </Box>
  );
}
