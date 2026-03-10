'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fuelingApi } from '@/lib/api/fueling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AttendantPerformanceReport } from '@/components/historial/attendant-performance-report';
import { HourlyTrafficChart } from '@/components/historial/hourly-traffic-chart';
import { ProductTrendChart } from '@/components/historial/product-trend-chart';
import { WeekdayTrafficChart } from '@/components/historial/weekday-traffic-chart';
import { ChevronDown, ChevronUp, Calendar, Clock, Search, Fuel, MapPin, Trophy, Activity, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { FUEL_NAMES, getToday, formatCurrency, formatDate } from '@/lib/historial-utils';

type TableSortField = 'registerNumber' | 'transactionDate' | 'nozzleCode' | 'attendantName' | 'totalLiters' | 'unitPrice' | 'totalCash';
type SortDirection = 'asc' | 'desc';

function HistorialContent() {
  const today = getToday();
  const [fromDate, setFromDate] = useState(today);
  const [fromTime, setFromTime] = useState('00:00');
  const [toDate, setToDate] = useState(today);
  const [toTime, setToTime] = useState('23:59');
  const [zoneFilter, setZoneFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<TableSortField>('registerNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: TableSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: TableSortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === 'desc'
      ? <ArrowDown className="h-3 w-3 ml-1 text-indigo-600" />
      : <ArrowUp className="h-3 w-3 ml-1 text-indigo-600" />;
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: transactions, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions', fromDate, fromTime, toDate, toTime],
    queryFn: () => fuelingApi.getTransactions(
      fromDate ? `${fromDate}T${fromTime || '00:00'}:00` : undefined,
      toDate ? `${toDate}T${toTime || '23:59'}:59` : undefined,
    ),
  });

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    let result = transactions;
    if (productFilter) {
      result = result.filter((t) => t.fuelCode === productFilter);
    }
    if (zoneFilter === '1') {
      result = result.filter((t) => (t.nozzleNumber ?? 0) <= 12);
    } else if (zoneFilter === '2') {
      result = result.filter((t) => (t.nozzleNumber ?? 0) > 12);
    }

    const mult = sortDirection === 'desc' ? -1 : 1;
    return [...result].sort((a, b) => {
      switch (sortField) {
        case 'registerNumber':
          return (a.registerNumber - b.registerNumber) * mult;
        case 'transactionDate':
          return (new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()) * mult;
        case 'nozzleCode': {
          const aVal = a.nozzleCode || a.nozzleNumber?.toString() || '';
          const bVal = b.nozzleCode || b.nozzleNumber?.toString() || '';
          return aVal.localeCompare(bVal) * mult;
        }
        case 'attendantName':
          return (a.attendantName || '').localeCompare(b.attendantName || '') * mult;
        case 'totalLiters':
          return (a.totalLiters - b.totalLiters) * mult;
        case 'unitPrice':
          return (a.unitPrice - b.unitPrice) * mult;
        case 'totalCash':
          return (a.totalCash - b.totalCash) * mult;
        default:
          return 0;
      }
    });
  }, [transactions, productFilter, zoneFilter, sortField, sortDirection]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (filteredTransactions.length === 0) return { items: [], totalPages: 0, startIndex: 0, endIndex: 0 };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const items = filteredTransactions.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    return { items, totalPages, startIndex: startIndex + 1, endIndex: Math.min(endIndex, filteredTransactions.length) };
  }, [filteredTransactions, currentPage]);

  // Reset to page 1 when filters change
  const handleRefetch = () => {
    setCurrentPage(1);
    setProductFilter('');
    setZoneFilter('');
    void refetch();
  };

  const totalCash = filteredTransactions.reduce((sum, t) => sum + t.totalCash, 0);
  const totalLiters = filteredTransactions.reduce((sum, t) => sum + t.totalLiters, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Historial de Transacciones
            </h1>
            <p className="mt-3 text-lg text-gray-600">Consulta y analiza tu registro de abastecimientos</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="hover:bg-gray-50 border-2">
              ← Volver
            </Button>
          </Link>
        </div>

        {/* Filters Card */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg py-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-5">
            {/* Date/Time Row */}
            <div className="grid gap-6 md:grid-cols-2 mb-5">
              {/* Desde */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  Desde
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="from"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg h-10 transition-colors"
                    />
                  </div>
                  <div className="relative w-[130px]">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none z-10" />
                    <Input
                      type="time"
                      value={fromTime}
                      onChange={(e) => setFromTime(e.target.value)}
                      className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg h-10 pl-8 transition-colors"
                    />
                  </div>
                </div>
              </div>
              {/* Hasta */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  Hasta
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="to"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg h-10 transition-colors"
                    />
                  </div>
                  <div className="relative w-[130px]">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none z-10" />
                    <Input
                      type="time"
                      value={toTime}
                      onChange={(e) => setToTime(e.target.value)}
                      className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg h-10 pl-8 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters + Search Row */}
            <div className="grid gap-4 grid-cols-[1fr_1fr_auto]">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Fuel className="h-3.5 w-3.5 text-purple-500" />
                  Combustible
                </Label>
                <Select value={productFilter} onValueChange={(v) => { setProductFilter(v === 'all' ? '' : v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg h-10 transition-colors">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(FUEL_NAMES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  Zona
                </Label>
                <Select value={zoneFilter} onValueChange={(v) => { setZoneFilter(v === 'all' ? '' : v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg h-10 transition-colors">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="1">Zona 1 (Manguera 1-12)</SelectItem>
                    <SelectItem value="2">Zona 2 (Manguera 13+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleRefetch}
                  className="h-10 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg rounded-lg transition-all hover:shadow-xl"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {transactions && filteredTransactions.length > 0 && (
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardContent className="pt-6 relative">
                <div className="text-sm font-semibold opacity-90 mb-2">Total Transacciones</div>
                <div className="text-5xl font-bold">{filteredTransactions.length}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardContent className="pt-6 relative">
                <div className="text-sm font-semibold opacity-90 mb-2">Total Litros</div>
                <div className="text-5xl font-bold">{totalLiters.toFixed(2)}</div>
                <div className="text-sm opacity-75 mt-1">Litros</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <CardContent className="pt-6 relative">
                <div className="text-sm font-semibold opacity-90 mb-2">Total Dinero</div>
                <div className="text-5xl font-bold">₡{formatCurrency(totalCash, 2)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table Card */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-t-lg">
            <CardTitle className="text-xl">Registro de Transacciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Cargando transacciones...</p>
              </div>
            )}
            {error && (
              <div className="text-center py-16">
                <p className="text-red-600 font-medium">
                  Error al cargar transacciones
                </p>
              </div>
            )}
            {transactions && filteredTransactions.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg">
                  No se encontraron transacciones en el rango seleccionado
                </p>
              </div>
            )}
            {transactions && filteredTransactions.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b-2">
                        <TableHead
                          className="font-bold text-gray-700 cursor-pointer hover:text-indigo-600 select-none"
                          onClick={() => handleSort('registerNumber')}
                        >
                          <span className="inline-flex items-center">Registro <SortIcon field="registerNumber" /></span>
                        </TableHead>
                        <TableHead
                          className="font-bold text-gray-700 cursor-pointer hover:text-indigo-600 select-none"
                          onClick={() => handleSort('transactionDate')}
                        >
                          <span className="inline-flex items-center">Fecha/Hora <SortIcon field="transactionDate" /></span>
                        </TableHead>
                        <TableHead
                          className="font-bold text-gray-700 cursor-pointer hover:text-indigo-600 select-none"
                          onClick={() => handleSort('nozzleCode')}
                        >
                          <span className="inline-flex items-center">Surtidor <SortIcon field="nozzleCode" /></span>
                        </TableHead>
                        <TableHead className="font-bold text-gray-700">Combustible</TableHead>
                        <TableHead
                          className="font-bold text-gray-700 cursor-pointer hover:text-indigo-600 select-none"
                          onClick={() => handleSort('attendantName')}
                        >
                          <span className="inline-flex items-center">Frentista <SortIcon field="attendantName" /></span>
                        </TableHead>
                        <TableHead
                          className="font-bold text-gray-700 text-right cursor-pointer hover:text-indigo-600 select-none"
                          onClick={() => handleSort('totalLiters')}
                        >
                          <span className="inline-flex items-center">Litros <SortIcon field="totalLiters" /></span>
                        </TableHead>
                        <TableHead
                          className="font-bold text-gray-700 text-right cursor-pointer hover:text-indigo-600 select-none"
                          onClick={() => handleSort('unitPrice')}
                        >
                          <span className="inline-flex items-center">Precio Unit. <SortIcon field="unitPrice" /></span>
                        </TableHead>
                        <TableHead
                          className="font-bold text-gray-700 text-right cursor-pointer hover:text-indigo-600 select-none"
                          onClick={() => handleSort('totalCash')}
                        >
                          <span className="inline-flex items-center">Total <SortIcon field="totalCash" /></span>
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.items.map((transaction, idx) => (
                        <TableRow
                          key={transaction.id}
                          className={`hover:bg-indigo-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <TableCell className="font-bold text-indigo-600">
                            #{transaction.registerNumber}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {formatDate(transaction.transactionDate)}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                              #{transaction.nozzleCode || transaction.nozzleNumber || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">
                              {transaction.productName || (transaction.fuelCode && FUEL_NAMES[transaction.fuelCode]) || transaction.fuelCode || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {transaction.attendantName ? (
                              <>
                                <span className="font-medium text-gray-900">{transaction.attendantName}</span>
                                {transaction.attendantCode && (
                                  <span className="text-xs text-gray-500 font-mono ml-1.5">({transaction.attendantCode})</span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm">Sin asignar</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900">
                            {transaction.totalLiters.toFixed(2)} <span className="text-sm text-gray-500">L</span>
                          </TableCell>
                          <TableCell className="text-right text-gray-700">
                            ₡{formatCurrency(transaction.unitPrice, 2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-lg font-bold text-emerald-600">
                              ₡{formatCurrency(transaction.totalCash, 2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {transaction.integrityOk && transaction.checksumOk ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                                OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold">
                                Error
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
                  <div className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold text-gray-900">{paginatedData.startIndex}</span> a{' '}
                    <span className="font-semibold text-gray-900">{paginatedData.endIndex}</span> de{' '}
                    <span className="font-semibold text-gray-900">{filteredTransactions.length}</span> resultados
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-2 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      ← Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: paginatedData.totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === 1 ||
                                 page === paginatedData.totalPages ||
                                 Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, idx, arr) => {
                          const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={currentPage === page
                                  ? "bg-indigo-600 text-white"
                                  : "border-2 hover:bg-indigo-50"
                                }
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(paginatedData.totalPages, p + 1))}
                      disabled={currentPage === paginatedData.totalPages}
                      className="border-2 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      Siguiente →
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sections below only show when there are transactions */}
        {transactions && transactions.length > 0 && (
          <>
            {/* Section 1: Rendimiento de Pisteros */}
            <div className="mt-8">
              <button
                onClick={() => setPerformanceOpen(!performanceOpen)}
                className="flex items-center gap-2 mb-4 text-lg font-semibold text-slate-700 hover:text-amber-600 transition-colors"
              >
                <Trophy className="h-5 w-5" />
                Rendimiento de Pisteros
                {performanceOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {performanceOpen && (
                <AttendantPerformanceReport />
              )}
            </div>

            {/* Section 2: Análisis de Estación */}
            <div className="mt-8">
              <button
                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                className="flex items-center gap-2 mb-4 text-lg font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                <Activity className="h-5 w-5" />
                Análisis de Estación
                {analyticsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {analyticsOpen && (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <HourlyTrafficChart transactions={transactions} />
                    <WeekdayTrafficChart transactions={transactions} />
                  </div>
                  <ProductTrendChart transactions={transactions} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function HistorialPage() {
  return <HistorialContent />;
}
