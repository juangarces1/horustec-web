# 📊 Dashboard Profesional Horustec

Sistema de monitoreo en tiempo real de dispensadores de combustible con dashboard ejecutivo completo.

## 🎯 Características Principales

### ⛽ Monitor de Dispensadores (Ruta Principal)
**Ruta:** `/dispensadores`

- Monitor en tiempo real de 10 dispensadores (30 mangueras)
- Conexión SignalR con actualización automática
- Visualización de estado con códigos de color
- Valores actuales en colones y litros
- 4 KPIs de resumen en la parte superior
- Leyenda de estados clara y completa

### 📈 Dashboard Ejecutivo
**Ruta:** `/dashboard`

#### KPIs de Última Hora
- **Total Ventas** - Suma de transacciones en ₡
- **Total Litros** - Volumen total despachado
- **Transacciones** - Número de operaciones
- **Estado Dispensadores** - Abasteciendo / Disponibles

#### Abastecimientos Activos
- Lista en tiempo real de dispensadores abasteciendo
- Muestra dispensador, producto y valores actuales
- Actualización cada 2 segundos

#### Frentistas Activos
- Ranking de frentistas por actividad en última hora
- Muestra transacciones, litros y ventas por persona
- Actualización cada 30 segundos

#### Top 3 Productos
- Productos más vendidos en última hora
- Porcentaje de participación sobre el total
- Visualización con colores distintivos

#### Gráfica de Ventas
- Barras con ventas de últimas 6 horas
- Tooltip con formato de moneda
- Actualización cada 60 segundos

### 🗂️ Otras Secciones
- **Historial** - Consulta de transacciones con filtros
- **Frentistas** - Gestión de operadores
- **Productos** - Catálogo de combustibles
- **Precios** - Actualización de precios

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar NEXT_PUBLIC_API_URL con la URL del backend

# Iniciar desarrollo
npm run dev

# Abrir navegador
# http://localhost:3000
```

## 📱 Responsive Design

### Desktop (>1024px)
- Sidebar fijo de 256px
- Grid de 4 columnas para KPIs
- Layout optimizado para monitores grandes

### Tablet (768-1024px)
- Sidebar colapsable
- Grid adaptativo de 2 columnas
- Touch-friendly controls

### Mobile (<768px)
- Sidebar como overlay con botón hamburger
- Grid de 1 columna
- Diseño vertical optimizado

## 🎨 Sistema de Diseño

### Paleta de Colores

**Estados de Dispensadores:**
- 🟢 Verde - Libre (Available)
- 🔴 Rojo - Bloqueado (Blocked)
- 🟠 Naranja - Abasteciendo (Fueling) - Animado
- 🔵 Azul - Pronto (Ready)
- 🟡 Amarillo - Espera (Waiting)
- 🔴🔴 Rojo Oscuro - Falla (Failure)
- 🟣 Púrpura - Ocupado (Busy)
- ⚫ Gris - No Configurado

**Dashboard:**
- Verde - Ventas y métricas positivas
- Azul - Información general
- Púrpura - Productos y categorías
- Naranja - Actividad en curso

### Tipografía
- **Títulos:** Geist Sans, bold, 2xl-4xl
- **Cuerpo:** Geist Sans, regular, sm-base
- **Números:** Geist Mono, bold, xl-3xl

## 🔧 Tecnologías

### Core
- **Next.js 16** - Framework React con App Router
- **React 19.2.3** - Biblioteca UI
- **TypeScript 5** - Type safety

### State Management
- **React Query** - Server state management
- **SignalR** - Real-time communication

### UI Components
- **Tailwind CSS 4** - Utility-first CSS
- **shadcn/ui** - Component library
- **Recharts 3.7** - Data visualization
- **Lucide React** - Icon library

### Backend Integration
- **Axios** - HTTP client con interceptors
- **JWT** - Authentication

## 📊 Arquitectura de Datos

### Flujos de Actualización

#### Real-Time (SignalR)
```
Backend Hub → StatusChanged event → Frontend refetch
Backend Hub → VisualizationUpdated event → Local state update
```

#### Polling (React Query)
```
Dashboard KPIs       → 30 segundos
Dashboard Chart      → 60 segundos
Dispenser Statuses   → 5 segundos
Visualizations       → 2 segundos
```

### APIs Utilizadas

```typescript
// Monitoring
GET /api/Monitoring/status           // Nozzle statuses
GET /api/Monitoring/visualization    // Current values

// Fueling
GET /api/Fueling/transactions?from=X&to=Y  // Transaction history

