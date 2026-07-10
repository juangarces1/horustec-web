# IR: Índice de Rendimiento relativo al turno + tasas por hora activa

**Fecha:** 2026-07-10
**Alcance:** `src/components/historial/attendant-performance-report.tsx`.

## Problema

Los totales miden oportunidad, no desempeño: no se puede comparar un domingo con un
lunes ni entre turnos, y los pisteros rotan.

## Diseño

### Índice de Rendimiento (IR)

- Celdas = **fecha × turno** (bandas 5-13, 13-21, 21-5; una transacción de madrugada
  antes de las 5 pertenece al turno nocturno que inició el día anterior).
- Presencia en una celda = tener ≥1 despacho en ella (no hay roster de turnos).
- `esperado(p) = Σ_{celdas donde p presente} (despachos_celda / pisteros_presentes)`
- `IR(p) = despachos(p) / esperado(p)` — equivale al promedio de índices por celda
  ponderado por volumen. 1.00 = igual que sus compañeros de turno; celdas donde
  trabajó solo aportan 1.00 (sin señal comparativa).
- Badge: verde ≥1.10, neutro 0.90–1.10, ámbar <0.90; tooltip explicativo.

### Tasas por hora activa

- Hora activa = hora calendario (fecha+hora) con ≥1 despacho del pistero.
- Columnas **Desp/h** y **₡/h** = totales ÷ horas activas.

### UI

- Columnas nuevas (ordenables): IR tras Despachos; Desp/h y ₡/h tras Monto.
- Nota al pie explicando IR y horas activas junto a la leyenda de vehículos.
- Se calcula 100% client-side con las transacciones que el reporte ya descarga.

## Criterio de éxito

Con datos reales: cada pistero muestra IR coherente (≈1.00 si trabajó solo), las tasas
por hora activa se calculan, las 3 columnas ordenan, y los totales existentes no cambian.
