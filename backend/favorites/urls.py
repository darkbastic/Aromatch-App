from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FavoriteViewSet

app_name = "favorites"

router = DefaultRouter()
router.register(r"", FavoriteViewSet, basename="favorite")

urlpatterns = [
    path("", include(router.urls)),
]

