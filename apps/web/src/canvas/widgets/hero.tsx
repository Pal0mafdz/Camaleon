import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { TOKENS } from "../../app/theme";
import { heroGradient, imageUrl } from "../format";
import { MotionBox, spring, useMotionPrefs } from "./shell";

/**
 * Portada del lienzo: imagen a sangre + palabra gigante recortada por abajo.
 * Es el widget que hace que el jurado diga "wow" en el primer segundo.
 */
export function HeroWidget({ props }: { props: WidgetProps["hero"] }) {
  const { t } = useMotionPrefs();
  const gradient = heroGradient(props.imageQuery);
  const [photo, setPhoto] = useState<string | null>(null);

  // La foto es un lujo, no un requisito: si no carga (sin wifi, host caído)
  // el gradiente se queda y el hero sigue viéndose intencional.
  useEffect(() => {
    let alive = true;
    const url = imageUrl(props.imageQuery);
    const img = new Image();
    img.onload = () => {
      if (alive) setPhoto(url);
    };
    img.src = url;
    return () => {
      alive = false;
      img.onload = null;
    };
  }, [props.imageQuery]);

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, scale: 1.06, filter: "blur(12px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(8px)" }}
      transition={{ ...spring, stiffness: 260 }}
      sx={{
        position: "relative",
        height: 200,
        borderRadius: "var(--radius-l)",
        overflow: "hidden",
        backgroundImage: gradient,
      }}
    >
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: photo ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: photo ? `url(${photo})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: TOKENS.scrimMedia,
        }}
        aria-hidden
      />

      <MotionBox
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, ...spring }}
        className="liquid-glass"
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          px: 1.5,
          py: 0.5,
          borderRadius: 999,
        }}
      >
        {/* La pastilla sigue siendo vidrio claro sobre la foto, pero `.liquid-glass`
            ahora es blanco al 86%: el texto tuvo que pasar a tinta o se perdía.
            El resto del hero (velo oscuro y palabra gigante) se queda en blanco:
            va sobre la fotografía, no sobre el lienzo claro. */}
        <Typography variant="caption" sx={{ color: "text.primary", fontWeight: 600 }}>
          {props.pill}
        </Typography>
      </MotionBox>

      {/* Palabra gigante recortada por abajo, como la referencia. */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 16,
          right: 16,
          height: 76,
          overflow: "hidden",
        }}
      >
        <MotionBox
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={t({ delay: 0.2, type: "spring", stiffness: 180, damping: 22 })}
        >
          <Typography
            className="clip-display"
            sx={{ display: "block", color: TOKENS.onDarkDim, transform: "translateY(8px)" }}
          >
            {props.title}
          </Typography>
        </MotionBox>
      </Box>
    </MotionBox>
  );
}
