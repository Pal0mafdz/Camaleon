import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { EASE_OUT, TOKENS } from "../../app/theme";
import { heroGradient, imageUrl } from "../format";
import { AskPill, TonePill } from "./bits";
import {
  Label,
  MotionBox,
  Stagger,
  spring,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
} from "./shell";

/**
 * La ficha de un lugar, un auto o una casa: foto, los tres datos que deciden,
 * el porqué y el plan Banorte.
 *
 * Composición: la cifra protagonista es el plan (`$7,412/mes`), que va en rojo
 * profundo sobre papel —no en otra tarjeta oscura: el lienzo solo tiene un
 * lingote—; los stats son el dato de apoyo; la acción es la pregunta al agente.
 */
export function DestinationWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["destination"];
  onAsk?: (q: string) => void;
}) {
  const { t, step } = useMotionPrefs();
  const gradient = heroGradient(props.imageQuery);
  const [photo, setPhoto] = useState<string | null>(null);

  // Mismo patrón que el hero: la imagen remota se monta solo si carga.
  useEffect(() => {
    let alive = true;
    const url = imageUrl(props.imageQuery);
    const img = new Image();
    img.onload = () => {
      if (alive) setPhoto(url);
    };
    img.src = url;
    return () => {
      alive = false;
      img.onload = null;
    };
  }, [props.imageQuery]);

  const hasBody =
    props.stats.length > 0 ||
    props.sections.length > 0 ||
    Boolean(props.plan) ||
    Boolean(props.ask);

  return (
    <WidgetShell pad={0} sx={{ overflow: "hidden" }}>
      <Box sx={{ position: "relative", height: 190, backgroundImage: gradient }}>
        <MotionBox
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: photo ? 1 : 0, scale: photo ? 1 : 1.06 }}
          transition={t({ duration: 0.6, ease: EASE_OUT })}
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: photo ? `url(${photo})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <Box sx={{ position: "absolute", inset: 0, background: TOKENS.scrimMedia }} aria-hidden />

        {props.kicker && (
          <MotionBox
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t({ ...spring, delay: step(2) })}
            className="liquid-glass"
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              maxWidth: "calc(100% - 24px)",
              px: 1.5,
              py: 0.5,
              borderRadius: "var(--radius-pill)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: "text.primary",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {props.kicker}
            </Typography>
          </MotionBox>
        )}

        <MotionBox
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t({ ...spring, delay: step(3) })}
          sx={{ position: "absolute", left: 16, right: 16, bottom: 14 }}
        >
          <Typography className="cover-title" sx={{ color: TOKENS.onDark }}>
            {props.title}
          </Typography>
        </MotionBox>
      </Box>

      {hasBody && (
        <Stagger sx={{ px: 2.5, pt: 2.25, pb: 2.5 }}>
          {props.stats.length > 0 && (
            <MotionBox variants={staggerItem} sx={{ display: "flex", mb: 2.25 }}>
              {props.stats.map((s, i) => (
                <Box
                  key={s.label}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    pl: i === 0 ? 0 : 1.5,
                    pr: 1,
                    borderLeft: i === 0 ? "none" : "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {s.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.disabled", display: "block", overflowWrap: "anywhere" }}
                  >
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </MotionBox>
          )}

          {props.sections.map((sec) => (
            <MotionBox key={sec.title} variants={staggerItem} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ overflowWrap: "anywhere" }}>
                {sec.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.375, overflowWrap: "anywhere" }}
              >
                {sec.body}
              </Typography>
            </MotionBox>
          ))}

          {props.plan && (
            <MotionBox
              variants={staggerItem}
              sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}
            >
              <Label>{props.plan.label}</Label>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  columnGap: 1.25,
                  rowGap: 0.5,
                  mt: 0.5,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: TOKENS.redDeep,
                    minWidth: 0,
                    fontVariantNumeric: "tabular-nums",
                    overflowWrap: "anywhere",
                  }}
                >
                  {props.plan.value}
                </Typography>
                {props.plan.badge && <TonePill tone="good">{props.plan.badge}</TonePill>}
              </Box>
              {props.plan.note && (
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.75, overflowWrap: "anywhere" }}
                >
                  {props.plan.note}
                </Typography>
              )}
            </MotionBox>
          )}

          {props.ask && (
            <MotionBox variants={staggerItem} sx={{ mt: 2.25 }}>
              <AskPill label={props.ask.label} question={props.ask.ask} onAsk={onAsk} />
            </MotionBox>
          )}
        </Stagger>
      )}
    </WidgetShell>
  );
}
