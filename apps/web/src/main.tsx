import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import ReactDOM from "react-dom/client";
import { AppShell } from "./app/app-shell";
import { theme } from "./app/theme";
import { CanvasScreen } from "./canvas/canvas-screen";
import "./index.css";

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AppShell>
      <CanvasScreen />
    </AppShell>
  </ThemeProvider>,
);
