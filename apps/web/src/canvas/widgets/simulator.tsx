import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import { useId, useState } from "react";
import { TOKENS } from "../../app/theme";
import { formatMoney, monthlyPayment } from "../format";
import { ActionButton } from "./action";
import { SectionLabel } from "./bits";
import {
  Label,
  Meter,
  MotionBox,
  MotionButton,
  RollingNumber,
  spring,
  springSoft,
  useMotionPrefs,
  WidgetShell,
  WidgetTitle,
} from "./shell";

/**
 * Enganche ↔ mensualidad. Todo el recálculo ocurre en el teléfono: mover el
 * slider NO vuelve a llamar al agente. Cero latencia, se siente vivo.
 *
 * Composición: la cifra es lo que pagarías al mes y rueda en tiempo real
 * mientras el pulgar arrastra (crece un poco y se tiñe de rojo profundo: el
 * feedback háptico visual). El dato de apoyo es el enganche como % del precio.
 * Los plazos son una tabla de filas elegibles —meses, mensualidad, total— y
 * el relleno de la fila activa se desliza entre ellas con `layoutId`.
 */
export function SimulatorWidget({ props }: { props: WidgetProps["simulator"] }) {
  const { t, step } = useMotionPrefs();
  const uid = useId();
  const [down, setDown] = useState(props.downPaymentInitial);
  const [term, setTerm] = useState(props.termInitial);
  const [dragging, setDragging] = useState(false);

  const financed = Math.max(props.price - down, 0);
  const payment = monthlyPayment(financed, props.annualRatePct, term);
  const downPct = props.price > 0 ? Math.round((down / props.price) * 100) : 0;
  const sliderStep = Math.max(1000, Math.round((props.downPaymentMax - props.downPaymentMin) / 40));

  return (
    <WidgetShell>
      <WidgetTitle>{props.title}</WidgetTitle>

      <Label>Pagarías al mes</Label>
      <MotionBox
        animate={{ scale: dragging ? 1.03 : 1 }}
        transition={t(spring)}
        sx={{ transformOrigin: "left center", display: "inline-block", maxWidth: "100%" }}
      >
        <RollingNumber
          value={payment}
          format={(n) => formatMoney(n)}
          variant="h2"
          delay={step(1)}
          sx={{
            color: dragging ? TOKENS.redDeep : TOKENS.red,
            mt: 0.5,
            minWidth: 0,
            overflowWrap: "anywhere",
            transition: "color var(--dur-standard) var(--ease-ios)",
          }}
        />
      </MotionBox>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mt: 0.5,
          mb: 2.5,
          fontVariantNumeric: "tabular-nums",
          overflowWrap: "anywhere",
        }}
      >
        {term} meses · {props.annualRatePct}% anual · financias {formatMoney(financed)}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Label>Enganche</Label>
        </Box>
        <RollingNumber
          value={down}
          format={(n) => formatMoney(n)}
          variant="subtitle1"
          component="span"
          sx={{ flexShrink: 0 }}
        />
      </Box>
      <Slider
        value={down}
        min={props.downPaymentMin}
        max={props.downPaymentMax}
        step={sliderStep}
        aria-label="Enganche"
        getAriaValueText={(v) => formatMoney(v)}
        onChange={(_, v) => {
          setDragging(true);
          setDown(v as number);
        }}
        onChangeCommitted={() => setDragging(false)}
        sx={{ mt: 0.25, mb: 0.5 }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Meter pct={downPct} color={TOKENS.brown} height={4} delay={step(2)} />
        </Box>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}
        >
          {downPct}% del precio de {formatMoney(props.price)}
        </Typography>
      </Box>

      <SectionLabel>Plazo</SectionLabel>
      <Box
        role="radiogroup"
        aria-label="Plazo en meses"
        sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}
      >
        {props.termOptions.map((months) => {
          const active = months === term;
          const monthly = monthlyPayment(financed, props.annualRatePct, months);
          const totalPaid = monthly * months + down;
          return (
            <MotionButton
              key={months}
              type="button"
              role="radio"
              aria-checked={active}
              whileTap={{ scale: 0.985 }}
              transition={t(spring)}
              onClick={() => setTerm(months)}
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                // El plazo se toca con el pulgar mientras se mueve el slider:
                // por debajo de 44px se falla el objetivo la mitad de las veces.
                minHeight: "var(--tap-min)",
                px: 1.5,
                py: 1,
                borderRadius: "var(--radius-s)",
              }}
            >
              {active && (
                <MotionBox
                  layoutId={`${uid}-term`}
                  transition={t(springSoft)}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "var(--radius-s)",
                    backgroundColor: TOKENS.tintRed8,
                    boxShadow: `inset 0 0 0 1.5px ${TOKENS.tintRed32}`,
                  }}
                  aria-hidden
                />
              )}
              <Typography
                variant="body1"
                sx={{
                  position: "relative",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: active ? TOKENS.redDeep : "text.primary",
                  flexShrink: 0,
                  minWidth: 64,
                  transition: "color var(--dur-micro) var(--ease-ios)",
                }}
              >
                {months} m
              </Typography>
              <Box sx={{ position: "relative", flex: 1, minWidth: 0, textAlign: "right" }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: active ? 700 : 600,
                    fontVariantNumeric: "tabular-nums",
                    overflowWrap: "anywhere",
                  }}
                >
                  {formatMoney(monthly)}
                  <Box component="span" sx={{ color: "text.disabled", fontWeight: 500 }}>
                    /mes
                  </Box>
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                    overflowWrap: "anywhere",
                  }}
                >
                  Total {formatMoney(totalPaid)}
                </Typography>
              </Box>
            </MotionButton>
          );
        })}
      </Box>

      {props.action && (
        <Box sx={{ mt: 2.5 }}>
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
