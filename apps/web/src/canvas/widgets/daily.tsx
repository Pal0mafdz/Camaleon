import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import { formatMoney } from "../format";
import { AmountRow, AskPill, Expand, SectionLabel, TapHeader } from "./bits";
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
} from "./shell";

/**
 * "Cuánto puedo gastar hoy sin romper nada."
 *
 * Cifra protagonista: lo disponible (rueda). Dato de apoyo: la barra de lo
 * que ya llevas gastado, que crece desde cero un paso después. Acción: la
 * pregunta al agente en el detalle. Cerrado ya cuenta la historia completa;
 * el detalle solo explica de dónde sale el número.
 */
export function DailyWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["daily"];
  onAsk?: (q: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { t, step } = useMotionPrefs();
  const formula = props.formula ?? [];
  // El índice solo vive aquí, fuera del JSX: los días repiten etiqueta.
  const days = (props.days ?? []).map((d, i) => ({ ...d, key: `day-${i}` }));
  const usedPct = Math.min((props.spent / Math.max(props.available, 1)) * 100, 100);
  const over = props.spent > props.available;
  const left = Math.max(props.available - props.spent, 0);

  return (
    <WidgetShell>
      <TapHeader expanded={open} onToggle={() => setOpen((v) => !v)} hint>
        <Label>{props.title}</Label>
        <RollingNumber
          value={props.available}
          format={(n) => formatMoney(n)}
          variant="h3"
          delay={step(1)}
          sx={{ color: "text.primary", mt: 0.5, minWidth: 0, overflowWrap: "anywhere" }}
        />
        {props.caption && (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mt: 0.75, overflowWrap: "anywhere" }}
          >
            {props.caption}
          </Typography>
        )}

        <Box sx={{ mt: 1.75 }}>
          <Meter pct={usedPct} color={over ? TOKENS.bad : TOKENS.red} height={8} delay={step(2)} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              columnGap: 1.5,
              rowGap: 0.5,
              mt: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary", minWidth: 0 }}>
              {props.spent > 0 ? (
                <>
                  Hoy llevas{" "}
                  <Box
                    component="span"
                    sx={{
                      color: over ? TOKENS.badInk : "text.primary",
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatMoney(props.spent)}
                  </Box>
                </>
              ) : (
                "Hoy no has gastado nada"
              )}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: over ? TOKENS.badInk : TOKENS.goodInk,
                fontVariantNumeric: "tabular-nums",
                flexShrink: 0,
              }}
            >
              {over
                ? `Te pasaste ${formatMoney(props.spent - props.available)}`
                : `Te quedan ${formatMoney(left)}`}
            </Typography>
          </Box>
        </Box>
      </TapHeader>

      <Expand open={open}>
        <Stagger sx={{ pt: 2.5 }}>
          {formula.length > 0 && (
            <MotionBox
              variants={staggerItem}
              sx={{
                borderRadius: "var(--radius-m)",
                p: 1.75,
                backgroundColor: TOKENS.sunken,
              }}
            >
              <SectionLabel>De dónde sale</SectionLabel>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {formula.map((row, i) => (
                  <AmountRow
                    key={row.label}
                    label={row.label}
                    amount={formatMoney(row.amount)}
                    bold={i === formula.length - 1}
                  />
                ))}
              </Box>
            </MotionBox>
          )}

          <MotionBox variants={staggerItem} sx={{ mt: formula.length > 0 ? 2.5 : 0 }}>
            <SectionLabel>En qué se fue</SectionLabel>
            {props.breakdown.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {props.breakdown.map((b) => (
                  <AmountRow key={b.label} label={b.label} amount={formatMoney(b.amount)} />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Todavía ningún cargo hoy.
              </Typography>
            )}
          </MotionBox>

          {days.length > 0 && (
            <MotionBox variants={staggerItem} sx={{ mt: 2.5 }}>
              <SectionLabel>El mes hasta hoy</SectionLabel>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {days.map((d, i) => (
                  <MotionBox
                    key={d.key}
                    title={d.label}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: d.over ? 1 : 0.28, scale: 1 }}
                    transition={t({ ...springSoft, delay: 0.012 * i })}
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "var(--radius-2xs)",
                      backgroundColor: d.over ? TOKENS.red : TOKENS.good,
                    }}
                  />
                ))}
              </Box>
              <Box sx={{ display: "flex", gap: 1.5, mt: 1.25 }}>
                <LegendDot color={TOKENS.red} label="Te pasaste" />
                <LegendDot color={TOKENS.good} label="Dentro" faded />
              </Box>
            </MotionBox>
          )}

          {props.ask && (
            <MotionBox variants={staggerItem} sx={{ mt: 2.5 }}>
              <AskPill
                label={props.ask.label}
                question={props.ask.ask}
                onAsk={onAsk}
                variant="ink"
              />
            </MotionBox>
          )}
        </Stagger>
      </Expand>
    </WidgetShell>
  );
}

/** Sin leyenda, la cuadrícula de días es un patrón bonito que no dice nada. */
function LegendDot({ color, label, faded }: { color: string; label: string; faded?: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.625 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "var(--radius-2xs)",
          backgroundColor: color,
          opacity: faded ? 0.28 : 1,
        }}
        aria-hidden
      />
      <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );
}
