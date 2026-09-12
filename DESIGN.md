# Camaleón × Banorte — Design System

Contrato de implementación. Ningún componente se escribe sin leer este archivo.
Todo color, tamaño de fuente, espacio, radio, sombra y curva de movimiento del
frontend (`apps/web`) traza de vuelta a un token de aquí.

**Referencias consultadas** (proyecto existente, extracción + elevación — no greenfield):

- Layer A: `soft-skill.md` → arquetipo **Soft Structuralism** (fondo claro, tipografía
  grotesca grande, componentes flotantes con sombra ambiental muy difusa). De ahí salen
  la prohibición de Inter, el doble bisel (concha + núcleo), el pill CTA con icono
  anidado, la curva `cubic-bezier(0.32,0.72,0,1)` y la regla de que `backdrop-filter`
  solo vive en elementos fijos.
- Layer B: `revolut.md` → disciplina de fintech móvil: pastilla universal con padding
  generoso, tracking negativo agresivo en display contra tracking positivo en cuerpo,
  anillo de foco explícito, escala de radios 12 / 20 / 9999.
- Mecánica: `layout-skill.md` → propiedad del scroll (`scroll-body-shell`), contrato
  `minmax(0,1fr)` + `min-block-size: 0`, y la matriz de estrés de contenido.
- Identidad de marca: **no se toma de las referencias**. El rojo PMS Red 032 C, el café
  PMS 7532 C y la arena cálida ya existían en el proyecto y son la marca real de Banorte.

---

## 1. Atmósfera e identidad

Camaleón se siente como **papel caro sobre una mesa de luz**: una hoja de arena cálida
donde las tarjetas flotan por sombra difusa, nunca por borde duro. No hay pantallas ni
menús — el lienzo se construye solo mientras el asesor razona, así que la jerarquía la
carga el contenido, no la navegación.

**La firma** es el *contraste de un solo objeto oscuro*: absolutamente todo el lienzo es
blanco cálido flotando sobre arena, excepto **una** tarjeta de tinta (el saldo) que
concentra la atención como un lingote sobre la mesa. Esa tarjeta es la única superficie
con doble bisel — concha exterior con reborde interior luminoso y núcleo con radio
concéntrico — y es el momento que el usuario recuerda.

El rojo Banorte nunca decora: solo marca lo que se puede tocar o lo que urge.

---

## 2. Color

Definidos en `apps/web/src/index.css` como custom properties y re-exportados a MUI en
`apps/web/src/app/theme.ts` (`TOKENS`). **Prohibido escribir un hex o un `rgba()` fuera
de esos dos archivos.**

### Marca

| Rol | Token CSS | Valor | Uso |
|---|---|---|---|
| Rojo Banorte | `--brand-red` | `#EF2945` | Relleno de acción, números grandes, acento |
| Rojo profundo | `--brand-red-deep` | `#C4102A` | Texto rojo pequeño (AA sobre blanco), trazos finos |
| Café corporativo | `--brand-brown` | `#684D3D` | Segunda categoría de datos, acento cálido |

### Superficies

| Rol | Token | Valor | Uso |
|---|---|---|---|
| Lienzo | `--surface-canvas` | `#F4F1EE` | Fondo de la app (arena cálida) |
| Lienzo hundido | `--surface-sunken` | `#EBE5E0` | Rieles de barra, filas hundidas, tracks |
| Tarjeta | `--surface-card` | `#FFFFFF` | Toda tarjeta del catálogo |
| Flotante | `--surface-floating` | `rgba(255,255,255,0.86)` | Header, command bar, hoja MCP (**solo fijos**) |
| Tinta | `--surface-ink` | `#241C17` | La tarjeta protagonista (saldo) |
| Tinta elevada | `--surface-ink-raised` | `#33291F` | Núcleo interior del doble bisel oscuro |
| Mapa | `--surface-map` | `#E8EDE4` | Plano del widget `mapa` |
| Velo del lienzo | `--canvas-veil` | `rgba(244,241,238,0.82)` | Header una vez que hay scroll debajo |

### Medios (foto y gradiente)

