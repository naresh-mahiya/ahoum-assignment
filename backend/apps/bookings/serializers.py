from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.sessions_app.models import Session
from apps.sessions_app.serializers import SessionSerializer

from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    session = SessionSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'session', 'user', 'status', 'payment_status',
            'stripe_payment_intent_id', 'notes', 'can_cancel',
            'booked_at', 'cancelled_at',
        ]
        read_only_fields = fields


class BookingCreateSerializer(serializers.ModelSerializer):
    session = serializers.PrimaryKeyRelatedField(queryset=Session.objects.all())

    class Meta:
        model = Booking
        fields = ['id', 'session', 'notes']

    def validate_session(self, session):
        if session.status != Session.Status.PUBLISHED:
            raise serializers.ValidationError('This session is not open for booking.')
        if session.is_fully_booked:
            raise serializers.ValidationError('This session is fully booked.')
        return session

    def validate(self, attrs):
        user = self.context['request'].user
        session = attrs['session']
        if Booking.objects.filter(
            user=user,
            session=session,
        ).exclude(status=Booking.Status.CANCELLED).exists():
            raise serializers.ValidationError(
                {'detail': 'You have already booked this session.'}
            )
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        session = validated_data['session']
        # Free sessions confirm immediately; paid ones await payment.
        if session.is_free:
            status = Booking.Status.CONFIRMED
            payment_status = Booking.PaymentStatus.PAID
        else:
            status = Booking.Status.PENDING
            payment_status = Booking.PaymentStatus.UNPAID

        # Reactivate a previously cancelled booking if one exists.
        booking, _ = Booking.objects.update_or_create(
            user=user,
            session=session,
            defaults={
                'status': status,
                'payment_status': payment_status,
                'notes': validated_data.get('notes', ''),
                'cancelled_at': None,
            },
        )
        return booking

    def to_representation(self, instance):
        return BookingSerializer(instance, context=self.context).data
