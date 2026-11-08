from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminDashboardStatsView,
    AdminStaffListCreateView,
    CustomTokenObtainPairView,
    UserLogoutView,
    UserProfileView,
    UserRegistrationView,
)

app_name = "users"

urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("logout/", UserLogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", UserProfileView.as_view(), name="profile"),
    path("admin/stats/", AdminDashboardStatsView.as_view(), name="admin_stats"),
    path("admins/", AdminStaffListCreateView.as_view(), name="admin_users"),
]
