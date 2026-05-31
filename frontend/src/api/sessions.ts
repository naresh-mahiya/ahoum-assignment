import type {
  Category,
  PaginatedResponse,
  Session,
  SessionFilters,
  SessionFormValues,
} from '@/types';

import apiClient from './client';

export async function listSessions(
  filters: SessionFilters = {}
): Promise<PaginatedResponse<Session>> {
  const params: Record<string, string | number | boolean> = {};
  if (filters.search) params.search = filters.search;
  if (filters.category) params.category = filters.category;
  if (filters.is_free) params.is_free = true;
  if (filters.available_only) params.available_only = true;
  if (filters.ordering) params.ordering = filters.ordering;
  params.page = filters.page ?? 1;

  const { data } = await apiClient.get<PaginatedResponse<Session>>('/sessions/', {
    params,
  });
  return data;
}

export async function getSession(id: number | string): Promise<Session> {
  const { data } = await apiClient.get<Session>(`/sessions/${id}/`);
  return data;
}

export async function listMySessions(): Promise<Session[]> {
  const { data } = await apiClient.get<PaginatedResponse<Session> | Session[]>(
    '/sessions/my/'
  );
  return Array.isArray(data) ? data : data.results;
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/sessions/categories/');
  return data;
}

export async function createSession(
  payload: Partial<SessionFormValues>
): Promise<Session> {
  const { data } = await apiClient.post<Session>('/sessions/', payload);
  return data;
}

export async function updateSession(
  id: number,
  payload: Partial<SessionFormValues>
): Promise<Session> {
  const { data } = await apiClient.patch<Session>(`/sessions/${id}/`, payload);
  return data;
}

export async function deleteSession(id: number): Promise<void> {
  await apiClient.delete(`/sessions/${id}/`);
}

export async function publishSession(id: number): Promise<Session> {
  const { data } = await apiClient.post<Session>(`/sessions/${id}/publish/`);
  return data;
}

export async function cancelSession(id: number): Promise<Session> {
  const { data } = await apiClient.post<Session>(`/sessions/${id}/cancel/`);
  return data;
}

export async function uploadCoverImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await apiClient.post<{ url: string }>(
    '/sessions/upload-cover/',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}
