# Monitor por manguera: rediseño agrupado por dispensador

**Fecha:** 2026-07-09
**Alcance:** `/monitor-simple` (`src/app/(dashboard)/monitor-simple/page.tsx`) y
`src/components/monitor/active-fuelings.tsx`. NO se toca `/monitor` ni `nozzle-card.tsx`
(los usa la página standalone de test).

## Contexto

La página era una pantalla de prueba de HTTP polling ("Monitor Simple (HTTP)") que quedó
enlazada como "Monitor" en el sidebar. La granularidad por manguera es útil, pero: muro
rojo (paleta vieja), 30 tiles sin agrupar ni identificar producto, textos de debug, y
producto "Sin especificar" en la lista de activos.

## Diseño

### Módulo compartido `src/lib/nozzle-products.ts`

- `NOZZLE_PRODUCTS: Record<string, string>` — mapeo manguera→producto (copiado del
  existente en dispensadores; los duplicados en otras páginas se migran después).
- `PRODUCT_COLORS: Record<string, string>` — paleta canónica hex: Regular `#f59e0b`,
  Super `#ef4444`, Diesel `#3b82f6`, Exonerado `#10b981`.

### Componente `DispenserNozzleGroup` (`src/components/monitor/dispenser-nozzle-group.tsx`)

- Props: `dispenserNumber: number`, `nozzles: { code, product, status, currentCash? }[]`.
- Card blanca con encabezado "D 01" y 3 filas (una por manguera). Si alguna manguera
  está abasteciendo, la card lleva `ring-2 ring-orange-300`.
- Cada fila (NozzleTile, subcomponente interno): punto de color del producto +
  `#código` + nombre del producto a la izquierda; a la derecha la etiqueta de estado, o
  el monto ₡ con `RollingNumber` si está abasteciendo.
- Fondos por estado con la MISMA jerarquía de dispensadores: Bloqueado slate-100
  neutro, Abasteciendo gradiente naranja con glow, rojo solo Falla (red-600) / Error
  (red-800), No Configurado gris punteado.

### Página

- Título: "Monitor de Mangueras"; subtítulo: "Estado individual de las 30 mangueras
  agrupadas por dispensador · actualización automática". Sin banner de HTTP, sin botón
  "Volver" (el sidebar ya navega); se conserva "Actualizar".
- Grid de 10 grupos (5 columnas en lg), mangueras 01-03 = D01, 04-06 = D02, etc.
- Leyenda actualizada a la nueva paleta.
- El mecanismo de datos NO cambia (polling HTTP 1-2s); la migración a SignalR queda
  fuera de alcance.

### Fixes en `active-fuelings.tsx` (monitor)

- Producto: fallback a `NOZZLE_PRODUCTS[nozzleCode]` cuando `productName` viene null.
- Litros: el lookup de precio usa `productName.toLowerCase()` (el mapa tiene claves en
  minúscula; hoy nunca matchea y los litros no se muestran).
- Monto con `RollingNumber` (consistencia con dispensadores).

## Criterio de éxito

Sin API local: preview con mocks muestra 10 grupos con sus 3 mangueras identificadas por
color/nombre de producto, jerarquía de colores correcta y odómetro en las activas. En
producción: mangueras agrupadas según la pista física, producto visible por manguera,
lista de activos con producto y litros correctos.
