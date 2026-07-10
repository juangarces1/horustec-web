# Indicador animado "pistola goteando" en Abasteciendo Ahora

**Fecha:** 2026-07-09
**Alcance:** Dashboard (`/dashboard`), sección "Abasteciendo Ahora" (`src/components/dashboard/active-fuelings.tsx`).

## Objetivo

Cuando una manguera está abasteciendo (status 3), cada fila de la lista muestra a la
izquierda —antes del círculo naranja con el número de dispensador— una pistola de
combustible animada con una gota que cae en loop y un charquito que ondula, reforzando
visualmente que hay flujo activo.

## Diseño

### Componente nuevo: `DrippingNozzle`

- Archivo: `src/components/dashboard/dripping-nozzle.tsx`.
- SVG inline (~32×40px) de una pistola/boquilla de combustible en la paleta del tema
  (naranja `orange-500`/ámbar `amber-*`).
- Animaciones con CSS keyframes puros (sin JS, sin librerías nuevas):
  - **Gota:** nace en el pico, cae ~14px mientras se desvanece; loop ~1.2s. Una segunda
    gota desfasada (~0.6s) para sensación de goteo continuo.
  - **Charquito:** elipse bajo el pico con `scale` sutil pulsante, sincronizado con la
    caída de la gota.
- Keyframes definidos en `src/app/globals.css` (`fuel-drip`, `fuel-puddle`).
- `aria-hidden="true"` en el SVG (decorativo).
- `@media (prefers-reduced-motion: reduce)`: animaciones desactivadas.

### Integración en `active-fuelings.tsx`

- En cada fila de abastecimiento activo, `<DrippingNozzle />` se agrega como primer
  elemento del grupo izquierdo, junto (a la izquierda) del círculo naranja con el número
  de dispensador, que se mantiene sin cambios.
- Ningún cambio en datos, props ni lógica de filtrado; cero impacto en re-renders de
  TanStack Query/SignalR (la animación es CSS-only).

## Fuera de alcance

- No se toca `nozzle-card.tsx` ni las páginas de monitor (solo la sección del dashboard).
- No se agregan dependencias (Framer Motion / Lottie descartados).

## Criterio de éxito

Con al menos una manguera en status 3, la fila muestra la pistola goteando animada a la
izquierda del círculo; con `prefers-reduced-motion` la animación se detiene; el resto de
la fila queda idéntico.
