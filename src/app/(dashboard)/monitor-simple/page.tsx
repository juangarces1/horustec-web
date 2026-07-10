'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '@/lib/api/monitoring';
import { attendantsApi } from '@/lib/api/attendants';
import { pricesApi } from '@/lib/api/prices';
import { DispenserNozzleGroup, type GroupNozzle } from '@/components/monitor/dispenser-nozzle-group';
import { ActiveFuelings } from '@/components/monitor/active-fuelings';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import { NOZZLE_PRODUCTS, PRODUCT_COLORS } from '@/lib/nozzle-products';
import type { VisualizationDto } from '@/types/api';

function MonitorMangueras() {
  const [visualizations, setVisualizations] = useState<Map<string, number>>(new Map());
  const [activeFuelings, setActiveFuelings] = useState<VisualizationDto[]>([]);

  const { data: attendants } = useQuery({
    queryKey: ['attendants-active'],
    queryFn: () => attendantsApi.getAll(true),
    staleTime: 60_000,
  });

  const { data: prices } = useQuery({
    queryKey: ['prices-current'],
    queryFn: pricesApi.getCurrent,
    staleTime: 60_000,
  });

  const attendantsByTag = useMemo(() => {
    const map = new Map<string, string>();
    attendants?.forEach((a) => { if (a.tagId) map.set(a.tagId.toUpperCase(), a.fullName); });
    return map;
  }, [attendants]);

  const pricesByProduct = useMemo(() => {
    const map = new Map<string, number>();
    prices?.forEach((p) => map.set(p.productName.toLowerCase(), p.currentPrice));
    return map;
  }, [prices]);

  const { data: statuses, isLoading, error, refetch } = useQuery({
    queryKey: ['nozzle-statuses'],
    queryFn: monitoringApi.getStatuses,
    refetchInterval: 2000,
  });

  useQuery({
    queryKey: ['visualizations'],
    queryFn: async () => {
      const data = await monitoringApi.getVisualization();
      const map = new Map<string, number>();
      data.forEach((v) => map.set(v.nozzleCode, v.currentCash * 100));
      setVisualizations(map);
      setActiveFuelings(data);
      return data;
    },
    refetchInterval: 1000,
  });

  // Mangueras 01-03 = D01, 04-06 = D02, ... 28-30 = D10
  const dispenserGroups = useMemo(() => {
    if (!statuses) return [];
    const groups: { dispenserNumber: number; nozzles: GroupNozzle[] }[] = [];
    for (let i = 0; i < statuses.length; i += 3) {
      groups.push({
        dispenserNumber: i / 3 + 1,
        nozzles: statuses.slice(i, i + 3).map((n) => ({
          code: n.nozzleCode,
          product: NOZZLE_PRODUCTS[n.nozzleCode] ?? 'Desconocido',
          status: n.status,
          currentCash: visualizations.get(n.nozzleCode),
        })),
      });
    }
    return groups;
  }, [statuses, visualizations]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Cargando mangueras...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-red-500">
          Error al cargar estados: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Monitor de Mangueras</h1>
          <p className="mt-2 text-lg text-slate-600">
            Estado individual de las 30 mangueras agrupadas por dispensador · actualización automática
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="border-2">
          <Activity className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Grupos por dispensador */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {dispenserGroups.map((group) => (
          <DispenserNozzleGroup
            key={group.dispenserNumber}
            dispenserNumber={group.dispenserNumber}
            nozzles={group.nozzles}
          />
        ))}
      </div>

      {/* Abastecimientos activos */}
      <ActiveFuelings
        visualizations={activeFuelings}
        attendantsByTag={attendantsByTag}
        pricesByProduct={pricesByProduct}
      />

      {/* Leyenda */}
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-slate-800">Leyenda</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-lg bg-green-500 shadow-md"></div>
            <span className="text-sm font-medium">Libre</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-lg bg-slate-200 shadow-md"></div>
            <span className="text-sm font-medium">Bloqueado</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-md ring-2 ring-orange-300"></div>
            <span className="text-sm font-medium">Abasteciendo</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-lg bg-blue-500 shadow-md"></div>
            <span className="text-sm font-medium">Pronto</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-lg bg-yellow-500 shadow-md"></div>
            <span className="text-sm font-medium">Espera</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-lg bg-red-600 shadow-md"></div>
            <span className="text-sm font-medium">Falla</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-lg bg-purple-500 shadow-md"></div>
            <span className="text-sm font-medium">Ocupado</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-lg bg-red-800 shadow-md"></div>
            <span className="text-sm font-medium">Error</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 shadow-md"></div>
            <span className="text-sm font-medium">No Config.</span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4">
          <span className="text-sm font-semibold text-slate-600">Productos:</span>
          {Object.entries(PRODUCT_COLORS).map(([product, color]) => (
            <div key={product} className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm font-medium">{product}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MonitorManguerasPage() {
  return <MonitorMangueras />;
}
