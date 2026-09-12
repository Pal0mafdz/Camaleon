import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { TOKENS } from "../../app/theme";
import { formatMoney } from "../format";
import { Label, MotionBox, RollingNumber, springSoft, useMotionPrefs, WidgetShell } from "./shell";

/**
 * El widget que responde "¿me alcanza?".
 * Barra con dos segmentos: lo que ya tienes vs. lo que falta.
 */
export function GapWidget({ props }: { props: WidgetProps["gap"] }) {
  const theme = useTheme();
  const { t } = useMotionPrefs();
  const missing = Math.max(props.target - props.current, 0);
  const covered = Math.min(props.current / Math.max(props.target, 1), 1);
  const enough = missing === 0;
  const perMonth =
    props.deadlineMonths && props.deadlineMonths > 0 ? missing / props.deadlineMonths : null;

  return (
    <WidgetShell>
      <Label>{props.title}</Label>

      <RollingNumber
        value={missing}
        format={(n) => formatMoney(n)}
        variant="h2"
        sx={{
          color: enough ? theme.palette.success.main : theme.palette.primary.main,
          mt: 0.5,
          mb: 2,
        }}
      />

      <Box
        sx={{
          height: 10,
          borderRadius: "var(--radius-pill)",
          overflow: "hidden",
          // Carril hundido: el gradiente de progreso encima es lo que brilla.
          backgroundColor: TOKENS.tintInk8,
        }}
      >
        <MotionBox
          initial={{ scaleX: 0 }}
          animate={{ scaleX: covered }}
          transition={t({ ...springSoft, delay: 0.12 })}
          sx={{
            height: "100%",
            transformOrigin: "left",
            background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
          }}
        />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.25 }}>
        <Box>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            Ya tienes
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatMoney(props.current)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" sx={{ color: "text.disabled", display: "block" }}>
            Necesitas
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatMoney(props.target)}
          </Typography>
        </Box>
      </Box>

      {(props.caption || perMonth) && (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5 }}>
          {props.caption ??
            `Son ${formatMoney(perMonth ?? 0)} al mes durante ${props.deadlineMonths} meses.`}
        </Typography>
      )}
    </WidgetShell>
  );
}
