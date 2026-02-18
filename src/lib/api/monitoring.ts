import apiClient from './client';
import { NozzleStatusDto, VisualizationDto } from '@/types/api';

export const monitoringApi = {
  // Get nozzle statuses
  getStatuses: async (): Promise<NozzleStatusDto[]> => {
    const response = await apiClient.get<NozzleStatusDto[]>('/api/Monitoring/status');
    return response.data;
  },

  // Get active fuelings (visualization)
  getVisualization: async (): Promise<VisualizationDto[]> => {
    const response = await apiClient.get<VisualizationDto[]>('/api/Monitoring/visualization');
    return response.data;
  },
};
