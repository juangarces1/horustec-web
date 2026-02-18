'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '@/lib/api/monitoring';
import { monitoringHub } from '@/lib/signalr/monitoring-hub';
import { DispenserCard } from '@/components/monitor/dispenser-card';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import type { NozzleStatusDto, VisualizationDto, NozzleStatus } from '@/types/api';

interface DispenserGroup {
  dispenserNumber: number;
  nozzleCodes: string[];
  products: string[];
  status: NozzleStatus;
  currentLiters: number | null;
  activeNozzle: { code: string; product: string } | null;
}

// Product mapping based on nozzle configuration
const NOZZLE_PRODUCTS: Record<string, string> = {
  '01': 'Super',
  '02': 'Regular',
  '03': 'Diesel',
  '04': 'Super',
  '05': 'Regular',
  '06': 'Diesel',
  '07': 'Super',
  '08': 'Regular',
  '09': 'Diesel',
  '10': 'Super',
  '11': 'Regular',
  '12': 'Diesel',
  '13': 'Super',
  '14': 'Regular',
  '15': 'Diesel',
  '16': 'Super',
  '17': 'Regular',
  '18': 'Diesel',
  '19': 'Super',
  '20': 'Regular',
  '21': 'Diesel',
  '22': 'Super',
  '23': 'Regular',
  '24': 'Diesel',
  '25': 'Super',
  '26': 'Exonerado',
  '27': 'Diesel',
  '28': 'Super',
  '29': 'Exonerado',
  '30': 'Diesel',
};

function DispensadoresContent() {
  const [visualizations, setVisualizations] = useState<Map<string, number>>(new Map());

  // Fetch nozzle statuses
  const { data: statuses, isLoading, error, refetch } = useQuery({
    queryKey: ['nozzle-statuses'],
    queryFn: monitoringApi.getStatuses,
    refetchInterval: 3000, // Poll every 3 seconds as fallback
  });

  // Fetch visualizations
  useQuery({
    queryKey: ['visualizations'],
    queryFn: async () => {
      const data = await monitoringApi.getVisualization();
      const map = new Map<string, number>();
      // Multiply by 100 because visualization returns money value
      data.forEach((v) => map.set(v.nozzleCode, v.currentLiters * 100));
      setVisualizations(map);
      return data;
    },
    refetchInterval: 1000, // Poll every 1 second
  });

  // SignalR real-time updates
  useEffect(() => {
    monitoringHub.connect();

    monitoringHub.onStatusChanged((nozzleNumber, status, statusDescription) => {
      console.log('Status changed:', { nozzleNumber, status, statusDescription });
      refetch();
    });

    monitoringHub.onVisualizationUpdated((nozzleNumber, currentValue) => {
      console.log('Visualization updated:', { nozzleNumber, currentValue });
      const nozzleCode = nozzleNumber.toString().padStart(2, '0');
      // Multiply by 100 because visualization returns money value
      setVisualizations((prev) => new Map(prev).set(nozzleCode, currentValue * 100));
    });

    return () => {
      monitoringHub.off('StatusChanged');
      monitoringHub.off('VisualizationUpdated');
    };
  }, [refetch]);

  // Group nozzles into dispensers (3 nozzles per dispenser)
  const groupDispensers = (nozzles: NozzleStatusDto[]): DispenserGroup[] => {
    const dispensers: DispenserGroup[] = [];

    for (let i = 0; i < 10; i++) {
      const dispenserNumber = i + 1;
      const startNozzle = i * 3;
      const dispenserNozzles = nozzles.slice(startNozzle, startNozzle + 3);

      if (dispenserNozzles.length === 0) continue;

      // Determine dispenser status and active nozzle
      // Priority: Fueling > Ready > Waiting > Busy > Blocked > Available > Error > Failure > NotConfigured
      let dispenserStatus = dispenserNozzles[0].status;
      let activeNozzleIndex = 0;
      const statusPriority = [3, 4, 5, 7, 2, 1, 8, 6, 0]; // Fueling, Ready, Waiting, Busy, Blocked, Available, Error, Failure, NotConfigured

      for (let i = 0; i < dispenserNozzles.length; i++) {
        const nozzle = dispenserNozzles[i];
        const currentPriority = statusPriority.indexOf(nozzle.status);
        const dispenserPriority = statusPriority.indexOf(dispenserStatus);
        if (currentPriority < dispenserPriority) {
          dispenserStatus = nozzle.status;
          activeNozzleIndex = i;
        }
      }

      // Check if all nozzles have the same status
      const allSameStatus = dispenserNozzles.every(n => n.status === dispenserStatus);

      // Get total liters from visualizations for this dispenser
      let totalLiters = 0;
      let hasLiters = false;
      for (const nozzle of dispenserNozzles) {
        const liters = visualizations.get(nozzle.nozzleCode);
        if (liters && liters > 0) {
          totalLiters += liters;
          hasLiters = true;
        }
      }

      // Determine active nozzle info (only if not all same status or if fueling)
      let activeNozzle: { code: string; product: string } | null = null;
      if (!allSameStatus || dispenserStatus === 3) { // 3 = Fueling
        const nozzle = dispenserNozzles[activeNozzleIndex];
        activeNozzle = {
          code: nozzle.nozzleCode,
          product: NOZZLE_PRODUCTS[nozzle.nozzleCode] || 'Unknown',
        };
      }

      dispensers.push({
        dispenserNumber,
        nozzleCodes: dispenserNozzles.map(n => n.nozzleCode),
        products: dispenserNozzles.map(n => NOZZLE_PRODUCTS[n.nozzleCode] || 'Unknown'),
        status: dispenserStatus,
        currentLiters: hasLiters ? totalLiters : null,
        activeNozzle,
      });
    }

    return dispensers;
  };

  const dispensers = statuses ? groupDispensers(statuses) : [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
          <div className="text-xl">Cargando dispensadores...</div>
        </div>
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
          <h1 className="text-4xl font-bold text-slate-900">
            Monitor de Dispensadores
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Vista agrupada con actualización en tiempo real via SignalR
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="border-2">
          <Activity className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Dispensers Grid */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {dispensers.map((dispenser) => (
          <DispenserCard
            key={dispenser.dispenserNumber}
            dispenserNumber={dispenser.dispenserNumber}
            status={dispenser.status}
            currentLiters={dispenser.currentLiters}
            activeNozzle={dispenser.activeNozzle}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-slate-800">Leyenda de Estados</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-lg bg-green-500 shadow-md"></div>
            <span className="text-sm font-medium">Libre</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 rounded-lg bg-red-500 shadow-md"></div>
              <span className="text-sm font-medium">Bloqueado</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 rounded-lg bg-orange-500 shadow-md animate-pulse"></div>
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
              <div className="h-5 w-5 rounded-lg bg-red-800 shadow-md"></div>
              <span className="text-sm font-medium">Falla</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 rounded-lg bg-purple-500 shadow-md"></div>
              <span className="text-sm font-medium">Ocupado</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 rounded-lg bg-red-900 shadow-md"></div>
              <span className="text-sm font-medium">Error</span>
            </div>
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 rounded-lg bg-gray-300 shadow-md"></div>
            <span className="text-sm font-medium">No Config.</span>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="text-4xl">⚡</div>
          <div>
            <h3 className="text-lg font-bold">Actualización en Tiempo Real</h3>
            <p className="text-sm opacity-90">
              Los estados y litros se actualizan automáticamente vía SignalR.
              Cada dispensador agrupa 3 nozzles y muestra el progreso total cuando están abasteciendo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DispensadoresPage() {
  return <DispensadoresContent />;
}