// Auth
POST /api/Auth/login                 // JWT authentication
POST /api/Auth/refresh               // Token refresh
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── (dashboard)/              # Protected routes
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── dispensadores/        # Main monitor
│   │   ├── dashboard/            # Executive dashboard
│   │   ├── historial/            # Transaction history
│   │   ├── frentistas/           # Attendants management
│   │   ├── productos/            # Products catalog
│   │   └── precios/              # Price management
│   ├── login/                    # Public login page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Root redirect
│
├── components/
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── kpi-card.tsx
│   │   ├── sales-chart.tsx
│   │   ├── active-fuelings.tsx
│   │   ├── active-attendants.tsx
│   │   └── top-products.tsx
│   ├── layout/                   # Layout components
│   │   ├── dashboard-layout.tsx
│   │   ├── sidebar.tsx
│   │   └── mobile-menu.tsx
│   ├── monitor/                  # Monitor components
│   │   ├── dispenser-card.tsx
│   │   └── nozzle-card.tsx
│   ├── auth/                     # Auth components
│   │   └── protected-route.tsx
│   ├── providers/                # Context providers
│   │   ├── query-provider.tsx
│   │   └── toast-provider.tsx
│   └── ui/                       # shadcn/ui components
│
├── lib/
│   ├── api/                      # API clients
│   │   ├── client.ts            # Axios instance
│   │   ├── auth.ts
│   │   ├── monitoring.ts
│   │   ├── fueling.ts
│   │   ├── attendants.ts
│   │   ├── products.ts
│   │   └── prices.ts
│   ├── signalr/                  # SignalR hubs
│   │   └── monitoring-hub.ts
│   └── utils.ts                  # Utility functions
│
├── types/
│   └── api.ts                    # TypeScript types
│
└── hooks/
    └── use-signalr-status.ts     # SignalR connection hook
```

## 🔐 Autenticación

### Flujo de Login
1. Usuario ingresa credenciales en `/login`
2. Backend valida y retorna JWT + Refresh Token
3. Tokens se guardan en localStorage
4. Axios interceptor añade token a cada request
5. Si token expira, se intenta refresh automático
6. Si refresh falla, redirige a login

### Rutas Protegidas
- Todas las rutas bajo `(dashboard)` requieren autenticación
- `ProtectedRoute` component verifica token
- Redirige a `/login` si no está autenticado

## 📈 Performance

### Bundle Size
```
Route                     Size        First Load JS
┌ ○ /                     ~150 B      ~120 kB
├ ○ /dashboard            ~2.5 kB     ~125 kB
├ ○ /dispensadores        ~3.2 kB     ~126 kB
└ ○ /login                ~1.8 kB     ~122 kB
```

### Optimizaciones Aplicadas
- Code splitting por ruta (Next.js automático)
- React Query caché para reducir requests
- Debouncing de visualizaciones (2s interval)
- Lazy loading de componentes pesados
- CSS-in-JS optimizado (Tailwind purge)

### Métricas Objetivo
- **LCP** (Largest Contentful Paint) < 2.5s
- **FID** (First Input Delay) < 100ms
- **CLS** (Cumulative Layout Shift) < 0.1
- **TTI** (Time to Interactive) < 3.5s

## 🧪 Testing

### Manual Testing Checklist
- [ ] Login funciona correctamente
- [ ] Redirección de `/` a `/dispensadores`
- [ ] Sidebar navega entre todas las rutas
- [ ] Dashboard carga KPIs de última hora
- [ ] Abastecimientos activos se actualizan en tiempo real
- [ ] Gráfica muestra últimas 6 horas correctamente
- [ ] SignalR conecta y recibe eventos
- [ ] Responsive funciona en mobile
- [ ] Logout cierra sesión y redirige a login
- [ ] Refresh automático de queries funciona

### Comandos de Testing
```bash
# Type checking
npm run build

# Linting
npm run lint

# Run dev y verificar console
npm run dev
# Check: No errores en console, SignalR Connected
```

## 🐛 Troubleshooting

### Backend no conecta
```bash
# Verificar .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000

# Verificar que backend esté corriendo
curl http://localhost:5000/api/Monitoring/status
```

### SignalR no recibe eventos
1. Verificar que el hub esté corriendo en backend
2. Check CORS configuration en backend
3. Verificar URL del hub: `${API_URL}/hub/monitoring`
4. Revisar console para errores de SignalR

### Queries no se actualizan
1. Abrir React Query DevTools
2. Verificar que queries tengan `refetchInterval`
3. Check que no haya errores en console
4. Verificar token JWT no haya expirado

### Build errors
```bash
# Limpiar caché
rm -rf .next node_modules package-lock.json

# Reinstalar
npm install

# Build
npm run build
```

## 📚 Documentación Adicional

- **DASHBOARD_IMPLEMENTATION.md** - Detalles técnicos completos
- **QUICK_START.md** - Guía de inicio rápido
- **VISUAL_ENHANCEMENTS.md** - Mejoras visuales opcionales
- **DESARROLLO.md** - Notas de desarrollo (si existe)

## 🤝 Contribución

### Code Style
- TypeScript strict mode
- ESLint configurado
- Prettier para formateo
- Convenciones de nombres:
  - Components: PascalCase
  - Functions: camelCase
  - Constants: UPPER_SNAKE_CASE

### Git Workflow
```bash
# Feature branch
git checkout -b feature/nueva-funcionalidad

# Commit con mensaje descriptivo
git commit -m "feat: Add real-time notifications to dashboard"

# Push y crear PR
git push origin feature/nueva-funcionalidad
```

## 📞 Soporte

Para preguntas o issues:
1. Revisar documentación en `/docs`
2. Verificar console logs
3. Check React Query DevTools
4. Revisar estado SignalR en sidebar

## 📝 Changelog

### v0.1.0 (2026-02-17)
- ✨ Dashboard ejecutivo completo
- ✨ 5 componentes de dashboard reutilizables
- ✨ Navegación sidebar con active state
- ✨ Redirección automática desde root
- ✨ Responsive design completo
- 🐛 Fix: Orden de navegación optimizado
- 📝 Documentación completa

---

**Versión:** 0.1.0
**Última Actualización:** 2026-02-17
**Estado:** Production Ready ✓
**Mantenedor:** Equipo Horustec
