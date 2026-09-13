import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Check, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createGoal, type Goal } from "../api/client";
import { TOKENS } from "../app/theme";
import { formatMoney } from "../canvas/format";
import { Expand, Note } from "../canvas/widgets/bits";
import {
  MotionBox,
  MotionButton,
  MotionForm,
  spring,
  useMotionPrefs,
  WidgetShell,
} from "../canvas/widgets/shell";
import { Field, PillButton } from "./screen-controls";

/**
 * Alta de meta. Vive plegada porque la pantalla es, ante todo, la lista de lo
 * que ya existe: crear es la excepción, no lo primero que ve el usuario.
 *
 * Es un `<form>` de verdad: Enter envía, el botón es `submit` y cada error
 * nombra el problema junto al campo que lo tiene. Los errores aparecen al
 * salir del campo o al intentar crear, nunca mientras se escribe la primera
 * letra. Al abrirse, el foco cae solo en el primer campo.
 */

/** Un título de meta cabe en tres líneas de tarjeta: más es un párrafo. */
export const TITLE_MAX = 60;

function toNumber(raw: string): number {
  const n = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

type FieldKey = "title" | "target" | "monthly" | "months";

function validate(values: Record<FieldKey, string>): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  const title = values.title.trim();
  const target = toNumber(values.target);
  const monthly = toNumber(values.monthly);
  const months = values.months.trim() === "" ? 0 : toNumber(values.months);

  if (title.length === 0) errors.title = "Ponle un nombre a la meta para reconocerla después.";
  else if (title.length > TITLE_MAX)
    errors.title = `El nombre tiene ${title.length} caracteres; el máximo es ${TITLE_MAX}.`;

  if (values.target.trim() === "") errors.target = "Escribe cuánto quieres juntar.";
  else if (target <= 0) errors.target = "El monto objetivo tiene que ser mayor que cero.";

  if (values.monthly.trim() === "") errors.monthly = "Escribe cuánto apartas cada mes.";
  else if (monthly <= 0) errors.monthly = "El aporte mensual tiene que ser mayor que cero.";
  else if (target > 0 && monthly > target)
    errors.monthly = `Apartar ${formatMoney(monthly)} supera la meta de ${formatMoney(target)}.`;

  if (values.months.trim() !== "" && (months <= 0 || !Number.isInteger(months)))
    errors.months = "El plazo va en meses enteros: 6, 12, 24…";

  return errors;
}

export function NewGoalForm({
  userId,
  open,
  onOpenChange,
  onCreated,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (goal: Goal) => void;
}) {
  const { t } = useMotionPrefs();
  const titleRef = useRef<HTMLInputElement | null>(null);
  const [values, setValues] = useState<Record<FieldKey, string>>({
    title: "",
    target: "",
    monthly: "",
    months: "",
  });
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = validate(values);
  const shown = (key: FieldKey) => (touched[key] ? errors[key] : undefined);
  const targetAmount = toNumber(values.target);
  const monthlyAmount = toNumber(values.monthly);
  const deadlineMonths = toNumber(values.months);
  const eta =
    targetAmount > 0 && monthlyAmount > 0 && !errors.monthly
      ? Math.ceil(targetAmount / monthlyAmount)
      : 0;

  useEffect(() => {
    if (!open) return;
    // Espera a que `Expand` abra el hueco: enfocar un campo con altura 0 hace saltar el scroll.
    const id = window.setTimeout(() => titleRef.current?.focus({ preventScroll: true }), 120);
    return () => window.clearTimeout(id);
  }, [open]);

  function set(key: FieldKey) {
    return (next: string) => setValues((cur) => ({ ...cur, [key]: next }));
  }

  function touch(key: FieldKey) {
    return () => setTouched((cur) => ({ ...cur, [key]: true }));
  }

  function submit() {
    if (busy) return;
    setTouched({ title: true, target: true, monthly: true, months: true });
    if (Object.keys(errors).length > 0) {
      const first = (["title", "target", "monthly", "months"] as FieldKey[]).find((k) => errors[k]);
      if (first === "title") titleRef.current?.focus();
      return;
    }

    setBusy(true);
    setError(null);

    createGoal({
      userId,
      title: values.title.trim(),
      targetAmount,
      monthlyAmount,
      deadlineMonths: deadlineMonths > 0 ? deadlineMonths : undefined,
    })
      .then((goal) => {
        onCreated(goal);
        setValues({ title: "", target: "", monthly: "", months: "" });
        setTouched({});
        onOpenChange(false);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "No pude crear la meta"))
      .finally(() => setBusy(false));
  }

  return (
    <WidgetShell>
      <MotionButton
        type="button"
        onClick={() => onOpenChange(!open)}
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
            Nueva meta
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Ponle nombre, monto y cuánto apartas al mes.
          </Typography>
        </Box>
      </MotionButton>

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
            label="¿Para qué es?"
            value={values.title}
            onChange={set("title")}
            onBlur={touch("title")}
            placeholder="Ej. Enganche del depa"
            inputRef={titleRef}
            maxLength={TITLE_MAX + 20}
            error={shown("title")}
          />
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Box sx={{ flex: "1 1 140px", minWidth: 0 }}>
              <Field
                label="Monto objetivo"
                value={values.target}
                onChange={set("target")}
                onBlur={touch("target")}
                placeholder="90000"
                numeric
                error={shown("target")}
              />
            </Box>
            <Box sx={{ flex: "1 1 140px", minWidth: 0 }}>
              <Field
                label="Aporto al mes"
                value={values.monthly}
                onChange={set("monthly")}
                onBlur={touch("monthly")}
                placeholder="3000"
                numeric
                error={shown("monthly")}
              />
            </Box>
          </Box>
          <Field
            label="Plazo en meses (opcional)"
            value={values.months}
            onChange={set("months")}
            onBlur={touch("months")}
            placeholder="12"
            numeric
            enterKeyHint="done"
            error={shown("months")}
            hint={
              eta > 0
                ? `A ${formatMoney(monthlyAmount)} al mes la completas en ${eta} ${eta === 1 ? "mes" : "meses"}.`
                : undefined
            }
          />

          {error && (
            <Box role="alert">
              <Note tone="bad">{error} Revisa tu conexión y vuelve a intentar.</Note>
            </Box>
          )}

          <PillButton
            type="submit"
            label={busy ? "Creando la meta…" : "Crear meta"}
            busy={busy}
            icon={<Check size={16} strokeWidth={2.6} />}
          />
        </MotionForm>
      </Expand>
    </WidgetShell>
  );
}
