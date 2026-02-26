'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { monitoringApi } from '@/lib/api/monitoring';
import { attendantsApi } from '@/lib/api/attendants';
import { pumpApi } from '@/lib/api/pump';
import { DispenserCard } from '@/components/monitor/dispenser-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NozzleStatus } from '@/types/api';
import { cn } from '@/lib/utils';
import { ArrowLeft, Loader2, Zap } from 'lucide-react';
import type { NozzleStatusDto } from '@/types/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Product mapping: nozzle code → product name */
const NOZZLE_PRODUCTS: Record<string, string> = {
  '01': 'Super',
  '02': 'Regular',
  '03': 'Diesel',
  '04': 'Super',
  '05': 'Regular',
  '06': 'Diesel',
  '07': 'Super',
  '08': 'Regular',
  '09': 'Diesel',
  '10': 'Super',
  '11': 'Regular',
  '12': 'Diesel',
  '13': 'Super',
  '14': 'Regular',
  '15': 'Diesel',
  '16': 'Super',
  '17': 'Regular',
  '18': 'Diesel',
  '19': 'Super',
  '20': 'Regular',
  '21': 'Diesel',
  '22': 'Super',
  '23': 'Regular',
  '24': 'Diesel',
  '25': 'Super',
  '26': 'Exonerado',
  '27': 'Diesel',
  '28': 'Super',
  '29': 'Exonerado',
  '30': 'Diesel',
};

/** Amount preset chips in colones */
const AMOUNT_CHIPS = [1000, 2000, 3000, 4000, 5000, 10000, 15000, 20000];

/** Volume preset chips in liters */
const LITER_CHIPS = [10, 20, 30, 40, 50, 60, 100, 200, 300, 400, 500];

/** Status priority for resolving dispenser representative status */
const STATUS_PRIORITY = [3, 4, 5, 7, 2, 1, 8, 6, 0];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardStep = 1 | 2 | 3;
type PresetTab = 'amount' | 'liters' | 'full';

interface DispenserGroup {
  dispenserNumber: number;
  nozzleCodes: string[];
  products: string[];
  status: NozzleStatus;
  currentLiters: number | null;
  activeNozzle: { code: string; product: string } | null;
}

interface SelectedDispenser {
  dispenserNumber: number;
  nozzleCodes: string[];
  products: string[];
}

interface SelectedNozzle {
  code: string;
  product: string;
}

// ---------------------------------------------------------------------------
// Helper: group nozzle DTOs into dispenser groups
// ---------------------------------------------------------------------------

function groupDispensers(nozzles: NozzleStatusDto[]): DispenserGroup[] {
  const dispensers: DispenserGroup[] = [];

  for (let i = 0; i < 10; i++) {
    const dispenserNumber = i + 1;
    const dispenserNozzles = nozzles.slice(i * 3, i * 3 + 3);

    if (dispenserNozzles.length === 0) continue;

    let dispenserStatus = dispenserNozzles[0].status;
    let activeNozzleIndex = 0;

    for (let j = 0; j < dispenserNozzles.length; j++) {
      const currentPriority = STATUS_PRIORITY.indexOf(dispenserNozzles[j].status);
      const activePriority = STATUS_PRIORITY.indexOf(dispenserStatus);
      if (currentPriority < activePriority) {
        dispenserStatus = dispenserNozzles[j].status;
        activeNozzleIndex = j;
      }
    }

    const allSameStatus = dispenserNozzles.every((n) => n.status === dispenserStatus);
    let activeNozzle: { code: string; product: string } | null = null;
    if (!allSameStatus || dispenserStatus === NozzleStatus.Fueling) {
      const nozzle = dispenserNozzles[activeNozzleIndex];
      activeNozzle = {
        code: nozzle.nozzleCode,
        product: NOZZLE_PRODUCTS[nozzle.nozzleCode] || 'Desconocido',
      };
    }

    dispensers.push({
      dispenserNumber,
      nozzleCodes: dispenserNozzles.map((n) => n.nozzleCode),
      products: dispenserNozzles.map((n) => NOZZLE_PRODUCTS[n.nozzleCode] || 'Desconocido'),
      status: dispenserStatus,
      currentLiters: null,
      activeNozzle,
    });
  }

  return dispensers;
}

