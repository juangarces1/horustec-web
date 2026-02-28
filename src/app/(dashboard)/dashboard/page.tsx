'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monitoringApi } from '@/lib/api/monitoring';
import { fuelingApi } from '@/lib/api/fueling';
import { pricesApi } from '@/lib/api/prices';
import { KPICard } from '@/components/dashboard/kpi-card';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { ActiveFuelings } from '@/components/dashboard/active-fuelings';
import { ActiveAttendants } from '@/components/dashboard/active-attendants';
import { TopProducts } from '@/components/dashboard/top-products';
import { Button } from '@/components/ui/button';
import { DollarSign, Droplet, Receipt, Activity, RefreshCw } from 'lucide-react';
import type { FuelingTransactionDto } from '@/types/api';

// Helper function to get date range for last 24 hours
const getLast24HoursRange = () => {
  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
  return { from: from.toISOString(), to: to.toISOString() };
};

// Helper function to get date range for last week
const getLastWeekRange = () => {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
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

  // Fetch transactions from last 24 hours for KPIs
  const {
    data: recentTransactions = [],
    isLoading: loadingRecent,
    refetch: refetchRecent,
  } = useQuery({
    queryKey: ['transactions-last-24-hours'],
    queryFn: async () => {
      const { from, to } = getLast24HoursRange();
      const data = await fuelingApi.getTransactions(from, to);
      console.log('📊 Transacciones últimas 24 horas:', data.length, data);
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch transactions from last week for chart
  const {
    data: chartTransactions = [],
    isLoading: loadingChart,
    refetch: refetchChart,
  } = useQuery({
    queryKey: ['transactions-last-week'],
    queryFn: async () => {
      const { from, to } = getLastWeekRange();
      const data = await fuelingApi.getTransactions(from, to);
      console.log('📈 Transacciones última semana:', data.length, data.slice(0, 3));
      return data;
    },
    refetchInterval: 60000, // Refetch every minute
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
    refetchRecent();
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

  // Calculate metrics
  const kpis = calculateKPIs(recentTransactions);
  const statusCounts = countByStatus(statuses);
  const chartData = getSalesChartData(chartTransactions);

  const isLoading = loadingRecent || loadingChart || loadingStatuses;

  if (isLoading && recentTransactions.length === 0) {
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
            Resumen en tiempo real de operaciones de las últimas 24 horas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500">
            Actualizado: {lastUpdate.toLocaleTimeString('es-ES')}
          </div>
          <Button onClick={handleRefresh} className="bg-indigo-600 hover:bg-indigo-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards - Last 24 Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Ventas (24 horas)"
          value={kpis.totalSales}
          valuePrefix="₡"
          icon={DollarSign}
          colorClass="text-green-700"
          bgGradient="from-green-50 to-emerald-50"
          iconBgClass="bg-green-500/20"
        />
        <KPICard
          title="Total Litros (24 horas)"
          value={kpis.totalLiters.toFixed(2)}
          valueSuffix=" L"
          icon={Droplet}
          colorClass="text-blue-700"
          bgGradient="from-blue-50 to-indigo-50"
          iconBgClass="bg-blue-500/20"
        />
        <KPICard
          title="Transacciones (24 horas)"
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
          <ActiveAttendants transactions={recentTransactions} />

          {/* Top Products */}
          <TopProducts transactions={recentTransactions} />
        </div>
      </div>

      {/* Sales Chart - Full Width */}
      <SalesChart data={chartData} />

      {/* Info Banner */}
      <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="text-4xl">📊</div>
          <div>
            <h3 className="text-lg font-bold">Actualización Automática</h3>
            <p className="text-sm opacity-90 mt-1">
              Los KPIs se actualizan cada 30 segundos. Los estados de dispensadores se refrescan cada 5 segundos.
              La gráfica de ventas muestra la última semana.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
