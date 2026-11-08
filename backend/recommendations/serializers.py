from rest_framework import serializers

from catalog.models import Note, Perfume, PerfumeNote
from catalog.serializers import BrandSerializer, NoteSerializer

from .models import UserNotePreference


class UserNotePreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer para listar, crear y eliminar las notas olfativas preferidas
    del usuario autenticado. Acepta `note_id` o `note` en la entrada.
    """

    note = NoteSerializer(read_only=True)
    note_id = serializers.PrimaryKeyRelatedField(
        queryset=Note.objects.all(),
        source="note",
        write_only=True,
        required=False,
    )

    class Meta:
        model = UserNotePreference
        fields = ("id", "note", "note_id", "created_at", "updated_at")
        read_only_fields = ("id", "note", "created_at", "updated_at")

    def to_internal_value(self, data):
        if isinstance(data, dict) and "note_id" not in data and "note" in data:
            data = {**data, "note_id": data["note"]}
        return super().to_internal_value(data)

    def validate(self, attrs: dict) -> dict:
        note = attrs.get("note")
        if not note:
            raise serializers.ValidationError(
                {"note_id": "Debes indicar el ID de la nota olfativa."}
            )

        request = self.context.get("request")
        user = getattr(request, "user", None)

        if user and user.is_authenticated:
            if UserNotePreference.objects.filter(user=user, note=note).exists():
                raise serializers.ValidationError(
                    {
                        "note_id": "Esta nota olfativa ya está registrada en tus preferencias."
                    }
                )
        return attrs


class RecommendedPerfumeSerializer(serializers.ModelSerializer):
    """
    Serializer para presentar perfumes recomendados mediante coincidencia de notas.
    Incluye datos básicos del perfume, marca, pirámide olfativa y métricas de coincidencia.
    """

    brand = BrandSerializer(read_only=True)
    concentration_display = serializers.CharField(
        source="get_concentration_display",
        read_only=True,
    )
    gender_display = serializers.CharField(
        source="get_gender_display",
        read_only=True,
    )
    estimated_duration_display = serializers.CharField(
        source="get_estimated_duration_display",
        read_only=True,
    )
    projection_display = serializers.CharField(
        source="get_projection_display",
        read_only=True,
    )
    olfactory_pyramid = serializers.SerializerMethodField()
    matched_notes_count = serializers.IntegerField(read_only=True)
    match_percentage = serializers.SerializerMethodField()
    matched_notes = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True, default=None)
    reviews_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Perfume
        fields = (
            "id",
            "name",
            "brand",
            "description",
            "concentration",
            "concentration_display",
            "gender",
            "gender_display",
            "release_year",
            "recommended_seasons",
            "estimated_duration",
            "estimated_duration_display",
            "projection",
            "projection_display",
            "image_url",
            "olfactory_pyramid",
            "matched_notes_count",
            "match_percentage",
            "matched_notes",
            "average_rating",
            "reviews_count",
        )

    def get_olfactory_pyramid(self, obj: Perfume) -> dict:
        pyramid = {"top": [], "heart": [], "base": []}
        mapping = {
            PerfumeNote.NoteTypeChoices.TOP: "top",
            PerfumeNote.NoteTypeChoices.HEART: "heart",
            PerfumeNote.NoteTypeChoices.BASE: "base",
        }
        for pn in obj.perfume_notes.all():
            key = mapping.get(pn.note_type)
            if key:
                pyramid[key].append(NoteSerializer(pn.note).data)
        return pyramid

    def get_match_percentage(self, obj: Perfume) -> float:
        preferred_ids: set[int] = self.context.get("preferred_note_ids", set())
        total_preferred = len(preferred_ids)
        if total_preferred == 0:
            return 0.0
        matched_count = getattr(obj, "matched_notes_count", 0)
        return round((matched_count / total_preferred) * 100.0, 1)

    def get_matched_notes(self, obj: Perfume) -> list[dict]:
        preferred_ids: set[int] = self.context.get("preferred_note_ids", set())
        matched = []
        for pn in obj.perfume_notes.all():
            if pn.note_id in preferred_ids:
                matched.append(
                    {
                        "id": pn.note.id,
                        "name": pn.note.name,
                        "family": pn.note.family,
                        "note_type": pn.note_type,
                        "note_type_display": pn.get_note_type_display(),
                    }
                )
        return matched

