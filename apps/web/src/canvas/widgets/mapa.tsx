import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { TOKENS } from "../../app/theme";
import { AskPill } from "./bits";
import {
  Label,
  MotionBox,
  MotionButton,
  springSoft,
  Stagger,
  staggerItem,
  WidgetShell,
  WidgetTitle,
} from "./shell";

/**
 * La ruta como mapa real: tiles de OpenStreetMap vía react-leaflet (mismas
 * librerías que expone https://shadcn-map.vercel.app), con paradas numeradas
 * y la polilínea de la ruta encima. No requiere API key.
 */

function numberedIcon(n: number) {
  return L.divIcon({
    className: "camaleon-map-pin",
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      background:${TOKENS.red};box-shadow:${TOKENS.elevPin};
      color:${TOKENS.onDark};font:700 12px system-ui,sans-serif;
    ">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}

/** Ajusta el encuadre del mapa a todas las paradas al montar o al cambiar la ruta. */
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [28, 28] });
  }, [map, positions]);
  return null;
}

export function MapaWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["mapa"];
  onAsk?: (q: string) => void;
}) {
  const positions = useMemo<[number, number][]>(
    () => props.stops.map((s) => [s.lat, s.lng]),
    [props.stops],
  );
  const detail = props.card.ask;

  return (
    <WidgetShell pad={0} sx={{ overflow: "hidden" }}>
      <Box sx={{ px: 2.5, pt: 2.5 }}>
        <WidgetTitle>{props.title}</WidgetTitle>
      </Box>

      <Box sx={{ position: "relative", height: 300, backgroundColor: TOKENS.map }}>
        <MapContainer
          center={positions[0]}
          zoom={11}
          scrollWheelZoom={false}
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          {/* osm-intl: mismas tiles de OSM pero con etiquetas de lugar traducidas
              (Accept-Language del navegador) en vez del idioma local grabado en el tile. */}
          <TileLayer url="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png" />
          <FitBounds positions={positions} />
          <Polyline
            positions={positions}
            pathOptions={{
              color: TOKENS.redDeep,
              weight: 2,
              opacity: 0.7,
              dashArray: "4 6",
            }}
          />
          {props.stops.map((s, i) => (
            <Marker key={`stop-${i}`} position={[s.lat, s.lng]} icon={numberedIcon(s.n)}>
              <Popup closeButton={false} minWidth={180}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {s.label}
                </Typography>
                {s.sublabel && (
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                    {s.sublabel}
                  </Typography>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>

      <Stagger sx={{ px: 2.5, py: 2.25, backgroundColor: "background.paper" }}>
        <MotionBox variants={staggerItem}>
          <Label>{props.card.kicker}</Label>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
              {props.card.title}
            </Typography>
            {props.card.rating && (
              <Typography variant="body2" sx={{ color: "warning.dark", fontWeight: 600 }}>
                {props.card.rating}
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75 }}>
            {props.card.body}
          </Typography>
          {props.card.meta && (
            <Typography
              variant="caption"
              sx={{ color: "text.disabled", display: "block", mt: 0.5 }}
            >
              {props.card.meta}
            </Typography>
          )}
        </MotionBox>

        {detail && (
          <MotionBox variants={staggerItem} sx={{ mt: 1.25 }}>
            <MotionButton
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onAsk?.(detail)}
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, py: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: "primary.dark", fontWeight: 600 }}>
                Ver detalle →
              </Typography>
            </MotionButton>
          </MotionBox>
        )}

        {props.ask && (
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSoft, delay: 0.25 }}
            sx={{ mt: 2 }}
          >
            <AskPill label={props.ask.label} question={props.ask.ask} onAsk={onAsk} variant="ink" />
          </MotionBox>
        )}
      </Stagger>
    </WidgetShell>
  );
}
