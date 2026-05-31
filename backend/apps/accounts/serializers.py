from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    is_creator = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'avatar', 'bio', 'is_creator', 'date_joined',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_creator', 'date_joined']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'bio', 'avatar']


class OAuthExchangeSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=['google', 'github'])
    code = serializers.CharField()
    redirect_uri = serializers.CharField(required=False, allow_blank=True)
