from django.conf import settings
from django.db import models


class Favorite(models.Model):
    """Representa un perfume guardado en la colección de favoritos de un usuario."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorites",
        verbose_name="Usuario",
    )
    perfume = models.ForeignKey(
        "catalog.Perfume",
        on_delete=models.CASCADE,
        related_name="favorited_by",
        verbose_name="Perfume",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de creación",
    )

    class Meta:
        verbose_name = "Favorito"
        verbose_name_plural = "Favoritos"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "perfume"],
                name="unique_user_favorite_perfume",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user.username} - {self.perfume.name}"
