import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { z } from "zod";
import { login, signup } from "../api/client";
import { TOKENS } from "../app/theme";
import { Field } from "../screens/screen-controls";
import { ScreenNote } from "../screens/screen-ui";
import { useAuth } from "./store";

const credentialsSchema = z.object({
  name: z.string().trim().min(1, "Falta tu nombre").optional(),
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(4, "La contraseña necesita al menos 4 caracteres"),
});

/**
 * Puerta de entrada de la app. Reemplaza al selector de perfil demo: ahora
 * hay que loguearse o crear una cuenta de verdad (aunque simple).
 */
export function LoginScreen() {
  const authLogin = useAuth((s) => s.login);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (busy) return;
    const parsed = credentialsSchema.safeParse({
      name: mode === "signup" ? name : undefined,
      email,
      password,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos");
      return;
    }

    setBusy(true);
    setError(null);

    const call =
      mode === "login"
        ? login(parsed.data.email, parsed.data.password)
        : signup({
            name: parsed.data.name ?? "",
            email: parsed.data.email,
            password: parsed.data.password,
          });

    call
      .then(({ token, user }) => authLogin(token, user))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No pude completar la solicitud"),
      )
      .finally(() => setBusy(false));
  }

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 3,
        px: "calc(var(--gutter) + var(--safe-left))",
        pr: "calc(var(--gutter) + var(--safe-right))",
        bgcolor: "background.default",
      }}
    >
      <Box>
        <Typography variant="overline" sx={{ color: TOKENS.inkFaint }}>
          Banorte
        </Typography>
        <Typography variant="h2">Camaleón</Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mt: 1 }}>
          {mode === "login" ? "Inicia sesión para ver tu dinero." : "Crea tu cuenta en un minuto."}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {mode === "signup" && (
          <Field label="Nombre" value={name} onChange={setName} placeholder="Tu nombre" />
        )}
        <Field label="Correo" value={email} onChange={setEmail} placeholder="tu@correo.com" />
        <Field
          label="Contraseña"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          type="password"
        />

        {error && <ScreenNote tone="bad">{error}</ScreenNote>}

        <Box
          component="button"
          type="button"
          onClick={submit}
          disabled={busy}
          sx={{
            border: "none",
            cursor: busy ? "default" : "pointer",
            minHeight: "var(--tap-min)",
            borderRadius: "var(--radius-pill)",
            backgroundColor: busy ? TOKENS.tintInk8 : TOKENS.red,
            color: busy ? TOKENS.inkFaint : TOKENS.onDark,
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          {busy ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </Box>

        <Box
          component="button"
          type="button"
          onClick={() => {
            setMode((m) => (m === "login" ? "signup" : "login"));
            setError(null);
          }}
          sx={{
            border: "none",
            background: "none",
            cursor: "pointer",
            minHeight: "var(--tap-min)",
            color: "text.secondary",
            fontSize: 14,
          }}
        >
          {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </Box>
      </Box>
    </Box>
  );
}
