import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: Role;
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, hydrated, user, becomeCreator } = useAuth();
  const location = useLocation();

  // Wait for the persisted store to rehydrate before deciding.
  if (!hydrated) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Sparkles className="animate-pulse text-brand-400" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnUrl: location.pathname + location.search }}
      />
    );
  }

  // Wrong role: instead of a hard 403, offer the upgrade where it makes sense.
  if (role === 'creator' && user && !user.is_creator) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
        <div className="card w-full p-8">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-600">
            <Sparkles size={26} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Become a Creator</h2>
          <p className="mt-2 text-sm text-slate-500">
            This area is for creators. Upgrade your account to start hosting and
            managing your own sessions.
          </p>
          <Button
            className="mt-6"
            fullWidth
            loading={becomeCreator.isPending}
            onClick={() => becomeCreator.mutate()}
          >
            Upgrade to Creator
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
