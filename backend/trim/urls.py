from django.urls import path
from .views import ShortenURL, URLList, URLDetail, RedirectURL, URLStats, AnalyticsView

urlpatterns = [
    path('api/shorten/',                    ShortenURL.as_view(),  name='shorten'),
    path('api/urls/',                       URLList.as_view(),     name='url-list'),
    path('api/urls/<str:short_code>/',      URLDetail.as_view(),   name='url-detail'),
    path('api/stats/<str:short_code>/',     URLStats.as_view(),    name='stats'),
    path('api/analytics/<str:short_code>/', AnalyticsView.as_view(), name='analytics'),
    path('<str:short_code>/',               RedirectURL.as_view(), name='redirect'),
]
