from django.db.models import Avg, Count, F, Q, QuerySet

from catalog.models import Perfume

from .models import UserNotePreference


def get_user_preferred_note_ids(user) -> set[int]:
    """Obtiene el conjunto de IDs de notas olfativas preferidas por el usuario."""
    return set(
        UserNotePreference.objects.filter(user=user).values_list("note_id", flat=True)
    )


def get_recommended_perfumes_queryset(
    user, preferred_note_ids: set[int]
) -> QuerySet[Perfume]:
    """
    Calcula las recomendaciones basadas en reglas de coincidencia mediante Django ORM:
    1. Excluye perfumes que el usuario ya tiene en favoritos.
    2. Excluye perfumes que el usuario ya ha reseñado.
    3. Filtra perfumes que contengan al menos una nota preferida por el usuario.
    4. Anota `matched_notes_count` (cantidad de notas preferidas presentes en el perfume),
       `average_rating` y `reviews_count`.
    5. Ordena de mayor a menor coincidencia (`-matched_notes_count`), desempatando por
       mayor calificación promedio (`-average_rating`) y orden alfabético.
    """
    if not preferred_note_ids:
        return Perfume.objects.none()

    return (
        Perfume.objects.select_related("brand")
        .prefetch_related("perfume_notes__note")
        .exclude(favorited_by__user=user)
        .exclude(reviews__user=user)
        .filter(perfume_notes__note_id__in=preferred_note_ids)
        .annotate(
            matched_notes_count=Count(
                "perfume_notes__note",
                filter=Q(perfume_notes__note_id__in=preferred_note_ids),
                distinct=True,
            ),
            average_rating=Avg("reviews__rating"),
            reviews_count=Count("reviews", distinct=True),
        )
        .filter(matched_notes_count__gt=0)
        .order_by(
            "-matched_notes_count",
            F("average_rating").desc(nulls_last=True),
            "brand__name",
            "name",
        )
    )

