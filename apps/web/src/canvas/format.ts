import type { Tone } from "@camaleon/shared";
import type { Theme } from "@mui/material/styles";
import { TOKENS } from "../app/theme";

/** Traduce la semántica que elige el agente al color real del tema. */
export function toneColor(tone: Tone | undefined, theme: Theme): string {
  switch (tone) {
    case "good":
      return theme.palette.success.main;
    case "warn":
      return theme.palette.warning.main;
    case "bad":
      return theme.palette.error.main;
    case "accent":
      return theme.palette.primary.main;
    default:
      return theme.palette.text.primary;
  }
}

/**
 * Igual que `toneColor`, pero para TEXTO PEQUEÑO sobre blanco. Los tonos vivos
 * se quedan por debajo de AA (4.5:1) a 15px: el rojo Banorte da 4.14:1 y el
 * verde 3.39:1. Como relleno o número grande están bien; como título no.
 */
export function toneInk(tone: Tone | undefined, theme: Theme): string {
  switch (tone) {
    case "good":
      return theme.palette.success.dark;
    case "warn":
      return theme.palette.warning.dark;
    case "bad":
      return theme.palette.error.dark;
    case "accent":
      return theme.palette.primary.dark;
    default:
      return theme.palette.text.primary;
  }
}

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const mxnCents = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number, cents = false): string {
  return (cents ? mxnCents : mxn).format(value);
}

const dateTime = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Fecha corta para listas (historial, planes). Un ISO roto no tumba la lista. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateTime.format(d);
}

export function formatUnit(value: number, unit: "MXN" | "pct" | "months" | "count"): string {
  switch (unit) {
    case "pct":
      return `${value.toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`;
    case "months":
      return `${Math.round(value)} ${Math.round(value) === 1 ? "mes" : "meses"}`;
    case "count":
      return value.toLocaleString("es-MX");
    default:
      return formatMoney(value);
  }
}

/** Mensualidad de un crédito a tasa fija (sistema francés). */
export function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const i = annualRatePct / 100 / 12;
  if (i === 0) return principal / months;
  return (principal * i) / (1 - (1 + i) ** -months);
}

/** Hash estable: la misma pregunta siempre pinta el mismo hero. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * El hero SIEMPRE se ve intencional aunque no haya wifi: el gradiente de
 * respaldo es el piso y la imagen remota se monta encima solo si carga.
 * La rampa vive en `TOKENS.heroGradients`; aquí solo se elige una.
 */
export function heroGradient(query: string): string {
  const ramps = TOKENS.heroGradients;
  return ramps[hash(query) % ramps.length] as string;
}

/**
 * Fotos curadas por intención. Un buscador aleatorio devolvía gatos cuando
 * pedíamos un Mazda; en un pitch eso mata la credibilidad. Estas son fijas,
 * relevantes y cargan directo del CDN de Unsplash (sin API key).
 */
const HERO_PHOTOS: { match: RegExp; id: string }[] = [
  // Manos al volante: sin logo de otra marca compitiendo con el título.
  {
    match: /auto|carro|coche|mazda|nissan|toyota|honda|vehic|camioneta/,
    id: "photo-1449965408869-eaa3f722e40d",
  },
  {
    match: /casa|depa|departamento|hipotec|inmueble|enganche de casa/,
    id: "photo-1560518883-ce09059eeffa",
  },
  { match: /viaj|japon|tokio|europa|vacac|vuelo|avion/, id: "photo-1540959733332-eab4deabeeaf" },
  { match: /invers|cetes|pagare|fondo|bolsa|rendimiento/, id: "photo-1611974789855-9c2a0a7236a3" },
  { match: /ahorr|meta|apartado|fondo de emergencia|dinero/, id: "photo-1554224155-6726b3ff858f" },
];

const HERO_FALLBACK = "photo-1518105779142-d975f22f1b0a";

/** Imagen de fondo determinista y sin API key. */
export function imageUrl(query: string, w = 800, h = 600): string {
  const q = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const hit = HERO_PHOTOS.find((p) => p.match.test(q));
  return `https://images.unsplash.com/${hit?.id ?? HERO_FALLBACK}?w=${w}&h=${h}&fit=crop&q=70`;
}
