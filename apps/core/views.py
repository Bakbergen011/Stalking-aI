from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.http import require_GET, require_POST

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
