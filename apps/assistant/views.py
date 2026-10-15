"""
Gemini assistant — server-side only.
Does NOT store prompts/responses in DB, logs (body), cookies, or files.
"""
from __future__ import annotations

import logging
import re
import time
from collections import defaultdict, deque
from threading import Lock

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_POST

logger = logging.getLogger("apps.assistant")

_RATE_LOCK = Lock()
_RATE_BUCKETS: dict[str, deque] = defaultdict(deque)

SYSTEM_RU = """Ты — осторожный информационный помощник сайта Stalking (Казахстан).
Правила:
- Не заменяй полицию, врача, психолога или юриста.
- Не определяй, кто прав или виновен.
- Не диагностируй, не обещай юридический исход и не гарантируй безопасность.
- Не выдумывай горячие линии, статьи законов и региональные центры. Если не уверен — направь к 102/112/103/111/150 или официальным порталам egov.kz / gov.kz.
- При непосредственной угрозе кратко посоветуй звонить 102 или 112 (при травме — 103) и не затягивай разговор.
- Говори спокойно, без обвинений, на языке пользователя (казахский или русский).
- Не проси имя, адрес, телефон, пароли, коды, геолокацию или доказательства.
"""

SYSTEM_KK = """Сен — Stalking сайтының (Қазақстан) сақтық ақпараттық көмекшісісің.
Ережелер:
- Полицияны, дәрігерді, психологты немесе заңгерді алмастырма.
- Кімнің дұрыс немесе кінәлі екенін анықтама.
- Диагноз қойма, заң нәтижесін уәде етпе және қауіпсіздікті кепілдеме.
- Жедел нөмірлерді, заң баптарын және өңірлік орталықтарды ойдан шығарма. Сенімді болмасаң — 102/112/103/111/150 немесе egov.kz / gov.kz-ке бағытта.
- Тікелей қауіпте қысқаша 102 немесе 112-ге (жарақатта — 103) қоңырау шалуды ұсын және сөйлесуді созба.
- Тыныш, айыптаусыз сөйле; пайдаланушы тілінде (қазақша немесе орысша).
- Аты-жөнін, мекенжайды, телефонды, құпия сөзді, кодтарды, геолокацияны немесе дәлелдерді сұрама.
"""

SENSITIVE_HINT = re.compile(
    r"(password|пароль|құпия\s*сөз|otp|смс[- ]?код|sms[- ]?code|"
    r"\b\d{12}\b|\b\+?7\d{10}\b)",
    re.IGNORECASE,
)


def _client_key(request) -> str:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    return (request.META.get("REMOTE_ADDR") or "unknown")[:64]


def _rate_limited(key: str) -> bool:
    limit = settings.GEMINI_RATE_LIMIT_PER_MINUTE
    now = time.time()
    with _RATE_LOCK:
        bucket = _RATE_BUCKETS[key]
        while bucket and now - bucket[0] > 60:
            bucket.popleft()
        if len(bucket) >= limit:
            return True
        bucket.append(now)
    return False


def _json_error(message: str, status: int = 400, **extra):
    payload = {"ok": False, "error": message, **extra}
    return JsonResponse(payload, status=status)


@require_POST
def gemini_chat(request):
    lang = request.POST.get("lang") or getattr(request, "stalking_lang", "kk")
    if lang not in {"kk", "ru"}:
        lang = "kk"

    if not settings.GEMINI_API_KEY:
        msg = (
            "AI қазір қолжетімсіз (кілт орнатылмаған). Басқа бөлімдер жұмыс істейді."
            if lang == "kk"
            else "AI сейчас недоступен (ключ не задан). Остальные разделы работают."
        )
        return _json_error(msg, status=503, code="no_key")

    consent = request.POST.get("consent", "") == "1"
    if not consent:
        msg = (
            "Алдымен келісімді растаңыз."
            if lang == "kk"
            else "Сначала подтвердите согласие."
        )
        return _json_error(msg, status=400, code="no_consent")

    message = (request.POST.get("message") or "").strip()
    max_chars = settings.GEMINI_MAX_INPUT_CHARS
    if not message or len(message) > max_chars:
        msg = (
            "Хабарлама бос немесе тым ұзын."
            if lang == "kk"
            else "Сообщение пустое или слишком длинное."
        )
        return _json_error(msg, status=400, code="bad_input")

    if SENSITIVE_HINT.search(message):
        msg = (
            "Жеке немесе құпия деректер байқалды. Өшіріп, жалпы сұрақ қойыңыз. Қауіп болса — 102/112."
            if lang == "kk"
            else "Обнаружены личные или секретные данные. Удалите их и задайте общий вопрос. При угрозе — 102/112."
        )
        return _json_error(msg, status=400, code="sensitive")

    key = _client_key(request)
    if _rate_limited(key):
        msg = (
            "Сұрау тым жиі. Біраз күтіңіз."
            if lang == "kk"
            else "Слишком частые запросы. Подождите немного."
        )
        return _json_error(msg, status=429, code="rate")

    system = SYSTEM_KK if lang == "kk" else SYSTEM_RU

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=message,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.4,
                max_output_tokens=1024,
                # Do not weaken safety filters
            ),
        )
        text = (getattr(response, "text", None) or "").strip()
        if not text:
            msg = (
                "AI жауап қайтара алмады. Кейінірек көріңіз."
                if lang == "kk"
                else "AI не смог сформировать ответ. Попробуйте позже."
            )
            return _json_error(msg, status=502, code="empty")
        return JsonResponse({"ok": True, "reply": text})
    except Exception as e:
        # Do not log user message content
        logger.warning("Gemini request failed: %s", e, exc_info=True)
        msg = (
            "AI қатесі. Сайттың басқа бөлімдері жұмыс істейді."
            if lang == "kk"
            else "Ошибка AI. Остальные разделы сайта работают."
        )
        return _json_error(msg, status=502, code="api_error")


@require_POST
def gemini_status(request):
    """Lightweight status for UI — no secrets."""
    return JsonResponse(
        {
            "configured": bool(settings.GEMINI_API_KEY),
            "model_set": bool(settings.GEMINI_MODEL),
        }
    )
