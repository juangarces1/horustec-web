/**
 * Pump API client
 * Handles pump control operations such as preset authorization.
 */
import apiClient from './client';

export interface PresetWithTagRequest {
  nozzleCode: string;
  tagId: string;
  identifierType: number;  // 0=Frentista, 1=Cliente
  authorize: boolean;
  presetValue: number;     // Amount in colones (type 0) or liters (type 1). 0 = full tank.
  timeoutSeconds: number;  // 0-99
  presetType: number;      // 0=Monto ($), 1=Volumen (litros)
  priceLevel: number;      // 0=A la vista, 1=Crédito, 2=Débito
}

export const pumpApi = {
  presetWithTag: async (request: PresetWithTagRequest): Promise<void> => {
    await apiClient.post('/api/Pump/preset-with-tag', request);
  },
};
