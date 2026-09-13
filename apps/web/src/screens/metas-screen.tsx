import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Goal,
  type GoalStatus,
  listGoals,
  listPlans,
  type Plan,
  patchGoal,
} from "../api/client";
import { TOKENS } from "../app/theme";
import { formatDateTime, formatMoney } from "../canvas/format";
import { useCanvas } from "../canvas/store";
import {
  AnimatePresence,
  Label,
  Meter,
  MotionButton,
  RollingNumber,
  spring,
  useMotionPrefs,
  WidgetShell,
} from "../canvas/widgets/shell";
import { GoalCard } from "./goal-card";
import { NewGoalForm } from "./new-goal-form";
import {
  ListSkeleton,
  ScreenEmpty,
  ScreenLede,
  ScreenNote,
  ScreenSection,
  ScreenShell,
} from "./screen-ui";

/**
 * Metas y planes: lo único de la app que sobrevive al cierre de la charla.
 *
 * Arriba aterriza el lingote de la pantalla —cuánto llevas juntado entre todas
 * tus metas— y debajo cada meta es papel que entra, se reacomoda y se va con
 * el mismo muelle que el lienzo. Un plan es un lienzo que el agente guardó:
 * tocarlo NO abre un detalle, lo repinta en el lienzo y te devuelve al asesor.
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
  const [formOpen, setFormOpen] = useState(false);
  // Cada carga lleva su n�mero; una respuesta vieja (perfil cambiado, reintento) se ignora.
  const generation = useRef(0);

  const load = useCallback(() => {
    const gen = ++generation.current;
    setGoals(null);
    setError(null);

    Promise.all([listGoals(userId), listPlans(userId)])
      .then(([nextGoals, nextPlans]) => {
        if (gen !== generation.current) return;
        setGoals(nextGoals);
        setPlans(nextPlans);
      })
      .catch((e: unknown) => {
        if (gen !== generation.current) return;
        setGoals([]);
        setError(e instanceof Error ? e.message : "No pude cargar tus metas");
      });
  }, [userId]);

  useEffect(() => {
    load();
    return () => {
      generation.current++;
    };
  }, [load]);

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

  const loading = goals === null;
  const list = goals ?? [];

  return (
    <ScreenShell title="Metas">
      <ScreenLede>Lo que estás juntando y los planes que guardaste con el asesor.</ScreenLede>

      <AnimatePresence>
        {/* Con una sola meta el resumen repetiría su tarjeta: solo suma cuando hay qué sumar. */}
        {!loading && list.length > 1 && <GoalsIngot key="ingot" goals={list} />}
      </AnimatePresence>

      <NewGoalForm
        userId={userId}
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={(goal) => setGoals((cur) => [goal, ...(cur ?? [])])}
      />

      <AnimatePresence>
        {error && (
          <ScreenNote key="error" tone="bad" action={{ label: "Volver a cargar", onClick: load }}>
            {error}
          </ScreenNote>
        )}
      </AnimatePresence>

      {loading && <ListSkeleton heights={[164, 196, 196]} />}

      <AnimatePresence>
        {!loading && list.length === 0 && !error && (
          <ScreenEmpty
            key="empty-goals"
            title="Todavía no tienes metas"
            body="Una meta es un monto con nombre y un ritmo mensual. Crea la primera aquí o pídele al asesor que te arme una."
            action={{ label: "Crear mi primera meta", onClick: () => setFormOpen(true) }}
          />
        )}

        {list.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            busy={busyId === goal.id}
            onChange={(status) => change(goal, status)}
          />
        ))}
      </AnimatePresence>

      {!loading && (
        <ScreenSection label="Mis planes">
          <AnimatePresence>
            {plans.length === 0 ? (
              <ScreenEmpty
                key="empty-plans"
                title="Aún no guardas ningún plan"
                body="Cuando el asesor arme un plan de ahorro o de compra y lo guardes, aparece aquí para volver a abrirlo."
                action={{ label: "Pedir un plan al asesor", onClick: () => setTab("asesor") }}
              />
            ) : (
              plans.map((plan) => (
                <PlanRow key={plan.id} plan={plan} onOpen={() => openPlan(plan)} />
              ))
            )}
          </AnimatePresence>
        </ScreenSection>
      )}
    </ScreenShell>
  );
}

/**
 * Resumen de Metas: una tarjeta blanca (la única roja del mundo es el saldo).
 * Suma lo que llevas en todas tus metas y lo compara con lo que te propusiste;
 * el rojo es la barra: lo que ya está apartado.
 */
function GoalsIngot({ goals }: { goals: Goal[] }) {
  const { step } = useMotionPrefs();
  const saved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const target = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const active = goals.filter((g) => g.status === "activa").length;
  const done = goals.filter((g) => g.status === "completada").length;
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;

  return (
    <WidgetShell>
      <Label>Juntado en tus metas</Label>
      <RollingNumber
        value={saved}
        format={(n) => formatMoney(n)}
        variant="h2"
        className="ingot-figure"
        delay={step(2)}
        sx={{ color: "text.primary", mt: 0.75, minWidth: 0, overflowWrap: "anywhere" }}
      />
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", mt: 0.75, fontVariantNumeric: "tabular-nums" }}
      >
        de {formatMoney(target)} entre {goals.length} {goals.length === 1 ? "meta" : "metas"}
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Meter pct={pct} color={TOKENS.red} height={8} delay={step(3)} />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, mt: 1 }}>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
        >
          {Math.round(pct)}% del total
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            fontVariantNumeric: "tabular-nums",
            textAlign: "right",
          }}
        >
          {active} {active === 1 ? "activa" : "activas"}
          {done > 0 ? ` · ${done} ${done === 1 ? "completada" : "completadas"}` : ""}
        </Typography>
      </Box>
    </WidgetShell>
  );
}

/** Fila de plan guardado: título, cuándo se guardó y la flecha que lo abre. */
function PlanRow({ plan, onOpen }: { plan: Plan; onOpen: () => void }) {
  const { t } = useMotionPrefs();

  return (
    <WidgetShell pad={0}>
      <MotionButton
        type="button"
        onClick={onOpen}
        whileTap={{ scale: 0.985 }}
        transition={t(spring)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          width: "100%",
          minHeight: "var(--tap-min)",
          borderRadius: "var(--radius-l)",
          p: 2,
          textAlign: "left",
          transition: "background-color var(--dur-micro) var(--ease-ios)",
          "&:hover": { backgroundColor: TOKENS.tintInk3 },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" component="h3" sx={{ overflowWrap: "anywhere" }}>
            {plan.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.disabled", fontVariantNumeric: "tabular-nums" }}
          >
            {formatDateTime(plan.createdAt)} · {plan.widgets.length}{" "}
            {plan.widgets.length === 1 ? "tarjeta" : "tarjetas"}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-xs)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: "text.secondary",
            backgroundColor: TOKENS.sunken,
          }}
          aria-hidden
        >
          <ChevronRight size={16} strokeWidth={2.4} />
        </Box>
      </MotionButton>
    </WidgetShell>
  );
}
