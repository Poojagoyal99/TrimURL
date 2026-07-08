from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Count
from django.db.models.functions import TruncDate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import URL, Click
from .serializers import URLSerializer

CACHE_KEY = "url:{}"


class ShortenURL(APIView):
    """
    POST /api/shorten/
    - Authenticated users: URL is saved under their account
    - Anonymous users: URL is saved with no owner (guest link)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = URLSerializer(data=request.data)
        if serializer.is_valid():
            # Assign owner only if the request has a valid JWT
            owner = request.user if request.user.is_authenticated else None
            url = serializer.save(owner=owner)
            cache.set(CACHE_KEY.format(url.short_code), url.original_url)
            return Response(URLSerializer(url).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class URLList(APIView):
    """
    GET /api/urls/
    - Admin (is_staff=True): returns ALL shortened URLs
    - Regular user: returns only their own URLs
    - Anonymous: returns only guest (owner=None) URLs
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_staff:
            # Admin sees everything
            urls = URL.objects.all().order_by('-created_at')
        else:
            # Regular user sees only their own links
            urls = URL.objects.filter(owner=request.user).order_by('-created_at')
        return Response(URLSerializer(urls, many=True).data)


class URLDetail(APIView):
    """
    DELETE /api/urls/<short_code>/
    - Users can only delete their own links
    - Admins can delete any link
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, short_code):
        url = get_object_or_404(URL, short_code=short_code)

        # Only owner or admin can delete
        if url.owner != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You do not have permission to delete this link.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        cache.delete(CACHE_KEY.format(short_code))
        url.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RedirectURL(APIView):
    """
    GET /<short_code>/
    Public — no auth required. Anyone with the link can use it.
    """
    permission_classes = [AllowAny]

    def get(self, request, short_code):
        cache_key = CACHE_KEY.format(short_code)
        original_url = cache.get(cache_key)

        if original_url is None:
            url = get_object_or_404(URL, short_code=short_code)
            if url.expires_at and url.expires_at < timezone.now():
                return Response({"error": "This link has expired."}, status=status.HTTP_410_GONE)
            original_url = url.original_url
            cache.set(cache_key, original_url)
        else:
            url = get_object_or_404(URL, short_code=short_code)

        # Increment click_count directly in the DB so UI reflects it immediately
        # Using F() expression to avoid race conditions (atomic increment)
        from django.db.models import F
        URL.objects.filter(short_code=short_code).update(click_count=F('click_count') + 1)

        # Store detailed click record for analytics
        Click.objects.create(
            url=url,
            ip_address=request.META.get('REMOTE_ADDR'),
            referrer=request.META.get('HTTP_REFERER'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
        )
        return HttpResponseRedirect(original_url)


class URLStats(APIView):
    """
    GET /api/stats/<short_code>/
    - Owner or admin can view stats
    - Anonymous links (no owner) are publicly viewable
    """
    permission_classes = [AllowAny]

    def get(self, request, short_code):
        url = get_object_or_404(URL, short_code=short_code)

        # If URL has an owner, only that owner (or admin) can see stats
        if url.owner is not None:
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
            if url.owner != request.user and not request.user.is_staff:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            "short_code":   url.short_code,
            "original_url": url.original_url,
            "click_count":  url.click_count,
            "created_at":   url.created_at,
            "expires_at":   url.expires_at,
            "owner":        url.owner.username if url.owner else None,
        })


class AnalyticsView(APIView):
    """
    GET /api/analytics/<short_code>/
    - Owner or admin can view full analytics
    - Anonymous links are publicly viewable
    """
    permission_classes = [AllowAny]

    def get(self, request, short_code):
        url = get_object_or_404(URL, short_code=short_code)

        # If URL has an owner, enforce access control
        if url.owner is not None:
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
            if url.owner != request.user and not request.user.is_staff:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        clicks = url.clicks.filter(timestamp__gte=thirty_days_ago)

        clicks_per_day = (
            clicks
            .annotate(date=TruncDate('timestamp'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        top_referrers = (
            clicks.values('referrer')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )
        all_agents = clicks.values_list('user_agent', flat=True)
        mobile  = sum(1 for ua in all_agents if ua and 'Mobile' in ua)
        desktop = clicks.count() - mobile

        return Response({
            "short_code":       url.short_code,
            "original_url":     url.original_url,
            "created_at":       url.created_at,
            "expires_at":       url.expires_at,
            "owner":            url.owner.username if url.owner else None,
            "total_clicks":     url.click_count,
            "clicks_per_day":   [{"date": str(r['date']), "count": r['count']} for r in clicks_per_day],
            "top_referrers":    list(top_referrers),
            "device_breakdown": {"mobile": mobile, "desktop": desktop},
        })
