import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import { Note, TonePill } from "./bits";
import {
  Label,
  Meter,
  MotionBox,
  MotionButton,
  Stagger,
  spring,
  springSoft,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
} from "./shell";

/**
 * Una decisión por pantalla. Las opciones son botones de verdad —teclado y
 * lector de pantalla incluidos— y elegir abre un turno nuevo del agente, no
 * rellena un formulario.
 *
 * La afordancia es tipográfica: al pasar el puntero o enfocar, un subrayado
 * rojo se traza bajo la opción (`scaleX` desde la izquierda) y la fila se
 * enciende con un halo suave. La opción ya elegida lleva el relleno rojo
 * tenue y la marca; el lienzo sigue teniendo un solo lingote.
 */
export function QuestionWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["question"];
  onAsk?: (q: string) => void;
}) {
  const { t, step } = useMotionPrefs();
  // Puntero o foco sobre una opción: estado, no variantes, para que el
  // botón siga heredando el stagger de entrada de su contenedor.
  const [hot, setHot] = useState<string | null>(null);
  const at = props.step ?? 0;
  const total = props.stepTotal ?? 0;
  const showStep = at > 0 && total > 0;

  return (
    <WidgetShell>
      {showStep && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Label>
                Paso {at} de {total}
              </Label>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
            >
              {Math.round(Math.min(at / total, 1) * 100)}%
            </Typography>
          </Box>
          <Box sx={{ mt: 0.75 }}>
            <Meter
              pct={Math.min(at / total, 1) * 100}
              color={TOKENS.red}
              height={4}
              delay={step(1)}
            />
          </Box>
        </Box>
      )}

      <Typography variant="h4" sx={{ overflowWrap: "anywhere" }}>
        {props.title}
      </Typography>
      {props.subtitle && (
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", mt: 0.75, overflowWrap: "anywhere" }}
        >
          {props.subtitle}
        </Typography>
      )}

      <Stagger sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 2.25 }}>
        {props.options.map((opt) => {
          const isHot = hot === opt.label;
          return (
            <MotionButton
              key={opt.label}
              type="button"
              variants={staggerItem}
              whileTap={{ scale: 0.985 }}
              transition={t(spring)}
              aria-pressed={opt.selected}
              onClick={() => onAsk?.(opt.ask)}
              onHoverStart={() => setHot(opt.label)}
              onHoverEnd={() => setHot((v) => (v === opt.label ? null : v))}
              onFocus={() => setHot(opt.label)}
              onBlur={() => setHot((v) => (v === opt.label ? null : v))}
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                px: 1.75,
                py: 1.5,
                minHeight: "var(--tap-min)",
                borderRadius: "var(--radius-m)",
                backgroundColor: opt.selected ? TOKENS.tintRed8 : TOKENS.sunken,
                boxShadow: opt.selected ? `inset 0 0 0 1.5px ${TOKENS.tintRed32}` : "none",
              }}
            >
              {/* Halo: se enciende con el puntero o el foco, sin tocar el layout. */}
              <MotionBox
                initial={false}
                animate={{ opacity: isHot ? 1 : 0 }}
                transition={t({ duration: 0.2 })}
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "var(--radius-m)",
                  boxShadow: `0 0 0 2px ${TOKENS.card}, 0 0 0 4px ${TOKENS.tintRed32}`,
                  pointerEvents: "none",
                }}
                aria-hidden
              />

              <Box sx={{ position: "relative", flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "inline-block", position: "relative", maxWidth: "100%" }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      overflowWrap: "anywhere",
                      color: opt.selected ? TOKENS.redDeep : "text.primary",
                    }}
                  >
                    {opt.label}
                  </Typography>
                  <MotionBox
                    initial={false}
                    animate={{ scaleX: isHot ? 1 : 0 }}
                    transition={t(springSoft)}
                    sx={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: -2,
                      height: 2,
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: TOKENS.red,
                      transformOrigin: "left",
                    }}
                    aria-hidden
                  />
                </Box>

                {opt.sublabel && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.375, overflowWrap: "anywhere", color: "text.secondary" }}
                  >
                    {opt.sublabel}
                  </Typography>
                )}

                {opt.badge && (
                  <Box sx={{ display: "flex", mt: 1 }}>
                    <TonePill tone={opt.tone}>{opt.badge}</TonePill>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  position: "relative",
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: "var(--radius-pill)",
                  display: "grid",
                  placeItems: "center",
                  color: opt.selected ? TOKENS.onDark : "text.secondary",
                  backgroundColor: opt.selected ? TOKENS.red : TOKENS.card,
                }}
                aria-hidden
              >
                {opt.selected ? (
                  <Check size={14} strokeWidth={3.5} />
                ) : (
                  <MotionBox
                    initial={false}
                    animate={{ x: isHot ? 2 : 0 }}
                    transition={t(spring)}
                    sx={{ display: "grid", placeItems: "center" }}
                  >
                    <ArrowRight size={15} strokeWidth={2.4} />
                  </MotionBox>
                )}
              </Box>
            </MotionButton>
          );
        })}
      </Stagger>

      {props.note && (
        <MotionBox
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t({ ...springSoft, delay: step(props.options.length + 1) })}
          sx={{ mt: 2 }}
        >
          <Note tone="neutral">{props.note}</Note>
        </MotionBox>
      )}
    </WidgetShell>
  );
}
