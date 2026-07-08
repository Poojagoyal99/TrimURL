from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailOTP
from .serializers import RegisterSerializer, UserProfileSerializer


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Body: { username, email, password, password2 }
    - Creates an inactive user account
    - Generates a 6-digit OTP and emails it to the user
    - Returns only a success message (no tokens yet — must verify first)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()  # is_active=False already set in serializer

            # Create an OTP record for this user
            otp_record = EmailOTP.objects.create(user=user)

            # Send the OTP email
            send_mail(
                subject='Verify your TrimURL account',
                message=(
                    f'Hi {user.username},\n\n'
                    f'Your verification code is: {otp_record.otp}\n\n'
                    f'This code is valid for 5 minutes.\n\n'
                    f'If you did not register, please ignore this email.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

            return Response(
                {'detail': 'Account created. Check your email for the verification OTP.'},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    """
    POST /api/auth/verify-otp/
    Body: { email, otp }
    - Validates the OTP
    - Activates the user account on success
    - Returns JWT tokens so the user is immediately logged in
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp   = request.data.get('otp',   '').strip()

        if not email or not otp:
            return Response(
                {'error': 'Both email and OTP are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Look up the inactive user by email
        try:
            user = User.objects.get(email=email, is_active=False)
        except User.DoesNotExist:
            return Response(
                {'error': 'No pending verification found for this email.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Look up the OTP record
        try:
            otp_record = EmailOTP.objects.get(user=user)
        except EmailOTP.DoesNotExist:
            return Response(
                {'error': 'OTP not found. Please register again or request a new OTP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check expiry first
        if otp_record.is_expired():
            return Response(
                {'error': 'OTP has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check OTP value
        if otp_record.otp != otp:
            return Response(
                {'error': 'Invalid OTP. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # All good — activate the user and clean up the OTP record
        user.is_active = True
        user.save()
        otp_record.delete()

        # Issue JWT tokens so user is logged in immediately after verification
        refresh = RefreshToken.for_user(user)
        return Response({
            'detail': 'Email verified successfully! Welcome to TrimURL.',
            'user':    UserProfileSerializer(user).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)


class ResendOTPView(APIView):
    """
    POST /api/auth/resend-otp/
    Body: { email }
    - Generates a fresh OTP for an inactive account and resends the email
    - Rate-limited to once per minute (checked via OTP created_at timestamp)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()

        if not email:
            return Response(
                {'error': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email, is_active=False)
        except User.DoesNotExist:
            return Response(
                {'error': 'No pending verification found for this email.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get or create OTP record
        otp_record, created = EmailOTP.objects.get_or_create(user=user)

        if not created:
            # Prevent spam: must wait at least 60 seconds before resending
            from django.utils import timezone
            elapsed = (timezone.now() - otp_record.created_at).total_seconds()
            if elapsed < 60:
                wait = int(60 - elapsed)
                return Response(
                    {'error': f'Please wait {wait} seconds before requesting a new OTP.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            otp_record.refresh_otp()

        send_mail(
            subject='Your new TrimURL verification code',
            message=(
                f'Hi {user.username},\n\n'
                f'Your new verification code is: {otp_record.otp}\n\n'
                f'This code is valid for 5 minutes.\n\n'
                f'If you did not request this, please ignore this email.'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {'detail': 'A new OTP has been sent to your email.'},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns the currently logged-in user's profile.
    Requires: Authorization: Bearer <access_token>
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Body: { refresh: "<refresh_token>" }
    Blacklists the refresh token so it can't be reused.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except Exception:
            # Token may already be invalid — still treat as logged out
            return Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
