import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Check } from "lucide-react";
import { TOKENS } from "../../app/theme";
import { TonePill } from "./bits";
import {
  Label,
  Meter,
  MotionBox,
  MotionButton,
  Stagger,
  springSoft,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
} from "./shell";

/**
 * Una decisión por pantalla. Las opciones son tarjetas grandes de tocar, no
 * radios: elegir aquí abre un turno nuevo del agente, no rellena un formulario.
 */
export function QuestionWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["question"];
  onAsk?: (q: string) => void;
}) {
  const { t } = useMotionPrefs();
  const step = props.step ?? 0;
  const total = props.stepTotal ?? 0;
  const showStep = step > 0 && total > 0;

  return (
    <WidgetShell glass={false} pad={0} sx={{ backgroundColor: "transparent" }}>
      {showStep && (
        <Box sx={{ mb: 2 }}>
          <Label>
            Paso {step} de {total}
          </Label>
          <Box sx={{ mt: 0.75 }}>
            <Meter pct={Math.min(step / total, 1) * 100} color={TOKENS.red} height={4} />
          </Box>
        </Box>
      )}

      <Typography variant="h4">{props.title}</Typography>
      {props.subtitle && (
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", mt: 0.75, overflowWrap: "anywhere" }}
        >
          {props.subtitle}
        </Typography>
      )}

      <Stagger sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: 2.5 }}>
        {props.options.map((opt) => (
          <MotionButton
            key={opt.label}
            type="button"
            variants={staggerItem}
            whileTap={{ scale: 0.985 }}
            transition={t(springSoft)}
            aria-pressed={opt.selected}
            onClick={() => onAsk?.(opt.ask)}
            sx={{
              display: "block",
              width: "100%",
              p: 2,
              minHeight: "var(--tap-min)",
              borderRadius: "var(--radius-l)",
              transition:
                "background-color var(--dur-standard) var(--ease-ios), box-shadow var(--dur-standard) var(--ease-ios)",
              backgroundColor: opt.selected ? TOKENS.ink : TOKENS.card,
              boxShadow: opt.selected
                ? `${TOKENS.glossInk}, ${TOKENS.elevInk}`
                : `${TOKENS.hairline}, ${TOKENS.elev1}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  flex: 1,
                  minWidth: 0,
                  overflowWrap: "anywhere",
                  color: opt.selected ? TOKENS.onDark : "text.primary",
                }}
              >
                {opt.label}
              </Typography>
              {opt.selected && (
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    flexShrink: 0,
                    borderRadius: "var(--radius-pill)",
                    display: "grid",
                    placeItems: "center",
                    color: TOKENS.ink,
                    backgroundColor: TOKENS.onDark,
                  }}
                  aria-hidden
                >
                  <Check size={13} strokeWidth={3.5} />
                </Box>
              )}
            </Box>

            {opt.sublabel && (
              <Typography
                variant="body2"
                sx={{
                  mt: 0.375,
                  overflowWrap: "anywhere",
                  color: opt.selected ? TOKENS.onDarkDim : "text.secondary",
                }}
              >
                {opt.sublabel}
              </Typography>
            )}

            {opt.badge && (
              <Box sx={{ display: "flex", mt: 1.25 }}>
                {opt.selected ? (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: TOKENS.tintWhite14,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: TOKENS.onDark, fontWeight: 700 }}>
                      {opt.badge}
                    </Typography>
                  </Box>
                ) : (
                  <TonePill tone={opt.tone}>{opt.badge}</TonePill>
                )}
              </Box>
            )}
          </MotionButton>
        ))}
      </Stagger>

      {props.note && (
        <MotionBox
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t({ ...springSoft, delay: 0.2 })}
          sx={{
            mt: 2.5,
            pl: 1.75,
            backgroundImage: `linear-gradient(90deg, ${TOKENS.red} 0 3px, transparent 3px)`,
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {props.note}
          </Typography>
        </MotionBox>
      )}
    </WidgetShell>
  );
}
