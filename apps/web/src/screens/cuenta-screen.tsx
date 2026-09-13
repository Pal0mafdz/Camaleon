import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Check, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Balance,
  depositToAccount,
  type FundGoalResult,
  fundGoal,
  type Goal,
  getAccountBalance,
  listGoals,
} from "../api/client";
import { TOKENS } from "../app/theme";
import { formatMoney } from "../canvas/format";
import { useCanvas } from "../canvas/store";
import { Expand, Note } from "../canvas/widgets/bits";
import {
  AnimatePresence,
  Label,
  MotionBox,
  MotionButton,
  MotionForm,
  RollingNumber,
  spring,
  useMotionPrefs,
  WidgetShell,
} from "../canvas/widgets/shell";
import { Field, GhostButton, PillButton } from "./screen-controls";
import {
  ListSkeleton,
  ScreenEmpty,
  ScreenLede,
  ScreenNote,
  ScreenSection,
  ScreenShell,
} from "./screen-ui";

/**
 * Cuenta: el saldo real del usuario y las dos únicas acciones que mueven
 * dinero de verdad — abonar a la cuenta y transferir de la cuenta a una meta.
 * Agregar dinero a una meta descuenta del saldo (no son montos independientes):
 * es una transferencia, no un número que sube solo.
 */

function toNumber(raw: string): number {
  const n = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function CuentaScreen() {
  const userId = useCanvas((s) => s.userId);

  const [balance, setBalance] = useState<Balance | null>(null);
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  const load = useCallback(() => {
    const gen = ++generation.current;
    setError(null);

    Promise.all([getAccountBalance(userId), listGoals(userId)])
      .then(([nextBalance, nextGoals]) => {
        if (gen !== generation.current) return;
        setBalance(nextBalance);
        setGoals(nextGoals);
      })
      .catch((e: unknown) => {
        if (gen !== generation.current) return;
        setGoals([]);
        setError(e instanceof Error ? e.message : "No pude cargar tu cuenta");
      });
  }, [userId]);

  useEffect(() => {
    load();
    return () => {
      generation.current++;
    };
  }, [load]);

  const loading = balance === null || goals === null;
  const active = (goals ?? []).filter((g) => g.status !== "completada");

  return (
    <ScreenShell title="Tu cuenta">
      <ScreenLede>Abona a tu saldo o mueve dinero directo a una de tus metas.</ScreenLede>

      <AnimatePresence>
        {error && (
          <ScreenNote key="error" tone="bad" action={{ label: "Volver a cargar", onClick: load }}>
            {error}
          </ScreenNote>
        )}
      </AnimatePresence>

      {loading && <ListSkeleton heights={[168, 116]} />}

      {!loading && balance && (
        <>
          <BalanceCard
            balance={balance.balance}
            onDeposited={(next) => setBalance((cur) => (cur ? { ...cur, balance: next } : cur))}
          />

          <ScreenSection label="Agregar dinero a una meta">
            <AnimatePresence>
              {active.length === 0 ? (
                <ScreenEmpty
                  key="empty-goals"
                  title="Todavía no tienes metas activas"
                  body="Crea una meta en la pestaña Metas para poder abonarle dinero desde aquí."
                />
              ) : (
                active.map((goal) => (
                  <GoalFundRow
                    key={goal.id}
                    goal={goal}
                    accountBalance={balance.balance}
                    onFunded={(result) => {
                      setBalance((cur) => (cur ? { ...cur, balance: result.balance } : cur));
                      setGoals((cur) =>
                        (cur ?? []).map((g) => (g.id === result.goal.id ? result.goal : g)),
                      );
                    }}
                  />
                ))
              )}
            </AnimatePresence>
          </ScreenSection>
        </>
      )}
    </ScreenShell>
  );
}

/** Saldo actual y el único formulario que lo incrementa: un abono manual. */
function BalanceCard({
  balance,
  onDeposited,
}: {
  balance: number;
  onDeposited: (next: number) => void;
}) {
  const { t, step } = useMotionPrefs();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = toNumber(amount);

  function submit() {
    if (busy) return;
    setTouched(true);
    if (value <= 0) return;

    setBusy(true);
    setError(null);
    depositToAccount(value)
      .then((res) => {
        onDeposited(res.balance);
        setAmount("");
        setTouched(false);
        setOpen(false);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "No pude hacer el abono"))
      .finally(() => setBusy(false));
  }

  return (
    <WidgetShell>
      <Label>Saldo disponible</Label>
      <RollingNumber
        value={balance}
        format={(n) => formatMoney(n)}
        variant="h2"
        delay={step(1)}
        sx={{ color: "text.primary", mt: 0.75, minWidth: 0, overflowWrap: "anywhere" }}
      />

      <Box sx={{ mt: 2 }}>
        <MotionButton
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          whileTap={{ scale: 0.985 }}
          transition={t(spring)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            width: "100%",
            minHeight: "var(--tap-min)",
            textAlign: "left",
            borderRadius: "var(--radius-m)",
          }}
        >
          <MotionBox
            animate={{ rotate: open ? 45 : 0 }}
            transition={t(spring)}
            sx={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-pill)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color: TOKENS.onDark,
              backgroundColor: TOKENS.red,
              boxShadow: TOKENS.elev1,
            }}
            aria-hidden
          >
            <Plus size={18} strokeWidth={2.6} />
          </MotionBox>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" component="h2">
              Abonar a mi cuenta
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Realiza un deposito.
            </Typography>
          </Box>
        </MotionButton>
      </Box>

      <Expand open={open}>
        <MotionForm
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2.5 }}
        >
          <Field
            label="Monto a abonar"
            value={amount}
            onChange={setAmount}
            onBlur={() => setTouched(true)}
            placeholder="500"
            numeric
            enterKeyHint="done"
            error={touched && value <= 0 ? "El monto tiene que ser mayor a cero." : undefined}
          />
          {error && (
            <Box role="alert">
              <Note tone="bad">{error}</Note>
            </Box>
          )}
          <PillButton
            type="submit"
            label={busy ? "Abonando…" : "Abonar"}
            busy={busy}
            icon={<Check size={16} strokeWidth={2.6} />}
          />
        </MotionForm>
      </Expand>
    </WidgetShell>
  );
}

