import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { TOKENS } from "../../app/theme";

/**
 * Primitivas compartidas por todo el catálogo generativo.
 * Los valores vienen de DESIGN.md; aquí solo se componen.
 */

/** Muelle "juguetón": la personalidad de toda la app vive aquí. */
export const spring = { type: "spring", stiffness: 400, damping: 25, mass: 0.6 } as const;
export const springSoft = { type: "spring", stiffness: 220, damping: 28 } as const;
export const springNumber = { stiffness: 90, damping: 20, mass: 0.8 } as const;

/** Área tocable mínima de 44×44 (WCAG 2.5.8 / HIG). No es opcional. */
export const TapTarget = {
  minWidth: "var(--tap-min)",
  minHeight: "var(--tap-min)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
} as const;

type Prefs = {
  /** El usuario pidió menos movimiento en el sistema operativo. */
  reduced: boolean;
  /** Transición segura: con movimiento reducido, el cambio es instantáneo. */
  t: <T>(transition: T) => T | { duration: 0 };
  /** Bucle infinito: con movimiento reducido devuelve el estado en reposo. */
  loop: <T>(animate: T) => T | Record<string, never>;
};

/**
 * `prefers-reduced-motion` no se negocia: el contenido nunca se pierde, solo
 * deja de moverse. Todo muelle y todo bucle de la app pasa por aquí.
 */
export function useMotionPrefs(): Prefs {
  const reduced = useReducedMotion() ?? false;
  return useMemo(
    () => ({
      reduced,
      t: (transition) => (reduced ? { duration: 0 } : transition),
      loop: (animate) => (reduced ? {} : animate),
    }),
    [reduced],
  );
}

export const MotionBox = motion.create(Box);

/**
 * Botón sin cascarón: `MotionBox` con `component="button"` rompe el tipado
 * polimórfico de MUI, así que partimos de un `styled('button')` (que sí acepta
 * `sx`) y lo animamos. Quita el outline nativo, por eso el anillo de foco es
 * global y obligatorio en `index.css`.
 */
const BareButton = styled("button")({
  appearance: "none",
  border: 0,
  margin: 0,
  padding: 0,
  background: "transparent",
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
  textAlign: "inherit",
});

export const MotionButton = motion.create(BareButton);

const BareForm = styled("form")({ margin: 0 });
export const MotionForm = motion.create(BareForm);

/**
 * Envoltura de todo widget del catálogo.
 * Entrada con desenfoque → foco, tap con rebote, salida hacia abajo.
 *
 * `glass` conserva el nombre histórico pero ya no desenfoca nada: sobre fondo
 * claro el `backdrop-filter` no aportaba y repintaba la GPU en cada frame de
 * scroll. Hoy es papel opaco elevado por dos sombras (contacto + ambiental).
 */
export function WidgetShell({
  children,
  glass = true,
  pad = 2.5,
  onTap,
  sx,
}: {
  children: ReactNode;
  glass?: boolean;
  pad?: number;
  onTap?: () => void;
  sx?: object;
}) {
  const { t } = useMotionPrefs();

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, y: 24, filter: "blur(8px)", scale: 0.97 }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
      exit={{ opacity: 0, y: -12, filter: "blur(6px)", scale: 0.98 }}
      transition={t(spring)}
      whileTap={onTap ? { scale: 0.985 } : undefined}
      onTap={onTap}
      className={glass ? "liquid-glass" : undefined}
      sx={{
        borderRadius: "var(--radius-l)",
        p: pad,
        position: "relative",
        cursor: onTap ? "pointer" : "default",
        ...sx,
      }}
    >
      {children}
    </MotionBox>
  );
}

export function WidgetTitle({ children }: { children: ReactNode }) {
  return (
    <Typography variant="h5" sx={{ color: "text.primary", mb: 1.5 }}>
      {children}
    </Typography>
  );
}

/** Rótulo en versalitas. El "eyebrow" que precede a toda cifra protagonista. */
export function Label({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <Typography
      variant="overline"
      sx={{ display: "block", color: dark ? TOKENS.onDarkFaint : "text.disabled" }}
    >
      {children}
    </Typography>
  );
}

