import apiClient from './client';
import type { ScheduledPriceChangeDto, CreateScheduledPriceRequest } from '@/types/api';

export const scheduledPricesApi = {
  getPending: async (): Promise<ScheduledPriceChangeDto[]> => {
    const response = await apiClient.get<ScheduledPriceChangeDto[]>('/api/scheduled-prices');
    return response.data;
  },

  getAll: async (): Promise<ScheduledPriceChangeDto[]> => {
    const response = await apiClient.get<ScheduledPriceChangeDto[]>('/api/scheduled-prices/all');
    return response.data;
  },

  create: async (data: CreateScheduledPriceRequest): Promise<ScheduledPriceChangeDto> => {
    const response = await apiClient.post<ScheduledPriceChangeDto>('/api/scheduled-prices', data);
    return response.data;
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/scheduled-prices/${id}`);
  },
};
