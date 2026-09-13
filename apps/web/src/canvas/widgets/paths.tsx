import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { toneColor, toneInk } from "../format";
import { AskPill, TonePill } from "./bits";
import {
  MotionBox,
  Stagger,
  springSoft,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
  WidgetTitle,
} from "./shell";

type Path = WidgetProps["paths"]["options"][number];

/** La pregunta que abre el camino: el catálogo no la trae, así que la formulamos aquí. */
function pathQuestion(opt: Path): string {
  return `Quiero ir por "${opt.label}" (${opt.headline}). ¿Cómo lo hago paso a paso?`;
}

/**
 * 2-4 caminos comparables para lograr lo mismo. Cada camino es papel propio
 * sobre el lienzo (el shell va `bare`: nada anidado) con la misma anatomía:
 * el nombre del camino, el dato que decide como protagonista, hasta tres
 * implicaciones y la pastilla que lo pregunta al agente. El camino con
 * insignia lleva la pastilla roja; los demás, la de papel.
 */
export function PathsWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["paths"];
  onAsk?: (q: string) => void;
}) {
  const theme = useTheme();
  const { t, step } = useMotionPrefs();

  return (
    <WidgetShell variant="bare" pad={0}>
      <WidgetTitle>{props.title}</WidgetTitle>
      <Stagger sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {props.options.map((opt, i) => {
          const tone = opt.tone === "neutral" ? undefined : opt.tone;
          const color = toneColor(tone, theme);
          const ink = toneInk(tone, theme);
          const featured = Boolean(opt.badge);
          return (
            <MotionBox
              key={opt.label}
              variants={staggerItem}
              className="paper"
              sx={{ borderRadius: "var(--radius-l)", p: 2.5, minWidth: 0 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{ color: "text.secondary", flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
                >
                  {opt.label}
                </Typography>
                {opt.badge && <TonePill tone="accent">{opt.badge}</TonePill>}
              </Box>

              <Typography
                variant="h3"
                sx={{
                  color: ink,
                  mt: 0.75,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 0,
                  overflowWrap: "anywhere",
                }}
              >
                {opt.headline}
              </Typography>

              {opt.bullets.length > 0 && (
                <Box
                  sx={{
                    mt: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                  }}
                >
                  {opt.bullets.map((b, j) => (
                    <MotionBox
                      key={b}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={t({ ...springSoft, delay: step(i + j + 2) })}
                      sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", minWidth: 0 }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          mt: "7px",
                          flexShrink: 0,
                          borderRadius: "var(--radius-pill)",
                          backgroundColor: color,
                        }}
                        aria-hidden
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", minWidth: 0, overflowWrap: "anywhere" }}
                      >
                        {b}
                      </Typography>
                    </MotionBox>
                  ))}
                </Box>
              )}

              {onAsk && (
                <Box sx={{ mt: 2 }}>
                  <AskPill
                    label={featured ? "Ir por este camino" : "Ver cómo sería"}
                    question={pathQuestion(opt)}
                    onAsk={onAsk}
                    variant={featured ? "red" : "paper"}
                  />
                </Box>
              )}
            </MotionBox>
          );
        })}
      </Stagger>
    </WidgetShell>
  );
}
