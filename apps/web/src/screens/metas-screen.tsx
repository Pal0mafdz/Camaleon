import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type Goal,
  type GoalStatus,
  listGoals,
  listPlans,
  type Plan,
  patchGoal,
} from "../api/client";
import { TOKENS } from "../app/theme";
import { formatDateTime } from "../canvas/format";
import { useCanvas } from "../canvas/store";
import { MotionButton, spring, useMotionPrefs } from "../canvas/widgets/shell";
import { GoalCard } from "./goal-card";
import { NewGoalForm } from "./new-goal-form";
import { ScreenNote, ScreenSection, ScreenShell } from "./screen-ui";

/**
 * Metas y planes: lo único de la app que sobrevive al cierre de la charla.
 *
 * Un plan es un lienzo que el agente guardó. Tocarlo NO abre un detalle: lo
 * repinta en el lienzo y te devuelve al asesor, que es donde se puede seguir
 * preguntando sobre él.
 */
export function MetasScreen() {
  const userId = useCanvas((s) => s.userId);
  const paintWidgets = useCanvas((s) => s.paintWidgets);
  const setConversationId = useCanvas((s) => s.setConversationId);
  const setTab = useCanvas((s) => s.setTab);

  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setGoals(null);
    setError(null);

    Promise.all([listGoals(userId), listPlans(userId)])
      .then(([nextGoals, nextPlans]) => {
        if (!alive) return;
        setGoals(nextGoals);
        setPlans(nextPlans);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setGoals([]);
        setError(e instanceof Error ? e.message : "No pude cargar tus metas");
      });

    return () => {
      alive = false;
    };
  }, [userId]);

  function change(goal: Goal, status: GoalStatus) {
    setBusyId(goal.id);
    setError(null);

    patchGoal(goal.id, { userId, status })
      .then((next) => setGoals((cur) => (cur ?? []).map((g) => (g.id === next.id ? next : g))))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No pude actualizar la meta"),
      )
      .finally(() => setBusyId(null));
  }

  function openPlan(plan: Plan) {
    paintWidgets(plan.widgets);
    setConversationId(null);
    setTab("asesor");
  }

  return (
    <ScreenShell title="Metas">
      <Typography variant="body1" sx={{ color: "text.secondary", px: 0.5, mb: 0.5 }}>
        Lo que estás juntando y los planes que guardaste con el asesor.
      </Typography>

      <NewGoalForm
        userId={userId}
        onCreated={(goal) => setGoals((cur) => [goal, ...(cur ?? [])])}
      />

      {error && <ScreenNote tone="bad">{error}</ScreenNote>}

      {goals === null && <ScreenNote>Cargando tus metas…</ScreenNote>}

      {goals?.length === 0 && (
        <ScreenNote>
          Todavía no tienes metas. Crea la primera arriba o pídele un plan al asesor.
        </ScreenNote>
      )}

      {goals?.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          busy={busyId === goal.id}
          onChange={(status) => change(goal, status)}
        />
      ))}

      <ScreenSection label="Mis planes">
        {plans.length === 0 ? (
          <ScreenNote>
            Cuando el asesor arme un plan y lo guardes, aparece aquí para volver a abrirlo.
          </ScreenNote>
        ) : (
          plans.map((plan) => <PlanRow key={plan.id} plan={plan} onOpen={() => openPlan(plan)} />)
        )}
      </ScreenSection>
    </ScreenShell>
  );
}

/** Fila de plan guardado: título, cuándo se guardó y la flecha que lo abre. */
function PlanRow({ plan, onOpen }: { plan: Plan; onOpen: () => void }) {
  const { t } = useMotionPrefs();

  return (
    <MotionButton
      type="button"
      onClick={onOpen}
      whileTap={{ scale: 0.985 }}
      transition={t(spring)}
      className="liquid-glass"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        minHeight: "var(--tap-min)",
        borderRadius: "var(--radius-l)",
        p: 2,
        textAlign: "left",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>
          {plan.title}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {formatDateTime(plan.createdAt)} · {plan.widgets.length} tarjetas
        </Typography>
      </Box>
      <ChevronRight size={18} color={TOKENS.inkFaint} />
    </MotionButton>
  );
}
