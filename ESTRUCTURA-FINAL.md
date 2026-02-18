# Estructura Final del Proyecto - Dashboard Horustec

## Vista General del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  HORUSTEC - SISTEMA DE MONITOREO DE DISPENSADORES          │
│  Next.js 16 + SignalR + React Query + Tailwind CSS 4       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Flujo de Autenticación:
/login → JWT Token → localStorage → Redirige a / (Dashboard)

```

## Estructura de Carpetas

```
D:\proyectos\horustec-web\
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/                    ← ROUTE GROUP (Protegido)
│   │   │   ├── layout.tsx                 ← DashboardLayout + ProtectedRoute
│   │   │   ├── page.tsx                   ← DASHBOARD PRINCIPAL ⚡
│   │   │   ├── dispensadores/
│   │   │   │   └── page.tsx               ← Monitor 10 dispensadores SignalR
│   │   │   ├── historial/
│   │   │   │   └── page.tsx               ← Historial de transacciones
│   │   │   ├── frentistas/
│   │   │   │   └── page.tsx               ← Gestión de frentistas
│   │   │   ├── productos/
│   │   │   │   └── page.tsx               ← Gestión de productos
│   │   │   ├── precios/
│   │   │   │   └── page.tsx               ← Gestión de precios
│   │   │   └── monitor-simple/
│   │   │       └── page.tsx               ← Monitor 30 nozzles HTTP
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx                   ← Login (público)
│   │   │
│   │   ├── layout.tsx                     ← Root Layout (QueryProvider)
│   │   ├── globals.css                    ← Tailwind CSS
│   │   └── favicon.ico
│   │
│   ├── components/
│   │   ├── layout/                        ← NUEVOS COMPONENTES UI
│   │   │   ├── dashboard-layout.tsx       ← Layout principal con sidebar
│   │   │   ├── sidebar.tsx                ← Sidebar desktop (estilo Apple)
│   │   │   └── mobile-menu.tsx            ← Hamburger menu móvil
│   │   │
│   │   ├── monitor/
│   │   │   ├── dispenser-card.tsx         ← Card de dispensador (10)
│   │   │   ├── nozzle-card.tsx            ← Card de nozzle individual
│   │   │   └── active-fuelings.tsx        ← Lista de abastecimientos activos
│   │   │
│   │   ├── auth/
│   │   │   └── protected-route.tsx        ← HOC para proteger rutas
│   │   │
│   │   ├── providers/
│   │   │   ├── query-provider.tsx         ← React Query Provider
│   │   │   └── toast-provider.tsx         ← Toast notifications
│   │   │
│   │   └── ui/                            ← shadcn/ui components
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       └── table.tsx
│   │
│   ├── hooks/
│   │   └── use-signalr-status.ts          ← NUEVO: Hook estado SignalR
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── auth.ts                    ← API autenticación
│   │   │   ├── attendants.ts              ← API frentistas
│   │   │   ├── client.ts                  ← Axios client
│   │   │   ├── fueling.ts                 ← API transacciones
│   │   │   ├── monitoring.ts              ← API monitoreo
│   │   │   ├── prices.ts                  ← API precios
│   │   │   └── products.ts                ← API productos
│   │   │
│   │   ├── signalr/
│   │   │   └── monitoring-hub.ts          ← SignalR Hub (singleton)
│   │   │
│   │   └── utils.ts                       ← Utilities (cn, etc.)
│   │
│   └── types/
│       └── api.ts                         ← TypeScript interfaces (DTOs)
│
├── public/
│   └── [assets]
│
├── .env.local                             ← Variables de entorno
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── DASHBOARD-IMPLEMENTATION.md            ← Documentación implementación
└── ESTRUCTURA-FINAL.md                    ← Este archivo
```

## Componentes Clave

### 1. Dashboard Layout (Sidebar + Content)

```
┌──────────────────────────────────────────────────────────────┐
│ DESKTOP (>= 1024px)                                          │
├─────────────┬────────────────────────────────────────────────┤
│             │                                                │
│  SIDEBAR    │         MAIN CONTENT AREA                      │
│  (fijo)     │         (scrollable)                           │
│             │                                                │
│ • Dashboard │  ┌──────────────────────────────────────────┐ │
│ • Dispens.  │  │  Page Content (Dashboard, Historial, etc)│ │
│ • Historial │  │                                          │ │
│ • Frentistas│  │                                          │ │
│ • Productos │  │                                          │ │
│ • Precios   │  │                                          │ │
│ • Config    │  │                                          │ │
│             │  │                                          │ │
│ ─────────── │  │                                          │ │
│ SignalR: ●  │  │                                          │ │
│ Usuario     │  └──────────────────────────────────────────┘ │
│ [Logout]    │                                                │
└─────────────┴────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ MOBILE (< 1024px)                                            │
├──────────────────────────────────────────────────────────────┤
│ ☰  Horustec                                    [Header]      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│         MAIN CONTENT AREA (full width)                       │
│         (scrollable)                                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Page Content                                          │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
    ↑
    Al tocar ☰ se abre Sheet overlay con el menú completo
