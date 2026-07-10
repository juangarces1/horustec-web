import { Card } from '@/components/ui/card';
import { RollingNumber } from '@/components/ui/rolling-number';
import { NozzleStatus } from '@/types/api';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface DispenserCardProps {
  dispenserNumber: number;
  status: NozzleStatus;
  currentLiters: number | null;
  activeNozzle: { code: string; product: string } | null;
  attendantName?: string | null;
  attendantPhotoUrl?: string | null;
  calculatedLiters?: number | null;
}

// Jerarquía visual: el naranja de "Abasteciendo" domina; los estados pasivos
// (Bloqueado, No Configurado) retroceden en gris; el rojo queda reservado
// para Falla/Error.
const statusColors: Record<NozzleStatus, string> = {
  [NozzleStatus.NotConfigured]: 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300',
  [NozzleStatus.Available]: 'bg-green-500 text-white',
  [NozzleStatus.Blocked]: 'bg-slate-200 text-slate-500',
  [NozzleStatus.Fueling]:
    'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/40 ring-2 ring-orange-300',
  [NozzleStatus.Ready]: 'bg-blue-500 text-white',
  [NozzleStatus.Waiting]: 'bg-yellow-500 text-white',
  [NozzleStatus.Failure]: 'bg-red-600 text-white',
  [NozzleStatus.Busy]: 'bg-purple-500 text-white',
  [NozzleStatus.Error]: 'bg-red-800 text-white',
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

export function DispenserCard({ dispenserNumber, status, currentLiters, activeNozzle, attendantName, attendantPhotoUrl, calculatedLiters }: DispenserCardProps) {
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

        {/* Show money and liters when fueling */}
        {currentLiters !== null && currentLiters > 0 && (
          <div className="flex flex-col items-center gap-1 mt-2">
            <div className="font-mono font-bold bg-white/20 px-4 py-2 rounded-xl shadow-lg">
              <span className="text-2xl">₡</span>
              <RollingNumber
                text={Math.round(currentLiters).toLocaleString('es-ES')}
                className="text-3xl"
              />
            </div>
            {calculatedLiters != null && calculatedLiters > 0 && (
              <div className="text-sm font-medium text-center">
                <RollingNumber text={calculatedLiters.toFixed(2)} /> L
              </div>
            )}
          </div>
        )}

        {/* Product type */}
        {activeNozzle && (
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-lg">{productIcons[activeNozzle.product] || '⛽'}</span>
            <span className="text-sm font-bold">{activeNozzle.product}</span>
          </div>
        )}

        {/* Attendant — shown independently of activeNozzle */}
        {attendantName && (
          <div className="w-full bg-white/20 backdrop-blur-sm px-3 py-2.5 rounded-xl">
            <div className="flex flex-col items-center gap-1.5">
              {attendantPhotoUrl ? (
                <img
                  src={`${API_URL}${attendantPhotoUrl}`}
                  alt={attendantName}
                  className="h-10 w-10 rounded-full object-cover border-2 border-white/40"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-white/30 flex items-center justify-center text-lg font-bold">
                  {attendantName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium text-center leading-tight truncate w-full">{attendantName}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
