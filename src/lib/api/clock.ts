import apiClient from './client';
import { ClockDto } from '@/types/api';

export const clockApi = {
  // Leer el reloj del concentrador (solo Admin)
  get: async (): Promise<ClockDto> => {
    const response = await apiClient.get<ClockDto>('/api/clock');
    return response.data;
  },

  // Sincronizar el reloj del concentrador con la hora del servidor (solo Admin)
  sync: async (): Promise<void> => {
    await apiClient.post('/api/clock/sync');
  },
};
