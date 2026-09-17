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
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { EASE_OUT, SPRINGS, TOKENS } from "../../app/theme";

/**
 * Primitivas compartidas por todo el catálogo generativo.
 * Los valores vienen de DESIGN.md; aquí solo se componen.
 */

/** Muelle "juguetón": press, chevrones, morphs. */
export const spring = SPRINGS.spring;
export const springSoft = SPRINGS.springSoft;
export const springNumber = SPRINGS.springNumber;
/** La tarjeta blanca que se reparte: rápida, sin rebote. */
export const springCard = SPRINGS.springCard;
/** La firma: la tarjeta roja se entrega (mass 1.1), se apoya y su sombra se asienta. */
export const springIngot = SPRINGS.springIngot;

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
  /** Retardo del paso `i` de una coreografía (segundos). Cero si hay movimiento reducido. */
  step: (i: number) => number;
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
      step: (i) => (reduced ? 0 : Math.min(i, TOKENS.staggerMax) * TOKENS.stagger),
    }),
    [reduced],
  );
}

export const MotionBox = motion.create(Box);

// ─── Coreografía del lienzo ──────────────────────────────────────────────────

/**
 * Posición del widget en el lienzo. La pone `CanvasScreen`; la lee `WidgetShell`
 * para escalonar la SALIDA (el de arriba se va primero) y para que el lingote
 * sepa que es el ancla de la coreografía.
 */
const WidgetOrderContext = createContext<number>(0);
export const WidgetOrderProvider = WidgetOrderContext.Provider;
export function useWidgetOrder(): number {
  return useContext(WidgetOrderContext);
}

let lastMountAt = 0;
let batchIndex = 0;

/**
 * Los widgets del agente llegan en ráfaga (streaming) o de golpe (historial).
 * En vez de escalonar por índice absoluto —el décimo esperaría 400ms— se cuenta
 * cuántos montaron dentro de la misma ventana de 160ms: ése es el lote, y cada
 * miembro entra `--stagger` después del anterior.
 */
export function claimStagger(): number {
  const now = typeof performance === "undefined" ? Date.now() : performance.now();
  batchIndex = now - lastMountAt > TOKENS.staggerWindow ? 0 : batchIndex + 1;
  lastMountAt = now;
  return Math.min(batchIndex, TOKENS.staggerMax) * TOKENS.stagger;
}

/** Hook: reclama el turno del lote UNA vez, al montar. */
export function useStaggerDelay(): number {
  const [delay] = useState(claimStagger);
  return delay;
}

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
 * Landmarks animables. `MotionBox component="main"` rompe el tipado
 * polimórfico de MUI (igual que con `button`), así que cada elemento semántico
 * que se anima tiene su propio `styled()` con `sx`.
 */
export const MotionMain = motion.create(styled("main")({}));
export const MotionHeader = motion.create(styled("header")({}));
export const MotionNav = motion.create(styled("nav")({}));

/**
 * Envoltura de todo widget del catálogo: un objeto-tarjeta. Tres variantes:
 *
 *  `card`  tarjeta blanca laminada (canto luminoso, hairline, dos sombras).
 *          Se REPARTE: entra desde abajo con un giro de ±1.5° y se endereza.
 *  `ink`   LA TARJETA ROJA. La única superficie de color del lienzo. Se
 *          ENTREGA: llega desde abajo-derecha inclinada (rotateZ −4°, rotateX
 *          12°, perspectiva) con sombra granate grande, se apoya plana con
 *          `springIngot` y la sombra se asienta un paso después. Lleva laca.
 *  `bare`  sin superficie: el widget dibuja sus propias tarjetas hijas.
 *
 * `glass` sobrevive por compatibilidad (`glass={false}` ≡ `variant="bare"`).
 * Entrada legible desde el primer frame (opacidad en 180ms); el resto lo hace
 * el muelle. Salida: los de arriba se van primero. `layout="position"`: al
 * expandir una tarjeta las demás se reacomodan sin deformar radios.
 */
export type ShellVariant = "card" | "ink" | "bare";

const SHELL_ENTER = {
  card: { opacity: 0, y: 28, x: 0, rotateZ: 0, rotateX: 0, scale: 0.985, filter: "blur(4px)" },
  ink: { opacity: 0, y: 52, x: 22, rotateZ: -4, rotateX: 12, scale: 1.03, filter: "blur(0px)" },
  bare: { opacity: 0, y: 18, x: 0, rotateZ: 0, rotateX: 0, scale: 1, filter: "blur(4px)" },
} as const;

