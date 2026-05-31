"""
OAuth authorization-code exchange for Google and GitHub.

The frontend performs the browser redirect to the provider, receives a
`code`, and POSTs it here. We exchange that code for a provider access
token, fetch the user's profile, and map it to a local User.
"""
import requests
from django.conf import settings

GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
GITHUB_USER_URL = 'https://api.github.com/user'
GITHUB_EMAILS_URL = 'https://api.github.com/user/emails'

TIMEOUT = 15


class OAuthError(Exception):
    """Raised when a provider exchange fails."""


def _normalize_profile(provider, uid, email, first_name, last_name, avatar):
    return {
        'provider': provider,
        'uid': str(uid),
        'email': (email or '').lower().strip(),
        'first_name': first_name or '',
        'last_name': last_name or '',
        'avatar': avatar or '',
    }


def exchange_google(code, redirect_uri):
    resp = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        },
        timeout=TIMEOUT,
    )
    if resp.status_code != 200:
        raise OAuthError(f'Google token exchange failed: {resp.text}')
    access_token = resp.json().get('access_token')
    if not access_token:
        raise OAuthError('Google did not return an access token')

    info = requests.get(
        GOOGLE_USERINFO_URL,
        headers={'Authorization': f'Bearer {access_token}'},
        timeout=TIMEOUT,
    )
    if info.status_code != 200:
        raise OAuthError(f'Google userinfo failed: {info.text}')
    data = info.json()
    return _normalize_profile(
        provider='google',
        uid=data.get('sub'),
        email=data.get('email'),
        first_name=data.get('given_name'),
        last_name=data.get('family_name'),
        avatar=data.get('picture'),
    )


def exchange_github(code, redirect_uri):
    resp = requests.post(
        GITHUB_TOKEN_URL,
        headers={'Accept': 'application/json'},
        data={
            'code': code,
            'client_id': settings.GITHUB_CLIENT_ID,
            'client_secret': settings.GITHUB_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
        },
        timeout=TIMEOUT,
    )
    if resp.status_code != 200:
        raise OAuthError(f'GitHub token exchange failed: {resp.text}')
    access_token = resp.json().get('access_token')
    if not access_token:
        raise OAuthError('GitHub did not return an access token')

    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github+json',
    }
    user_resp = requests.get(GITHUB_USER_URL, headers=headers, timeout=TIMEOUT)
    if user_resp.status_code != 200:
        raise OAuthError(f'GitHub user fetch failed: {user_resp.text}')
    data = user_resp.json()

    email = data.get('email')
    if not email:
        # Primary email is often private; fetch it explicitly.
        emails_resp = requests.get(GITHUB_EMAILS_URL, headers=headers, timeout=TIMEOUT)
        if emails_resp.status_code == 200:
            emails = emails_resp.json()
            primary = next(
                (e['email'] for e in emails if e.get('primary') and e.get('verified')),
                None,
            )
            email = primary or (emails[0]['email'] if emails else None)
    if not email:
        email = f"{data.get('login')}@users.noreply.github.com"

    name = (data.get('name') or '').strip()
    first_name, _, last_name = name.partition(' ')

    return _normalize_profile(
        provider='github',
        uid=data.get('id'),
        email=email,
        first_name=first_name or data.get('login'),
        last_name=last_name,
        avatar=data.get('avatar_url'),
    )


PROVIDERS = {
    'google': exchange_google,
    'github': exchange_github,
}


def exchange_code(provider, code, redirect_uri):
    """Dispatch to the right provider exchange. Returns a normalized profile."""
    handler = PROVIDERS.get(provider)
    if not handler:
        raise OAuthError(f'Unsupported provider: {provider}')
    return handler(code, redirect_uri)
