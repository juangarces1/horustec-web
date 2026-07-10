import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RollingNumber } from '@/components/ui/rolling-number';
import { NOZZLE_PRODUCTS } from '@/lib/nozzle-products';
import { VisualizationDto } from '@/types/api';
import { NozzleStatus } from '@/types/api';

interface ActiveFuelingsProps {
  visualizations: VisualizationDto[];
  attendantsByTag?: Map<string, string>;
  pricesByProduct?: Map<string, number>;
}

export function ActiveFuelings({ visualizations, attendantsByTag, pricesByProduct }: ActiveFuelingsProps) {
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
          {activeFuelings.map((fueling) => {
            // El API puede devolver productName null: usar el mapeo físico manguera→producto
            const product = fueling.productName || NOZZLE_PRODUCTS[fueling.nozzleCode] || 'Sin especificar';
            // pricesByProduct usa claves en minúscula
            const price = pricesByProduct?.get(product.toLowerCase());
            const liters = price && price > 0
              ? (fueling.currentCash * 100) / price
              : null;

            return (
              <div
                key={fueling.nozzleCode}
                className="flex items-center justify-between p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center justify-center w-16 h-16 bg-orange-500 text-white rounded-lg">
                    <div className="text-xs font-medium">Manguera</div>
                    <div className="text-2xl font-bold">#{fueling.nozzleCode}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-sm text-gray-500">Producto</div>
                    <div className="font-medium">{product}</div>
                    {fueling.tagId && attendantsByTag?.get(fueling.tagId.toUpperCase()) && (
                      <div className="text-sm text-gray-600">
                        👤 {attendantsByTag.get(fueling.tagId.toUpperCase())}
                      </div>
                    )}
                    {liters != null && liters > 0 && (
                      <div className="text-sm font-semibold text-orange-700">
                        🔢 <RollingNumber text={liters.toFixed(2)} /> L
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Monto actual</div>
                  <div className="font-mono font-bold text-orange-600">
                    <span className="text-2xl">₡</span>
                    <RollingNumber
                      text={Math.round(fueling.currentCash * 100).toLocaleString('es-ES')}
                      className="text-3xl"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
