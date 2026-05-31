from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models


class CustomUserManager(UserManager):
    """User manager that uses email as the unique identifier."""

    def create_user(self, username=None, email=None, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        if not username:
            username = email
        return super().create_user(
            username=username, email=email, password=password, **extra_fields
        )

    def create_superuser(self, username=None, email=None, password=None, **extra_fields):
        if not username:
            username = email
        return super().create_superuser(
            username=username, email=email, password=password, **extra_fields
        )


class User(AbstractUser):
    class Role(models.TextChoices):
        USER = 'user', 'User'
        CREATOR = 'creator', 'Creator'

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    avatar = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = CustomUserManager()

    @property
    def is_creator(self):
        return self.role == self.Role.CREATOR

    def __str__(self):
        return self.email
