import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { TOKENS } from "../../app/theme";
import { formatMoney, heroGradient } from "../format";
import { TonePill } from "./bits";
import { MotionBox, MotionButton, Stagger, staggerItem, WidgetShell, WidgetTitle } from "./shell";

type Item = WidgetProps["listing"]["items"][number];

const CARD_SX = {
  display: "block",
  width: "100%",
  overflow: "hidden",
  borderRadius: "var(--radius-l)",
  backgroundColor: TOKENS.card,
  // Anillo + sombra en vez de borde gris: misma profundidad que el resto del
  // catálogo, sin la línea dura que aplana la tarjeta.
  boxShadow: `${TOKENS.hairline}, ${TOKENS.elev1}`,
} as const;

/** Franja de color + cuerpo. El gradiente es determinista: el mismo auto, el mismo color. */
function CardBody({ item }: { item: Item }) {
  return (
    <>
      <Box
        sx={{
          position: "relative",
          height: 88,
          display: "flex",
          alignItems: "flex-end",
          px: 2,
          pb: 1.5,
          backgroundImage: heroGradient(item.imageQuery ?? item.title),
        }}
      >
        {/* Mismo velo que el hero: el título va en blanco sobre un gradiente
            saturado y sin él el contraste depende de qué rampa tocó. */}
        <Box sx={{ position: "absolute", inset: 0, background: TOKENS.scrimMedia }} aria-hidden />
        <Typography variant="h4" sx={{ position: "relative", color: TOKENS.onDark }}>
          {item.title}
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {item.subtitle && (
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            {item.subtitle}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {formatMoney(item.price)}
          </Typography>
          {item.monthly !== undefined && (
            <Typography variant="body2" sx={{ color: "text.secondary", flex: 1, minWidth: 0 }}>
              · {formatMoney(item.monthly)}/mes
            </Typography>
          )}
          {item.monthly === undefined && <Box sx={{ flex: 1 }} />}
          {item.tag && <TonePill tone={item.tone}>{item.tag}</TonePill>}
        </Box>
      </Box>
    </>
  );
}

/** Tarjetas comparables: precio, mensualidad y si cabe. Tocar una pregunta por ella. */
export function ListingWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["listing"];
  onAsk?: (q: string) => void;
}) {
  return (
    <WidgetShell glass={false} pad={0} sx={{ backgroundColor: "transparent" }}>
      {props.title && <WidgetTitle>{props.title}</WidgetTitle>}
      <Stagger sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {props.items.map((item) => {
          const question = item.ask;
          if (!question) {
            return (
              <MotionBox key={item.title} variants={staggerItem} sx={CARD_SX}>
                <CardBody item={item} />
              </MotionBox>
            );
          }
          return (
            <MotionButton
              key={item.title}
              type="button"
              variants={staggerItem}
              whileTap={{ scale: 0.985 }}
              onClick={() => onAsk?.(question)}
              sx={CARD_SX}
            >
              <CardBody item={item} />
            </MotionButton>
          );
        })}
      </Stagger>
    </WidgetShell>
  );
}
