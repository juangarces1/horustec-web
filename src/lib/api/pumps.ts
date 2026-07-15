import apiClient from './client';
import { PumpDto, ReapplyIdentifierResult } from '@/types/api';

export const pumpsApi = {
  // Listar surtidores con mangueras y estado del identificador
  getAll: async (): Promise<PumpDto[]> => {
    const response = await apiClient.get<PumpDto[]>('/api/pumps');
    return response.data;
  },

  // Activar/desactivar el sensor Identfid de la cara (envía DT214 cmd 13 al primer bico)
  setIdentifier: async (pumpId: string, enabled: boolean): Promise<void> => {
    await apiClient.put(`/api/pumps/${pumpId}/identifier`, { enabled });
  },

  // Reenviar el estado guardado de todas las caras al concentrador
  reapplyIdentifiers: async (): Promise<ReapplyIdentifierResult[]> => {
    const response = await apiClient.post<{ results: ReapplyIdentifierResult[] }>(
      '/api/pumps/identifiers/reapply'
    );
    return response.data.results;
  },
};
