from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BrandViewSet, NoteViewSet, PerfumeViewSet

app_name = "catalog"

router = DefaultRouter()
router.register(r"brands", BrandViewSet, basename="brand")
router.register(r"notes", NoteViewSet, basename="note")
router.register(r"perfumes", PerfumeViewSet, basename="perfume")

urlpatterns = [
    path("", include(router.urls)),
]

