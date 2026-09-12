import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { TOKENS } from "../../app/theme";
import { heroGradient, imageUrl } from "../format";
import { AskPill } from "./bits";
import {
  Label,
  MotionBox,
  Stagger,
  spring,
  springSoft,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
} from "./shell";

/**
 * La ficha de un lugar, un auto o una casa: foto, los tres datos que deciden,
 * el porqué y el plan Banorte. La foto es un lujo; el gradiente es el piso.
 */
export function DestinationWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["destination"];
  onAsk?: (q: string) => void;
}) {
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

  return (
    <WidgetShell pad={0} sx={{ overflow: "hidden" }}>
      <Box sx={{ position: "relative", height: 190, backgroundImage: gradient }}>
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: photo ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: photo ? `url(${photo})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: TOKENS.scrimMedia,
          }}
          aria-hidden
        />

        {props.kicker && (
          <MotionBox
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.12 }}
            className="liquid-glass"
            sx={{ position: "absolute", top: 12, left: 12, px: 1.5, py: 0.5, borderRadius: 999 }}
          >
            <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 600 }}>
              {props.kicker}
            </Typography>
          </MotionBox>
        )}

        <MotionBox
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.16 }}
          sx={{ position: "absolute", left: 16, right: 16, bottom: 14 }}
        >
          <Typography
            sx={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              color: TOKENS.onDark,
            }}
          >
            {props.title}
          </Typography>
        </MotionBox>
      </Box>

      <Stagger sx={{ px: 2.5, py: 2.25 }}>
        {props.stats.length > 0 && (
          <MotionBox variants={staggerItem} sx={{ display: "flex", mb: 2 }}>
            {props.stats.map((s, i) => (
              <Box
                key={s.label}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  pl: i === 0 ? 0 : 2,
                  borderLeft: i === 0 ? "none" : "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
                  {s.label}
                </Typography>
              </Box>
            ))}
          </MotionBox>
        )}

        {props.sections.map((sec) => (
          <MotionBox key={sec.title} variants={staggerItem} sx={{ mb: 2 }}>
            <Label>{sec.title}</Label>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              {sec.body}
            </Typography>
          </MotionBox>
        ))}

        {props.plan && (
          <MotionBox
            variants={staggerItem}
            sx={{
              borderRadius: "var(--radius-m)",
              p: 2,
              backgroundColor: TOKENS.ink,
              boxShadow: TOKENS.glossInk,
            }}
          >
            <Label dark>{props.plan.label}</Label>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <Typography variant="h5" sx={{ color: TOKENS.onDark, flex: 1, minWidth: 0 }}>
                {props.plan.value}
              </Typography>
              {props.plan.badge && (
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: "var(--radius-pill)",
                    flexShrink: 0,
                    backgroundColor: TOKENS.tintGood12,
                  }}
                >
                  <Typography variant="caption" sx={{ color: TOKENS.goodOnDark, fontWeight: 700 }}>
                    {props.plan.badge}
                  </Typography>
                </Box>
              )}
            </Box>
            {props.plan.note && (
              <Typography variant="body2" sx={{ color: TOKENS.onDarkDim, mt: 0.75 }}>
                {props.plan.note}
              </Typography>
            )}
          </MotionBox>
        )}

        {props.ask && (
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSoft, delay: 0.3 }}
            sx={{ mt: 2 }}
          >
            <AskPill label={props.ask.label} question={props.ask.ask} onAsk={onAsk} />
          </MotionBox>
        )}
      </Stagger>
    </WidgetShell>
  );
}
