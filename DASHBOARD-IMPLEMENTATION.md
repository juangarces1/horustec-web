# Dashboard Implementation Guide

## Overview
Professional Apple-style dashboard implemented for the Horustec fuel dispenser monitoring system.

## Architecture

### Route Structure
```
src/app/
├── login/                    # Public login page
│   └── page.tsx
├── (dashboard)/             # Protected dashboard route group
│   ├── layout.tsx           # Dashboard layout with sidebar & ProtectedRoute
│   ├── page.tsx             # Main dashboard (dispensers monitor)
│   ├── dispensadores/       # Dispensers full view
│   ├── historial/           # Transaction history
│   ├── frentistas/          # Attendants management
│   ├── productos/           # Products management
│   ├── precios/             # Prices management
│   └── monitor-simple/      # Alternative monitor (30 nozzles HTTP polling)
└── layout.tsx               # Root layout (QueryProvider, ToastProvider)
```

### Key Components

#### 1. DashboardLayout (`src/components/layout/dashboard-layout.tsx`)
- Main layout wrapper for all authenticated pages
- Contains Sidebar (desktop) and MobileMenu (mobile)
- Flexbox layout with sidebar + scrollable content area

#### 2. Sidebar (`src/components/layout/sidebar.tsx`)
- Desktop sidebar (fixed, always visible on lg+ screens)
- Dark gradient background (slate-900 to slate-800)
- Navigation items with active state highlighting
- SignalR connection status indicator
- User info with logout button at bottom
- Uses lucide-react icons

#### 3. MobileMenu (`src/components/layout/mobile-menu.tsx`)
- Mobile hamburger menu using shadcn Sheet component
- Same navigation as Sidebar
- Opens as overlay from left side
- Auto-closes when navigating

#### 4. useSignalRStatus Hook (`src/hooks/use-signalr-status.ts`)
- Custom hook to monitor SignalR connection state
- Returns: 'Connected' | 'Connecting' | 'Disconnected' | 'Reconnecting'
- Polls connection state every 2 seconds
- Used in Sidebar and MobileMenu for status indicator

### Navigation Items

```typescript
const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Dispensadores', href: '/dispensadores', icon: Fuel },
  { label: 'Historial', href: '/historial', icon: History },
  { label: 'Frentistas', href: '/frentistas', icon: Users },
  { label: 'Productos', href: '/productos', icon: Package },
  { label: 'Precios', href: '/precios', icon: DollarSign },
  { label: 'Configuración', href: '/configuracion', icon: Settings }, // Disabled (Próximamente)
];
```

### Design System

#### Colors
- **Sidebar background**: `bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900`
- **Active nav item**: `bg-indigo-600` with `shadow-indigo-500/50` shadow
- **Hover nav item**: `bg-white/5`
- **Main content area**: `bg-gradient-to-br from-slate-50 via-white to-slate-100`

#### SignalR Status Colors
- Connected: `bg-green-500`
- Connecting/Reconnecting: `bg-yellow-500 animate-pulse`
- Disconnected: `bg-red-500`

#### Typography
- Main titles: `text-4xl font-bold text-slate-900`
- Subtitles: `text-lg text-slate-600`
- Nav items: `text-sm font-medium`

### Authentication Flow

1. User logs in at `/login`
2. Token stored in localStorage
3. Redirect to `/` (main dashboard)
4. DashboardLayout wraps page with ProtectedRoute
5. ProtectedRoute checks `authApi.isAuthenticated()`
6. If not authenticated, redirect to `/login`
7. If authenticated, render DashboardLayout with Sidebar + content

### SignalR Integration

#### Connection Management
- SignalR connects automatically when dashboard pages load
- Connection status displayed in sidebar (green/yellow/red dot)
- Automatic reconnection with exponential backoff (built into SignalR)
- Token passed via `accessTokenFactory` in hub connection

#### Events Handled
- `StatusChanged` - nozzle status updates
- `VisualizationUpdated` - real-time volume/value updates

