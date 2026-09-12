import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ArrowDownRight, ArrowUpRight, X } from "lucide-react";
import { useState } from "react";
import { TOKENS } from "../../app/theme";
import { formatMoney } from "../format";
import { AmountRow, AskPill, Expand, SectionLabel, TapHeader } from "./bits";
import {
  Label,
  MotionBox,
  MotionButton,
  RollingNumber,
  Sparkbars,
  Stagger,
  springSoft,
  staggerItem,
  TapTarget,
  useMotionPrefs,
  WidgetShell,
} from "./shell";

/**
 * El saldo protagonista del inicio. Es la única tarjeta OSCURA del lienzo —
 * la firma del sistema: lo que más importa no compite con nadie.
 *
 * Usa el doble bisel: concha exterior de tinta con reborde superior luminoso y
 * núcleo interior con radio concéntrico (radio exterior − padding). Es lo que
 * la hace leerse como un objeto físico y no como un rectángulo negro.
 */

/**
 * Entra vs. sale como UNA barra, no como dos cifras sueltas.
 *
 * No son partes de un todo: el carril es lo que entra y el relleno es lo que
 * se va. Así la tarjeta responde la pregunta real —"¿cuánto de lo que gano se
 * me va?"— en vez de repetir dos montos que ya viven en el detalle.
 */
function FlowBar({ income, outgo }: { income: number; outgo: number }) {
  const { t } = useMotionPrefs();
  const share = income > 0 ? Math.min(outgo / income, 1) : 0;
  const pct = Math.round(share * 100);
  const tight = pct >= 90;

  return (
    <Box>
      <Box
        sx={{
          height: 10,
          borderRadius: "var(--radius-pill)",
          overflow: "hidden",
          backgroundColor: TOKENS.tintGood12,
          boxShadow: `inset 0 0 0 1px ${TOKENS.tintWhite8}`,
        }}
      >
        <MotionBox
          initial={{ scaleX: 0 }}
          animate={{ scaleX: share }}
          transition={t({ ...springSoft, delay: 0.18 })}
          sx={{
            height: "100%",
            transformOrigin: "left",
            backgroundColor: tight ? TOKENS.badOnDark : TOKENS.goodOnDark,
          }}
        />
      </Box>
      <Typography variant="body2" sx={{ color: TOKENS.onDarkDim, mt: 1 }}>
        Se te va{" "}
        <Box
          component="span"
          sx={{ color: tight ? TOKENS.badOnDark : TOKENS.onDark, fontWeight: 700 }}
        >
          {pct}%
        </Box>{" "}
        de lo que entra
      </Typography>
    </Box>
  );
}

