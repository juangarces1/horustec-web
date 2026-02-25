'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { scheduledPricesApi } from '@/lib/api/scheduled-prices';
import { pricesApi } from '@/lib/api/prices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  CalendarClock,
  History,
  AlertCircle,
  Search,
  Loader2,
} from 'lucide-react';
import type {
  ScheduledPriceChangeDto,
  CreateScheduledPriceRequest,
  ProductPriceDto,
  MachinePriceDto,
} from '@/types/api';

// Mapeo productCode → nozzleCodes (bicos)
const PRODUCT_NOZZLE_MAP: Record<string, string[]> = {
  '01': ['02', '05', '08', '11', '14', '17', '20', '23'],
  '02': ['26', '29'],
  '03': ['01', '04', '07', '10', '13', '16', '19', '22', '25', '28'],
  '10': ['03', '06', '09', '12', '15', '18', '21', '24', '27', '30'],
};

export default function PreciosProgramadosPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Queries
  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: ['scheduled-prices', 'pending'],
    queryFn: () => scheduledPricesApi.getPending(),
  });

  const { data: all = [], isLoading: loadingAll } = useQuery({
    queryKey: ['scheduled-prices', 'all'],
    queryFn: () => scheduledPricesApi.getAll(),
    enabled: showHistory,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['prices'],
    queryFn: () => pricesApi.getCurrent(),
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => scheduledPricesApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-prices'] });
      toast.success('Programacion cancelada');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Error al cancelar');
    },
  });

  const executed = all.filter((s) => s.isExecuted);
  const cancelled = all.filter((s) => s.isCancelled);

  if (loadingPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-xl text-gray-600">Cargando programaciones...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Precios Programados
          </h1>
          <p className="text-gray-600 mt-1">
            Programar cambios de precio automaticos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
            className="gap-2"
          >
            <History className="h-4 w-4" />
            {showHistory ? 'Ocultar' : 'Ver'} Historial
          </Button>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-2 border-amber-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-3">
                <CalendarClock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600">
                  {pending.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ejecutados</p>
                <p className="text-2xl font-bold text-green-600">
                  {executed.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cancelados</p>
                <p className="text-2xl font-bold text-red-600">
                  {cancelled.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <ScheduleForm
          products={products}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Pending Schedules */}
      <Card className="mb-6 border-2 border-amber-200 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Cambios Pendientes
          </CardTitle>
          <CardDescription>
            Se ejecutaran automaticamente a la hora programada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="text-center py-8">
              <CalendarClock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay cambios programados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onCancel={() => cancelMutation.mutate(schedule.id)}
                  isCancelling={cancelMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {showHistory && (
        <Card className="border-2 border-blue-200 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Historial
            </CardTitle>
            <CardDescription>
              Cambios ejecutados y cancelados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAll ? (
              <p className="text-gray-500 text-center py-8">Cargando...</p>
            ) : all.filter((s) => s.isExecuted || s.isCancelled).length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay historial
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {all
                  .filter((s) => s.isExecuted || s.isCancelled)
                  .sort(
                    (a, b) =>
                      new Date(b.executedAt || b.scheduledAt).getTime() -
                      new Date(a.executedAt || a.scheduledAt).getTime()
                  )
                  .map((schedule) => (
                    <HistoryItem key={schedule.id} schedule={schedule} />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Schedule Card Component
function ScheduleCard({
  schedule,
  onCancel,
  isCancelling,
}: {
  schedule: ScheduledPriceChangeDto;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  const scheduledDate = new Date(schedule.scheduledAt);
  const now = new Date();
  const isOverdue = scheduledDate < now;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
      <div className="flex items-center gap-4 flex-1">
        <div className="rounded-full bg-amber-100 p-2.5">
          <Clock className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-mono font-semibold">
              {schedule.productCode}
            </span>
            <span className="font-semibold text-gray-800">
              {schedule.productName}
            </span>
            {isOverdue && (
              <Badge variant="outline" className="border-orange-300 text-orange-700 gap-1">
                <AlertCircle className="h-3 w-3" />
                Pendiente
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <span className="text-gray-500">
              ${schedule.originalPrice.toFixed(3)}
            </span>
            {' -> '}
            <span className="text-amber-700 font-bold">
              ${schedule.newPrice.toFixed(3)}
            </span>
            <span className="ml-2 text-xs text-gray-400">
              ({(
                ((schedule.newPrice - schedule.originalPrice) /
                  schedule.originalPrice) *
                100
              ).toFixed(2)}
              %)
            </span>
          </div>
          {schedule.reason && (
            <div className="text-xs text-gray-500 mt-1">
              Motivo: {schedule.reason}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-700">
            {scheduledDate.toLocaleDateString('es-ES')}
          </div>
          <div className="text-xs text-gray-500">
            {scheduledDate.toLocaleTimeString('es-ES')}
          </div>
          <div className="text-xs text-gray-400">{schedule.createdBy}</div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isCancelling}
          className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
        >
          <X className="h-3 w-3" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// History Item Component (with inline verification)
function HistoryItem({ schedule }: { schedule: ScheduledPriceChangeDto }) {
  const [showVerification, setShowVerification] = useState(false);

  return (
    <div
      className={`rounded-lg border ${
        schedule.isExecuted
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100'
          : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-100'
      }`}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">
              {schedule.productName}
            </span>
            <Badge
              variant="outline"
              className={
                schedule.isExecuted
                  ? 'border-green-300 text-green-700'
                  : 'border-red-300 text-red-700'
              }
            >
              {schedule.isExecuted ? 'Ejecutado' : 'Cancelado'}
            </Badge>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <span className="line-through text-red-600">
              ${schedule.originalPrice.toFixed(3)}
            </span>
            {' -> '}
            <span className="text-green-600 font-semibold">
              ${schedule.newPrice.toFixed(3)}
            </span>
          </div>
          {schedule.reason && (
            <div className="text-xs text-gray-500 mt-1">
              Motivo: {schedule.reason}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm text-gray-500">
            <div>
              {new Date(
                schedule.executedAt || schedule.scheduledAt
              ).toLocaleDateString('es-ES')}
            </div>
            <div className="text-xs">
              {new Date(
                schedule.executedAt || schedule.scheduledAt
              ).toLocaleTimeString('es-ES')}
            </div>
            <div className="text-xs">{schedule.createdBy}</div>
          </div>
          {schedule.isExecuted && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowVerification(!showVerification)}
              className={`gap-1 ${
                showVerification
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200'
              }`}
            >
              <Search className="h-3 w-3" />
              Verificar
            </Button>
          )}
        </div>
      </div>
      {showVerification && (
        <div className="px-3 pb-3">
          <PriceVerificationTable
            productCode={schedule.productCode}
            expectedPrice={schedule.newPrice}
          />
        </div>
      )}
    </div>
  );
}

// Price Verification Table Component
function PriceVerificationTable({
  productCode,
  expectedPrice,
}: {
  productCode: string;
  expectedPrice: number;
}) {
  const { data: machinePrices, isLoading, isError } = useQuery({
    queryKey: ['machine-prices'],
    queryFn: () => pricesApi.getMachinePrices(),
    staleTime: 0,
  });

  const nozzleCodes = PRODUCT_NOZZLE_MAP[productCode] || [];
  const expectedMachinePrice = expectedPrice / 1000;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 text-gray-500 gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Leyendo precios de bombas...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-4 text-red-500 gap-2">
        <AlertCircle className="h-4 w-4" />
        Error al leer precios de las bombas
      </div>
    );
  }

  if (nozzleCodes.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500 text-sm">
        No hay bicos mapeados para el producto {productCode}
      </div>
    );
  }

  const filteredPrices = (machinePrices || []).filter((mp) =>
    nozzleCodes.includes(mp.nozzleCode)
  );

  const allMatch = filteredPrices.length > 0 && filteredPrices.every(
    (mp) => Math.abs(mp.priceLevel0 - expectedMachinePrice) < 0.0001
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className={`px-3 py-2 text-sm font-semibold flex items-center justify-between ${
        allMatch ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
      }`}>
        <span>
          Verificacion de bicos — Producto {productCode}
        </span>
        {filteredPrices.length > 0 && (
          <Badge variant="outline" className={allMatch ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}>
            {allMatch ? 'Todos OK' : 'Hay diferencias'}
          </Badge>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-gray-600">
            <th className="px-3 py-2 text-left font-medium">Bico</th>
            <th className="px-3 py-2 text-right font-medium">Precio esperado</th>
            <th className="px-3 py-2 text-right font-medium">Precio en bomba</th>
            <th className="px-3 py-2 text-center font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {nozzleCodes.map((nozzleCode) => {
            const machinePrice = filteredPrices.find(
              (mp) => mp.nozzleCode === nozzleCode
            );
            const actualPrice = machinePrice?.priceLevel0;
            const matches =
              actualPrice !== undefined &&
              Math.abs(actualPrice - expectedMachinePrice) < 0.0001;

            return (
              <tr key={nozzleCode} className="border-b last:border-b-0">
                <td className="px-3 py-2 font-mono font-semibold">{nozzleCode}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {expectedMachinePrice.toFixed(3)}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {actualPrice !== undefined ? actualPrice.toFixed(3) : '—'}
                </td>
                <td className="px-3 py-2 text-center">
                  {actualPrice === undefined ? (
                    <span className="text-gray-400">Sin datos</span>
                  ) : matches ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                      <XCircle className="h-4 w-4" />
                      Difiere
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Schedule Form Component
function ScheduleForm({
  products,
  onClose,
}: {
  products: ProductPriceDto[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateScheduledPriceRequest>({
    productId: '',
    newPrice: 0,
    scheduledAt: '',
    createdBy: typeof window !== 'undefined'
      ? localStorage.getItem('username') || 'admin'
      : 'admin',
    reason: '',
  });

  const selectedProduct = products.find((p) => p.productId === formData.productId);

  const mutation = useMutation({
    mutationFn: (data: CreateScheduledPriceRequest) =>
      scheduledPricesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-prices'] });
      toast.success('Cambio de precio programado exitosamente');
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || 'Error al programar el cambio'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) {
      toast.error('Seleccione un producto');
      return;
    }
    if (formData.newPrice <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }
    if (!formData.scheduledAt) {
      toast.error('Seleccione fecha y hora');
      return;
    }
    mutation.mutate(formData);
  };

  // Minimum datetime: now + 1 minute (in local time for datetime-local input)
  const nowPlus1 = new Date(Date.now() + 60000);
  const minDatetime =
    `${nowPlus1.getFullYear()}-${String(nowPlus1.getMonth() + 1).padStart(2, '0')}-${String(nowPlus1.getDate()).padStart(2, '0')}T${String(nowPlus1.getHours()).padStart(2, '0')}:${String(nowPlus1.getMinutes()).padStart(2, '0')}`;

  return (
    <Card className="mb-6 border-2 border-amber-200 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Programar Cambio de Precio
        </CardTitle>
        <CardDescription>
          El precio se actualizara automaticamente a la hora indicada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Product selector */}
            <div>
              <Label htmlFor="productId">Producto *</Label>
              <select
                id="productId"
                value={formData.productId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    productId: e.target.value,
                    newPrice:
                      products.find((p) => p.productId === e.target.value)
                        ?.currentPrice || 0,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Seleccionar producto...</option>
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productCode} - {p.productName} (${p.currentPrice.toFixed(3)})
                  </option>
                ))}
              </select>
            </div>

            {/* New price */}
            <div>
              <Label htmlFor="newPrice">Nuevo Precio *</Label>
              <Input
                id="newPrice"
                type="number"
                step={0.001}
                min={0.001}
                required
                value={formData.newPrice || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="text-lg font-bold"
              />
              {selectedProduct && formData.newPrice > 0 && (
                <p className="text-xs mt-1 text-gray-500">
                  Cambio:{' '}
                  <span
                    className={
                      formData.newPrice > selectedProduct.currentPrice
                        ? 'text-red-600'
                        : 'text-green-600'
                    }
                  >
                    {formData.newPrice > selectedProduct.currentPrice ? '+' : ''}
                    {(
                      ((formData.newPrice - selectedProduct.currentPrice) /
                        selectedProduct.currentPrice) *
                      100
                    ).toFixed(2)}
                    %
                  </span>
                </p>
              )}
            </div>

            {/* Schedule datetime */}
            <div>
              <Label htmlFor="scheduledAt">Fecha y Hora de Ejecucion *</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                required
                min={minDatetime}
                value={formData.scheduledAt}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledAt: e.target.value })
                }
              />
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Input
                id="reason"
                value={formData.reason || ''}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Ej: Ajuste mensual, decreto..."
              />
            </div>
          </div>

          {/* Preview */}
          {selectedProduct && formData.newPrice > 0 && formData.scheduledAt && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Vista previa:
              </p>
              <p className="text-sm text-gray-600">
                El precio de{' '}
                <span className="font-bold">{selectedProduct.productName}</span>{' '}
                cambiara de{' '}
                <span className="font-bold">
                  ${selectedProduct.currentPrice.toFixed(3)}
                </span>{' '}
                a{' '}
                <span className="font-bold text-amber-700">
                  ${formData.newPrice.toFixed(3)}
                </span>{' '}
                el{' '}
                <span className="font-bold">
                  {new Date(formData.scheduledAt).toLocaleString('es-ES')}
                </span>
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              {mutation.isPending ? (
                'Programando...'
              ) : (
                <>
                  <CalendarClock className="h-4 w-4" />
                  Programar Cambio
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
