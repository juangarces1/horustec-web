'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Users } from 'lucide-react';
import { FuelingTransactionDto } from '@/types/api';

const SHIFTS = [
  { name: 'Turno 1 (5-13h)', key: 'turno1', start: 5, end: 13, color: '#f59e0b' },
  { name: 'Turno 2 (13-21h)', key: 'turno2', start: 13, end: 21, color: '#6366f1' },
  { name: 'Turno 3 (21-5h)', key: 'turno3', start: 21, end: 5, color: '#10b981' },
];

function getShiftIndex(hour: number): number {
  if (hour >= 5 && hour < 13) return 0;
  if (hour >= 13 && hour < 21) return 1;
  return 2;
}

interface AttendantPerformanceChartProps {
  transactions: FuelingTransactionDto[];
}

export function AttendantPerformanceChart({ transactions }: AttendantPerformanceChartProps) {
  const chartData = useMemo(() => {
    const map = new Map<string, { turno1: number; turno2: number; turno3: number }>();

    for (const t of transactions) {
      const name = t.attendantName || 'Sin asignar';
      const hour = new Date(t.transactionDate).getHours();
      const shift = getShiftIndex(hour);

      if (!map.has(name)) {
        map.set(name, { turno1: 0, turno2: 0, turno3: 0 });
      }
      const entry = map.get(name)!;
      if (shift === 0) entry.turno1++;
      else if (shift === 1) entry.turno2++;
      else entry.turno3++;
    }

    return Array.from(map.entries())
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => (b.turno1 + b.turno2 + b.turno3) - (a.turno1 + a.turno2 + a.turno3));
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-900 mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
              {p.name}: {p.value} transacciones
            </p>
          ))}
          <p className="text-sm font-bold text-slate-700 mt-1 border-t pt-1">
            Total: {total}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-lg font-bold text-slate-900">
            Rendimiento de Frentistas por Turno
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            Sin datos de frentistas en este periodo
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                style={{ fontSize: '11px' }}
                interval={0}
                angle={chartData.length > 5 ? -25 : 0}
                textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                height={chartData.length > 5 ? 60 : 30}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {SHIFTS.map((shift) => (
                <Bar
                  key={shift.key}
                  dataKey={shift.key}
                  name={shift.name}
                  fill={shift.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
