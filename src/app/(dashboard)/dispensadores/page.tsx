'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '@/lib/api/monitoring';
import { attendantsApi } from '@/lib/api/attendants';
import { pricesApi } from '@/lib/api/prices';
import { monitoringHub } from '@/lib/signalr/monitoring-hub';
import { DispenserCard } from '@/components/monitor/dispenser-card';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import type { NozzleStatusDto, NozzleStatus } from '@/types/api';

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
  // nozzleCode → { cash, tagId } for enrichment (attendant + liters)
  const [nozzleRawData, setNozzleRawData] = useState<Map<string, { cash: number; tagId: string | null }>>(new Map());


  // Fetch nozzle statuses
  const { data: statuses, isLoading, error, refetch } = useQuery({
    queryKey: ['nozzle-statuses'],
    queryFn: monitoringApi.getStatuses,
    refetchInterval: 3000,
  });

  // Fetch visualizations — sets nozzleRawData which drives the attendant resolution below.
  useQuery({
    queryKey: ['visualizations'],
    queryFn: async () => {
      const data = await monitoringApi.getVisualization();
      const displayMap = new Map<string, number>();
      data.forEach((v) => displayMap.set(v.nozzleCode, v.currentCash * 100));
      setVisualizations(displayMap);
      setNozzleRawData((prev) => {
        const next = new Map<string, { cash: number; tagId: string | null }>();
        data.forEach((v) => {
          // Preserve tagId from SignalR if the REST endpoint returns null
          const existing = prev.get(v.nozzleCode);
          next.set(v.nozzleCode, { cash: v.currentCash, tagId: v.tagId ?? existing?.tagId ?? null });
        });
        return next;
      });
      return data;
    },
    refetchInterval: 1000,
  });

  const { data: attendants } = useQuery({
    queryKey: ['attendants-active'],
    queryFn: () => attendantsApi.getAll(true),
    staleTime: 30_000,
  });

  const attendantsByTag = useMemo(() => {
    const map = new Map<string, { name: string; photoUrl: string | null }>();
    attendants?.forEach((a) => {
      if (a.tagId) map.set(a.tagId.trim().toUpperCase(), { name: a.fullName, photoUrl: a.photoUrl });
    });
    return map;
  }, [attendants]);

  const { data: prices } = useQuery({
    queryKey: ['prices-current'],
    queryFn: pricesApi.getCurrent,
    staleTime: 60_000,
  });

  const pricesByProduct = useMemo(() => {
    const map = new Map<string, number>();
    prices?.forEach((p) => map.set(p.productName.toLowerCase(), p.currentPrice));
    return map;
  }, [prices]);


  // SignalR real-time updates
  useEffect(() => {
    monitoringHub.connect();

    monitoringHub.onStatusChanged((nozzleNumber, status, statusDescription) => {
      console.log('Status changed:', { nozzleNumber, status, statusDescription });
      refetch();
    });

    monitoringHub.onVisualizationUpdated(({ nozzleCode, currentCash, tagId }) => {
      setVisualizations((prev) => new Map(prev).set(nozzleCode, currentCash * 100));
      setNozzleRawData((prev) => {
        const next = new Map(prev);
        const existing = prev.get(nozzleCode);
        next.set(nozzleCode, { cash: currentCash, tagId: tagId ?? existing?.tagId ?? null });
        return next;
      });
    });

    return () => {
      monitoringHub.off('StatusChanged');
      monitoringHub.off('ReceiveVisualization');
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
      const statusPriority = [3, 4, 5, 7, 2, 1, 8, 6, 0];

      for (let j = 0; j < dispenserNozzles.length; j++) {
        const nozzle = dispenserNozzles[j];
        const currentPriority = statusPriority.indexOf(nozzle.status);
        const dispenserPriority = statusPriority.indexOf(dispenserStatus);
        if (currentPriority < dispenserPriority) {
          dispenserStatus = nozzle.status;
          activeNozzleIndex = j;
        }
      }

      // Check if all nozzles have the same status
      const allSameStatus = dispenserNozzles.every(n => n.status === dispenserStatus);

      // Get total cash from visualizations for this dispenser
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
        {dispensers.map((dispenser) => {
          // Find the first nozzle in this dispenser that has an active tagId in nozzleRawData.
          // We scan all nozzleCodes rather than relying solely on activeNozzle.code because
          // activeNozzle can be null when allSameStatus=true (e.g. all nozzles are Fueling).
          let activeTagId: string | null = null;
          let activeRaw: { cash: number; tagId: string | null } | undefined;

          // Prefer the designated activeNozzle first (it has priority-based selection).
          if (dispenser.activeNozzle?.code) {
            activeRaw = nozzleRawData.get(dispenser.activeNozzle.code);
            activeTagId = activeRaw?.tagId ?? null;
          }

          // Fall back: scan all nozzles in this dispenser for a tagId.
          if (!activeTagId) {
            for (const code of dispenser.nozzleCodes) {
              const candidate = nozzleRawData.get(code);
              if (candidate?.tagId) {
                activeRaw = candidate;
                activeTagId = candidate.tagId;
                break;
              }
            }
          }

          const tagIdNorm = activeTagId?.trim().toUpperCase() ?? null;
          const attendantInfo = tagIdNorm ? (attendantsByTag.get(tagIdNorm) ?? null) : null;
          const attendantName = attendantInfo?.name ?? null;
          const attendantPhotoUrl = attendantInfo?.photoUrl ?? null;

          const productKey = dispenser.activeNozzle?.product?.toLowerCase();
          const price = productKey ? pricesByProduct.get(productKey) : null;
          const calculatedLiters = activeRaw && price && price > 0
            ? (activeRaw.cash * 100) / price
            : null;

          return (
            <DispenserCard
              key={dispenser.dispenserNumber}
              dispenserNumber={dispenser.dispenserNumber}
              status={dispenser.status}
              currentLiters={dispenser.currentLiters}
              activeNozzle={dispenser.activeNozzle}
              attendantName={attendantName}
              attendantPhotoUrl={attendantPhotoUrl}
              calculatedLiters={calculatedLiters}
            />
          );
        })}
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
