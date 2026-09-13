import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { EASE_OUT, TOKENS } from "../../app/theme";
import { formatMoney, heroGradient, imageUrl } from "../format";
import { TonePill } from "./bits";
import {
  MotionBox,
  MotionButton,
  Stagger,
  spring,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
  WidgetTitle,
} from "./shell";

type Item = WidgetProps["listing"]["items"][number];

const PHOTO_H = 132;

/**
 * Foto (o su rampa de respaldo) con el título encima y, debajo, una franja
 * fina con la MISMA rampa: es lo que ata la tarjeta a su imagen aunque la
 * foto tarde en llegar o no llegue.
 */
function Photo({ item }: { item: Item }) {
  const { t } = useMotionPrefs();
  const query = item.imageQuery ?? item.title;
  const gradient = heroGradient(query);
  const [photo, setPhoto] = useState<string | null>(null);

  // Mismo patrón que el hero: la imagen remota se monta solo si carga.
  useEffect(() => {
    let alive = true;
    const url = imageUrl(query, 800, 400);
    const img = new Image();
    img.onload = () => {
      if (alive) setPhoto(url);
    };
    img.src = url;
    return () => {
      alive = false;
      img.onload = null;
    };
  }, [query]);

  return (
    <>
      <Box sx={{ position: "relative", height: PHOTO_H, backgroundImage: gradient }}>
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
        {/* Mismo velo que el hero: el título va en blanco sobre foto o rampa
            saturada y sin él el contraste depende de qué imagen tocó. */}
        <Box sx={{ position: "absolute", inset: 0, background: TOKENS.scrimMedia }} aria-hidden />
        <Box sx={{ position: "absolute", left: 16, right: 16, bottom: 12 }}>
          <Typography
            variant="h4"
            sx={{ color: TOKENS.onDark, overflowWrap: "anywhere", textAlign: "left" }}
          >
            {item.title}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ height: 4, backgroundImage: gradient }} aria-hidden />
    </>
  );
}

/**
 * Cuerpo: precio protagonista, mensualidad de apoyo y la etiqueta de si cabe.
 * Si la tarjeta pregunta al agente, la flecha en su disco lo declara.
 */
function Body({ item, tappable, hot }: { item: Item; tappable: boolean; hot: boolean }) {
  const { t } = useMotionPrefs();
  return (
    <Box sx={{ p: 2, pt: 1.75, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {item.subtitle && (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 0.75, overflowWrap: "anywhere" }}
          >
            {item.subtitle}
          </Typography>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            flexWrap: "wrap",
            columnGap: 1,
            rowGap: 0.25,
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontVariantNumeric: "tabular-nums", minWidth: 0, overflowWrap: "anywhere" }}
          >
            {formatMoney(item.price)}
          </Typography>
          {item.monthly !== undefined && (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                overflowWrap: "anywhere",
              }}
            >
              {formatMoney(item.monthly)}/mes
            </Typography>
          )}
        </Box>
        {item.tag && (
          <Box sx={{ display: "flex", mt: 1 }}>
            <TonePill tone={item.tone}>{item.tag}</TonePill>
          </Box>
        )}
      </Box>

      {tappable && (
        <MotionBox
          initial={false}
          animate={{ x: hot ? 3 : 0 }}
          transition={t(spring)}
          sx={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-pill)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: TOKENS.onDark,
            backgroundColor: TOKENS.ink,
          }}
          aria-hidden
        >
          <ArrowRight size={16} strokeWidth={2.4} />
        </MotionBox>
      )}
    </Box>
  );
}

const CARD_SX = {
  display: "block",
  width: "100%",
  overflow: "hidden",
  borderRadius: "var(--radius-l)",
  textAlign: "left",
} as const;

/**
 * Tarjetas comparables: precio, mensualidad y si cabe. Entran en escalera
 * (`Stagger`) y tocar una pregunta por ella. El shell va `bare`: cada tarjeta
 * es su propio papel sobre el lienzo, nada anidado.
 */
export function ListingWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["listing"];
  onAsk?: (q: string) => void;
}) {
  const { t } = useMotionPrefs();
  const [hot, setHot] = useState<string | null>(null);

  return (
    <WidgetShell variant="bare" pad={0}>
      {props.title && <WidgetTitle>{props.title}</WidgetTitle>}
      <Stagger sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {props.items.map((item) => {
          const question = item.ask;
          if (!question || !onAsk) {
            return (
              <MotionBox key={item.title} variants={staggerItem} className="paper" sx={CARD_SX}>
                <Photo item={item} />
                <Body item={item} tappable={false} hot={false} />
              </MotionBox>
            );
          }
          return (
            <MotionButton
              key={item.title}
              type="button"
              variants={staggerItem}
              whileTap={{ scale: 0.985 }}
              transition={t(spring)}
              onClick={() => onAsk(question)}
              onHoverStart={() => setHot(item.title)}
              onHoverEnd={() => setHot((v) => (v === item.title ? null : v))}
              onFocus={() => setHot(item.title)}
              onBlur={() => setHot((v) => (v === item.title ? null : v))}
              className="paper"
              sx={CARD_SX}
            >
              <Photo item={item} />
              <Body item={item} tappable hot={hot === item.title} />
            </MotionButton>
          );
        })}
      </Stagger>
    </WidgetShell>
  );
}
