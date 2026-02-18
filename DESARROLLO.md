# Desarrollo Frontend Horustec - Next.js

## 📋 Resumen del Proyecto

Sistema web de monitoreo y gestión de surtidores de combustible construido con Next.js 16, conectándose a una API backend en .NET que se comunica con concentradores Horustech vía protocolo TCP.

---

## 🎯 Stack Tecnológico

### Frontend
- **Next.js 16.1.6** (App Router)
- **React 19.2.3**
- **TypeScript 5**
- **Tailwind CSS 4**
- **shadcn/ui** - Componentes UI
- **@tanstack/react-query 5.90.21** - Gestión de estado y cache
- **@microsoft/signalr 10.0.0** - Comunicación en tiempo real
- **Axios 1.13.5** - Cliente HTTP

### Backend (existente)
- **.NET 9** con Clean Architecture
- **SignalR Hub** en `/hubs/monitoring`
- **JWT Authentication** (Bearer token)
- **SQLite Database**

---

## 🏗️ Estructura del Proyecto

```
horustec-web/
├── src/
│   ├── app/
│   │   ├── login/page.tsx                    # Página de autenticación
│   │   ├── dispensadores/page.tsx            # Monitor agrupado (10 dispensadores)
│   │   ├── monitor-simple/page.tsx           # Monitor HTTP (30 nozzles)
│   │   ├── monitor/page.tsx                  # Monitor SignalR (30 nozzles)
│   │   ├── historial/page.tsx                # Historial de transacciones
│   │   ├── page.tsx                          # Homepage
│   │   └── layout.tsx                        # Layout raíz con QueryProvider
│   ├── components/
│   │   ├── auth/
│   │   │   └── protected-route.tsx           # HOC para rutas protegidas
│   │   ├── monitor/
│   │   │   ├── dispenser-card.tsx            # Card de dispensador agrupado
│   │   │   ├── nozzle-card.tsx               # Card de nozzle individual
│   │   │   └── active-fuelings.tsx           # Lista de abastecimientos activos
│   │   ├── providers/
│   │   │   └── query-provider.tsx            # React Query provider
│   │   └── ui/                               # Componentes shadcn/ui
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                     # Axios instance con interceptors
│   │   │   ├── auth.ts                       # API de autenticación
│   │   │   ├── monitoring.ts                 # API de monitoreo
│   │   │   └── fueling.ts                    # API de transacciones
│   │   ├── signalr/
│   │   │   └── monitoring-hub.ts             # Cliente SignalR
│   │   └── utils.ts                          # Utilidades (cn helper)
│   └── types/
│       └── api.ts                            # Tipos TypeScript del API
├── .env.local                                # Variables de entorno
└── package.json
```

---

## 🔐 Autenticación

### Credenciales por defecto
- **Usuario**: `admin`
- **Contraseña**: `Admin123!`

### Flujo de autenticación
1. Usuario ingresa credenciales en `/login`
2. Backend devuelve:
   ```json
   {
     "accessToken": "eyJ...",
     "refreshToken": "...",
     "expiry": "2026-02-14T...",
     "role": "Admin"
   }
   ```
3. Token se guarda en `localStorage.token`
4. Axios interceptor agrega `Authorization: Bearer {token}` a todas las peticiones
5. SignalR usa `accessTokenFactory` para incluir el token en la conexión

### Rutas protegidas
Todas las páginas excepto `/login` usan el componente `<ProtectedRoute>` que:
- Verifica si existe token en localStorage
- Redirige a `/login` si no hay token
- Renderiza el contenido si está autenticado

---

## 🎨 Páginas Implementadas

### 1. Homepage (`/`)
- Redirige a `/login` si no hay autenticación
- Dashboard con cards de navegación
- Links a: Dispensadores, Monitor Simple, Historial

### 2. Login (`/login`)
- Formulario de autenticación
- Credenciales prellenadas
- Redirige a `/` después del login exitoso

### 3. Dispensadores (`/dispensadores`) ⭐ RECOMENDADO
**Características:**
- Vista agrupada: 10 dispensadores (D 01 a D 10)
- Cada dispensador agrupa 3 nozzles
- **SignalR en tiempo real** con auto-reconexión
- **Polling HTTP** cada 3 segundos como fallback
- Muestra monto actual cuando está abasteciendo
- Indica qué manguera está activa y qué producto

**Mapeo de dispensadores:**
```
D 01: Nozzles 01, 02, 03  (Super, Regular, Diesel)
D 02: Nozzles 04, 05, 06  (Super, Regular, Diesel)
D 03: Nozzles 07, 08, 09  (Super, Regular, Diesel)
D 04: Nozzles 10, 11, 12  (Super, Regular, Diesel)
D 05: Nozzles 13, 14, 15  (Super, Regular, Diesel)
D 06: Nozzles 16, 17, 18  (Super, Regular, Diesel)
D 07: Nozzles 19, 20, 21  (Super, Regular, Diesel)
D 08: Nozzles 22, 23, 24  (Super, Regular, Diesel)
D 09: Nozzles 25, 26, 27  (Super, Exonerado, Diesel)
D 10: Nozzles 28, 29, 30  (Super, Exonerado, Diesel)
```

