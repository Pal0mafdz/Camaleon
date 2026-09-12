import { env } from "@camaleon/env/web";
import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import confetti from "canvas-confetti";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import { AnimatePresence, MotionBox, spring, WidgetShell } from "./shell";

type Action = {
  label: string;
  tool: string;
  args: Record<string, unknown>;
  confirm: string;
};

type Phase = "idle" | "confirming" | "running" | "done" | "error";

function celebrate() {
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 34,
    scalar: 0.9,
    origin: { y: 0.7 },
    // Sobre arena clara el confeti blanco desaparece: la familia cálida de la
    // marca (rojo, café, oro) es la única que se ve al caer.
    colors: [TOKENS.red, TOKENS.brown, TOKENS.viz[2] as string],
  });
  navigator.vibrate?.([12, 40, 18]);
}

/**
 * "El agente propone, el cliente dispone": nada se ejecuta sin este doble toque.
 */
export function ActionButton({ action }: { action: Action }) {
  const theme = useTheme();
  const [phase, setPhase] = useState<Phase>("idle");

  async function run() {
    setPhase("running");
    try {
      const res = await fetch(`${env.VITE_SERVER_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: action.tool, args: action.args }),
      });
      if (!res.ok) throw new Error(await res.text());
      setPhase("done");
      celebrate();
    } catch {
      setPhase("error");
    }
  }

  if (phase === "done") {
    return (
      <MotionBox
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          py: 1.5,
          borderRadius: 999,
          backgroundColor: TOKENS.tintGood12,
        }}
      >
        <Check size={16} color={theme.palette.success.main} />
        <Typography variant="button" sx={{ color: "success.main" }}>
          Listo
        </Typography>
      </MotionBox>
    );
  }

  return (
    <Box>
      <AnimatePresence initial={false} mode="wait">
        {phase === "confirming" ? (
          <MotionBox
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={spring}
          >
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.25 }}>
              {action.confirm}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button fullWidth variant="contained" onClick={run}>
                Sí, hazlo
              </Button>
              <Button
                fullWidth
                onClick={() => setPhase("idle")}
                sx={{ color: "text.secondary", backgroundColor: TOKENS.tintInk5 }}
              >
                Ahora no
              </Button>
            </Box>
          </MotionBox>
        ) : (
          <MotionBox
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <Button
              fullWidth
              variant="contained"
              disabled={phase === "running"}
              onClick={() => setPhase("confirming")}
              startIcon={
                phase === "running" ? (
                  <MotionBox
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.9, ease: "linear" }}
                    sx={{ display: "grid", placeItems: "center" }}
                  >
                    <Loader2 size={16} />
                  </MotionBox>
                ) : undefined
              }
            >
              {action.label}
            </Button>
            {phase === "error" && (
              <Typography variant="caption" sx={{ color: "error.main", mt: 1, display: "block" }}>
                No se pudo completar. Intenta de nuevo.
              </Typography>
            )}
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

export function ActionCardWidget({ props }: { props: WidgetProps["actionCard"] }) {
  return (
    // La tarjeta que SÍ ejecuta algo se distingue del resto del catálogo por un
    // anillo rojo diluido: es la única con consecuencias sobre el dinero real.
    <WidgetShell sx={{ boxShadow: `inset 0 0 0 1.5px ${TOKENS.tintRed32}, ${TOKENS.elev2}` }}>
      <Typography variant="h5" sx={{ mb: 0.75 }}>
        {props.title}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        {props.summary}
      </Typography>
      <ActionButton action={props.action} />
    </WidgetShell>
  );
}

export function ProductWidget({ props }: { props: WidgetProps["product"] }) {
  const theme = useTheme();

  return (
    <WidgetShell>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Banorte
          </Typography>
          <Typography variant="h5">{props.name}</Typography>
        </Box>
        <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>
          {props.headline}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: props.action ? 2 : 0 }}>
        {props.bullets.map((b) => (
          <Typography key={b} variant="body2" sx={{ color: "text.secondary" }}>
            · {b}
          </Typography>
        ))}
      </Box>
      {props.action && <ActionButton action={props.action} />}
    </WidgetShell>
  );
}
