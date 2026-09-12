import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import { formatMoney, toneColor } from "../format";
import { ActionButton } from "./action";
import { Milestones, SectionLabel } from "./bits";
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
 */
export function PlanWidget({ props }: { props: WidgetProps["plan"] }) {
  const theme = useTheme();
  const { t } = useMotionPrefs();
  const [picked, setPicked] = useState(0);
  const covered = Math.min(props.current / Math.max(props.target, 1), 1);
  const timeline = props.timeline ?? [];

  return (
    <WidgetShell>
      <WidgetTitle>{props.title}</WidgetTitle>

      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1 }}>
        <RollingNumber
          value={props.current}
          format={(n) => formatMoney(n)}
          variant="h3"
          sx={{ color: "text.primary" }}
        />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          de {formatMoney(props.target)}
        </Typography>
      </Box>

      <Meter pct={covered * 100} color={TOKENS.red} height={10} delay={0.12} />

      {props.caption && (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.25 }}>
          {props.caption}
        </Typography>
      )}

      <Stagger sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2.5 }}>
        {props.options.map((opt, i) => {
          const active = picked === i;
          const color = toneColor(opt.tone === "neutral" ? "accent" : opt.tone, theme);
          return (
            <MotionButton
              key={opt.label}
              type="button"
              variants={staggerItem}
              whileTap={{ scale: 0.985 }}
              aria-pressed={active}
              onClick={() => setPicked(i)}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.25,
                width: "100%",
                p: 1.75,
                // Cada ritmo es un objetivo de pulgar: por debajo de 44px se
                // elige el de al lado.
                minHeight: "var(--tap-min)",
                borderRadius: "var(--radius-m)",
                transition:
                  "background-color var(--dur-micro) var(--ease-ios), box-shadow var(--dur-micro) var(--ease-ios)",
                backgroundColor: active ? TOKENS.tintRed8 : TOKENS.tintInk3,
                boxShadow: active ? `inset 0 0 0 1px ${TOKENS.tintRed32}` : "none",
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  mt: 0.25,
                  flexShrink: 0,
                  borderRadius: "var(--radius-pill)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: `inset 0 0 0 1.5px ${active ? color : TOKENS.tintInk20}`,
                }}
              >
                <MotionBox
                  animate={{ scale: active ? 1 : 0 }}
                  transition={t(spring)}
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: color,
                  }}
                />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {opt.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.25, overflowWrap: "anywhere" }}
                >
                  {opt.sublabel}
                </Typography>
              </Box>

              {opt.badge && (
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: "var(--radius-pill)",
                    flexShrink: 0,
                    backgroundColor: TOKENS.tintRed14,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "primary.dark", fontWeight: 700 }}>
                    {opt.badge}
                  </Typography>
                </Box>
              )}
            </MotionButton>
          );
        })}
      </Stagger>

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
