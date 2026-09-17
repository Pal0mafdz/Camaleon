import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useId, useState } from "react";
import { TOKENS } from "../../app/theme";
import { formatMoney, toneColor } from "../format";
import { ActionButton } from "./action";
import { Milestones, SectionLabel, TonePill } from "./bits";
import {
  Meter,
  MotionBox,
  MotionButton,
  RollingNumber,
  Stagger,
  spring,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
  WidgetTitle,
} from "./shell";

/**
 * "Cómo lo pagas": avance real, ritmos comparables y el botón que lo vuelve
 * cierto. Elegir un ritmo es local — no cuesta un turno del agente.
 *
 * Composición: la cifra es lo ahorrado, el dato de apoyo cuánto falta y el
 * ritmo elegido; la acción es crear el apartado. El indicador de ritmo es un
 * solo relleno que se desliza (`layoutId`) entre opciones: cambiar de ritmo
 * se ve como mover una ficha, no como encender y apagar dos casillas.
 */
export function PlanWidget({ props }: { props: WidgetProps["plan"] }) {
  const theme = useTheme();
  const { t, step } = useMotionPrefs();
  const uid = useId();
  const [picked, setPicked] = useState(0);
  const covered = Math.min(props.current / Math.max(props.target, 1), 1);
  const remaining = Math.max(props.target - props.current, 0);
  const timeline = props.timeline ?? [];

  return (
    <WidgetShell>
      <WidgetTitle>{props.title}</WidgetTitle>

      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          columnGap: 1,
          rowGap: 0.25,
          mb: 1.25,
        }}
      >
        <RollingNumber
          value={props.current}
          format={(n) => formatMoney(n)}
          variant="h3"
          delay={step(1)}
          sx={{ color: "text.primary", minWidth: 0, overflowWrap: "anywhere" }}
        />
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
        >
          de {formatMoney(props.target)}
        </Typography>
      </Box>

      <Meter pct={covered * 100} color={TOKENS.red} height={10} delay={step(2)} />

      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mt: 1.25,
          fontVariantNumeric: "tabular-nums",
          overflowWrap: "anywhere",
        }}
      >
        {props.caption ??
          (remaining > 0 ? `Faltan ${formatMoney(remaining)}` : "Ya tienes el monto completo")}
      </Typography>

      <Box sx={{ mt: 2.5 }}>
        <SectionLabel>A qué ritmo</SectionLabel>
      </Box>
      <Box role="radiogroup" aria-label="Ritmo de ahorro">
        <Stagger sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {props.options.map((opt, i) => {
            const active = picked === i;
            const color = toneColor(opt.tone === "neutral" ? "accent" : opt.tone, theme);
            return (
              <MotionButton
                key={opt.label}
                type="button"
                role="radio"
                aria-checked={active}
                variants={staggerItem}
                whileTap={{ scale: 0.985 }}
                transition={t(spring)}
                onClick={() => setPicked(i)}
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.25,
                  width: "100%",
                  p: 1.75,
                  // Cada ritmo es un objetivo de pulgar: por debajo de 44px se
                  // elige el de al lado.
                  minHeight: "var(--tap-min)",
                  borderRadius: "var(--radius-m)",
                }}
              >
                {active && (
                  <MotionBox
                    layoutId={`${uid}-pick`}
                    transition={t(spring)}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "var(--radius-m)",
                      backgroundColor: TOKENS.tintRed8,
                      boxShadow: `inset 0 0 0 1.5px ${TOKENS.tintRed32}`,
                    }}
                    aria-hidden
                  />
                )}

                <Box
                  sx={{
                    position: "relative",
                    width: 20,
                    height: 20,
                    mt: 0.25,
                    flexShrink: 0,
                    borderRadius: "var(--radius-pill)",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: `inset 0 0 0 1.5px ${active ? color : TOKENS.tintInk20}`,
                    transition: "box-shadow var(--dur-micro) var(--ease-ios)",
                  }}
                  aria-hidden
                >
                  <MotionBox
                    initial={false}
                    animate={{ scale: active ? 1 : 0 }}
                    transition={t(spring)}
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: color,
                    }}
                  />
                </Box>

                <Box sx={{ position: "relative", flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: active ? 700 : 600, overflowWrap: "anywhere" }}
                  >
                    {opt.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: active ? "text.primary" : "text.secondary",
                      mt: 0.25,
                      fontVariantNumeric: "tabular-nums",
                      overflowWrap: "anywhere",
                      transition: "color var(--dur-micro) var(--ease-ios)",
                    }}
                  >
                    {opt.sublabel}
                  </Typography>
                </Box>

                {opt.badge && (
                  <Box sx={{ position: "relative", flexShrink: 0 }}>
                    <TonePill tone="accent">{opt.badge}</TonePill>
                  </Box>
                )}
              </MotionButton>
            );
          })}
        </Stagger>
      </Box>

      {timeline.length > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <SectionLabel>Cómo se ve el camino</SectionLabel>
          <Milestones steps={timeline} dotColor={theme.palette.primary.main} />
        </Box>
      )}

      {props.action && (
        <Box sx={{ mt: 2.5 }}>
          <ActionButton action={props.action} />
        </Box>
      )}
    </WidgetShell>
  );
}
