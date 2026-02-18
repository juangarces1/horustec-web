'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '@/lib/api/monitoring';
import { NozzleCard } from '@/components/monitor/nozzle-card';
import { ActiveFuelings } from '@/components/monitor/active-fuelings';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { VisualizationDto } from '@/types/api';

function MonitorSimpleContent() {
  const [visualizations, setVisualizations] = useState<Map<string, number>>(new Map());
  const [activeFuelings, setActiveFuelings] = useState<VisualizationDto[]>([]);

  // Fetch nozzle statuses every 2 seconds
  const { data: statuses, isLoading, error, refetch } = useQuery({
    queryKey: ['nozzle-statuses'],
    queryFn: monitoringApi.getStatuses,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Fetch visualizations every 1 second
  useQuery({
    queryKey: ['visualizations'],
    queryFn: async () => {
      const data = await monitoringApi.getVisualization();
      const map = new Map<string, number>();
      // Multiply by 100 because visualization returns money value
      data.forEach((v) => map.set(v.nozzleCode, v.currentLiters * 100));
      setVisualizations(map);
      setActiveFuelings(data);
      return data;
    },
    refetchInterval: 1000, // Poll every 1 second for live values
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Cargando estados...</div>
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Monitor Simple (HTTP)</h1>
            <p className="mt-2 text-gray-600">
              Estado en tiempo real de los 30 nozzles - Actualización cada 2 segundos
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline">
              Actualizar Ahora
            </Button>
            <Link href="/">
              <Button variant="outline">Volver</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {statuses?.map((nozzle) => (
            <NozzleCard
              key={nozzle.nozzleCode}
              nozzleCode={nozzle.nozzleCode}
              status={nozzle.status}
              currentValue={visualizations.get(nozzle.nozzleCode)}
            />
          ))}
        </div>

        {/* Active Fuelings Section */}
        <div className="mt-8">
          <ActiveFuelings visualizations={activeFuelings} />
        </div>

        <div className="mt-8 rounded-lg bg-white p-4 shadow">
          <h2 className="mb-4 text-xl font-semibold">Leyenda de Estados</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-green-500"></div>
              <span className="text-sm">Libre (Available)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-red-500"></div>
              <span className="text-sm">Bloqueado (Blocked)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-orange-500"></div>
              <span className="text-sm">Abasteciendo (Fueling)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-blue-500"></div>
              <span className="text-sm">Pronto (Ready)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-yellow-500"></div>
              <span className="text-sm">Espera (Waiting)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-red-800"></div>
              <span className="text-sm">Falla (Failure)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-purple-500"></div>
              <span className="text-sm">Ocupado (Busy)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-red-900"></div>
              <span className="text-sm">Error</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 rounded bg-gray-300"></div>
              <span className="text-sm">No configurado</span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <p>
            ℹ️ Esta versión usa <strong>solo HTTP polling</strong> (sin SignalR).
            Se actualiza automáticamente cada 1-2 segundos.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MonitorSimplePage() {
  return <MonitorSimpleContent />;
}