export function WidgetShell({
  children,
  variant,
  glass = true,
  pad = 2.5,
  onTap,
  className,
  sx,
}: {
  children: ReactNode;
  variant?: ShellVariant;
  /** @deprecated usa `variant`. `false` equivale a `variant="bare"`. */
  glass?: boolean;
  pad?: number;
  onTap?: () => void;
  className?: string;
  sx?: object;
}) {
  const { reduced, step } = useMotionPrefs();
  const kind: ShellVariant = variant ?? (glass ? "card" : "bare");
  const order = useWidgetOrder();
  const enterDelay = useStaggerDelay();
  const isInk = kind === "ink";

  const shadowRest = isInk ? `${TOKENS.glossInk}, ${TOKENS.elevInk}` : undefined;
  const shadowAir = isInk ? `${TOKENS.glossInk}, ${TOKENS.elevInkAir}` : undefined;
  const surfaceClass =
    kind === "card" ? "paper lacquer" : isInk ? "ingot on-ink lacquer" : undefined;

  // Las blancas se reparten alternando el giro: la mano no las deja igual.
  const dealTilt = kind === "card" ? (order % 2 === 0 ? -1.5 : 1.5) : 0;

  const variants = {
    enter: {
      ...SHELL_ENTER[kind],
      rotateZ: isInk ? SHELL_ENTER.ink.rotateZ : dealTilt,
      ...(isInk ? { boxShadow: shadowAir } : {}),
    },
    settle: {
      opacity: 1,
      y: 0,
      x: 0,
      rotateZ: 0,
      rotateX: 0,
      scale: 1,
      filter: "blur(0px)",
      ...(isInk ? { boxShadow: shadowRest } : {}),
    },
    // El de arriba se va primero: recoger las tarjetas también es coreografía.
    leave: (i: number) => ({
      opacity: 0,
      y: -14,
      scale: 0.985,
      filter: "blur(6px)",
      transition: reduced
        ? { duration: 0 }
        : { ...springSoft, delay: Math.min(i, 5) * TOKENS.stagger * 0.5 },
    }),
  };

  return (
    <MotionBox
      layout="position"
      custom={order}
      variants={variants}
      initial="enter"
      animate="settle"
      exit="leave"
      style={{ transformPerspective: 900 }}
      transition={
        reduced
          ? { duration: 0 }
          : {
              default: { ...(isInk ? springIngot : springCard), delay: enterDelay },
              opacity: { duration: 0.18, ease: EASE_OUT, delay: enterDelay },
              filter: { duration: 0.28, ease: EASE_OUT, delay: enterDelay },
              boxShadow: { ...springIngot, delay: enterDelay + step(1) },
              layout: springSoft,
            }
      }
      whileTap={onTap ? { scale: 0.985 } : undefined}
      onTap={onTap}
      data-tappable={onTap ? "true" : undefined}
      className={[surfaceClass, className].filter(Boolean).join(" ") || undefined}
      sx={{
        borderRadius: "var(--radius-l)",
        p: pad,
        position: "relative",
        transformOrigin: isInk ? "85% 100%" : "50% 100%",
        cursor: onTap ? "pointer" : "default",
        ...(isInk ? { boxShadow: shadowRest } : {}),
        ...sx,
      }}
    >
      {children}
    </MotionBox>
  );
}

/**
 * Envoltura interior de la tarjeta roja. La tarjeta física no tiene núcleo:
 * sobrevive como padding para que el catálogo no cambie de firma.
 */
export function IngotCore({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Box className="ingot-core" sx={{ p: 2.5, ...sx }}>
      {children}
    </Box>
  );
}

/**
 * El chip de la tarjeta: de dónde salen los datos. Contactos dorados en SVG;
 * mientras corre una herramienta MCP los contactos se iluminan en secuencia.
 */
