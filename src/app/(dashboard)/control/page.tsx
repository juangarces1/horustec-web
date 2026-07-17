'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { monitoringApi } from '@/lib/api/monitoring';
import { pumpApi } from '@/lib/api/pump';
import { NOZZLE_PRODUCTS, PRODUCT_BADGE, STATUS_BADGE, STATUS_LABELS } from '@/lib/nozzles';
import { NozzleStatus } from '@/types/api';
import type { NozzleStatusDto } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  Fuel,
  Loader2,
  Lock,
  Unlock,
  CheckCircle2,
  OctagonX,
  Pause,
  Eraser,
  SlidersHorizontal,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types y helpers
// ---------------------------------------------------------------------------

type PumpAction = 'free' | 'authorize' | 'block' | 'stop' | 'pause' | 'clear';

interface ActionDef {
  action: PumpAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  adminOnly?: boolean;
  /** Acciones que interrumpen un abastecimiento piden confirmación */
  confirm?: string;
}

const ACTIONS: ActionDef[] = [
  {
    action: 'free',
    label: 'Liberar',
    icon: Unlock,
    className: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
  },
  {
    action: 'authorize',
    label: 'Autorizar',
    icon: CheckCircle2,
    className: 'text-blue-600 hover:bg-blue-50 hover:text-blue-700',
  },
  {
    action: 'block',
    label: 'Bloquear',
    icon: Lock,
    className: 'text-amber-600 hover:bg-amber-50 hover:text-amber-700',
  },
  {
    action: 'stop',
    label: 'Detener',
    icon: OctagonX,
    className: 'text-red-600 hover:bg-red-50 hover:text-red-700',
    confirm:
      'Se detendrá el abastecimiento en curso de esta manguera. ¿Continuar?',
  },
  {
    action: 'pause',
    label: 'Pausar',
    icon: Pause,
    className: 'text-orange-600 hover:bg-orange-50 hover:text-orange-700',
    confirm: 'Se pausará el abastecimiento en curso de esta manguera. ¿Continuar?',
  },
  {
    action: 'clear',
    label: 'Limpiar',
    icon: Eraser,
    className: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
    adminOnly: true,
    confirm:
      'Se limpiará el estado de la manguera en el concentrador. Úsalo solo si quedó en un estado inconsistente. ¿Continuar?',
  },
];

const ACTION_SUCCESS: Record<PumpAction, string> = {
  free: 'Manguera liberada',
  authorize: 'Manguera autorizada',
  block: 'Manguera bloqueada',
  stop: 'Orden de detención enviada',
  pause: 'Orden de pausa enviada',
  clear: 'Estado de manguera limpiado',
};

function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string') return data;
  const obj = data as { error?: string; detail?: string; message?: string; title?: string } | undefined;
  return obj?.error ?? obj?.detail ?? obj?.message ?? obj?.title ?? fallback;
}

interface DispenserGroup {
  dispenserNumber: number;
  nozzles: NozzleStatusDto[];
}

/** Agrupa las mangueras en surtidores de 3 (mismo criterio que /preset) */
function groupDispensers(nozzles: NozzleStatusDto[]): DispenserGroup[] {
  const groups: DispenserGroup[] = [];
  for (let i = 0; i < 10; i++) {
    const slice = nozzles.slice(i * 3, i * 3 + 3);
    if (slice.length === 0) continue;
    groups.push({ dispenserNumber: i + 1, nozzles: slice });
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ControlPage() {
  const queryClient = useQueryClient();
  const [pendingConfirm, setPendingConfirm] = useState<{
    def: ActionDef;
    nozzleCode: string;
  } | null>(null);

  const userData =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user') || '{}')
      : {};
  const isAdmin = userData.role === 'Admin';

  const { data: statuses, isLoading, error } = useQuery({
    queryKey: ['control-nozzle-statuses'],
    queryFn: monitoringApi.getStatuses,
    refetchInterval: 3000,
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, nozzleCode }: { action: PumpAction; nozzleCode: string }) =>
      pumpApi[action](nozzleCode),
    onSuccess: (_, vars) => {
      toast.success(`${ACTION_SUCCESS[vars.action]} (#${vars.nozzleCode})`);
      queryClient.invalidateQueries({ queryKey: ['control-nozzle-statuses'] });
    },
    onError: (err, vars) => {
      toast.error(
        `Manguera #${vars.nozzleCode}: ${getErrorMessage(err, 'el concentrador rechazó la orden')}`
      );
    },
  });

  const runAction = (def: ActionDef, nozzleCode: string) => {
    if (def.confirm) {
      setPendingConfirm({ def, nozzleCode });
    } else {
      actionMutation.mutate({ action: def.action, nozzleCode });
    }
  };

  const visibleActions = ACTIONS.filter((a) => !a.adminOnly || isAdmin);

  const dispensers = statuses ? groupDispensers(statuses) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Page title */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg">
            <SlidersHorizontal className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Control de Bombas</h1>
            <p className="text-sm text-slate-500">
              Liberar, autorizar, bloquear o detener mangueras directamente en el concentrador
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex min-h-64 items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Cargando estados...
          </div>
        )}

        {!!error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            Error al cargar estados: {getErrorMessage(error, 'Error desconocido')}
          </div>
        )}

        {/* Dispenser grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dispensers.map((dispenser) => (
            <Card key={dispenser.dispenserNumber} className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Fuel className="h-4 w-4 text-slate-500" />
                  Surtidor {dispenser.dispenserNumber.toString().padStart(2, '0')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dispenser.nozzles.map((nozzle) => {
                  const product = NOZZLE_PRODUCTS[nozzle.nozzleCode] ?? 'Desconocido';
                  const isPendingNozzle =
                    actionMutation.isPending &&
                    actionMutation.variables?.nozzleCode === nozzle.nozzleCode;
                  const notConfigured = nozzle.status === NozzleStatus.NotConfigured;

                  return (
                    <div
                      key={nozzle.nozzleCode}
                      className={cn(
                        'rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5',
                        notConfigured && 'opacity-50'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-sm font-semibold text-slate-700">
                            #{nozzle.nozzleCode}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-[11px]', PRODUCT_BADGE[product] ?? '')}
                          >
                            {product}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPendingNozzle && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                          )}
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                              STATUS_BADGE[nozzle.status]
                            )}
                          >
                            {STATUS_LABELS[nozzle.status] ?? nozzle.statusName}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {visibleActions.map((def) => {
                          const Icon = def.icon;
                          return (
                            <Button
                              key={def.action}
                              variant="ghost"
                              size="sm"
                              disabled={notConfigured || actionMutation.isPending}
                              onClick={() => runAction(def, nozzle.nozzleCode)}
                              className={cn('h-7 gap-1 px-2 text-[12px] font-medium', def.className)}
                              title={def.label}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {def.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Legend */}
        {!isLoading && !error && (
          <p className="mt-6 text-center text-xs text-slate-400">
            Las órdenes se envían directo al concentrador; si el estado actual de la manguera no
            permite la orden, el concentrador la rechaza y se muestra el error.
          </p>
        )}
      </div>

      {/* Confirmation dialog for destructive actions */}
      <AlertDialog
        open={pendingConfirm !== null}
        onOpenChange={(open) => !open && setPendingConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingConfirm
                ? `${pendingConfirm.def.label} manguera #${pendingConfirm.nozzleCode}`
                : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>{pendingConfirm?.def.confirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingConfirm) {
                  actionMutation.mutate({
                    action: pendingConfirm.def.action,
                    nozzleCode: pendingConfirm.nozzleCode,
                  });
                }
                setPendingConfirm(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
