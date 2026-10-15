"""Seed official region names for filters. Does NOT create support services."""
from django.core.management.base import BaseCommand

from apps.catalog.models import Region

REGIONS = [
    ("astana", "Астана", "Астана"),
    ("almaty-city", "Алматы", "Алматы"),
    ("shymkent", "Шымкент", "Шымкент"),
    ("abay", "Абай облысы", "Абайская область"),
    ("akmola", "Ақмола облысы", "Акмолинская область"),
    ("aktobe", "Ақтөбе облысы", "Актюбинская область"),
    ("almaty", "Алматы облысы", "Алматинская область"),
    ("atyrau", "Атырау облысы", "Атырауская область"),
    ("east-kazakhstan", "Шығыс Қазақстан облысы", "Восточно-Казахстанская область"),
    ("zhambyl", "Жамбыл облысы", "Жамбылская область"),
    ("zhetisu", "Жетісу облысы", "Жетысуская область"),
    ("west-kazakhstan", "Батыс Қазақстан облысы", "Западно-Казахстанская область"),
    ("karaganda", "Қарағанды облысы", "Карагандинская область"),
    ("kostanay", "Қостанай облысы", "Костанайская область"),
    ("kyzylorda", "Қызылорда облысы", "Кызылординская область"),
    ("mangystau", "Маңғыстау облысы", "Мангистауская область"),
    ("pavlodar", "Павлодар облысы", "Павлодарская область"),
    ("north-kazakhstan", "Солтүстік Қазақстан облысы", "Северо-Казахстанская область"),
    ("turkistan", "Түркістан облысы", "Туркестанская область"),
    ("ulytau", "Ұлытау облысы", "Улытауская область"),
]


class Command(BaseCommand):
    help = "Seed Kazakhstan regions for catalog filters (no support centres)."

    def handle(self, *args, **options):
        created = 0
        for slug, name_kk, name_ru in REGIONS:
            _, was_created = Region.objects.update_or_create(
                slug=slug,
                defaults={
                    "name_kk": name_kk,
                    "name_ru": name_ru,
                    "is_active": True,
                },
            )
            if was_created:
                created += 1
        self.stdout.write(
            self.style.SUCCESS(
                f"Regions ready. Newly created: {created}. "
                "No support_services were invented."
            )
        )
