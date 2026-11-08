from django.contrib import admin

from .models import UserNotePreference


@admin.register(UserNotePreference)
class UserNotePreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "note", "created_at", "updated_at")
    list_filter = ("note__family", "created_at")
    search_fields = ("user__username", "user__email", "note__name", "note__family")
    ordering = ("-created_at",)
    autocomplete_fields = ("user", "note")
    readonly_fields = ("created_at", "updated_at")
