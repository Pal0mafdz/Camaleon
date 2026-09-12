import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import { formatMoney, monthlyPayment } from "../format";
import { ActionButton } from "./action";
import { Label, RollingNumber, WidgetShell, WidgetTitle } from "./shell";

/**
 * Enganche ↔ mensualidad. Todo el recálculo ocurre en el teléfono:
 * mover el slider NO vuelve a llamar al agente. Cero latencia, se siente vivo.
 */
export function SimulatorWidget({ props }: { props: WidgetProps["simulator"] }) {
  const theme = useTheme();
  const [down, setDown] = useState(props.downPaymentInitial);
  const [term, setTerm] = useState(props.termInitial);

  const financed = Math.max(props.price - down, 0);
  const payment = monthlyPayment(financed, props.annualRatePct, term);

  return (
    <WidgetShell>
      <WidgetTitle>{props.title}</WidgetTitle>

      <Label>Pagarías al mes</Label>
      <RollingNumber
        value={payment}
        format={(n) => formatMoney(n)}
        variant="h2"
        sx={{ color: theme.palette.primary.main, mt: 0.5, mb: 2.5 }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Label>Enganche</Label>
        <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {formatMoney(down)}
        </Typography>
      </Box>
      <Slider
        value={down}
        min={props.downPaymentMin}
        max={props.downPaymentMax}
        step={Math.max(1000, Math.round((props.downPaymentMax - props.downPaymentMin) / 40))}
        onChange={(_, v) => setDown(v as number)}
        sx={{ mt: 0.5, mb: 2 }}
      />

      <Label>Plazo</Label>
      <Box sx={{ display: "flex", gap: 1, mt: 1, mb: 2.5, flexWrap: "wrap" }}>
        {props.termOptions.map((months) => {
          const active = months === term;
          return (
            <Box
              key={months}
              component="button"
              type="button"
              aria-pressed={active}
              onClick={() => setTerm(months)}
              sx={{
                border: "none",
                cursor: "pointer",
                px: 2,
                // El plazo se toca con el pulgar mientras se mueve el slider:
                // por debajo de 44px se falla el objetivo la mitad de las veces.
                minHeight: "var(--tap-min)",
                minWidth: "var(--tap-min)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-pill)",
                font: "inherit",
                fontSize: 14,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                transition:
                  "background-color var(--dur-micro) var(--ease-ios), transform var(--dur-micro) var(--ease-ios)",
                color: active ? theme.palette.primary.contrastText : theme.palette.text.secondary,
                backgroundColor: active ? theme.palette.primary.main : TOKENS.tintInk5,
                "&:active": { transform: "scale(0.94)" },
              }}
            >
              {months}m
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          pt: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            A financiar
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatMoney(financed)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            Tasa anual
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {props.annualRatePct}%
          </Typography>
        </Box>
      </Box>

      {props.action && (
        <Box sx={{ mt: 2 }}>
          <ActionButton
            action={{
              ...props.action,
              args: { ...props.action.args, downPayment: down, termMonths: term },
            }}
          />
        </Box>
      )}
    </WidgetShell>
  );
}
