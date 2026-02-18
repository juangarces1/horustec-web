# Quick Start Guide - Horustec Dashboard

## Iniciar Desarrollo

```bash
# Instalar dependencias (si es necesario)
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3000
```

## Flujo de Login

1. Navegar a `http://localhost:3000`
2. Serás redirigido a `/login`
3. Ingresar credenciales (configuradas en el backend)
4. Tras login exitoso, serás redirigido a `/dispensadores`

## Estructura de Navegación

### Ruta Principal: `/dispensadores`
Monitor en tiempo real de dispensadores con SignalR.

**Características:**
- 10 dispensadores (3 mangueras cada uno)
- Actualización en tiempo real vía SignalR
- Estados visuales con colores
- Valores actuales en ₡ y litros

### Dashboard Ejecutivo: `/dashboard`
Resumen ejecutivo con KPIs y análisis.

**Datos Mostrados:**
- KPIs de última hora (ventas, litros, transacciones)
- Abastecimientos activos en tiempo real
- Frentistas activos con métricas
- Top 3 productos más vendidos
- Gráfica de ventas de últimas 6 horas

### Otras Rutas
- `/historial` - Historial de transacciones
- `/frentistas` - Gestión de frentistas
- `/productos` - Gestión de productos
- `/precios` - Gestión de precios

## Verificar Funcionamiento

### 1. Check Backend Connection
Verificar que el backend esté corriendo y accesible:
```bash
# Verificar variable de entorno
echo $NEXT_PUBLIC_API_URL

# O en Windows PowerShell
$env:NEXT_PUBLIC_API_URL
```

### 2. Check SignalR Connection
Abrir DevTools → Console y buscar:
```
SignalR: Connected
StatusChanged events
VisualizationUpdated events
```

### 3. Check Queries
Abrir React Query DevTools (si está habilitado):
- Verificar queries activas
- Ver intervalos de refetch
- Revisar estado de caché

## Debugging Tips

### Backend no responde
```bash
# Verificar que NEXT_PUBLIC_API_URL esté configurada
# Revisar .env.local o .env

# Ejemplo:
# NEXT_PUBLIC_API_URL=http://localhost:5000
```

### SignalR no conecta
1. Verificar que el hub esté corriendo en el backend
2. Check CORS configuración en el backend
3. Revisar la URL del hub en `src/lib/signalr/monitoring-hub.ts`

### Datos no se actualizan
1. Abrir React Query DevTools
2. Verificar que los queries tengan `refetchInterval` configurado
3. Check console para errores de API

### Build errors
```bash
# Limpiar cache de Next.js
rm -rf .next

# Reinstalar node_modules
rm -rf node_modules package-lock.json
npm install

# Build nuevamente
npm run build
```

## Estructura de Componentes

### Dashboard Components (`src/components/dashboard/`)
- `kpi-card.tsx` - Card para KPIs
- `sales-chart.tsx` - Gráfica de ventas
- `active-fuelings.tsx` - Lista de abastecimientos activos
- `active-attendants.tsx` - Lista de frentistas activos
- `top-products.tsx` - Top productos

### Layout Components (`src/components/layout/`)
- `dashboard-layout.tsx` - Layout principal
- `sidebar.tsx` - Navegación lateral
- `mobile-menu.tsx` - Menú móvil

### Monitor Components (`src/components/monitor/`)
- `dispenser-card.tsx` - Card de dispensador
- Otros componentes de monitor

## Variables de Configuración

### Intervalos de Refetch (Ajustables)

**Dashboard (`/dashboard/page.tsx`):**
```typescript
// KPIs (última hora)
refetchInterval: 30000, // 30 segundos

// Chart (6 horas)
refetchInterval: 60000, // 60 segundos

// Estados
refetchInterval: 5000, // 5 segundos

// Visualizaciones
refetchInterval: 2000, // 2 segundos
```

**Dispensadores (`/dispensadores/page.tsx`):**
```typescript
// Estados
refetchInterval: 3000, // 3 segundos

// Visualizaciones
refetchInterval: 1000, // 1 segundo
```

### Mapeo de Productos

Definido en múltiples componentes. Considera moverlo a:
```typescript
// src/lib/config/products.ts
export const NOZZLE_PRODUCTS: Record<string, string> = {
  '01': 'Super',
  '02': 'Regular',
  // ...
};
```

## Testing en Diferentes Dispositivos

### Desktop (>1024px)
```bash
# Normal: http://localhost:3000
```

### Tablet (768-1024px)
```bash
# Resize browser to ~768px width
# O usar DevTools responsive mode
```

### Mobile (<768px)
```bash
# Use DevTools responsive mode
# iPhone 12 Pro, Pixel 5, etc.
```

## Performance Monitoring

### Check Bundle Size
```bash
npm run build

# Revisar output:
# Route sizes y First Load JS
```

### React DevTools Profiler
1. Instalar React DevTools extension
2. Abrir Profiler tab
3. Grabar interacción
4. Revisar render times

### Lighthouse
```bash
# En Chrome DevTools
# Lighthouse tab → Generate report
```

## Datos de Prueba

### Sin Backend
Si no tienes el backend disponible, puedes mockear los datos:

```typescript
// En el componente
const { data: transactions = [] } = useQuery({
  queryKey: ['transactions'],
  queryFn: async () => {
    // Retornar datos mock
    return [
      {
        id: '1',
        totalCash: 50000,
        totalLiters: 25.5,
        productName: 'Super',
        attendantName: 'Juan Pérez',
        transactionDate: new Date().toISOString(),
        // ... otros campos
      },
    ];
  },
});
```

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint

# Limpiar caché
rm -rf .next

# Ver estructura de archivos
tree src/ -I node_modules
```

## Troubleshooting Común

### Error: "useRouter" not working
- Asegúrate de usar `'use client'` en el componente
- Importar de `next/navigation` no `next/router`

### Error: API 401 Unauthorized
- Verificar token JWT en localStorage
- Refresh token si expiró
- Logout y login nuevamente

### Error: CORS Policy
- Configurar CORS en el backend
- Permitir origen `http://localhost:3000`
- Incluir credentials en requests

### Error: SignalR 404
- Verificar URL del hub
- Check que el backend tenga SignalR configurado
- Revisar ruta `/hub/monitoring`

## Recursos Adicionales

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest/docs/react)
- [Recharts Docs](https://recharts.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [shadcn/ui Docs](https://ui.shadcn.com/)

## Contacto y Soporte

Para issues o preguntas:
1. Revisar `DASHBOARD_IMPLEMENTATION.md`
2. Revisar logs de console
3. Verificar estado de queries en React Query DevTools

---

**Última Actualización:** 2026-02-17
**Versión:** 0.1.0
