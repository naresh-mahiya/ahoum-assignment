"""
Base Django settings for the Ahoum Sessions Marketplace.

Settings are environment-driven via python-decouple. Development and
production settings inherit from here.
"""
from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

# ─── Paths ───────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ─── Core ────────────────────────────────────────────
SECRET_KEY = config('DJANGO_SECRET_KEY', default='insecure-dev-key')
DEBUG = config('DJANGO_DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config(
    'DJANGO_ALLOWED_HOSTS',
    default='localhost,127.0.0.1',
    cast=Csv(),
)

# Trust the Nginx reverse proxy for HTTPS detection / host header.
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ─── Applications ────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'social_django',

    # Local
    'apps.accounts',
    'apps.sessions_app',
    'apps.bookings',
    'apps.payments',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'social_django.middleware.SocialAuthExceptionMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# ─── Database ────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default='ahoum_db'),
        'USER': config('POSTGRES_USER', default='ahoum_user'),
        'PASSWORD': config('POSTGRES_PASSWORD', default='ahoum_password'),
        'HOST': config('POSTGRES_HOST', default='db'),
        'PORT': config('POSTGRES_PORT', default='5432'),
    }
}

# ─── Auth ────────────────────────────────────────────
AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTHENTICATION_BACKENDS = (
    'social_core.backends.google.GoogleOAuth2',
    'social_core.backends.github.GithubOAuth2',
    'django.contrib.auth.backends.ModelBackend',
)

# ─── DRF ─────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '120/min',
    },
}

# ─── JWT ─────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=30, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ─── CORS ────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost,http://localhost:5173',
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# ─── OAuth (python-social-auth) ──────────────────────
SOCIAL_AUTH_JSONFIELD_ENABLED = True
SOCIAL_AUTH_USER_MODEL = AUTH_USER_MODEL

SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.social_user',
    'social_core.pipeline.user.get_username',
    'social_core.pipeline.user.create_user',
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
    'apps.accounts.pipeline.save_avatar',
)

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = config('GOOGLE_CLIENT_ID', default='')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = config('GOOGLE_CLIENT_SECRET', default='')
SOCIAL_AUTH_GITHUB_KEY = config('GITHUB_CLIENT_ID', default='')
SOCIAL_AUTH_GITHUB_SECRET = config('GITHUB_CLIENT_SECRET', default='')
SOCIAL_AUTH_REDIRECT_IS_HTTPS = False

# Convenience aliases used directly by the OAuth-exchange view.
GOOGLE_CLIENT_ID = SOCIAL_AUTH_GOOGLE_OAUTH2_KEY
GOOGLE_CLIENT_SECRET = SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET
GITHUB_CLIENT_ID = SOCIAL_AUTH_GITHUB_KEY
GITHUB_CLIENT_SECRET = SOCIAL_AUTH_GITHUB_SECRET
OAUTH_REDIRECT_URI = config('OAUTH_REDIRECT_URI', default='http://localhost/auth/callback')

# ─── Static & Media ──────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ─── MinIO / S3 (bonus) ──────────────────────────────
MINIO_ENDPOINT = config('MINIO_ENDPOINT', default='http://minio:9000')
MINIO_PUBLIC_ENDPOINT = config('MINIO_PUBLIC_ENDPOINT', default='http://localhost:9000')
MINIO_BUCKET_NAME = config('MINIO_BUCKET_NAME', default='ahoum-sessions')
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='minioadmin')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='minioadmin123')

# ─── Stripe (bonus) ──────────────────────────────────
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# ─── Superuser auto-seed ─────────────────────────────
DJANGO_SUPERUSER_EMAIL = config('DJANGO_SUPERUSER_EMAIL', default='admin@ahoum.com')
DJANGO_SUPERUSER_USERNAME = config('DJANGO_SUPERUSER_USERNAME', default='admin')
DJANGO_SUPERUSER_PASSWORD = config('DJANGO_SUPERUSER_PASSWORD', default='adminpassword123')

# ─── Misc ────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Booking business rule: minimum hours before a session that a booking
# may still be cancelled.
BOOKING_CANCELLATION_WINDOW_HOURS = config(
    'BOOKING_CANCELLATION_WINDOW_HOURS', default=1, cast=int
)
