import apiClient from './client';
import type { AttendantDto, CreateAttendantRequest, UpdateAttendantRequest } from '@/types/api';

export const attendantsApi = {
  getAll: async (onlyActive?: boolean): Promise<AttendantDto[]> => {
    const params = onlyActive !== undefined ? { onlyActive } : {};
    const response = await apiClient.get<AttendantDto[]>('/api/attendants', { params });
    return response.data;
  },

  getById: async (id: string): Promise<AttendantDto> => {
    const response = await apiClient.get<AttendantDto>(`/api/attendants/${id}`);
    return response.data;
  },

  getByTag: async (tagId: string): Promise<AttendantDto> => {
    const response = await apiClient.get<AttendantDto>(`/api/attendants/by-tag/${tagId}`);
    return response.data;
  },

  create: async (data: CreateAttendantRequest): Promise<AttendantDto> => {
    const response = await apiClient.post<AttendantDto>('/api/attendants', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAttendantRequest): Promise<AttendantDto> => {
    const response = await apiClient.put<AttendantDto>(`/api/attendants/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/attendants/${id}`);
  },

  uploadPhoto: async (id: string, file: File): Promise<AttendantDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<AttendantDto>(`/api/attendants/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deletePhoto: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/attendants/${id}/photo`);
  },
};
