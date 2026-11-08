from django.db.models import Avg, Count, Prefetch
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from catalog.models import Perfume

from .models import Favorite
from .serializers import FavoriteSerializer


class FavoriteViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    ViewSet para gestionar la colección de perfumes favoritos del usuario autenticado.
    - GET /api/favorites/ -> Lista los favoritos del usuario autenticado.
    - POST /api/favorites/ -> Agrega un perfume a favoritos (recibe perfume_id).
    - DELETE /api/favorites/{id}/ -> Elimina un favorito por su ID.
    - DELETE /api/favorites/perfume/{perfume_id}/ -> Elimina un favorito por el ID del perfume.
    """

    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        annotated_perfumes = Perfume.objects.select_related("brand").annotate(
            average_rating=Avg("reviews__rating"),
            reviews_count=Count("reviews", distinct=True),
        )
        return (
            Favorite.objects.filter(user=self.request.user)
            .select_related("perfume__brand")
            .prefetch_related(Prefetch("perfume", queryset=annotated_perfumes))
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(
        detail=False,
        methods=["delete"],
        url_path=r"perfume/(?P<perfume_id>\d+)",
    )
    def remove_by_perfume(self, request, perfume_id=None):
        """Permite eliminar un favorito directamente indicando el ID del perfume."""
        favorite = Favorite.objects.filter(
            user=request.user,
            perfume_id=int(perfume_id),
        ).first()
        if not favorite:
            return Response(
                {"detail": "Este perfume no se encuentra en tus favoritos."},
                status=status.HTTP_404_NOT_FOUND,
            )
        favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
