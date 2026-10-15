from django.conf import settings
from django.utils.deprecation import MiddlewareMixin


SUPPORTED = {"kk", "ru"}


class LanguageMiddleware(MiddlewareMixin):
    """Resolve language from URL prefix or cookie. Preference only — no PII."""

    def process_request(self, request):
        lang = None
        path = request.path
        for code in SUPPORTED:
            if path == f"/{code}" or path.startswith(f"/{code}/"):
                lang = code
                break
        if lang is None:
            cookie = request.COOKIES.get(settings.LANGUAGE_COOKIE_NAME, "")
            lang = cookie if cookie in SUPPORTED else "kk"
        request.stalking_lang = lang


class SecurityHeadersMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        response["Permissions-Policy"] = (
            "geolocation=(), camera=(), microphone=(), payment=()"
        )
        response["Cross-Origin-Opener-Policy"] = "same-origin"
        response["X-Content-Type-Options"] = "nosniff"
        response["Referrer-Policy"] = "same-origin"
        # No analytics / third-party scripts expected
        response["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "img-src 'self' data:; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        return response
