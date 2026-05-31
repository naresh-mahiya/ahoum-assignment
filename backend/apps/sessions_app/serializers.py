from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Category, Session


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class SessionSerializer(serializers.ModelSerializer):
    """Read serializer: nested creator + category, computed availability."""

    creator = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    available_spots = serializers.IntegerField(read_only=True)
    is_fully_booked = serializers.BooleanField(read_only=True)
    confirmed_bookings_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Session
        fields = [
            'id', 'creator', 'title', 'description', 'category',
            'cover_image', 'price', 'is_free', 'capacity', 'available_spots',
            'is_fully_booked', 'confirmed_bookings_count', 'scheduled_at',
            'duration_minutes', 'status', 'tags', 'created_at', 'updated_at',
        ]


class SessionWriteSerializer(serializers.ModelSerializer):
    """Write serializer: accepts a category id, sets creator from request."""

    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Session
        fields = [
            'id', 'title', 'description', 'category', 'cover_image',
            'price', 'capacity', 'scheduled_at', 'duration_minutes',
            'status', 'tags',
        ]

    def validate_capacity(self, value):
        if value < 1:
            raise serializers.ValidationError('Capacity must be at least 1.')
        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Price cannot be negative.')
        return value

    def create(self, validated_data):
        validated_data['creator'] = self.context['request'].user
        return super().create(validated_data)

    def to_representation(self, instance):
        # Return the full nested representation after a write.
        return SessionSerializer(instance, context=self.context).data
