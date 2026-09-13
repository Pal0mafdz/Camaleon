import type { Tone, WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useLayoutMode } from "../../app/app-shell";
import { TOKENS } from "../../app/theme";
import { toneColor, toneInk } from "../format";
import { AskPill, Bar, Expand, SectionLabel, TapHeader, TonePill } from "./bits";
import {
  MotionBox,
  motion,
  RollingNumber,
  Sparkbars,
  Stagger,
  springSoft,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
} from "./shell";

/**
 * Salud financiera 0-100. El anillo se dibuja solo la primera vez (dasharray
 * animado con el muelle suave) y el número rueda hasta el score un paso
 * después. Al tocarlo se abre el desglose de qué la sostiene.
 *
 * Composición: cifra (score), dato de apoyo (estado + variación), acción.
 */

const RING = 124;
/** En media anchura de teléfono el anillo se encoge y se apila sobre el texto. */
const RING_COMPACT = 92;
const STROKE = 11;

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
  const { t, step } = useMotionPrefs();
  const [open, setOpen] = useState(false);
  const compact = useLayoutMode() !== "wide";
  const ring = compact ? RING_COMPACT : RING;
  const r = (ring - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const score = Math.max(0, Math.min(props.score, 100));
  const tone = scoreTone(score);
  const color = toneColor(tone, theme);
  const dash = (score / 100) * c;
  const history = props.history ?? [];
  const previous = history.length > 1 ? (history[history.length - 2] as number) : null;
  const diff = previous === null ? null : score - previous;
  const hasDetail = props.factors.length > 0 || history.length > 1 || Boolean(props.ask);

  return (
    <WidgetShell>
      <TapHeader
        expanded={open}
        onToggle={hasDetail ? () => setOpen((v) => !v) : undefined}
        hint={hasDetail}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: compact ? "column" : "row",
            alignItems: compact ? "flex-start" : "center",
            gap: compact ? 1.5 : 2.25,
            minWidth: 0,
          }}
        >
          <Box sx={{ position: "relative", width: ring, height: ring, flexShrink: 0 }}>
            <Box
              component="svg"
              viewBox={`0 0 ${ring} ${ring}`}
              sx={{ width: ring, height: ring, transform: "rotate(-90deg)", display: "block" }}
              aria-hidden
            >
              <circle
                cx={ring / 2}
                cy={ring / 2}
                r={r}
                fill="none"
                stroke={TOKENS.well}
                strokeWidth={STROKE}
              />
              <motion.circle
                cx={ring / 2}
                cy={ring / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${c}` }}
                animate={{ strokeDasharray: `${dash} ${c - dash}` }}
                transition={t({ ...springSoft, delay: step(1) })}
              />
            </Box>
            <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <RollingNumber
                value={score}
                format={(n) => String(Math.round(n))}
                variant={compact ? "h3" : "h2"}
                delay={step(2)}
                sx={{ color }}
              />
            </Box>
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h4" sx={{ color: toneInk(tone, theme), overflowWrap: "anywhere" }}>
              {props.status}
            </Typography>
            <Typography
              variant="overline"
              sx={{ display: "block", color: "text.disabled", mt: 0.5 }}
            >
              Salud financiera
            </Typography>
            {diff !== null && diff !== 0 && (
              <Box sx={{ mt: 1 }}>
                <TonePill tone={diff > 0 ? "good" : "bad"}>
                  {diff > 0 ? "+" : ""}
                  {diff} pts vs. mes anterior
                </TonePill>
              </Box>
            )}
            {props.caption && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.75, overflowWrap: "anywhere" }}
              >
                {props.caption}
              </Typography>
            )}
          </Box>
        </Box>
      </TapHeader>

      {hasDetail && (
        <Expand open={open}>
          <Stagger sx={{ pt: 2.5 }}>
            <MotionBox variants={staggerItem}>
              <SectionLabel>Qué la compone</SectionLabel>
              {props.factors.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {props.factors.map((f, i) => (
                    <Bar
                      key={f.label}
                      label={f.label}
                      value={f.status}
                      pct={f.pct}
                      color={toneColor(f.tone, theme)}
                      delay={step(i)}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Todavía no hay suficientes meses para desglosarla.
                </Typography>
              )}
            </MotionBox>

            {history.length > 1 && (
              <MotionBox variants={staggerItem} sx={{ mt: 2.5 }}>
                <SectionLabel>Meses recientes</SectionLabel>
                <Sparkbars
                  values={history}
                  color={color}
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
      )}
    </WidgetShell>
  );
}
