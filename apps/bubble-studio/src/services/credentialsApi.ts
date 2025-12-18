import { api } from '../lib/api';
import type {
  CredentialResponse,
  CreateCredentialRequest,
  UpdateCredentialRequest,
} from '@bubblelab/shared-schemas';

export const credentialsApi = {
  getCredentials: async (): Promise<CredentialResponse[]> => {
    return api.get<CredentialResponse[]>('/api/credentials');
  },

  initiateOAuth: async (
    provider: string,
    credentialType: string,
    name?: string,
    scopes?: string[]
  ): Promise<{ authUrl: string; state: string }> => {
    return api.post<{ authUrl: string; state: string }>(
      `/api/oauth/${provider}/initiate`,
      {
        credentialType,
        name,
        scopes,
      }
    );
  },

  refreshOAuthToken: async (
    credentialId: number,
    provider: string
  ): Promise<{ message: string }> => {
    return api.post<{ message: string }>(`/api/oauth/${provider}/refresh`, {
      credentialId,
    });
  },

  createCredential: async (
    data: CreateCredentialRequest
  ): Promise<CredentialResponse> => {
    return api.post<CredentialResponse>('/api/credentials', data);
  },

  updateCredential: async (
    id: number,
    data: UpdateCredentialRequest
  ): Promise<CredentialResponse> => {
    return api.put<CredentialResponse>(`/api/credentials/${id}`, data);
  },

  deleteCredential: async (_apiBaseUrl: string, id: number): Promise<void> => {
    return api.delete<void>(`/api/credentials/${id}`);
  },
};