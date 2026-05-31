"""Custom python-social-auth pipeline steps."""


def save_avatar(backend, user, response, *args, **kwargs):
    """Persist the provider's avatar URL onto the user, if available."""
    avatar_url = None
    if backend.name == 'google-oauth2':
        avatar_url = response.get('picture')
    elif backend.name == 'github':
        avatar_url = response.get('avatar_url')

    if avatar_url and user.avatar != avatar_url:
        user.avatar = avatar_url
        user.save(update_fields=['avatar'])