Sobre fotografía no hay tokens de tinta que sirvan: el texto va en blanco y lo que
garantiza el contraste es el velo. Un único velo para todas las superficies con imagen,
para que el hero y la ficha de destino se lean como el mismo material:

| Rol | Token | Valor |
|---|---|---|
| Velo sobre foto | `--scrim-media` | `linear-gradient(180deg, rgba(0,0,0,.34) 0%, rgba(0,0,0,.04) 45%, rgba(0,0,0,.60) 100%)` |

`--hero-ramp-1` … `--hero-ramp-5` son los gradientes de respaldo del hero y de la franja
de `listing`. Van **debajo** de la foto y de su velo, así que siguen siendo profundos y
saturados aunque el resto de la app sea claro. La familia es cálida (rojo → vino → café →
ámbar → ciruela): nada frío ni neón, para que el hero se lea Banorte incluso sin red.
El hero SIEMPRE se ve intencional aunque no cargue la imagen remota.


### Tinta (texto)

| Rol | Token | Valor | Uso |
|---|---|---|---|
| Primaria | `--ink` | `#241C17` | Títulos, cuerpo |
| Secundaria | `--ink-dim` | `#6E625A` | Descripciones, captions |
| Terciaria | `--ink-faint` | `#A79C94` | Rótulos, deshabilitado |
| Sobre oscuro | `--ink-on-dark` | `#FFFFFF` | Texto sobre `--surface-ink` |
| Sobre oscuro dim | `--ink-on-dark-dim` | `rgba(255,255,255,0.62)` | Captions sobre tinta |
| Sobre oscuro faint | `--ink-on-dark-faint` | `rgba(255,255,255,0.42)` | Rótulos sobre tinta |

### Semántica

| Rol | Relleno | Texto ≤15px | Sobre tinta |
|---|---|---|---|
| Bien | `--good` `#0E9F6E` | `--good-ink` `#076B4C` | `--good-on-dark` `#3DDCA5` |
| Cuidado | `--warn` `#C2610A` | `--warn-ink` `#8F4708` | — |
| Mal | `--bad` `#D92D20` | `--bad-ink` `#B42318` | `--bad-on-dark` `#FF8A9B` |

Los tonos vivos NO pasan AA (4.5:1) a 15px sobre blanco: el rojo Banorte da 4.14:1 y el
verde 3.39:1. Sirven como relleno, icono o número grande; **para texto pequeño se usa
siempre la variante `-ink`**. Esa es la razón de existir de `toneColor()` vs `toneInk()`
en `canvas/format.ts`.

### Rampa de datos (gráficas)

`--viz-1` … `--viz-7`: `#EF2945` `#684D3D` `#C97C10` `#2D4E8A` `#1F6F5C` `#B4527F` `#8C7F76`.
La primera rebanada siempre es el rojo Banorte; el resto alterna claro/oscuro para que
dos gajos vecinos nunca se confundan. Todos superan 3:1 contra blanco (WCAG 1.4.11).

### Servidores MCP

Cada servidor tiene una identidad de color en el log. Sobre la hoja blanca se usan los
tonos profundos (AA a 12px); sobre el riel de tinta del escritorio hacen falta las
variantes claras o el nombre desaparece.

| Servidor | Sobre claro | Sobre tinta |
|---|---|---|
| `banorte` | `--brand-red-deep` | `--srv-banorte-on-dark` `#FF9AA8` |
| `research` | `--srv-research` `#2D4E8A` | `--srv-research-on-dark` `#9DB8E8` |
| `canvas` | `--ink-dim` | `--ink-on-dark-dim` |

### Tintes (reemplazan los `rgba()` sueltos)

Escala perceptual, no valores inventados caso por caso:

`--tint-ink-3` `--tint-ink-5` `--tint-ink-8` `--tint-ink-12` `--tint-ink-20` `--tint-ink-32`
→ `rgba(36,28,23, .03 / .05 / .08 / .12 / .20 / .32)`

`--tint-red-8` `--tint-red-14` `--tint-red-32` · `--tint-good-12` · `--tint-warn-10` ·
`--tint-bad-08` · `--tint-white-08` `--tint-white-14` `--tint-white-55`

### Reglas

