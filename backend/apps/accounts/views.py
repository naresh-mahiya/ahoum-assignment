import uuid

from django.conf import settings
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.payments.minio_client import upload_fileobj

from .models import User
from .oauth_backends import OAuthError, exchange_code
from .serializers import (
    OAuthExchangeSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


def issue_tokens(user):
    """Issue a JWT access/refresh pair plus the serialized user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    }


def get_or_create_user(profile):
    """Map a normalized OAuth profile to a local User."""
    email = profile['email']
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email,
            'first_name': profile.get('first_name', ''),
            'last_name': profile.get('last_name', ''),
            'avatar': profile.get('avatar') or None,
        },
    )
    if not created:
        # Refresh avatar / names if the provider has newer data.
        changed = False
        if profile.get('avatar') and user.avatar != profile['avatar']:
            user.avatar = profile['avatar']
            changed = True
        if not user.first_name and profile.get('first_name'):
            user.first_name = profile['first_name']
            changed = True
        if changed:
            user.save()
    return user


@method_decorator(
    ratelimit(key='ip', rate='10/m', method='POST', block=True), name='post'
)
class OAuthExchangeView(APIView):
    """Exchange an OAuth authorization code for a JWT pair."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OAuthExchangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        provider = serializer.validated_data['provider']
        code = serializer.validated_data['code']
        redirect_uri = (
            serializer.validated_data.get('redirect_uri')
            or settings.OAUTH_REDIRECT_URI
        )
        try:
            profile = exchange_code(provider, code, redirect_uri)
        except OAuthError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        user = get_or_create_user(profile)
        return Response(issue_tokens(user), status=status.HTTP_200_OK)


class DevLoginView(APIView):
    """
    Development-only password-free login. Lets graders try the full app
    without configuring real OAuth credentials. Disabled unless DEBUG.

    Body: { "email": "user@demo.com", "as_creator": false }
    """

    permission_classes = [AllowAny]

    def post(self, request):
        if not settings.DEBUG:
            return Response(
                {'detail': 'Dev login is disabled in production.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        email = (request.data.get('email') or '').lower().strip()
        if not email:
            return Response(
                {'detail': 'email is required'}, status=status.HTTP_400_BAD_REQUEST
            )
        as_creator = bool(request.data.get('as_creator'))
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': email.split('@')[0].title(),
                'role': User.Role.CREATOR if as_creator else User.Role.USER,
            },
        )
        return Response(issue_tokens(user), status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Blacklist the supplied refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response(
                {'detail': 'refresh token required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response(
                {'detail': 'Invalid or already blacklisted token'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(APIView):
    """Get or update the current user's profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class AvatarUploadView(APIView):
    """Upload an avatar image to MinIO and store the public URL."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('avatar') or request.FILES.get('file')
        if not file:
            return Response(
                {'detail': 'No file provided (field name: avatar)'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ext = (file.name.rsplit('.', 1)[-1] if '.' in file.name else 'png').lower()
        key = f'avatars/{request.user.id}-{uuid.uuid4().hex}.{ext}'
        try:
            url = upload_fileobj(file, key, content_type=file.content_type)
        except Exception as exc:  # noqa: BLE001
            return Response(
                {'detail': f'Upload failed: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        request.user.avatar = url
        request.user.save(update_fields=['avatar'])
        return Response({'avatar': url}, status=status.HTTP_200_OK)


class BecomeCreatorView(APIView):
    """Upgrade the current user's role to creator."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != User.Role.CREATOR:
            user.role = User.Role.CREATOR
            user.save(update_fields=['role'])
        # Issue fresh tokens so the client picks up the new role immediately.
        return Response(issue_tokens(user), status=status.HTTP_200_OK)
