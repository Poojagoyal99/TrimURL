from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth endpoints: /api/auth/register/, /api/auth/login/, etc.
    path('api/auth/', include('accounts.urls')),

    # URL shortener endpoints
    path('', include('trim.urls')),
]
