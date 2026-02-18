'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fuel } from 'lucide-react';
import type { NozzleStatusDto, VisualizationDto } from '@/types/api';

interface ActiveFuelingsProps {
  statuses: NozzleStatusDto[];
  visualizations: VisualizationDto[];
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

export function ActiveFuelings({ statuses, visualizations }: ActiveFuelingsProps) {
  // Filter nozzles with status 3 (Fueling)
  const activeNozzles = statuses.filter((status) => status.status === 3);

  // Create a map of visualizations for quick lookup
  const visMap = new Map(visualizations.map((v) => [v.nozzleCode, v]));

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Fuel className="h-4 w-4 text-orange-600 animate-pulse" />
          </div>
          <CardTitle className="text-lg font-bold text-slate-900">
            Abasteciendo Ahora
          </CardTitle>
          <Badge variant="default" className="ml-auto bg-orange-500">
            {activeNozzles.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activeNozzles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Fuel className="h-12 w-12 mb-3 text-slate-300" />
            <p className="text-sm">Sin abastecimientos activos</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeNozzles.map((nozzle) => {
              const vis = visMap.get(nozzle.nozzleCode);
              const dispenserNumber = Math.ceil(parseInt(nozzle.nozzleCode) / 3);
              const product = NOZZLE_PRODUCTS[nozzle.nozzleCode] || 'Desconocido';

              return (
                <div
                  key={nozzle.nozzleCode}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-500 text-white font-bold">
                      {dispenserNumber}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Dispensador {dispenserNumber} • Manguera {nozzle.nozzleCode}
                      </p>
                      <p className="text-xs text-slate-600">{product}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">
                      {vis ? `₡${(vis.currentLiters * 100).toFixed(0)}` : '---'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {vis ? `${vis.currentLiters.toFixed(2)} L` : '---'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
