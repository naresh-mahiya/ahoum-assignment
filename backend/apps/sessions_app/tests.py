from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Category, Session

User = get_user_model()


@override_settings(DEBUG=True)
class SessionApiTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Yoga')
        self.creator = User.objects.create_user(
            email='c@demo.com', username='c@demo.com', role=User.Role.CREATOR
        )
        self.regular = User.objects.create_user(
            email='u@demo.com', username='u@demo.com', role=User.Role.USER
        )
        self.published = Session.objects.create(
            creator=self.creator,
            title='Morning Yoga',
            description='Flow',
            category=self.category,
            scheduled_at=timezone.now() + timedelta(days=3),
            capacity=10,
            status=Session.Status.PUBLISHED,
        )

    def _auth(self, email):
        resp = self.client.post(
            '/api/auth/dev-login/', {'email': email}, format='json'
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    def test_list_public_returns_only_published(self):
        Session.objects.create(
            creator=self.creator,
            title='Draft One',
            description='x',
            scheduled_at=timezone.now() + timedelta(days=5),
            status=Session.Status.DRAFT,
        )
        resp = self.client.get('/api/sessions/')
        self.assertEqual(resp.status_code, 200)
        titles = [s['title'] for s in resp.data['results']]
        self.assertIn('Morning Yoga', titles)
        self.assertNotIn('Draft One', titles)

    def test_regular_user_cannot_create_session(self):
        self._auth('u@demo.com')
        resp = self.client.post(
            '/api/sessions/',
            {
                'title': 'Nope',
                'description': 'x',
                'scheduled_at': (timezone.now() + timedelta(days=2)).isoformat(),
                'capacity': 5,
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 403)

    def test_creator_can_create_session(self):
        self._auth('c@demo.com')
        resp = self.client.post(
            '/api/sessions/',
            {
                'title': 'New Session',
                'description': 'desc',
                'category': self.category.id,
                'scheduled_at': (timezone.now() + timedelta(days=2)).isoformat(),
                'capacity': 8,
                'price': '0.00',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['title'], 'New Session')
        self.assertTrue(resp.data['is_free'])

    def test_search_filter(self):
        resp = self.client.get('/api/sessions/?search=morning')
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(resp.data['count'], 1)
