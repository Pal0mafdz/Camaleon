import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { TOKENS } from "../app/theme";
import { MotionBox, MotionButton, spring, useMotionPrefs } from "../canvas/widgets/shell";

/**
 * Controles de las pantallas de lista.
 *
 * Mismo material que el lienzo: pastilla de ancho completo con el icono
 * anidado en su propio círculo, acciones secundarias siempre neutras y rojo
 * reservado para lo que compromete al usuario. Todo valor sale de `TOKENS`.
 */

/** Acción principal. El disco avanza al presionar: afordancia, no adorno. */
export function PillButton({
  label,
  onClick,
  icon,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  disabled?: boolean;
}) {
  const { t } = useMotionPrefs();

  return (
    <MotionButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.975 }}
      transition={t(spring)}
      initial="rest"
      whileHover={disabled ? undefined : "press"}
      whileFocus={disabled ? undefined : "press"}
      animate="rest"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        width: "100%",
        minHeight: "var(--tap-min)",
        pl: 2.5,
        pr: 0.75,
        py: 0.75,
        borderRadius: "var(--radius-pill)",
        cursor: disabled ? "default" : "pointer",
        transition: "background-color var(--dur-standard) var(--ease-ios)",
        backgroundColor: disabled ? TOKENS.tintInk8 : TOKENS.red,
        boxShadow: disabled ? "none" : TOKENS.elev1,
      }}
    >
      <Typography
        variant="button"
        sx={{ color: disabled ? TOKENS.inkFaint : TOKENS.onDark, flex: 1, textAlign: "left" }}
      >
        {label}
      </Typography>
      <MotionBox
        variants={{ rest: { x: 0 }, press: { x: 3 } }}
        transition={t(spring)}
        sx={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-pill)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: disabled ? TOKENS.inkFaint : TOKENS.onDark,
          backgroundColor: disabled ? "transparent" : TOKENS.tintWhite14,
        }}
      >
        {icon}
      </MotionBox>
    </MotionButton>
  );
}

/** Acción secundaria dentro de una tarjeta: pastilla teñida, nunca roja. */
export function GhostButton({
  label,
  onClick,
  icon,
  busy = false,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  busy?: boolean;
}) {
  const { t } = useMotionPrefs();

  return (
    <MotionButton
      type="button"
      onClick={onClick}
      disabled={busy}
      whileTap={busy ? undefined : { scale: 0.96 }}
      transition={t(spring)}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
        flex: 1,
        minHeight: "var(--tap-min)",
        px: 1.5,
        borderRadius: "var(--radius-pill)",
        color: busy ? "text.disabled" : "text.primary",
        backgroundColor: TOKENS.tintInk8,
        opacity: busy ? 0.6 : 1,
        cursor: busy ? "default" : "pointer",
      }}
    >
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
    </MotionButton>
  );
}

/** Campo de formulario: rótulo en versalitas sobre un carril hundido. */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  numeric?: boolean;
  type?: "text" | "password" | "email";
}) {
  return (
    <Box>
      <Typography variant="overline" sx={{ display: "block", color: "text.disabled", mb: 0.5 }}>
        {label}
      </Typography>
      <InputBase
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputProps={{
          "aria-label": label,
          inputMode: numeric ? "numeric" : "text",
          enterKeyHint: "next",
          autoComplete: type === "password" ? "current-password" : "off",
        }}
        sx={{
          width: "100%",
          px: 1.75,
          borderRadius: "var(--radius-s)",
          fontSize: 15,
          color: "text.primary",
          backgroundColor: TOKENS.sunken,
          fontVariantNumeric: numeric ? "tabular-nums" : "normal",
          "& input": { padding: 0, minHeight: "var(--tap-min)" },
          "& input::placeholder": { color: "text.disabled", opacity: 1 },
        }}
      />
    </Box>
  );
}
