import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisualizationDto } from '@/types/api';
import { NozzleStatus } from '@/types/api';

interface ActiveFuelingsProps {
  visualizations: VisualizationDto[];
}

export function ActiveFuelings({ visualizations }: ActiveFuelingsProps) {
  // Filter only active fuelings (status Fueling)
  const activeFuelings = visualizations.filter(v => v.status === NozzleStatus.Fueling);

  if (activeFuelings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Abastecimientos Activos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No hay abastecimientos en curso en este momento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          Abastecimientos Activos ({activeFuelings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeFuelings.map((fueling) => (
            <div
              key={fueling.nozzleCode}
              className="flex items-center justify-between p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center justify-center w-16 h-16 bg-orange-500 text-white rounded-lg">
                  <div className="text-xs font-medium">Surtidor</div>
                  <div className="text-2xl font-bold">#{fueling.nozzleCode}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Producto</div>
                  <div className="font-medium">{fueling.productName || 'Sin especificar'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Monto actual</div>
                <div className="font-bold text-orange-600">
                  <span className="text-2xl">₡</span>
                  <span className="text-3xl">{Math.round(fueling.currentLiters * 100).toLocaleString('es-ES')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
