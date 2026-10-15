from django.conf import settings

from apps.core.i18n import all_for_lang


def site_context(request):
    lang = getattr(request, "stalking_lang", "kk")
    return {
        "lang": lang,
        "t": all_for_lang(lang),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "other_lang": "ru" if lang == "kk" else "kk",
    }