// ---------------------------------------------------------------------------
// Helper: is dispenser eligible for preset?
// ---------------------------------------------------------------------------

function isEligibleForPreset(status: NozzleStatus): boolean {
  return status === NozzleStatus.Available || status === NozzleStatus.Blocked;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Visual card for a single fuel product/nozzle selection in Step 2 */
function NozzleProductCard({
  nozzleCode,
  product,
  status,
  onClick,
}: {
  nozzleCode: string;
  product: string;
  status: NozzleStatus;
  onClick: () => void;
}) {
  const productEmoji: Record<string, string> = {
    Super: '⭐',
    Regular: '⛽',
    Diesel: '🚛',
    Exonerado: '🔰',
  };

  const productGradient: Record<string, string> = {
    Super: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
    Regular: 'bg-gradient-to-br from-red-500 to-red-700',
    Diesel: 'bg-gradient-to-br from-green-500 to-green-700',
    Exonerado: 'bg-gradient-to-br from-blue-500 to-blue-700',
  };

  const statusLabels: Record<NozzleStatus, string> = {
    [NozzleStatus.NotConfigured]: 'No Configurado',
    [NozzleStatus.Available]: 'Libre',
    [NozzleStatus.Blocked]: 'Bloqueado',
    [NozzleStatus.Fueling]: 'Abasteciendo',
    [NozzleStatus.Ready]: 'Pronto',
    [NozzleStatus.Waiting]: 'Espera',
    [NozzleStatus.Failure]: 'Falla',
    [NozzleStatus.Busy]: 'Ocupado',
    [NozzleStatus.Error]: 'Error',
  };

  const statusBadgeColor: Record<NozzleStatus, string> = {
    [NozzleStatus.NotConfigured]: 'bg-gray-300 text-gray-700',
    [NozzleStatus.Available]: 'bg-green-500 text-white',
    [NozzleStatus.Blocked]: 'bg-red-500 text-white',
    [NozzleStatus.Fueling]: 'bg-orange-500 text-white',
    [NozzleStatus.Ready]: 'bg-blue-500 text-white',
    [NozzleStatus.Waiting]: 'bg-yellow-500 text-black',
    [NozzleStatus.Failure]: 'bg-red-800 text-white',
    [NozzleStatus.Busy]: 'bg-purple-500 text-white',
    [NozzleStatus.Error]: 'bg-red-900 text-white',
  };

  const gradient = productGradient[product] ?? 'bg-gradient-to-br from-slate-600 to-slate-800';
  const emoji = productEmoji[product] ?? '⛽';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl p-6 text-white shadow-lg transition-all duration-200',
        'hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30',
        'flex flex-col items-center justify-center gap-3 cursor-pointer',
        gradient
      )}
    >
      <span className="text-5xl">{emoji}</span>
      <span className="text-2xl font-bold">{product}</span>
      <span className="text-sm opacity-80">Manguera #{nozzleCode}</span>
      <span
        className={cn(
          'mt-1 rounded-full px-3 py-1 text-xs font-semibold',
          statusBadgeColor[status]
        )}
      >
        {statusLabels[status]}
      </span>
    </button>
  );
}

/** Chip button used for amount and liter selection in Step 3 */
function PresetChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
        selected
          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md'
          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Step 1 – Select Dispenser
// ---------------------------------------------------------------------------

