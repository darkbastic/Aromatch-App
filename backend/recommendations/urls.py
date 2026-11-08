from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import RecommendationListView, UserNotePreferenceViewSet

app_name = "recommendations"

router = DefaultRouter()
router.register(r"preferences", UserNotePreferenceViewSet, basename="preference")

urlpatterns = [
    path("", RecommendationListView.as_view(), name="recommendations-list"),
    path("", include(router.urls)),
]

