import io
import logging
import re
import time
import uuid

from django.conf import settings
from django.core.mail import EmailMessage
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from PIL import Image

from apps.catalog.models import LegalResource, Region, SupportService
from apps.core.digital_content import GUIDES


def _lang(request):
    return getattr(request, "stalking_lang", "kk")


def _ctx(request, **extra):
    return {"active": extra.pop("active", ""), **extra}


@require_GET
def home(request, lang=None):
    return render(request, "core/home.html", _ctx(request, active="home"))


@require_GET
def urgent(request, lang=None):
    from apps.core.i18n import t as tr

    lang_code = _lang(request)
    numbers = [
        {
            "num": "102",
            "name": tr("num_102_name", lang_code),
            "desc": tr("num_102_desc", lang_code),
            "emergency": True,
        },
        {
            "num": "112",
            "name": tr("num_112_name", lang_code),
            "desc": tr("num_112_desc", lang_code),
            "emergency": True,
        },
        {
            "num": "103",
            "name": tr("num_103_name", lang_code),
            "desc": tr("num_103_desc", lang_code),
            "emergency": True,
        },
        {
            "num": "111",
            "name": tr("num_111_name", lang_code),
            "desc": tr("num_111_desc", lang_code),
            "emergency": False,
        },
        {
            "num": "150",
            "name": tr("num_150_name", lang_code),
            "desc": tr("num_150_desc", lang_code),
            "emergency": False,
        },
    ]
    return render(
        request,
        "core/urgent.html",
        _ctx(request, active="urgent", numbers=numbers),
    )


@require_GET
def cover(request, lang=None):
    """Neutral cover page for quick exit — same project, no auto-redirect."""
    return render(request, "core/cover.html", _ctx(request, active="cover"))


@require_GET
def risk(request, lang=None):
    from apps.core.i18n import t as tr

    lang_code = _lang(request)
    questions = [
        {"id": "q1", "text": tr("risk_q1", lang_code), "urgent_if_yes": True, "medical_if_yes": False},
        {"id": "q2", "text": tr("risk_q2", lang_code), "urgent_if_yes": True, "medical_if_yes": True},
        {"id": "q3", "text": tr("risk_q3", lang_code), "urgent_if_yes": False, "medical_if_yes": False},
        {"id": "q4", "text": tr("risk_q4", lang_code), "urgent_if_yes": False, "medical_if_yes": False},
        {"id": "q5", "text": tr("risk_q5", lang_code), "urgent_if_yes": False, "medical_if_yes": False},
        {"id": "q6", "text": tr("risk_q6", lang_code), "urgent_if_yes": False, "medical_if_yes": False},
    ]
    return render(
        request,
        "core/risk.html",
        _ctx(request, active="risk", questions=questions),
    )


@require_GET
def plan(request, lang=None):
    return render(request, "core/plan.html", _ctx(request, active="plan"))


@require_GET
def evidence(request, lang=None):
    items = [
        "ev_messages",
        "ev_calls",
        "ev_dates",
        "ev_witnesses",
        "ev_medical",
        "ev_originals",
    ]
    return render(
        request,
        "core/evidence.html",
        _ctx(request, active="evidence", items=items),
    )