export function Chip({ active = false, size = 34 }: { active?: boolean; size?: number }) {
  const { reduced } = useMotionPrefs();
  const h = Math.round(size * 0.76);
  const cells = [0, 1, 2, 3, 4, 5];

  return (
    <Box
      component="svg"
      viewBox="0 0 34 26"
      aria-hidden
      sx={{ width: size, height: h, display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="chip-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={TOKENS.gold} />
          <stop offset="1" stopColor={TOKENS.goldDeep} />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="33" height="25" rx="4" fill="url(#chip-gold)" />
      <rect x="0.5" y="0.5" width="33" height="25" rx="4" fill="none" stroke="rgba(0,0,0,0.25)" />
      {/* Líneas de contacto */}
      <path
        d="M0.5 9 H11 M0.5 17 H11 M23 9 H33.5 M23 17 H33.5 M11 0.5 V25.5 M23 0.5 V25.5 M11 13 H23"
        stroke="rgba(60,40,0,0.45)"
        strokeWidth="1"
        fill="none"
      />
      {cells.map((i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = col === 0 ? 1.5 : 24;
        const y = 1.5 + row * 8;
        return (
          <motion.rect
            key={i}
            x={x}
            y={y}
            width="8.5"
            height="7"
            rx="1"
            fill="#FFFFFF"
            initial={{ opacity: 0 }}
            animate={active && !reduced ? { opacity: [0, 0.55, 0] } : { opacity: 0 }}
            transition={
              active && !reduced
                ? {
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 1.2,
                    delay: i * 0.12,
                    ease: EASE_OUT,
                  }
                : { duration: 0.2 }
            }
          />
        );
      })}
    </Box>
  );
}

/**
 * Parche holográfico: el dato está vivo. El tono gira con el scroll (CSS) y
 * una banda de luz lo barre una vez al repartir la tarjeta y en bucle lento
 * mientras el agente trabaja.
 */
export function Hologram({
  sweeping = false,
  delay = 0,
  width = 40,
  height = 26,
}: {
  sweeping?: boolean;
  delay?: number;
  width?: number;
  height?: number;
}) {
  const { reduced } = useMotionPrefs();

  return (
    <Box
      className="holo"
      aria-hidden
      sx={{
        width,
        height,
        borderRadius: "var(--radius-2xs)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {!reduced && (
        <MotionBox
          initial={{ x: "-120%" }}
          animate={{ x: "220%" }}
          transition={
            sweeping
              ? {
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 1.6,
                  ease: EASE_OUT,
                  repeatDelay: 0.6,
                }
              : { duration: 0.9, ease: EASE_OUT, delay }
          }
          sx={{
            position: "absolute",
            top: "-20%",
            bottom: "-20%",
            width: "45%",
            background:
              "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.85) 50%, transparent 100%)",
          }}
        />
      )}
    </Box>
  );
}

export function WidgetTitle({ children }: { children: ReactNode }) {
  return (
    <Typography variant="h5" sx={{ color: "text.primary", mb: 1.5 }}>
      {children}
    </Typography>
  );
}

/** Rótulo en versalitas de una cifra o de un bloque de datos. Nunca sobre un título. */
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

/**
 * Número que "rueda" hasta su valor. Ningún dato aparece de golpe.
 *
 * `delay` (segundos) permite que la cifra arranque DESPUÉS de que su tarjeta
 * aterrice: en el lingote la cifra rueda cuando la sombra ya se asentó.
 * `className="ingot-figure"` da el tamaño fluido de la cifra protagonista.
 */
export function RollingNumber({
  value,
  format,
  sx,
  variant = "h3",
  component,
  className,
  delay = 0,
}: {
  value: number;
  format: (n: number) => string;
  sx?: object;
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "subtitle1" | "body1" | "body2";
  component?: "p" | "span" | "div" | "strong";
  className?: string;
  delay?: number;
}) {
  const { reduced } = useMotionPrefs();
  const mv = useMotionValue(0);
  const spr = useSpring(mv, springNumber);
  const text = useTransform(spr, (n) => format(n));
  const [display, setDisplay] = useState(() => format(0));

  useEffect(() => {
    if (reduced || delay <= 0) {
      mv.set(value);
      return;
    }
    const id = window.setTimeout(() => mv.set(value), delay * 1000);
    return () => window.clearTimeout(id);
  }, [value, mv, delay, reduced]);

  useEffect(() => text.on("change", setDisplay), [text]);

  return (
    <Typography
      variant={variant}
      component={component ?? "p"}
      className={className}
      sx={{ fontVariantNumeric: "tabular-nums", ...sx }}
    >
      {reduced ? format(value) : display}
    </Typography>
  );
}

/**
 * Barra de progreso del sistema. El relleno anima `scaleX` (GPU) dentro de un
 * carril con `overflow: hidden`, así que la pastilla nunca se deforma y no se
 * toca ninguna propiedad de layout. El carril es el pozo de la rampa de arena
 * (`--surface-well`) y sobre tinta, luz diluida. Dibuja su relleno la primera
 * vez que aparece; después solo se mueve si cambia el valor.
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
        borderRadius: "var(--radius-2xs)",
        overflow: "hidden",
        backgroundColor: dark ? TOKENS.tintWhite14 : TOKENS.well,
      }}
    >
      <MotionBox
        initial={{ scaleX: 0 }}
        animate={{ scaleX: Math.max(0, Math.min(pct, 100)) / 100 }}
        transition={t({ ...springSoft, delay })}
        sx={{
          height: "100%",
          transformOrigin: "left",
          borderRadius: "var(--radius-2xs)",
          backgroundColor: color,
        }}
      />
    </Box>
  );
}

/**
 * Serie corta como UN trazo: la línea se dibuja de izquierda a derecha
 * (`pathLength`) y el área bajo ella se revela detrás. El punto final es el
 * dato de hoy. Con `axis` la serie dice de cuándo a cuándo va.
 */
export function Sparkline({
  values,
  color,
  height = 56,
  dark = false,
  delay = 0,
  axis,
}: {
  values: number[];
  color: string;
  height?: number;
  dark?: boolean;
  delay?: number;
  axis?: { start: string; end: string };
}) {
  const { t, reduced } = useMotionPrefs();
  const W = 100;
  const H = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const n = values.length;
  const pts = values.map((v, i) => ({
    x: n === 1 ? W : (i / (n - 1)) * W,
    y: H - 4 - ((v - min) / span) * (H - 8),
  }));
  // Catmull-Rom → Bézier: una curva suave que pasa por cada dato.
  let d = `M ${pts[0]?.x ?? 0} ${pts[0]?.y ?? H}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    if (!p0 || !p1 || !p2) continue;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  const area = `${d} L ${W} ${H} L 0 ${H} Z`;
  const last = pts[pts.length - 1];

  return (
    <Box>
      <Box sx={{ position: "relative", height }}>
        {/* Se revela de izquierda a derecha con clip-path: con escala no
            uniforme (`preserveAspectRatio="none"`) el guion de `pathLength`
            se descompone en tramos; el recorte no. */}
        <MotionBox
          aria-hidden
          initial={{ clipPath: "inset(-8px 100% -8px 0)" }}
          animate={{ clipPath: "inset(-8px 0% -8px 0)" }}
          transition={t({ duration: 0.9, ease: EASE_OUT, delay })}
          sx={{ position: "absolute", inset: 0 }}
        >
          <Box
            component="svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            sx={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}
          >
            <path d={area} fill={color} opacity={dark ? 0.16 : 0.1} />
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </Box>
        </MotionBox>
        {last && (
          <MotionBox
            aria-hidden
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={t({ ...spring, delay: reduced ? 0 : delay + 0.85 })}
            sx={{
              position: "absolute",
              left: `${last.x}%`,
              top: `${(last.y / H) * 100}%`,
              width: 9,
              height: 9,
              ml: "-4.5px",
              mt: "-4.5px",
              borderRadius: "50%",
              backgroundColor: color,
              boxShadow: `0 0 0 3px ${dark ? TOKENS.tintWhite24 : TOKENS.card}`,
            }}
          />
        )}
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
            sx={{ color: dark ? TOKENS.onDark : "text.secondary", fontWeight: 700 }}
          >
            {axis.end}
          </Typography>
        </Box>
      )}
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
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={t({ ...springSoft, delay: 0.05 * i })}
            sx={{
              flex: 1,
              minWidth: 3,
              height: `${Math.max(10, (v / max) * 100)}%`,
              // Crece desde el eje: transform, no height.
              transformOrigin: "bottom",
              // Solo arriba: la base tiene que morir sobre el eje.
              borderRadius: "var(--radius-2xs) var(--radius-2xs) 0 0",
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

/** Aparición escalonada de hijos (listas, bullets, chips). Paso por defecto: `--stagger`. */
export function Stagger({
  children,
  delay = TOKENS.stagger,
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