**Lógica de prioridad de estados:**
- Fueling > Ready > Waiting > Busy > Blocked > Available > Error > Failure > NotConfigured

**Estados de card:**
- **Todas iguales**: Muestra solo D XX y estado
- **Alguna diferente**: Muestra manguera activa y producto
- **Abasteciendo**: Muestra monto en tiempo real

### 4. Monitor Simple (`/monitor-simple`)
- Vista de 30 nozzles individuales
- **HTTP Polling** cada 2 segundos (estados) y 1 segundo (valores)
- Grid responsive
- Sección "Abastecimientos Activos" con detalles
- Sin SignalR (más simple, más compatible)

### 5. Historial (`/historial`)
**Características:**
- Diseño estilo Apple con gradientes vibrantes
- Filtros: Fecha desde/hasta, Surtidor específico
- **Paginación**: 10 registros por página
- Cards de resumen: Total transacciones, litros, dinero
- Tabla con formato de miles
- Estados visuales (badges con colores)

**Columnas de la tabla:**
- Registro, Fecha/Hora, Surtidor, Combustible
- Litros, Precio Unit., Total (con formato $X.XXX)
- Estado (✓ OK / ✗ Error)

---

## 🔄 Comunicación en Tiempo Real

### SignalR Hub
**URL**: `http://localhost:5000/hubs/monitoring`

**Eventos recibidos:**
```typescript
// Cambio de estado de un nozzle
hub.on('StatusChanged', (nozzleNumber: number, status: number, statusDescription: string) => {
  // Refetch statuses
});

// Actualización de visualización (monto)
hub.on('VisualizationUpdated', (nozzleNumber: number, currentValue: number) => {
  // currentValue viene en centavos, multiplicar por 100
  const money = currentValue * 100;
});
```

**Configuración:**
- Auto-reconexión automática
- Token JWT en `accessTokenFactory`
- Logging level: Information
- Retry cada 5 segundos si falla

---

## 📊 Endpoints del API

### Autenticación
```http
POST /api/Auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin123!"
}

Response:
{
  "accessToken": "eyJ...",
  "refreshToken": "...",
  "expiry": "2026-02-14T...",
  "role": "Admin"
}
```

### Monitoreo
```http
GET /api/Monitoring/status
Authorization: Bearer {token}

Response: NozzleStatusDto[]
{
  "nozzleCode": "01",
  "status": 2,
  "statusName": "Bloqueado"
}
```

```http
GET /api/Monitoring/visualization
Authorization: Bearer {token}

Response: VisualizationDto[]
{
  "nozzleCode": "07",
  "currentLiters": 125.45,  // Este valor * 100 = dinero
  "productName": null,
  "status": 3
}
```

### Transacciones
```http
GET /api/Fueling/transactions?from=2026-02-13T00:00:00&to=2026-02-13T23:59:59&nozzleId=5
Authorization: Bearer {token}

Response: FuelingTransactionDto[]
```

---

## 🎨 Diseño y UX

### Paleta de colores por estado
- 🟢 **Verde** (`bg-green-500`): Libre (Available)
- 🔴 **Rojo** (`bg-red-500`): Bloqueado (Blocked)
- 🟠 **Naranja** (`bg-orange-500` + `animate-pulse`): Abasteciendo (Fueling)
- 🔵 **Azul** (`bg-blue-500`): Pronto (Ready)
- 🟡 **Amarillo** (`bg-yellow-500`): Espera (Waiting)
- ⚫ **Rojo oscuro** (`bg-red-800`): Falla (Failure)
- 🟣 **Morado** (`bg-purple-500`): Ocupado (Busy)
- ⚫⚫ **Rojo muy oscuro** (`bg-red-900`): Error
- ⚪ **Gris** (`bg-gray-300`): No Configurado

### Iconos de productos
- ⭐ **Super** (Premium)
- ⛽ **Regular** (Normal)
- 🚛 **Diesel**
- 🔰 **Exonerado** (Tax exempt)

### Estilo Visual
- **Gradientes**: Indigo → Blanco → Púrpura
- **Glassmorphism**: `bg-white/80 backdrop-blur-sm`
- **Sombras**: `shadow-xl` para profundidad
- **Animaciones**: `hover:scale-105`, `animate-pulse`
- **Responsive**: Grid adaptable a móvil/tablet/desktop

---

## 🔢 Enums y Mapeos