@require_GET
def legal(request, lang=None):
    lang_code = _lang(request)
    resources = LegalResource.objects.filter(status=LegalResource.PublishStatus.PUBLISHED)
    curated = [
        {
            "title_ru": "Электронное правительство РК — egov.kz",
            "title_kk": "ҚР электрондық үкіметі — egov.kz",
            "url": "https://egov.kz/",
            "verified": "2026-10-13",
            "note_ru": "Официальный портал госуслуг. Конкретные статьи УК/КоАП здесь не цитируются без отдельной проверки.",
            "note_kk": "Мемлекеттік қызметтердің ресми порталы. Нақты ҚК/ӘҚБтК баптары бөлек тексерусіз келтірілмейді.",
        },
        {
            "title_ru": "Единый портал госорганов — gov.kz",
            "title_kk": "Мемлекеттік органдардың бірыңғай порталы — gov.kz",
            "url": "https://www.gov.kz/",
            "verified": "2026-10-13",
            "note_ru": "Официальные материалы ведомств. Перед подачей заявления сверьтесь с актуальным текстом.",
            "note_kk": "Ведомстволардың ресми материалдары. Өтініш бермес бұрын өзекті мәтінді салыстырыңыз.",
        },
        {
            "title_ru": "Информация о номере 112 (egov.kz)",
            "title_kk": "112 нөмірі туралы ақпарат (egov.kz)",
            "url": "https://egov.kz/cms/en/articles/emergency_number_112",
            "verified": "2026-10-13",
            "note_ru": "Подтверждает 112, 101, 102, 103, 104.",
            "note_kk": "112, 101, 102, 103, 104 растайды.",
        },
        {
            "title_ru": "Контакт-центр 111 (gov4c.kz)",
            "title_kk": "111 байланыс орталығы (gov4c.kz)",
            "url": "https://gov4c.kz/en/about/kontakt-tsentr-111/",
            "verified": "2026-10-13",
            "note_ru": "Права семьи, женщин и детей; круглосуточная поддержка.",
            "note_kk": "Отбасы, әйелдер және балалар құқықтары; тәулік бойы қолдау.",
        },
    ]
    return render(
        request,
        "core/legal.html",
        _ctx(
            request,
            active="legal",
            curated=curated,
            db_resources=resources,
            lang_code=lang_code,
        ),
    )


@require_GET
def digital(request, lang=None):
    return render(
        request,
        "core/digital.html",
        _ctx(request, active="digital", guides=GUIDES),
    )


@require_GET
def resources(request, lang=None):
    lang_code = _lang(request)
    region_slug = request.GET.get("region", "").strip()
    service_type = request.GET.get("type", "").strip()
    regions = Region.objects.filter(is_active=True)
    qs = SupportService.objects.filter(
        status=SupportService.PublishStatus.PUBLISHED
    ).select_related("region")
    if region_slug:
        qs = qs.filter(region__slug=region_slug)
    if service_type:
        qs = qs.filter(service_type=service_type)
    from apps.core.i18n import t as tr

    type_labels = {
        "crisis": tr("st_crisis", lang_code),
        "legal": tr("st_legal", lang_code),
        "psych": tr("st_psych", lang_code),
        "hotline": tr("st_hotline", lang_code),
        "other": tr("st_other", lang_code),
    }
    localized_types = [
        (val, type_labels.get(val, label))
        for val, label in SupportService.ServiceType.choices
    ]

    return render(
        request,
        "core/resources.html",
        _ctx(
            request,
            active="resources",
            regions=regions,
            services=qs,
            selected_region=region_slug,
            selected_type=service_type,
            service_types=localized_types,
            lang_code=lang_code,
        ),
    )


@require_GET
def assistant_page(request, lang=None):
    return render(
        request, "core/assistant.html", _ctx(request, active="assistant")
    )


@require_GET
def bodyguard(request, lang=None):
    return render(
        request, "core/bodyguard.html", _ctx(request, active="bodyguard")
    )


@require_GET
def quest(request, lang=None):
    return render(
        request, "core/quest.html", _ctx(request, active="quest")
    )


@require_GET
def cleaner(request, lang=None):
    return render(
        request, "core/cleaner.html", _ctx(request, active="cleaner")
    )


