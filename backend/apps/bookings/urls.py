from django.urls import path

from .views import (
    BookingCancelView,
    BookingCreateView,
    MyBookingsView,
    SessionBookingsView,
)

urlpatterns = [
    path('', BookingCreateView.as_view(), name='booking-create'),
    path('my/', MyBookingsView.as_view(), name='booking-my'),
    path('<int:pk>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path(
        'session/<int:session_id>/',
        SessionBookingsView.as_view(),
        name='booking-by-session',
    ),
]
