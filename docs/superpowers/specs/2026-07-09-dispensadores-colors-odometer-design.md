# Dispensadores: jerarquía de colores + contador odómetro

**Fecha:** 2026-07-09
**Alcance:** Página `/dispensadores` (`src/app/(dashboard)/dispensadores/page.tsx`,
`src/components/monitor/dispenser-card.tsx`).

## Problema

1. "Bloqueado" es rojo intenso: con 7/10 dispensadores bloqueados la página grita en
   rojo y lo activo (naranja) no destaca. El rojo debe reservarse para Falla/Error.
2. El monto ₡ salta bruscamente con cada update de SignalR; en un surtidor real los
   dígitos ruedan.

## Diseño

### 1. Nueva jerarquía de colores (`statusColors` en dispenser-card.tsx)

| Estado | Antes | Después |
|---|---|---|
| Libre | green-500 | green-500 (igual) |
| Bloqueado | red-500 | `bg-slate-200 text-slate-500` (neutro, retrocede) |
| Abasteciendo | orange-500 + pulse | gradiente orange-400→600 + glow (`shadow-orange-500/40`) + ring naranja; sin pulse |
| Pronto | blue-500 | igual |
| Espera | yellow-500 | igual |
| Falla | red-800 | `bg-red-600` (el rojo alarma de verdad) |
| Ocupado | purple-500 | igual |
| Error | red-900 | `bg-red-800` |
| No Config. | gray-300 | `bg-gray-100 text-gray-400` + borde punteado gris |

La leyenda de `page.tsx` se actualiza para reflejar los mismos colores.

### 2. Componente `RollingNumber` (odómetro CSS)

- Archivo: `src/components/ui/rolling-number.tsx` (`'use client'`).
- API: `<RollingNumber text={string} className? />`. Recibe el número YA formateado
  (ej. `"16.428"`, `"24.52"`); cada carácter dígito se renderiza como una tira
  vertical 0-9 que se desplaza con `transition: transform` (700ms ease-out) a la
  posición del dígito; separadores/decimales quedan estáticos.
- Claves de dígito contadas desde la derecha (`text.length - i`) para que al crecer
  el número (999→1000) la columna de unidades conserve identidad y la animación no salte.
- Accesibilidad: contenedor con `aria-label={text}`, tiras internas `aria-hidden`;
  `motion-reduce:transition-none`.
- Uso en `dispenser-card.tsx`: monto ₡ (`text-3xl`) y litros (`toFixed(2)`).

## Fuera de alcance

- Monitor/monitor-simple y nozzle-card (tienen sus propios colores).
- Pistola goteando en esta página (idea 3, no seleccionada).

## Criterio de éxito

Con datos reales: bloqueados en gris neutro, el naranja de abastecimiento domina la
vista, rojo solo si hay falla/error; el monto y los litros ruedan suavemente al
actualizarse en vez de saltar.
