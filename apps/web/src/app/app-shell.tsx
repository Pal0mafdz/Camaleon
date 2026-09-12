import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { createContext, type ReactNode, useContext } from "react";
import { McpRail } from "../canvas/mcp-panel";
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

const SURFACE_W = 428;
const RAIL_W = 320;

/**
 * El fondo del escritorio es la mesa sobre la que descansa el papel: campo de
 * tinta cálida con una luz difusa detrás de la superficie. La luz está
 * motivada —es lo que hace que la hoja brille— y no es un degradado genérico.
 */
const TABLE = [
  `radial-gradient(80% 55% at 50% 0%, ${TOKENS.tintRed14} 0%, transparent 70%)`,
  "radial-gradient(60% 50% at 50% 42%, rgba(154,112,90,0.30) 0%, transparent 72%)",
  `linear-gradient(180deg, ${TOKENS.inkRaised} 0%, ${TOKENS.ink} 55%, #17110D 100%)`,
].join(", ");

export function AppShell({ children }: { children: ReactNode }) {
  const isMedium = useMediaQuery("(min-width:640px)");
  const isWide = useMediaQuery("(min-width:1024px)");
  const mode: LayoutMode = isWide ? "wide" : isMedium ? "medium" : "compact";

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

        <Box
          component="main"
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: SURFACE_W,
            height: "min(920px, calc(100dvb - 64px))",
            flexShrink: 0,
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            bgcolor: "background.default",
            boxShadow: `${TOKENS.glossLight}, ${TOKENS.elev3}`,
          }}
        >
          {children}
        </Box>
      </Box>
    </LayoutContext.Provider>
  );
}

/** Riel de marca del escritorio: identidad arriba, prueba viva del MCP abajo. */
function BrandRail() {
  return (
    <Box
      component="aside"
      sx={{
        width: RAIL_W,
        flexShrink: 0,
        alignSelf: "stretch",
        maxHeight: "min(920px, calc(100dvb - 64px))",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        py: 2,
      }}
    >
      <Box>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.5,
            mb: 2.5,
            borderRadius: "var(--radius-pill)",
            backgroundColor: TOKENS.tintWhite8,
            boxShadow: `inset 0 0 0 1px ${TOKENS.tintWhite14}`,
          }}
        >
          <Box
            sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: TOKENS.red }}
            aria-hidden
          />
          <Typography variant="overline" sx={{ color: TOKENS.onDarkDim }}>
            Banorte
          </Typography>
        </Box>

        <Typography variant="h2" sx={{ color: TOKENS.onDark, fontSize: 40 }}>
          Camaleón
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: TOKENS.onDarkDim, mt: 1.5, maxWidth: "28ch", overflowWrap: "anywhere" }}
        >
          Un asesor que no te da pantallas: te arma la que necesitas, con tu dinero real.
        </Typography>
      </Box>

      <McpRail />
    </Box>
  );
}
