from django.db import transaction
from rest_framework import serializers

from .models import Brand, Note, Perfume, PerfumeNote


class BrandSerializer(serializers.ModelSerializer):
    """Serializer para listar, consultar y gestionar marcas de perfumería."""

    class Meta:
        model = Brand
        fields = (
            "id",
            "name",
            "country",
            "description",
            "logo_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class NoteSerializer(serializers.ModelSerializer):
    """Serializer para listar, consultar y gestionar notas olfativas."""

    class Meta:
        model = Note
        fields = (
            "id",
            "name",
            "family",
            "description",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class PerfumeNoteReadSerializer(serializers.ModelSerializer):
    """Serializer de lectura para mostrar cada nota dentro de la pirámide de un perfume."""

    note = NoteSerializer(read_only=True)
    note_type_display = serializers.CharField(
        source="get_note_type_display",
        read_only=True,
    )

    class Meta:
        model = PerfumeNote
        fields = ("id", "note", "note_type", "note_type_display")


class PerfumeNoteWriteSerializer(serializers.Serializer):
    """Serializer de entrada para asignar notas y su clasificación a un perfume."""

    note = serializers.PrimaryKeyRelatedField(queryset=Note.objects.all())
    note_type = serializers.ChoiceField(choices=PerfumeNote.NoteTypeChoices.choices)


class PerfumeListSerializer(serializers.ModelSerializer):
    """Serializer resumido y optimizado para el listado y búsqueda del catálogo."""

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
    average_rating = serializers.FloatField(read_only=True, default=None)
    reviews_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Perfume
        fields = (
            "id",
            "name",
            "brand",
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
            "average_rating",
            "reviews_count",
            "created_at",
        )


class PerfumeDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detallado de un perfume.
    Incluye la pirámide olfativa clasificada en Salida (top), Corazón (heart) y Fondo (base),
    así como soporte de escritura para administradores.
    """

    brand = BrandSerializer(read_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(),
        source="brand",
        write_only=True,
    )
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
    perfume_notes = PerfumeNoteReadSerializer(many=True, read_only=True)
    olfactory_pyramid = serializers.SerializerMethodField()
    notes_input = PerfumeNoteWriteSerializer(
        many=True,
        write_only=True,
        required=False,
    )
    average_rating = serializers.FloatField(read_only=True, default=None)
    reviews_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Perfume
        fields = (
            "id",
            "name",
            "brand",
            "brand_id",
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
            "perfume_notes",
            "olfactory_pyramid",
            "notes_input",
            "average_rating",
            "reviews_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_olfactory_pyramid(self, obj: Perfume) -> dict:
        """Agrupa las notas del perfume según su fase: Salida (top), Corazón (heart) y Fondo (base)."""
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

    def validate_notes_input(self, value: list[dict]) -> list[dict]:
        """Verifica que no se envíe la misma nota duplicada para el mismo perfume."""
        seen_note_ids = set()
        for item in value:
            note_id = item["note"].id
            if note_id in seen_note_ids:
                raise serializers.ValidationError(
                    f"La nota '{item['note'].name}' está duplicada. Cada nota solo puede registrarse una vez por perfume."
                )
            seen_note_ids.add(note_id)
        return value

    def validate(self, attrs: dict) -> dict:
        """Valida unicidad compuesta (brand, name, concentration) antes de guardar."""
        brand = attrs.get("brand", getattr(self.instance, "brand", None))
        name = attrs.get("name", getattr(self.instance, "name", None))
        concentration = attrs.get(
            "concentration", getattr(self.instance, "concentration", None)
        )
        if brand and name and concentration:
            qs = Perfume.objects.filter(
                brand=brand,
                name__iexact=name.strip(),
                concentration=concentration,
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    "Ya existe un perfume con este nombre y concentración para la marca seleccionada."
                )
        return attrs

    @transaction.atomic
    def create(self, validated_data: dict) -> Perfume:
        notes_data = validated_data.pop("notes_input", None)
        perfume = Perfume.objects.create(**validated_data)
        if notes_data:
            PerfumeNote.objects.bulk_create(
                [
                    PerfumeNote(
                        perfume=perfume,
                        note=item["note"],
                        note_type=item["note_type"],
                    )
                    for item in notes_data
                ]
            )
        return perfume

    @transaction.atomic
    def update(self, instance: Perfume, validated_data: dict) -> Perfume:
        notes_data = validated_data.pop("notes_input", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if notes_data is not None:
            instance.perfume_notes.all().delete()
            PerfumeNote.objects.bulk_create(
                [
                    PerfumeNote(
                        perfume=instance,
                        note=item["note"],
                        note_type=item["note_type"],
                    )
                    for item in notes_data
                ]
            )
        return instance

