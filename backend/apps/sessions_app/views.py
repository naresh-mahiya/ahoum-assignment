import uuid

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.minio_client import upload_fileobj

from .filters import SessionFilter
from .models import Category, Session
from .permissions import IsCreatorOrReadOnly, IsOwnerOrReadOnly
from .serializers import (
    CategorySerializer,
    SessionSerializer,
    SessionWriteSerializer,
)

BASE_QS = Session.objects.select_related('creator', 'category').prefetch_related(
    'bookings'
)


class SessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsCreatorOrReadOnly, IsOwnerOrReadOnly]
    filterset_class = SessionFilter
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['scheduled_at', 'price', 'created_at']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return SessionWriteSerializer
        return SessionSerializer

    def get_queryset(self):
        # `my` lists the creator's own sessions in every status.
        if self.action == 'my':
            return BASE_QS.filter(creator=self.request.user)
        # Detail view: owner can see their own drafts; everyone else only
        # sees published/active sessions.
        if self.action in ('retrieve', 'update', 'partial_update', 'destroy'):
            return BASE_QS
        # Public list: published sessions only.
        return BASE_QS.filter(status=Session.Status.PUBLISHED)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = SessionSerializer(
            page if page is not None else queryset,
            many=True,
            context={'request': request},
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        session = self.get_object()
        if session.creator_id != request.user.id:
            return Response(
                {'detail': 'You can only publish your own sessions.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        session.status = Session.Status.PUBLISHED
        session.save(update_fields=['status', 'updated_at'])
        return Response(SessionSerializer(session, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        session = self.get_object()
        if session.creator_id != request.user.id:
            return Response(
                {'detail': 'You can only cancel your own sessions.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        session.status = Session.Status.CANCELLED
        session.save(update_fields=['status', 'updated_at'])
        return Response(SessionSerializer(session, context={'request': request}).data)

    @action(detail=False, methods=['get'], permission_classes=[])
    def categories(self, request):
        serializer = CategorySerializer(Category.objects.all(), many=True)
        return Response(serializer.data)


class CoverImageUploadView(APIView):
    """Upload a session cover image to MinIO and return its public URL.

    Unlike the avatar endpoint this does not mutate the user; it just
    returns the URL for the client to attach to a session.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('image') or request.FILES.get('file')
        if not file:
            return Response(
                {'detail': 'No file provided (field name: image)'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ext = (file.name.rsplit('.', 1)[-1] if '.' in file.name else 'png').lower()
        key = f'covers/{request.user.id}-{uuid.uuid4().hex}.{ext}'
        try:
            url = upload_fileobj(file, key, content_type=file.content_type)
        except Exception as exc:  # noqa: BLE001
            return Response(
                {'detail': f'Upload failed: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({'url': url}, status=status.HTTP_200_OK)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = []
    pagination_class = None