/** Cápsula de entradas o salidas del mes. */ function Capsule({
  label,
  value,
  caption,
  color,
  up,
}: {
  label: string;
  value: number;
  caption?: string;
  color: string;
  up: boolean;
}) {
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <MotionBox
      variants={staggerItem}
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: "var(--radius-m)",
        p: 1.75,
        backgroundColor: TOKENS.tintWhite8,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color }}>
        <Icon size={13} strokeWidth={2.6} />
        <Label dark>{label}</Label>
      </Box>
      <Typography variant="h5" sx={{ color, mt: 0.5, fontVariantNumeric: "tabular-nums" }}>
        {formatMoney(value)}
      </Typography>
      {caption && (
        <Typography
          variant="body2"
          sx={{ color: TOKENS.onDarkFaint, display: "block", mt: 0.25, overflowWrap: "anywhere" }}
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
  const { t } = useMotionPrefs();
  const delta = props.delta ?? 0;
  const bars = props.bars;

  // El agente a veces manda de caption la misma frase que ya cuenta la barra de
  // flujo ("Entran $28,400, salen $23,294"). Imprimir el mismo hecho dos veces
  // hace que la tarjeta se lea como un volcado de datos, así que si la caption
  // repite ambos montos se calla.
  const caption = props.caption;
  const echoesFlow =
    caption !== undefined &&
    caption.includes(formatMoney(props.income.value)) &&
    caption.includes(formatMoney(props.outgo.value));

  return (
    <WidgetShell
      glass={false}
      pad={0}
      sx={{
        backgroundColor: TOKENS.ink,
        boxShadow: `${TOKENS.glossInk}, ${TOKENS.elevInk}`,
        // La firma del lienzo respira más que el resto: el aire extra debajo es
        // lo que la separa en un TIER propio en vez de dejarla como una tarjeta
        // más en una pila de cajas del mismo peso.
        mb: 1,
      }}
    >
      {/* Núcleo del doble bisel: radio concéntrico = --radius-l menos el padding
          de la concha (6px), y su propio brillo superior. */}
      <Box
        sx={{
          m: 0.75,
          p: 2,
          borderRadius: "var(--radius-m)",
          backgroundColor: TOKENS.inkRaised,
          boxShadow: TOKENS.glossInk,
        }}
      >
        <TapHeader expanded={open} onToggle={() => setOpen((v) => !v)}>
          <Label dark>{props.label}</Label>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", mt: 0.5 }}>
            <RollingNumber
              value={props.value}
              format={(n) => formatMoney(n)}
              variant="h2"
              sx={{ color: TOKENS.onDark, fontSize: 42 }}
            />
            {delta > 0 && (
              <MotionBox
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={t({ ...springSoft, delay: 0.18 })}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.25,
                  px: 1,
                  py: 0.375,
                  borderRadius: "var(--radius-pill)",
                  color: TOKENS.goodOnDark,
                  backgroundColor: TOKENS.tintGood12,
                }}
              >
                <ArrowUpRight size={13} strokeWidth={2.8} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {formatMoney(delta)} / mes
                </Typography>
              </MotionBox>
            )}
          </Box>

          {bars.length > 1 && (
            <Box sx={{ mt: 2.5 }}>
              <SectionLabel dark>Cómo vienes</SectionLabel>
              <Sparkbars
                values={bars}
                color={TOKENS.red}
                dark
                axis={{
                  start: formatMoney(bars[0] as number),
                  end: formatMoney(bars[bars.length - 1] as number),
                }}
              />
            </Box>
          )}

          <Box sx={{ mt: 2.5 }}>
            <FlowBar income={props.income.value} outgo={props.outgo.value} />
          </Box>

          {caption && !echoesFlow && (
            <Typography
              variant="body2"
              sx={{ color: TOKENS.onDarkDim, mt: 1.25, overflowWrap: "anywhere" }}
            >
              {caption}
            </Typography>
          )}
        </TapHeader>

        <Expand open={open}>
          <Stagger sx={{ pt: 2.5 }}>
            <Box sx={{ display: "flex", gap: 1.25 }}>
              <Capsule
                label={props.income.label}
                value={props.income.value}
                caption={props.income.caption}
                color={TOKENS.goodOnDark}
                up
              />
              <Capsule
                label={props.outgo.label}
                value={props.outgo.value}
                caption={props.outgo.caption}
                color={TOKENS.badOnDark}
                up={false}
              />
            </Box>

            {props.movements.length > 0 && (
              <MotionBox variants={staggerItem} sx={{ mt: 2.5 }}>
                <SectionLabel dark>Movimientos grandes del mes</SectionLabel>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {props.movements.map((m) => (
                    <AmountRow
                      key={m.label}
                      label={m.label}
                      amount={formatMoney(m.amount)}
                      color={TOKENS.badOnDark}
                      dark
                    />
                  ))}
                </Box>
              </MotionBox>
            )}

            {props.ask && (
              <MotionBox variants={staggerItem} sx={{ mt: 2.5 }}>
                <AskPill label={props.ask.label} question={props.ask.ask} onAsk={onAsk} />
              </MotionBox>
            )}
          </Stagger>
        </Expand>
      </Box>

      {open && (
        <MotionButton
          type="button"
          aria-label="Cerrar detalle"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={t(springSoft)}
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(false)}
          sx={{
            ...TapTarget,
            position: "absolute",
            top: 6,
            right: 6,
            borderRadius: "var(--radius-pill)",
            color: TOKENS.onDarkDim,
          }}
        >
          <X size={16} />
        </MotionButton>
      )}
    </WidgetShell>
  );
}
