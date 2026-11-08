from rest_framework import serializers

from catalog.models import Perfume
from catalog.serializers import PerfumeListSerializer

from .models import Favorite


class FavoriteSerializer(serializers.ModelSerializer):
    """
    Serializer para listar, agregar y eliminar perfumes favoritos del usuario autenticado.
    Acepta tanto `perfume_id` como `perfume` en la entrada para mayor flexibilidad.
    """

    perfume = PerfumeListSerializer(read_only=True)
    perfume_id = serializers.PrimaryKeyRelatedField(
        queryset=Perfume.objects.all(),
        source="perfume",
        write_only=True,
        required=False,
    )

    class Meta:
        model = Favorite
        fields = ("id", "perfume", "perfume_id", "created_at")
        read_only_fields = ("id", "perfume", "created_at")

    def to_internal_value(self, data):
        if isinstance(data, dict) and "perfume_id" not in data and "perfume" in data:
            data = {**data, "perfume_id": data["perfume"]}
        return super().to_internal_value(data)

    def validate(self, attrs: dict) -> dict:
        perfume = attrs.get("perfume")
        if not perfume:
            raise serializers.ValidationError(
                {"perfume_id": "Debes indicar el ID del perfume."}
            )

        request = self.context.get("request")
        user = getattr(request, "user", None)

        if user and user.is_authenticated:
            if Favorite.objects.filter(user=user, perfume=perfume).exists():
                raise serializers.ValidationError(
                    {
                        "perfume_id": "Este perfume ya se encuentra en tu colección de favoritos."
                    }
                )
        return attrs
