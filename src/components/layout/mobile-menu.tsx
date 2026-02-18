'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSignalRStatus } from '@/hooks/use-signalr-status';
import { authApi } from '@/lib/api/auth';
import {
  Menu,
  LayoutDashboard,
  Fuel,
  History,
  Users,
  Package,
  DollarSign,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Dispensadores', href: '/dispensadores', icon: Fuel },
  { label: 'Historial', href: '/historial', icon: History },
  { label: 'Frentistas', href: '/frentistas', icon: Users },
  { label: 'Productos', href: '/productos', icon: Package },
  { label: 'Precios', href: '/precios', icon: DollarSign },
  { label: 'Configuración', href: '/configuracion', icon: Settings },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const signalRStatus = useSignalRStatus();

  const username = typeof window !== 'undefined' ? localStorage.getItem('username') || 'Usuario' : 'Usuario';
  const userInitial = username.charAt(0).toUpperCase();

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
    setOpen(false);
  };

  const getStatusColor = () => {
    switch (signalRStatus) {
      case 'Connected':
        return 'bg-green-500';
      case 'Connecting':
      case 'Reconnecting':
        return 'bg-yellow-500 animate-pulse';
      case 'Disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (signalRStatus) {
      case 'Connected':
        return 'Conectado';
      case 'Connecting':
        return 'Conectando...';
      case 'Reconnecting':
        return 'Reconectando...';
      case 'Disconnected':
        return 'Desconectado';
      default:
        return 'Desconocido';
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700 p-0">
        <div className="flex h-full flex-col">
          {/* Logo/Branding */}
          <SheetHeader className="px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <Fuel className="h-7 w-7" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-bold tracking-tight text-white">
                  Horustec
                </SheetTitle>
                <p className="text-xs text-slate-400">Sistema de Monitoreo</p>
              </div>
            </div>
          </SheetHeader>

          <Separator className="bg-white/10" />

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isDisabled = item.href === '/configuracion';

              return (
                <Link
                  key={item.href}
                  href={isDisabled ? '#' : item.href}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                    } else {
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
                      : isDisabled
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {isDisabled && (
                    <Badge variant="outline" className="ml-auto text-xs border-slate-600 text-slate-500">
                      Próx.
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* SignalR Status */}
          <div className="px-3 pb-4">
            <div className="rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-indigo-400" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-400">Estado SignalR</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={cn('h-2 w-2 rounded-full', getStatusColor())} />
                    <span className="text-xs text-white">{getStatusLabel()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* User section */}
          <div className="p-4">
            <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 backdrop-blur-sm">
              <Avatar className="h-10 w-10 border-2 border-indigo-500">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{username}</p>
                <p className="text-xs text-slate-400">Operador</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
