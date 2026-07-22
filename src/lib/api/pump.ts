/**
 * Pump API client
 * Handles pump control operations such as preset authorization.
 */
import apiClient from './client';

export interface PresetWithTagRequest {
  nozzleCode: string;
  tagId: string;
  identifierType: number;  // 0=Pistero, 1=Cliente
  authorize: boolean;
  presetValue: number;     // Amount in colones (type 0) or liters (type 1). 0 = full tank.
  timeoutSeconds: number;  // 0-99
  // 0 = Monto, 1 = Volumen. El alcance lo decide el backend: siempre libera
  // solamente la manguera indicada.
  presetType: number;
  priceLevel: number;      // 0=A la vista, 1=Crédito, 2=Débito
}

export const pumpApi = {
  presetWithTag: async (request: PresetWithTagRequest): Promise<void> => {
    await apiClient.post('/api/Pump/preset-with-tag', request);
  },

  // ── Control directo de bombas (DT214) ─────────────────────────
  // Todos reciben el código de manguera ("01".."48"). El concentrador
  // rechaza la orden si el estado actual no la permite.

  free: async (nozzleCode: string): Promise<void> => {
    await apiClient.post('/api/Pump/free', { nozzleCode });
  },

  authorize: async (nozzleCode: string): Promise<void> => {
    await apiClient.post('/api/Pump/authorize', { nozzleCode });
  },

  block: async (nozzleCode: string): Promise<void> => {
    await apiClient.post('/api/Pump/block', { nozzleCode });
  },

  stop: async (nozzleCode: string): Promise<void> => {
    await apiClient.post('/api/Pump/stop', { nozzleCode });
  },

  pause: async (nozzleCode: string): Promise<void> => {
    await apiClient.post('/api/Pump/pause', { nozzleCode });
  },

  // Solo Admin: limpia el estado de la manguera en el concentrador
  clear: async (nozzleCode: string): Promise<void> => {
    await apiClient.post('/api/Pump/clear', { nozzleCode });
  },
};
