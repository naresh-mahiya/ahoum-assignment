"""Test settings — in-memory SQLite so the suite runs without Postgres."""
from .base import *  # noqa: F401,F403

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable throttling in tests so rapid requests don't hit rate limits.
REST_FRAMEWORK = {**REST_FRAMEWORK}  # noqa: F405
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {}

RATELIMIT_ENABLE = False

PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
