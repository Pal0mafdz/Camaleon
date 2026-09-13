import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Star } from "lucide-react";
import { EASE_OUT, TOKENS } from "../../app/theme";
import { AskPill, TonePill } from "./bits";
import {
  MotionBox,
  motion,
  spring,
  springSoft,
  useMotionPrefs,
  WidgetShell,
  WidgetTitle,
} from "./shell";

/**
 * La ruta como mapa, no como lista. No usamos tiles reales: un plano verde con
 * paradas numeradas cuenta el itinerario sin pedir red ni API key.
 *
 * Coreografía: la ruta se traza sola (`pathLength`) y cada pin cae desde
 * arriba con muelle cuando la línea llega a su parada; la sombra roja
 * (`--elev-pin`) lo despega del plano. La tarjeta del lugar entra después.
 */

const MAP_H = 280;
const PIN = 28;
const ROUTE_DUR = 0.9;

type Pin = WidgetProps["mapa"]["stops"][number] & {
  key: string;
  x: number;
  y: number;
  /** Etiqueta hacia la izquierda: el pin está en la mitad derecha del plano. */
  flip: boolean;
};

/** Curva suave que pasa por todas las paradas (Catmull-Rom → Bézier cúbica). */
function routePath(pins: Pin[]): string {
  if (pins.length === 0) return "";
  if (pins.length === 1) {
    const p = pins[0] as Pin;
    return `M ${p.x},${p.y}`;
  }
  const d = [`M ${(pins[0] as Pin).x},${(pins[0] as Pin).y}`];
  for (let i = 0; i < pins.length - 1; i++) {
    const p0 = pins[Math.max(i - 1, 0)] as Pin;
    const p1 = pins[i] as Pin;
    const p2 = pins[i + 1] as Pin;
    const p3 = pins[Math.min(i + 2, pins.length - 1)] as Pin;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`);
  }
  return d.join(" ");
}

export function MapaWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["mapa"];
  onAsk?: (q: string) => void;
}) {
  const { t, reduced, step } = useMotionPrefs();
  const n = props.stops.length;
  // El índice se consume aquí, no dentro del JSX: las paradas pueden repetir nombre.
  const pins: Pin[] = props.stops.map((s, i) => {
    const k = n > 1 ? i / (n - 1) : 0.5;
    // Zigzag suave para que la ruta no sea una diagonal muerta.
    const wave = n > 2 ? Math.sin(k * Math.PI) * (i % 2 === 0 ? 8 : -8) : 0;
    return {
      ...s,
      key: `stop-${i}`,
      x: 18 + k * 60 + wave,
      y: 20 + k * 60,
      flip: k > 0.5,
    };
  });
  const route = routePath(pins);
  const routeDelay = step(1);
  const routeDur = reduced ? 0 : ROUTE_DUR;
  /** Cada pin cae cuando la línea pasa por su parada. */
  const pinDelay = (i: number) => routeDelay + (n > 1 ? (i / (n - 1)) * routeDur : 0);
  const cardDelay = routeDelay + routeDur;
  const detail = props.card.ask;

  return (
    <WidgetShell pad={0} sx={{ overflow: "hidden" }}>
      <Box sx={{ px: 2.5, pt: 2.5 }}>
        <WidgetTitle>{props.title}</WidgetTitle>
      </Box>

      <Box
        sx={{
          position: "relative",
          height: MAP_H,
          backgroundColor: TOKENS.map,
          overflow: "hidden",
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          aria-hidden
        >
          {/* Carril de la ruta: siempre visible, para que la línea tenga dónde dibujarse. */}
          <path
            d={route}
            fill="none"
            stroke={TOKENS.tintInk8}
            strokeWidth={4}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <motion.path
            d={route}
            fill="none"
            stroke={TOKENS.redDeep}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={t({ duration: routeDur, ease: EASE_OUT, delay: routeDelay })}
          />
        </Box>

        {pins.map((p, i) => (
          <MotionBox
            key={p.key}
            initial={{ opacity: 0, y: -36, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              reduced
                ? { duration: 0 }
                : {
                    ...spring,
                    stiffness: 520,
                    damping: 22,
                    delay: pinDelay(i),
                    opacity: { duration: 0.12, delay: pinDelay(i) },
                  }
            }
            sx={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              display: "flex",
              flexDirection: p.flip ? "row-reverse" : "row",
              alignItems: "center",
              gap: 1,
              maxWidth: "58%",
              // El pin queda centrado en su parada; la etiqueta cuelga hacia el lado libre.
              translate: p.flip ? `calc(-100% + ${PIN / 2}px) -50%` : `-${PIN / 2}px -50%`,
            }}
          >
            <Box
              sx={{
                width: PIN,
                height: PIN,
                borderRadius: "var(--radius-pill)",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                backgroundColor: TOKENS.red,
                boxShadow: `${TOKENS.elevPin}, inset 0 0 0 2px ${TOKENS.card}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: TOKENS.onDark, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
              >
                {p.n}
              </Typography>
            </Box>
            <Box
              className="paper"
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: "var(--radius-pill)",
                minWidth: 0,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.primary",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.label}
                {p.sublabel && (
                  <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
                    {" · "}
                    {p.sublabel}
                  </Box>
                )}
              </Typography>
            </Box>
          </MotionBox>
        ))}
      </Box>

      {/* La ficha del lugar entra cuando la ruta ya llegó al final. */}
      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t({ ...springSoft, delay: cardDelay })}
        sx={{ px: 2.5, py: 2.25 }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: "text.primary", overflowWrap: "anywhere" }}>
            {props.card.title}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 0.75,
              mt: 0.75,
            }}
          >
            <TonePill tone="accent">{props.card.kicker}</TonePill>
            {props.card.rating && (
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                <Star
                  size={13}
                  strokeWidth={2.4}
                  color={TOKENS.warn}
                  fill={TOKENS.warn}
                  aria-hidden
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: TOKENS.warnInk,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {props.card.rating.replace(/^[★⭐]\s*/u, "")}
                </Typography>
              </Box>
            )}
            {props.card.meta && (
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 500 }}>
                {props.card.meta}
              </Typography>
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mt: 1.25, overflowWrap: "anywhere" }}
          >
            {props.card.body}
          </Typography>
        </Box>

        {(detail || props.ask) && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
            {detail && (
              <AskPill
                label={`Ver detalle de ${props.card.title}`}
                question={detail}
                onAsk={onAsk}
                variant="paper"
              />
            )}
            {props.ask && (
              <AskPill
                label={props.ask.label}
                question={props.ask.ask}
                onAsk={onAsk}
                variant="ink"
              />
            )}
          </Box>
        )}
      </MotionBox>
    </WidgetShell>
  );
}
