import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ChevronDown, SquarePen } from "lucide-react";
import { TOKENS } from "../app/theme";
import { McpBadge } from "./mcp-panel";
import { useCanvas } from "./store";
import { MotionButton, spring, TapTarget, useMotionPrefs } from "./widgets/shell";

/** Perfiles demo. Sin auth: el selector del header manda el id al servidor. */
export const USERS = [
  { id: "karla", name: "Karla", greeting: "Hola, Karla" },
  { id: "roberto", name: "Don Roberto", greeting: "Buenas, Don Roberto" },
] as const;

export function activeUser(userId: string) {
  return USERS.find((u) => u.id === userId) ?? USERS[0];
}

/**
 * Header del lienzo (imposter: vive fuera del flujo del scroll).
 *
 * Transparente sobre el lienzo hasta que algo pasa por debajo; ahí se
 * materializa con velo y hairline. A la derecha están las dos únicas acciones
 * globales del asesor: abrir una charla nueva y ver la traza MCP.
 */
export function CanvasHeader({ lifted, showMcp }: { lifted: boolean; showMcp: boolean }) {
  const { t } = useMotionPrefs();
  const userId = useCanvas((s) => s.userId);
  const setUserId = useCanvas((s) => s.setUserId);
  const setTab = useCanvas((s) => s.setTab);
  const clearCanvas = useCanvas((s) => s.clearCanvas);
  const user = activeUser(userId);

  function switchUser() {
    const next = USERS[(USERS.findIndex((u) => u.id === userId) + 1) % USERS.length];
    setUserId(next.id);
    setTab("inicio");
    clearCanvas();
  }

  function newConversation() {
    clearCanvas();
    setTab("asesor");
  }

  return (
    <Box
      component="header"
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        height: "var(--header-h)",
        pt: "var(--safe-top)",
        pl: "calc(var(--gutter) + var(--safe-left))",
        pr: "calc(var(--gutter) + var(--safe-right))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        transition:
          "background-color var(--dur-standard) var(--ease-ios), box-shadow var(--dur-standard) var(--ease-ios), backdrop-filter var(--dur-standard) var(--ease-ios)",
        backgroundColor: lifted ? TOKENS.canvasVeil : "transparent",
        backdropFilter: lifted ? "blur(18px) saturate(160%)" : "none",
        WebkitBackdropFilter: lifted ? "blur(18px) saturate(160%)" : "none",
        boxShadow: lifted ? `inset 0 -1px 0 ${TOKENS.tintInk8}` : "none",
      }}
    >
      <MotionButton
        type="button"
        onClick={switchUser}
        whileTap={{ scale: 0.96 }}
        transition={t(spring)}
        aria-label={`Perfil actual: ${user.name}. Cambiar de perfil`}
        sx={{
          ...TapTarget,
          justifyContent: "flex-start",
          gap: 0.5,
          px: 1,
          ml: -1,
          borderRadius: "var(--radius-pill)",
          color: "text.primary",
        }}
      >
        <Typography variant="subtitle1">{user.name}</Typography>
        <ChevronDown size={16} color={TOKENS.inkFaint} />
      </MotionButton>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <MotionButton
          type="button"
          onClick={newConversation}
          whileTap={{ scale: 0.9 }}
          transition={t(spring)}
          aria-label="Nueva conversación"
          sx={{ ...TapTarget, borderRadius: "var(--radius-pill)", color: "text.secondary" }}
        >
          <SquarePen size={18} />
        </MotionButton>

        {showMcp && <McpBadge />}
      </Box>
    </Box>
  );
}
