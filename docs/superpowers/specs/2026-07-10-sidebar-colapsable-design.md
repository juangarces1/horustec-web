# Sidebar colapsable a barra de iconos

**Fecha:** 2026-07-10
**Alcance:** `src/components/layout/sidebar.tsx` (solo desktop; el menú móvil existente
no cambia).

## Diseño

- Botón de toggle en la cabecera del sidebar (iconos `PanelLeftClose` / `PanelLeftOpen`
  de lucide). Colapsado: el botón queda centrado bajo el logo.
- Ancho animado 260px ↔ 72px (`transition-[width] duration-300`).
- Estado persistido en `localStorage` clave `sidebar-collapsed` (`'1'`/`'0'`), leído en
  el inicializador del `useState` (mismo patrón de acceso a localStorage que ya usa el
  componente para el usuario).
- Colapsado:
  - Títulos de grupo → separadores horizontales (excepto el primero).
  - Items: solo icono centrado, con `title` nativo como tooltip; badge "Prox." oculto.
  - Pill de conexión: icono + punto de estado, sin texto, con `title`.
  - Footer: avatar (con `title` de usuario) y botón de logout apilados.
- Expandido: idéntico al actual + el botón de toggle a la derecha del logo.

## Criterio de éxito

Toggle alterna 260↔72px con animación; en 72px todo es usable vía iconos/tooltips; el
estado sobrevive un reload; el layout expandido no cambia visualmente respecto a hoy.
