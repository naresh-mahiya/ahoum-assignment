from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AvatarUploadView,
    BecomeCreatorView,
    DevLoginView,
    LogoutView,
    MeView,
    OAuthExchangeView,
)

urlpatterns = [
    path('oauth/exchange/', OAuthExchangeView.as_view(), name='oauth-exchange'),
    path('dev-login/', DevLoginView.as_view(), name='dev-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('me/upload-avatar/', AvatarUploadView.as_view(), name='upload-avatar'),
    path('become-creator/', BecomeCreatorView.as_view(), name='become-creator'),
]
