from django.conf import settings
from django.db import models


class UserNotePreference(models.Model):
    """
    Registra las notas olfativas preferidas por un usuario para el cálculo
    de recomendaciones basadas en reglas y coincidencias.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="note_preferences",
        verbose_name="Usuario",
    )
    note = models.ForeignKey(
        "catalog.Note",
        on_delete=models.PROTECT,
        related_name="preferred_by_users",
        verbose_name="Nota olfativa",
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
        verbose_name = "Preferencia olfativa de usuario"
        verbose_name_plural = "Preferencias olfativas de usuarios"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "note"],
                name="unique_user_note_preference",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user.username} - {self.note.name}"
