import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { extractError } from '@/api/client';
import {
  cancelSession,
  createSession,
  deleteSession,
  getSession,
  listCategories,
  listMySessions,
  listSessions,
  publishSession,
  updateSession,
} from '@/api/sessions';
import { toast } from '@/lib/toast';
import type { SessionFilters, SessionFormValues } from '@/types';

export function useSessions(filters: SessionFilters) {
  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: () => listSessions(filters),
    placeholderData: keepPreviousData,
  });
}

export function useSession(id: number | string | undefined) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id as number),
    enabled: id !== undefined,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
    staleTime: 1000 * 60 * 10,
  });
}

export function useMySessions() {
  return useQuery({
    queryKey: ['my-sessions'],
    queryFn: listMySessions,
  });
}

export function useSessionMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['my-sessions'] });
    qc.invalidateQueries({ queryKey: ['sessions'] });
  };

  const create = useMutation({
    mutationFn: (payload: Partial<SessionFormValues>) => createSession(payload),
    onSuccess: () => {
      invalidate();
      toast.success('Session created!');
    },
    onError: (err) => toast.error(extractError(err, 'Could not create session')),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<SessionFormValues> }) =>
      updateSession(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success('Session updated!');
    },
    onError: (err) => toast.error(extractError(err, 'Could not update session')),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteSession(id),
    onSuccess: () => {
      invalidate();
      toast.success('Session deleted.');
    },
    onError: (err) => toast.error(extractError(err, 'Could not delete session')),
  });

  const publish = useMutation({
    mutationFn: (id: number) => publishSession(id),
    onSuccess: () => {
      invalidate();
      toast.success('Session published!');
    },
    onError: (err) => toast.error(extractError(err, 'Could not publish session')),
  });

  const cancel = useMutation({
    mutationFn: (id: number) => cancelSession(id),
    onSuccess: () => {
      invalidate();
      toast.info('Session cancelled.');
    },
    onError: (err) => toast.error(extractError(err, 'Could not cancel session')),
  });

  return { create, update, remove, publish, cancel };
}
