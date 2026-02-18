'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { utils, writeFile } from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { pricesApi } from '@/lib/api/prices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, TrendingUp, ArrowLeft, History, Edit2, Check, Download, BarChart3 } from 'lucide-react';
import type { ProductPriceDto, PriceHistoryDto, UpdatePriceRequest } from '@/types/api';

export default function PreciosPage() {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<ProductPriceDto | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);

  // Query to fetch current prices
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['prices'],
    queryFn: () => pricesApi.getCurrent(),
  });

  // Query to fetch history
  const { data: history = [] } = useQuery({
    queryKey: ['price-history', showHistory],
    queryFn: () => pricesApi.getHistory(showHistory || undefined),
    enabled: showHistory !== null,
  });

  // Export to Excel
  const exportToExcel = () => {
    if (history.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const data = history.map((h) => ({
      Producto: h.productName,
      'Precio Anterior': h.oldPrice,
      'Precio Nuevo': h.newPrice,
      Diferencia: (h.newPrice - h.oldPrice).toFixed(3),
      'Cambio %': (((h.newPrice - h.oldPrice) / h.oldPrice) * 100).toFixed(2) + '%',
      Fecha: new Date(h.changedAt).toLocaleDateString('es-ES'),
      Hora: new Date(h.changedAt).toLocaleTimeString('es-ES'),
      Usuario: h.changedBy,
      Motivo: h.reason || '',
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Historial de Precios');

    const fileName = showHistory
      ? `historial_precios_${products.find(p => p.productId === showHistory)?.productName || 'producto'}_${new Date().toISOString().split('T')[0]}.xlsx`
      : `historial_precios_todos_${new Date().toISOString().split('T')[0]}.xlsx`;

    writeFile(wb, fileName);
    toast.success('Archivo Excel descargado exitosamente');
  };

  // Prepare chart data
  const chartData = history
    .slice()
    .reverse()
    .map((h) => ({
      fecha: new Date(h.changedAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      precio: h.newPrice,
      producto: h.productName,
    }));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-xl text-gray-600">Cargando precios...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Gestión de Precios
            </h1>
            <p className="text-gray-600 mt-1">Control de precios de combustibles</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowChart(!showChart)}
            variant="outline"
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {showChart ? 'Ocultar' : 'Ver'} Gráfica
          </Button>
          <Button
            onClick={() => setShowHistory(showHistory ? null : '')}
            variant="outline"
            className="gap-2"
          >
            <History className="h-4 w-4" />
            {showHistory !== null ? 'Ocultar' : 'Ver'} Historial
          </Button>
        </div>
      </div>

      {/* Chart Panel */}
      {showChart && showHistory !== null && history.length > 0 && (
        <Card className="mb-6 border-2 border-indigo-200 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Evolución de Precios
            </CardTitle>
            <CardDescription>
              {showHistory ? 'Gráfica de cambios de este producto' : 'Gráfica de todos los productos'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="fecha"
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `₡${value.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: any) => [`₡${parseFloat(value).toFixed(3)}`, 'Precio']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="precio"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Precio"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Panel */}
      {showHistory !== null && (
        <Card className="mb-6 border-2 border-blue-200 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Historial de Cambios
                </CardTitle>
                <CardDescription>
                  {showHistory ? 'Cambios de este producto' : 'Todos los cambios de precios'}
                </CardDescription>
              </div>
              {history.length > 0 && (
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  className="gap-2 hover:bg-green-50"
                >
                  <Download className="h-4 w-4" />
                  Exportar Excel
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay cambios registrados</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{h.productName}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="line-through text-red-600">₡{h.oldPrice.toFixed(3)}</span>
                        {' → '}
                        <span className="text-green-600 font-semibold">₡{h.newPrice.toFixed(3)}</span>
                        <span className="ml-2 text-xs">
                          ({((h.newPrice - h.oldPrice) / h.oldPrice * 100).toFixed(2)}%)
                        </span>
                      </div>
                      {h.reason && (
                        <div className="text-xs text-gray-500 mt-1">Motivo: {h.reason}</div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{new Date(h.changedAt).toLocaleDateString('es-ES')}</div>
                      <div className="text-xs">{h.changedBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {editingProduct && (
        <PriceEditForm
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* Products Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <Card
            key={product.productId}
            className="group relative overflow-hidden border-2 transition-all hover:shadow-2xl hover:-translate-y-1 bg-white/80 backdrop-blur-sm hover:border-green-300"
          >
            {/* Fuel Icon */}
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center text-white text-2xl opacity-20 group-hover:opacity-30 transition-opacity">
              ⛽
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-mono font-semibold">
                  {product.productCode}
                </span>
              </div>
              <CardTitle className="text-xl">{product.productName}</CardTitle>
              <CardDescription>Precio por litro</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Price Display */}
              <div className="text-center py-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border-2 border-green-200">
                <div className="text-sm text-gray-500 mb-1">Precio Actual</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  ₡{product.currentPrice.toFixed(product.priceDecimals)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {product.priceDecimals} decimales
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                  onClick={() => setEditingProduct(product)}
                >
                  <Edit2 className="h-3 w-3" />
                  Actualizar Precio
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 hover:bg-blue-50"
                  onClick={() => setShowHistory(product.productId)}
                >
                  <History className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No hay productos configurados</p>
        </div>
      )}
    </div>
  );
}

// Price Edit Form Component
function PriceEditForm({
  product,
  onClose,
}: {
  product: ProductPriceDto;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdatePriceRequest>({
    newPrice: product.currentPrice,
    changedBy: 'admin', // TODO: Get from auth context
    reason: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: (data: UpdatePriceRequest) =>
      pricesApi.updatePrice(product.productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      toast.success('Precio actualizado exitosamente');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar precio');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPrice === product.currentPrice) {
      toast.error('El precio no ha cambiado');
      return;
    }
    mutation.mutate(formData);
  };

  const priceDiff = formData.newPrice - product.currentPrice;
  const percentChange = ((priceDiff / product.currentPrice) * 100).toFixed(2);

  return (
    <Card className="mb-6 border-2 border-green-200 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          Actualizar Precio: {product.productName}
        </CardTitle>
        <CardDescription>
          Precio actual: <span className="font-bold">₡{product.currentPrice.toFixed(product.priceDecimals)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Price Comparison */}
          <div className="grid gap-4 md:grid-cols-3 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
            <div className="text-center">
              <div className="text-sm text-gray-500">Precio Anterior</div>
              <div className="text-2xl font-bold text-gray-700">
                ₡{product.currentPrice.toFixed(product.priceDecimals)}
              </div>
            </div>
            <div className="text-center flex items-center justify-center">
              <TrendingUp className={`h-8 w-8 ${priceDiff > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Nuevo Precio</div>
              <div className={`text-2xl font-bold ${priceDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₡{formData.newPrice.toFixed(product.priceDecimals)}
              </div>
              <div className={`text-xs font-semibold ${priceDiff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {priceDiff > 0 ? '+' : ''}{percentChange}%
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="newPrice">Nuevo Precio *</Label>
              <Input
                id="newPrice"
                type="number"
                step={0.001}
                required
                value={formData.newPrice}
                onChange={(e) => setFormData({ ...formData, newPrice: parseFloat(e.target.value) })}
                className="text-xl font-bold"
              />
            </div>
            <div>
              <Label htmlFor="reason">Motivo del Cambio</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Ej: Ajuste mensual, cambio de proveedor..."
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas Adicionales</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[60px]"
                placeholder="Información adicional..."
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || formData.newPrice === product.currentPrice}
              className="gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              {mutation.isPending ? (
                'Actualizando...'
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmar Cambio
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
