import Box from "@mui/material/Box";

/**
 * Logotipo Banorte. El activo oficial lo entrega el cliente: `public/logo.png`
 * hoy es un marcador de posición (cuadrado con dos diagonales) y mostrarlo en
 * la cabecera de un banco se lee como imagen rota. Cuando el archivo real
 * sustituya al marcador, apunta `BRAND_LOGO_SRC` a "/logo.png" y el logo
 * aparece en el header y en el riel de escritorio sin tocar nada más.
 */
export const BRAND_LOGO_SRC: string | null = null;

export function BrandLogo({ height = 22, sx }: { height?: number; sx?: object }) {
  if (!BRAND_LOGO_SRC) return null;
  return (
    <Box
      component="img"
      src={BRAND_LOGO_SRC}
      alt="Banorte"
      sx={{ height, width: "auto", display: "block", flexShrink: 0, ...sx }}
    />
  );
}
