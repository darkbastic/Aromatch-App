from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


def validate_unique_seasons(value: list[str]) -> None:
    """Valida que no existan estaciones repetidas dentro de la lista."""
    if value and len(value) != len(set(value)):
        raise ValidationError("No se permiten estaciones recomendadas duplicadas.")


class Brand(models.Model):
    """Representa una casa o marca de perfumería."""

    name = models.CharField(
        max_length=120,
        unique=True,
        verbose_name="Nombre",
    )
    country = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="País de origen",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Descripción",
    )
    logo_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="URL del logo (Supabase Storage)",
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
        verbose_name = "Marca"
        verbose_name_plural = "Marcas"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Note(models.Model):
    """Representa una nota olfativa individual del catálogo maestro."""

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Nombre de la nota",
    )
    family = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        verbose_name="Familia olfativa",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Descripción",
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
        verbose_name = "Nota olfativa"
        verbose_name_plural = "Notas olfativas"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Perfume(models.Model):
    """Representa un perfume dentro del catálogo de Aromatch."""

    class ConcentrationChoices(models.TextChoices):
        EAU_DE_COLOGNE = "EDC", "Eau de Cologne"
        EAU_DE_TOILETTE = "EDT", "Eau de Toilette"
        EAU_DE_PARFUM = "EDP", "Eau de Parfum"
        PARFUM = "PARFUM", "Parfum"
        EXTRAIT = "EXTRAIT", "Extrait de Parfum"

    class GenderChoices(models.TextChoices):
        MASCULINE = "MASCULINE", "Masculino"
        FEMININE = "FEMININE", "Femenino"
        UNISEX = "UNISEX", "Unisex"

    class SeasonChoices(models.TextChoices):
        SPRING = "SPRING", "Primavera"
        SUMMER = "SUMMER", "Verano"
        AUTUMN = "AUTUMN", "Otoño"
        WINTER = "WINTER", "Invierno"

    class DurationChoices(models.TextChoices):
        WEAK = "WEAK", "Débil (1 - 2 horas)"
        MODERATE = "MODERATE", "Moderada (3 - 5 horas)"
        LONG_LASTING = "LONG_LASTING", "Duradera (6 - 8 horas)"
        ETERNAL = "ETERNAL", "Muy duradera (+8 horas)"

    class ProjectionChoices(models.TextChoices):
        INTIMATE = "INTIMATE", "Íntima (a ras de piel)"
        MODERATE = "MODERATE", "Moderada"
        STRONG = "STRONG", "Fuerte"
        ENORMOUS = "ENORMOUS", "Enorme"

    name = models.CharField(
        max_length=150,
        db_index=True,
        verbose_name="Nombre",
    )
    brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,
        related_name="perfumes",
        verbose_name="Marca",
    )
    description = models.TextField(
        verbose_name="Descripción",
    )
    concentration = models.CharField(
        max_length=15,
        choices=ConcentrationChoices.choices,
        db_index=True,
        verbose_name="Concentración",
    )
    gender = models.CharField(
        max_length=15,
        choices=GenderChoices.choices,
        default=GenderChoices.UNISEX,
        db_index=True,
        verbose_name="Clasificación de uso / género",
    )
    release_year = models.PositiveSmallIntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1700), MaxValueValidator(2100)],
        verbose_name="Año de lanzamiento",
    )
    recommended_seasons = ArrayField(
        base_field=models.CharField(
            max_length=10,
            choices=SeasonChoices.choices,
        ),
        size=4,
        default=list,
        blank=True,
        validators=[validate_unique_seasons],
        verbose_name="Estaciones recomendadas",
    )
    estimated_duration = models.CharField(
        max_length=20,
        choices=DurationChoices.choices,
        default=DurationChoices.MODERATE,
        verbose_name="Duración estimada en piel",
    )
    projection = models.CharField(
        max_length=15,
        choices=ProjectionChoices.choices,
        default=ProjectionChoices.MODERATE,
        verbose_name="Proyección",
    )
    image_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="URL de imagen (Supabase Storage)",
    )
    notes = models.ManyToManyField(
        Note,
        through="PerfumeNote",
        related_name="perfumes",
        blank=True,
        verbose_name="Notas olfativas",
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
        verbose_name = "Perfume"
        verbose_name_plural = "Perfumes"
        ordering = ["brand__name", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["brand", "name", "concentration"],
                name="unique_perfume_per_brand_and_concentration",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.brand.name} - {self.name} ({self.get_concentration_display()})"


class PerfumeNote(models.Model):
    """
    Tabla intermedia que vincula un Perfume con una Nota olfativa
    indicando su clasificación única en la pirámide olfativa (Salida, Corazón o Fondo).
    """

    class NoteTypeChoices(models.TextChoices):
        TOP = "TOP", "Salida"
        HEART = "HEART", "Corazón"
        BASE = "BASE", "Fondo"

    perfume = models.ForeignKey(
        Perfume,
        on_delete=models.CASCADE,
        related_name="perfume_notes",
        verbose_name="Perfume",
    )
    note = models.ForeignKey(
        Note,
        on_delete=models.PROTECT,
        related_name="perfume_notes",
        verbose_name="Nota olfativa",
    )
    note_type = models.CharField(
        max_length=10,
        choices=NoteTypeChoices.choices,
        db_index=True,
        verbose_name="Clasificación de nota",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de creación",
    )

    class Meta:
        verbose_name = "Nota de perfume"
        verbose_name_plural = "Notas de perfumes"
        ordering = ["perfume", "note_type", "note__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["perfume", "note"],
                name="unique_perfume_note",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.perfume.name} - {self.note.name} ({self.get_note_type_display()})"
