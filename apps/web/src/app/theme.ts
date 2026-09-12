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
  red: "#EF2945",
  redDeep: "#C4102A",
  brown: "#684D3D",

  // Superficies
  canvas: "#F4F1EE",
  sunken: "#EBE5E0",
  card: "#FFFFFF",
  floating: "rgba(255,255,255,0.86)",
  ink: "#241C17",
  inkRaised: "#33291F",
  map: "#E8EDE4",
  canvasVeil: "rgba(244,241,238,0.82)",

  // Tinta
  inkDim: "#6E625A",
  inkFaint: "#A79C94",
  onDark: "#FFFFFF",
  onDarkDim: "rgba(255,255,255,0.62)",
  onDarkFaint: "rgba(255,255,255,0.42)",

  // Semántica
  good: "#0E9F6E",
  goodInk: "#076B4C",
  goodOnDark: "#3DDCA5",
  warn: "#C2610A",
  warnInk: "#8F4708",
  bad: "#D92D20",
  badInk: "#B42318",
  badOnDark: "#FF8A9B",

  // Tintes
  tintInk3: "rgba(36,28,23,0.03)",
  tintInk5: "rgba(36,28,23,0.05)",
  tintInk8: "rgba(36,28,23,0.08)",
  tintInk12: "rgba(36,28,23,0.12)",
  tintInk20: "rgba(36,28,23,0.20)",
  tintInk32: "rgba(36,28,23,0.32)",
  tintRed8: "rgba(239,41,69,0.08)",
  tintRed14: "rgba(239,41,69,0.14)",
  tintRed32: "rgba(239,41,69,0.32)",
  tintGood12: "rgba(14,159,110,0.12)",
  tintWarn10: "rgba(194,97,10,0.10)",
  tintWhite8: "rgba(255,255,255,0.08)",
  tintWhite14: "rgba(255,255,255,0.14)",

  // Rampa de datos: la primera rebanada siempre es el rojo Banorte y el resto
  // alterna claro/oscuro para que dos gajos vecinos nunca se confundan.
  viz: ["#EF2945", "#684D3D", "#C97C10", "#2D4E8A", "#1F6F5C", "#B4527F", "#8C7F76"],

  // Identidad de cada servidor MCP en el log. Sobre la hoja blanca se usan los
  // tonos profundos (AA a 12px); sobre el riel de tinta del escritorio hacen
  // falta las variantes claras o el nombre del servidor desaparece.
  srvBanorteOnDark: "#FF9AA8",
  srvResearch: "#2D4E8A",
  srvResearchOnDark: "#9DB8E8",

  // Radios
  radiusXs: "10px",
  radiusS: "14px",
  radiusM: "18px",
  radiusL: "24px",
  radiusXl: "32px",
  pill: "999px",

  // Profundidad
  hairline: "inset 0 0 0 1px rgba(36,28,23,0.05)",
  elev1: "0 1px 2px -1px rgba(36,28,23,0.10), 0 8px 20px -10px rgba(36,28,23,0.16)",
  elev2: "0 2px 4px -2px rgba(36,28,23,0.10), 0 16px 36px -16px rgba(36,28,23,0.22)",
  elev3: "0 4px 10px -4px rgba(36,28,23,0.12), 0 28px 60px -24px rgba(36,28,23,0.30)",
  elevInk: "0 2px 8px -3px rgba(36,28,23,0.34), 0 26px 54px -22px rgba(36,28,23,0.46)",
  elevPin: "0 2px 8px -1px rgba(196,16,42,0.34)",
  glossLight: "inset 0 1px 0 rgba(255,255,255,0.62)",
  glossInk: "inset 0 1px 0 rgba(255,255,255,0.09)",

  // Sobre fotografía no hay tinta que sirva: el texto va en blanco y lo que
  // garantiza el contraste es el velo. Uno solo para todas las superficies con
  // imagen, para que hero y ficha de destino se lean como el mismo material.
  scrimMedia:
    "linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.04) 45%, rgba(0,0,0,0.60) 100%)",

  // Gradientes de respaldo del hero. Van DEBAJO de la foto y de su velo, así
  // que siguen siendo profundos aunque el resto de la app sea claro. Familia
  // cálida (rojo → vino → café → ámbar → ciruela): nada frío ni neón, para que
  // el hero se lea Banorte incluso sin red.
  heroGradients: [
    "linear-gradient(135deg, #EF2945 0%, #8E0F22 58%, #2A0910 100%)",
    "linear-gradient(135deg, #C4102A 0%, #6E2A20 58%, #241610 100%)",
    "linear-gradient(135deg, #9A705A 0%, #684D3D 52%, #241C17 100%)",
    "linear-gradient(135deg, #C2610A 0%, #7A3410 58%, #2A1409 100%)",
    "linear-gradient(135deg, #8E2A4E 0%, #4A1430 58%, #1B0913 100%)",
  ],

  // Interacción
  tapMin: 44,
  focusRing: "0 0 0 2px #FFFFFF, 0 0 0 4px rgba(239,41,69,0.32)",
  focusRingInk: "0 0 0 2px #241C17, 0 0 0 4px rgba(239,41,69,0.32)",

  // Movimiento
  easeIos: "cubic-bezier(0.32,0.72,0,1)",
  easeOut: "cubic-bezier(0.16,1,0.3,1)",

  fontUi: '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontMono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

