import { apiClient } from './client';

export interface User {
  id_utilisateur: number;
  id_membre: number;
  email: string;
  id_role: number;
}

export const authApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await fetch('/api/proxy/auth?path=users');
    if (!response.ok) throw new Error('Failed to fetch users via proxy');
    return response.json();
  },
};
