import apiClient from './client';
import { IdentifierDto, SaveTagRequest, DeleteTagRequest, IdentifierRecordDto } from '@/types/api';

export const identifiersApi = {
  // Leer identificador pendiente del concentrador
  readPending: async (): Promise<IdentifierDto | null> => {
    const response = await apiClient.get<IdentifierDto | null>('/api/identifiers/pending');
    return response.data;
  },

  // Listar todos los tags registrados en el concentrador
  listTags: async (): Promise<IdentifierRecordDto[]> => {
    const response = await apiClient.get<IdentifierRecordDto[]>('/api/identifiers/tags');
    return response.data;
  },

  // Registrar tag con permisos
  saveTag: async (data: SaveTagRequest): Promise<void> => {
    await apiClient.post('/api/identifiers/tags', data);
  },

  // Eliminar tag por posicion
  deleteTag: async (data: DeleteTagRequest): Promise<void> => {
    await apiClient.delete('/api/identifiers/tags', { data });
  },

  // Borrar todos los tags del concentrador
  clearAllTags: async (): Promise<void> => {
    await apiClient.delete('/api/identifiers/tags/all');
  },

  // Agregar tag a blacklist
  pushBlacklist: async (tag: string): Promise<void> => {
    await apiClient.post('/api/identifiers/blacklist/push', { tag });
  },

  // Quitar tag de blacklist
  popBlacklist: async (tag: string): Promise<void> => {
    await apiClient.post('/api/identifiers/blacklist/pop', { tag });
  },

  // Limpiar toda la blacklist
  clearBlacklist: async (): Promise<void> => {
    await apiClient.delete('/api/identifiers/blacklist');
  },
};
