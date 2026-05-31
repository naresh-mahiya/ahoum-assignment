from django.urls import path

from .views import (
    CreatePaymentIntentView,
    PaymentStatusView,
    StripeWebhookView,
)

urlpatterns = [
    path('create-intent/', CreatePaymentIntentView.as_view(), name='create-intent'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path(
        'session/<int:booking_id>/status/',
        PaymentStatusView.as_view(),
        name='payment-status',
    ),
]
