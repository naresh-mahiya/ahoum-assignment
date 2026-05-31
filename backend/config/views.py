from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """Liveness/readiness probe: confirms the process and DB are reachable."""

    permission_classes = [AllowAny]
    throttle_classes = []

    def get(self, request):
        db_ok = True
        try:
            connection.ensure_connection()
        except Exception:
            db_ok = False
        status_code = 200 if db_ok else 503
        return Response(
            {'status': 'ok' if db_ok else 'degraded', 'db': 'ok' if db_ok else 'down'},
            status=status_code,
        )
