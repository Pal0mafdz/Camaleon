import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { AlertTriangle, Check, Info, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import { formatMoney, formatUnit, toneColor, toneInk } from "../format";
import { AskPill, Expand, Milestones, Note, TapHeader } from "./bits";
import {
  Label,
  Meter,
  MotionBox,
  RollingNumber,
  Stagger,
  springSoft,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
  WidgetTitle,
} from "./shell";

export function MetricWidget({ props }: { props: WidgetProps["metric"] }) {
  const theme = useTheme();
  const color = toneColor(props.tone, theme);
  const up = (props.delta ?? 0) >= 0;

  return (
    <WidgetShell>
      <Label>{props.label}</Label>
      <RollingNumber
        value={props.value}
        format={(n) => formatUnit(n, props.unit)}
        variant="h2"
        sx={{ color, mt: 0.5 }}
      />
      {props.delta !== undefined && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
          {up ? (
            <TrendingUp size={14} color={TOKENS.good} />
          ) : (
            <TrendingDown size={14} color={TOKENS.bad} />
          )}
          <Typography
            variant="body2"
            sx={{ color: up ? TOKENS.goodInk : TOKENS.badInk, fontWeight: 700 }}
          >
            {up ? "+" : ""}
            {formatUnit(props.delta, props.unit)}
          </Typography>
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
    </WidgetShell>
  );
}

export function TextWidget({ props }: { props: WidgetProps["text"] }) {
  const { t } = useMotionPrefs();

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={t(springSoft)}
      sx={{ px: 0.5 }}
    >
      <Typography variant="body1" sx={{ color: "text.secondary" }}>
        {props.body}
      </Typography>
    </MotionBox>
  );
}

export function AlertWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["alert"];
  onAsk?: (q: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const color = toneColor(props.tone, theme);
  const ink = toneInk(props.tone, theme);
  const detail = props.detail;
  const bar = toneColor(props.tone === "neutral" ? "warn" : props.tone, theme);
  const max = Math.max(...(detail?.rows ?? []).map((r) => r.value), 1);
  // Un aviso que solo se distingue por una franja de color se confunde con una
  // tarjeta más. El icono lo declara como aviso antes de leer una palabra.
  const Icon = props.tone === "neutral" ? Info : AlertTriangle;

  return (
    <WidgetShell
      sx={{
        // Franja lateral teñida por semántica en vez de borde: la tarjeta sigue
        // elevada, no hundida, y el tono se lee de reojo.
        backgroundImage: `linear-gradient(90deg, ${color} 0 3px, transparent 3px)`,
      }}
    >
      <TapHeader expanded={open} onToggle={detail ? () => setOpen((v) => !v) : undefined}>
        <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
          <Box sx={{ color, flexShrink: 0, mt: 0.125 }} aria-hidden>
            <Icon size={17} strokeWidth={2.4} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            {/* El título va a 15px: necesita la variante que sí pasa AA. */}
            <Typography variant="h6" sx={{ color: ink, mb: 0.5 }}>
              {props.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", overflowWrap: "anywhere" }}>
              {props.body}
            </Typography>
          </Box>
        </Box>
      </TapHeader>

      {detail && (
        <Expand open={open}>
          <Stagger sx={{ pt: 2 }}>
            <MotionBox
              variants={staggerItem}
              sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
            >
              {detail.rows.map((row, i) => (
                <Box key={row.label}>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.625 }}>
                    <Typography
                      variant="body2"
                      sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
                    >
                      {row.label}
                    </Typography>
                    {row.count !== undefined && (
                      <Typography variant="caption" sx={{ color: "text.disabled", flexShrink: 0 }}>
                        {row.count} cargos
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}
                    >
                      {formatMoney(row.value)}
                    </Typography>
                  </Box>
                  <Meter pct={(row.value / max) * 100} color={bar} height={5} delay={0.06 * i} />
                </Box>
              ))}
            </MotionBox>

            {detail.note && (
              <MotionBox variants={staggerItem} sx={{ mt: 2 }}>
                <Note tone="warn">{detail.note}</Note>
              </MotionBox>
            )}

            {detail.ask && (
              <MotionBox variants={staggerItem} sx={{ mt: 2 }}>
                <AskPill
                  label={detail.ask.label}
                  question={detail.ask.ask}
                  onAsk={onAsk}
                  variant="ink"
                />
              </MotionBox>
            )}
          </Stagger>
        </Expand>
      )}
    </WidgetShell>
  );
}

export function ProgressWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["progress"];
  onAsk?: (q: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const color = toneColor(props.tone === "neutral" ? "accent" : props.tone, theme);
  const pct = Math.min(100, Math.round((props.current / Math.max(props.target, 1)) * 100));
  const detail = props.detail;

  return (
    <WidgetShell>
      <TapHeader expanded={open} onToggle={detail ? () => setOpen((v) => !v) : undefined}>
        <WidgetTitle>{props.title}</WidgetTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 1,
            mb: 1.25,
          }}
        >
          <RollingNumber
            value={props.current}
            format={(n) => formatMoney(n)}
            variant="h4"
            sx={{ color }}
          />
          <Typography variant="body2" sx={{ color: "text.secondary", flexShrink: 0 }}>
            de {formatMoney(props.target)}
          </Typography>
        </Box>
        <Meter pct={pct} color={color} height={10} delay={0.1} />
        <Typography variant="caption" sx={{ color: "text.secondary", mt: 1.25, display: "block" }}>
          {props.caption ?? `${pct}% completado`}
        </Typography>
      </TapHeader>

      {detail && (
        <Expand open={open}>
          <Stagger sx={{ pt: 2 }}>
            <MotionBox variants={staggerItem}>
              <Milestones steps={detail.timeline} dotColor={TOKENS.tintInk20} />
            </MotionBox>

            {detail.note && (
              <MotionBox variants={staggerItem} sx={{ mt: 2 }}>
                <Note tone="good">{detail.note}</Note>
              </MotionBox>
            )}

            {detail.ask && (
              <MotionBox variants={staggerItem} sx={{ mt: 2 }}>
                <AskPill label={detail.ask.label} question={detail.ask.ask} onAsk={onAsk} />
              </MotionBox>
            )}
          </Stagger>
        </Expand>
      )}
    </WidgetShell>
  );
}

export function ChecklistWidget({ props }: { props: WidgetProps["checklist"] }) {
  const done = props.items.filter((i) => i.done).length;

  return (
    <WidgetShell>
      <Box
        sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}
      >
        <WidgetTitle>{props.title}</WidgetTitle>
        {/* Un checklist sin marcador obliga a contar a mano. */}
        <Typography
          variant="caption"
          sx={{ color: "text.disabled", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}
        >
          {done} / {props.items.length}
        </Typography>
      </Box>
      <Stagger sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {props.items.map((item) => (
          <MotionBox
            key={item.label}
            variants={staggerItem}
            sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: "var(--radius-pill)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color: TOKENS.onDark,
                backgroundColor: item.done ? TOKENS.good : "transparent",
                boxShadow: item.done ? "none" : `inset 0 0 0 1.5px ${TOKENS.tintInk20}`,
              }}
              aria-hidden
            >
              {item.done && <Check size={12} strokeWidth={3.5} />}
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: item.done ? "text.disabled" : "text.primary",
                textDecoration: item.done ? "line-through" : "none",
                overflowWrap: "anywhere",
              }}
            >
              {item.label}
            </Typography>
          </MotionBox>
        ))}
      </Stagger>
    </WidgetShell>
  );
}
