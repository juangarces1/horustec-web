'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import type { FuelingTransactionDto } from '@/types/api';

interface TopProductsProps {
  transactions: FuelingTransactionDto[];
}

interface ProductSummary {
  product: string;
  liters: number;
  cash: number;
  count: number;
  percentage: number;
}

export function TopProducts({ transactions }: TopProductsProps) {
  // Group transactions by product (filter out those without product)
  const productMap = transactions
    .filter(tx => tx.productName && tx.productName.trim() !== '')
    .reduce((acc, tx) => {
      const product = tx.productName!;
      if (!acc[product]) {
        acc[product] = { product, liters: 0, cash: 0, count: 0, percentage: 0 };
      }
      acc[product].liters += tx.totalLiters;
      acc[product].cash += tx.totalCash;
      acc[product].count++;
      return acc;
    }, {} as Record<string, ProductSummary>);

  // Calculate total liters for percentage
  const totalLiters = Object.values(productMap).reduce((sum, p) => sum + p.liters, 0);

  // Calculate percentages and get top 3
  const products = Object.values(productMap)
    .map((p) => ({
      ...p,
      percentage: totalLiters > 0 ? (p.liters / totalLiters) * 100 : 0,
    }))
    .sort((a, b) => b.liters - a.liters)
    .slice(0, 3);

  console.log('📦 Productos procesados:', products.length, products);

  // Color mapping for different products
  const getProductColor = (index: number) => {
    const colors = [
      { bg: 'from-purple-50 to-violet-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-500' },
      { bg: 'from-green-50 to-emerald-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-500' },
      { bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-500' },
    ];
    return colors[index] || colors[0];
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Package className="h-4 w-4 text-purple-600" />
          </div>
          <CardTitle className="text-lg font-bold text-slate-900">
            Productos Más Vendidos
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Package className="h-12 w-12 mb-3 text-slate-300" />
            <p className="text-sm font-medium">Sin productos registrados</p>
            <p className="text-xs mt-1 text-slate-400">Las transacciones no tienen producto asociado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product, index) => {
              const colors = getProductColor(index);
              return (
                <div
                  key={product.product}
                  className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r ${colors.bg} border ${colors.border}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`flex items-center justify-center h-10 w-10 rounded-full ${colors.badge} text-white font-bold`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{product.product}</p>
                      <p className="text-xs text-slate-600">
                        {product.liters.toFixed(2)} L • ₡{product.cash.toLocaleString('es-CR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <Badge variant="outline" className={`border-2 ${colors.text.replace('text-', 'border-')} ${colors.text} font-bold`}>
                      {product.percentage.toFixed(1)}%
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">{product.count} TX</p>
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
