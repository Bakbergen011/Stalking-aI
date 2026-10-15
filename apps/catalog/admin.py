from django.contrib import admin, messages
from django.core.exceptions import ValidationError

from .models import ContentPage, LegalResource, Region, SupportService


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ("name_ru", "name_kk", "slug", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name_ru", "name_kk", "slug")
    prepopulated_fields = {"slug": ("name_ru",)}


@admin.register(SupportService)
class SupportServiceAdmin(admin.ModelAdmin):
    list_display = (
        "name_ru",
        "region",
        "service_type",
        "status",
        "contacts_verified",
        "source_verified",
        "verified_at",
    )
    list_filter = ("status", "service_type", "region", "contacts_verified")
    search_fields = ("name_ru", "name_kk", "phone", "source_name")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            "Public names",
            {"fields": ("name_kk", "name_ru", "service_type", "region")},
        ),
        (
            "Contacts",
            {
                "fields": (
                    "phone",
                    "email",
                    "website",
                    "address_kk",
                    "address_ru",
                    "hours_kk",
                    "hours_ru",
                    "services_kk",
                    "services_ru",
                )
            },
        ),
        (
            "Verification (required to publish)",
            {
                "fields": (
                    "source_name",
                    "source_url",
                    "verified_at",
                    "contacts_verified",
                    "source_verified",
                    "status",
                    "notes_internal",
                )
            },
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        try:
            super().save_model(request, obj, form, change)
        except ValidationError as exc:
            self.message_user(request, str(exc), level=messages.ERROR)
            raise


@admin.register(LegalResource)
class LegalResourceAdmin(admin.ModelAdmin):
    list_display = (
        "title_ru",
        "language",
        "status",
        "verified_at",
        "is_draft_translation",
    )
    list_filter = ("status", "language", "is_draft_translation")
    search_fields = ("title_ru", "title_kk", "official_url")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ContentPage)
class ContentPageAdmin(admin.ModelAdmin):
    list_display = ("slug", "title_ru", "is_published", "verified_at")
    list_filter = ("is_published",)
    search_fields = ("slug", "title_ru", "title_kk")
    prepopulated_fields = {"slug": ("title_ru",)}
