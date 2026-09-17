import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import { ArrowUp, Mic, Square } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { EASE_IOS, TOKENS } from "../app/theme";
import {
  MotionBox,
  MotionButton,
  MotionForm,
  spring,
  TapTarget,
  useMotionPrefs,
} from "./widgets/shell";

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
    if (!q) return;
    // Enviar con el agente ocupado interrumpe el turno anterior: una pregunta
    // escrita nunca se pierde en silencio.
    if (busy) onStop();
    recRef.current?.stop();
    setText("");
    navigator.vibrate?.(10);
    onAsk(q);
  }

  return (
    <MotionForm
      onSubmit={submit}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={t({ ...spring, delay: 0.2 })}
      className="paper-floating"
      sx={{
        position: "absolute",
        left: "calc(var(--gutter) + var(--safe-left))",
        right: "calc(var(--gutter) + var(--safe-right))",
        bottom: "calc(var(--gutter) + var(--safe-bottom) + var(--dock-offset))",
        zIndex: 30,
        minHeight: "var(--command-bar-h)",
        // Una tarjeta más, no una píldora: mismo radio que todo el catálogo.
        borderRadius: "var(--radius-l)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        pl: 0.75,
        pr: 0.75,
        py: 0.75,
        transition: "box-shadow var(--dur-standard) var(--ease-ios)",
        "&:focus-within": {
          boxShadow: `${TOKENS.glossLight}, ${TOKENS.hairline}, ${TOKENS.elev3}, 0 0 0 3px ${TOKENS.tintRed32}`,
        },
      }}
    >
      {/* Mientras el agente trabaja, una línea roja recorre el canto superior:
          la terminal está procesando la tarjeta. */}
      {busy && !reduced && (
        <MotionBox
          aria-hidden
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.6, ease: EASE_IOS }}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${TOKENS.red} 40%, ${TOKENS.red} 60%, transparent 100%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {supportsVoice && (
        <MotionButton
          type="button"
          onClick={toggleVoice}
          whileTap={{ scale: 0.9 }}
          animate={loop(listening ? { scale: [1, 1.12, 1] } : { scale: 1 })}
          transition={
            listening && !reduced
              ? { repeat: Number.POSITIVE_INFINITY, duration: 1.1, ease: EASE_IOS }
              : t(spring)
          }
          aria-label={listening ? "Detener dictado" : "Dictar"}
          aria-pressed={listening}
          sx={{
            ...TapTarget,
            borderRadius: "var(--radius-s)",
            transition:
              "color var(--dur-standard) var(--ease-ios), background-color var(--dur-standard) var(--ease-ios)",
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
          typography: "body1",
          color: "text.primary",
          // El campo en sí también es un objetivo táctil: si solo mide el alto
          // de la línea, tocar un par de píxeles arriba del texto no enfoca.
          "& input": { padding: 0, minHeight: "var(--tap-min)" },
          // El anillo lo pinta la barra completa (`:focus-within`); el input
          // no repite el suyo o se ven dos anillos concentricos.
          "& input:focus-visible": { boxShadow: "none" },
          "& input::placeholder": { color: "text.disabled", opacity: 1 },
        }}
      />

      <SendStopButton busy={busy} ready={ready} onStop={onStop} />
    </MotionForm>
  );
}

/**
 * Enviar ↔ detener es UN botón que se transforma, no dos que se intercambian.
 * El disco cambia de rojo a tinta, la flecha gira y se encoge mientras el
 * cuadrado gira y crece desde el centro; mientras el agente trabaja, un anillo
 * fino recorre el borde del disco (es el único bucle: se apaga al terminar y
 * con movimiento reducido).
 */
function SendStopButton({
  busy,
  ready,
  onStop,
}: {
  busy: boolean;
  ready: boolean;
  onStop: () => void;
}) {
  const { t, reduced } = useMotionPrefs();
  const active = busy || ready;

  return (
    <MotionButton
      type={busy ? "button" : "submit"}
      onClick={busy ? onStop : undefined}
      disabled={!busy && !ready}
      whileTap={active ? { scale: 0.9 } : undefined}
      transition={t(spring)}
      aria-label={busy ? "Detener" : "Enviar"}
      sx={{
        ...TapTarget,
        borderRadius: "var(--radius-s)",
        cursor: active ? "pointer" : "default",
        // La tecla lleva la marca desde el primer frame: rojo sobre tinte en
        // reposo, blanco sobre rojo con texto, blanco sobre tinta al detener.
        color: active ? TOKENS.onDark : TOKENS.red,
      }}
    >
      {/* El área tocable NO cambia con el estado; solo la tecla interior. */}
      <MotionBox
        animate={{
          scale: active ? 1 : 0.92,
          backgroundColor: busy ? TOKENS.ink : ready ? TOKENS.red : TOKENS.tintRed8,
        }}
        transition={t(spring)}
        sx={{
          position: "relative",
          width: 36,
          height: 36,
          borderRadius: "var(--radius-s)",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          boxShadow: active ? TOKENS.glossInk : undefined,
        }}
      >
        {busy && !reduced && (
          <MotionBox
            aria-hidden
            className="spin-ring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{
              opacity: { duration: 0.2 },
              rotate: { repeat: Number.POSITIVE_INFINITY, duration: 1.4, ease: "linear" },
            }}
            sx={{ position: "absolute", inset: 0, borderRadius: "var(--radius-s)" }}
          />
        )}
        <MotionBox
          aria-hidden
          animate={{ scale: busy ? 0.4 : 1, rotate: busy ? -90 : 0, opacity: busy ? 0 : 1 }}
          transition={t(spring)}
          sx={{ position: "absolute", display: "grid", placeItems: "center" }}
        >
          <ArrowUp size={18} strokeWidth={2.6} />
        </MotionBox>
        <MotionBox
          aria-hidden
          animate={{ scale: busy ? 1 : 0.4, rotate: busy ? 0 : 90, opacity: busy ? 1 : 0 }}
          transition={t(spring)}
          sx={{ position: "absolute", display: "grid", placeItems: "center" }}
        >
          <Square size={13} fill="currentColor" />
        </MotionBox>
      </MotionBox>
    </MotionButton>
  );
}

/** Sugerencias que aparecen antes de la primera pregunta. */
export function Suggestions({ items, onAsk }: { items: string[]; onAsk: (q: string) => void }) {
  const { t, step } = useMotionPrefs();

  return (
    <Box
      sx={{
        position: "absolute",
        left: "calc(var(--gutter) + var(--safe-left))",
        right: "calc(var(--gutter) + var(--safe-right))",
        bottom:
          "calc(var(--gutter) * 2 + var(--safe-bottom) + var(--dock-offset) + var(--command-bar-h))",
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
          initial={{ opacity: 0, y: 14, rotateZ: i % 2 ? 1.5 : -1.5, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, rotateZ: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          transition={t({ ...spring, delay: 0.35 + step(i) * 2 })}
          whileTap={{ scale: 0.95 }}
          className="paper-floating"
          sx={{
            borderRadius: "var(--radius-s)",
            px: 1.75,
            py: 1.25,
            minHeight: "var(--tap-min)",
            display: "flex",
            alignItems: "center",
            color: "text.secondary",
            transition: "color var(--dur-micro) var(--ease-ios)",
            "&:hover": { color: "text.primary" },
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
