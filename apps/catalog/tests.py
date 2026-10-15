from datetime import date
from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.catalog.models import Region, SupportService


class CatalogTestCase(TestCase):
    def setUp(self):
        self.region = Region.objects.create(
            slug="almaty",
            name_kk="Алматы",
            name_ru="Алматы",
            is_active=True,
        )

    def test_support_service_validation_draft(self):
        service = SupportService(
            name_kk="Сынақ орталығы",
            name_ru="Тестовый центр",
            service_type=SupportService.ServiceType.CRISIS,
            region=self.region,
            phone="87271234567",
            source_name="gov.kz",
            source_url="https://gov.kz",
            verified_at=date.today(),
            status=SupportService.PublishStatus.DRAFT,
            contacts_verified=False,
            source_verified=False,
        )
        service.full_clean()
        service.save()
        self.assertEqual(SupportService.objects.count(), 1)

    def test_cannot_publish_unverified_service(self):
        service = SupportService(
            name_kk="Сынақ орталығы",
            name_ru="Тестовый центр",
            service_type=SupportService.ServiceType.CRISIS,
            region=self.region,
            phone="87271234567",
            source_name="gov.kz",
            source_url="https://gov.kz",
            verified_at=date.today(),
            status=SupportService.PublishStatus.PUBLISHED,
            contacts_verified=False,  # Unverified!
            source_verified=False,
        )
        with self.assertRaises(ValidationError):
            service.full_clean()

    def test_published_service_visible_in_resources(self):
        service = SupportService.objects.create(
            name_kk="Расталған орталық",
            name_ru="Проверенный центр",
            service_type=SupportService.ServiceType.CRISIS,
            region=self.region,
            phone="87271234567",
            source_name="gov.kz",
            source_url="https://gov.kz",
            verified_at=date.today(),
            status=SupportService.PublishStatus.PUBLISHED,
            contacts_verified=True,
            source_verified=True,
        )
        response = self.client.get("/kk/resources/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Расталған орталық")