/** Número que "rueda" hasta su valor. Ningún dato aparece de golpe. */
export function RollingNumber({
  value,
  format,
  sx,
  variant = "h3",
}: {
  value: number;
  format: (n: number) => string;
  sx?: object;
  variant?: "h1" | "h2" | "h3" | "h4" | "h5";
}) {
  const { reduced } = useMotionPrefs();
  const mv = useMotionValue(0);
  const spr = useSpring(mv, springNumber);
  const text = useTransform(spr, (n) => format(n));
  const [display, setDisplay] = useState(() => format(0));

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  useEffect(() => text.on("change", setDisplay), [text]);

  return (
    <Typography variant={variant} sx={{ fontVariantNumeric: "tabular-nums", ...sx }}>
      {reduced ? format(value) : display}
    </Typography>
  );
}

/**
 * Barra de progreso del sistema. El relleno anima `scaleX` (GPU) dentro de un
 * carril con `overflow: hidden`, así que la pastilla nunca se deforma y no se
 * toca ninguna propiedad de layout.
 */
export function Meter({
  pct,
  color,
  height = 8,
  dark = false,
  delay = 0,
}: {
  /** 0–100. */
  pct: number;
  color: string;
  height?: number;
  dark?: boolean;
  delay?: number;
}) {
  const { t } = useMotionPrefs();

  return (
    <Box
      sx={{
        height,
        borderRadius: "var(--radius-pill)",
        overflow: "hidden",
        backgroundColor: dark ? TOKENS.tintWhite8 : TOKENS.tintInk8,
      }}
    >
      <MotionBox
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.max(0, Math.min(pct, 100)) / 100 }}
        transition={t({ ...springSoft, delay })}
        sx={{ height: "100%", transformOrigin: "left", backgroundColor: color }}
      />
    </Box>
  );
}

/**
 * Serie corta como barras. Tres cosas la separan de un adorno:
 *
 *  1. Las barras se apoyan en una LÍNEA BASE real y solo redondean arriba, así
 *     que se leen como columnas de una gráfica y no como pastillas flotando.
 *  2. La última barra —el dato de hoy— va a color pleno; las anteriores se
 *     apagan, de modo que el ojo lee la dirección antes que los valores.
 *  3. Con `axis` la serie dice de cuándo a cuándo va. Una gráfica sin eje no
 *     informa nada y no se gana el espacio que ocupa.
 */
export function Sparkbars({
  values,
  color,
  height = 44,
  dark = false,
  axis,
}: {
  values: number[];
  color: string;
  height?: number;
  dark?: boolean;
  /** Extremos temporales de la serie. Sin esto la gráfica es decoración. */
  axis?: { start: string; end: string };
}) {
  const { t } = useMotionPrefs();
  const max = Math.max(...values, 1);
  const last = values.length - 1;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 0.75,
          height,
          borderBottom: `1px solid ${dark ? TOKENS.tintWhite14 : TOKENS.tintInk12}`,
          pb: "1px",
        }}
      >
        {values.map((v, i) => (
          <MotionBox
            // La serie son montos que pueden repetirse: la posición es lo único único.
            // biome-ignore lint/suspicious/noArrayIndexKey: la serie puede repetir valores
            key={`bar-${i}`}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(10, (v / max) * 100)}%` }}
            transition={t({ ...springSoft, delay: 0.05 * i })}
            sx={{
              flex: 1,
              minWidth: 3,
              // Solo arriba: la base tiene que morir sobre el eje.
              borderRadius: "var(--radius-xs) var(--radius-xs) 0 0",
              backgroundColor: color,
              opacity: i === last ? 1 : 0.3 + 0.4 * (i / Math.max(last, 1)),
            }}
          />
        ))}
      </Box>

      {axis && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
          <Typography
            variant="caption"
            sx={{ color: dark ? TOKENS.onDarkFaint : "text.disabled", fontWeight: 500 }}
          >
            {axis.start}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: dark ? TOKENS.onDarkDim : "text.secondary", fontWeight: 700 }}
          >
            {axis.end}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/** Aparición escalonada de hijos (listas, bullets, chips). */
export function Stagger({
  children,
  delay = 0.06,
  sx,
}: {
  children: ReactNode;
  delay?: number;
  sx?: object;
}) {
  const { reduced } = useMotionPrefs();

  return (
    <MotionBox
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : delay } } }}
      sx={sx}
    >
      {children}
    </MotionBox>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: springSoft },
};

export { AnimatePresence, motion };
