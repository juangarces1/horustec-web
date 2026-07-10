'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarDays } from 'lucide-react';

export interface DaySales {
  /** Clave local YYYY-MM-DD */
  dayKey: string;
  /** Etiqueta corta, ej. "vie 4" */
  label: string;
  ventas: number;
  count: number;
}

interface SalesByDayChartProps {
  data: DaySales[];
  /** dayKey efectivo seleccionado (hoy por defecto) */
  selectedDay: string;
  onSelectDay: (dayKey: string) => void;
}

// Selección por luminosidad del mismo tono (validado con dataviz):
// indigo-400 para los días, indigo-700 para el seleccionado.
const BAR_COLOR = '#818cf8';
const BAR_COLOR_SELECTED = '#4338ca';

export function SalesByDayChart({ data, selectedDay, onSelectDay }: SalesByDayChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const day: DaySales = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-medium text-slate-900">{day.label}</p>
          <p className="text-sm font-bold text-indigo-600 mt-1">
            ₡{day.ventas.toLocaleString('es-CR')}
          </p>
          <p className="text-xs text-slate-500">{day.count} transacciones</p>
          <p className="text-xs text-slate-400 mt-1">
            {day.dayKey === selectedDay ? 'Mostrando este día' : 'Click para filtrar'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-xl font-bold text-slate-900">
            Ventas por Día (Últimos 7 Días)
          </CardTitle>
          <span className="ml-auto text-xs font-medium text-slate-400">
            Click en un día para filtrar el dashboard
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `₡${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar
              dataKey="ventas"
              radius={[8, 8, 0, 0]}
              className="cursor-pointer"
              onClick={(entry: any) => entry?.dayKey && onSelectDay(entry.dayKey)}
            >
              {data.map((day) => (
                <Cell
                  key={day.dayKey}
                  fill={day.dayKey === selectedDay ? BAR_COLOR_SELECTED : BAR_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
