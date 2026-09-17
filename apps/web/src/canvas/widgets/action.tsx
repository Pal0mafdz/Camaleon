import { env } from "@camaleon/env/web";
import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import confetti from "canvas-confetti";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import {
  AnimatePresence,
  MotionBox,
  Stagger,
  spring,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
} from "./shell";

type Action = {
  label: string;
  tool: string;
  args: Record<string, unknown>;
  confirm: string;
};

type Phase = "idle" | "confirming" | "running" | "done" | "error";

function celebrate(reduced: boolean) {
  if (!reduced) {
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
  }
  navigator.vibrate?.([12, 40, 18]);
}

/**
 * "El agente propone, el cliente dispone": nada se ejecuta sin este doble toque.
 * El botón muta en su sitio: proponer → confirmar → girar → listo. El giro se
 * apaga con movimiento reducido; el icono se queda quieto y el texto lo dice.
 */
export function ActionButton({ action }: { action: Action }) {
  const { t, loop, reduced } = useMotionPrefs();
  const [phase, setPhase] = useState<Phase>("idle");
  const running = phase === "running";

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
      celebrate(reduced);
    } catch {
      setPhase("error");
    }
  }

  if (phase === "done") {
    return (
      <MotionBox
        role="status"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={t(spring)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          minHeight: "var(--tap-min)",
          px: 2,
          borderRadius: "var(--radius-pill)",
          backgroundColor: TOKENS.tintGood12,
        }}
      >
        <MotionBox
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={t({ ...spring, delay: 0.08 })}
          sx={{ display: "grid", placeItems: "center", color: TOKENS.goodInk }}
        >
          <Check size={16} strokeWidth={2.8} aria-hidden />
        </MotionBox>
        <Typography variant="button" sx={{ color: TOKENS.goodInk }}>
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
            transition={t(spring)}
          >
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mb: 1.25, overflowWrap: "anywhere" }}
            >
              {action.confirm}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="contained" onClick={run} sx={{ flex: 1, minWidth: 140 }}>
                Sí, hazlo
              </Button>
              <Button
                onClick={() => setPhase("idle")}
                sx={{
                  flex: 1,
                  minWidth: 120,
                  color: "text.secondary",
                  backgroundColor: TOKENS.sunken,
                  "&:hover": { backgroundColor: TOKENS.well },
                }}
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
            transition={t(spring)}
          >
            <Button
              fullWidth
              variant="contained"
              disabled={running}
              aria-busy={running}
              onClick={() => setPhase("confirming")}
              startIcon={
                running ? (
                  <MotionBox
                    animate={loop({ rotate: 360 })}
                    transition={t({
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 0.9,
                      ease: "linear",
                    })}
                    sx={{ display: "grid", placeItems: "center" }}
                    aria-hidden
                  >
                    <Loader2 size={16} />
                  </MotionBox>
                ) : undefined
              }
            >
              {running ? "Ejecutando…" : action.label}
            </Button>
            {phase === "error" && (
              <Typography
                role="alert"
                variant="caption"
                sx={{ color: TOKENS.badInk, mt: 1, display: "block" }}
              >
                No se pudo completar. Toca el botón para intentarlo de nuevo.
              </Typography>
            )}
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

/**
 * La tarjeta que SÍ ejecuta algo. Se distingue del resto del catálogo por un
 * anillo rojo diluido: es la única con consecuencias sobre el dinero real.
 * Composición: qué va a pasar (título), en una línea (resumen), el botón.
 */
export function ActionCardWidget({ props }: { props: WidgetProps["actionCard"] }) {
  return (
    <WidgetShell sx={{ boxShadow: `inset 0 0 0 1.5px ${TOKENS.tintRed32}, ${TOKENS.elev2}` }}>
      <Typography variant="h5" sx={{ mb: 0.75, overflowWrap: "anywhere" }}>
        {props.title}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, overflowWrap: "anywhere" }}>
        {props.summary}
      </Typography>
      <ActionButton action={props.action} />
    </WidgetShell>
  );
}

/**
 * Producto Banorte presentado por su beneficio: la cifra que importa
 * (`CAT 16.2%`) es la protagonista, el nombre la acompaña y las implicaciones
 * entran escalonadas con una marca cada una.
 */
export function ProductWidget({ props }: { props: WidgetProps["product"] }) {
  const { t, step } = useMotionPrefs();

  return (
    <WidgetShell>
      <MotionBox
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t({ ...spring, delay: step(1) })}
      >
        <Typography
          variant="h3"
          sx={{
            color: TOKENS.redDeep,
            fontVariantNumeric: "tabular-nums",
            overflowWrap: "anywhere",
          }}
        >
          {props.headline}
        </Typography>
      </MotionBox>
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", mt: 0.5, overflowWrap: "anywhere" }}
      >
        <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
          {props.name}
        </Box>{" "}
        · Banorte
      </Typography>

      {props.bullets.length > 0 && (
        <Stagger
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.875,
            mt: 2,
            mb: props.action ? 2.25 : 0,
          }}
        >
          {props.bullets.map((b) => (
            <MotionBox
              key={b}
              variants={staggerItem}
              sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  mt: "1px",
                  borderRadius: "var(--radius-pill)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  color: TOKENS.goodInk,
                  backgroundColor: TOKENS.tintGood12,
                }}
                aria-hidden
              >
                <Check size={11} strokeWidth={3} />
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", minWidth: 0, overflowWrap: "anywhere" }}
              >
                {b}
              </Typography>
            </MotionBox>
          ))}
        </Stagger>
      )}
      {props.action && <ActionButton action={props.action} />}
    </WidgetShell>
  );
}
