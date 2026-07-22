import apiClient from './client';

export interface SettingsDto {
  /** Segundos hasta retirar la manguera en un preset (0–99) */
  presetTimeoutSeconds: number;
}

export const settingsApi = {
  // Lectura: Operator o superior (la página de preset lo necesita)
  get: async (): Promise<SettingsDto> => {
    const response = await apiClient.get<SettingsDto>('/api/settings');
    return response.data;
  },

  // Escritura: solo Admin
  update: async (settings: SettingsDto): Promise<void> => {
    await apiClient.put('/api/settings', settings);
  },
};
