from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Region(models.Model):
    slug = models.SlugField(max_length=64, unique=True)
    name_kk = models.CharField(max_length=120)
    name_ru = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name_ru"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name_ru

    def display_name(self, lang: str) -> str:
        return self.name_kk if lang == "kk" else self.name_ru


class SupportService(models.Model):
    class ServiceType(models.TextChoices):
        CRISIS = "crisis", "Crisis / shelter"
        LEGAL = "legal", "Legal aid"
        PSYCH = "psych", "Psychological"
        HOTLINE = "hotline", "Hotline"
        OTHER = "other", "Other"

    class PublishStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        NEEDS_REVIEW = "needs_review", "Needs review"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    name_kk = models.CharField(max_length=200)
    name_ru = models.CharField(max_length=200)
    service_type = models.CharField(
        max_length=20, choices=ServiceType.choices, db_index=True
    )
    region = models.ForeignKey(
        Region, on_delete=models.PROTECT, related_name="services"
    )
    phone = models.CharField(max_length=64, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    address_kk = models.CharField(max_length=300, blank=True)
    address_ru = models.CharField(max_length=300, blank=True)
    hours_kk = models.CharField(max_length=200, blank=True)
    hours_ru = models.CharField(max_length=200, blank=True)
    services_kk = models.TextField(blank=True)
    services_ru = models.TextField(blank=True)
    source_name = models.CharField(max_length=200)
    source_url = models.URLField()
    verified_at = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=PublishStatus.choices,
        default=PublishStatus.DRAFT,
        db_index=True,
    )
    contacts_verified = models.BooleanField(default=False)
    source_verified = models.BooleanField(default=False)
    notes_internal = models.TextField(
        blank=True,
        help_text="Editor-only notes. Never show on public pages.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name_ru"]
        indexes = [
            models.Index(fields=["status", "service_type"]),
            models.Index(fields=["region", "status"]),
            models.Index(fields=["verified_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=~models.Q(source_name="") & ~models.Q(source_url=""),
                name="support_service_source_required",
            ),
        ]

    def __str__(self):
        return self.name_ru

    def clean(self):
        errors = {}
        if self.status == self.PublishStatus.PUBLISHED:
            if not self.contacts_verified or not self.source_verified:
                errors["status"] = (
                    "Cannot publish until contacts and source are verified."
                )
            if not (self.phone or self.email or self.website):
                errors["phone"] = "Published entry needs at least one public contact."
            if self.verified_at and self.verified_at > timezone.localdate():
                errors["verified_at"] = "Verification date cannot be in the future."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def display_name(self, lang: str) -> str:
        return self.name_kk if lang == "kk" else self.name_ru


class LegalResource(models.Model):
    class PublishStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    title_kk = models.CharField(max_length=250)
    title_ru = models.CharField(max_length=250)
    official_url = models.URLField()
    language = models.CharField(
        max_length=8,
        choices=[("kk", "Қазақша"), ("ru", "Русский"), ("both", "Both")],
        default="both",
    )
    summary_kk = models.TextField(blank=True)
    summary_ru = models.TextField(blank=True)
    verified_at = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=PublishStatus.choices,
        default=PublishStatus.DRAFT,
        db_index=True,
    )
    is_draft_translation = models.BooleanField(
        default=False,
        help_text="Mark if translation still needs legal review.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-verified_at", "title_ru"]
        indexes = [
            models.Index(fields=["status", "language"]),
            models.Index(fields=["verified_at"]),
        ]

    def __str__(self):
        return self.title_ru

    def clean(self):
        if self.status == self.PublishStatus.PUBLISHED and not self.official_url:
            raise ValidationError({"official_url": "Published resources need a URL."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def display_title(self, lang: str) -> str:
        return self.title_kk if lang == "kk" else self.title_ru


class ContentPage(models.Model):
    """Editable public informational pages with verification metadata."""

    slug = models.SlugField(max_length=80, unique=True)
    title_kk = models.CharField(max_length=200)
    title_ru = models.CharField(max_length=200)
    body_kk = models.TextField(blank=True)
    body_ru = models.TextField(blank=True)
    source_url = models.URLField(blank=True)
    verified_at = models.DateField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["slug"]

    def __str__(self):
        return self.slug
