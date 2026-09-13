import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useLayoutMode } from "../../app/app-shell";
import { TOKENS } from "../../app/theme";
import { activeUser } from "../canvas-header";
import { formatMoney } from "../format";
import { useCanvas } from "../store";
import { AmountRow, AskPill, Expand, SectionLabel, TapHeader } from "./bits";
import {
  Chip,
  Hologram,
  IngotCore,
  Label,
  MotionBox,
  MotionButton,
  RollingNumber,
  Sparkline,
  Stagger,
  spring,
  springSoft,
  staggerItem,
  useMotionPrefs,
  WidgetShell,
} from "./shell";

/**
 * LA TARJETA ROJA. La única superficie de color del lienzo: el saldo como
 * tarjeta Banorte física. `WidgetShell variant="ink"` la entrega inclinada y
 * la apoya; el holograma barre una vez cuando se asienta; la cifra en relieve
 * rueda después (`delay`), así el ojo llega cuando el número arranca.
 *
 * Chip = de dónde salen los datos (abre la actividad MCP; sus contactos se
 * iluminan mientras corre una herramienta). Holograma = dato vivo (barre en
 * bucle mientras el agente trabaja). Abajo, como en la tarjeta real: el
 * nombre del titular y la moneda.
 *
 * Composición: una cifra (saldo), un dato de apoyo (cuánto se va de lo que
 * entra), una acción (la pregunta al agente, en el detalle).
 */

/** Entra vs. sale como UNA barra: el carril es lo que entra y el relleno lo que se va. */
function FlowBar({ income, outgo, delay }: { income: number; outgo: number; delay: number }) {
  const { t } = useMotionPrefs();
  const share = income > 0 ? Math.min(outgo / income, 1) : 0;
  const pct = Math.round(share * 100);
  const tight = pct >= 90;
  const empty = income <= 0 && outgo <= 0;

  if (empty) {
    return (
      <Typography variant="body2" sx={{ color: TOKENS.onDarkDim }}>
        Aún no hay movimientos este mes.
      </Typography>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          height: 8,
          borderRadius: "var(--radius-2xs)",
          overflow: "hidden",
          backgroundColor: TOKENS.tintWhite24,
        }}
      >
        <MotionBox
          initial={{ scaleX: 0 }}
          animate={{ scaleX: share }}
          transition={t({ ...springSoft, delay })}
          sx={{
            height: "100%",
            transformOrigin: "left",
            borderRadius: "var(--radius-2xs)",
            backgroundColor: tight ? TOKENS.badOnDark : TOKENS.onDark,
          }}
        />
      </Box>
      <Typography variant="body2" sx={{ color: TOKENS.onDarkDim, mt: 1, fontWeight: 500 }}>
        Se te va{" "}
        <Box
          component="span"
          sx={{
            color: TOKENS.onDark,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pct}%
        </Box>{" "}
        de lo que entra
      </Typography>
    </Box>
  );
}

/** Cápsula de entradas o salidas del mes: panel translúcido sobre el granate. */
function Capsule({
  label,
  value,
  caption,
  up,
}: {
  label: string;
  value: number;
  caption?: string;
  up: boolean;
}) {
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const color = up ? TOKENS.goodOnDark : TOKENS.badOnDark;

  return (
    <MotionBox
      variants={staggerItem}
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: "var(--radius-m)",
        p: 1.75,
        backgroundColor: TOKENS.tintWhite14,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color }}>
        <Icon size={13} strokeWidth={2.6} aria-hidden />
        <Label dark>{label}</Label>
      </Box>
      <Typography
        variant="h5"
        sx={{
          color: TOKENS.onDark,
          mt: 0.5,
          fontVariantNumeric: "tabular-nums",
          overflowWrap: "anywhere",
        }}
      >
        {formatMoney(value)}
      </Typography>
      {caption && (
        <Typography
          variant="body2"
          sx={{ color: TOKENS.onDarkDim, display: "block", mt: 0.25, overflowWrap: "anywhere" }}
        >
          {caption}
        </Typography>
      )}
    </MotionBox>
  );
}