- El acento rojo es **solo** para elementos interactivos o alertas. Nunca decorativo.
- La profundidad la da la sombra ambiental, no el color de fondo (ver §7).
- Ningún color nuevo entra al código sin entrar antes a esta tabla.

---

## 3. Tipografía

### Familias

- **UI + display**: `Plus Jakarta Sans` (variable 200–800), vía Google Fonts.
  Sustituye a Inter, que está prohibida por `soft-skill.md` y además hacía que la app
  se leyera como un dashboard genérico. Plus Jakarta Sans es geométrica-humanista,
  cálida, con cobertura Latin Extended completa (acentos y `¿ ¡` del copy en español)
  y cifras tabulares reales.
- **Mono**: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` (stack del
  sistema, cero descarga). Solo para identificadores literales de herramientas MCP.

Dos familias. La mono es del sistema, así que el proyecto descarga **un** webfont.

### Escala

| Nivel | Token | Tamaño | Peso | LH | Tracking | Uso |
|---|---|---|---|---|---|---|
| Hero | `--type-hero` | 76px | 800 | 0.92 | -0.05em | Palabra recortada sobre foto |
| Display L | `h1` | 44px | 800 | 1.0 | -0.045em | Saludo del estado vacío |
| Display M | `h2` | 36px | 700 | 1.02 | -0.04em | Saldo, mensualidad, cifra protagonista |
| Display S | `h3` | 28px | 700 | 1.08 | -0.03em | Cifra secundaria |
| Title L | `h4` | 22px | 700 | 1.18 | -0.025em | Titular de opción / precio |
| Title M | `h5` | 18px | 600 | 1.28 | -0.015em | Título de tarjeta, estado |
| Title S | `h6` | 15px | 600 | 1.35 | -0.01em | Título de alerta (AA a 15px) |
| Body | `body1` | 15px | 400 | 1.55 | 0.005em | Texto por defecto |
| Body S | `body2` | 13.5px | 400 | 1.5 | 0.01em | Secundario, captions largos |
| Label | `caption` | 12px | 600 | 1.35 | 0.015em | Metadatos, pastillas |
| Overline | `overline` | 10.5px | 700 | 1.3 | 0.14em | Rótulos en versalitas |
| Button | `button` | 14.5px | 600 | 1 | 0.005em | CTAs (sin `text-transform`) |

### Reglas

- **Tracking en espejo** (de Revolut): display comprime hasta `-0.05em`; cuerpo se abre
  a `+0.005/0.01em`. Ese contraste es lo que hace que los números se lean como dinero y
  el texto como conversación.
- Cifras: `font-variant-numeric: tabular-nums` en TODO número que cambie o se alinee.
- Cuerpo nunca por debajo de 13.5px. Rótulos en versalitas nunca por debajo de 10.5px.
- Ningún `fontSize` literal en un componente: se usa la variante de MUI o `--type-hero`.

---

## 4. Espaciado y layout

### Unidad base

MUI `spacing = 8px`; la escala de intención vive en pasos de 4px (`0.5` = 4px).

| Token sx | px | Uso |
|---|---|---|
| `0.5` | 4 | Icono↔rótulo |
| `1` | 8 | Grupos en línea, gap de chips |
| `1.5` | 12 | Filas de lista |
| `2` | 16 | Padding compacto, gap del lienzo |
| `2.5` | 20 | **Padding por defecto de tarjeta** |
| `3` | 24 | Separación entre bloques de una tarjeta |
| `4` | 32 | Separación entre grupos |
| `6` | 48 | Respiro de sección |

### Shell y propiedad del scroll

`scroll-body-shell` (de `layout-skill.md`):

```
grid-template-rows: auto minmax(0, 1fr);   /* header fijo / lienzo */
block-size: 100dvb;                        /* nunca 100vh */
```

- **Un solo dueño del scroll por región**: el lienzo (`.canvas-scroll`). El header es una
  fila fija del grid; la command bar y la hoja MCP son capas `absolute` **fuera** del flujo
  del scroll.
- El hijo scrolleable lleva `min-block-size: 0`, o el grid se niega a encoger y el
  contenido empuja la barra fuera de pantalla.
- La command bar flota sobre el lienzo (patrón iOS). Para que el contenido nunca se corte
  en seco debajo: `--dock-clearance` de padding inferior en el scroller **más** un
  degradado (`.dock-scrim`) que disuelve el contenido hacia el fondo arena.

### Breakpoints (por estado de layout, no por dispositivo)

| Nombre | Ancho | Layout |
|---|---|---|
| `compact` | < 640px | App a pantalla completa con safe areas. Sin marco. |
| `medium` | 640–1023px | Columna centrada, `max-inline-size: 480px`, altura completa. |
| `wide` | ≥ 1024px | **Workspace de dos paneles**: riel de marca + registro MCP a la izquierda, superficie de la app a la derecha. |

En `wide` la app **no** se envuelve en un marco de teléfono de juguete: se presenta como
una superficie de producto elevada, y el espacio libre se usa para el log MCP en vivo
(que en móvil vive en una hoja) — información real, no relleno.

### Reglas

- Se tokeniza la *intención* (paso de espacio, medida, gutter). La *mecánica* del
  navegador (`auto`, `%`, `clamp()`, `min()`, `minmax()`, `dvb`) se queda cruda.
- A 375px todo reflowa a una columna legible sin scroll horizontal.

---

## 5. Componentes

### `AppShell` — `app/app-shell.tsx`

- **Estructura**: `<div data-layout="compact|medium|wide">` → (riel opcional) + `<main class="app-surface">`.
- **Variantes**: compact / medium / wide (§4).
- **Layout**: `cover` en compact/medium; `sidebar` en wide (aside de basis fija, main fluido).
- **Estados**: n/a (no interactivo).
- **Movimiento**: la superficie entra con `opacity` + `translateY` una sola vez.
- **Accesibilidad**: el riel de `wide` es `<aside>`; la superficie es `<main>`.

### `Surface` (`WidgetShell`) — `canvas/widgets/shell.tsx`

- **Estructura**: `motion(Box)` con `border-radius: --radius-l`, `padding: --space-card`.
- **Variantes**: `card` (blanca, por defecto) · `ink` (la del saldo, doble bisel) ·
  `bare` (sin superficie: el widget dibuja sus propias tarjetas hijas).
- **Espaciado**: padding `2.5` por defecto; radio interior concéntrico = `--radius-l − padding`.
- **Estados**: default · pressed (`scale .985`, solo si es tocable) · focus-visible (anillo §8) ·
  entrada (blur→foco) · salida (sube y se desenfoca).
- **Accesibilidad**: si es tocable es un `<button>` real (`TapHeader`), nunca un div con `onTap`.
- **Movimiento**: `spring` (§6). Con `prefers-reduced-motion` se colapsa a un fade de 1 frame.
- **Profundidad**: `--elev-1` en reposo (§7). **Sin `backdrop-filter`** — está dentro del scroller.

### `TapHeader` / `Expand` — `canvas/widgets/bits.tsx`

Expandir es un gesto, no una navegación: la tarjeta crece **en su sitio** y el resto del
lienzo se acomoda con el mismo muelle. Nada interactivo puede vivir dentro de `TapHeader`
(es un `<button>`), así que los controles del detalle van en la zona expandida.
`Expand` anima `height: auto` con `overflow: hidden`.

### `AskPill` — `canvas/widgets/bits.tsx`

- **Estructura**: pastilla de ancho completo, `min-block-size: --tap-min`, con el `→`
  **anidado en su propio círculo** (patrón button-in-button de `soft-skill.md`), nunca desnudo.
- **Variantes**: `red` (acción principal) · `ink` (contrapeso neutro).
- **Estados**: default · pressed (`scale .97`, el círculo interno avanza 2px) · focus-visible.

### `Tone*` (`TonePill`, `Meter`, `Bar`) — `canvas/widgets/bits.tsx`

Semántica → color por `toneColor()` (relleno) y `toneInk()` (texto). `Meter` es el track
hundido + relleno animado que comparten `health`, `alert`, `daily`, `donut`, `plan`, `gap`.

### `CommandBar` — `canvas/command-bar.tsx`

- **Estructura**: `<form>` flotante, `--radius-pill`, `--surface-floating` + `backdrop-filter`
  (permitido: es fija). Micrófono (44px) · `InputBase` · botón enviar/detener (44px).
- **Estados**: idle · con texto (el botón enviar se activa) · escuchando (el micro late) ·
  ocupado (enviar → detener, con rotación) · focus-within (anillo en toda la barra).
- **Accesibilidad**: `aria-label` en ambos botones; `inputProps.aria-label` en el campo;
  ambos botones ≥ 44×44.

### `McpPanel` / `McpBadge` — `canvas/mcp-panel.tsx`

Hoja inferior arrastrable en compact/medium; en `wide` el mismo log se pinta fijo en el
riel izquierdo. Estados de fila: `running` (spinner) · `ok` (check) · `error` (cruz).

### `HeroMedia` — usado por `hero` y `destination`

Gradiente determinista de respaldo + foto remota encima solo si carga. El gradiente es el
piso: sin red el hero se sigue viendo intencional.

---

## 6. Movimiento e interacción

### Curvas y tiempos

| Tipo | Duración | Curva | Uso |
|---|---|---|---|
| Micro | 120ms | `--ease-ios` | Press, cambio de chip |
| Estándar | 240ms | `--ease-ios` | Expandir, aparecer pastilla |
| Énfasis | 480ms | `--ease-out` | Entrada de hoja, hero |

`--ease-ios: cubic-bezier(0.32, 0.72, 0, 1)` · `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`.
Prohibido `linear` y `ease-in-out`.

### Muelles (`motion/react`)

| Nombre | Config | Uso |
|---|---|---|
| `spring` | stiffness 400 · damping 25 · mass 0.6 | Press, entrada de widget, morph de icono |
| `springSoft` | stiffness 220 · damping 28 | Expandir, barras, hojas |
| `springNumber` | stiffness 90 · damping 20 · mass 0.8 | `RollingNumber` |

### Reglas

- Solo se animan `transform`, `opacity` y `filter`. Nunca `width`, `height`, `top`, `left`.
  Excepción consciente: `Expand` anima `height` porque `auto` no tiene equivalente en
  transform y el contenido debe empujar el lienzo (documentado como deuda, §8).
- Toda animación tiene significado: comunica un cambio de estado, una afordancia o la
  llegada de un dato. Un hover que no cambia nada es slop y no se agrega.
- **`prefers-reduced-motion`**: `useMotionPrefs()` colapsa los tres muelles a
  `duration: 0` y apaga los bucles infinitos (latido del badge, pulso del micro,
  spinner → punto estático). El contenido nunca se pierde, solo deja de moverse.
- Los bucles infinitos solo existen mientras hay trabajo real corriendo (agente pensando,
  herramienta MCP en vuelo, dictado activo). Nunca decorativos.
- `backdrop-filter` **solo** en elementos fijos (header, command bar, hoja MCP). Aplicarlo
  a tarjetas dentro del scroller causa repintado continuo de GPU y tirones en móvil.

---

## 7. Profundidad y superficie

**Estrategia elegida: sombra ambiental difusa teñida de tinta cálida** (Soft Structuralism).
Nada de bordes grises genéricos de 1px, nada de sombras negras duras.

| Nivel | Token | Valor | Uso |
|---|---|---|---|
| Hairline | `--elev-hairline` | `inset 0 0 0 1px var(--tint-ink-5)` | Anillo de contorno (no borde) |
| 1 | `--elev-1` | `0 1px 2px -1px rgba(36,28,23,.10), 0 8px 20px -10px rgba(36,28,23,.16)` | Tarjeta en reposo |
| 2 | `--elev-2` | `0 2px 4px -2px rgba(36,28,23,.10), 0 16px 36px -16px rgba(36,28,23,.22)` | Tarjeta destacada |
| 3 | `--elev-3` | `0 4px 10px -4px rgba(36,28,23,.12), 0 28px 60px -24px rgba(36,28,23,.30)` | Command bar, hoja, superficie de la app |
| Tinta | `--elev-ink` | `0 2px 8px -3px rgba(36,28,23,.34), 0 26px 54px -22px rgba(36,28,23,.46)` | La tarjeta oscura |
| Pin | `--elev-pin` | `0 2px 8px -1px rgba(196,16,42,.34)` | Chincheta del mapa (sombra teñida de marca) |
| Brillo | `--gloss-light` / `--gloss-ink` | `inset 0 1px 0 rgba(255,255,255,.62)` / `inset 0 1px 0 rgba(255,255,255,.09)` | Reborde superior del doble bisel |

Toda sombra combina **un contacto corto** y **una ambiental larga y difusa**: es lo que
hace que la tarjeta se lea como un objeto sobre una mesa y no como un rectángulo con
`box-shadow`.

### Doble bisel (solo la tarjeta de tinta)

Concha exterior (`--surface-ink` + `--elev-ink` + `--gloss-ink`, radio `--radius-l`),
núcleo interior (`--surface-ink-raised`, radio concéntrico `--radius-l − padding`).

### Radios

| Token | Valor | Uso |
|---|---|---|
| `--radius-xs` | 10px | Barras, puntos del calendario |
| `--radius-s` | 14px | Filas hundidas, chips grandes |
| `--radius-m` | 18px | Núcleo concéntrico, cápsulas internas |
| `--radius-l` | 24px | **Tarjeta** |
| `--radius-xl` | 32px | Hoja MCP, superficie de la app |
| `--radius-pill` | 999px | Todo botón, toda pastilla |

Regla concéntrica: radio interior = radio exterior − padding.

---

## 8. Accesibilidad y deuda aceptada

### Restricciones

- **WCAG 2.2 AA.** Contraste ≥ 4.5:1 en texto ≤ 18px, ≥ 3:1 en texto grande y en objetos
  gráficos (rebanadas, barras, anillos). De ahí el par `toneColor` / `toneInk`.
- **Objetivo táctil ≥ 44×44 CSS px** (`--tap-min`) en TODO control: micro, enviar, detener,
  cerrar hoja, cambiar usuario, chips, opciones de plazo. Se permite que el área visible
  sea menor si el área tocable llega a 44 por padding.
- **Foco visible en todo elemento interactivo**: `--focus-ring` =
  `0 0 0 2px var(--surface-card), 0 0 0 4px var(--tint-red-32)`, aplicado por
  `:focus-visible` global. `BareButton` quita el outline nativo, así que el anillo es
  obligatorio y global, no por componente.
- **Teclado**: toda tarjeta expandible es `<button aria-expanded>`; las opciones que abren
  un turno del agente son `<button>`; nada interactivo dentro de otro botón.
- **`prefers-reduced-motion` respetado** (§6).
- **Safe areas**: `env(safe-area-inset-*)` en header (top) y command bar (bottom) para
  notch y barra de gestos.
- **Teclado virtual**: `interactive-widget=resizes-content` en el `<meta viewport>` +
  alturas en `dvb`, para que la command bar suba con el teclado en vez de quedar tapada.
- **Idioma**: `<html lang="es">`.

### Deuda aceptada

| Item | Ubicación | Por qué se acepta | Salida |
|---|---|---|---|
| `Expand` anima `height` (propiedad de layout) | `canvas/widgets/bits.tsx` | Es el gesto central del producto: la tarjeta debe empujar el lienzo. No hay equivalente en `transform` sin romper el flujo. El costo es de una tarjeta a la vez. | Migrar a `interpolate-size: allow-keywords` cuando tenga soporte estable |
| Fotos del hero desde el CDN de Unsplash | `canvas/format.ts` | Demo sin API key; el gradiente determinista es el piso si no cargan | Sustituir por assets propios antes de producción |
| Sin tema oscuro | global | La identidad es "papel sobre mesa de luz". Un modo oscuro exige rehacer la rampa completa y no hay pedido | Se añade cuando exista el requisito |
| El log MCP no se anuncia a lectores de pantalla en vivo | `canvas/mcp-panel.tsx` | Es telemetría de demo, no contenido de tarea | `aria-live="polite"` si el panel pasa a ser producto |
| Sin suite de pruebas | `apps/web` | El repo no tiene framework de test y no se introduce uno en este cambio | Cuando el proyecto adopte uno |
