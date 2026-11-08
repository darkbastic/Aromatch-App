from django.contrib import admin

from .models import Favorite


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("user", "perfume", "created_at")
    list_filter = ("created_at", "perfume__brand")
    search_fields = (
        "user__username",
        "user__email",
        "perfume__name",
        "perfume__brand__name",
    )
    ordering = ("-created_at",)
    autocomplete_fields = ("user", "perfume")
    readonly_fields = ("created_at",)
