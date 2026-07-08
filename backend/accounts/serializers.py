from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends the default JWT login to accept either username OR email.
    The frontend sends { username: <username_or_email>, password } and this
    serializer figures out which one it is and authenticates accordingly.
    """

    def validate(self, attrs):
        # 'username' field from the request — could be an actual username or an email
        login_input = attrs.get('username', '').strip()

        # If it looks like an email, find the actual username for that account
        if '@' in login_input:
            try:
                user = User.objects.get(email=login_input)
                attrs['username'] = user.username  # swap email → username for SimpleJWT
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {'detail': 'No account found with this email address.'}
                )

        # Let SimpleJWT do the rest (password check, inactive user check, etc.)
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims so the frontend can read them without an extra API call
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        return token


class RegisterSerializer(serializers.ModelSerializer):
    """Validates and creates a new user account. Email is required for OTP verification."""
    password  = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm password')
    # Email is required so we can send the verification OTP
    email     = serializers.EmailField(required=True)

    class Meta:
        model  = User
        fields = ('username', 'email', 'password', 'password2')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        # Remove password2 — not a model field
        validated_data.pop('password2')
        # Create user as inactive — they must verify email before logging in
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=False,
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only serializer for the /me endpoint."""
    class Meta:
        model  = User
        fields = ('id', 'username', 'email', 'is_staff', 'date_joined')
        read_only_fields = fields
