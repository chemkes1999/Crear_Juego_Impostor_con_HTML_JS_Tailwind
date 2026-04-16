## Resumen

Mejorar la experiencia visual del juego en tres puntos:
- Pantalla de inicio/setup más “misterio”: título principal “IMPOSTOR”, estética de suspenso y copy más acorde.
- Reemplazar inputs numéricos de tiempos (reveal y discusión) por un selector más cómodo (recomendación: slider con pasos y valor visible).
- Añadir animaciones “dramáticas” al finalizar la partida, diferenciadas según gane el impostor o los inocentes.

## Estado actual (observado)

- La pantalla inicial corresponde a [Home.tsx](file:///workspace/src/pages/Home.tsx) cuando `phase === "setup"`, renderizando [SetupScreen.tsx](file:///workspace/src/components/game/SetupScreen.tsx).
- En [SetupScreen.tsx](file:///workspace/src/components/game/SetupScreen.tsx#L167-L188), los tiempos se ingresan con `<input>` numérico:
  - `reveal.seconds` (2–15)
  - `discussion.secondsTotal` (30–900)
- El final de la partida se renderiza con [GameOverScreen.tsx](file:///workspace/src/components/game/GameOverScreen.tsx), sin animaciones específicas por ganador.
- Tipografías: se cargan Bungee y Alegreya Sans en [index.css](file:///workspace/src/index.css#L1).
- No hay librerías de animación instaladas; el stack es React + Vite + Tailwind ([package.json](file:///workspace/package.json)).

## Cambios propuestos

### 1) Pantalla de inicio con identidad “misterio”

**Archivo:** [SetupScreen.tsx](file:///workspace/src/components/game/SetupScreen.tsx)

- Reestructurar el encabezado para que el título principal sea “IMPOSTOR” (con Bungee) y un subtítulo/claim breve de misterio.
- Mantener el contenido funcional (jugadores/palabras/seguridad), pero mejorar la jerarquía visual:
  - Badge superior: conservar “Impostor local” o ajustarlo a un tono más “misterio” (p. ej. “Caso local” / “Misterio local”) sin cambiar la lógica.
  - Añadir un bloque “hero” arriba del grid con:
    - Título grande “IMPOSTOR”
    - Subtítulo tipo “Descubre quién miente” / “Un misterio por ronda”
    - 2–3 bullets cortos de reglas (sin sobrecargar), aprovechando el texto existente.
- Usar iconos existentes de lucide-react (ya usado en el repo) para reforzar el tono (p. ej. `Search`, `EyeOff`, `Skull`), sin añadir dependencias.

**Opcional (si se alinea con el objetivo):**
- Actualizar el `<title>` del documento en [index.html](file:///workspace/index.html#L7) a “IMPOSTOR” para coherencia de marca.

### 2) Selector para tiempos (reveal y discusión)

**Decisión:** Como recomendación ante “¿qué recomiendas?”, usar slider discreto + valor legible porque:
- Es más cómodo en móvil que un input numérico (menos teclado, más táctil).
- Mantiene control fino dentro de los rangos ya definidos por el store.

**Archivos:**
- Crear un componente reutilizable nuevo: `src/components/game/DurationSlider.tsx`
- Actualizar [SetupScreen.tsx](file:///workspace/src/components/game/SetupScreen.tsx)

**Implementación del componente `DurationSlider`:**
- Props sugeridas:
  - `label: string`
  - `value: number`
  - `min: number`, `max: number`, `step: number`
  - `onChange: (value: number) => void`
  - `formatValue?: (value: number) => string` (para mostrar `180` como `3:00`, etc.)
- UI:
  - Un slider (`input type="range"`) con estilos Tailwind consistentes con el resto (bordes suaves, fondo oscuro, hover/focus).
  - Un “chip”/badge a la derecha con el valor formateado.
  - Un row inferior con min/max (p. ej. `2s` y `15s`, o `0:30` y `15:00`) para orientar.
- Lógica:
  - Internamente clamp a `min/max` y floor a step.
  - Mantener el clamp actual en store (no se cambia la lógica del store; el componente se alinea a sus límites).

**Aplicación en SetupScreen:**
- Reemplazar el `<input>` de `reveal.seconds` por `DurationSlider` con:
  - `min=2`, `max=15`, `step=1`, `formatValue={(v) => \`\${v}s\`}`
  - `onChange={setRevealSeconds}`
- Reemplazar el `<input>` de `discussion.secondsTotal` por `DurationSlider` con:
  - `min=30`, `max=900`, `step=15` (o `30` si se quiere más simple)
  - `formatValue` a `m:ss` (p. ej. `3:00`, `10:30`)
  - `onChange={setDiscussionSeconds}`

### 3) Animaciones dramáticas al ganar/perder

**Archivos:**
- [GameOverScreen.tsx](file:///workspace/src/components/game/GameOverScreen.tsx)
- [index.css](file:///workspace/src/index.css) (agregar keyframes/clases CSS globales)

**Objetivo visual (Dramática):**
- Si ganan inocentes:
  - “Revelación”: glow radial/spotlight + entrada suave del título y la tarjeta (scale/fade).
- Si gana impostor:
  - “Amenaza”: leve glitch/temblor + pulsos de sombras y un tinte fucsia/rojo oscuro.

**Implementación propuesta (sin librerías):**
- Añadir en `index.css`:
  - Keyframes para `impostor-glitch` (pequeños translateX/rotate/opacity) y `reveal-glow` (opacity + blur + scale).
  - Clases utilitarias (p. ej. `.anim-reveal`, `.anim-impostor`) que se aplican a wrappers específicos.
  - Soporte de `@media (prefers-reduced-motion: reduce)` para desactivar animaciones.
- En `GameOverScreen.tsx`:
  - Convertir el layout a `relative` y añadir un overlay decorativo absoluto (un `<div aria-hidden />`) que cambie por ganador.
  - Aplicar clases animadas al título y/o al panel principal para dar sensación de “entrada” al llegar a gameover.
  - Mantener texto y acciones actuales; solo enriquecer presentación.

## Decisiones y supuestos

- Se mantiene el flujo de pantallas basado en `phase` del store; no se crea una pantalla “extra” aparte del setup.
- No se añaden dependencias (sin Framer Motion, sin Lottie); animaciones con CSS/Tailwind + keyframes en `index.css`.
- Los límites de tiempo siguen definidos por el store (2–15 para reveal, 30–900 para discusión).
- El título visible del juego será “IMPOSTOR” como pediste.

## Archivos a tocar (lista concreta)

- Modificar: [src/components/game/SetupScreen.tsx](file:///workspace/src/components/game/SetupScreen.tsx)
- Crear: `src/components/game/DurationSlider.tsx`
- Modificar: [src/components/game/GameOverScreen.tsx](file:///workspace/src/components/game/GameOverScreen.tsx)
- Modificar: [src/index.css](file:///workspace/src/index.css)
- Opcional: [index.html](file:///workspace/index.html)

## Verificación

- Estática:
  - `pnpm -s check`
  - `pnpm -s lint`
  - `pnpm -s build`
- Manual (en `pnpm dev`):
  - En setup: mover sliders y comprobar que los valores cambian y respetan rangos.
  - Iniciar partida y confirmar que el reveal auto-hide sigue funcionando con el nuevo tiempo.
  - Forzar un final de partida en ambos casos (impostor e inocentes) y validar:
    - Animación correcta según ganador
    - No afecta botones “Nueva partida” / “Ajustes”
    - Con “reduced motion” activado, no hay animaciones molestas.
