import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import { ArrowUp, Mic, Square } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { TOKENS } from "../app/theme";
import { MotionButton, MotionForm, spring, TapTarget, useMotionPrefs } from "./widgets/shell";

// ─── Web Speech API (tipado mínimo: lib.dom aún no lo incluye) ───────────────

type SpeechResult = { transcript: string };
type SpeechEvent = {
  resultIndex: number;
  results: { length: number; isFinal: boolean; 0: SpeechResult }[];
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ─── Barra de comandos ──────────────────────────────────────────────────────

/**
 * Barra flotante anclada al pulgar. Vive FUERA del contenedor que scrollea, así
 * que es de las tres superficies que pueden permitirse `backdrop-filter`.
 *
 * El teclado virtual lo resuelve el viewport (`interactive-widget=resizes-content`
 * en index.html) más la altura en `dvb` del shell: la barra sube con el teclado
 * en vez de quedar tapada.
 */
export function CommandBar({
  onAsk,
  busy,
  onStop,
  placeholder = "Pregúntame lo que sea…",
}: {
  onAsk: (q: string) => void;
  busy: boolean;
  onStop: () => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const supportsVoice = useRef(getRecognitionCtor() !== null).current;
  const { t, loop, reduced } = useMotionPrefs();
  const ready = text.trim().length > 0;

  useEffect(() => () => recRef.current?.stop(), []);

  function toggleVoice() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = "es-MX";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let heard = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        heard += e.results[i][0].transcript;
      }
      setText(heard);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recRef.current = rec;
    rec.start();
    setListening(true);
    navigator.vibrate?.(8);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    recRef.current?.stop();
    setText("");
    navigator.vibrate?.(10);
    onAsk(q);
  }

  return (
    <MotionForm
      onSubmit={submit}
      layout
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={t({ ...spring, delay: 0.2 })}
      className="liquid-glass-solid"
      sx={{
        position: "absolute",
        left: "calc(var(--gutter) + var(--safe-left))",
        right: "calc(var(--gutter) + var(--safe-right))",
        bottom: "calc(var(--gutter) + var(--safe-bottom) + var(--dock-offset))",
        zIndex: 30,
        borderRadius: "var(--radius-pill)",
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        pl: 0.75,
        pr: 0.75,
        py: 0.75,
        // El anillo de foco se pinta en la barra completa, no en el input:
        // el campo no tiene borde propio y el usuario debe ver dónde escribe.
        transition: "box-shadow var(--dur-standard) var(--ease-ios)",
        "&:focus-within": {
          boxShadow: `${TOKENS.hairline}, ${TOKENS.elev3}, 0 0 0 3px ${TOKENS.tintRed32}`,
        },
      }}
    >
      {supportsVoice && (
        <MotionButton
          type="button"
          onClick={toggleVoice}
          whileTap={{ scale: 0.9 }}
          animate={loop(listening ? { scale: [1, 1.12, 1] } : { scale: 1 })}
          transition={
            listening && !reduced ? { repeat: Number.POSITIVE_INFINITY, duration: 1.1 } : t(spring)
          }
          aria-label={listening ? "Detener dictado" : "Dictar"}
          aria-pressed={listening}
          sx={{
            ...TapTarget,
            borderRadius: "var(--radius-pill)",
            color: listening ? "primary.main" : "text.disabled",
            backgroundColor: listening ? TOKENS.tintRed8 : "transparent",
          }}
        >
          <Mic size={19} />
        </MotionButton>
      )}

      <InputBase
        name="pregunta"
        id="camaleon-pregunta"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={listening ? "Te escucho…" : placeholder}
        inputProps={{
          "aria-label": "Pregunta para el asesor",
          enterKeyHint: "send",
          autoComplete: "off",
        }}
        sx={{
          flex: 1,
          minWidth: 0,
          pl: supportsVoice ? 0.5 : 1.5,
          fontSize: 15,
          color: "text.primary",
          // El campo en sí también es un objetivo táctil: si solo mide el alto
          // de la línea, tocar un par de píxeles arriba del texto no enfoca.
          "& input": { padding: 0, minHeight: "var(--tap-min)" },
          "& input::placeholder": { color: "text.disabled", opacity: 1 },
        }}
      />

      <AnimatePresence mode="popLayout" initial={false}>
        {busy ? (
          <MotionButton
            key="stop"
            type="button"
            onClick={onStop}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={t(spring)}
            aria-label="Detener"
            sx={{
              ...TapTarget,
              borderRadius: "var(--radius-pill)",
              // Neutral a propósito: detener es el contrapeso del botón rojo.
              backgroundColor: TOKENS.tintInk8,
              color: "text.primary",
            }}
          >
            <Square size={14} fill="currentColor" />
          </MotionButton>
        ) : (
          <MotionButton
            key="send"
            type="submit"
            disabled={!ready}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            whileTap={ready ? { scale: 0.9 } : undefined}
            transition={t(spring)}
            aria-label="Enviar"
            sx={{
              ...TapTarget,
              borderRadius: "var(--radius-pill)",
              cursor: ready ? "pointer" : "default",
              transition: "background-color var(--dur-standard) var(--ease-ios)",
              // El área tocable NO cambia con el estado; solo el disco interior.
              backgroundColor: "transparent",
              color: ready ? TOKENS.onDark : TOKENS.inkFaint,
              "& > span": {
                width: 36,
                height: 36,
                borderRadius: "var(--radius-pill)",
                display: "grid",
                placeItems: "center",
                transition:
                  "background-color var(--dur-standard) var(--ease-ios), transform var(--dur-standard) var(--ease-ios)",
                backgroundColor: ready ? TOKENS.red : TOKENS.tintInk8,
                transform: ready ? "scale(1)" : "scale(0.88)",
              },
            }}
          >
            <span>
              <ArrowUp size={18} strokeWidth={2.6} />
            </span>
          </MotionButton>
        )}
      </AnimatePresence>
    </MotionForm>
  );
}

/** Sugerencias que aparecen antes de la primera pregunta. */
export function Suggestions({ items, onAsk }: { items: string[]; onAsk: (q: string) => void }) {
  const { t } = useMotionPrefs();

  return (
    <Box
      sx={{
        position: "absolute",
        left: "calc(var(--gutter) + var(--safe-left))",
        right: "calc(var(--gutter) + var(--safe-right))",
        bottom: "calc(var(--gutter) + var(--safe-bottom) + var(--dock-offset) + 68px)",
        zIndex: 29,
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        justifyContent: "center",
      }}
    >
      {items.map((q, i) => (
        <MotionButton
          key={q}
          type="button"
          onClick={() => onAsk(q)}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={t({ ...spring, delay: 0.35 + i * 0.08 })}
          whileTap={{ scale: 0.95 }}
          className="liquid-glass-solid"
          sx={{
            borderRadius: "var(--radius-pill)",
            px: 1.75,
            py: 1.25,
            minHeight: "var(--tap-min)",
            display: "flex",
            alignItems: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {q}
          </Typography>
        </MotionButton>
      ))}
    </Box>
  );
}