/** Cifra que cambia o que se alinea en columna: nunca sin ancho fijo. */
export const tabular = { fontVariantNumeric: "tabular-nums" } as const;

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

  shape: { borderRadius: 24 },

  // Tracking en espejo: el display comprime hasta -0.045em y el cuerpo se abre
  // a +0.005/0.01em. Ese contraste es lo que hace que los números se lean como
  // dinero y el texto como conversación.
  typography: {
    fontFamily: TOKENS.fontUi,
    h1: { fontSize: 44, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1 },
    h2: { fontSize: 36, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.02 },
    h3: { fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08 },
    h4: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.18 },
    h5: { fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.28 },
    h6: { fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.35 },
    subtitle1: { fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3 },
    subtitle2: { fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em", lineHeight: 1.35 },
    body1: { fontSize: 15, fontWeight: 400, lineHeight: 1.55, letterSpacing: "0.005em" },
    body2: { fontSize: 13.5, fontWeight: 400, lineHeight: 1.5, letterSpacing: "0.01em" },
    caption: { fontSize: 12, fontWeight: 600, lineHeight: 1.35, letterSpacing: "0.015em" },
    overline: {
      fontSize: 10.5,
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
    },
    button: { fontSize: 14.5, fontWeight: 600, letterSpacing: "0.005em", textTransform: "none" },
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
          borderRadius: TOKENS.pill,
          paddingInline: 24,
          paddingBlock: 12,
          // Objetivo táctil mínimo de 44px: cualquier botón por debajo es un
          // fallo de accesibilidad en un teléfono, no una decisión de estilo.
          minHeight: TOKENS.tapMin,
          transition:
            "transform var(--dur-micro) var(--ease-ios), background-color var(--dur-micro) var(--ease-ios)",
          "&:active": { transform: "scale(0.97)" },
          "&.Mui-focusVisible": { boxShadow: TOKENS.focusRing },
          "&.MuiButton-containedPrimary:hover": { backgroundColor: TOKENS.redDeep },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: TOKENS.pill, fontWeight: 600 } },
    },
    MuiSlider: {
      styleOverrides: {
        root: { height: 8, paddingBlock: 18 },
        thumb: {
          width: 28,
          height: 28,
          backgroundColor: TOKENS.card,
          border: `3px solid ${TOKENS.red}`,
          boxShadow: TOKENS.elev1,
          "&:hover, &.Mui-focusVisible": { boxShadow: TOKENS.focusRing },
          "&.Mui-active": { boxShadow: TOKENS.focusRing },
        },
        rail: { opacity: 1, backgroundColor: TOKENS.tintInk12 },
        track: { border: "none" },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 10, borderRadius: TOKENS.pill, backgroundColor: TOKENS.tintInk8 },
        bar: { borderRadius: TOKENS.pill },
      },
    },
  },
});
