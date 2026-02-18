import apiClient from './client';
import { UserDto, CreateUserRequest, UpdateUserRequest } from '@/types/api';

export const usersApi = {
  // Listar todos los usuarios
  getAll: async (): Promise<UserDto[]> => {
    const response = await apiClient.get<UserDto[]>('/api/Users');
    return response.data;
  },

  // Obtener usuario por ID
  getById: async (id: string): Promise<UserDto> => {
    const response = await apiClient.get<UserDto>(`/api/Users/${id}`);
    return response.data;
  },

  // Crear usuario
  create: async (data: CreateUserRequest): Promise<UserDto> => {
    const response = await apiClient.post<UserDto>('/api/Users', data);
    return response.data;
  },

  // Actualizar usuario
  update: async (data: UpdateUserRequest): Promise<UserDto> => {
    const response = await apiClient.put<UserDto>(`/api/Users/${data.id}`, data);
    return response.data;
  },

  // Eliminar usuario
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/Users/${id}`);
  },
};