export function BalanceWidget({
  props,
  onAsk,
}: {
  props: WidgetProps["balance"];
  onAsk?: (q: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { t, step } = useMotionPrefs();
  const layout = useLayoutMode();
  const userId = useCanvas((s) => s.userId);
  const busy = useCanvas((s) => s.status !== null);
  const toolRunning = useCanvas((s) => s.mcp.some((a) => a.status === "running"));
  const togglePanel = useCanvas((s) => s.togglePanel);
  const panelOpen = useCanvas((s) => s.panelOpen);
  const holder = activeUser(userId).name;

  const delta = props.delta ?? 0;
  const bars = props.bars;
  const caption = props.caption;
  const echoesFlow =
    caption !== undefined &&
    [props.income.value, props.outgo.value].every((v) => caption.includes(formatMoney(v)));

  // En escritorio el log MCP vive fijo en el riel: el chip no abre nada.
  const chipOpens = layout !== "wide";

  return (
    <WidgetShell variant="ink" pad={0} sx={{ mb: 1 }}>
      <IngotCore sx={{ pt: 2 }}>
        {/* Fila de la tarjeta: chip a la izquierda, holograma a la derecha. */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {chipOpens ? (
            <MotionButton
              type="button"
              onClick={togglePanel}
              whileTap={{ scale: 0.94 }}
              transition={t(spring)}
              aria-label="Ver de dónde salen estos datos (actividad MCP)"
              aria-expanded={panelOpen}
              sx={{
                minHeight: "var(--tap-min)",
                minWidth: "var(--tap-min)",
                display: "inline-flex",
                alignItems: "center",
                gap: 1.25,
                ml: -0.5,
                pl: 0.5,
                pr: 1,
                borderRadius: "var(--radius-s)",
              }}
            >
              <Chip active={toolRunning} />
              <Typography
                variant="caption"
                sx={{ color: TOKENS.onDarkFaint, fontWeight: 600, letterSpacing: "0.04em" }}
              >
                {toolRunning ? "Leyendo tu cuenta…" : "Vía MCP Banorte"}
              </Typography>
            </MotionButton>
          ) : (
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, minHeight: 44 }}>
              <Chip active={toolRunning} />
              <Typography
                variant="caption"
                sx={{ color: TOKENS.onDarkFaint, fontWeight: 600, letterSpacing: "0.04em" }}
              >
                {toolRunning ? "Leyendo tu cuenta…" : "Vía MCP Banorte"}
              </Typography>
            </Box>
          )}
          <Hologram sweeping={busy} delay={step(2)} width={48} height={32} />
        </Box>

        <TapHeader expanded={open} onToggle={() => setOpen((v) => !v)} hint dark sx={{ mt: 1.5 }}>
          <Label dark>{props.label}</Label>

          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              columnGap: 1.25,
              rowGap: 0.75,
              flexWrap: "wrap",
              mt: 0.5,
              minWidth: 0,
            }}
          >
            <RollingNumber
              value={props.value}
              format={(n) => formatMoney(n)}
              variant="h2"
              className="ingot-figure embossed"
              delay={step(3)}
              sx={{ color: TOKENS.onDark, minWidth: 0, overflowWrap: "anywhere" }}
            />
            {delta > 0 && (
              <MotionBox
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={t({ ...springSoft, delay: step(5) })}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.25,
                  px: 1,
                  py: 0.375,
                  borderRadius: "var(--radius-xs)",
                  color: TOKENS.onDark,
                  backgroundColor: TOKENS.tintWhite14,
                }}
              >
                <ArrowUpRight size={13} strokeWidth={2.8} aria-hidden />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
                >
                  {formatMoney(delta)} / mes
                </Typography>
              </MotionBox>
            )}
          </Box>

          {bars.length > 1 && (
            <Box sx={{ mt: 2.5 }}>
              <Sparkline
                values={bars}
                color={TOKENS.onDark}
                dark
                height={52}
                delay={step(4)}
                axis={{
                  start: formatMoney(bars[0] as number),
                  end: formatMoney(bars[bars.length - 1] as number),
                }}
              />
            </Box>
          )}

          <Box sx={{ mt: 2.25 }}>
            <FlowBar income={props.income.value} outgo={props.outgo.value} delay={step(4)} />
          </Box>

          {caption && !echoesFlow && (
            <Typography
              variant="body2"
              sx={{ color: TOKENS.onDarkDim, mt: 1.25, overflowWrap: "anywhere" }}
            >
              {caption}
            </Typography>
          )}

          {/* Pie de la tarjeta física: titular y moneda. */}
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 2,
              mt: 2.5,
              minWidth: 0,
            }}
          >
            <Typography
              variant="caption"
              className="embossed"
              sx={{
                color: TOKENS.onDark,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {holder}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: TOKENS.onDarkFaint,
                fontWeight: 700,
                letterSpacing: "0.12em",
                flexShrink: 0,
              }}
            >
              MXN · BANORTE
            </Typography>
          </Box>
        </TapHeader>

        <Expand open={open}>
          <Stagger sx={{ pt: 2.5 }}>
            <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
              <Capsule
                label={props.income.label}
                value={props.income.value}
                caption={props.income.caption}
                up
              />
              <Capsule
                label={props.outgo.label}
                value={props.outgo.value}
                caption={props.outgo.caption}
                up={false}
              />
            </Box>

            <MotionBox variants={staggerItem} sx={{ mt: 2.5 }}>
              <SectionLabel dark>Movimientos grandes del mes</SectionLabel>
              {props.movements.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {props.movements.map((m) => (
                    <AmountRow
                      key={m.label}
                      label={m.label}
                      amount={formatMoney(m.amount)}
                      color={m.amount < 0 ? TOKENS.badOnDark : TOKENS.goodOnDark}
                      dark
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: TOKENS.onDarkDim }}>
                  Ningún cargo grande todavía. Buen mes.
                </Typography>
              )}
            </MotionBox>

            {props.ask && (
              <MotionBox variants={staggerItem} sx={{ mt: 2.5 }}>
                <AskPill
                  label={props.ask.label}
                  question={props.ask.ask}
                  onAsk={onAsk}
                  variant="paper"
                />
              </MotionBox>
            )}
          </Stagger>
        </Expand>
      </IngotCore>
    </WidgetShell>
  );
}
