import apiClient from './client';
import { UserDto, CreateUserRequest, UpdateUserRequest } from '@/types/api';

export const usersApi = {
  // Listar todos los usuarios
  getAll: async (): Promise<UserDto[]> => {
    const response = await apiClient.get<UserDto[]>('/api/users');
    return response.data;
  },

  // Obtener usuario por ID
  getById: async (id: string): Promise<UserDto> => {
    const response = await apiClient.get<UserDto>(`/api/users/${id}`);
    return response.data;
  },

  // Crear usuario
  create: async (data: CreateUserRequest): Promise<UserDto> => {
    const response = await apiClient.post<UserDto>('/api/users', data);
    return response.data;
  },

  // Actualizar usuario (también sirve para desactivar)
  update: async (data: UpdateUserRequest): Promise<UserDto> => {
    const response = await apiClient.put<UserDto>(`/api/users/${data.id}`, data);
    return response.data;
  },
};
