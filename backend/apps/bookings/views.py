from django.utils import timezone
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.sessions_app.models import Session

from .models import Booking
from .serializers import BookingCreateSerializer, BookingSerializer

BASE_QS = Booking.objects.select_related(
    'session', 'session__creator', 'session__category', 'user'
)


@method_decorator(
    ratelimit(key='user', rate='10/m', method='POST', block=True), name='post'
)
class BookingCreateView(generics.CreateAPIView):
    """Book a session (authenticated users only)."""

    serializer_class = BookingCreateSerializer
    permission_classes = [IsAuthenticated]


class MyBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return BASE_QS.filter(user=self.request.user)


class BookingCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            booking = BASE_QS.get(pk=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {'detail': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND
            )
        if not booking.can_cancel:
            return Response(
                {
                    'detail': 'This booking can no longer be cancelled '
                    '(too close to the session start or already finalized).'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = Booking.Status.CANCELLED
        booking.cancelled_at = timezone.now()
        booking.save(update_fields=['status', 'cancelled_at'])
        return Response(BookingSerializer(booking, context={'request': request}).data)


class SessionBookingsView(generics.ListAPIView):
    """List bookings for a session — creator of that session only."""

    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        session_id = self.kwargs['session_id']
        session = Session.objects.filter(pk=session_id).first()
        if not session or session.creator_id != self.request.user.id:
            return Booking.objects.none()
        return BASE_QS.filter(session_id=session_id).exclude(
            status=Booking.Status.CANCELLED
        )
