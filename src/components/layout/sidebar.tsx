'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSignalRStatus } from '@/hooks/use-signalr-status';
import { authApi } from '@/lib/api/auth';
import {
  LayoutDashboard,
  Fuel,
  History,
  Users,
  UserCog,
  Package,
  CalendarClock,
  Settings,
  LogOut,
  Zap,
  Monitor,
  Wifi,
  WifiOff,
  CreditCard,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Navigation structure with logical grouping
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Preset', href: '/preset', icon: Zap },
      { label: 'Dispensadores', href: '/dispensadores', icon: Fuel },
      { label: 'Monitor', href: '/monitor-simple', icon: Monitor },
    ],
  },
  {
    title: 'Registros',
    items: [
      { label: 'Historial', href: '/historial', icon: History },
    ],
  },
  {
    title: 'Administracion',
    items: [
      { label: 'Frentistas', href: '/frentistas', icon: Users },
      { label: 'Usuarios', href: '/usuarios', icon: UserCog },
      { label: 'Productos', href: '/productos', icon: Package },
      { label: 'Precios Prog.', href: '/precios-programados', icon: CalendarClock },
      { label: 'Identificadores', href: '/identificadores', icon: CreditCard },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Configuracion', href: '/configuracion', icon: Settings, disabled: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const signalRStatus = useSignalRStatus();

  const userData = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : {};
  const username = userData.username || (typeof window !== 'undefined' ? localStorage.getItem('username') : null) || 'Usuario';
  const userInitial = username.charAt(0).toUpperCase();

  const roleLabels: Record<string, string> = {
    Admin: 'Administrador',
    Operator: 'Operador',
    ReadOnly: 'Solo Lectura',
  };
  const userRoleLabel = roleLabels[userData.role] || userData.role || 'Usuario';

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  // -- Connection status helpers --
  const isConnected = signalRStatus === 'Connected';
  const isTransitioning =
    signalRStatus === 'Connecting' || signalRStatus === 'Reconnecting';

  const statusDotClass = isConnected
    ? 'bg-emerald-500'
    : isTransitioning
    ? 'bg-amber-400 animate-pulse'
    : 'bg-red-500';

  const statusLabel = isConnected
    ? 'Conectado'
    : isTransitioning
    ? 'Reconectando...'
    : 'Sin conexion';

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-xl">
      {/* ----------------------------------------------------------------- */}
      {/* Logo */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-3 px-5 pt-7 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-red-500/25">
          <Fuel className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-[17px] font-semibold tracking-tight text-slate-900">
            FuelRed
          </h1>
          <p className="text-[11px] font-medium text-slate-400">
            Sistema de Monitoreo
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Navigation groups */}
      {/* ----------------------------------------------------------------- */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-1">
            {/* Section label */}
            <p className="mb-1 px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </p>

            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isDisabled = item.disabled === true;

                return (
                  <Link
                    key={item.href}
                    href={isDisabled ? '#' : item.href}
                    onClick={(e) => isDisabled && e.preventDefault()}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-500/25'
                        : isDisabled
                        ? 'cursor-not-allowed text-slate-300'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] flex-shrink-0 transition-colors',
                        isActive
                          ? 'text-white'
                          : isDisabled
                          ? 'text-slate-300'
                          : 'text-slate-400 group-hover:text-slate-600'
                      )}
                    />
                    <span>{item.label}</span>
                    {isDisabled && (
                      <Badge
                        variant="outline"
                        className="ml-auto border-slate-200 px-1.5 py-0 text-[10px] font-medium text-slate-400"
                      >
                        Prox.
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* Connection status pill */}
      {/* ----------------------------------------------------------------- */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5">
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-slate-400" />
          )}
          <span className="flex-1 text-[12px] font-medium text-slate-500">
            {statusLabel}
          </span>
          <span
            className={cn(
              'h-2 w-2 rounded-full ring-2 ring-white',
              statusDotClass
            )}
          />
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* User / logout */}
      {/* ----------------------------------------------------------------- */}
      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-slate-100">
            <AvatarFallback className="bg-gradient-to-br from-red-500 to-rose-600 text-[13px] font-semibold text-white">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-800">
              {username}
            </p>
            <p className="text-[11px] font-medium text-slate-400">{userRoleLabel}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Cerrar sesion"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
