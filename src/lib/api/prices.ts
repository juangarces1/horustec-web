import apiClient from './client';
import type { ProductPriceDto, PriceHistoryDto, UpdatePriceRequest, MachinePriceDto } from '@/types/api';

export const pricesApi = {
  getCurrent: async (): Promise<ProductPriceDto[]> => {
    const response = await apiClient.get<ProductPriceDto[]>('/api/prices/current');
    return response.data;
  },

  getHistory: async (productId?: string): Promise<PriceHistoryDto[]> => {
    const params = productId ? { productId } : {};
    const response = await apiClient.get<PriceHistoryDto[]>('/api/prices/history', { params });
    return response.data;
  },

  updatePrice: async (productId: string, data: UpdatePriceRequest): Promise<ProductPriceDto> => {
    const response = await apiClient.put<ProductPriceDto>(`/api/prices/${productId}`, data);
    return response.data;
  },

  getMachinePrices: async (): Promise<MachinePriceDto[]> => {
    const response = await apiClient.get<MachinePriceDto[]>('/api/prices/machine');
    return response.data;
  },
};
