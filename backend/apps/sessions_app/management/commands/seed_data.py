from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.bookings.models import Booking
from apps.sessions_app.models import Category, Session

User = get_user_model()

CATEGORIES = [
    'Yoga',
    'Meditation',
    'Breathwork',
    'Sound Healing',
    'Energy Work',
    'Mindfulness',
]

# Cover images via Unsplash source URLs (stable, royalty-free).
COVERS = {
    'Yoga': 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800',
    'Meditation': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    'Breathwork': 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800',
    'Sound Healing': 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800',
    'Energy Work': 'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=800',
    'Mindfulness': 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?w=800',
}


class Command(BaseCommand):
    help = 'Seed demo categories, users, sessions and bookings.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--if-empty',
            action='store_true',
            help='Only seed if there are no sessions yet.',
        )

    def handle(self, *args, **options):
        if options['if_empty'] and Session.objects.exists():
            self.stdout.write('Sessions already exist; skipping seed.')
            return

        self.stdout.write('Seeding demo data...')

        # ─── Categories ───
        categories = {}
        for name in CATEGORIES:
            cat, _ = Category.objects.get_or_create(name=name)
            categories[name] = cat

        # ─── Users ───
        creator, _ = User.objects.get_or_create(
            email='creator@demo.com',
            defaults={
                'username': 'creator@demo.com',
                'first_name': 'Maya',
                'last_name': 'Rivera',
                'role': User.Role.CREATOR,
                'bio': 'Certified yoga & meditation guide with 8 years of practice.',
                'avatar': 'https://i.pravatar.cc/150?img=47',
            },
        )
        creator.set_password('demopass123')
        creator.save()

        creator2, _ = User.objects.get_or_create(
            email='guru@demo.com',
            defaults={
                'username': 'guru@demo.com',
                'first_name': 'Arjun',
                'last_name': 'Patel',
                'role': User.Role.CREATOR,
                'bio': 'Sound healer and breathwork facilitator.',
                'avatar': 'https://i.pravatar.cc/150?img=12',
            },
        )
        creator2.set_password('demopass123')
        creator2.save()

        user, _ = User.objects.get_or_create(
            email='user@demo.com',
            defaults={
                'username': 'user@demo.com',
                'first_name': 'Sam',
                'last_name': 'Taylor',
                'role': User.Role.USER,
                'avatar': 'https://i.pravatar.cc/150?img=5',
            },
        )
        user.set_password('demopass123')
        user.save()

        now = timezone.now()

        sessions_spec = [
            {
                'creator': creator,
                'title': 'Sunrise Vinyasa Flow',
                'category': 'Yoga',
                'description': 'Start your day with an energising vinyasa flow suitable '
                'for all levels. Move with breath and greet the sun.',
                'price': Decimal('0.00'),
                'capacity': 20,
                'days': 2,
                'duration': 60,
                'tags': 'yoga,morning,beginner,vinyasa',
                'status': Session.Status.PUBLISHED,
            },
            {
                'creator': creator,
                'title': 'Deep Stillness Meditation',
                'category': 'Meditation',
                'description': 'A guided meditation journey into deep stillness and '
                'inner calm. Learn techniques you can use daily.',
                'price': Decimal('0.00'),
                'capacity': 30,
                'days': 4,
                'duration': 45,
                'tags': 'meditation,calm,guided',
                'status': Session.Status.PUBLISHED,
            },
            {
                'creator': creator2,
                'title': 'Transformational Breathwork',
                'category': 'Breathwork',
                'description': 'A powerful breathwork session to release tension and '
                'access expanded states of awareness.',
                'price': Decimal('25.00'),
                'capacity': 15,
                'days': 6,
                'duration': 90,
                'tags': 'breathwork,release,energy',
                'status': Session.Status.PUBLISHED,
            },
            {
                'creator': creator2,
                'title': 'Crystal Bowl Sound Bath',
                'category': 'Sound Healing',
                'description': 'Immerse yourself in the healing vibrations of crystal '
                'singing bowls. Bring a mat and blanket.',
                'price': Decimal('18.50'),
                'capacity': 25,
                'days': 8,
                'duration': 75,
                'tags': 'sound,healing,relax',
                'status': Session.Status.PUBLISHED,
            },
            {
                'creator': creator,
                'title': 'Reiki Energy Healing Circle',
                'category': 'Energy Work',
                'description': 'A group reiki circle to balance your energy centres and '
                'restore harmony.',
                'price': Decimal('30.00'),
                'capacity': 10,
                'days': 10,
                'duration': 60,
                'tags': 'reiki,energy,chakra',
                'status': Session.Status.PUBLISHED,
            },
            {
                'creator': creator,
                'title': 'Mindful Monday Reset',
                'category': 'Mindfulness',
                'description': 'A short mindfulness practice to reset your week with '
                'intention and clarity.',
                'price': Decimal('0.00'),
                'capacity': 40,
                'days': 1,
                'duration': 30,
                'tags': 'mindfulness,reset,weekly',
                'status': Session.Status.PUBLISHED,
            },
            {
                'creator': creator,
                'title': 'Restorative Yin (Draft)',
                'category': 'Yoga',
                'description': 'A slow, deep restorative yin practice. Still a draft '
                'while finalising the playlist.',
                'price': Decimal('0.00'),
                'capacity': 20,
                'days': 12,
                'duration': 75,
                'tags': 'yin,restorative,slow',
                'status': Session.Status.DRAFT,
            },
        ]

        created_sessions = []
        for spec in sessions_spec:
            session = Session.objects.create(
                creator=spec['creator'],
                title=spec['title'],
                description=spec['description'],
                category=categories[spec['category']],
                cover_image=COVERS[spec['category']],
                price=spec['price'],
                capacity=spec['capacity'],
                scheduled_at=now + timedelta(days=spec['days']),
                duration_minutes=spec['duration'],
                status=spec['status'],
                tags=spec['tags'],
            )
            created_sessions.append(session)

        # ─── Sample bookings for the demo user (free sessions confirmed) ───
        free_published = [
            s
            for s in created_sessions
            if s.is_free and s.status == Session.Status.PUBLISHED
        ]
        for session in free_published[:2]:
            Booking.objects.get_or_create(
                user=user,
                session=session,
                defaults={
                    'status': Booking.Status.CONFIRMED,
                    'payment_status': Booking.PaymentStatus.PAID,
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded {len(categories)} categories, 3 users, '
                f'{len(created_sessions)} sessions.'
            )
        )
        self.stdout.write(
            'Demo logins (dev-login or admin): '
            'creator@demo.com / guru@demo.com / user@demo.com (password: demopass123)'
        )
