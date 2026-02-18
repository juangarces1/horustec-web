import { Card } from '@/components/ui/card';
import { NozzleStatus } from '@/types/api';
import { cn } from '@/lib/utils';

interface NozzleCardProps {
  nozzleCode: string;
  status: NozzleStatus;
  currentValue?: number;
}

const statusColors: Record<NozzleStatus, string> = {
  [NozzleStatus.NotConfigured]: 'bg-gray-300 text-gray-700',
  [NozzleStatus.Available]: 'bg-green-500 text-white',        // Libre
  [NozzleStatus.Blocked]: 'bg-red-500 text-white',            // Bloqueado
  [NozzleStatus.Fueling]: 'bg-orange-500 text-white animate-pulse', // Abasteciendo
  [NozzleStatus.Ready]: 'bg-blue-500 text-white',             // Pronto (nozzle lifted)
  [NozzleStatus.Waiting]: 'bg-yellow-500 text-white',         // Espera
  [NozzleStatus.Failure]: 'bg-red-800 text-white',            // Falla
  [NozzleStatus.Busy]: 'bg-purple-500 text-white',            // Ocupado
  [NozzleStatus.Error]: 'bg-red-900 text-white',              // Error
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

export function NozzleCard({ nozzleCode, status, currentValue }: NozzleCardProps) {
  return (
    <Card
      className={cn(
        'p-4 transition-all duration-300 hover:shadow-lg',
        statusColors[status]
      )}
    >
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="text-2xl font-bold">#{nozzleCode}</div>
        <div className="text-sm text-center font-medium">{statusLabels[status]}</div>
        {currentValue !== undefined && currentValue > 0 && (
          <div className="font-mono">
            <span className="text-sm">₡</span>
            <span className="text-lg">{Math.round(currentValue).toLocaleString('es-ES')}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
