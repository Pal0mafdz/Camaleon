import { type MotionValue, useTransform } from "motion/react";
import { TOKENS } from "../app/theme";
import { MotionBox, springSoft, useMotionPrefs } from "./widgets/shell";

/** Alto de la luz por debajo del header. */
export const BAND_DROP = 140;

/**
 * Luz de la mesa: la tarjeta se mira bajo luz de día. Una luz blanca difusa
 * arriba de la mesa laminada, detrás del contenido y dentro del scroller, así
 * que se va con el scroll (parallax a media velocidad). Es lo que hace que la
 * tarjeta roja se vea repartida SOBRE algo y no flotando en un color plano.
 */
export function TableLight({ scrollY }: { scrollY: MotionValue<number> }) {
  const { t } = useMotionPrefs();
  // Parallax: la luz sube a la mitad de la velocidad del contenido.
  const y = useTransform(scrollY, (v) => v * -0.5);

  return (
    <MotionBox
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={t(springSoft)}
      style={{ y }}
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: `calc(var(--header-h) + ${BAND_DROP}px)`,
        pointerEvents: "none",
        zIndex: 0,
        background: `radial-gradient(90% 100% at 30% 0%, ${TOKENS.card} 0%, transparent 70%)`,
      }}
    />
  );
}

/** @deprecated alias histórico. */
export const BrandBand = TableLight;
