from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from .views import RegisterView, VerifyOTPView, ResendOTPView, MeView, LogoutView


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login view that uses our custom serializer (adds username + is_staff to JWT)."""
    serializer_class = CustomTokenObtainPairSerializer


urlpatterns = [
    # Register a new account (returns OTP sent message, not tokens)
    path('register/',    RegisterView.as_view(),   name='auth-register'),

    # Verify OTP → activates account and returns JWT tokens
    path('verify-otp/',  VerifyOTPView.as_view(),  name='auth-verify-otp'),

    # Resend OTP (rate-limited to once per 60 seconds)
    path('resend-otp/',  ResendOTPView.as_view(),  name='auth-resend-otp'),

    # Login — returns access + refresh tokens with username & is_staff in payload
    path('login/',       CustomTokenObtainPairView.as_view(), name='auth-login'),

    # Refresh access token
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # Get logged-in user's profile
    path('me/',          MeView.as_view(),         name='auth-me'),

    # Logout (blacklist refresh token)
    path('logout/',      LogoutView.as_view(),     name='auth-logout'),
]
