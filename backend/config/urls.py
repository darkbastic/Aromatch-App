"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/users/", include("users.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/favorites/", include("favorites.urls")),
    path("api/reviews/", include("reviews.urls")),
    path("api/recommendations/", include("recommendations.urls")),
]
