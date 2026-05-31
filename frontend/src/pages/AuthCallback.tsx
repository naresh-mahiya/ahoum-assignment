import { AlertCircle, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { type Provider, exchangeOAuthCode } from '@/api/auth';
import { extractError } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { oauthRedirectUri } from '@/lib/oauth';
import { toast } from '@/lib/toast';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { applyAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against React 18 StrictMode double-run
    ran.current = true;

    const code = params.get('code');
    const state = (params.get('state') as Provider) || 'google';
    const oauthError = params.get('error');

    if (oauthError) {
      setError(`Provider returned an error: ${oauthError}`);
      return;
    }
    if (!code) {
      setError('No authorization code was returned by the provider.');
      return;
    }

    (async () => {
      try {
        const data = await exchangeOAuthCode(state, code, oauthRedirectUri);
        applyAuth(data);
        toast.success(`Welcome, ${data.user.first_name || data.user.email}!`);
        const target = data.user.is_creator ? '/creator' : '/dashboard';
        navigate(target, { replace: true });
      } catch (err) {
        setError(extractError(err, 'Sign-in failed. Please try again.'));
      }
    })();
  }, [params, applyAuth, navigate]);

  if (error) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 text-center">
        <div className="card w-full p-8">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-600">
            <AlertCircle size={26} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Sign-in failed</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <Link to="/login" className="btn-primary mt-6 inline-flex">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Sparkles className="animate-pulse text-brand-500" size={36} />
        <p className="text-sm font-medium text-slate-600">
          Completing sign-in…
        </p>
      </div>
    </div>
  );
}
