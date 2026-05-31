from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Idempotently create a superuser from environment variables.'

    def handle(self, *args, **options):
        User = get_user_model()
        email = settings.DJANGO_SUPERUSER_EMAIL
        username = settings.DJANGO_SUPERUSER_USERNAME
        password = settings.DJANGO_SUPERUSER_PASSWORD

        if not email or not password:
            self.stdout.write(
                self.style.WARNING('Superuser env vars not set; skipping.')
            )
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(f'Superuser {email} already exists; skipping.')
            return

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            role=User.Role.CREATOR,
        )
        self.stdout.write(self.style.SUCCESS(f'Created superuser {email}'))
