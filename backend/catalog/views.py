from django.db.models import Avg, Count, ProtectedError
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from users.permissions import IsAdminOrReadOnly

from .models import Brand, Note, Perfume
from .serializers import (
    BrandSerializer,
    NoteSerializer,
    PerfumeDetailSerializer,
    PerfumeListSerializer,
)


class BrandViewSet(viewsets.ModelViewSet):
    """
    ViewSet para consultar marcas de perfumes (público) y administrarlas (solo admin).
    """

    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "country"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
        except ProtectedError:
            return Response(
                {
                    "detail": "No se puede eliminar esta marca porque tiene perfumes asociados en el catálogo."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class NoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para consultar notas olfativas (público) y administrarlas (solo admin).
    Permite filtrar por familia olfativa (?family=...).
    """

    serializer_class = NoteSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "family"]
    ordering_fields = ["name", "family", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        queryset = Note.objects.all()
        family = self.request.query_params.get("family")
        if family:
            queryset = queryset.filter(family__iexact=family.strip())
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
        except ProtectedError:
            return Response(
                {
                    "detail": "No se puede eliminar esta nota olfativa porque está en uso por perfumes o preferencias de usuarios."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class PerfumeViewSet(viewsets.ModelViewSet):
    """
    ViewSet del catálogo de perfumes.
    - Lectura pública con búsqueda por nombre/marca y filtros por marca, notas,
      concentración, género, estación recomendada, duración estimada y proyección.
    - Escritura exclusiva para administradores (is_staff=True).
    - Evita consultas N+1 mediante select_related y prefetch_related.
    """

    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "brand__name", "description"]
    ordering_fields = [
        "name",
        "brand__name",
        "release_year",
        "average_rating",
        "created_at",
    ]
    ordering = ["brand__name", "name"]

    def get_queryset(self):
        queryset = (
            Perfume.objects.select_related("brand")
            .prefetch_related("perfume_notes__note")
            .annotate(
                average_rating=Avg("reviews__rating"),
                reviews_count=Count("reviews", distinct=True),
            )
        )

        params = self.request.query_params

        # Filtro por marca: ID (?brand=1) o nombre exacto (?brand_name=Dior)
        brand_id = params.get("brand")
        if brand_id:
            if brand_id.isdigit():
                queryset = queryset.filter(brand_id=int(brand_id))
            else:
                queryset = queryset.filter(brand__name__iexact=brand_id.strip())

        brand_name = params.get("brand_name")
        if brand_name:
            queryset = queryset.filter(brand__name__iexact=brand_name.strip())

        # Filtro por concentración (?concentration=EDP)
        concentration = params.get("concentration")
        if concentration:
            queryset = queryset.filter(concentration=concentration.strip().upper())

        # Filtro por público objetivo / género (?gender=UNISEX)
        gender = params.get("gender")
        if gender:
            queryset = queryset.filter(gender=gender.strip().upper())

        # Filtro por estación recomendada (?season=WINTER)
        season = params.get("season")
        if season:
            queryset = queryset.filter(
                recommended_seasons__contains=[season.strip().upper()]
            )

        # Filtro por duración estimada (?estimated_duration=LONG_LASTING o ?duration=LONG_LASTING)
        duration = params.get("estimated_duration") or params.get("duration")
        if duration:
            queryset = queryset.filter(estimated_duration=duration.strip().upper())

        # Filtro por proyección (?projection=STRONG)
        projection = params.get("projection")
        if projection:
            queryset = queryset.filter(projection=projection.strip().upper())

        # Filtro por una nota (?note=1) o múltiples notas (?notes=1,2,3)
        note_id = params.get("note")
        if note_id and note_id.isdigit():
            queryset = queryset.filter(perfume_notes__note_id=int(note_id)).distinct()

        notes_param = params.get("notes")
        if notes_param:
            note_ids = [
                int(nid.strip())
                for nid in notes_param.split(",")
                if nid.strip().isdigit()
            ]
            if note_ids:
                queryset = queryset.filter(
                    perfume_notes__note_id__in=note_ids
                ).distinct()

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return PerfumeListSerializer
        return PerfumeDetailSerializer
