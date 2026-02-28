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
  ReferenceArea,
} from 'recharts';
import { Clock } from 'lucide-react';
import { FuelingTransactionDto } from '@/types/api';

const SHIFTS = [
  { name: 'Turno 1', start: 5, end: 13, color: '#fef3c7' },
  { name: 'Turno 2', start: 13, end: 21, color: '#e0e7ff' },
  { name: 'Turno 3a', start: 21, end: 24, color: '#d1fae5' },
  { name: 'Turno 3b', start: 0, end: 5, color: '#d1fae5' },
];

interface HourlyTrafficChartProps {
  transactions: FuelingTransactionDto[];
}

export function HourlyTrafficChart({ transactions }: HourlyTrafficChartProps) {
  const chartData = useMemo(() => {
    const counts = new Array(24).fill(0);

    for (const t of transactions) {
      const hour = new Date(t.transactionDate).getHours();
      counts[hour]++;
    }

    return counts.map((count, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      transacciones: count,
    }));
  }, [transactions]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const hour = payload[0].payload.hour;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900">Hora: {hour}</p>
          <p className="text-sm font-bold text-indigo-600 mt-1">
            {payload[0].value} transacciones
          </p>
        </div>
      );
    }
    return null;
  };

  const hasData = chartData.some((d) => d.transacciones > 0);

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-lg font-bold text-slate-900">
            Flujo de Clientes por Hora
          </CardTitle>
        </div>
        <div className="flex gap-4 text-xs text-slate-500 mt-1">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#fef3c7' }} /> Turno 1 (5-13h)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#e0e7ff' }} /> Turno 2 (13-21h)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: '#d1fae5' }} /> Turno 3 (21-5h)
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            Sin datos de trafico en este periodo
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              {/* Shift background bands */}
              <ReferenceArea x1="00:00" x2="04:00" fill="#d1fae5" fillOpacity={0.4} />
              <ReferenceArea x1="05:00" x2="12:00" fill="#fef3c7" fillOpacity={0.4} />
              <ReferenceArea x1="13:00" x2="20:00" fill="#e0e7ff" fillOpacity={0.4} />
              <ReferenceArea x1="21:00" x2="23:00" fill="#d1fae5" fillOpacity={0.4} />
              <XAxis
                dataKey="hour"
                stroke="#64748b"
                style={{ fontSize: '11px' }}
                interval={1}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="transacciones"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
