from django.contrib.auth import get_user_model
from rest_framework import filters, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from catalog.models import Brand, Note, Perfume

from .permissions import IsStaffAdmin, IsSuperUser
from .serializers import (
    AdminUserSerializer,
    CustomTokenObtainPairSerializer,
    UserLogoutSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista de login JWT que acepta tanto nombre de usuario como correo electrónico."""

    serializer_class = CustomTokenObtainPairSerializer



class UserRegistrationView(generics.CreateAPIView):
    """Endpoint público para registrar una nueva cuenta de usuario en Aromatch."""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint privado para que el usuario autenticado consulte o actualice
    su propia información de perfil (/api/users/me/).
    """

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserLogoutView(APIView):
    """
    Endpoint privado (/api/users/logout/) para cerrar sesión invalidando
    el Refresh Token mediante la blacklist de SimpleJWT.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = UserLogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Sesión cerrada correctamente."},
            status=status.HTTP_205_RESET_CONTENT,
        )


class AdminDashboardStatsView(APIView):
    """
    Endpoint administrativo (GET /api/users/admin/stats/) que devuelve
    estadísticas reales de la base de datos para el Dashboard del panel.
    Accesible para Administradores (is_staff=True) y Superadministradores (is_superuser=True).
    """

    permission_classes = [IsStaffAdmin]

    def get(self, request, *args, **kwargs):
        return Response(
            {
                "total_perfumes": Perfume.objects.count(),
                "total_brands": Brand.objects.count(),
                "total_notes": Note.objects.count(),
                "total_admins": User.objects.filter(is_staff=True).count(),
            },
            status=status.HTTP_200_OK,
        )


class AdminStaffListCreateView(generics.ListCreateAPIView):
    """
    Endpoint exclusivo para Superadministradores (GET, POST /api/users/admins/).
    - GET: Lista todas las cuentas con privilegios administrativos (is_staff=True).
    - POST: Crea una nueva cuenta administrativa con is_staff=True e is_superuser=False.
    """

    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering_fields = ["username", "date_joined", "is_superuser"]
    ordering = ["-is_superuser", "username"]

    def get_queryset(self):
        return User.objects.filter(is_staff=True).order_by("-is_superuser", "username")
