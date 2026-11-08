from rest_framework import mixins, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserNotePreference
from .serializers import RecommendedPerfumeSerializer, UserNotePreferenceSerializer
from .services import get_recommended_perfumes_queryset, get_user_preferred_note_ids


class UserNotePreferenceViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    ViewSet para gestionar las preferencias olfativas del usuario autenticado.
    - GET /api/recommendations/preferences/ -> Consultar preferencias propias.
    - POST /api/recommendations/preferences/ -> Agregar una nota preferida.
    - DELETE /api/recommendations/preferences/{id}/ -> Eliminar una preferencia.
    """

    serializer_class = UserNotePreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserNotePreference.objects.filter(
            user=self.request.user
        ).select_related("note")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RecommendationListView(APIView):
    """
    Endpoint GET /api/recommendations/
    Genera recomendaciones de perfumes basadas en reglas de coincidencia con
    las notas olfativas preferidas del usuario autenticado.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        preferred_note_ids = get_user_preferred_note_ids(request.user)

        if not preferred_note_ids:
            return Response(
                {
                    "has_preferences": False,
                    "preferred_notes_count": 0,
                    "detail": "Debes seleccionar tus notas olfativas preferidas antes de recibir recomendaciones personalizadas.",
                    "results": [],
                },
                status=status.HTTP_200_OK,
            )

        queryset = get_recommended_perfumes_queryset(request.user, preferred_note_ids)
        serializer = RecommendedPerfumeSerializer(
            queryset,
            many=True,
            context={
                "request": request,
                "preferred_note_ids": preferred_note_ids,
            },
        )

        if not serializer.data:
            detail_msg = (
                "No se encontraron perfumes nuevos que coincidan con tus notas preferidas."
            )
        else:
            detail_msg = (
                "Recomendaciones generadas según la coincidencia con tus notas olfativas preferidas."
            )

        return Response(
            {
                "has_preferences": True,
                "preferred_notes_count": len(preferred_note_ids),
                "count": len(serializer.data),
                "detail": detail_msg,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
