import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ChevronRight, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type ConversationSummary,
  flattenTurns,
  getConversation,
  listConversations,
} from "../api/client";
import { TOKENS } from "../app/theme";
import { formatDateTime } from "../canvas/format";
import { useCanvas } from "../canvas/store";
import { MotionBox, MotionButton, spring, useMotionPrefs } from "../canvas/widgets/shell";
import { ScreenNote, ScreenShell } from "./screen-ui";

/**
 * Historial de charlas.
 *
 * No hay burbujas de chat que revisar: lo que se guarda de una conversación es
 * el LIENZO que produjo. Por eso tocar una fila no abre un transcript, repinta
 * las tarjetas y te deja en el asesor, listo para encadenar la siguiente
 * pregunta al mismo hilo.
 */
export function HistorialScreen() {
  const userId = useCanvas((s) => s.userId);
  const paintWidgets = useCanvas((s) => s.paintWidgets);
  const setConversationId = useCanvas((s) => s.setConversationId);
  const setTab = useCanvas((s) => s.setTab);

  const [list, setList] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setList(null);
    setError(null);

    listConversations(userId)
      .then((next) => {
        if (alive) setList(next);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setList([]);
        setError(e instanceof Error ? e.message : "No pude cargar tu historial");
      });

    return () => {
      alive = false;
    };
  }, [userId]);

  function open(id: number) {
    if (openingId !== null) return;
    setOpeningId(id);
    setError(null);

    getConversation(userId, id)
      .then((conv) => {
        const widgets = flattenTurns(conv.messages);
        if (widgets.length === 0) {
          setError("Esa charla no dejó tarjetas que repintar.");
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

  return (
    <ScreenShell title="Historial">
      <Typography variant="body1" sx={{ color: "text.secondary", px: 0.5, mb: 0.5 }}>
        Toca una charla para volver a pintar su lienzo y seguir preguntando.
      </Typography>

      {error && <ScreenNote tone="bad">{error}</ScreenNote>}

      {list === null && <ScreenNote>Cargando tus charlas…</ScreenNote>}

      {list?.length === 0 && (
        <ScreenNote>
          Aún no hay charlas guardadas. Pregúntale algo al asesor y aparecerá aquí.
        </ScreenNote>
      )}

      {list?.map((conv) => (
        <ConversationRow
          key={conv.id}
          conversation={conv}
          opening={openingId === conv.id}
          onOpen={() => open(conv.id)}
        />
      ))}
    </ScreenShell>
  );
}

function ConversationRow({
  conversation,
  opening,
  onOpen,
}: {
  conversation: ConversationSummary;
  opening: boolean;
  onOpen: () => void;
}) {
  const { t, loop, reduced } = useMotionPrefs();

  return (
    <MotionButton
      type="button"
      onClick={onOpen}
      whileTap={{ scale: 0.985 }}
      transition={t(spring)}
      className="liquid-glass"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        minHeight: "var(--tap-min)",
        borderRadius: "var(--radius-l)",
        p: 2,
        textAlign: "left",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>
          {conversation.title}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {formatDateTime(conversation.updatedAt)}
        </Typography>
      </Box>

      {opening ? (
        <MotionBox
          animate={loop({ rotate: 360 })}
          transition={
            reduced
              ? undefined
              : { repeat: Number.POSITIVE_INFINITY, duration: 0.9, ease: "linear" }
          }
          sx={{ display: "grid", placeItems: "center", color: "primary.main" }}
        >
          <Loader size={18} />
        </MotionBox>
      ) : (
        <ChevronRight size={18} color={TOKENS.inkFaint} />
      )}
    </MotionButton>
  );
}
