import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { TOKENS } from "../app/theme";
import { MotionBox, springSoft, useMotionPrefs } from "../canvas/widgets/shell";

/**
 * Cascarón de las pantallas de lista (Metas, Historial).
 *
 * El lienzo del asesor se construye solo; estas dos no. Aun así usan el mismo
 * material: papel blanco sobre arena, un único dueño del scroll y un header
 * velado fijo —de los pocos elementos que pueden permitirse desenfoque.
 */
export function ScreenShell({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useMotionPrefs();

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={t(springSoft)}
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 15,
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
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
          backgroundColor: TOKENS.canvasVeil,
          backdropFilter: "blur(18px) saturate(160%)",
          WebkitBackdropFilter: "blur(18px) saturate(160%)",
          boxShadow: `inset 0 -1px 0 ${TOKENS.tintInk8}`,
        }}
      >
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
      </Box>

      <Box
        className="no-scrollbar scroll-body"
        sx={{
          height: "100%",
          pl: "calc(var(--gutter) + var(--safe-left))",
          pr: "calc(var(--gutter) + var(--safe-right))",
          pt: "calc(var(--header-h) + 8px)",
          pb: "calc(var(--tab-bar-h) + var(--safe-bottom) + 24px)",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          "& > *": { flexShrink: 0 },
        }}
      >
        {children}
      </Box>
    </MotionBox>
  );
}

/** Bloque con rótulo en versalitas. Separa "Mis planes" de la lista de metas. */
export function ScreenSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1.5 }}>
      <Typography variant="overline" sx={{ color: "text.disabled", px: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

/** Línea de estado: cargando, vacío o error. Nunca deja la pantalla en blanco. */
export function ScreenNote({
  children,
  tone = "dim",
}: {
  children: ReactNode;
  tone?: "dim" | "bad";
}) {
  return (
    <Box
      sx={{
        borderRadius: "var(--radius-l)",
        p: 2.5,
        backgroundColor: TOKENS.card,
        boxShadow:
          tone === "bad"
            ? `inset 0 0 0 1px ${TOKENS.tintRed32}, ${TOKENS.elev1}`
            : `${TOKENS.hairline}, ${TOKENS.elev1}`,
      }}
    >
      <Typography variant="body2" sx={{ color: tone === "bad" ? TOKENS.badInk : "text.secondary" }}>
        {children}
      </Typography>
    </Box>
  );
}