@require_http_methods(["GET", "POST"])
def help_request(request, lang=None):
    from apps.core.i18n import t as tr

    lang_code = _lang(request)
    recipient_email = getattr(settings, "HELP_REQUEST_EMAIL", "").strip()
    is_enabled = bool(recipient_email)

    if request.method == "GET":
        return render(
            request,
            "core/help_request.html",
            _ctx(
                request,
                active="help_request",
                is_enabled=is_enabled,
                lang_code=lang_code,
            ),
        )

    # POST processing
    if not is_enabled:
        return render(
            request,
            "core/help_request.html",
            _ctx(
                request,
                active="help_request",
                is_enabled=False,
                error_msg=tr("help_disabled_title", lang_code),
                lang_code=lang_code,
            ),
            status=403,
        )

    # 1. Anti-spam honeypot check (hidden input 'website_url_check')
    honeypot = request.POST.get("website_url_check", "").strip()
    if honeypot:
        # Silently pretend success so automated bots do not adapt
        return render(
            request,
            "core/help_request.html",
            _ctx(
                request,
                active="help_request",
                is_enabled=True,
                success=True,
                lang_code=lang_code,
            ),
        )

    # 2. Rate limiting (in-session timestamps)
    rate_limit = getattr(settings, "HELP_REQUEST_RATE_LIMIT", 5)
    now = time.time()
    history = request.session.get("help_requests_sent", [])
    recent = [ts for ts in history if now - ts < 3600]
    if len(recent) >= rate_limit:
        error_msg = (
            "Тым көп сұрау жіберілді. Біраз уақыттан соң қайталап көріңіз."
            if lang_code == "kk"
            else "Слишком много запросов. Попробуйте позже."
        )
        return render(
            request,
            "core/help_request.html",
            _ctx(
                request,
                active="help_request",
                is_enabled=True,
                error_msg=error_msg,
                lang_code=lang_code,
            ),
            status=429,
        )

    # 3. Message validation (mandatory)
    message = request.POST.get("message", "").strip()
    if not message:
        error_msg = (
            "Хабарлама мәтіні міндетті."
            if lang_code == "kk"
            else "Текст сообщения обязателен."
        )
        return render(
            request,
            "core/help_request.html",
            _ctx(
                request,
                active="help_request",
                is_enabled=True,
                error_msg=error_msg,
                lang_code=lang_code,
            ),
            status=400,
        )
    if len(message) < 10:
        error_msg = (
            "Хабарлама тым қысқа (кемінде 10 таңба болуы қажет)."
            if lang_code == "kk"
            else "Сообщение слишком короткое (не менее 10 символов)."
        )
        return render(
            request,
            "core/help_request.html",
            _ctx(
                request,
                active="help_request",
                is_enabled=True,
                error_msg=error_msg,
                lang_code=lang_code,
            ),
            status=400,
        )
    if len(message) > 5000:
        error_msg = (
            "Хабарлама тым ұзын (ең көбі 5000 таңба)."
            if lang_code == "kk"
            else "Сообщение слишком длинное (максимум 5000 символов)."
        )
        return render(
            request,
            "core/help_request.html",
            _ctx(
                request,
                active="help_request",
                is_enabled=True,
                error_msg=error_msg,
                lang_code=lang_code,
            ),
            status=400,
        )

    # 4. Optional contact info (sanitized, truncated to 150 chars)
    contact = request.POST.get("contact", "").strip()[:150]

    # 5. Attachment handling (optional, with Pillow validation & EXIF stripping)
    clean_attachment = None
    clean_filename = None
    clean_mime = None
    uploaded_file = request.FILES.get("attachment")
    if uploaded_file:
        if uploaded_file.size > 5 * 1024 * 1024:
            error_msg = (
                "Тіркелген файл 5 МБ-тан аспауы тиіс."
                if lang_code == "kk"
                else "Прикреплённый файл не должен превышать 5 МБ."
            )
            return render(
                request,
                "core/help_request.html",
                _ctx(
                    request,
                    active="help_request",
                    is_enabled=True,
                    error_msg=error_msg,
                    lang_code=lang_code,
                ),
                status=400,
            )

        raw_bytes = uploaded_file.read()
        try:
            Image.MAX_IMAGE_PIXELS = 10_000_000
            probe_img = Image.open(io.BytesIO(raw_bytes))
            probe_img.verify()

            img = Image.open(io.BytesIO(raw_bytes))
            raw_format = (img.format or "").upper()
            if raw_format not in {"JPEG", "PNG", "WEBP"}:
                raise ValueError("Unsupported format")

            clean_io = io.BytesIO()
            save_format = "JPEG" if raw_format == "JPEG" else ("PNG" if raw_format == "PNG" else "WEBP")
            if save_format == "JPEG" and img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # Save clean image without any EXIF/GPS metadata
            img.save(clean_io, format=save_format, quality=90)
            clean_attachment = clean_io.getvalue()
            clean_ext = "jpg" if save_format == "JPEG" else save_format.lower()
            clean_filename = f"evidence_{uuid.uuid4().hex[:8]}.{clean_ext}"
            clean_mime = f"image/{clean_ext}"
        except Exception:
            error_msg = (
                "Тек жарамды сурет файлдары (JPEG, PNG, WEBP) қабылданады."
                if lang_code == "kk"
                else "Принимаются только корректные изображения (JPEG, PNG, WEBP)."
            )
            return render(
                request,
                "core/help_request.html",
                _ctx(
                    request,
                    active="help_request",
                    is_enabled=True,
                    error_msg=error_msg,
                    lang_code=lang_code,
                ),
                status=400,
            )

    # 6. Compose and send plain text email
    subject = "[Stalking-AI] Жаңа анонимді көмек сұрауы / Новое обращение"
    email_body = (
        "Stalking-AI платформасынан жаңа көмек сұрауы келіп түсті.\n"
        "==========================================================\n\n"
        f"Уақыты (UTC): {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"Кері байланыс дерегі: {contact if contact else '(Көрсетілмеген / Толық анонимді)'}\n\n"
        "--- ХАБАРЛАМА МӘТІНІ ---\n"
        f"{message}\n"
        "------------------------\n\n"
        f"Тіркелген сурет: {'Бар (метадеректер тазартылған)' if clean_attachment else 'Жоқ'}\n\n"
        "Қауіпсіздік ескертпесі:\n"
        "Бұл хат пайдаланушы өтініші бойынша тікелей жіберілді.\n"
        "Дерекқорда немесе жүйелік логтарда оның көшірмесі сақталмады (Zero-Persistence)."
    )

    try:
        reply_to_list = None
        if contact and "@" in contact:
            match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", contact)
            if match:
                reply_to_list = [match.group(0)]

        email = EmailMessage(
            subject=subject,
            body=email_body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "Stalking-AI <noreply@stalking-ai.org>"),
            to=[recipient_email],
            reply_to=reply_to_list,
        )
        if clean_attachment and clean_filename and clean_mime:
            email.attach(clean_filename, clean_attachment, clean_mime)

        email.send(fail_silently=False)

        recent.append(now)
        request.session["help_requests_sent"] = recent

        return render(
            request,
            "core/help_request.html",
            _ctx(
                request,
                active="help_request",
                is_enabled=True,
                success=True,
                lang_code=lang_code,
            ),
        )
    except Exception as e:
        logger = logging.getLogger("apps.core")
        logger.error("Help request email dispatch failed: %s", type(e).__name__)
        error_msg = (
            "Хатты жеткізу кезінде техникалық қате орын алды. Өтінішіңізді ресми байланыс нөмірлері арқылы жеткізуіңізді сұраймыз."
            if lang_code == "kk"
            else "Произошла техническая ошибка при отправке. Пожалуйста, воспользуйтесь официальными номерами помощи."
        )
        return render(
            request,
            "core/help_request.html",
            _ctx(
                request,
                active="help_request",
                is_enabled=True,
                error_msg=error_msg,
                lang_code=lang_code,
            ),
            status=500,
        )


@require_GET
def about(request, lang=None):
    return render(request, "core/about.html", _ctx(request, active="about"))


@require_POST
def set_language(request):
    lang = request.POST.get("lang", "kk")
    if lang not in {"kk", "ru"}:
        lang = "kk"
    # Redirect to same path under new language prefix
    next_path = request.POST.get("next", f"/{lang}/")
    # Strip existing lang prefix
    parts = next_path.strip("/").split("/")
    if parts and parts[0] in {"kk", "ru"}:
        parts = parts[1:]
    rest = "/".join(parts)
    target = f"/{lang}/{rest}/" if rest else f"/{lang}/"
    response = HttpResponseRedirect(target)
    response.set_cookie(
        "stalking_lang",
        lang,
        max_age=60 * 60 * 24 * 365,
        samesite="Lax",
        httponly=False,
        secure=request.is_secure(),
    )
    return response


@require_GET
def root_redirect(request):
    lang = request.COOKIES.get("stalking_lang", "kk")
    if lang not in {"kk", "ru"}:
        lang = "kk"
    return HttpResponseRedirect(f"/{lang}/")
