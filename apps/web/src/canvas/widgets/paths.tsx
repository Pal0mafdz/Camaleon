import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { Check } from "lucide-react";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import { toneColor } from "../format";
import { MotionBox, Stagger, spring, staggerItem, WidgetTitle } from "./shell";

/**
 * 2-4 caminos comparables. Tocar uno lo expande y colapsa los demás:
 * decidir se siente como elegir, no como leer una tabla.
 */
export function PathsWidget({ props }: { props: WidgetProps["paths"] }) {
  const theme = useTheme();
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <Box>
      <WidgetTitle>{props.title}</WidgetTitle>
      <Stagger sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {props.options.map((opt, i) => {
          const color = toneColor(opt.tone, theme);
          const active = picked === i;
          return (
            <MotionBox
              key={opt.label}
              layout
              variants={staggerItem}
              whileTap={{ scale: 0.985 }}
              onTap={() => setPicked(active ? null : i)}
              transition={spring}
              className="liquid-glass"
              sx={{
                borderRadius: "var(--radius-l)",
                p: 2,
                cursor: "pointer",
                outline: active ? `1.5px solid ${color}` : "none",
                outlineOffset: -1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: "text.disabled", flex: 1 }}>
                  {opt.label}
                </Typography>
                {opt.badge && (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: "var(--radius-pill)",
                      backgroundColor: TOKENS.tintRed14,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.primary.dark, fontWeight: 700 }}
                    >
                      {opt.badge}
                    </Typography>
                  </Box>
                )}
                <MotionBox
                  animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }}
                  transition={spring}
                  sx={{ display: "grid", placeItems: "center" }}
                >
                  <Check size={16} color={color} />
                </MotionBox>
              </Box>

              <Typography variant="h4" sx={{ color, letterSpacing: "-0.02em" }}>
                {opt.headline}
              </Typography>

              <MotionBox
                layout
                initial={false}
                animate={{ height: active ? "auto" : 0, opacity: active ? 1 : 0 }}
                transition={spring}
                sx={{ overflow: "hidden" }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, pt: 1.25 }}>
                  {opt.bullets.map((b) => (
                    <Box key={b} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <Box
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          backgroundColor: color,
                          mt: 0.9,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {b}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </MotionBox>
            </MotionBox>
          );
        })}
      </Stagger>
    </Box>
  );
}
