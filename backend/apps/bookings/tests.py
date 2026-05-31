from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.sessions_app.models import Session

from .models import Booking

User = get_user_model()


@override_settings(DEBUG=True)
class BookingApiTests(APITestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            email='c@demo.com', username='c@demo.com', role=User.Role.CREATOR
        )
        self.session = Session.objects.create(
            creator=self.creator,
            title='Free Session',
            description='x',
            scheduled_at=timezone.now() + timedelta(days=3),
            capacity=2,
            price=0,
            status=Session.Status.PUBLISHED,
        )

    def _auth(self, email):
        resp = self.client.post(
            '/api/auth/dev-login/', {'email': email}, format='json'
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    def test_book_free_session_confirms_immediately(self):
        self._auth('booker@demo.com')
        resp = self.client.post(
            '/api/bookings/', {'session': self.session.id}, format='json'
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['status'], 'confirmed')

    def test_duplicate_booking_rejected(self):
        self._auth('booker@demo.com')
        self.client.post('/api/bookings/', {'session': self.session.id}, format='json')
        resp = self.client.post(
            '/api/bookings/', {'session': self.session.id}, format='json'
        )
        self.assertEqual(resp.status_code, 400)

    def test_booking_requires_auth(self):
        resp = self.client.post(
            '/api/bookings/', {'session': self.session.id}, format='json'
        )
        self.assertEqual(resp.status_code, 401)

    def test_fully_booked_session_rejects(self):
        # Fill capacity (2) with confirmed bookings.
        for i in range(2):
            u = User.objects.create_user(
                email=f'f{i}@demo.com', username=f'f{i}@demo.com'
            )
            Booking.objects.create(
                user=u, session=self.session, status=Booking.Status.CONFIRMED
            )
        self._auth('late@demo.com')
        resp = self.client.post(
            '/api/bookings/', {'session': self.session.id}, format='json'
        )
        self.assertEqual(resp.status_code, 400)

    def test_cancel_booking(self):
        self._auth('canceller@demo.com')
        create = self.client.post(
            '/api/bookings/', {'session': self.session.id}, format='json'
        )
        booking_id = create.data['id']
        resp = self.client.delete(f'/api/bookings/{booking_id}/cancel/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'cancelled')
