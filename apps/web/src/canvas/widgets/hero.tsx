import type { WidgetProps } from "@camaleon/shared";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { EASE_OUT, TOKENS } from "../../app/theme";
import { heroGradient, imageUrl } from "../format";
import { MotionBox, spring, useMotionPrefs, WidgetShell } from "./shell";

/**
 * Portada del lienzo: imagen a sangre + palabra gigante recortada por abajo.
 *
 * Entra con la misma coreografía que el resto (`WidgetShell variant="bare"`)
 * y dentro hace su propio número: la foto se revela cuando carga y la palabra
 * sube desde el borde inferior un paso después. Sin red, el gradiente cálido
 * de la marca es el piso y el hero sigue viéndose intencional.
 */
export function HeroWidget({ props }: { props: WidgetProps["hero"] }) {
  const { t, step } = useMotionPrefs();
  const gradient = heroGradient(props.imageQuery);
  const [photo, setPhoto] = useState<string | null>(null);

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
    <WidgetShell
      variant="bare"
      pad={0}
      sx={{
        height: 200,
        borderRadius: "var(--radius-l)",
        overflow: "hidden",
        backgroundImage: gradient,
        boxShadow: TOKENS.elev2,
      }}
    >
      <MotionBox
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: photo ? 1 : 0, scale: photo ? 1 : 1.06 }}
        transition={t({ duration: 0.6, ease: EASE_OUT })}
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: photo ? `url(${photo})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <Box sx={{ position: "absolute", inset: 0, background: TOKENS.scrimMedia }} aria-hidden />

      <MotionBox
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t({ ...spring, delay: step(3) })}
        className="liquid-glass"
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          maxWidth: "calc(100% - 24px)",
          px: 1.5,
          py: 0.5,
          borderRadius: "var(--radius-pill)",
        }}
      >
        {/* La pastilla es papel sobre la foto: el texto va en tinta. El resto
            del hero (velo y palabra gigante) va en blanco sobre la fotografía. */}
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "text.primary",
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {props.pill}
        </Typography>
      </MotionBox>

      {/* Palabra gigante recortada por abajo. */}
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
          transition={t({ type: "spring", stiffness: 180, damping: 22, delay: step(4) })}
        >
          <Typography
            className="clip-display"
            sx={{
              display: "block",
              color: TOKENS.onDarkDim,
              transform: "translateY(8px)",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {props.title}
          </Typography>
        </MotionBox>
      </Box>
    </WidgetShell>
  );
}
