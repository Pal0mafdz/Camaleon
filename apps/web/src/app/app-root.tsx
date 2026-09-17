import { CanvasScreen } from "../canvas/canvas-screen";
import { useCanvas } from "../canvas/store";
import { AnimatePresence, MotionBox, springSoft, useMotionPrefs } from "../canvas/widgets/shell";
import { CuentaScreen } from "../screens/cuenta-screen";
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
 *
 * Coreografía del cambio de pestaña: la hoja que llega (Metas, Historial) se
 * apoya encima con `springSoft` mientras el lienzo, debajo, retrocede un pelo
 * —la mesa cede bajo el peso—; al volver, el lienzo vuelve a su sitio. Entre
 * dos hojas, `mode="wait"`: una se levanta antes de que la otra aterrice, así
 * nunca hay dos headers a la vez. Al terminar, `visibility: hidden` saca al
 * lienzo del orden de tabulación y del árbol de accesibilidad: la command bar
 * no es alcanzable desde Metas.
 */
export function AppRoot() {
  const tab = useCanvas((s) => s.tab);
  const { t } = useMotionPrefs();
  const covered = tab === "metas" || tab === "cuenta" || tab === "historial" || tab === "ajustes";

  return (
    <>
      <MotionBox
        initial={false}
        animate={
          covered
            ? { opacity: 0.6, scale: 0.985, transitionEnd: { visibility: "hidden" } }
            : { visibility: "visible", opacity: 1, scale: 1 }
        }
        transition={t(springSoft)}
        aria-hidden={covered || undefined}
        sx={{ position: "absolute", inset: 0, transformOrigin: "50% 40%" }}
      >
        <CanvasScreen />
      </MotionBox>

      <AnimatePresence mode="wait">
        {tab === "metas" && <MetasScreen key="metas" />}
        {tab === "cuenta" && <CuentaScreen key="cuenta" />}
        {tab === "historial" && <HistorialScreen key="historial" />}
        {tab === "ajustes" && <PreferencesScreen key="ajustes" />}
      </AnimatePresence>

      <TabBar />
    </>
  );
}
