from django.contrib.auth import get_user_model
from rest_framework import serializers

from catalog.models import Perfume

from .models import Review

User = get_user_model()


class ReviewAuthorSerializer(serializers.ModelSerializer):
    """Serializer público resumido para mostrar al autor de una reseña."""

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name")
        read_only_fields = fields


class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializer para listar, crear, actualizar y eliminar reseñas de perfumes.
    Valida rango de calificación (1-5) y que un usuario solo publique una reseña por perfume.
    """

    user = ReviewAuthorSerializer(read_only=True)
    perfume = serializers.PrimaryKeyRelatedField(
        queryset=Perfume.objects.all(),
        required=False,
    )
    perfume_name = serializers.CharField(source="perfume.name", read_only=True)
    brand_name = serializers.CharField(source="perfume.brand.name", read_only=True)
    rating = serializers.IntegerField(min_value=1, max_value=5)

    class Meta:
        model = Review
        fields = (
            "id",
            "user",
            "perfume",
            "perfume_name",
            "brand_name",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "perfume_name",
            "brand_name",
            "created_at",
            "updated_at",
        )

    def validate_comment(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("El comentario no puede estar vacío.")
        return cleaned

    def validate(self, attrs: dict) -> dict:
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if self.instance is None:
            perfume = attrs.get("perfume")
            if not perfume:
                raise serializers.ValidationError(
                    {"perfume": "Debes indicar el perfume a calificar."}
                )
            if user and user.is_authenticated:
                if Review.objects.filter(user=user, perfume=perfume).exists():
                    raise serializers.ValidationError(
                        {
                            "perfume": "Ya has publicado una reseña para este perfume. Puedes editar o eliminar tu reseña existente."
                        }
                    )
        else:
            if "perfume" in attrs and attrs["perfume"] != self.instance.perfume:
                raise serializers.ValidationError(
                    {"perfume": "No se puede cambiar el perfume de una reseña existente."}
                )

        return attrs

