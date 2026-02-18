import apiClient from './client';
import type { ProductDto, CreateProductRequest, UpdateProductRequest } from '@/types/api';

export const productsApi = {
  getAll: async (onlyActive?: boolean): Promise<ProductDto[]> => {
    const params = onlyActive !== undefined ? { onlyActive } : {};
    const response = await apiClient.get<ProductDto[]>('/api/products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ProductDto> => {
    const response = await apiClient.get<ProductDto>(`/api/products/${id}`);
    return response.data;
  },

  getByCode: async (code: string): Promise<ProductDto> => {
    const response = await apiClient.get<ProductDto>(`/api/products/by-code/${code}`);
    return response.data;
  },

  create: async (data: CreateProductRequest): Promise<ProductDto> => {
    const response = await apiClient.post<ProductDto>('/api/products', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProductRequest): Promise<ProductDto> => {
    const response = await apiClient.put<ProductDto>(`/api/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/products/${id}`);
  },
};
