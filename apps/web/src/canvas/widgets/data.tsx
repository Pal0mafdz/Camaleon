import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useId, useState } from "react";
import { EASE_OUT, TOKENS } from "../../app/theme";
import { formatMoney, toneColor, toneInk } from "../format";
import { AmountRow, Expand, Milestones, SectionLabel, TapHeader, TonePill } from "./bits";
import {
  AnimatePresence,
  Label,
  Meter,
  MotionBox,
  MotionButton,
  motion,
  RollingNumber,
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

const DONUT = 124;
const DONUT_STROKE = 15;
const DONUT_R = (DONUT - DONUT_STROKE) / 2;
const DONUT_C = 2 * Math.PI * DONUT_R;

/**
 * Dona SVG que se dibuja sola. Cada gajo crece desde su inicio (dasharray de
 * `0` a su longitud, con el offset fijo) un paso después del anterior, así la
 * dona se "llena" en el sentido del reloj. La leyenda es una columna flexible
 * que baja debajo de la dona cuando no cabe al lado: a 375px nunca hay scroll
 * horizontal ni etiquetas cortadas.
 */
export function DonutWidget({
  props,
}: {
  props: WidgetProps["donut"];
  onAsk?: (q: string) => void;
}) {
  const { t, step } = useMotionPrefs();
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(0);
  const total = props.slices.reduce((s, x) => s + x.value, 0) || 1;
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
        hint={categories.length > 0}
      >
        <WidgetTitle>{props.title}</WidgetTitle>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2.5,
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <Box sx={{ position: "relative", width: DONUT, height: DONUT, flexShrink: 0 }}>
            <Box
              component="svg"
              viewBox={`0 0 ${DONUT} ${DONUT}`}
              sx={{ width: DONUT, height: DONUT, transform: "rotate(-90deg)", display: "block" }}
              aria-hidden
            >
              <circle
                cx={DONUT / 2}
                cy={DONUT / 2}
                r={DONUT_R}
                fill="none"
                stroke={TOKENS.well}
                strokeWidth={DONUT_STROKE}
              />
              {props.slices.map((s, i) => {
                const dash = (s.value / total) * DONUT_C;
                const el = (
                  <motion.circle
                    key={s.label}
                    cx={DONUT / 2}
                    cy={DONUT / 2}
                    r={DONUT_R}
                    fill="none"
                    stroke={SLICE_COLORS[i % SLICE_COLORS.length]}
                    strokeWidth={DONUT_STROKE}
                    strokeLinecap="butt"
                    strokeDashoffset={-offset}
                    initial={{ strokeDasharray: `0 ${DONUT_C}` }}
                    animate={{ strokeDasharray: `${dash} ${DONUT_C - dash}` }}
                    transition={t({ ...springSoft, delay: step(i + 1) })}
                  />
                );
                offset += dash;
                return el;
              })}
            </Box>
            <Box
              sx={{
                position: "absolute",
                inset: DONUT_STROKE + 4,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <RollingNumber
                  value={total}
                  format={(n) => formatMoney(n)}
                  variant="subtitle1"
                  delay={step(2)}
                  sx={{ overflowWrap: "anywhere" }}
                />
                {props.centerLabel && (
                  <Typography
                    variant="caption"
                    sx={{ color: "text.disabled", display: "block", overflowWrap: "anywhere" }}
                  >
                    {props.centerLabel}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Stagger
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              // Si no caben 150px al lado de la dona, la leyenda baja: reflow, no scroll.
              flex: "1 1 150px",
              minWidth: 0,
            }}
          >
            {props.slices.map((s, i) => (
              <MotionBox
                key={s.label}
                variants={staggerItem}
                sx={{ display: "flex", alignItems: "baseline", gap: 1, minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "var(--radius-2xs)",
                    flexShrink: 0,
                    alignSelf: "center",
                    backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length],
                  }}
                  aria-hidden
                />
                <Typography
                  variant="body2"
                  sx={{ flex: 1, minWidth: 0, fontWeight: 600, overflowWrap: "anywhere" }}
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
            {/* Los chips se envuelven; el fondo del activo se desliza entre ellos. */}
            <Box role="tablist" sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {categories.map((c, i) => {
                const on = i === Math.min(picked, categories.length - 1);
                const color = catColor(c.label, i);
                return (
                  <MotionButton
                    key={c.label}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    whileTap={{ scale: 0.95 }}
                    transition={t(spring)}
                    onClick={() => setPicked(i)}
                    sx={{
                      position: "relative",
                      px: 1.75,
                      minHeight: "var(--tap-min)",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: TOKENS.tintInk5,
                    }}
                  >
                    {on && (
                      <MotionBox
                        layoutId={`${uid}-chip`}
                        transition={t(spring)}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: color,
                        }}
                        aria-hidden
                      />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        position: "relative",
                        color: on ? TOKENS.onDark : "text.secondary",
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                        transition: "color var(--dur-micro) var(--ease-ios)",
                      }}
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
                sx={{ pt: 2.25 }}
              >
                <SectionLabel>{cat.label} · de lo que te entra</SectionLabel>
                <RollingNumber
                  value={share}
                  format={(n) => `${Math.round(n)}%`}
                  variant="h3"
                  sx={{ color: active }}
                />
                <Box sx={{ mt: 1.25 }}>
                  <Meter pct={share} color={active} height={8} delay={step(1)} />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    mt: 1.25,
                    fontVariantNumeric: "tabular-nums",
                    overflowWrap: "anywhere",
                  }}
                >
                  {formatMoney(cat.monthly)} de {formatMoney(incomeTotal)} que entran
                </Typography>

                {cat.history.length > 1 && (
                  <Box sx={{ mt: 2.5 }}>
                    <SectionLabel>Meses recientes</SectionLabel>
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
                  <Box sx={{ mt: 2.5 }}>
                    <SectionLabel>Movimientos</SectionLabel>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                      {cat.movements.map((m) => (
                        <AmountRow key={m.label} label={m.label} amount={formatMoney(m.amount)} />
                      ))}
                    </Box>
                  </Box>
                )}

                {cat.note && (
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mt: 1.75, overflowWrap: "anywhere" }}
                  >
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

const TREND_W = 300;
const TREND_H = 104;

/**
 * Serie temporal. La cifra protagonista es el último punto; el dato de apoyo,
 * cuánto cambió desde el primero. La línea se traza con `pathLength` y el área
 * se revela detrás con `clip-path`, a la misma velocidad: el usuario ve
 * dibujarse la gráfica una sola vez, nunca en cada re-render.
 */
export function TrendWidget({ props }: { props: WidgetProps["trend"] }) {
  const theme = useTheme();
  const { t, reduced, step } = useMotionPrefs();
  const uid = useId();
  const tone = props.tone === "neutral" ? "accent" : props.tone;
  const color = toneColor(tone, theme);
  const values = props.points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const diff = last - first;
  const diffPct = first !== 0 ? Math.round((diff / Math.abs(first)) * 100) : 0;
  const n = props.points.length;

  const coords = props.points.map((p, i) => ({
    x: (i / Math.max(n - 1, 1)) * TREND_W,
    y: TREND_H - ((p.value - min) / span) * (TREND_H - 20) - 10,
  }));
  const line = `M ${coords.map((c) => `${c.x},${c.y}`).join(" L ")}`;
  const area = `${line} L ${TREND_W},${TREND_H} L 0,${TREND_H} Z`;
  const end = coords[coords.length - 1] ?? { x: TREND_W, y: TREND_H / 2 };
  const gradId = `${uid}-grad`;
  const drawDelay = step(2);
  const drawDuration = reduced ? 0 : 0.9;

  // Con muchos puntos las etiquetas no caben: se muestran solo los extremos.
  const axis =
    n <= 7
      ? props.points.map((p, i) => ({ key: `${p.label}-${i}`, label: p.label }))
      : [
          { key: "start", label: props.points[0]?.label ?? "" },
          { key: "end", label: props.points[n - 1]?.label ?? "" },
        ];

  return (
    <WidgetShell>
      <WidgetTitle>{props.title}</WidgetTitle>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          columnGap: 1.25,
          rowGap: 0.5,
          mb: 1.5,
        }}
      >
        <RollingNumber
          value={last}
          format={(n) => formatMoney(n)}
          variant="h3"
          delay={step(1)}
          sx={{ color: toneInk(tone, theme), minWidth: 0, overflowWrap: "anywhere" }}
        />
        {diff !== 0 && (
          <MotionBox
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t({ ...spring, delay: drawDelay + drawDuration })}
          >
            <TonePill tone={diff > 0 ? "good" : "bad"}>
              {diff > 0 ? "+" : "−"}
              {formatMoney(Math.abs(diff))}
              {diffPct !== 0 ? ` · ${diffPct > 0 ? "+" : ""}${diffPct}%` : ""}
            </TonePill>
          </MotionBox>
        )}
      </Box>

      <Box sx={{ position: "relative" }}>
        <Box
          component="svg"
          viewBox={`0 0 ${TREND_W} ${TREND_H}`}
          preserveAspectRatio="none"
          sx={{ width: "100%", height: TREND_H, display: "block", overflow: "visible" }}
        >
          <title>{props.title}</title>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <motion.g
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={t({ duration: drawDuration, ease: EASE_OUT, delay: drawDelay })}
          >
            <path d={area} fill={`url(#${gradId})`} />
          </motion.g>
          <motion.path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={t({ duration: drawDuration, ease: EASE_OUT, delay: drawDelay })}
          />
        </Box>
        {/* El punto de hoy vive fuera del SVG estirado para seguir siendo redondo. */}
        <MotionBox
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={t({ ...spring, delay: drawDelay + drawDuration * 0.9 })}
          sx={{
            position: "absolute",
            left: `${(end.x / TREND_W) * 100}%`,
            top: `${(end.y / TREND_H) * 100}%`,
            width: 12,
            height: 12,
            ml: "-6px",
            mt: "-6px",
            borderRadius: "var(--radius-pill)",
            backgroundColor: TOKENS.card,
            boxShadow: `inset 0 0 0 3px ${color}`,
          }}
          aria-hidden
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 1,
          mt: 0.75,
          pt: 0.75,
          borderTop: `1px solid ${TOKENS.tintInk12}`,
        }}
      >
        {axis.map((a, i) => (
          <Typography
            key={a.key}
            variant="caption"
            sx={{
              color: i === axis.length - 1 ? "text.secondary" : "text.disabled",
              fontWeight: i === axis.length - 1 ? 700 : 500,
              minWidth: 0,
              overflowWrap: "anywhere",
            }}
          >
            {a.label}
          </Typography>
        ))}
      </Box>
    </WidgetShell>
  );
}

export function TimelineWidget({ props }: { props: WidgetProps["timeline"] }) {
  const theme = useTheme();
  const done = props.steps.filter((s) => s.done).length;
  const total = props.steps.length;

  return (
    <WidgetShell>
      <Box
        sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}
      >
        <WidgetTitle>{props.title}</WidgetTitle>
        {done > 0 && (
          <Typography
            variant="subtitle1"
            sx={{
              color: done === total ? TOKENS.goodInk : "text.primary",
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
        )}
      </Box>
      <Milestones steps={props.steps} dotColor={theme.palette.primary.main} />
    </WidgetShell>
  );
}

/**
 * Preguntas de seguimiento de un toque: el chat sin chat. Son botones de
 * verdad (teclado, lector de pantalla) y el relleno del chip que se está
 * eligiendo se desliza de uno a otro con `layoutId`, así que al enviar se ve
 * cuál se tocó aunque el lienzo ya esté pensando.
 */
export function ChipsWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["chips"];
  onAsk: (q: string) => void;
}) {
  const { t } = useMotionPrefs();
  const uid = useId();
  const [hot, setHot] = useState<number | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  const active = sent ?? hot;

  return (
    <WidgetShell variant="bare" pad={0}>
      {props.label && (
        <Box sx={{ mb: 1 }}>
          <Label>{props.label}</Label>
        </Box>
      )}
      <Stagger sx={{ display: "flex", flexWrap: "wrap", gap: 1 }} delay={0.05}>
        {props.options.map((opt, i) => {
          const on = active === i;
          const fired = sent === i;
          return (
            <MotionButton
              key={opt}
              type="button"
              variants={staggerItem}
              whileTap={{ scale: 0.95 }}
              transition={t(spring)}
              onClick={() => {
                setSent(i);
                onAsk(opt);
              }}
              onPointerEnter={() => setHot(i)}
              onPointerLeave={() => setHot((v) => (v === i ? null : v))}
              onFocus={() => setHot(i)}
              onBlur={() => setHot((v) => (v === i ? null : v))}
              className="paper"
              sx={{
                position: "relative",
                px: 1.75,
                minHeight: "var(--tap-min)",
                display: "flex",
                alignItems: "center",
                borderRadius: "var(--radius-pill)",
                maxWidth: "100%",
              }}
            >
              {on && (
                <MotionBox
                  layoutId={`${uid}-chip`}
                  transition={t(spring)}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: fired ? TOKENS.ink : TOKENS.sunken,
                  }}
                  aria-hidden
                />
              )}
              <Typography
                variant="body2"
                sx={{
                  position: "relative",
                  fontWeight: 600,
                  color: fired ? TOKENS.onDark : "text.primary",
                  overflowWrap: "anywhere",
                  transition: "color var(--dur-micro) var(--ease-ios)",
                }}
              >
                {opt}
              </Typography>
            </MotionButton>
          );
        })}
      </Stagger>
    </WidgetShell>
  );
}
