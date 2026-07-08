from django.contrib import admin
from .models import URL, Click


@admin.register(URL)
class URLAdmin(admin.ModelAdmin):
    # Columns shown in the list view
    list_display  = ['short_code', 'original_url_truncated', 'owner', 'click_count', 'created_at', 'expires_at']

    # Filters in the right sidebar
    list_filter   = ['created_at', 'owner']

    # Search by these fields
    search_fields = ['short_code', 'original_url', 'owner__username']

    # Default sort — newest first
    ordering      = ['-created_at']

    # Read-only fields in detail view
    readonly_fields = ['short_code', 'created_at', 'click_count']

    def original_url_truncated(self, obj):
        """Show only first 60 chars of the URL so the table isn't too wide."""
        url = obj.original_url
        return url[:60] + '…' if len(url) > 60 else url

    original_url_truncated.short_description = 'Original URL'


@admin.register(Click)
class ClickAdmin(admin.ModelAdmin):
    list_display  = ['url', 'owner_username', 'timestamp', 'ip_address', 'referrer', 'user_agent_short']
    list_filter   = ['timestamp', 'url__owner']
    search_fields = ['url__short_code', 'ip_address', 'referrer', 'url__owner__username']
    ordering      = ['-timestamp']
    readonly_fields = ['url', 'timestamp', 'ip_address', 'referrer', 'user_agent']

    def owner_username(self, obj):
        """Show the owner of the URL that was clicked."""
        return obj.url.owner.username if obj.url.owner else '— guest —'

    owner_username.short_description = 'Link Owner'

    def user_agent_short(self, obj):
        """Truncate long user agent strings."""
        ua = obj.user_agent or ''
        return ua[:50] + '…' if len(ua) > 50 else ua

    user_agent_short.short_description = 'User Agent'
