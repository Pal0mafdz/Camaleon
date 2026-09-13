import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getPreferences, patchPreferences } from "../api/client";
import { TOKENS } from "../app/theme";
import { useAuth } from "../auth/store";
import { useCanvas } from "../canvas/store";
import { PillButton } from "./screen-controls";
import { ScreenNote, ScreenSection, ScreenShell } from "./screen-ui";

type UiMode = "estandar" | "simple";
type Theme = "claro" | "oscuro";

/** Ajustes del usuario: modo de interfaz, tema y notificaciones. */
export function PreferencesScreen() {
  const userId = useCanvas((s) => s.userId);
  const setUser = useAuth((s) => s.setUser);

  const [uiMode, setUiMode] = useState<UiMode>("estandar");
  const [theme, setTheme] = useState<Theme>("claro");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setLoading(true);

    getPreferences(userId)
      .then((prefs) => {
        if (!alive) return;
        setUiMode(prefs.uiMode as UiMode);
        setTheme(prefs.theme as Theme);
        setNotificationsEnabled(prefs.notificationsEnabled);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No pude cargar tus preferencias"),
      )
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [userId]);

  function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    patchPreferences(userId, { uiMode, theme, notificationsEnabled })
      .then((user) => {
        setUser(user);
        setSaved(true);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No pude guardar tus preferencias"),
      )
      .finally(() => setSaving(false));
  }

  if (loading) {
    return (
      <ScreenShell title="Preferencias">
        <ScreenNote>Cargando tus preferencias…</ScreenNote>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Preferencias">
      <ScreenSection label="Modo de interfaz">
        <Segmented
          value={uiMode}
          onChange={setUiMode}
          options={[
            { value: "estandar", label: "Estándar" },
            { value: "simple", label: "Simple" },
          ]}
        />
      </ScreenSection>

      <ScreenSection label="Tema">
        <Segmented
          value={theme}
          onChange={setTheme}
          options={[
            { value: "claro", label: "Claro" },
            { value: "oscuro", label: "Oscuro" },
          ]}
        />
      </ScreenSection>

      <ScreenSection label="Notificaciones">
        <Box
          className="liquid-glass"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "var(--radius-l)",
            p: 2,
          }}
        >
          <Typography variant="body1">Avisos del asesor</Typography>
          <Switch
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
          />
        </Box>
      </ScreenSection>

      {error && <ScreenNote tone="bad">{error}</ScreenNote>}
      {saved && !error && <ScreenNote>Preferencias guardadas.</ScreenNote>}

      <PillButton
        label={saving ? "Guardando…" : "Guardar"}
        onClick={save}
        disabled={saving}
        icon={<Check size={16} strokeWidth={2.6} />}
      />
    </ScreenShell>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Box
            key={opt.value}
            component="button"
            type="button"
            onClick={() => onChange(opt.value)}
            sx={{
              flex: 1,
              border: "none",
              cursor: "pointer",
              minHeight: "var(--tap-min)",
              borderRadius: "var(--radius-pill)",
              backgroundColor: active ? TOKENS.tintRed8 : TOKENS.tintInk8,
              color: active ? TOKENS.red : "text.secondary",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {opt.label}
          </Box>
        );
      })}
    </Box>
  );
}
