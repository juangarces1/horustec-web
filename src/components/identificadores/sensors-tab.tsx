'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { pumpsApi } from '@/lib/api/pumps';
import type { PumpDto } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Fuel, Loader2, RefreshCw, Tag } from 'lucide-react';

// Helper para extraer mensaje de error del backend
function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string') return data;
  const obj = data as { error?: string; detail?: string; message?: string; title?: string } | undefined;
  return obj?.error ?? obj?.detail ?? obj?.message ?? obj?.title ?? fallback;
}

const PRODUCT_BADGE: Record<string, string> = {
  Super: 'bg-red-100 text-red-700 border-red-200',
  Regular: 'bg-amber-100 text-amber-700 border-amber-200',
  Diesel: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Exonerado: 'bg-sky-100 text-sky-700 border-sky-200',
};

export function SensorsTab() {
  const queryClient = useQueryClient();

  const { data: pumps, isLoading, error } = useQuery({
    queryKey: ['pumps'],
    queryFn: pumpsApi.getAll,
  });

  const setIdentifierMutation = useMutation({
    mutationFn: ({ pumpId, enabled }: { pumpId: string; enabled: boolean }) =>
      pumpsApi.setIdentifier(pumpId, enabled),
    onSuccess: (_, vars) => {
      toast.success(vars.enabled ? 'Identificador activado' : 'Identificador desactivado');
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al cambiar el identificador'));
    },
  });

  const reapplyMutation = useMutation({
    mutationFn: pumpsApi.reapplyIdentifiers,
    onSuccess: (results) => {
      const failed = results.filter((r) => !r.success);
      if (failed.length === 0) {
        toast.success(`Configuración reaplicada en ${results.length} surtidores`);
      } else {
        toast.error(
          `Fallaron ${failed.length} de ${results.length}: ${failed
            .map((f) => `Surtidor ${f.pumpNumber}`)
            .join(', ')}`,
          { duration: 8000 }
        );
      }
      queryClient.invalidateQueries({ queryKey: ['pumps'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al reaplicar la configuración'));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando surtidores...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center text-red-500">
        Error al cargar surtidores: {getErrorMessage(error, 'Error desconocido')}
      </div>
    );
  }

  const activePumps = (pumps ?? []).filter((p) => p.isActive);

  return (
    <div className="space-y-6">
      {/* Header con acción de reaplicar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Activa o desactiva el sensor de identificación (Identfid) por cara de surtidor. El estado
          mostrado es la última orden enviada con éxito al concentrador.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={reapplyMutation.isPending}>
              {reapplyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Reaplicar configuración
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Reaplicar configuración de identificadores?</AlertDialogTitle>
              <AlertDialogDescription>
                Se reenviará al concentrador el estado guardado de los {activePumps.length}{' '}
                surtidores activos. Úsalo tras un reinicio del concentrador o si se hicieron
                cambios por fuera del sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => reapplyMutation.mutate()}>
                Reaplicar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Mapa de surtidores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {activePumps.map((pump: PumpDto) => {
          const isPending =
            setIdentifierMutation.isPending &&
            setIdentifierMutation.variables?.pumpId === pump.id;
          return (
            <Card
              key={pump.id}
              className={`border-2 transition-colors ${
                pump.requiresIdentifier
                  ? 'border-indigo-200 bg-indigo-50/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Fuel className="h-4 w-4 text-gray-500" />
                    Surtidor {pump.pumpNumber}
                  </CardTitle>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Tag
                      className={`h-4 w-4 ${
                        pump.requiresIdentifier ? 'text-indigo-600' : 'text-gray-400'
                      }`}
                    />
                    Identfid
                  </span>
                  <Switch
                    checked={pump.requiresIdentifier}
                    disabled={setIdentifierMutation.isPending || reapplyMutation.isPending}
                    onCheckedChange={(checked) =>
                      setIdentifierMutation.mutate({ pumpId: pump.id, enabled: checked })
                    }
                  />
                </div>
                <div className="space-y-1">
                  {pump.nozzles
                    .filter((n) => n.isActive)
                    .map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center justify-between text-xs text-gray-600"
                      >
                        <span>M{n.nozzleNumber}</span>
                        <Badge
                          variant="outline"
                          className={PRODUCT_BADGE[n.productName ?? ''] ?? ''}
                        >
                          {n.productName ?? '—'}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
