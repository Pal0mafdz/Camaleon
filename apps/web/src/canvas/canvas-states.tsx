import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Sparkles } from "lucide-react";
import { TOKENS } from "../app/theme";
import { MotionBox, spring, springSoft, useMotionPrefs } from "./widgets/shell";

/**
 * Los tres estados del lienzo que NO son widgets: cómo abre, cómo espera y
 * cómo avisa que sigue trabajando. Viven juntos porque comparten la misma
 * regla: ninguno deja la pantalla en blanco ni un solo segundo.
 */

export function EmptyState({ greeting }: { greeting: string }) {
  const { t } = useMotionPrefs();

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={t({ ...springSoft, delay: 0.1 })}
      sx={{ pt: 5, px: 0.5 }}
    >
      <Typography variant="h1" component="h1">
        {greeting}
      </Typography>
      <Typography variant="h1" component="p" sx={{ color: "text.secondary" }}>
        ¿qué quieres lograr?
      </Typography>
      <Typography variant="body1" sx={{ color: "text.disabled", mt: 2.5, maxWidth: "30ch" }}>
        Esta app no tiene pantallas. Se construye sola, con tu dinero y tu pregunta.
      </Typography>
    </MotionBox>
  );
}

/**
 * Lo que se ve mientras el agente arma el primer lienzo. Sin esto la app abre
 * en blanco y se siente rota justo en el primer segundo, que es el que decide.
 * Las alturas imitan la silueta real del inicio: saldo grande, salud, gasto.
 */
export function BootSkeleton() {
  const { reduced, t } = useMotionPrefs();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }} aria-hidden>
      {[190, 132, 108].map((h, i) => (
        <MotionBox
          key={h}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t({ ...springSoft, delay: 0.06 * i })}
          sx={{
            height: h,
            borderRadius: "var(--radius-l)",
            position: "relative",
            overflow: "hidden",
            backgroundColor: TOKENS.card,
            boxShadow: `${TOKENS.hairline}, ${TOKENS.elev1}`,
          }}
        >
          {!reduced && (
            <MotionBox
              initial={{ x: "-120%" }}
              animate={{ x: "120%" }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 1.6,
                delay: 0.12 * i,
                ease: "easeInOut",
              }}
              sx={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(100deg, transparent 20%, ${TOKENS.tintInk5} 50%, transparent 80%)`,
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
  const pulse = reduced ? undefined : { repeat: Number.POSITIVE_INFINITY, duration: 1.6 };

  return (
    <MotionBox
      layout
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={t(spring)}
      sx={{
        alignSelf: "flex-start",
        borderRadius: "var(--radius-pill)",
        px: 1.75,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        backgroundColor: TOKENS.card,
        boxShadow: `${TOKENS.hairline}, ${TOKENS.elev1}`,
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
        boxShadow: `inset 0 0 0 1px ${TOKENS.tintRed32}, ${TOKENS.elev1}`,
      }}
    >
      <Typography variant="body2" sx={{ color: TOKENS.badInk }}>
        {message}
      </Typography>
    </MotionBox>
  );
}
