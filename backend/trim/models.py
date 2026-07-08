import random
import string
from django.db import models
from django.contrib.auth.models import User


def generate_short_code():
    characters = string.ascii_letters + string.digits
    return ''.join(random.choices(characters, k=6))


class URL(models.Model):
    # owner is nullable so anonymous shortening still works for guests
    owner        = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='urls',
    )
    original_url = models.URLField(max_length=2000)
    short_code   = models.CharField(max_length=30, unique=True, default=generate_short_code)
    created_at   = models.DateTimeField(auto_now_add=True)
    click_count  = models.PositiveIntegerField(default=0)
    expires_at   = models.DateTimeField(null=True, blank=True)  # None = never expires

    def __str__(self):
        return f"{self.short_code} → {self.original_url}"


class Click(models.Model):
    url        = models.ForeignKey(URL, on_delete=models.CASCADE, related_name='clicks')
    timestamp  = models.DateTimeField(auto_now_add=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    referrer   = models.URLField(max_length=2000, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Click on {self.url.short_code} at {self.timestamp}"
