'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '@/lib/api/monitoring';
import { fuelingApi } from '@/lib/api/fueling';
import { pricesApi } from '@/lib/api/prices';
import { KPICard } from '@/components/dashboard/kpi-card';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { SalesByDayChart, type DaySales } from '@/components/dashboard/sales-by-day-chart';
import { ActiveFuelings } from '@/components/dashboard/active-fuelings';
import { ActiveAttendants } from '@/components/dashboard/active-attendants';
import { TopProducts } from '@/components/dashboard/top-products';
import { Button } from '@/components/ui/button';
import { DollarSign, Droplet, Receipt, Activity, RefreshCw, X } from 'lucide-react';
import type { FuelingTransactionDto } from '@/types/api';

// Clave local YYYY-MM-DD de una fecha
const dayKeyOf = (d: Date) =>
  `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

// Etiqueta corta "vie 4 jul"
const dayLabelOf = (d: Date) =>
  d.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');

// Últimos 7 días calendario: desde las 00:00 de hace 6 días hasta ahora
const getLast7DaysRange = () => {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 6);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
};

// Calculate KPIs from transactions
const calculateKPIs = (transactions: FuelingTransactionDto[]) => {
  const totalSales = transactions.reduce((sum, tx) => sum + tx.totalCash, 0);
  const totalLiters = transactions.reduce((sum, tx) => sum + tx.totalLiters, 0);
  const count = transactions.length;
  return { totalSales, totalLiters, count };
};

// Count dispensers by status
const countByStatus = (statuses: any[]) => {
  const available = statuses.filter((s) => s.status === 1).length;
  const fueling = statuses.filter((s) => s.status === 3).length;
  const blocked = statuses.filter((s) => s.status === 2).length;
  return { available, fueling, blocked };
};

// Prepare chart data from transactions
const getSalesChartData = (transactions: FuelingTransactionDto[]) => {
  // Group by hour
  const hourly = transactions.reduce((acc, tx) => {
    const date = new Date(tx.transactionDate);
    const hour = date.getHours();
    const key = `${hour.toString().padStart(2, '0')}:00`;
    if (!acc[key]) acc[key] = 0;
    acc[key] += tx.totalCash;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(hourly).map(([hour, ventas]) => ({
    hour,
    ventas,
  }));
};

export default function DashboardPage() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  // Día seleccionado en la gráfica de barras (null = hoy)
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Fetch transactions from the last 7 calendar days (KPIs + charts)
  const {
    data: chartTransactions = [],
    isLoading: loadingChart,
    refetch: refetchChart,
  } = useQuery({
    queryKey: ['transactions-last-7-days'],
    queryFn: async () => {
      const { from, to } = getLast7DaysRange();
      return fuelingApi.getTransactions(from, to);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch nozzle statuses
  const {
    data: statuses = [],
    isLoading: loadingStatuses,
    refetch: refetchStatuses,
  } = useQuery({
    queryKey: ['nozzle-statuses-dashboard'],
    queryFn: monitoringApi.getStatuses,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Fetch visualizations for active fuelings
  const { data: visualizations = [], refetch: refetchVis } = useQuery({
    queryKey: ['visualizations-dashboard'],
    queryFn: monitoringApi.getVisualization,
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  // Fetch product prices for liters calculation
  const { data: products = [] } = useQuery({
    queryKey: ['prices'],
    queryFn: pricesApi.getCurrent,
  });

  // Build price lookup by product name
  const pricesByProduct = new Map(
    products.map((p) => [p.productName, p.currentPrice])
  );

  // Handle manual refresh
  const handleRefresh = () => {
    refetchChart();
    refetchStatuses();
    refetchVis();
    setLastUpdate(new Date());
  };

  // Update last update time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ---- Días y filtrado ----
  const todayKey = dayKeyOf(new Date());
  const effectiveDay = selectedDay ?? todayKey;

  // Siempre 7 barras (con ₡0 si no hubo ventas)
  const salesByDay: DaySales[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    salesByDay.push({ dayKey: dayKeyOf(d), label: dayLabelOf(d), ventas: 0, count: 0 });
  }
  const byKey = new Map(salesByDay.map((s) => [s.dayKey, s]));
  chartTransactions.forEach((tx) => {
    const entry = byKey.get(dayKeyOf(new Date(tx.transactionDate)));
    if (entry) {
      entry.ventas += tx.totalCash;
      entry.count++;
    }
  });

  // Transacciones del día efectivo → KPIs, productos, frentistas, gráfica horaria
  const selectedTransactions = chartTransactions.filter(
    (tx) => dayKeyOf(new Date(tx.transactionDate)) === effectiveDay
  );
  const isToday = effectiveDay === todayKey;
  const dayLabel = isToday
    ? 'Hoy'
    : byKey.get(effectiveDay)?.label ?? effectiveDay;

  const handleSelectDay = (dayKey: string) => {
    // Click en el día ya seleccionado (o en hoy) vuelve a "Hoy"
    setSelectedDay(dayKey === effectiveDay || dayKey === todayKey ? null : dayKey);
  };

  // Calculate metrics
  const kpis = calculateKPIs(selectedTransactions);
  const statusCounts = countByStatus(statuses);
  const chartData = getSalesChartData(selectedTransactions);

  const isLoading = loadingChart || loadingStatuses;

  if (isLoading && chartTransactions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
          <div className="text-xl text-slate-700">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Ejecutivo
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Resumen de operaciones de los últimos 7 días
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isToday && (
            <button
              onClick={() => setSelectedDay(null)}
              className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-200 transition-colors"
              title="Volver a hoy"
            >
              Mostrando: {dayLabel}
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="text-sm text-slate-500">
            Actualizado: {lastUpdate.toLocaleTimeString('es-ES')}
          </div>
          <Button onClick={handleRefresh} className="bg-indigo-600 hover:bg-indigo-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards - día seleccionado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={`Total Ventas (${dayLabel})`}
          value={kpis.totalSales}
          valuePrefix="₡"
          icon={DollarSign}
          colorClass="text-green-700"
          bgGradient="from-green-50 to-emerald-50"
          iconBgClass="bg-green-500/20"
        />
        <KPICard
          title={`Total Litros (${dayLabel})`}
          value={kpis.totalLiters.toFixed(2)}
          valueSuffix=" L"
          icon={Droplet}
          colorClass="text-blue-700"
          bgGradient="from-blue-50 to-indigo-50"
          iconBgClass="bg-blue-500/20"
        />
        <KPICard
          title={`Transacciones (${dayLabel})`}
          value={kpis.count}
          icon={Receipt}
          colorClass="text-purple-700"
          bgGradient="from-purple-50 to-violet-50"
          iconBgClass="bg-purple-500/20"
        />
        <KPICard
          title="Ticket Promedio"
          value={kpis.count > 0 ? (kpis.totalSales / kpis.count) : 0}
          valuePrefix="₡"
          icon={Activity}
          colorClass="text-orange-700"
          bgGradient="from-orange-50 to-amber-50"
          iconBgClass="bg-orange-500/20"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Active Fuelings */}
        <ActiveFuelings statuses={statuses} visualizations={visualizations} pricesByProduct={pricesByProduct} />

        {/* Right Column */}
        <div className="space-y-6">
          {/* Active Attendants */}
          <ActiveAttendants transactions={selectedTransactions} />

          {/* Top Products */}
          <TopProducts transactions={selectedTransactions} />
        </div>
      </div>

      {/* Sales by day - Full Width, clickeable */}
      <SalesByDayChart
        data={salesByDay}
        selectedDay={effectiveDay}
        onSelectDay={handleSelectDay}
      />

      {/* Hourly breakdown of the selected day - Full Width */}
      <SalesChart data={chartData} title={`Ventas por Hora — ${dayLabel}`} />

      {/* Info Banner */}
      <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="text-4xl">📊</div>
          <div>
            <h3 className="text-lg font-bold">Actualización Automática</h3>
            <p className="text-sm opacity-90 mt-1">
              Los datos cubren los últimos 7 días y se actualizan cada 30 segundos; los estados de
              dispensadores cada 5 segundos. Haz click en una barra de día para filtrar los KPIs,
              productos y frentistas de ese día — Abasteciendo Ahora siempre muestra el tiempo real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
