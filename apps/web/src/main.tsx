import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import ReactDOM from "react-dom/client";
import { AuthGate } from "./app/auth-gate";
import { theme } from "./app/theme";
import "./index.css";

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthGate />
  </ThemeProvider>,
);