### NozzleStatus (TypeScript)
```typescript
export enum NozzleStatus {
  NotConfigured = 0,
  Available = 1,      // L - Libre
  Blocked = 2,        // B - Bloqueado
  Fueling = 3,        // A - Abasteciendo
  Ready = 4,          // P - Pronto
  Waiting = 5,        // E - Espera
  Failure = 6,        // F - Falla
  Busy = 7,           // # - Ocupado
  Error = 8           // ! - Error
}
```

### Mapeo de Productos (hardcoded)
```typescript
const NOZZLE_PRODUCTS: Record<string, string> = {
  '01': 'Super', '02': 'Regular', '03': 'Diesel',
  '04': 'Super', '05': 'Regular', '06': 'Diesel',
  '07': 'Super', '08': 'Regular', '09': 'Diesel',
  '10': 'Super', '11': 'Regular', '12': 'Diesel',
  '13': 'Super', '14': 'Regular', '15': 'Diesel',
  '16': 'Super', '17': 'Regular', '18': 'Diesel',
  '19': 'Super', '20': 'Regular', '21': 'Diesel',
  '22': 'Super', '23': 'Regular', '24': 'Diesel',
  '25': 'Super', '26': 'Exonerado', '27': 'Diesel',
  '28': 'Super', '29': 'Exonerado', '30': 'Diesel',
};
```

---

## 💡 Detalles Técnicos Importantes

### 1. Visualización = Dinero (no litros)
El endpoint `/api/Monitoring/visualization` devuelve `currentLiters`, pero en realidad es **dinero en centavos**.

**Conversión:**
```typescript
// El valor viene en centavos
const moneyInCents = visualizationData.currentLiters;
// Multiplicar por 100 para obtener el monto real
const money = moneyInCents * 100;
// Mostrar sin decimales
const display = Math.round(money).toLocaleString('es-ES');
// Resultado: "$12.546" (formato español con punto para miles)
```

### 2. Formato de moneda
```typescript
// Formato español: punto para miles, sin decimales
const formatted = Math.round(value).toLocaleString('es-ES');
// Ejemplos:
// 12546 → "12.546"
// 1234567 → "1.234.567"
```

### 3. React Query configuración
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,           // 5 segundos
      refetchOnWindowFocus: false,
    },
  },
});
```

### 4. Axios Interceptors
```typescript
// Request: Agregar token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: Log de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

---

## 🚀 Cómo Ejecutar

### Prerequisitos
- Node.js 20+
- Backend API corriendo en `http://localhost:5000`

### Instalación
```bash
cd D:/Proyectos/horustec-web
npm install
```

### Desarrollo
```bash
npm run dev
# Abre http://localhost:3000
```

### Build producción
```bash
npm run build
npm run start
```

---

## 📝 Variables de Entorno

**Archivo**: `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SIGNALR_HUB_URL=http://localhost:5000/hubs/monitoring
```

---

## 🐛 Troubleshooting

### SignalR no conecta
1. Verificar que el token esté en localStorage
2. Verificar que el backend esté corriendo
3. Abrir DevTools → Network → WS para ver el handshake
4. El hub intentará reconectar automáticamente cada 5 segundos

### 401 Unauthorized
1. Limpiar localStorage: `localStorage.clear()`
2. Volver a hacer login
3. Verificar que el token no haya expirado

### Los valores no se actualizan
1. Verificar que React Query esté haciendo polling (ver Network tab)
2. Para SignalR: verificar conexión en consola ("SignalR Connected")
3. Refrescar la página (F5)

---

## 🔮 Próximos Pasos (TODO)

### Funcionalidades pendientes
- [ ] Control de bombas (Liberar, Autorizar, Bloquear, Preset)
- [ ] Gestión de precios
- [ ] Reportes y gráficas (Chart.js o Recharts)
- [ ] Exportar historial a Excel/PDF
- [ ] Dashboard ejecutivo con KPIs
- [ ] Configuración de productos por nozzle (CRUD)
- [ ] Multi-usuario con roles (Admin, Operator, ReadOnly)
- [ ] Notificaciones push cuando hay eventos críticos
- [ ] Modo oscuro (Dark mode)

### Mejoras técnicas
- [ ] Tests unitarios (Jest + React Testing Library)
- [ ] E2E tests (Playwright o Cypress)
- [ ] Service Worker para offline support
- [ ] PWA (Progressive Web App)
- [ ] WebSockets heartbeat para detectar desconexión
- [ ] Optimistic updates en React Query
- [ ] Error boundary components
- [ ] Logging centralizado (Sentry o similar)

---

## 📚 Referencias

- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest/docs/react)
- [SignalR Client Docs](https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 👥 Autores

- Backend (.NET): Desarrollo previo
- Frontend (Next.js): Desarrollado con asistencia de Claude (Anthropic)

---

**Última actualización**: 2026-02-13
**Versión**: 1.0.0
