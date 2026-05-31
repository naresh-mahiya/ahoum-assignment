"""Development settings."""
from .base import *  # noqa: F401,F403

DEBUG = True

# Allow all hosts in dev for convenience.
ALLOWED_HOSTS = ['*']

# Permissive CORS in dev.
CORS_ALLOW_ALL_ORIGINS = True

# Print emails to the console rather than sending them.
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
