import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Check } from "lucide-react";
import { TOKENS } from "../../app/theme";
import { formatMoney } from "../format";
import { TonePill } from "./bits";
import { Label, MotionBox, RollingNumber, springSoft, useMotionPrefs, WidgetShell } from "./shell";

/**
 * El widget que responde "¿me alcanza?".
 *
 * Cifra protagonista: lo que FALTA (rueda desde cero). Dato de apoyo: la
 * barra de dos segmentos —lo que ya tienes en verde, lo que falta en rojo
 * diluido— con sus dos extremos rotulados. Si ya alcanza, el rojo desaparece
 * y la tarjeta lo dice en verde: el estado "logrado" no es un porcentaje.
 */
export function GapWidget({ props }: { props: WidgetProps["gap"] }) {
  const { t, step } = useMotionPrefs();
  const target = Math.max(props.target, 0);
  const current = Math.max(props.current, 0);
  const missing = Math.max(target - current, 0);
  const covered = target > 0 ? Math.min(current / target, 1) : 1;
  const enough = missing === 0;
  const months = props.deadlineMonths ?? 0;
  const perMonth = !enough && months > 0 ? missing / months : null;

  return (
    <WidgetShell>
      <Label>{props.title}</Label>

      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          columnGap: 1.25,
          rowGap: 0.5,
          mt: 0.5,
          mb: 2,
        }}
      >
        <RollingNumber
          value={missing}
          format={(n) => formatMoney(n)}
          variant="h2"
          delay={step(1)}
          sx={{
            color: enough ? TOKENS.goodInk : TOKENS.redDeep,
            minWidth: 0,
            overflowWrap: "anywhere",
          }}
        />
        {enough && (
          <MotionBox
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={t({ ...springSoft, delay: step(4) })}
            sx={{ display: "inline-flex" }}
          >
            <TonePill tone="good">
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                <Check size={12} strokeWidth={3} aria-hidden />
                Ya te alcanza
              </Box>
            </TonePill>
          </MotionBox>
        )}
      </Box>

      {/* Dos segmentos en un solo carril: el carril rojo diluido ES lo que falta. */}
      <Box
        sx={{
          height: 10,
          borderRadius: "var(--radius-pill)",
          overflow: "hidden",
          backgroundColor: enough ? TOKENS.tintGood12 : TOKENS.tintRed14,
        }}
      >
        <MotionBox
          initial={{ scaleX: 0 }}
          animate={{ scaleX: covered }}
          transition={t({ ...springSoft, delay: step(2) })}
          sx={{
            height: "100%",
            transformOrigin: "left",
            borderRadius: "var(--radius-pill)",
            backgroundColor: TOKENS.good,
          }}
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 1.25 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: TOKENS.goodInk, display: "block" }}>
            Ya tienes
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere" }}
          >
            {formatMoney(current)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right", minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            Necesitas
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere" }}
          >
            {formatMoney(target)}
          </Typography>
        </Box>
      </Box>

      {(props.caption || perMonth !== null) && (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mt: 1.5, overflowWrap: "anywhere" }}
        >
          {props.caption ?? (
            <>
              Son{" "}
              <Box
                component="span"
                sx={{ fontWeight: 700, color: "text.primary", fontVariantNumeric: "tabular-nums" }}
              >
                {formatMoney(perMonth ?? 0)}
              </Box>{" "}
              al mes durante {months} {months === 1 ? "mes" : "meses"}.
            </>
          )}
        </Typography>
      )}
    </WidgetShell>
  );
}
