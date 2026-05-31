from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CoverImageUploadView, SessionViewSet

router = DefaultRouter()
router.register(r'', SessionViewSet, basename='session')

urlpatterns = [
    # Must precede the router include so it isn't captured as a detail pk.
    path('upload-cover/', CoverImageUploadView.as_view(), name='upload-cover'),
    path('', include(router.urls)),
]
