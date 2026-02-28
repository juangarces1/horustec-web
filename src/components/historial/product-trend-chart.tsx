'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { FuelingTransactionDto } from '@/types/api';

const PRODUCT_COLORS: Record<string, string> = {
  'Regular': '#f59e0b',
  'Super': '#ef4444',
  'Diesel': '#3b82f6',
  'Exonerado': '#10b981',
};

const DEFAULT_COLOR = '#8b5cf6';

interface ProductTrendChartProps {
  transactions: FuelingTransactionDto[];
}

export function ProductTrendChart({ transactions }: ProductTrendChartProps) {
  const { chartData, products } = useMemo(() => {
    // Group by date and product
    const dateMap = new Map<string, Map<string, number>>();
    const productSet = new Set<string>();

    for (const t of transactions) {
      const date = new Date(t.transactionDate);
      const dateKey = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const product = t.productName || t.fuelCode || 'Desconocido';
      productSet.add(product);

      if (!dateMap.has(sortKey)) {
        dateMap.set(sortKey, new Map());
      }
      const dayMap = dateMap.get(sortKey)!;
      dayMap.set(product, (dayMap.get(product) || 0) + t.totalLiters);
    }

    const products = Array.from(productSet).sort();

    const chartData = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sortKey, dayMap]) => {
        const parts = sortKey.split('-');
        const displayDate = `${parts[2]}/${parts[1]}`;
        const entry: Record<string, any> = { date: displayDate };
        for (const p of products) {
          entry[p] = parseFloat((dayMap.get(p) || 0).toFixed(2));
        }
        return entry;
      });

    return { chartData, products };
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-900 mb-1">Fecha: {label}</p>
          {payload.map((p: any) => (
            <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
              {p.name}: {p.value.toLocaleString('es-CR', { minimumFractionDigits: 2 })} L
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-lg font-bold text-slate-900">
            Tendencia de Volumen por Producto
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            Sin datos de productos en este periodo
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                style={{ fontSize: '11px' }}
                angle={chartData.length > 10 ? -45 : 0}
                textAnchor={chartData.length > 10 ? 'end' : 'middle'}
                height={chartData.length > 10 ? 50 : 30}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value.toLocaleString()} L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {products.map((product) => (
                <Line
                  key={product}
                  type="monotone"
                  dataKey={product}
                  name={product}
                  stroke={PRODUCT_COLORS[product] || DEFAULT_COLOR}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
