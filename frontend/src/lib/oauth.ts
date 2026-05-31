import type { Provider } from '@/api/auth';

const REDIRECT_URI =
  import.meta.env.VITE_OAUTH_REDIRECT_URI ||
  `${window.location.origin}/auth/callback`;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';

export const oauthRedirectUri = REDIRECT_URI;

export function isProviderConfigured(provider: Provider): boolean {
  const id = provider === 'google' ? GOOGLE_CLIENT_ID : GITHUB_CLIENT_ID;
  return Boolean(id) && !id.startsWith('your-');
}

export function buildGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state: 'google',
    prompt: 'select_account',
    access_type: 'offline',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function buildGithubAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'read:user user:email',
    state: 'github',
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}
