'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fuelingApi } from '@/lib/api/fueling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, Truck, Car, Bike, Clock } from 'lucide-react';
import { FuelingTransactionDto } from '@/types/api';

const SHIFT_PRESETS = [
  { name: 'Manana', start: 4, end: 12 },
  { name: 'Tarde', start: 12, end: 20 },
  { name: 'Noche', start: 20, end: 4 },
];

const WEEKDAYS = [
  { key: 1, short: 'L', name: 'Lunes' },
  { key: 2, short: 'M', name: 'Martes' },
  { key: 3, short: 'X', name: 'Miercoles' },
  { key: 4, short: 'J', name: 'Jueves' },
  { key: 5, short: 'V', name: 'Viernes' },
  { key: 6, short: 'S', name: 'Sabado' },
  { key: 0, short: 'D', name: 'Domingo' },
];

interface AttendantRow {
  name: string;
  code: string | null;
  totalTransactions: number;
  totalVolume: number;
  totalAmount: number;
  trucks: number;
  cars: number;
  motorcycles: number;
}

function classifyVehicle(productName: string | null, liters: number): 'truck' | 'car' | 'motorcycle' {
  const isDiesel = productName?.toLowerCase().includes('diesel') ?? false;
  if (isDiesel && liters > 50) return 'truck';
  if (liters >= 10) return 'car';
  return 'motorcycle';
}

function isInHourRange(hour: number, start: number, end: number): boolean {
  if (start <= end) {
    return hour >= start && hour < end;
  }
  return hour >= start || hour < end;
}

function padH(h: number) {
  return String(h).padStart(2, '0');
}

