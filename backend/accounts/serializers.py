from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers

from organizations.models import Organization
from accounts.models import UserProfile


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )
    organization_name = serializers.CharField(max_length=255)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "This email is already registered."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data["email"].strip()
        password = validated_data["password"]
        organization_name = validated_data["organization_name"].strip()

        if User.objects.filter(username=email).exists():
            raise serializers.ValidationError({
                "email": "This email is already registered."
            })

        organization = Organization.objects.create(
            name=organization_name
        )

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
        )

        UserProfile.objects.create(
            user=user,
            organization=organization,
        )

        return {
            "username": user.username,
            "email": user.email,
            "organization_name": organization.name,
        }

    def to_representation(self, instance):
        return instance