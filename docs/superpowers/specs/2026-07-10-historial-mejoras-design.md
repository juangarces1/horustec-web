# Historial: export, rangos rápidos, filtros y comparativos

**Fecha:** 2026-07-10
**Alcance:** `src/app/(dashboard)/historial/page.tsx`. Aprobado por el usuario ("aplica
todas") sobre las 6 mejoras propuestas.

## Diseño

1. **Exportar a Excel**: botón en el header de la tabla; exporta `filteredTransactions`
   (lo filtrado, no la página) con `xlsx` (ya instalado). Columnas = las de la tabla.
   Archivo `historial_<desde>_a_<hasta>.xlsx`. Deshabilitado sin resultados.
2. **Rangos rápidos**: chips Hoy · Ayer · Últimos 7 días · Este mes sobre los campos de
   fecha; fijan fechas/horas y aplican de inmediato.
3. **Fix de Buscar**: estado draft (inputs) vs applied (query). El query usa SOLO el
   estado applied → cambiar un input ya no dispara búsquedas; Buscar aplica el draft y
   YA NO borra los filtros de combustible/zona. Si el rango no cambió, refetch().
4. **Filtro por frentista + búsqueda libre**: select de frentista (únicos del resultado)
   y campo de texto que matchea # de registro o nombre de frentista (client-side).
5. **Ticket promedio + comparativo**: 4ª tarjeta "Ticket Promedio"; query adicional del
   período anterior equivalente (misma duración, inmediatamente antes) con los mismos
   filtros client-side; cada tarjeta muestra "▲/▼ X% vs período anterior" (oculto si el
   período anterior no tiene datos).
6. **Menores**: selector de tamaño de página (10/25/50) en la barra de paginación; la
   columna Estado solo se renderiza si existe al menos una transacción con problema de
   integridad.

## Criterio de éxito

Con datos reales: chips cambian el rango en un click; Buscar no borra filtros; el select
de frentista y la búsqueda libre filtran tabla+tarjetas; el Excel descarga lo filtrado;
las tarjetas muestran deltas vs período anterior; la columna Estado desaparece cuando
todo está OK.
