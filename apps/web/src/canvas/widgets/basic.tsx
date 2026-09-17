import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { AlertTriangle, Check, Info, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import { formatMoney, formatUnit, toneColor, toneInk } from "../format";
import { AskPill, Bar, Expand, Milestones, Note, TapHeader, TonePill } from "./bits";
import {
  Label,
  Meter,
  MotionBox,
  RollingNumber,
  Stagger,
  spring,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
  WidgetTitle,
} from "./shell";

/**
 * Widgets básicos. Todos comparten la misma composición: una cifra
 * protagonista que rueda, un dato de apoyo que llega un paso después y, si
 * la hay, una acción al pie. Los dibujos (barras, medidores) crecen desde
 * cero la primera vez que aparecen, con el paso `step(i)` de la coreografía.
 */

export function MetricWidget({ props }: { props: WidgetProps["metric"] }) {
  const theme = useTheme();
  const { t, step } = useMotionPrefs();
  const color = toneColor(props.tone, theme);
  const up = (props.delta ?? 0) >= 0;

  return (
    <WidgetShell>
      <Label>{props.label}</Label>
      <RollingNumber
        value={props.value}
        format={(n) => formatUnit(n, props.unit)}
        variant="h2"
        delay={step(1)}
        sx={{ color, mt: 0.5, minWidth: 0, overflowWrap: "anywhere" }}
      />
      {props.delta !== undefined && (
        <MotionBox
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t({ ...spring, delay: step(3) })}
          sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}
        >
          {up ? (
            <TrendingUp size={14} color={TOKENS.good} aria-hidden />
          ) : (
            <TrendingDown size={14} color={TOKENS.bad} aria-hidden />
          )}
          <Typography
            variant="body2"
            sx={{
              color: up ? TOKENS.goodInk : TOKENS.badInk,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {up ? "+" : ""}
            {formatUnit(props.delta, props.unit)}
          </Typography>
        </MotionBox>
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

/** Narración del agente: sin superficie, entra con el mismo paso que el resto. */
export function TextWidget({ props }: { props: WidgetProps["text"] }) {
  return (
    <WidgetShell variant="bare" pad={0} sx={{ px: 0.5 }}>
      <Typography variant="body1" sx={{ color: "text.secondary", overflowWrap: "anywhere" }}>
        {props.body}
      </Typography>
    </WidgetShell>
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
  const { step } = useMotionPrefs();
  const [open, setOpen] = useState(false);
  const tone = props.tone === "neutral" ? "warn" : props.tone;
  const color = toneColor(tone, theme);
  const ink = toneInk(tone, theme);
  const detail = props.detail;
  const rows = detail?.rows ?? [];
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((acc, r) => acc + r.value, 0);
  // Un aviso que solo se distingue por color se confunde con una tarjeta más.
  // El disco con icono lo declara como aviso antes de leer una palabra.
  const Icon = props.tone === "neutral" ? Info : AlertTriangle;

  return (
    <WidgetShell>
      <TapHeader
        expanded={open}
        onToggle={detail ? () => setOpen((v) => !v) : undefined}
        hint={Boolean(detail)}
      >
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-pill)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color,
              backgroundColor: TOKENS.sunken,
            }}
            aria-hidden
          >
            <Icon size={17} strokeWidth={2.4} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {/* El título va a 15px: necesita la variante que sí pasa AA. */}
            <Typography variant="h6" sx={{ color: ink, mb: 0.5, overflowWrap: "anywhere" }}>
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
            {rows.length > 0 && (
              <MotionBox variants={staggerItem}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 1.5 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary", flex: 1 }}>
                    En total
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ color: ink, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}
                  >
                    {formatMoney(total)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {rows.map((row, i) => (
                    <Bar
                      key={row.label}
                      label={
                        row.count !== undefined ? `${row.label} · ${row.count} cargos` : row.label
                      }
                      value={formatMoney(row.value)}
                      pct={(row.value / max) * 100}
                      color={color}
                      height={5}
                      delay={step(i)}
                    />
                  ))}
                </Box>
              </MotionBox>
            )}

            {detail.note && (
              <MotionBox variants={staggerItem} sx={{ mt: 2 }}>
                <Note tone={tone === "good" ? "good" : tone === "bad" ? "bad" : "warn"}>
                  {detail.note}
                </Note>
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
  const { step } = useMotionPrefs();
  const [open, setOpen] = useState(false);
  const color = toneColor(props.tone === "neutral" ? "accent" : props.tone, theme);
  const pct = Math.min(100, Math.round((props.current / Math.max(props.target, 1)) * 100));
  const detail = props.detail;
  const done = pct >= 100;

  return (
    <WidgetShell>
      <TapHeader
        expanded={open}
        onToggle={detail ? () => setOpen((v) => !v) : undefined}
        hint={Boolean(detail)}
      >
        <Typography variant="h5" sx={{ color: "text.primary", overflowWrap: "anywhere" }}>
          {props.title}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            flexWrap: "wrap",
            columnGap: 1,
            rowGap: 0.25,
            mt: 1,
            mb: 1.25,
          }}
        >
          <RollingNumber
            value={props.current}
            format={(n) => formatMoney(n)}
            variant="h3"
            delay={step(1)}
            sx={{ color, minWidth: 0, overflowWrap: "anywhere" }}
          />
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            de {formatMoney(props.target)}
          </Typography>
        </Box>
        <Meter pct={pct} color={color} height={10} delay={step(2)} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.25 }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
          >
            {props.caption ?? (done ? "Meta cumplida" : `${pct}% completado`)}
          </Typography>
          {done && <TonePill tone="good">Lograda</TonePill>}
        </Box>
      </TapHeader>

      {detail && (
        <Expand open={open}>
          <Stagger sx={{ pt: 2 }}>
            {detail.timeline.length > 0 && (
              <MotionBox variants={staggerItem}>
                <Milestones steps={detail.timeline} dotColor={TOKENS.tintInk20} />
              </MotionBox>
            )}

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
  const { t, step } = useMotionPrefs();
  const total = props.items.length;
  const done = props.items.filter((i) => i.done).length;
  const pct = total > 0 ? (done / total) * 100 : 0;
  const complete = total > 0 && done === total;

  return (
    <WidgetShell>
      <Box
        sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}
      >
        <WidgetTitle>{props.title}</WidgetTitle>
        {/* Un checklist sin marcador obliga a contar a mano. */}
        <Typography
          variant="subtitle1"
          sx={{
            color: complete ? TOKENS.goodInk : "text.primary",
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {done}
          <Box component="span" sx={{ color: "text.disabled", fontWeight: 500 }}>
            {" "}
            / {total}
          </Box>
        </Typography>
      </Box>

      {total === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Sin pendientes por ahora.
        </Typography>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Meter pct={pct} color={TOKENS.good} height={6} delay={step(1)} />
          </Box>
          <Stagger sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {props.items.map((item, i) => (
              <MotionBox
                key={item.label}
                variants={staggerItem}
                sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
              >
                <MotionBox
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={t({ ...spring, delay: step(i + 2) })}
                  sx={{
                    width: 22,
                    height: 22,
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
                  {item.done && <Check size={13} strokeWidth={3.5} />}
                </MotionBox>
                <Typography
                  variant="body2"
                  sx={{
                    minWidth: 0,
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
        </>
      )}
    </WidgetShell>
  );
}
