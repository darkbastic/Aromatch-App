from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q


class Review(models.Model):
    """
    Representa una reseña y calificación (1 a 5) publicada por un usuario
    sobre un perfume. Restringida a una única reseña por usuario y perfume.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name="Usuario",
    )
    perfume = models.ForeignKey(
        "catalog.Perfume",
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name="Perfume",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="Calificación (1-5)",
    )
    comment = models.TextField(
        verbose_name="Comentario",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de creación",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Última actualización",
    )

    class Meta:
        verbose_name = "Reseña"
        verbose_name_plural = "Reseñas"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "perfume"],
                name="unique_user_review_per_perfume",
            ),
            models.CheckConstraint(
                condition=Q(rating__gte=1) & Q(rating__lte=5),
                name="valid_review_rating_range",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user.username} - {self.perfume.name} ({self.rating}/5)"
