import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import { formatMoney, toneColor } from "../format";
import { AmountRow, Expand, Milestones, SectionLabel, TapHeader } from "./bits";
import {
  AnimatePresence,
  Label,
  Meter,
  MotionBox,
  MotionButton,
  motion,
  Sparkbars,
  Stagger,
  spring,
  springSoft,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
  WidgetTitle,
} from "./shell";

/**
 * La paleta de la dona es `TOKENS.viz`: la primera rebanada siempre es el rojo
 * Banorte y el resto alterna claro/oscuro para que dos gajos vecinos nunca se
 * confundan. Todos superan 3:1 contra blanco (WCAG 1.4.11, objeto gráfico).
 */
const SLICE_COLORS = TOKENS.viz;

/** Dona SVG que se dibuja sola, sin librería de charts. */
export function DonutWidget({
  props,
}: {
  props: WidgetProps["donut"];
  onAsk?: (q: string) => void;
}) {
  const { t } = useMotionPrefs();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(0);
  const total = props.slices.reduce((s, x) => s + x.value, 0) || 1;
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;

  const detail = props.detail;
  const categories = detail?.categories ?? [];
  const cat = categories[Math.min(picked, categories.length - 1)];

  /** El color de una categoría es el de SU gajo: la dona y el detalle no discuten. */
  function catColor(label: string, fallback: number): string {
    const idx = props.slices.findIndex((s) => s.label === label);
    return SLICE_COLORS[(idx >= 0 ? idx : fallback) % SLICE_COLORS.length] as string;
  }

  const active = cat ? catColor(cat.label, picked) : (SLICE_COLORS[0] as string);
  const incomeTotal = Math.max(detail?.incomeTotal ?? 0, 1);
  const share = cat ? Math.round((cat.monthly / incomeTotal) * 100) : 0;

  return (
    <WidgetShell>
      <TapHeader
        expanded={open}
        onToggle={categories.length > 0 ? () => setOpen((v) => !v) : undefined}
      >
        <WidgetTitle>{props.title}</WidgetTitle>
        <Box sx={{ display: "flex", gap: 2.5, alignItems: "center" }}>
          <Box sx={{ position: "relative", width: 132, height: 132, flexShrink: 0 }}>
            <Box
              component="svg"
              viewBox="0 0 132 132"
              sx={{ width: 132, height: 132, transform: "rotate(-90deg)" }}
            >
              <title>{props.title}</title>
              {props.slices.map((s, i) => {
                const frac = s.value / total;
                const dash = frac * C;
                const el = (
                  <motion.circle
                    key={s.label}
                    cx={66}
                    cy={66}
                    r={R}
                    fill="none"
                    stroke={SLICE_COLORS[i % SLICE_COLORS.length]}
                    strokeWidth={14}
                    strokeLinecap="butt"
                    strokeDasharray={`${dash} ${C - dash}`}
                    initial={{ strokeDashoffset: -offset - dash, opacity: 0 }}
                    animate={{ strokeDashoffset: -offset, opacity: 1 }}
                    transition={t({ ...springSoft, delay: 0.08 * i })}
                  />
                );
                offset += dash;
                return el;
              })}
            </Box>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatMoney(total)}
                </Typography>
                {props.centerLabel && (
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    {props.centerLabel}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Stagger sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, minWidth: 0 }}>
            {props.slices.map((s, i) => (
              <MotionBox
                key={s.label}
                variants={staggerItem}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "var(--radius-xs)",
                    flexShrink: 0,
                    backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length],
                  }}
                  aria-hidden
                />
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                    fontWeight: 600,
                  }}
                >
                  {Math.round((s.value / total) * 100)}%
                </Typography>
              </MotionBox>
            ))}
          </Stagger>
        </Box>
      </TapHeader>

      {cat && (
        <Expand open={open}>
          <Box sx={{ pt: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                pb: 0.5,
                mx: -0.5,
                px: 0.5,
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {categories.map((c, i) => {
                const on = i === Math.min(picked, categories.length - 1);
                const color = catColor(c.label, i);
                return (
                  <MotionButton
                    key={c.label}
                    type="button"
                    aria-pressed={on}
                    whileTap={{ scale: 0.95 }}
                    transition={t(spring)}
                    onClick={() => setPicked(i)}
                    sx={{
                      px: 1.75,
                      minHeight: "var(--tap-min)",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "var(--radius-pill)",
                      flexShrink: 0,
                      transition: "background-color var(--dur-micro) var(--ease-ios)",
                      backgroundColor: on ? color : TOKENS.tintInk5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: on ? TOKENS.onDark : "text.secondary", fontWeight: 700 }}
                    >
                      {c.label}
                    </Typography>
                  </MotionButton>
                );
              })}
            </Box>

            <AnimatePresence mode="wait" initial={false}>
              <MotionBox
                key={cat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={t(spring)}
                sx={{ pt: 2 }}
              >
                <SectionLabel>{cat.label} · de lo que te entra</SectionLabel>
                <Typography variant="h4" sx={{ color: active }}>
                  {share}%
                </Typography>
                <Box sx={{ mt: 1.25 }}>
                  <Meter pct={share} color={active} height={8} />
                </Box>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.25 }}>
                  {formatMoney(cat.monthly)} de {formatMoney(incomeTotal)} que entran
                </Typography>

                {cat.history.length > 1 && (
                  <Box sx={{ mt: 2.5 }}>
                    <SectionLabel>Histórico</SectionLabel>
                    <Sparkbars
                      values={cat.history}
                      color={active}
                      axis={{
                        start: formatMoney(cat.history[0] as number),
                        end: formatMoney(cat.history[cat.history.length - 1] as number),
                      }}
                    />
                  </Box>
                )}

                {cat.movements.length > 0 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 2.5 }}>
                    {cat.movements.map((m) => (
                      <AmountRow key={m.label} label={m.label} amount={formatMoney(m.amount)} />
                    ))}
                  </Box>
                )}

                {cat.note && (
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.75 }}>
                    {cat.note}
                  </Typography>
                )}
              </MotionBox>
            </AnimatePresence>
          </Box>
        </Expand>
      )}
    </WidgetShell>
  );
}

