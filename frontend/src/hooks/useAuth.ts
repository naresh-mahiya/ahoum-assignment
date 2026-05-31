import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  becomeCreator as apiBecomeCreator,
  getMe,
  logout as apiLogout,
  updateMe,
  uploadAvatar,
} from '@/api/auth';
import { extractError } from '@/api/client';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse, User } from '@/types';

export function useAuth() {
  const store = useAuthStore();
  const queryClient = useQueryClient();

  /** Persist an auth response and refresh the cached profile. */
  const applyAuth = (data: AuthResponse) => {
    store.setAuth(data.access, data.refresh, data.user);
  };

  const refreshProfile = async () => {
    try {
      const user = await getMe();
      store.setUser(user);
      return user;
    } catch {
      return null;
    }
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (store.refreshToken) {
        try {
          await apiLogout(store.refreshToken);
        } catch {
          /* token may already be invalid — ignore */
        }
      }
    },
    onSettled: () => {
      store.logout();
      queryClient.clear();
      toast.info('Signed out.');
    },
  });

  const updateProfile = useMutation({
    mutationFn: (payload: Partial<User>) => updateMe(payload),
    onSuccess: (user) => {
      store.setUser(user);
      toast.success('Profile updated!');
    },
    onError: (err) => toast.error(extractError(err, 'Could not update profile')),
  });

  const avatarUpload = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: async () => {
      await refreshProfile();
      toast.success('Avatar updated!');
    },
    onError: (err) => toast.error(extractError(err, 'Avatar upload failed')),
  });

  const becomeCreator = useMutation({
    mutationFn: () => apiBecomeCreator(),
    onSuccess: (data) => {
      applyAuth(data);
      toast.success('🎉 Welcome, Creator!');
    },
    onError: (err) => toast.error(extractError(err, 'Could not upgrade role')),
  });

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    hydrated: store.hydrated,
    applyAuth,
    refreshProfile,
    logout: logoutMutation.mutate,
    updateProfile,
    avatarUpload,
    becomeCreator,
  };
}