#### Data Flow
1. Initial data fetched via React Query (HTTP GET)
2. SignalR connects and subscribes to events
3. Updates received via SignalR trigger state updates
4. State updates re-render affected components (DispenserCard, NozzleCard)
5. React Query refetch as fallback (polling every 3 seconds)

### Main Dashboard Features (`/(dashboard)/page.tsx`)

#### Summary Cards (4 metrics)
1. **Abastecimientos Activos** (green) - Count of dispensers currently fueling
2. **Dispensadores Disponibles** (blue) - Count of available dispensers
3. **Volumen Actual** (purple) - Total current transaction volume (₡)
4. **Última Actualización** (gray) - Timestamp of last update

#### Dispenser Grid
- 10 dispenser cards (each groups 3 nozzles)
- Color-coded by status
- Shows current volume when fueling
- Displays active nozzle and product

#### Legend
- Visual guide to all status colors
- 9 statuses: Libre, Bloqueado, Abasteciendo, Pronto, Espera, Falla, Ocupado, Error, No Config.

### Responsive Breakpoints

- **Mobile (< 1024px)**: Sidebar hidden, MobileMenu hamburger visible
- **Desktop (>= 1024px)**: Sidebar always visible, MobileMenu hidden

### Performance Optimizations

1. **React Query caching** - Prevents unnecessary refetches
2. **SignalR event throttling** - Updates batched via Map state
3. **Memo on DispenserCard** - Prevents re-renders when props unchanged
4. **Conditional rendering** - Loading/error states handled gracefully

### Development Notes

#### To Add a New Page
1. Create `src/app/(dashboard)/new-page/page.tsx`
2. Add nav item to `navItems` array in `sidebar.tsx` and `mobile-menu.tsx`
3. Page automatically gets DashboardLayout + ProtectedRoute from `(dashboard)/layout.tsx`
4. No need to wrap with ProtectedRoute in page itself

#### To Modify Sidebar
- Edit `src/components/layout/sidebar.tsx`
- Changes automatically apply to mobile menu (separate component)

#### To Update SignalR Events
- Modify `src/lib/signalr/monitoring-hub.ts` for new events
- Subscribe to events in page components (useEffect with cleanup)

### Known Issues / Future Enhancements

1. **Configuración route** - Currently disabled (placeholder)
2. **Mobile responsiveness** - Test on actual devices
3. **Error boundaries** - Could add React error boundaries for better error handling
4. **Accessibility** - Add ARIA labels to navigation items
5. **Theming** - Could implement dark mode toggle

### Files Modified/Created

#### Created
- `src/hooks/use-signalr-status.ts`
- `src/components/layout/dashboard-layout.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/mobile-menu.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/page.tsx`

#### Modified
- `src/app/(dashboard)/dispensadores/page.tsx` - Removed ProtectedRoute, updated styling
- `src/app/(dashboard)/historial/page.tsx` - Removed ProtectedRoute
- `src/app/(dashboard)/monitor-simple/page.tsx` - Removed ProtectedRoute
- Moved pages from `src/app/` to `src/app/(dashboard)/`

#### Deleted
- `src/app/page.tsx` (old homepage with navigation cards)

### Testing Checklist

- [x] Build completes without errors
- [ ] Login redirects to dashboard
- [ ] Sidebar navigation works
- [ ] Mobile menu opens/closes
- [ ] SignalR status indicator updates
- [ ] Logout button works
- [ ] Protected routes redirect to login when not authenticated
- [ ] Dispenser cards update in real-time
- [ ] Summary metrics calculate correctly
- [ ] Responsive design works on mobile/tablet/desktop

### Dependencies Used

- `lucide-react` - Icons for navigation
- `@microsoft/signalr` - Real-time updates
- `@tanstack/react-query` - State management and caching
- `shadcn/ui` components:
  - Avatar, Badge, Button, Card, Input, Label, Separator, Sheet, Table

### Environment Variables Required

- `NEXT_PUBLIC_API_URL` - Backend API base URL
- `NEXT_PUBLIC_SIGNALR_HUB_URL` - SignalR hub URL (e.g., http://localhost:5000/hubs/monitoring)
