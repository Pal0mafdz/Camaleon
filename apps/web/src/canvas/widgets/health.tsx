import type { Tone, WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import { toneColor, toneInk } from "../format";
import { AskPill, Expand, SectionLabel, TapHeader } from "./bits";
import {
  Meter,
  MotionBox,
  motion,
  Sparkbars,
  Stagger,
  springSoft,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
} from "./shell";

/**
 * Salud financiera 0-100. El anillo se dibuja solo y el número lo ancla;
 * al tocarlo se abre el desglose de qué la sostiene.
 */

const RING = 132;
const R = 54;
const C = 2 * Math.PI * R;

function scoreTone(score: number): Tone {
  if (score >= 70) return "good";
  if (score >= 40) return "warn";
  return "bad";
}

export function HealthWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["health"];
  onAsk?: (q: string) => void;
}) {
  const theme = useTheme();
  const { t } = useMotionPrefs();
  const [open, setOpen] = useState(false);
  const tone = scoreTone(props.score);
  const color = toneColor(tone, theme);
  const dash = (Math.min(props.score, 100) / 100) * C;
  const history = props.history ?? [];

  return (
    <WidgetShell>
      <TapHeader expanded={open} onToggle={() => setOpen((v) => !v)}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
          <Box sx={{ position: "relative", width: RING, height: RING, flexShrink: 0 }}>
            <Box
              component="svg"
              viewBox={`0 0 ${RING} ${RING}`}
              sx={{ width: RING, height: RING, transform: "rotate(-90deg)" }}
            >
              <title>Salud financiera</title>
              <circle
                cx={RING / 2}
                cy={RING / 2}
                r={R}
                fill="none"
                stroke={TOKENS.tintInk8}
                strokeWidth={12}
              />
              <motion.circle
                cx={RING / 2}
                cy={RING / 2}
                r={R}
                fill="none"
                stroke={color}
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${C - dash}`}
                initial={{ strokeDashoffset: dash }}
                animate={{ strokeDashoffset: 0 }}
                transition={t({ ...springSoft, delay: 0.1 })}
              />
            </Box>
            <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <Typography variant="h2" sx={{ color, fontVariantNumeric: "tabular-nums" }}>
                {props.score}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ color: toneInk(tone, theme) }}>
              {props.status}
            </Typography>
            {props.caption && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5, overflowWrap: "anywhere" }}
              >
                {props.caption}
              </Typography>
            )}
          </Box>
        </Box>
      </TapHeader>

      <Expand open={open}>
        <Stagger sx={{ pt: 2.5 }}>
          <MotionBox variants={staggerItem}>
            <SectionLabel>Qué la compone</SectionLabel>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {props.factors.map((f, i) => (
                <Box key={f.label}>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.625 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
                      {f.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: toneInk(f.tone, theme), flexShrink: 0 }}
                    >
                      {f.status}
                    </Typography>
                  </Box>
                  <Meter pct={f.pct} color={toneColor(f.tone, theme)} height={6} delay={0.06 * i} />
                </Box>
              ))}
            </Box>
          </MotionBox>

          {history.length > 1 && (
            <MotionBox variants={staggerItem} sx={{ mt: 2.5 }}>
              <SectionLabel>Meses recientes</SectionLabel>
              <Sparkbars
                values={history}
                color={TOKENS.good}
                height={40}
                axis={{
                  start: String(history[0]),
                  end: String(history[history.length - 1]),
                }}
              />
            </MotionBox>
          )}

          {props.ask && (
            <MotionBox variants={staggerItem} sx={{ mt: 2.5 }}>
              <AskPill label={props.ask.label} question={props.ask.ask} onAsk={onAsk} />
            </MotionBox>
          )}
        </Stagger>
      </Expand>
    </WidgetShell>
  );
}