```

### 2. Dashboard Principal (/)

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard Principal                        [Actualizar 🔄]  │
│ Monitoreo en tiempo real de dispensadores                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│  │  Abastos  │ │ Dispon.   │ │ Volumen   │ │  Última   │  │
│  │  Activos  │ │ 7         │ │ Actual    │ │ Actualiz. │  │
│  │  ⛽ 3      │ │           │ │ ₡125,450  │ │ 10:45:32  │  │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘  │
│                                                             │
│  Dispensadores                                   [10 Total] │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                        │
│  │D 01│ │D 02│ │D 03│ │D 04│ │D 05│   ...                  │
│  │LIBRE│ABAST│LIBRE│BLOQ│LIBRE│                            │
│  └────┘ └────┘ └────┘ └────┘ └────┘                        │
│                                                             │
│  Leyenda de Estados                                         │
│  🟢 Libre  🔴 Bloqueado  🟠 Abasteciendo  🔵 Pronto ...     │
│                                                             │
│  ⚡ Actualización en Tiempo Real                            │
│  Los estados se actualizan automáticamente vía SignalR      │
└─────────────────────────────────────────────────────────────┘
```

### 3. Sidebar (Estilo Apple)

```
┌─────────────────┐
│                 │
│  ⛽  Horustec    │  ← Logo + Branding
│  Sistema...     │
├─────────────────┤
│                 │
│  🏠 Dashboard   │  ← Nav activo (bg-indigo-600)
│  ⛽ Dispensad.  │
│  📊 Historial   │
│  👥 Frentistas  │
│  📦 Productos   │
│  💰 Precios     │
│  ⚙️  Config     │  [Próx.]
│                 │
│       ...       │
│                 │
├─────────────────┤
│  ⚡ SignalR     │
│  ● Conectado    │  ← Estado (verde/amarillo/rojo)
├─────────────────┤
│  👤 JC          │  ← Avatar usuario
│  Juan Carlos    │
│  Operador  [🚪] │  ← Logout
└─────────────────┘

Colores:
- Fondo: Gradiente slate-900 → slate-800
- Hover: bg-white/5
- Activo: bg-indigo-600 + shadow
- Texto: text-white / text-slate-300
```

## Flujo de Datos en Tiempo Real

```
Backend .NET SignalR Hub
        │
        │ WebSocket Connection (JWT token)
        │
        ▼
MonitoringHub (singleton)
  - connect()
  - onStatusChanged()
  - onVisualizationUpdated()
        │
        │ React Hook useEffect
        │
        ▼
Component State Update
  - useState<Map<string, number>>
  - setVisualizations()
  - refetch() React Query
        │
        │ Re-render
        ▼
DispenserCard / NozzleCard
  - Status color changes
  - Volume updates
  - Animations (pulse on fueling)
```

## Stack Tecnológico

```
Frontend:
├── Next.js 16              (App Router, React 19)
├── TypeScript 5
├── Tailwind CSS 4
├── shadcn/ui               (Component library)
├── React Query             (State management + caching)
├── SignalR Client          (Real-time updates)
├── Axios                   (HTTP client)
└── lucide-react            (Icons)

Backend (existente):
├── .NET 8 Web API
├── SignalR Hub
├── Clean Architecture
├── CQSR (MediatR)
└── JWT Authentication
```

## Características del Dashboard

### Funcionalidades Implementadas
- ✅ Sidebar persistente con navegación
- ✅ Indicador de estado SignalR en tiempo real
- ✅ Dashboard principal con métricas resumen
- ✅ Grid de 10 dispensadores con actualización SignalR
- ✅ Mobile menu responsivo (hamburger)
- ✅ Protección de rutas con JWT
- ✅ Logout funcional
- ✅ Páginas movidas a route group (dashboard)
- ✅ Diseño profesional estilo Apple
- ✅ Smooth transitions y hover effects

### Próximas Mejoras Sugeridas
- ⬜ Dark mode toggle
- ⬜ Página de configuración
- ⬜ Notificaciones push (eventos críticos)
- ⬜ Gráficas de ventas (recharts)
- ⬜ Exportar historial a Excel (xlsx)
- ⬜ Filtros avanzados en historial
- ⬜ Roles y permisos de usuario

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev
# → http://localhost:3000

# Build producción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint
```

## Variables de Entorno (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SIGNALR_HUB_URL=http://localhost:5000/hubs/monitoring
```

## Notas de Mantenimiento

### Para agregar una nueva página:
1. Crear `src/app/(dashboard)/nueva-pagina/page.tsx`
2. Agregar item en `navItems` de `sidebar.tsx` y `mobile-menu.tsx`
3. La página automáticamente tiene DashboardLayout + ProtectedRoute

### Para modificar estilos del sidebar:
- Editar `src/components/layout/sidebar.tsx`
- Los cambios NO se replican automáticamente a `mobile-menu.tsx` (componentes separados)

### Para agregar eventos SignalR:
- Modificar `src/lib/signalr/monitoring-hub.ts` (agregar métodos on...)
- Suscribirse en componentes con `useEffect` y cleanup

---

**Documentación generada:** 2026-02-17
**Sistema:** Horustec Web - Dashboard de Monitoreo
**Versión:** 1.0.0
