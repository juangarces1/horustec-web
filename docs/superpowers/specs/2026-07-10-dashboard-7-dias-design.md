# Dashboard: 7 días con gráfica por día y drill-down

**Fecha:** 2026-07-10
**Alcance:** `src/app/(dashboard)/dashboard/page.tsx`, nuevo
`src/components/dashboard/sales-by-day-chart.tsx`, prop de título en
`sales-chart.tsx`. Sin cambios de API (el query de 7 días ya existe).

## Diseño

### Datos y estado

- Se elimina el query de "últimas 24 horas": todo se calcula del query semanal, cuyo
  rango pasa a ser **7 días calendario** (desde las 00:00 de hace 6 días hasta ahora)
  y su `refetchInterval` baja a 30s.
- Estado `selectedDay: string | null` (clave local `YYYY-MM-DD`); `null` = hoy.
- `selectedTransactions` = transacciones del día efectivo. De ahí salen: KPIs (títulos
  dinámicos "(Hoy)" o "(vie 4 jul)"), Productos Más Vendidos, Frentistas Activos y la
  gráfica horaria. **Abasteciendo Ahora y estados NO se filtran** (tiempo real).

### `SalesByDayChart` (nueva, Recharts como el resto)

- Barras de los últimos 7 días calendario (siempre 7, con ₡0 si no hubo ventas),
  etiquetadas "vie 4", "sáb 5"…
- Una serie, un tono: barras `#c7d2fe` (indigo-200) y la del día seleccionado
  `#4f46e5` (indigo-600) — selección por luminosidad del mismo tono, validada con el
  validador de paleta del skill dataviz.
- Click en barra → `onSelectDay(dayKey)`; click en la barra ya seleccionada → vuelve a
  hoy. Cursor pointer, tooltip con el estilo del `SalesChart` existente.

### Página

- Subtítulo: "Resumen de operaciones de los últimos 7 días".
- Chip junto al header cuando el día ≠ hoy: "Mostrando: vie 4 jul ✕" (limpia el filtro).
- `SalesChart` recibe `title` ("Ventas por Hora — Hoy" / "— vie 4 jul").
- Banner informativo actualizado.

## Criterio de éxito

Con datos reales: 7 barras; click en un día pasado filtra KPIs/productos/frentistas y
la gráfica horaria, aparece el chip y la barra queda resaltada; click de nuevo (o el ✕)
vuelve a hoy; Abasteciendo Ahora sigue en vivo sin importar el día elegido.
