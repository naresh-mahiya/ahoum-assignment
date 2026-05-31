from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        CANCELLED = 'cancelled', 'Cancelled'
        COMPLETED = 'completed', 'Completed'

    class PaymentStatus(models.TextChoices):
        UNPAID = 'unpaid', 'Unpaid'
        PAID = 'paid', 'Paid'
        REFUNDED = 'refunded', 'Refunded'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    session = models.ForeignKey(
        'sessions_app.Session',
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
    )
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    booked_at = models.DateTimeField(auto_now_add=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [('user', 'session')]
        ordering = ['-booked_at']

    @property
    def can_cancel(self):
        """Cancellable only if confirmed/pending and outside the cutoff window."""
        if self.status not in (self.Status.CONFIRMED, self.Status.PENDING):
            return False
        window = timedelta(hours=settings.BOOKING_CANCELLATION_WINDOW_HOURS)
        return self.session.scheduled_at - timezone.now() > window

    def __str__(self):
        return f'{self.user.email} → {self.session.title} ({self.status})'
