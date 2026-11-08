from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "perfume", "rating", "created_at", "updated_at")
    list_filter = ("rating", "created_at", "perfume__brand")
    search_fields = (
        "user__username",
        "user__email",
        "perfume__name",
        "perfume__brand__name",
        "comment",
    )
    ordering = ("-created_at",)
    autocomplete_fields = ("user", "perfume")
    readonly_fields = ("created_at", "updated_at")
