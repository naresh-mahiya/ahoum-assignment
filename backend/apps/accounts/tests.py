from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase

User = get_user_model()


@override_settings(DEBUG=True)
class AuthFlowTests(APITestCase):
    def test_dev_login_creates_user_and_returns_tokens(self):
        resp = self.client.post(
            '/api/auth/dev-login/', {'email': 'new@demo.com'}, format='json'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)
        self.assertEqual(resp.data['user']['email'], 'new@demo.com')
        self.assertTrue(User.objects.filter(email='new@demo.com').exists())

    def test_me_requires_auth(self):
        resp = self.client.get('/api/auth/me/')
        self.assertEqual(resp.status_code, 401)

    def test_me_returns_profile_when_authenticated(self):
        login = self.client.post(
            '/api/auth/dev-login/', {'email': 'me@demo.com'}, format='json'
        )
        token = login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = self.client.get('/api/auth/me/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['email'], 'me@demo.com')

    def test_become_creator_upgrades_role(self):
        login = self.client.post(
            '/api/auth/dev-login/', {'email': 'up@demo.com'}, format='json'
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        resp = self.client.post('/api/auth/become-creator/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['user']['role'], 'creator')
        self.assertTrue(User.objects.get(email='up@demo.com').is_creator)
