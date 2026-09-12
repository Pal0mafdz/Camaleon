import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { createGoal, type Goal } from "../api/client";
import { TOKENS } from "../app/theme";
import { Expand } from "../canvas/widgets/bits";
import { MotionBox, MotionButton, spring, useMotionPrefs } from "../canvas/widgets/shell";
import { Field, PillButton } from "./screen-controls";
import { ScreenNote } from "./screen-ui";

/**
 * Alta de meta. Vive plegada porque la pantalla es, ante todo, la lista de lo
 * que ya existe: crear es la excepción, no lo primero que ve el usuario.
 */

function toNumber(raw: string): number {
  const n = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function NewGoalForm({
  userId,
  onCreated,
}: {
  userId: string;
  onCreated: (goal: Goal) => void;
}) {
  const { t } = useMotionPrefs();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [monthly, setMonthly] = useState("");
  const [months, setMonths] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetAmount = toNumber(target);
  const monthlyAmount = toNumber(monthly);
  const deadlineMonths = toNumber(months);
  const ready = title.trim().length > 0 && targetAmount > 0 && monthlyAmount > 0;

  function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);

    createGoal({
      userId,
      title: title.trim(),
      targetAmount,
      monthlyAmount,
      deadlineMonths: deadlineMonths > 0 ? deadlineMonths : undefined,
    })
      .then((goal) => {
        onCreated(goal);
        setTitle("");
        setTarget("");
        setMonthly("");
        setMonths("");
        setOpen(false);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "No pude crear la meta"))
      .finally(() => setBusy(false));
  }

  return (
    <Box
      className="liquid-glass"
      sx={{ borderRadius: "var(--radius-l)", p: 2.5, display: "block" }}
    >
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
        }}
      >
        <MotionBox
          animate={{ rotate: open ? 45 : 0 }}
          transition={t(spring)}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-pill)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: TOKENS.onDark,
            backgroundColor: TOKENS.red,
          }}
        >
          <Plus size={18} strokeWidth={2.6} />
        </MotionBox>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5">Nueva meta</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Ponle nombre, monto y cuánto apartas al mes.
          </Typography>
        </Box>
      </MotionButton>

      <Expand open={open}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2.5 }}>
          <Field
            label="¿Para qué es?"
            value={title}
            onChange={setTitle}
            placeholder="Ej. Enganche del depa"
          />
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Field
                label="Monto objetivo"
                value={target}
                onChange={setTarget}
                placeholder="90000"
                numeric
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Field
                label="Aporto al mes"
                value={monthly}
                onChange={setMonthly}
                placeholder="3000"
                numeric
              />
            </Box>
          </Box>
          <Field
            label="Plazo en meses (opcional)"
            value={months}
            onChange={setMonths}
            placeholder="12"
            numeric
          />

          {error && <ScreenNote tone="bad">{error}</ScreenNote>}

          <PillButton
            label={busy ? "Creando…" : "Crear meta"}
            onClick={submit}
            disabled={!ready || busy}
            icon={<Check size={16} strokeWidth={2.6} />}
          />
        </Box>
      </Expand>
    </Box>
  );
}
