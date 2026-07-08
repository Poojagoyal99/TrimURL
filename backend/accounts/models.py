import random
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


def generate_otp():
    """Generate a 6-digit numeric OTP."""
    return str(random.randint(100000, 999999))


class EmailOTP(models.Model):
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_otp')
    otp        = models.CharField(max_length=6, default=generate_otp)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        """OTP expires after 5 minutes."""
        return (timezone.now() - self.created_at).total_seconds() > 300

    def refresh_otp(self):
        """Generate a fresh OTP and reset the timer."""
        self.otp = generate_otp()
        self.created_at = timezone.now()
        self.save(update_fields=['otp', 'created_at'])

    def __str__(self):
        return f"OTP for {self.user.username} (expires in 5 min)"
