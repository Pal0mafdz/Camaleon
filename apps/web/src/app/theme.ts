import { createTheme } from "@mui/material/styles";

/**
 * Tema Camaleón — proyección tipada de la capa de tokens de `index.css`.
 *
 * `TOKENS` y las custom properties CSS son el MISMO sistema escrito dos veces:
 * CSS para lo que se estiliza por clase, TS para lo que se estiliza por `sx`.
 * El contrato completo (con el porqué de cada valor) vive en `DESIGN.md`.
 *
 * Regla dura: ningún componente escribe un hex ni un `rgba()`. Si falta un
 * color, entra primero a DESIGN.md, luego aquí y a `index.css`, y recién
 * después se usa.
 */

export const TOKENS = {
  // Marca
  red: "#EB0029",
  redDeep: "#B8001F",
  redDark: "#7A0A1C",
  garnet: "#7A0A1C",
  gold: "#D4A64A",
  goldDeep: "#9C7A3C",
  /** Segundo color de datos y secundario MUI: el metal del chip. */
  brown: "#9C7A3C",

  // Superficies (mesa laminada: mesa → hundido → pozo)
  canvas: "#EDEBE8",
  sunken: "#E3E0DC",
  well: "#D8D4CF",
  card: "#FFFFFF",
  cardPanel: "#F7F6F4",
  floating: "rgba(255,255,255,0.90)",
  floatingSolid: "rgba(255,255,255,0.96)",
  ink: "#1B1614",
  inkRaised: "#2A2320",
  inkDeep: "#120E0C",
  map: "#E6EBE3",
  canvasVeil: "rgba(237,235,232,0.86)",
  /** La tarjeta roja: rojo Banorte → granate. */
  brandSurface: "linear-gradient(155deg, #EB0029 0%, #C4001F 42%, #7A0A1C 100%)",

  // Tinta
  inkDim: "#5B534E",
  inkFaint: "#6E655F",
  onDark: "#FFFFFF",
  onDarkDim: "rgba(255,255,255,0.92)",
  onDarkFaint: "rgba(255,255,255,0.86)",

  // Semántica
  good: "#0E9F6E",
  goodInk: "#076B4C",
  goodOnDark: "#8FF0C6",
  warn: "#C2610A",
  warnInk: "#8F4708",
  bad: "#D92D20",
  badInk: "#B42318",
  badOnDark: "#FFC2C9",

  // Tintes
  tintInk3: "rgba(27,22,20,0.03)",
  tintInk5: "rgba(27,22,20,0.06)",
  tintInk8: "rgba(27,22,20,0.08)",
  tintInk12: "rgba(27,22,20,0.12)",
  tintInk20: "rgba(27,22,20,0.20)",
  tintInk32: "rgba(27,22,20,0.36)",
  tintRed8: "rgba(235,0,41,0.08)",
  tintRed14: "rgba(235,0,41,0.14)",
  tintRed32: "rgba(235,0,41,0.32)",
  tintGood12: "rgba(14,159,110,0.12)",
  tintWarn10: "rgba(194,97,10,0.10)",
  tintBad8: "rgba(217,45,32,0.08)",
  tintGarnet30: "rgba(122,10,28,0.30)",
  /** @deprecated alias de `tintGarnet30`. */
  tintBrown30: "rgba(122,10,28,0.30)",
  tintWhite8: "rgba(255,255,255,0.10)",
  tintWhite14: "rgba(255,255,255,0.16)",
  tintWhite24: "rgba(255,255,255,0.26)",
  tintWhite55: "rgba(255,255,255,0.60)",

  // Rampa de datos: la primera rebanada siempre es el rojo Banorte, la segunda
  // el metal del chip, y el resto alterna claro/oscuro para que dos gajos
  // vecinos nunca se confundan.
  viz: ["#EB0029", "#9C7A3C", "#2D4E8A", "#1F6F5C", "#B4527F", "#C97C10", "#8C7F76"],

  srvBanorteOnDark: "#FF9AA8",
  srvResearch: "#2D4E8A",
  srvResearchOnDark: "#9DB8E8",

  // Radios (proporción ISO 7810: ~3.7 % del ancho de la tarjeta)
  radius2xs: "3px",
  radiusXs: "6px",
  radiusS: "8px",
  radiusM: "10px",
  radiusL: "12px",
  radiusXl: "18px",
  /** Alias histórico: en este mundo nada es cápsula, resuelve al radio de control. */
  pill: "8px",

  // Profundidad
  hairline: "inset 0 0 0 1px rgba(27,22,20,0.06)",
  elev1: "0 1px 2px rgba(27,22,20,0.06), 0 10px 24px -12px rgba(27,22,20,0.20)",
  elev2: "0 2px 4px rgba(27,22,20,0.06), 0 16px 36px -14px rgba(27,22,20,0.26)",
  elev3: "0 4px 10px -4px rgba(27,22,20,0.12), 0 26px 60px -22px rgba(27,22,20,0.34)",
  elevInk: "0 2px 6px -2px rgba(122,10,28,0.38), 0 26px 50px -20px rgba(122,10,28,0.50)",
  // La tarjeta roja en el aire: misma estructura (dos sombras) que `elevInk`
  // para que motion interpole de una a otra al apoyarse.
  elevInkAir: "0 20px 34px -12px rgba(122,10,28,0.24), 0 64px 96px -30px rgba(122,10,28,0.38)",
  elevPin: "0 2px 8px -1px rgba(184,0,31,0.36)",
  /** La hoja de la app sobre la mesa granate del escritorio. */
  elevSheet: "0 40px 80px -30px rgba(0,0,0,0.60)",
  glossLight: "inset 0 1px 0 rgba(255,255,255,0.75)",
  glossInk: "inset 0 1px 0 rgba(255,255,255,0.24)",

  scrimMedia:
    "linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.04) 45%, rgba(0,0,0,0.60) 100%)",

  // Gradientes de respaldo del hero (debajo de la foto y su velo). Familia de
  // la tarjeta: rojo → granate → tinta; metal; azul profundo; verde bosque.
  heroGradients: [
    "linear-gradient(135deg, #EB0029 0%, #7A0A1C 58%, #2A0910 100%)",
    "linear-gradient(135deg, #B8001F 0%, #5E0716 58%, #1B1614 100%)",
    "linear-gradient(135deg, #D4A64A 0%, #9C7A3C 52%, #1B1614 100%)",
    "linear-gradient(135deg, #2D4E8A 0%, #1C3159 58%, #120E0C 100%)",
    "linear-gradient(135deg, #1F6F5C 0%, #124237 58%, #120E0C 100%)",
  ],

  // Interacción
  tapMin: 44,
  focusRing: "0 0 0 2px #FFFFFF, 0 0 0 4px rgba(235,0,41,0.32)",
  focusRingInk: "0 0 0 2px #7A0A1C, 0 0 0 4px rgba(255,255,255,0.55)",

  // Movimiento
  easeIos: "cubic-bezier(0.32,0.72,0,1)",
  easeOut: "cubic-bezier(0.16,1,0.3,1)",
  /** Paso de la coreografía de entrada, en segundos (40ms). */
  stagger: 0.04,
  /** Ventana (ms) en la que dos montajes cuentan como el mismo lote. */
  staggerWindow: 160,
  /** Tope de pasos de stagger: con 15 widgets nadie espera 600ms. */
  staggerMax: 6,

  fontUi: '"Montserrat", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontMono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

/** Cifra que cambia o que se alinea en columna: nunca sin ancho fijo. */
export const tabular = { fontVariantNumeric: "tabular-nums" } as const;

/**
 * Muelles del sistema (`motion/react`). Viven aquí, junto a los demás tokens,
 * y `canvas/widgets/shell.tsx` los re-exporta para el catálogo.
 *
 *  spring        press, morph de icono, chevron
 *  springSoft    expandir, barras, hojas, reacomodo de layout
 *  springNumber  RollingNumber
 *  springCard    la tarjeta blanca que se reparte: rápida, sin rebote
 *  springIngot   la firma: la tarjeta roja se entrega (mass 1.1) y se apoya
 */
export const SPRINGS = {
  spring: { type: "spring", stiffness: 400, damping: 25, mass: 0.6 },
  springSoft: { type: "spring", stiffness: 220, damping: 28 },
  springNumber: { stiffness: 90, damping: 20, mass: 0.8 },
  springCard: { type: "spring", stiffness: 300, damping: 26, mass: 0.8 },
  springIngot: { type: "spring", stiffness: 230, damping: 24, mass: 1.1 },
} as const;

/** Curva de salida (exponencial) como tupla para `motion`: la de `--ease-out`. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
/** La de `--ease-ios`, para tweens cortos (barrido del esqueleto, velos). */
export const EASE_IOS = [0.32, 0.72, 0, 1] as const;

export const theme = createTheme({
  palette: {
    mode: "light",
    background: { default: TOKENS.canvas, paper: TOKENS.card },
    primary: { main: TOKENS.red, dark: TOKENS.redDeep, contrastText: TOKENS.onDark },
    secondary: { main: TOKENS.brown, contrastText: TOKENS.onDark },
    // Las variantes `dark` existen para TEXTO PEQUEÑO sobre blanco: los tonos
    // vivos se quedan cortos de AA (4.5:1) a 15px, aunque funcionan de sobra
    // como relleno, icono o número grande. Ver `toneColor` vs `toneInk`.
    success: { main: TOKENS.good, dark: TOKENS.goodInk },
    warning: { main: TOKENS.warn, dark: TOKENS.warnInk },
    error: { main: TOKENS.bad, dark: TOKENS.badInk },
    text: { primary: TOKENS.ink, secondary: TOKENS.inkDim, disabled: TOKENS.inkFaint },
    divider: TOKENS.tintInk8,
  },

  shape: { borderRadius: 12 },

  // Montserrat es ancha: el display comprime hasta -0.035em y el cuerpo va a
  // tracking neutro. Las cifras se leen como dinero; el texto, como asesor.
  typography: {
    fontFamily: TOKENS.fontUi,
    h1: { fontSize: 40, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.02 },
    h2: { fontSize: 34, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.04 },
    h3: { fontSize: 27, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1 },
    h4: { fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 },
    h5: { fontSize: 17, fontWeight: 600, letterSpacing: "-0.012em", lineHeight: 1.3 },
    h6: { fontSize: 15, fontWeight: 600, letterSpacing: "-0.008em", lineHeight: 1.35 },
    subtitle1: { fontSize: 16, fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.3 },
    subtitle2: { fontSize: 14, fontWeight: 600, letterSpacing: "0", lineHeight: 1.35 },
    body1: { fontSize: 15, fontWeight: 400, lineHeight: 1.55, letterSpacing: "0" },
    body2: { fontSize: 13.5, fontWeight: 400, lineHeight: 1.5, letterSpacing: "0.005em" },
    caption: { fontSize: 12, fontWeight: 600, lineHeight: 1.35, letterSpacing: "0.01em" },
    overline: {
      fontSize: 10.5,
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    },
    button: { fontSize: 14.5, fontWeight: 600, letterSpacing: "0", textTransform: "none" },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: TOKENS.canvas } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
      styleOverrides: {
        root: {
          // Controles rectangulares: en el mundo de la tarjeta nada es píldora.
          borderRadius: TOKENS.radiusS,
          paddingInline: 20,
          paddingBlock: 12,
          minHeight: TOKENS.tapMin,
          transition:
            "transform var(--dur-micro) var(--ease-ios), background-color var(--dur-micro) var(--ease-ios)",
          "&:active": { transform: "scale(0.97)" },
          "&.Mui-focusVisible": { boxShadow: TOKENS.focusRing },
          "&.MuiButton-containedPrimary:hover": { backgroundColor: TOKENS.redDeep },
          "&.Mui-disabled": { backgroundColor: TOKENS.well, color: TOKENS.inkFaint },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: TOKENS.radiusS, fontWeight: 600 } },
    },
    MuiSlider: {
      styleOverrides: {
        root: { height: 8, paddingBlock: 18 },
        thumb: {
          width: 26,
          height: 26,
          borderRadius: TOKENS.radiusXs,
          backgroundColor: TOKENS.card,
          border: `3px solid ${TOKENS.red}`,
          boxShadow: TOKENS.elev1,
          transition:
            "transform var(--dur-micro) var(--ease-ios), box-shadow var(--dur-micro) var(--ease-ios)",
          "&:hover, &.Mui-focusVisible": { boxShadow: TOKENS.focusRing },
          "&.Mui-active": {
            boxShadow: TOKENS.focusRing,
            transform: "translate(-50%, -50%) scale(1.12)",
          },
        },
        rail: { opacity: 1, backgroundColor: TOKENS.well, borderRadius: TOKENS.radius2xs },
        track: { border: "none", borderRadius: TOKENS.radius2xs },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 8, borderRadius: TOKENS.radius2xs, backgroundColor: TOKENS.well },
        bar: { borderRadius: TOKENS.radius2xs },
      },
    },
  },
});
