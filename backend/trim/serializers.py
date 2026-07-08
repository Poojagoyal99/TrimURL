from django.utils import timezone
from rest_framework import serializers
from .models import URL


class URLSerializer(serializers.ModelSerializer):
    # Optional field — user can send a custom code or leave it blank
    custom_code  = serializers.CharField(max_length=30, required=False, write_only=True)
    # Allow long URLs (default URLField is 200 chars)
    original_url = serializers.URLField(max_length=2000)
    # Show owner's username in the response (read-only)
    owner        = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = URL
        fields = ['id', 'original_url', 'custom_code', 'short_code', 'owner', 'created_at', 'click_count', 'expires_at']
        read_only_fields = ['short_code', 'created_at', 'click_count', 'owner']

    def validate_custom_code(self, value):
        """Check the custom code isn't already taken."""
        if URL.objects.filter(short_code=value).exists():
            raise serializers.ValidationError("This custom code is already taken.")
        return value

    def validate_expires_at(self, value):
        """Reject expiry dates in the past."""
        if value and value < timezone.now():
            raise serializers.ValidationError("Expiry date cannot be in the past.")
        return value

    def create(self, validated_data):
        custom_code = validated_data.pop('custom_code', None)
        if custom_code:
            validated_data['short_code'] = custom_code
        return URL.objects.create(**validated_data)
