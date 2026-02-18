import apiClient from './client';
import { FuelingTransactionDto } from '@/types/api';

export const fuelingApi = {
  // Get transactions by date range
  getTransactions: async (from?: string, to?: string, nozzleId?: number): Promise<FuelingTransactionDto[]> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (nozzleId) params.append('nozzleId', nozzleId.toString());

    const response = await apiClient.get<FuelingTransactionDto[]>(
      `/api/Fueling/transactions?${params.toString()}`
    );
    return response.data;
  },
};
