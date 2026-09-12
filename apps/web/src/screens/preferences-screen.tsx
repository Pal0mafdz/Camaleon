import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getPreferences, patchPreferences } from "../api/client";
import { TOKENS } from "../app/theme";
import { useAuth } from "../auth/store";
import { useCanvas } from "../canvas/store";
import { MOCK_DATA_SOURCES, parseDataSourceId } from "./mock-data-sources";
import { PillButton } from "./screen-controls";
import { ScreenNote, ScreenSection, ScreenShell } from "./screen-ui";

type UiMode = "estandar" | "simple";
type Theme = "claro" | "oscuro";

/**
 * Ajustes del usuario. La sección "Fuente de datos" es puro mock hoy: elige
 * un warehouse/schema/tabla de mentira, sin conexión real a Snowflake, solo
 * para dejar el campo (`dataSourceId`) listo para cuando esa conexión exista.
 */
export function PreferencesScreen() {
  const userId = useCanvas((s) => s.userId);
  const setUser = useAuth((s) => s.setUser);

  const [uiMode, setUiMode] = useState<UiMode>("estandar");
  const [theme, setTheme] = useState<Theme>("claro");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [warehouseId, setWarehouseId] = useState("");
  const [schemaId, setSchemaId] = useState("");
  const [tableId, setTableId] = useState("");
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
        const parsed = parseDataSourceId(prefs.dataSourceId);
        setWarehouseId(parsed?.warehouseId ?? "");
        setSchemaId(parsed?.schemaId ?? "");
        setTableId(parsed?.tableId ?? "");
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No pude cargar tus preferencias"),
      )
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [userId]);

  const warehouse = MOCK_DATA_SOURCES.find((w) => w.id === warehouseId);
  const schema = warehouse?.schemas.find((s) => s.id === schemaId);
  const dataSourceId =
    warehouseId && schemaId && tableId ? `${warehouseId}.${schemaId}.${tableId}` : null;

  function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    patchPreferences(userId, { uiMode, theme, notificationsEnabled, dataSourceId })
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
      <ScreenShell title="Ajustes">
        <ScreenNote>Cargando tus preferencias…</ScreenNote>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Ajustes">
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

      <ScreenSection label="Fuente de datos (Snowflake)">
        <Typography variant="body2" sx={{ color: "text.secondary", px: 0.5, mb: 0.5 }}>
          Solo de muestra por ahora: cuando se conecte Snowflake, esta selección definirá de dónde
          vienen tus datos.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <MockSelect
            label="Warehouse"
            value={warehouseId}
            onChange={(v) => {
              setWarehouseId(v);
              setSchemaId("");
              setTableId("");
            }}
            options={MOCK_DATA_SOURCES.map((w) => ({ id: w.id, label: w.label }))}
          />
          <MockSelect
            label="Schema"
            value={schemaId}
            onChange={(v) => {
              setSchemaId(v);
              setTableId("");
            }}
            options={warehouse?.schemas.map((s) => ({ id: s.id, label: s.label })) ?? []}
            disabled={!warehouse}
          />
          <MockSelect
            label="Tabla"
            value={tableId}
            onChange={setTableId}
            options={schema?.tables ?? []}
            disabled={!schema}
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

function MockSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <Box>
      <Typography variant="overline" sx={{ display: "block", color: "text.disabled", mb: 0.5 }}>
        {label}
      </Typography>
      <Select
        fullWidth
        displayEmpty
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          backgroundColor: TOKENS.sunken,
          borderRadius: "var(--radius-s)",
          "& .MuiOutlinedInput-notchedOutline": { border: "none" },
        }}
      >
        <MenuItem value="" disabled>
          Elige {label.toLowerCase()}
        </MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.id} value={opt.id}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}
