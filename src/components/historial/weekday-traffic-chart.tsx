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
  Cell,
} from 'recharts';
import { CalendarDays } from 'lucide-react';
import { FuelingTransactionDto } from '@/types/api';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_COLORS = [
  '#ef4444', // Dom - rojo (dia bajo)
  '#6366f1', // Lun
  '#6366f1', // Mar
  '#6366f1', // Mié
  '#6366f1', // Jue
  '#6366f1', // Vie
  '#f59e0b', // Sáb - amber (dia especial)
];

interface WeekdayTrafficChartProps {
  transactions: FuelingTransactionDto[];
}

export function WeekdayTrafficChart({ transactions }: WeekdayTrafficChartProps) {
  const chartData = useMemo(() => {
    const counts = new Array(7).fill(0);

    for (const t of transactions) {
      const day = new Date(t.transactionDate).getDay(); // 0=Dom, 6=Sáb
      counts[day]++;
    }

    // Reorder: Lun-Dom (start week on Monday)
    const mondayFirst = [1, 2, 3, 4, 5, 6, 0];
    return mondayFirst.map((dayIdx) => ({
      dia: DAY_NAMES[dayIdx],
      transacciones: counts[dayIdx],
      color: DAY_COLORS[dayIdx],
    }));
  }, [transactions]);

  const hasData = chartData.some((d) => d.transacciones > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900">{payload[0].payload.dia}</p>
          <p className="text-sm font-bold text-indigo-600 mt-1">
            {payload[0].value} transacciones
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
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-lg font-bold text-slate-900">
            Flujo de Clientes por Día de la Semana
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            Sin datos en este periodo
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="dia"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="transacciones" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
