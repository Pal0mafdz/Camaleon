import Box from "@mui/material/Box";
import { CanvasScreen } from "../canvas/canvas-screen";
import { useCanvas } from "../canvas/store";
import { HistorialScreen } from "../screens/historial-screen";
import { MetasScreen } from "../screens/metas-screen";
import { PreferencesScreen } from "../screens/preferences-screen";
import { TabBar } from "./tab-bar";

/**
 * Raíz navegable de la app.
 *
 * `Inicio` y `Asesor` son la MISMA superficie —el lienzo— con dos entradas
 * distintas, así que el lienzo se queda montado y solo se oculta: cambiar de
 * pestaña no pierde el scroll, ni el turno en vuelo, ni obliga a repreguntar.
 * `visibility: hidden` además lo saca del orden de tabulación y del árbol de
 * accesibilidad, así que la command bar tampoco es alcanzable desde Metas.
 */
export function AppRoot() {
  const tab = useCanvas((s) => s.tab);
  const covered = tab === "metas" || tab === "historial" || tab === "ajustes";

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          visibility: covered ? "hidden" : "visible",
        }}
      >
        <CanvasScreen />
      </Box>

      {tab === "metas" && <MetasScreen />}
      {tab === "historial" && <HistorialScreen />}
      {tab === "ajustes" && <PreferencesScreen />}

      <TabBar />
    </>
  );
}