/** Una meta con su botón de "Agregar dinero": transfiere del saldo a `currentAmount`. */
function GoalFundRow({
  goal,
  accountBalance,
  onFunded,
}: {
  goal: Goal;
  accountBalance: number;
  onFunded: (result: FundGoalResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = toNumber(amount);
  const fieldError = !touched
    ? undefined
    : value <= 0
      ? "El monto tiene que ser mayor a cero."
      : value > accountBalance
        ? `No te alcanza: tu saldo es ${formatMoney(accountBalance)}.`
        : undefined;

  function submit() {
    if (busy) return;
    setTouched(true);
    if (value <= 0 || value > accountBalance) return;

    setBusy(true);
    setError(null);
    fundGoal(goal.id, value)
      .then((result) => {
        onFunded(result);
        setAmount("");
        setTouched(false);
        setOpen(false);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "No pude abonar a la meta"))
      .finally(() => setBusy(false));
  }

  return (
    <WidgetShell>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" component="h3" sx={{ overflowWrap: "anywhere" }}>
            {goal.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {formatMoney(goal.currentAmount)} de {formatMoney(goal.targetAmount)}
          </Typography>
        </Box>
        <GhostButton
          label={open ? "Cancelar" : "Agregar dinero"}
          onClick={() => setOpen((v) => !v)}
          icon={<Plus size={15} />}
        />
      </Box>

      <Expand open={open}>
        <MotionForm
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <Field
            label="Monto a agregar"
            value={amount}
            onChange={setAmount}
            onBlur={() => setTouched(true)}
            placeholder="200"
            numeric
            enterKeyHint="done"
            error={fieldError}
          />
          {error && (
            <Box role="alert">
              <Note tone="bad">{error}</Note>
            </Box>
          )}
          <PillButton
            type="submit"
            label={busy ? "Agregando…" : "Agregar dinero"}
            busy={busy}
            icon={<Check size={16} strokeWidth={2.6} />}
          />
        </MotionForm>
      </Expand>
    </WidgetShell>
  );
}
