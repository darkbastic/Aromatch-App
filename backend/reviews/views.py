from django.shortcuts import get_object_or_404
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from catalog.models import Perfume
from users.permissions import IsOwnerOrReadOnly

from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las reseñas y calificaciones de perfumes.
    - GET /api/reviews/ -> Consultar reseñas públicas.
    - GET /api/reviews/{id}/ -> Consultar una reseña específica.
    - GET /api/reviews/perfume/{perfume_id}/ -> Consultar reseñas de un perfume.
    - GET /api/reviews/my-reviews/ -> Consultar reseñas propias del usuario autenticado.
    - POST /api/reviews/ -> Crear una reseña (usuario autenticado).
    - PATCH / PUT /api/reviews/{id}/ -> Modificar una reseña propia (solo autor).
    - DELETE /api/reviews/{id}/ -> Eliminar una reseña propia (solo autor).
    """

    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "rating"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = Review.objects.select_related("user", "perfume__brand")
        params = self.request.query_params

        # Filtrar por perfume (?perfume=1)
        perfume_id = params.get("perfume")
        if perfume_id and perfume_id.isdigit():
            queryset = queryset.filter(perfume_id=int(perfume_id))

        # Filtrar por calificación (?rating=5)
        rating = params.get("rating")
        if rating and rating.isdigit():
            queryset = queryset.filter(rating=int(rating))

        # Filtrar reseñas del usuario autenticado (?mine=true)
        mine = params.get("mine")
        if (
            mine
            and mine.lower() in ("true", "1", "yes")
            and self.request.user.is_authenticated
        ):
            queryset = queryset.filter(user=self.request.user)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(
        detail=False,
        methods=["get"],
        url_path=r"perfume/(?P<perfume_id>\d+)",
        permission_classes=[permissions.AllowAny],
    )
    def by_perfume(self, request, perfume_id=None):
        """Devuelve todas las reseñas asociadas a un perfume específico."""
        get_object_or_404(Perfume, pk=int(perfume_id))
        queryset = self.filter_queryset(
            Review.objects.select_related("user", "perfume__brand").filter(
                perfume_id=int(perfume_id)
            )
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="my-reviews",
        permission_classes=[permissions.IsAuthenticated],
    )
    def my_reviews(self, request):
        """Devuelve exclusivamente las reseñas publicadas por el usuario autenticado."""
        queryset = self.filter_queryset(
            Review.objects.select_related("user", "perfume__brand").filter(
                user=request.user
            )
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
