import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Check, Pause, Play } from "lucide-react";
import type { Goal, GoalStatus } from "../api/client";
import { TOKENS } from "../app/theme";
import { formatMoney } from "../canvas/format";
import { TonePill } from "../canvas/widgets/bits";
import { Label, Meter, RollingNumber, useMotionPrefs, WidgetShell } from "../canvas/widgets/shell";
import { GhostButton } from "./screen-controls";

/**
 * Una meta como objeto de la mesa, con la composición de todo el catálogo:
 * una cifra protagonista (lo que llevas, que rueda), un dato de apoyo (de
 * cuánto, y qué tan lejos) y las acciones que el usuario puede tomar HOY.
 * Es un `WidgetShell` de papel: entra, se reacomoda y se va con el mismo
 * muelle que el lienzo.
 */

const TONE = {
  activa: "accent",
  pausada: "warn",
  completada: "good",
} as const;

const FILL = {
  activa: TOKENS.red,
  pausada: TOKENS.warn,
  completada: TOKENS.good,
} as const;

export function GoalCard({
  goal,
  onChange,
  busy,
}: {
  goal: Goal;
  onChange: (status: GoalStatus) => void;
  busy: boolean;
}) {
  const { step } = useMotionPrefs();
  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const shown = Math.min(100, Math.max(0, pct));
  const paused = goal.status === "pausada";
  const done = goal.status === "completada";
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const monthsLeft =
    goal.monthlyAmount > 0 && remaining > 0 ? Math.ceil(remaining / goal.monthlyAmount) : 0;

  return (
    <WidgetShell>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        {/* h5 a 18px: un título de 60 caracteres cabe en tres líneas en 375px. */}
        <Typography
          variant="h5"
          component="h3"
          sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere", textWrap: "pretty" }}
        >
          {goal.title}
        </Typography>
        <TonePill tone={TONE[goal.status]}>{goal.status}</TonePill>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Label>Llevas</Label>
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            columnGap: 1,
            rowGap: 0.25,
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          <RollingNumber
            value={goal.currentAmount}
            format={(n) => formatMoney(n)}
            variant="h3"
            delay={step(1)}
            sx={{
              color: done ? TOKENS.goodInk : "text.primary",
              minWidth: 0,
              overflowWrap: "anywhere",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontVariantNumeric: "tabular-nums",
              overflowWrap: "anywhere",
            }}
          >
            de {formatMoney(goal.targetAmount)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <Meter pct={shown} color={FILL[goal.status]} height={10} delay={step(2)} />
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, mt: 0.75 }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {Math.round(shown)}% de la meta
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.disabled",
              fontVariantNumeric: "tabular-nums",
              textAlign: "right",
              minWidth: 0,
              overflowWrap: "anywhere",
            }}
          >
            {formatMoney(goal.monthlyAmount)} al mes
            {goal.deadlineMonths ? ` · plazo de ${goal.deadlineMonths} meses` : ""}
          </Typography>
        </Box>
      </Box>

      {!done && (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5 }}>
          {paused
            ? "En pausa: no se aparta nada este mes."
            : monthsLeft > 0
              ? `A este ritmo la completas en ${monthsLeft} ${monthsLeft === 1 ? "mes" : "meses"}.`
              : "Ya juntaste lo que te propusiste."}
        </Typography>
      )}

      {!done && (
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <GhostButton
            label={paused ? "Reanudar" : "Pausar"}
            busy={busy}
            onClick={() => onChange(paused ? "activa" : "pausada")}
            icon={paused ? <Play size={15} /> : <Pause size={15} />}
          />
          <GhostButton
            label="Completar"
            busy={busy}
            onClick={() => onChange("completada")}
            icon={<Check size={15} strokeWidth={2.6} />}
          />
        </Box>
      )}
    </WidgetShell>
  );
}
