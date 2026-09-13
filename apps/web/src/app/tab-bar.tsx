import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Clock, House, Settings, Sparkles, Target } from "lucide-react";
import type { ReactNode } from "react";
import { type Tab, useCanvas } from "../canvas/store";
import { MotionBox, MotionButton, spring, useMotionPrefs } from "../canvas/widgets/shell";
import { TOKENS } from "./theme";

/**
 * Barra de pestañas del pulgar.
 *
 * Es la única navegación de la app: el lienzo sigue construyéndose solo, pero
 * ahora vive junto a dos superficies que SÍ son pantallas (metas e historial).
 * Se ancla al fondo con la safe area incluida y eleva todo lo que flota encima
 * a través de `--dock-offset`, así que la command bar nunca queda debajo.
 *
 * Es un elemento fijo fuera del scroller: de los pocos que pueden desenfocar.
 */

const TABS: { id: Tab; label: string; Icon: typeof House }[] = [
  { id: "inicio", label: "Inicio", Icon: House },
  { id: "asesor", label: "Asesor", Icon: Sparkles },
  { id: "metas", label: "Metas", Icon: Target },
  { id: "historial", label: "Historial", Icon: Clock },
  { id: "ajustes", label: "Ajustes", Icon: Settings },
];

export function TabBar() {
  const tab = useCanvas((s) => s.tab);
  const setTab = useCanvas((s) => s.setTab);

  return (
    <Box
      component="nav"
      aria-label="Secciones"
      className="dock-bar"
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        height: "calc(var(--tab-bar-h) + var(--safe-bottom))",
        pb: "var(--safe-bottom)",
        pl: "var(--safe-left)",
        pr: "var(--safe-right)",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {TABS.map(({ id, label, Icon }) => (
        <TabItem
          key={id}
          label={label}
          active={tab === id}
          onSelect={() => setTab(id)}
          icon={<Icon size={20} strokeWidth={tab === id ? 2.4 : 2} />}
        />
      ))}
    </Box>
  );
}

function TabItem({
  label,
  active,
  onSelect,
  icon,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
  icon: ReactNode;
}) {
  const { t } = useMotionPrefs();

  return (
    <MotionButton
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      whileTap={{ scale: 0.92 }}
      transition={t(spring)}
      sx={{
        position: "relative",
        flex: 1,
        minWidth: "var(--tap-min)",
        minHeight: "var(--tap-min)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.25,
        borderRadius: "var(--radius-s)",
        transition: "color var(--dur-standard) var(--ease-ios)",
        color: active ? "primary.main" : "text.disabled",
      }}
    >
      {/* La franja roja viaja entre pestañas en vez de aparecer y desaparecer:
          dice de dónde vienes, no solo dónde estás. Un solo `layoutId`. */}
      {active && (
        <MotionBox
          layoutId="tab-stripe"
          transition={t(spring)}
          aria-hidden
          sx={{
            position: "absolute",
            top: 0,
            width: 36,
            height: 3,
            borderRadius: "0 0 var(--radius-2xs) var(--radius-2xs)",
            backgroundColor: TOKENS.red,
            boxShadow: `0 1px 4px ${TOKENS.tintRed32}`,
          }}
        />
      )}
      <MotionBox
        animate={{ y: active ? -1 : 0, scale: active ? 1.04 : 1 }}
        transition={t(spring)}
        sx={{ display: "grid", placeItems: "center", height: 22, zIndex: 1 }}
      >
        {icon}
      </MotionBox>
      <Typography
        variant="caption"
        sx={{
          fontWeight: active ? 700 : 600,
          zIndex: 1,
          position: "relative",
          // El rojo vivo no pasa AA a 12px sobre blanco; el texto usa el profundo.
          color: active ? TOKENS.redDeep : undefined,
        }}
      >
        {label}
      </Typography>
    </MotionButton>
  );
}
