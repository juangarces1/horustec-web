import { Card } from '@/components/ui/card';
import { NozzleStatus } from '@/types/api';
import { cn } from '@/lib/utils';

interface DispenserCardProps {
  dispenserNumber: number;
  status: NozzleStatus;
  currentLiters: number | null;
  activeNozzle: { code: string; product: string } | null;
}

const statusColors: Record<NozzleStatus, string> = {
  [NozzleStatus.NotConfigured]: 'bg-gray-300 text-gray-700',
  [NozzleStatus.Available]: 'bg-green-500 text-white',
  [NozzleStatus.Blocked]: 'bg-red-500 text-white',
  [NozzleStatus.Fueling]: 'bg-orange-500 text-white animate-pulse',
  [NozzleStatus.Ready]: 'bg-blue-500 text-white',
  [NozzleStatus.Waiting]: 'bg-yellow-500 text-white',
  [NozzleStatus.Failure]: 'bg-red-800 text-white',
  [NozzleStatus.Busy]: 'bg-purple-500 text-white',
  [NozzleStatus.Error]: 'bg-red-900 text-white',
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

const productIcons: Record<string, string> = {
  'Super': '⭐',
  'Regular': '⛽',
  'Diesel': '🚛',
  'Exonerado': '🔰',
};

export function DispenserCard({ dispenserNumber, status, currentLiters, activeNozzle }: DispenserCardProps) {
  return (
    <Card
      className={cn(
        'p-6 transition-all duration-300 hover:shadow-xl hover:scale-105',
        statusColors[status]
      )}
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        {/* Dispenser number */}
        <div className="text-4xl font-bold">D {dispenserNumber.toString().padStart(2, '0')}</div>

        {/* Status label */}
        <div className="text-base font-semibold text-center">{statusLabels[status]}</div>

        {/* Show money when fueling */}
        {currentLiters !== null && currentLiters > 0 && (
          <div className="font-mono font-bold mt-2 bg-white/20 px-4 py-2 rounded-xl shadow-lg">
            <span className="text-2xl">₡</span>
            <span className="text-3xl">{Math.round(currentLiters).toLocaleString('es-ES')}</span>
          </div>
        )}

        {/* Show active nozzle info when there's activity */}
        {activeNozzle && (
          <div className="mt-2 w-full">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium">Manguera #{activeNozzle.code}</span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-2xl">{productIcons[activeNozzle.product] || '⛽'}</span>
                <span className="text-base font-bold">{activeNozzle.product}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
