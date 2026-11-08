from django.contrib import admin

from .models import Brand, Note, Perfume, PerfumeNote


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "country", "created_at", "updated_at")
    list_filter = ("country",)
    search_fields = ("name", "country")
    ordering = ("name",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("name", "family", "created_at", "updated_at")
    list_filter = ("family",)
    search_fields = ("name", "family")
    ordering = ("name",)
    readonly_fields = ("created_at", "updated_at")


class PerfumeNoteInline(admin.TabularInline):
    """Permite visualizar y administrar las notas de un perfume dentro de su ficha."""

    model = PerfumeNote
    extra = 1
    autocomplete_fields = ("note",)
    verbose_name = "Nota en la pirámide olfativa"
    verbose_name_plural = "Pirámide olfativa (Notas de Salida, Corazón y Fondo)"


@admin.register(Perfume)
class PerfumeAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "brand",
        "concentration",
        "gender",
        "release_year",
        "estimated_duration",
        "projection",
        "created_at",
    )
    list_filter = (
        "brand",
        "concentration",
        "gender",
        "estimated_duration",
        "projection",
    )
    search_fields = ("name", "brand__name", "description")
    ordering = ("brand__name", "name")
    autocomplete_fields = ("brand",)
    readonly_fields = ("created_at", "updated_at")
    inlines = [PerfumeNoteInline]


@admin.register(PerfumeNote)
class PerfumeNoteAdmin(admin.ModelAdmin):
    list_display = ("perfume", "note", "note_type", "created_at")
    list_filter = ("note_type", "note__family")
    search_fields = ("perfume__name", "perfume__brand__name", "note__name")
    ordering = ("perfume__name", "note_type", "note__name")
    autocomplete_fields = ("perfume", "note")
    readonly_fields = ("created_at",)
