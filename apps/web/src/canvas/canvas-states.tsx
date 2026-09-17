import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Sparkles } from "lucide-react";
import { EASE_IOS, TOKENS } from "../app/theme";
import { MotionBox, spring, springSoft, useMotionPrefs } from "./widgets/shell";

/**
 * Los tres estados del lienzo que NO son widgets: cómo abre, cómo espera y
 * cómo avisa que sigue trabajando. Viven juntos porque comparten la misma
 * regla: ninguno deja la pantalla en blanco ni un solo segundo.
 */

export function EmptyState({ greeting }: { greeting: string }) {
  const { t, step } = useMotionPrefs();

  return (
    <MotionBox
      className="paper lacquer"
      initial={{ opacity: 0, y: 28, rotateZ: -1.5, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, rotateZ: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
      transition={t(springSoft)}
      sx={{ borderRadius: "var(--radius-l)", p: 2.5, pt: 3, pb: 3, transformOrigin: "50% 100%" }}
    >
      {[
        <Typography key="greeting" variant="h2" component="h1" sx={{ overflowWrap: "anywhere" }}>
          {greeting}
        </Typography>,
        <Typography key="ask" variant="h2" component="p" sx={{ color: "text.secondary" }}>
          ¿qué quieres lograr?
        </Typography>,
        <Typography
          key="body"
          variant="body1"
          sx={{ color: "text.secondary", mt: 2, maxWidth: "34ch" }}
        >
          Esta app no tiene pantallas. Se construye sola, con tu dinero y tu pregunta.
        </Typography>,
      ].map((line, i) => (
        <MotionBox
          key={line.key}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={t({ ...springSoft, delay: 0.12 + step(i) * 2 })}
        >
          {line}
        </MotionBox>
      ))}
    </MotionBox>
  );
}

/**
 * Lo que se ve mientras el agente arma el primer lienzo. Sin esto la app abre
 * en blanco y se siente rota justo en el primer segundo, que es el que decide.
 *
 * No son tarjetas falsas: son HUECOS en la mesa (`--surface-sunken`) con la
 * silueta real del inicio —tarjeta roja, salud, gasto— que las tarjetas van a
 * cubrir al repartirse. El primero es el sitio de la tarjeta roja: respira en
 * granate diluido, más lento y más hondo.
 */
export function BootSkeleton() {
  const { reduced, t } = useMotionPrefs();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }} aria-hidden>
      {[
        { h: 236, ingot: true },
        { h: 132, ingot: false },
        { h: 108, ingot: false },
      ].map(({ h, ingot }, i) => (
        <MotionBox
          key={h}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985 }}
          transition={t({ ...springSoft, delay: TOKENS.stagger * i })}
          sx={{
            height: h,
            borderRadius: "var(--radius-l)",
            position: "relative",
            overflow: "hidden",
            backgroundColor: ingot ? TOKENS.tintRed8 : TOKENS.sunken,
            boxShadow: `inset 0 1px 2px ${TOKENS.tintInk5}`,
          }}
        >
          {!reduced && (
            <MotionBox
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: ingot ? 2.2 : 1.6,
                delay: 0.12 * i,
                ease: EASE_IOS,
              }}
              sx={{
                position: "absolute",
                inset: 0,
                backgroundColor: ingot ? TOKENS.tintRed14 : TOKENS.well,
              }}
            />
          )}
        </MotionBox>
      ))}
    </Box>
  );
}

export function StatusPill({ label }: { label: string }) {
  const { t, loop, reduced } = useMotionPrefs();
  const pulse = reduced
    ? undefined
    : { repeat: Number.POSITIVE_INFINITY, duration: 1.6, ease: EASE_IOS };

  return (
    <MotionBox
      layout="position"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={t(spring)}
      className="paper"
      sx={{
        alignSelf: "flex-start",
        borderRadius: "var(--radius-s)",
        px: 1.75,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <MotionBox
        animate={loop({ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] })}
        transition={pulse}
        sx={{ display: "grid", placeItems: "center", color: "primary.main" }}
      >
        <Sparkles size={14} />
      </MotionBox>
      <MotionBox animate={loop({ opacity: [0.55, 1, 0.55] })} transition={pulse}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {label}
        </Typography>
      </MotionBox>
    </MotionBox>
  );
}

/** Aviso de error del turno. Rojo solo aquí: es lo único que salió mal. */
export function CanvasError({ message }: { message: string }) {
  const { t } = useMotionPrefs();

  return (
    <MotionBox
      role="alert"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={t(springSoft)}
      sx={{
        borderRadius: "var(--radius-l)",
        p: 2,
        backgroundColor: TOKENS.card,
        boxShadow: `${TOKENS.glossLight}, inset 0 0 0 1.5px ${TOKENS.tintRed32}, ${TOKENS.elev1}`,
      }}
    >
      <Typography
        variant="h6"
        component="p"
        sx={{ color: TOKENS.badInk, overflowWrap: "anywhere" }}
      >
        {message}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
        Vuelve a preguntar; si sigue pasando, revisa tu conexión.
      </Typography>
    </MotionBox>
  );
}
