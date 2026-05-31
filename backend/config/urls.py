from django.contrib import admin
from django.urls import include, path

from .views import HealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/sessions/', include('apps.sessions_app.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/health/', HealthCheckView.as_view(), name='health'),
]
