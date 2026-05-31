import { Github, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { devLogin } from '@/api/auth';
import { extractError } from '@/api/client';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  buildGithubAuthUrl,
  buildGoogleAuthUrl,
  isProviderConfigured,
} from '@/lib/oauth';
import { toast } from '@/lib/toast';

interface LocationState {
  returnUrl?: string;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 16 3 9.1 7.6 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.9 26.7 37 24 37c-5.3 0-9.7-3.6-11.3-8.4l-6.5 5C9.5 40.3 16.2 45 24 45z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 36 45 30.6 45 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { applyAuth, isAuthenticated } = useAuth();
  const returnUrl = (location.state as LocationState)?.returnUrl || '/dashboard';

  const [devEmail, setDevEmail] = useState('user@demo.com');
  const [devCreator, setDevCreator] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  const googleReady = isProviderConfigured('google');
  const githubReady = isProviderConfigured('github');

  if (isAuthenticated) {
    navigate(returnUrl, { replace: true });
  }

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevLoading(true);
    try {
      const data = await devLogin(devEmail.trim(), devCreator);
      applyAuth(data);
      toast.success(`Welcome, ${data.user.first_name || data.user.email}!`);
      navigate(returnUrl, { replace: true });
    } catch (err) {
      toast.error(extractError(err, 'Login failed'));
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-md place-items-center px-4">
      <div className="w-full">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 animate-fade-in place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-sky-500 text-white shadow-lg">
            <Sparkles size={30} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome to Ahoum</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to book and host transformative sessions.
          </p>
          {(location.state as LocationState)?.returnUrl && (
            <p className="mt-2 text-xs text-brand-600">
              You’ll be returned to your previous page after signing in.
            </p>
          )}
        </div>

        <div className="card space-y-3 p-6">
          <button
            onClick={() => (window.location.href = buildGoogleAuthUrl())}
            disabled={!googleReady}
            className="btn-secondary w-full"
            title={googleReady ? '' : 'Set VITE_GOOGLE_CLIENT_ID to enable'}
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            onClick={() => (window.location.href = buildGithubAuthUrl())}
            disabled={!githubReady}
            className="btn w-full bg-slate-900 text-white hover:bg-slate-800"
            title={githubReady ? '' : 'Set VITE_GITHUB_CLIENT_ID to enable'}
          >
            <Github size={18} />
            Continue with GitHub
          </button>

          {(!googleReady || !githubReady) && (
            <p className="pt-1 text-center text-xs text-slate-400">
              OAuth buttons activate once provider credentials are set in{' '}
              <code>.env</code>.
            </p>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs uppercase tracking-wide text-slate-400">
                or try the demo
              </span>
            </div>
          </div>

          {/* Dev / demo login — works when the backend runs with DEBUG=True */}
          <form onSubmit={handleDevLogin} className="space-y-3">
            <div>
              <label className="label" htmlFor="dev-email">
                Demo email
              </label>
              <input
                id="dev-email"
                type="email"
                className="input"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder="you@demo.com"
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={devCreator}
                onChange={(e) => setDevCreator(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              Sign in as a Creator
            </label>
            <Button type="submit" fullWidth loading={devLoading}>
              Enter Demo
            </Button>
          </form>
          <p className="text-center text-xs text-slate-400">
            Seeded demos: user@demo.com · creator@demo.com · guru@demo.com
          </p>
        </div>
      </div>
    </div>
  );
}
