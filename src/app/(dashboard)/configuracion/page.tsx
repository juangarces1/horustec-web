'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { clockApi } from '@/lib/api/clock';
import { settingsApi } from '@/lib/api/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { Clock, Loader2, RefreshCw, Settings, ShieldAlert, Timer } from 'lucide-react';

function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string') return data;
  const obj = data as { error?: string; detail?: string; message?: string; title?: string } | undefined;
  return obj?.error ?? obj?.detail ?? obj?.message ?? obj?.title ?? fallback;
}

function isForbidden(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 403;
}

// ---------------------------------------------------------------------------
// Reloj del concentrador
// ---------------------------------------------------------------------------

function ClockCard() {
  const queryClient = useQueryClient();

  // Hora local del navegador, actualizada cada segundo para la comparación
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    data: clock,
    error,
    isLoading,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ['concentrator-clock'],
    queryFn: clockApi.get,
    // Cada lectura es un comando TCP al concentrador — no conviene poll agresivo
    refetchInterval: 60000,
    retry: false,
  });

  const syncMutation = useMutation({
    mutationFn: clockApi.sync,
    onSuccess: () => {
      toast.success('Reloj del concentrador sincronizado');
      queryClient.invalidateQueries({ queryKey: ['concentrator-clock'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'No se pudo sincronizar el reloj'));
    },
  });

  // Diferencia estimada: hora del concentrador al momento de la lectura vs
  // hora del navegador en ese mismo momento (dataUpdatedAt).
  const parsedClock = clock?.parsed ? new Date(clock.parsed) : null;
  const diffSeconds =
    parsedClock && dataUpdatedAt
      ? Math.round((parsedClock.getTime() - dataUpdatedAt) / 1000)
      : null;
  const driftWarning = diffSeconds !== null && Math.abs(diffSeconds) > 60;

  // Hora del concentrador "en vivo": lectura + tiempo transcurrido desde entonces
  const liveClock =
    parsedClock && dataUpdatedAt
      ? new Date(parsedClock.getTime() + (now.getTime() - dataUpdatedAt))
      : null;

  if (error && isForbidden(error)) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-center gap-3 py-6 text-amber-700">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">
            La configuración del reloj solo está disponible para administradores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-slate-500" />
            Reloj del concentrador
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 gap-1.5 text-slate-500"
          >
            {isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Leyendo reloj del concentrador...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {getErrorMessage(error, 'No se pudo leer el reloj del concentrador')}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Concentrador */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Concentrador
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                  {liveClock
                    ? liveClock.toLocaleTimeString('es-CR')
                    : clock?.rawString ?? '—'}
                </p>
                <p className="text-xs text-slate-500">
                  {liveClock
                    ? liveClock.toLocaleDateString('es-CR', { dateStyle: 'full' })
                    : 'No se pudo interpretar la respuesta'}
                </p>
                {clock?.rawString && (
                  <p className="mt-1 font-mono text-[11px] text-slate-400">
                    raw: {clock.rawString}
                  </p>
                )}
              </div>

              {/* Este equipo */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Este equipo
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                  {now.toLocaleTimeString('es-CR')}
                </p>
                <p className="text-xs text-slate-500">
                  {now.toLocaleDateString('es-CR', { dateStyle: 'full' })}
                </p>
              </div>
            </div>

            {/* Drift indicator */}
            {diffSeconds !== null && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    driftWarning
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  )}
                >
                  {driftWarning
                    ? `Desfase de ${Math.abs(diffSeconds)} seg ${diffSeconds > 0 ? 'adelantado' : 'atrasado'}`
                    : 'En hora (±1 min)'}
                </Badge>
              </div>
            )}

            {/* Sync */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">
                La sincronización pone el reloj del concentrador con la hora del servidor
                donde corre el API.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={syncMutation.isPending} className="gap-2">
                    {syncMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    Sincronizar reloj
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Sincronizar el reloj del concentrador?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se enviará la hora actual del servidor al concentrador. Las marcas de
                      tiempo de los despachos siguientes usarán la nueva hora.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => syncMutation.mutate()}>
                      Sincronizar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Preset
// ---------------------------------------------------------------------------

function PresetCard() {
  const queryClient = useQueryClient();

  const { data: settings, error, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    retry: false,
  });

  // El input arranca en el valor guardado; una vez que el usuario escribe,
  // su edición manda. Derivado en vez de sincronizado con un efecto.
  const [edited, setEdited] = useState<string | null>(null);
  const timeout = edited ?? (settings ? String(settings.presetTimeoutSeconds) : '');

  const saveMutation = useMutation({
    mutationFn: (seconds: number) => settingsApi.update({ presetTimeoutSeconds: seconds }),
    onSuccess: () => {
      toast.success('Configuración de preset guardada');
      setEdited(null); // vuelve a seguir el valor del servidor
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'No se pudo guardar la configuración'));
    },
  });

  const parsed = parseInt(timeout, 10);
  const isValid = !isNaN(parsed) && parsed >= 0 && parsed <= 99;
  const isDirty = settings != null && parsed !== settings.presetTimeoutSeconds;

  if (error && isForbidden(error)) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-center gap-3 py-6 text-amber-700">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">La configuración de preset no está disponible para tu usuario.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-4 w-4 text-slate-500" />
          Preset
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando configuración...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {getErrorMessage(error, 'No se pudo leer la configuración')}
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600">
                Tiempo para retirar la manguera{' '}
                <span className="font-normal text-slate-400">(0–99 seg)</span>
              </label>
              <Input
                type="number"
                min="0"
                max="99"
                value={timeout}
                onChange={(e) => setEdited(e.target.value)}
                className="max-w-[140px] bg-white"
              />
              <p className="text-xs text-slate-500">
                Cuánto espera la bomba a que levanten la manguera antes de volver a
                bloquearse. Valores bajos dejan al pistero sin margen.
              </p>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button
                onClick={() => saveMutation.mutate(parsed)}
                disabled={!isValid || !isDirty || saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ConfiguracionPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
            <p className="text-sm text-slate-500">Configuración del sistema y del concentrador</p>
          </div>
        </div>

        <div className="space-y-6">
          <ClockCard />
          <PresetCard />
        </div>
      </div>
    </div>
  );
}
