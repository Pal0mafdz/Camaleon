import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Check, Pause, Play } from "lucide-react";
import type { Goal, GoalStatus } from "../api/client";
import { TOKENS } from "../app/theme";
import { formatMoney } from "../canvas/format";
import { AmountRow, TonePill } from "../canvas/widgets/bits";
import { Meter } from "../canvas/widgets/shell";
import { GhostButton } from "./screen-controls";

/**
 * Una meta como objeto de la mesa: barra de avance real, los dos montos que
 * importan y las acciones que el usuario puede tomar HOY. Nada decorativo.
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
  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const paused = goal.status === "pausada";
  const done = goal.status === "completada";

  return (
    <Box className="liquid-glass" sx={{ borderRadius: "var(--radius-l)", p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
        <Typography variant="h5" sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
          {goal.title}
        </Typography>
        <TonePill tone={TONE[goal.status]}>{goal.status}</TonePill>
      </Box>

      <Meter pct={pct} color={FILL[goal.status]} height={10} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 1.75 }}>
        <AmountRow label="Llevas" amount={formatMoney(goal.currentAmount)} bold />
        <AmountRow label="Meta" amount={formatMoney(goal.targetAmount)} color={TOKENS.inkDim} />
      </Box>

      <Typography variant="caption" sx={{ display: "block", color: "text.disabled", mt: 1.5 }}>
        {formatMoney(goal.monthlyAmount)} al mes
        {goal.deadlineMonths ? ` · plazo de ${goal.deadlineMonths} meses` : ""}
      </Typography>

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
    </Box>
  );
}
