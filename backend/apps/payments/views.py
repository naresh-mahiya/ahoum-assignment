import stripe
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking

from .models import Payment


def _stripe_configured():
    return bool(settings.STRIPE_SECRET_KEY) and settings.STRIPE_SECRET_KEY.startswith(
        'sk_'
    ) and 'your_stripe' not in settings.STRIPE_SECRET_KEY


class CreatePaymentIntentView(APIView):
    """Create a Stripe PaymentIntent for a pending booking."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        try:
            booking = Booking.objects.select_related('session').get(
                pk=booking_id, user=request.user
            )
        except Booking.DoesNotExist:
            return Response(
                {'detail': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND
            )

        if booking.session.is_free:
            return Response(
                {'detail': 'This session is free; no payment required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not _stripe_configured():
            return Response(
                {
                    'detail': 'Stripe is not configured. Set STRIPE_SECRET_KEY '
                    'to enable payments.'
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        stripe.api_key = settings.STRIPE_SECRET_KEY
        amount_cents = int(float(booking.session.price) * 100)
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='usd',
            metadata={'booking_id': str(booking.id), 'user_id': str(request.user.id)},
            automatic_payment_methods={'enabled': True},
        )
        booking.stripe_payment_intent_id = intent['id']
        booking.save(update_fields=['stripe_payment_intent_id'])
        Payment.objects.update_or_create(
            stripe_payment_intent_id=intent['id'],
            defaults={
                'booking': booking,
                'amount': booking.session.price,
                'currency': 'usd',
                'status': Payment.Status.CREATED,
            },
        )
        return Response(
            {'client_secret': intent['client_secret'], 'payment_intent_id': intent['id']}
        )


class PaymentStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(pk=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {'detail': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(
            {
                'booking_id': booking.id,
                'status': booking.status,
                'payment_status': booking.payment_status,
            }
        )


class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET

        try:
            if webhook_secret and 'your_webhook' not in webhook_secret:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, webhook_secret
                )
            else:
                # No verification secret configured (dev): parse raw JSON.
                import json

                event = json.loads(payload)
        except Exception as exc:  # noqa: BLE001
            return Response(
                {'detail': f'Webhook error: {exc}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event_type = event.get('type')
        if event_type == 'payment_intent.succeeded':
            intent = event['data']['object']
            booking_id = intent.get('metadata', {}).get('booking_id')
            if booking_id:
                Booking.objects.filter(id=booking_id).update(
                    status=Booking.Status.CONFIRMED,
                    payment_status=Booking.PaymentStatus.PAID,
                    stripe_payment_intent_id=intent['id'],
                )
                Payment.objects.filter(
                    stripe_payment_intent_id=intent['id']
                ).update(status=Payment.Status.SUCCEEDED)

        return Response({'received': True})
