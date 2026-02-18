'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '@/lib/api/monitoring';
import { monitoringHub } from '@/lib/signalr/monitoring-hub';
import { NozzleCard } from '@/components/monitor/nozzle-card';
import { ProtectedRoute } from '@/components/auth/protected-route';
import type { NozzleStatusDto, VisualizationDto } from '@/types/api';

function MonitorContent() {
  const [visualizations, setVisualizations] = useState<Map<string, number>>(new Map());

  // Fetch nozzle statuses
  const { data: statuses, isLoading, error } = useQuery({
    queryKey: ['nozzle-statuses'],
    queryFn: monitoringApi.getStatuses,
    refetchInterval: 5000, // Poll every 5 seconds as fallback
  });

  // Fetch initial visualizations
  useQuery({
    queryKey: ['visualizations'],
    queryFn: async () => {
      const data = await monitoringApi.getVisualization();
      const map = new Map<string, number>();
      data.forEach((v) => map.set(v.nozzleCode, v.currentLiters));
      setVisualizations(map);
      return data;
    },
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // SignalR real-time updates
  useEffect(() => {
    monitoringHub.connect();

    monitoringHub.onStatusChanged((nozzleNumber, status, statusDescription) => {
      console.log('Status changed:', { nozzleNumber, status, statusDescription });
      // React Query will auto-refetch due to refetchInterval
    });

    monitoringHub.onVisualizationUpdated((nozzleNumber, currentValue) => {
      console.log('Visualization updated:', { nozzleNumber, currentValue });
      setVisualizations((prev) => new Map(prev).set(nozzleNumber.toString().padStart(2, '0'), currentValue));
    });

    return () => {
      monitoringHub.off('StatusChanged');
      monitoringHub.off('VisualizationUpdated');
      monitoringHub.disconnect();
    };
  }, []);

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Monitor de Surtidores</h1>
          <p className="mt-2 text-gray-600">Estado en tiempo real de los 30 nozzles</p>
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
      </div>
    </div>
  );
}

export default function MonitorPage() {
  return (
    <ProtectedRoute>
      <MonitorContent />
    </ProtectedRoute>
  );
}