export function AttendantPerformanceReport() {
  const today = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [hourStart, setHourStart] = useState(4);
  const [hourEnd, setHourEnd] = useState(12);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]));
  const [generated, setGenerated] = useState(false);

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['attendant-report', fromDate, toDate],
    queryFn: () => fuelingApi.getTransactions(
      `${fromDate}T00:00:00`,
      `${toDate}T23:59:59`
    ),
    enabled: false,
  });

  const handleGenerate = () => {
    setGenerated(true);
    refetch();
  };

  const applyPreset = (preset: typeof SHIFT_PRESETS[number]) => {
    setHourStart(preset.start);
    setHourEnd(preset.end);
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const selectWeekdays = () => setSelectedDays(new Set([1, 2, 3, 4, 5]));
  const selectWeekend = () => setSelectedDays(new Set([0, 6]));
  const selectAll = () => setSelectedDays(new Set([0, 1, 2, 3, 4, 5, 6]));

  const ranking = useMemo((): AttendantRow[] => {
    if (!transactions) return [];

    const filtered = transactions.filter((t) => {
      const d = new Date(t.transactionDate);
      const hour = d.getHours();
      const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat
      return isInHourRange(hour, hourStart, hourEnd) && selectedDays.has(dayOfWeek);
    });

    const map = new Map<string, AttendantRow>();

    for (const t of filtered) {
      const key = t.attendantName || 'Sin asignar';

      if (!map.has(key)) {
        map.set(key, {
          name: key,
          code: t.attendantCode,
          totalTransactions: 0,
          totalVolume: 0,
          totalAmount: 0,
          trucks: 0,
          cars: 0,
          motorcycles: 0,
        });
      }

      const row = map.get(key)!;
      row.totalTransactions++;
      row.totalVolume += t.totalLiters;
      row.totalAmount += t.totalCash;

      const vehicle = classifyVehicle(t.productName, t.totalLiters);
      if (vehicle === 'truck') row.trucks++;
      else if (vehicle === 'car') row.cars++;
      else row.motorcycles++;
    }

    return Array.from(map.values()).sort(
      (a, b) => b.totalTransactions - a.totalTransactions
    );
  }, [transactions, hourStart, hourEnd, selectedDays]);

  const totalFiltered = ranking.reduce((s, r) => s + r.totalTransactions, 0);

  const formatCurrency = (value: number) =>
    value.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const getSelectedDaysLabel = () => {
    if (selectedDays.size === 7) return 'Todos';
    if (selectedDays.size === 5 && !selectedDays.has(0) && !selectedDays.has(6)) return 'L-V';
    if (selectedDays.size === 2 && selectedDays.has(0) && selectedDays.has(6)) return 'Fin de semana';
    return WEEKDAYS.filter((w) => selectedDays.has(w.key)).map((w) => w.short).join(', ');
  };

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          <CardTitle className="text-xl">Rendimiento de Frentistas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Row 1: Date range */}
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700">Desde</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setGenerated(false); }}
              className="mt-1 border-2"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700">Hasta</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setGenerated(false); }}
              className="mt-1 border-2"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-sm font-semibold text-gray-700">Dias de la semana</Label>
            <div className="mt-1 flex items-center gap-1">
              {WEEKDAYS.map((w) => (
                <button
                  key={w.key}
                  onClick={() => toggleDay(w.key)}
                  title={w.name}
                  className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                    selectedDays.has(w.key)
                      ? w.key === 0 || w.key === 6
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {w.short}
                </button>
              ))}
              <span className="mx-1 text-gray-300">|</span>
              <button onClick={selectAll} className="text-xs text-indigo-600 hover:underline font-medium px-1">Todos</button>
              <button onClick={selectWeekdays} className="text-xs text-indigo-600 hover:underline font-medium px-1">L-V</button>
              <button onClick={selectWeekend} className="text-xs text-orange-600 hover:underline font-medium px-1">S-D</button>
            </div>
          </div>
        </div>

        {/* Row 2: Hour range + shift presets + generate */}
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Hora Inicio
            </Label>
            <Input
              type="time"
              value={`${padH(hourStart)}:00`}
              onChange={(e) => {
                const h = parseInt(e.target.value.split(':')[0]);
                if (!isNaN(h)) setHourStart(h);
              }}
              className="mt-1 border-2"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Hora Fin
            </Label>
            <Input
              type="time"
              value={`${padH(hourEnd)}:00`}
              onChange={(e) => {
                const h = parseInt(e.target.value.split(':')[0]);
                if (!isNaN(h)) setHourEnd(h);
              }}
              className="mt-1 border-2"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700">Turno rapido</Label>
            <div className="mt-1 flex gap-1">
              {SHIFT_PRESETS.map((p) => (
                <Button
                  key={p.name}
                  variant={hourStart === p.start && hourEnd === p.end ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => applyPreset(p)}
                  className={
                    hourStart === p.start && hourEnd === p.end
                      ? 'bg-amber-600 hover:bg-amber-700 text-white text-xs flex-1'
                      : 'text-xs border-2 flex-1'
                  }
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleGenerate}
              disabled={isLoading || selectedDays.size === 0}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-lg"
            >
              {isLoading ? 'Cargando...' : 'Generar'}
            </Button>
          </div>
        </div>

        {/* Results */}
        {generated && transactions && (
          <>
            <div className="flex items-center justify-between px-1 pt-2">
              <span className="text-sm text-gray-500">
                Horario: <strong>{padH(hourStart)}:00 - {padH(hourEnd)}:00</strong>
                {' '}· Dias: <strong>{getSelectedDaysLabel()}</strong>
                {' '}· {totalFiltered} despachos
              </span>
            </div>

            {ranking.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No hay transacciones de frentistas en este rango
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold text-gray-700 w-12 text-center">#</TableHead>
                      <TableHead className="font-bold text-gray-700">Frentista</TableHead>
                      <TableHead className="font-bold text-gray-700 text-center">Despachos</TableHead>
                      <TableHead className="font-bold text-gray-700 text-right">Litros</TableHead>
                      <TableHead className="font-bold text-gray-700 text-right">Monto</TableHead>
                      <TableHead className="font-bold text-gray-700 text-center">
                        <span className="inline-flex items-center gap-1"><Truck className="h-4 w-4" /> Camiones</span>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700 text-center">
                        <span className="inline-flex items-center gap-1"><Car className="h-4 w-4" /> Autos</span>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700 text-center">
                        <span className="inline-flex items-center gap-1"><Bike className="h-4 w-4" /> Motos</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((row, idx) => (
                      <TableRow
                        key={row.name}
                        className={`hover:bg-amber-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <TableCell className="text-center font-bold">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold">1</span>
                          ) : idx === 1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold">2</span>
                          ) : idx === 2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold">3</span>
                          ) : (
                            <span className="text-gray-500">{idx + 1}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-gray-900">{row.name}</span>
                          {row.code && (
                            <span className="text-xs text-gray-400 font-mono ml-1.5">({row.code})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                            {row.totalTransactions}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-gray-900">
                          {row.totalVolume.toFixed(2)} <span className="text-sm text-gray-500">L</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-emerald-600">
                            ₡{formatCurrency(row.totalAmount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-medium text-blue-700">{row.trucks}</TableCell>
                        <TableCell className="text-center font-medium text-gray-700">{row.cars}</TableCell>
                        <TableCell className="text-center font-medium text-orange-600">{row.motorcycles}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400 px-1">
              <span><Truck className="inline h-3 w-3" /> Camion: Diesel + &gt;50 L</span>
              <span><Car className="inline h-3 w-3" /> Auto: &ge;10 L (no camion)</span>
              <span><Bike className="inline h-3 w-3" /> Moto: &lt;10 L</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