function Step1SelectDispenser({
  onSelect,
}: {
  onSelect: (dispenser: SelectedDispenser) => void;
}) {
  const { data: statuses, isLoading, error } = useQuery({
    queryKey: ['preset-nozzle-statuses'],
    queryFn: monitoringApi.getStatuses,
    refetchInterval: 3000,
  });

  const dispensers = statuses ? groupDispensers(statuses) : [];

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-slate-600">Cargando dispensadores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        Error al cargar dispensadores:{' '}
        {error instanceof Error ? error.message : 'Error desconocido'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Seleccionar Dispensador</h2>
        <p className="mt-1 text-sm text-slate-500">
          Solo dispensadores en estado{' '}
          <span className="font-semibold text-green-600">Libre</span> o{' '}
          <span className="font-semibold text-red-500">Bloqueado</span> pueden iniciar un preset
        </p>
      </div>

      {/* Dispenser grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {dispensers.map((dispenser) => {
          const eligible = isEligibleForPreset(dispenser.status);
          return (
            <div
              key={dispenser.dispenserNumber}
              className={cn(
                'rounded-xl transition-all duration-200',
                eligible
                  ? 'cursor-pointer hover:scale-105 hover:shadow-xl ring-2 ring-transparent hover:ring-indigo-400'
                  : 'opacity-40 cursor-not-allowed'
              )}
              onClick={() => {
                if (eligible) {
                  onSelect({
                    dispenserNumber: dispenser.dispenserNumber,
                    nozzleCodes: dispenser.nozzleCodes,
                    products: dispenser.products,
                  });
                }
              }}
              title={
                eligible
                  ? `Seleccionar Dispensador ${dispenser.dispenserNumber}`
                  : 'No disponible para preset'
              }
            >
              <DispenserCard
                dispenserNumber={dispenser.dispenserNumber}
                status={dispenser.status}
                currentLiters={dispenser.currentLiters}
                activeNozzle={dispenser.activeNozzle}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 rounded-xl bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-xs text-slate-600">Libre – disponible para preset</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-xs text-slate-600">Bloqueado – disponible para preset</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-slate-300" />
          <span className="text-xs text-slate-500">Otros estados – no disponibles</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 – Select Nozzle
// ---------------------------------------------------------------------------

function Step2SelectNozzle({
  dispenser,
  statuses,
  onSelect,
  onBack,
}: {
  dispenser: SelectedDispenser;
  statuses: NozzleStatusDto[] | undefined;
  onSelect: (nozzle: SelectedNozzle) => void;
  onBack: () => void;
}) {
  const getNozzleStatus = useCallback(
    (code: string): NozzleStatus => {
      if (!statuses) return NozzleStatus.NotConfigured;
      const found = statuses.find((s) => s.nozzleCode === code);
      return found?.status ?? NozzleStatus.NotConfigured;
    },
    [statuses]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="mt-1 flex-shrink-0"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Atrás
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Seleccionar Manguera</h2>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-sm font-semibold">
              Dispensador {dispenser.dispenserNumber.toString().padStart(2, '0')}
            </Badge>
            <span className="text-sm text-slate-500">Selecciona el tipo de combustible</span>
          </div>
        </div>
      </div>

      {/* Nozzle cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {dispenser.nozzleCodes.map((code, index) => {
          const product = dispenser.products[index] ?? 'Desconocido';
          const nozzleStatus = getNozzleStatus(code);
          return (
            <NozzleProductCard
              key={code}
              nozzleCode={code}
              product={product}
              status={nozzleStatus}
              onClick={() => onSelect({ code, product })}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 – Configure Preset
// ---------------------------------------------------------------------------

function Step3ConfigurePreset({
  dispenser,
  nozzle,
  onBack,
  onReset,
}: {
  dispenser: SelectedDispenser;
  nozzle: SelectedNozzle;
  onBack: () => void;
  onReset: () => void;
}) {
  const defaultTab: PresetTab = nozzle.product === 'Exonerado' ? 'liters' : 'amount';

  const [activeTab, setActiveTab] = useState<PresetTab>(defaultTab);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedLiters, setSelectedLiters] = useState<number | null>(null);
  const [customLiters, setCustomLiters] = useState('');
  const [selectedAttendantId, setSelectedAttendantId] = useState<string>('');
  const [identifierType, setIdentifierType] = useState<string>('0');
  const [priceLevel, setPriceLevel] = useState<string>('0');
  const [timeoutSeconds, setTimeoutSeconds] = useState<string>('30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: attendants, isLoading: loadingAttendants } = useQuery({
    queryKey: ['attendants-active'],
    queryFn: () => attendantsApi.getAll(true),
  });

  // Only attendants with a valid tagId can be selected
  const eligibleAttendants = attendants?.filter((a) => a.tagId && a.tagId.length === 16) ?? [];

  const handleAmountChip = (value: number) => {
    setSelectedAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(null);
  };

  const handleLiterChip = (value: number) => {
    setSelectedLiters(value);
    setCustomLiters('');
  };

  const handleCustomLitersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomLiters(e.target.value);
    setSelectedLiters(null);
  };

  // Mapping: presetType 0=Monto, 1=Volumen. Full tank = presetValue 0.
  const getEffectivePreset = (): { presetValue: number; presetType: number } | null => {
    if (activeTab === 'amount') {
      const value = selectedAmount ?? (customAmount ? parseFloat(customAmount) : null);
      if (!value || value <= 0) return null;
      return { presetValue: value, presetType: 0 };
    }
    if (activeTab === 'liters') {
      const value = selectedLiters ?? (customLiters ? parseFloat(customLiters) : null);
      if (!value || value <= 0) return null;
      return { presetValue: value, presetType: 1 };
    }
    if (activeTab === 'full') {
      return { presetValue: 0, presetType: 0 };
    }
    return null;
  };

  const effectivePreset = getEffectivePreset();
  const selectedAttendant = eligibleAttendants.find((a) => a.id === selectedAttendantId);
  const canSubmit = effectivePreset !== null && !!selectedAttendant && !isSubmitting;

  const handleSubmit = async () => {
    if (!effectivePreset || !selectedAttendant?.tagId) return;

    setIsSubmitting(true);
    try {
      await pumpApi.presetWithTag({
        nozzleCode: nozzle.code,
        tagId: selectedAttendant.tagId,
        identifierType: parseInt(identifierType),
        authorize: true,
        presetValue: effectivePreset.presetValue,
        timeoutSeconds: Math.min(99, Math.max(0, parseInt(timeoutSeconds) || 30)),
        presetType: effectivePreset.presetType,
        priceLevel: parseInt(priceLevel),
      });

      toast.success('Preset enviado correctamente');
      onReset();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="mt-1 flex-shrink-0"
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Atrás
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configurar Preset</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-sm font-semibold">
              Dispensador {dispenser.dispenserNumber.toString().padStart(2, '0')}
            </Badge>
            <span className="text-slate-400">→</span>
            <Badge variant="secondary" className="text-sm font-semibold">
              Manguera #{nozzle.code}
            </Badge>
            <span className="text-slate-400">→</span>
            <Badge className="bg-indigo-600 text-white text-sm font-semibold">
              {nozzle.product}
            </Badge>
          </div>
        </div>
      </div>

      {/* Authorization config */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
        <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Configuración de autorización
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Attendant selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600">Frentista</label>
            <Select
              value={selectedAttendantId}
              onValueChange={setSelectedAttendantId}
              disabled={loadingAttendants}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder={loadingAttendants ? 'Cargando...' : 'Selecciona un frentista'} />
              </SelectTrigger>
              <SelectContent>
                {eligibleAttendants.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.fullName} — {a.code}
                  </SelectItem>
                ))}
                {!loadingAttendants && eligibleAttendants.length === 0 && (
                  <SelectItem value="__none__" disabled>
                    Sin frentistas con tag asignado
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedAttendant?.tagId && (
              <p className="text-xs text-slate-400 font-mono">Tag: {selectedAttendant.tagId}</p>
            )}
          </div>

          {/* Identifier type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600">Tipo de identificador</label>
            <Select value={identifierType} onValueChange={setIdentifierType}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Frentista</SelectItem>
                <SelectItem value="1">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price level */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600">Nivel de precio</label>
            <Select value={priceLevel} onValueChange={setPriceLevel}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">A la vista</SelectItem>
                <SelectItem value="1">Crédito</SelectItem>
                <SelectItem value="2">Débito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timeout */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-600">
              Timeout <span className="text-slate-400 font-normal">(0–99 seg)</span>
            </label>
            <Input
              type="number"
              min="0"
              max="99"
              value={timeoutSeconds}
              onChange={(e) => setTimeoutSeconds(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>
      </div>

      {/* Preset value tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as PresetTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="amount" className="text-sm font-medium">💰 Monto</TabsTrigger>
          <TabsTrigger value="liters" className="text-sm font-medium">🔢 Litros</TabsTrigger>
          <TabsTrigger value="full" className="text-sm font-medium">⛽ Tanque Lleno</TabsTrigger>
        </TabsList>

        {/* Tab: Amount */}
        <TabsContent value="amount" className="mt-6 space-y-5">
          <div>
            <p className="mb-4 text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Selecciona el monto en colones
            </p>
            <div className="flex flex-wrap gap-3">
              {AMOUNT_CHIPS.map((amount) => (
                <PresetChip
                  key={amount}
                  label={`₡${amount.toLocaleString('es-CR')}`}
                  selected={selectedAmount === amount}
                  onClick={() => handleAmountChip(amount)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-500">O ingresa un monto personalizado</label>
            <div className="relative max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold select-none">₡</span>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="Ej: 7500"
                value={customAmount}
                onChange={handleCustomAmountChange}
                className="pl-7"
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab: Liters */}
        <TabsContent value="liters" className="mt-6 space-y-5">
          <div>
            <p className="mb-4 text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Selecciona la cantidad en litros
            </p>
            <div className="flex flex-wrap gap-3">
              {LITER_CHIPS.map((liters) => (
                <PresetChip
                  key={liters}
                  label={`${liters}L`}
                  selected={selectedLiters === liters}
                  onClick={() => handleLiterChip(liters)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-500">O ingresa litros personalizados</label>
            <div className="relative max-w-xs">
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="Ej: 75"
                value={customLiters}
                onChange={handleCustomLitersChange}
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold select-none">L</span>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Full Tank */}
        <TabsContent value="full" className="mt-6">
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <span className="text-7xl">🛢️</span>
            <p className="text-3xl font-bold text-slate-800">Tanque Lleno</p>
            <p className="max-w-sm text-sm text-slate-500">
              El dispensador se autorizará para llenar el tanque completo y se detendrá
              automáticamente cuando el tanque esté lleno.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit */}
      <div className="pt-2">
        <Button
          size="lg"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-14 text-base transition-colors"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enviando preset...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-5 w-5" />
              Confirmar Preset
            </>
          )}
        </Button>
        {!canSubmit && !isSubmitting && (
          <p className="mt-2 text-center text-xs text-slate-400">
            {!selectedAttendant
              ? 'Selecciona un frentista para continuar'
              : activeTab !== 'full'
              ? 'Selecciona o ingresa un valor para continuar'
              : ''}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root wizard component
// ---------------------------------------------------------------------------

export default function PresetPage() {
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedDispenser, setSelectedDispenser] = useState<SelectedDispenser | null>(null);
  const [selectedNozzle, setSelectedNozzle] = useState<SelectedNozzle | null>(null);

  // Keep statuses cached so Step 2 can show nozzle status without a new query
  const { data: statuses } = useQuery({
    queryKey: ['preset-nozzle-statuses'],
    queryFn: monitoringApi.getStatuses,
    refetchInterval: 3000,
  });

  const handleDispenserSelect = (dispenser: SelectedDispenser) => {
    setSelectedDispenser(dispenser);
    setSelectedNozzle(null);
    setStep(2);
  };

  const handleNozzleSelect = (nozzle: SelectedNozzle) => {
    setSelectedNozzle(nozzle);
    setStep(3);
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setSelectedDispenser(null);
    setSelectedNozzle(null);
  };

  const handleBackToStep2 = () => {
    setStep(2);
    setSelectedNozzle(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        {/* Page title */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Preset</h1>
              <p className="text-sm text-slate-500">Autorización de surtidor con preset</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="mt-6 flex items-center gap-2">
            {([1, 2, 3] as WizardStep[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors',
                    step === s
                      ? 'bg-indigo-600 text-white shadow-md'
                      : step > s
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-200 text-slate-400'
                  )}
                >
                  {s}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium hidden sm:inline',
                    step === s ? 'text-indigo-600' : 'text-slate-400'
                  )}
                >
                  {s === 1 ? 'Dispensador' : s === 2 ? 'Manguera' : 'Configurar'}
                </span>
                {s < 3 && (
                  <div
                    className={cn(
                      'mx-1 h-px w-8 sm:w-16',
                      step > s ? 'bg-indigo-400' : 'bg-slate-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard content */}
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-6 lg:p-8">
            {step === 1 && (
              <Step1SelectDispenser onSelect={handleDispenserSelect} />
            )}

            {step === 2 && selectedDispenser && (
              <Step2SelectNozzle
                dispenser={selectedDispenser}
                statuses={statuses}
                onSelect={handleNozzleSelect}
                onBack={handleBackToStep1}
              />
            )}

            {step === 3 && selectedDispenser && selectedNozzle && (
              <Step3ConfigurePreset
                dispenser={selectedDispenser}
                nozzle={selectedNozzle}
                onBack={handleBackToStep2}
                onReset={handleBackToStep1}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
