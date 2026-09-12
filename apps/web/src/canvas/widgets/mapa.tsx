import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { TOKENS } from "../../app/theme";
import { AskPill } from "./bits";
import {
  Label,
  MotionBox,
  MotionButton,
  motion,
  Stagger,
  spring,
  springSoft,
  staggerItem,
  WidgetShell,
  WidgetTitle,
} from "./shell";

/**
 * La ruta como mapa, no como lista. No usamos tiles reales: un plano verde con
 * paradas numeradas cuenta el itinerario sin pedir red ni API key.
 */

export function MapaWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["mapa"];
  onAsk?: (q: string) => void;
}) {
  const n = props.stops.length;
  // El índice se consume aquí, no dentro del JSX: las paradas pueden repetir nombre.
  const pins = props.stops.map((s, i) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    return { ...s, key: `stop-${i}`, x: 20 + t * 56, y: 22 + t * 58 };
  });
  const line = pins.map((p) => `${p.x},${p.y}`).join(" ");
  const detail = props.card.ask;

  return (
    <WidgetShell pad={0} sx={{ overflow: "hidden" }}>
      <Box sx={{ px: 2.5, pt: 2.5 }}>
        <WidgetTitle>{props.title}</WidgetTitle>
      </Box>

      <Box sx={{ position: "relative", height: 300, backgroundColor: TOKENS.map }}>
        <Box
          component="svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <title>Ruta</title>
          <motion.polyline
            points={line}
            fill="none"
            stroke={TOKENS.redDeep}
            strokeWidth={2}
            strokeDasharray="4 4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          />
        </Box>

        {pins.map((p, i) => (
          <MotionBox
            key={p.key}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring, delay: 0.12 * i }}
            sx={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: "translate(-13px, -50%)",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                backgroundColor: TOKENS.red,
                boxShadow: TOKENS.elevPin,
              }}
            >
              <Typography variant="caption" sx={{ color: TOKENS.onDark, fontWeight: 700 }}>
                {p.n}
              </Typography>
            </Box>
            <Box
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                whiteSpace: "nowrap",
                backgroundColor: "background.paper",
                boxShadow: TOKENS.elev1,
              }}
            >
              <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 600 }}>
                {p.label}
              </Typography>
              {p.sublabel && (
                <Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>
                  {" · "}
                  {p.sublabel}
                </Typography>
              )}
            </Box>
          </MotionBox>
        ))}
      </Box>

      <Stagger sx={{ px: 2.5, py: 2.25, backgroundColor: "background.paper" }}>
        <MotionBox variants={staggerItem}>
          <Label>{props.card.kicker}</Label>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
              {props.card.title}
            </Typography>
            {props.card.rating && (
              <Typography variant="body2" sx={{ color: "warning.dark", fontWeight: 600 }}>
                {props.card.rating}
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75 }}>
            {props.card.body}
          </Typography>
          {props.card.meta && (
            <Typography
              variant="caption"
              sx={{ color: "text.disabled", display: "block", mt: 0.5 }}
            >
              {props.card.meta}
            </Typography>
          )}
        </MotionBox>

        {detail && (
          <MotionBox variants={staggerItem} sx={{ mt: 1.25 }}>
            <MotionButton
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onAsk?.(detail)}
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, py: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: "primary.dark", fontWeight: 600 }}>
                Ver detalle →
              </Typography>
            </MotionButton>
          </MotionBox>
        )}

        {props.ask && (
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSoft, delay: 0.25 }}
            sx={{ mt: 2 }}
          >
            <AskPill label={props.ask.label} question={props.ask.ask} onAsk={onAsk} variant="ink" />
          </MotionBox>
        )}
      </Stagger>
    </WidgetShell>
  );
}