/** Serie temporal como área SVG animada. */
export function TrendWidget({ props }: { props: WidgetProps["trend"] }) {
  const theme = useTheme();
  const { reduced } = useMotionPrefs();
  const color = toneColor(props.tone === "neutral" ? "accent" : props.tone, theme);
  const W = 300;
  const H = 110;
  const values = props.points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const pts = props.points.map((p, i) => {
    const x = (i / (props.points.length - 1)) * W;
    const y = H - ((p.value - min) / span) * (H - 16) - 8;
    return `${x},${y}`;
  });

  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${W},${H} L 0,${H} Z`;
  const gradId = `grad-${props.id ?? "trend"}`;

  return (
    <WidgetShell>
      <WidgetTitle>{props.title}</WidgetTitle>
      <Box
        component="svg"
        viewBox={`0 0 ${W} ${H}`}
        sx={{ width: "100%", height: H, display: "block" }}
      >
        <title>{props.title}</title>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { delay: 0.35, duration: 0.5 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.9, ease: "easeOut" }}
        />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
        {props.points.map((p, i) => (
          // El rango puede abarcar más de un año, así que "sept" se repite:
          // la posición es lo único único aquí.
          // biome-ignore lint/suspicious/noArrayIndexKey: las etiquetas de mes se repiten
          <Typography key={`${p.label}-${i}`} variant="caption" sx={{ color: "text.disabled" }}>
            {p.label}
          </Typography>
        ))}
      </Box>
    </WidgetShell>
  );
}

export function TimelineWidget({ props }: { props: WidgetProps["timeline"] }) {
  const theme = useTheme();

  return (
    <WidgetShell>
      <WidgetTitle>{props.title}</WidgetTitle>
      <Milestones steps={props.steps} dotColor={theme.palette.primary.main} />
    </WidgetShell>
  );
}

/** Preguntas de seguimiento de un toque: el chat sin chat. */
export function ChipsWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["chips"];
  onAsk: (q: string) => void;
}) {
  const { t } = useMotionPrefs();

  return (
    <Box>
      {props.label && (
        <Box sx={{ mb: 1 }}>
          <Label>{props.label}</Label>
        </Box>
      )}
      <Stagger sx={{ display: "flex", flexWrap: "wrap", gap: 1 }} delay={0.05}>
        {props.options.map((opt) => (
          // Botón de verdad, no un div con onTap: estos chips son la forma
          // principal de seguir la conversación y tienen que responder a
          // teclado y anunciarse como controles.
          <MotionButton
            key={opt}
            type="button"
            variants={staggerItem}
            whileTap={{ scale: 0.95 }}
            transition={t(spring)}
            onClick={() => onAsk(opt)}
            className="liquid-glass"
            sx={{
              px: 1.75,
              minHeight: "var(--tap-min)",
              display: "flex",
              alignItems: "center",
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {opt}
            </Typography>
          </MotionButton>
        ))}
      </Stagger>
    </Box>
  );
}
