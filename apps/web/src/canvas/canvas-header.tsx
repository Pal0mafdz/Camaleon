import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { LogOut, SquarePen } from "lucide-react";
import { type MotionValue, useTransform } from "motion/react";
import { logout as logoutRequest } from "../api/client";
import { BrandLogo } from "../app/brand-logo";
import { TOKENS } from "../app/theme";
import { useAuth } from "../auth/store";
import { McpBadge } from "./mcp-panel";
import { useCanvas } from "./store";
import { MotionBox, MotionButton, spring, TapTarget, useMotionPrefs } from "./widgets/shell";

/** Recorrido de scroll (px) en el que el velo pasa de invisible a pleno. */
const VEIL_TRAVEL = 56;

/**
 * Header del lienzo (imposter: vive fuera del flujo del scroll).
 *
 * Transparente sobre la mesa hasta que algo pasa por debajo; ahí se
 * materializa con velo y hairline. El velo sigue al scroll píxel a píxel
 * (`useScroll` → `useTransform`). Solo se anima `opacity` de la capa.
 * Izquierda: el titular (avatar laminado + nombre + "Cuenta Banorte").
 * Derecha: las dos acciones globales del asesor: charla nueva y traza MCP.
 */
export function CanvasHeader({
  scrollY,
  showMcp,
}: {
  scrollY: MotionValue<number>;
  showMcp: boolean;
}) {
  const { t } = useMotionPrefs();
  const user = useAuth((s) => s.user);
  const authLogout = useAuth((s) => s.logout);
  const setTab = useCanvas((s) => s.setTab);
  const clearCanvas = useCanvas((s) => s.clearCanvas);

  const veil = useTransform(scrollY, [0, VEIL_TRAVEL], [0, 1]);
  // El nombre se asienta 2px mientras el velo sube: el header "se apoya".
  const settle = useTransform(scrollY, [0, VEIL_TRAVEL], [0, 2]);

  function logout() {
    logoutRequest().catch(() => {
      // La sesión se limpia localmente aunque la llamada al servidor falle.
    });
    authLogout();
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
      }}
    >
      <MotionBox
        aria-hidden
        className="canvas-veil"
        style={{ opacity: veil }}
        sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />

      <MotionButton
        type="button"
        onClick={logout}
        whileTap={{ scale: 0.96 }}
        transition={t(spring)}
        style={{ y: settle }}
        aria-label={`Sesión de ${user?.name ?? "invitado"}. Cerrar sesión`}
        sx={{
          ...TapTarget,
          position: "relative",
          justifyContent: "flex-start",
          gap: 1.25,
          pl: 0.5,
          pr: 1,
          ml: -0.5,
          maxWidth: "60%",
          borderRadius: "var(--radius-s)",
          color: "text.primary",
        }}
      >
        {/* Avatar: una tarjetita laminada con la inicial en rojo Banorte. */}
        <Box
          aria-hidden
          sx={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-xs)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            backgroundColor: TOKENS.card,
            color: TOKENS.redDeep,
            boxShadow: `${TOKENS.glossLight}, ${TOKENS.hairline}, ${TOKENS.elev1}`,
          }}
        >
          <Typography variant="subtitle2" sx={{ lineHeight: 1, fontWeight: 800 }}>
            {(user?.name ?? "?").replace(/^Don\s+/i, "").charAt(0)}
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0, textAlign: "left" }}>
          <Typography
            variant="subtitle1"
            sx={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.15,
            }}
          >
            {user?.name ?? ""}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              lineHeight: 1.2,
              mt: 0.25,
              color: TOKENS.redDeep,
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            Cuenta Banorte
          </Typography>
        </Box>
        <LogOut size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
      </MotionButton>

      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: "text.secondary",
        }}
      >
        {/* El logotipo Banorte firma el header cuando existe el activo oficial. */}
        <BrandLogo height={22} sx={{ mr: 0.5 }} />
        <MotionButton
          type="button"
          onClick={newConversation}
          whileTap={{ scale: 0.9 }}
          transition={t(spring)}
          aria-label="Nueva conversación"
          sx={{ ...TapTarget, borderRadius: "var(--radius-s)", color: "inherit" }}
        >
          <SquarePen size={18} />
        </MotionButton>

        {showMcp && <McpBadge />}
      </Box>
    </Box>
  );
}
