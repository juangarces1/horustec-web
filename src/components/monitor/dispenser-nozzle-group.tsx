import { Card } from '@/components/ui/card';
import { RollingNumber } from '@/components/ui/rolling-number';
import { NozzleStatus } from '@/types/api';
import { PRODUCT_COLORS } from '@/lib/nozzle-products';
import { cn } from '@/lib/utils';

export interface GroupNozzle {
  code: string;
  product: string;
  status: NozzleStatus;
  /** Monto ₡ actual (ya multiplicado ×100 para display). */
  currentCash?: number;
}

interface DispenserNozzleGroupProps {
  dispenserNumber: number;
  nozzles: GroupNozzle[];
}

// Misma jerarquía visual que dispensadores: lo activo domina, lo pasivo
// retrocede, el rojo queda para Falla/Error.
const tileColors: Record<NozzleStatus, string> = {
  [NozzleStatus.NotConfigured]: 'bg-gray-50 text-gray-400 border border-dashed border-gray-300',
  [NozzleStatus.Available]: 'bg-green-500 text-white',
  [NozzleStatus.Blocked]: 'bg-slate-100 text-slate-500',
  [NozzleStatus.Fueling]:
    'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/40',
  [NozzleStatus.Ready]: 'bg-blue-500 text-white',
  [NozzleStatus.Waiting]: 'bg-yellow-500 text-white',
  [NozzleStatus.Failure]: 'bg-red-600 text-white',
  [NozzleStatus.Busy]: 'bg-purple-500 text-white',
  [NozzleStatus.Error]: 'bg-red-800 text-white',
};

const statusLabels: Record<NozzleStatus, string> = {
  [NozzleStatus.NotConfigured]: 'No Config.',
  [NozzleStatus.Available]: 'Libre',
  [NozzleStatus.Blocked]: 'Bloqueado',
  [NozzleStatus.Fueling]: 'Abasteciendo',
  [NozzleStatus.Ready]: 'Pronto',
  [NozzleStatus.Waiting]: 'Espera',
  [NozzleStatus.Failure]: 'Falla',
  [NozzleStatus.Busy]: 'Ocupado',
  [NozzleStatus.Error]: 'Error',
};

function NozzleTile({ nozzle }: { nozzle: GroupNozzle }) {
  const isFueling = nozzle.status === NozzleStatus.Fueling;
  const showCash = isFueling && nozzle.currentCash != null && nozzle.currentCash > 0;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors duration-300',
        tileColors[nozzle.status]
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/60"
          style={{ backgroundColor: PRODUCT_COLORS[nozzle.product] ?? '#94a3b8' }}
        />
        <span className="text-sm font-bold">#{nozzle.code}</span>
        <span className="truncate text-xs font-medium">{nozzle.product}</span>
      </div>
      {showCash ? (
        <span className="font-mono text-sm font-bold whitespace-nowrap">
          ₡<RollingNumber text={Math.round(nozzle.currentCash!).toLocaleString('es-ES')} />
        </span>
      ) : (
        <span className="text-xs font-medium whitespace-nowrap">{statusLabels[nozzle.status]}</span>
      )}
    </div>
  );
}

export function DispenserNozzleGroup({ dispenserNumber, nozzles }: DispenserNozzleGroupProps) {
  const hasFueling = nozzles.some((n) => n.status === NozzleStatus.Fueling);

  return (
    <Card
      className={cn(
        'gap-2 p-3 transition-all duration-300',
        hasFueling && 'ring-2 ring-orange-300 shadow-lg shadow-orange-500/20'
      )}
    >
      <div className="px-1 text-sm font-bold text-slate-700">
        D {dispenserNumber.toString().padStart(2, '0')}
      </div>
      <div className="flex flex-col gap-1.5">
        {nozzles.map((nozzle) => (
          <NozzleTile key={nozzle.code} nozzle={nozzle} />
        ))}
      </div>
    </Card>
  );
}
