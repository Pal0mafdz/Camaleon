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
 * Colapsado ya trae su barra de avance del día: un número solo en una tarjeta
 * de 100px se lee como un hueco, y el dato de cuánto llevas gastado ya está en
 * las props — esconderlo detrás del toque era desperdiciar la mitad del alto.
 */
export function DailyWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["daily"];
  onAsk?: (q: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useMotionPrefs();
  const formula = props.formula ?? [];
  // El índice solo vive aquí, fuera del JSX: los días repiten etiqueta.
  const days = (props.days ?? []).map((d, i) => ({ ...d, key: `day-${i}` }));
  const usedPct = Math.min((props.spent / Math.max(props.available, 1)) * 100, 100);
  const over = usedPct >= 100;

  return (
    <WidgetShell>
      <TapHeader expanded={open} onToggle={() => setOpen((v) => !v)}>
        <Label>{props.title}</Label>
        <RollingNumber
          value={props.available}
          format={(n) => formatMoney(n)}
          variant="h3"
          sx={{ color: "text.primary", mt: 0.5 }}
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
          <Meter pct={usedPct} color={over ? TOKENS.bad : TOKENS.red} height={8} delay={0.12} />
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 1, display: "block" }}>
            Hoy llevas{" "}
            <Box
              component="span"
              sx={{ color: over ? TOKENS.badInk : "text.primary", fontWeight: 700 }}
            >
              {formatMoney(props.spent)}
            </Box>
          </Typography>
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
                backgroundColor: TOKENS.tintInk3,
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

          {props.breakdown.length > 0 && (
            <MotionBox variants={staggerItem} sx={{ mt: 2.5 }}>
              <SectionLabel>En qué se fue</SectionLabel>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {props.breakdown.map((b) => (
                  <AmountRow key={b.label} label={b.label} amount={formatMoney(b.amount)} />
                ))}
              </Box>
            </MotionBox>
          )}

          {days.length > 0 && (
            <MotionBox variants={staggerItem} sx={{ mt: 2.5 }}>
              <SectionLabel>El mes hasta hoy</SectionLabel>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {days.map((d, i) => (
                  <MotionBox
                    key={d.key}
                    title={d.label}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={t({ ...springSoft, delay: 0.012 * i })}
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "4px",
                      backgroundColor: d.over ? TOKENS.red : TOKENS.good,
                      opacity: d.over ? 1 : 0.28,
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
          borderRadius: "3px",
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
