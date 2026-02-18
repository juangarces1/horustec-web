'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import type { FuelingTransactionDto } from '@/types/api';

interface ActiveAttendantsProps {
  transactions: FuelingTransactionDto[];
}

interface AttendantSummary {
  name: string;
  count: number;
  totalLiters: number;
  totalCash: number;
}

export function ActiveAttendants({ transactions }: ActiveAttendantsProps) {
  // Group transactions by attendant (filter out those without attendant)
  const attendantMap = transactions
    .filter(tx => tx.attendantName && tx.attendantName.trim() !== '')
    .reduce((acc, tx) => {
      const name = tx.attendantName!;
      if (!acc[name]) {
        acc[name] = { name, count: 0, totalLiters: 0, totalCash: 0 };
      }
      acc[name].count++;
      acc[name].totalLiters += tx.totalLiters;
      acc[name].totalCash += tx.totalCash;
      return acc;
    }, {} as Record<string, AttendantSummary>);

  const attendants = Object.values(attendantMap).sort((a, b) => b.count - a.count);

  console.log('👥 Frentistas procesados:', attendants.length, attendants);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <CardTitle className="text-lg font-bold text-slate-900">
            Frentistas Activos
          </CardTitle>
          <Badge variant="default" className="ml-auto bg-blue-500">
            {attendants.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {attendants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Users className="h-12 w-12 mb-3 text-slate-300" />
            <p className="text-sm font-medium">Sin frentistas asignados</p>
            <p className="text-xs mt-1 text-slate-400">Las transacciones no tienen frentista asociado</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {attendants.map((attendant, index) => (
              <div
                key={attendant.name}
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500 text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{attendant.name}</p>
                    <p className="text-xs text-slate-600">
                      {attendant.totalLiters.toFixed(2)} L • ₡{attendant.totalCash.toLocaleString('es-CR')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-blue-500 text-blue-700 font-bold">
                  {attendant.count} TX
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
