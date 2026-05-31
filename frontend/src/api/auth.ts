import type { AuthResponse, User } from '@/types';

import apiClient from './client';

export type Provider = 'google' | 'github';

export async function exchangeOAuthCode(
  provider: Provider,
  code: string,
  redirectUri: string
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/oauth/exchange/', {
    provider,
    code,
    redirect_uri: redirectUri,
  });
  return data;
}

/** Development-only password-free login (backend allows it when DEBUG=True). */
export async function devLogin(
  email: string,
  asCreator = false
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/dev-login/', {
    email,
    as_creator: asCreator,
  });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me/');
  return data;
}

export async function updateMe(payload: Partial<User>): Promise<User> {
  const { data } = await apiClient.patch<User>('/auth/me/', payload);
  return data;
}

export async function uploadAvatar(file: File): Promise<{ avatar: string }> {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await apiClient.post<{ avatar: string }>(
    '/auth/me/upload-avatar/',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function becomeCreator(): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/become-creator/');
  return data;
}

export async function logout(refresh: string): Promise<void> {
  await apiClient.post('/auth/logout/', { refresh });
}
