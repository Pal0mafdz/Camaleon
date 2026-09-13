import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import { type ReactNode, type RefObject, useId } from "react";
import { TOKENS } from "../app/theme";
import { MotionBox, MotionButton, spring, useMotionPrefs } from "../canvas/widgets/shell";

/**
 * Controles de las pantallas de lista.
 *
 * Mismo material que el lienzo: pastilla de ancho completo con el icono
 * anidado en su propio círculo, acciones secundarias siempre neutras y rojo
 * reservado para lo que compromete al usuario. Todo valor sale de `TOKENS`.
 */

/**
 * Acción principal. El disco avanza al presionar: afordancia, no adorno.
 * Mientras trabaja, el disco se convierte en el anillo de trabajo del sistema
 * (`spin-ring`), que se apaga con movimiento reducido.
 */
export function PillButton({
  label,
  onClick,
  icon,
  disabled = false,
  busy = false,
  type = "button",
}: {
  label: string;
  onClick?: () => void;
  icon: ReactNode;
  disabled?: boolean;
  busy?: boolean;
  type?: "button" | "submit";
}) {
  const { t, loop, reduced } = useMotionPrefs();
  const inert = disabled || busy;

  return (
    <MotionButton
      type={type}
      onClick={onClick}
      disabled={inert}
      aria-busy={busy || undefined}
      whileTap={inert ? undefined : { scale: 0.975 }}
      transition={t(spring)}
      initial="rest"
      whileHover={inert ? undefined : "press"}
      whileFocus={inert ? undefined : "press"}
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
        cursor: inert ? "default" : "pointer",
        transition: "background-color var(--dur-standard) var(--ease-ios)",
        backgroundColor: disabled ? TOKENS.well : TOKENS.red,
        boxShadow: disabled ? "none" : TOKENS.elev1,
        "&:hover": inert ? undefined : { backgroundColor: TOKENS.redDeep },
      }}
    >
      <Typography
        variant="button"
        sx={{
          color: disabled ? TOKENS.inkFaint : TOKENS.onDark,
          flex: 1,
          textAlign: "left",
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {label}
      </Typography>
      <MotionBox
        variants={{ rest: { x: 0 }, press: { x: 3 } }}
        transition={t(spring)}
        sx={{
          position: "relative",
          width: 32,
          height: 32,
          borderRadius: "var(--radius-pill)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          overflow: "hidden",
          color: disabled ? TOKENS.inkFaint : TOKENS.onDark,
          backgroundColor: disabled ? "transparent" : TOKENS.tintWhite14,
        }}
      >
        {busy && (
          <MotionBox
            aria-hidden
            className="spin-ring"
            animate={loop({ rotate: 360 })}
            transition={
              reduced
                ? { duration: 0 }
                : { repeat: Number.POSITIVE_INFINITY, duration: 1.4, ease: "linear" }
            }
            sx={{ position: "absolute", inset: 0, borderRadius: "var(--radius-pill)" }}
          />
        )}
        <MotionBox
          animate={{ opacity: busy ? 0 : 1, scale: busy ? 0.6 : 1 }}
          transition={t(spring)}
          sx={{ display: "grid", placeItems: "center" }}
        >
          {icon}
        </MotionBox>
      </MotionBox>
    </MotionButton>
  );
}

/** Acción secundaria dentro de una tarjeta: pastilla hundida en la arena, nunca roja. */
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
      aria-busy={busy || undefined}
      whileTap={busy ? undefined : { scale: 0.96 }}
      animate={{ opacity: busy ? 0.55 : 1 }}
      transition={t(spring)}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
        flex: 1,
        minWidth: 0,
        minHeight: "var(--tap-min)",
        px: 1.5,
        borderRadius: "var(--radius-pill)",
        color: "text.primary",
        backgroundColor: TOKENS.sunken,
        cursor: busy ? "default" : "pointer",
        transition: "background-color var(--dur-micro) var(--ease-ios)",
        "&:hover": busy ? undefined : { backgroundColor: TOKENS.well },
      }}
    >
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
        {label}
      </Typography>
    </MotionButton>
  );
}

/**
 * Campo de formulario: rótulo sobre un carril hundido en la arena.
 *
 * El foco es un anillo de marca sobre el carril completo (no sobre el `input`
 * desnudo de dentro). El error nombra el problema debajo, en rojo AA, y queda
 * ligado al campo por `aria-describedby`, así el lector de pantalla lo lee al
 * entrar. Con error, el carril mismo se marca en rojo: el ojo llega antes.
 */
export function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  numeric = false,
  type = "text",
  error,
  hint,
  inputRef,
  enterKeyHint = "next",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  placeholder: string;
  numeric?: boolean;
  type?: "text" | "password" | "email";
  /** Mensaje que nombra el problema. Si existe, el campo es inválido. */
  error?: string | null;
  /** Dato de apoyo bajo el campo cuando no hay error. */
  hint?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  enterKeyHint?: "next" | "done";
  maxLength?: number;
}) {
  const { t } = useMotionPrefs();
  const id = useId();
  const messageId = `${id}-msg`;
  const message = error ?? hint;

  return (
    <Box>
      <Typography
        component="label"
        htmlFor={id}
        variant="overline"
        sx={{ display: "block", color: error ? TOKENS.badInk : "text.disabled", mb: 0.5 }}
      >
        {label}
      </Typography>
      <InputBase
        id={id}
        inputRef={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        error={Boolean(error)}
        inputProps={{
          inputMode: numeric ? "decimal" : "text",
          enterKeyHint,
          autoComplete: type === "password" ? "current-password" : "off",
          maxLength,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": message ? messageId : undefined,
        }}
        sx={{
          width: "100%",
          px: 1.75,
          borderRadius: "var(--radius-s)",
          typography: "body1",
          color: "text.primary",
          backgroundColor: TOKENS.sunken,
          boxShadow: error ? `inset 0 0 0 1.5px ${TOKENS.tintRed32}` : "none",
          transition: "box-shadow var(--dur-micro) var(--ease-ios)",
          fontVariantNumeric: numeric ? "tabular-nums" : "normal",
          "&.Mui-focused": { boxShadow: TOKENS.focusRing },
          "& input": { padding: 0, minHeight: "var(--tap-min)" },
          "& input:focus-visible": { boxShadow: "none" },
          "& input::placeholder": { color: "text.disabled", opacity: 1 },
        }}
      />
      {message && (
        <MotionBox
          key={error ? "error" : "hint"}
          id={messageId}
          role={error ? "alert" : undefined}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(spring)}
          sx={{ mt: 0.75, px: 0.25 }}
        >
          <Typography
            variant="caption"
            sx={{ color: error ? TOKENS.badInk : "text.secondary", overflowWrap: "anywhere" }}
          >
            {message}
          </Typography>
        </MotionBox>
      )}
    </Box>
  );
}
