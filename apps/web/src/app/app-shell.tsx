import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { createContext, type ReactNode, useContext } from "react";
import { McpRail } from "../canvas/mcp-panel";
import { MotionMain, springSoft, useMotionPrefs } from "../canvas/widgets/shell";
import { BrandLogo } from "./brand-logo";
import { TOKENS } from "./theme";

/**
 * El shell responsivo de Camaleón.
 *
 * NO es un teléfono de juguete pegado sobre un degradado. Cada ancho tiene un
 * layout con un trabajo distinto:
 *
 *   compact (<640)   la app ocupa la pantalla completa, con safe areas reales.
 *   medium  (640+)   una columna centrada a medida de lectura, altura completa.
 *   wide    (1024+)  workspace de dos paneles: a la izquierda el riel de marca
 *                    con el log MCP EN VIVO (el mismo dato que en móvil vive en
 *                    una hoja), a la derecha la superficie de la app.
 *
 * El espacio libre del escritorio se llena con información real —el registro de
 * herramientas— no con relleno decorativo.
 */

export type LayoutMode = "compact" | "medium" | "wide";

const LayoutContext = createContext<LayoutMode>("compact");

/** Deja que las pantallas ajusten densidad y qué superficies duplicar. */
export function useLayoutMode(): LayoutMode {
  return useContext(LayoutContext);
}

const SURFACE_W_MEDIUM = 480;
/* En escritorio la hoja crece hasta dos columnas de widgets; nunca invade el riel. */
const SURFACE_W_WIDE = "min(780px, calc(100vw - 440px))";
const RAIL_W = 300;

/**
 * El fondo del escritorio es la mesa sobre la que descansa la tarjeta: un
 * campo granate → tinta (el reverso de la tarjeta Banorte) con una luz cálida
 * detrás de la hoja. La luz está motivada —es lo que hace brillar el
 * laminado— y no es un degradado genérico.
 */
const TABLE = [
  `radial-gradient(80% 55% at 50% 0%, ${TOKENS.tintRed14} 0%, transparent 70%)`,
  `radial-gradient(60% 50% at 50% 42%, ${TOKENS.tintGarnet30} 0%, transparent 72%)`,
  `linear-gradient(180deg, ${TOKENS.garnet} 0%, ${TOKENS.inkRaised} 48%, ${TOKENS.inkDeep} 100%)`,
].join(", ");

export function AppShell({ children }: { children: ReactNode }) {
  const isMedium = useMediaQuery("(min-width:640px)");
  const isWide = useMediaQuery("(min-width:1024px)");
  const mode: LayoutMode = isWide ? "wide" : isMedium ? "medium" : "compact";
  const { t } = useMotionPrefs();

  if (mode === "compact") {
    return (
      <LayoutContext.Provider value="compact">
        <Box
          component="main"
          sx={{
            position: "relative",
            width: "100%",
            // dvb sigue al teclado virtual y a la barra de direcciones de iOS;
            // 100vh provocaría el salto clásico de Safari.
            height: "100dvb",
            overflow: "hidden",
            bgcolor: "background.default",
            // Todo lo anclado al pulgar sube lo que mide la barra de pestañas.
            "--dock-offset": "var(--tab-bar-h)",
          }}
        >
          {children}
        </Box>
      </LayoutContext.Provider>
    );
  }

  return (
    <LayoutContext.Provider value={mode}>
      <Box
        sx={{
          minHeight: "100dvb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          px: { xs: 3, lg: 8 },
          py: 4,
          background: TABLE,
        }}
      >
        {mode === "wide" && <BrandRail />}

        {/* La hoja es una tarjeta de 480px: se reparte sobre la mesa una sola
            vez, con el mismo giro que las tarjetas del lienzo, y se apoya. */}
        <MotionMain
          initial={{ opacity: 0, y: 24, rotateZ: -1.2, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, rotateZ: 0, scale: 1 }}
          transition={t(springSoft)}
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: mode === "wide" ? SURFACE_W_WIDE : SURFACE_W_MEDIUM,
            height: "min(940px, calc(100dvb - 64px))",
            flexShrink: 0,
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            transformOrigin: "50% 100%",
            bgcolor: "background.default",
            boxShadow: `${TOKENS.glossLight}, ${TOKENS.elev3}, ${TOKENS.elevSheet}`,
            "--dock-offset": "var(--tab-bar-h)",
            "--gutter": mode === "wide" ? "24px" : "16px",
            "--canvas-cols": "2",
          }}
        >
          {children}
        </MotionMain>
      </Box>
    </LayoutContext.Provider>
  );
}

/** Riel de marca del escritorio: identidad arriba, prueba viva del MCP abajo. */
function BrandRail() {
  return (
    <Box
      component="aside"
      className="on-ink"
      sx={{
        width: RAIL_W,
        flexShrink: 0,
        alignSelf: "stretch",
        maxHeight: "min(940px, calc(100dvb - 64px))",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        py: 2,
      }}
    >
      <Box>
        {/* Marca primero cuando existe el activo oficial; el título carga solo. */}
        <BrandLogo height={28} sx={{ mb: 2 }} />
        <Typography variant="h1" component="h1" sx={{ color: TOKENS.onDark }}>
          Camaleón
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: TOKENS.onDarkDim, mt: 1.5, maxWidth: "28ch", overflowWrap: "anywhere" }}
        >
          El asesor de Banorte que no te da pantallas: te arma la que necesitas, con tu dinero real.
        </Typography>
      </Box>

      <McpRail />
    </Box>
  );
}
