import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ConversationSummary,
  flattenTurns,
  getConversation,
  listConversations,
} from "../api/client";
import { TOKENS } from "../app/theme";
import { formatDateTime } from "../canvas/format";
import { useCanvas } from "../canvas/store";
import {
  AnimatePresence,
  MotionBox,
  MotionButton,
  spring,
  useMotionPrefs,
  WidgetShell,
} from "../canvas/widgets/shell";
import { ListSkeleton, ScreenEmpty, ScreenLede, ScreenNote, ScreenShell } from "./screen-ui";

/**
 * Historial de charlas.
 *
 * No hay burbujas de chat que revisar: lo que se guarda de una conversación es
 * el LIENZO que produjo. Por eso tocar una fila no abre un transcript, repinta
 * las tarjetas y te deja en el asesor, listo para encadenar la siguiente
 * pregunta al mismo hilo. Mientras se abre, la flecha de la fila se vuelve el
 * anillo de trabajo del sistema; la fila entera queda ocupada.
 */
export function HistorialScreen() {
  const userId = useCanvas((s) => s.userId);
  const paintWidgets = useCanvas((s) => s.paintWidgets);
  const setConversationId = useCanvas((s) => s.setConversationId);
  const setTab = useCanvas((s) => s.setTab);

  const [list, setList] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);
  // Cada carga lleva su número; una respuesta vieja (perfil cambiado, reintento) se ignora.
  const generation = useRef(0);

  const load = useCallback(() => {
    const gen = ++generation.current;
    setList(null);
    setError(null);

    listConversations(userId)
      .then((next) => {
        if (gen === generation.current) setList(next);
      })
      .catch((e: unknown) => {
        if (gen !== generation.current) return;
        setList([]);
        setError(e instanceof Error ? e.message : "No pude cargar tu historial");
      });
  }, [userId]);

  useEffect(() => {
    load();
    return () => {
      generation.current++;
    };
  }, [load]);

  function open(id: number) {
    if (openingId !== null) return;
    setOpeningId(id);
    setError(null);

    getConversation(userId, id)
      .then((conv) => {
        const widgets = flattenTurns(conv.messages);
        if (widgets.length === 0) {
          setError("Esa charla no dejó tarjetas que repintar. Abre otra o empieza una nueva.");
          return;
        }
        paintWidgets(widgets);
        setConversationId(conv.id);
        setTab("asesor");
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No pude abrir la conversación"),
      )
      .finally(() => setOpeningId(null));
  }

  const loading = list === null;
  const rows = list ?? [];

  return (
    <ScreenShell title="Tus movimientos">
      <ScreenLede>Toca una charla para volver a pintar su lienzo y seguir preguntando.</ScreenLede>

      <AnimatePresence>
        {error && (
          <ScreenNote
            key="error"
            tone="bad"
            action={rows.length === 0 ? { label: "Volver a cargar", onClick: load } : undefined}
          >
            {error}
          </ScreenNote>
        )}
      </AnimatePresence>

      {loading && <ListSkeleton rows={4} />}

      <AnimatePresence>
        {!loading && rows.length === 0 && !error && (
          <ScreenEmpty
            key="empty"
            title="Aún no hay charlas guardadas"
            body="Cada pregunta que le hagas al asesor deja un lienzo. Aquí podrás volver a abrirlo y seguir desde donde lo dejaste."
            action={{ label: "Preguntarle algo al asesor", onClick: () => setTab("asesor") }}
          />
        )}

        {rows.map((conv) => (
          <ConversationRow
            key={conv.id}
            conversation={conv}
            opening={openingId === conv.id}
            blocked={openingId !== null && openingId !== conv.id}
            onOpen={() => open(conv.id)}
          />
        ))}
      </AnimatePresence>
    </ScreenShell>
  );
}

function ConversationRow({
  conversation,
  opening,
  blocked,
  onOpen,
}: {
  conversation: ConversationSummary;
  opening: boolean;
  /** Otra fila se está abriendo: ésta espera sin perder su aspecto. */
  blocked: boolean;
  onOpen: () => void;
}) {
  const { t, loop } = useMotionPrefs();

  return (
    <WidgetShell pad={0}>
      <MotionButton
        type="button"
        onClick={onOpen}
        disabled={opening || blocked}
        aria-busy={opening || undefined}
        whileTap={opening || blocked ? undefined : { scale: 0.985 }}
        animate={{ opacity: blocked ? 0.6 : 1 }}
        transition={t(spring)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          width: "100%",
          minHeight: "var(--tap-min)",
          borderRadius: "var(--radius-l)",
          p: 2,
          textAlign: "left",
          cursor: opening || blocked ? "default" : "pointer",
          transition: "background-color var(--dur-micro) var(--ease-ios)",
          "&:hover": opening || blocked ? undefined : { backgroundColor: TOKENS.tintInk3 },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" component="h3" sx={{ overflowWrap: "anywhere" }}>
            {conversation.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.disabled", fontVariantNumeric: "tabular-nums" }}
          >
            {opening ? "Repintando el lienzo…" : formatDateTime(conversation.updatedAt)}
          </Typography>
        </Box>

        <Box
          sx={{
            position: "relative",
            width: 32,
            height: 32,
            borderRadius: "var(--radius-pill)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            overflow: "hidden",
            color: opening ? "primary.main" : "text.secondary",
            backgroundColor: opening ? TOKENS.tintRed8 : TOKENS.sunken,
            transition: "background-color var(--dur-micro) var(--ease-ios)",
          }}
          aria-hidden
        >
          {opening && (
            <MotionBox
              className="spin-ring on-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, ...loop({ rotate: 360 }) }}
              transition={t({
                opacity: { duration: 0.2 },
                rotate: { repeat: Number.POSITIVE_INFINITY, duration: 1.4, ease: "linear" },
              })}
              sx={{ position: "absolute", inset: 0, borderRadius: "var(--radius-pill)" }}
            />
          )}
          <MotionBox
            animate={{ opacity: opening ? 0 : 1, x: opening ? 4 : 0 }}
            transition={t(spring)}
            sx={{ display: "grid", placeItems: "center" }}
          >
            <ChevronRight size={16} strokeWidth={2.4} />
          </MotionBox>
        </Box>
      </MotionButton>
    </WidgetShell>
  );
}
