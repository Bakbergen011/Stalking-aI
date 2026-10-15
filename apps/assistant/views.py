"""
Gemini assistant — server-side only.
Does NOT store prompts, responses, or uploaded images in DB, logs (body), cookies, or files.
Images are processed in memory (RAM) and immediately discarded.
"""
from __future__ import annotations

import logging
import re
import time
from collections import defaultdict, deque
from threading import Lock

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger("apps.assistant")

_RATE_LOCK = Lock()
_RATE_BUCKETS: dict[str, deque] = defaultdict(deque)

SYSTEM_RU = """Ты — осторожный информационный и правовой консультант-помощник сайта Stalking (Казахстан).
Правила:
- Не заменяй полицию, врача, психолога или судебного юриста.
- Не определяй самостоятельно, кто окончательно виновен.
- Не выдумывай статьи законов. Опирайся на нормы законодательства РК (УК РК, КоАП РК, Закон о профилактике бытового насилия РК, защитное предписание).
- При непосредственной угрозе жизни кратко посоветуй звонить 102 или 112 (при травме — 103).
- Говори спокойно, эмпатично, на языке пользователя (казахский или русский).
- Если пользователь приложил скриншот сообщений, звонков или документа:
  1. Выдели суть угроз/слежки.
  2. Оцени уровень риска (Низкий, Умеренный, Высокий).
  3. Укажи возможную квалификацию по законам РК (например, ст. 115 УК РК — Угроза, ст. 147 УК РК — Нарушение неприкосновенности частной жизни, мелкое хулиганство, нарушение защитного предписания).
  4. Дай практический совет по фиксации доказательств (скриншот с датой, номером, ссылкой, нотариальный осмотр, подача в eOtinish).
- Если режим "statement" (составление заявления в полицию):
  Составь официальный проект заявления в Департамент/Управление полиции по РК с четкими реквизитами, фабулой, ссылками на законы РК и конкретной просьбой (принять меры, выдать защитное предписание, начать проверку).
"""

SYSTEM_KK = """Сен — Stalking сайтының (Қазақстан) сақтық ақпараттық және құқықтық кеңесші көмекшісісің.
Ережелер:
- Полицияны, дәрігерді, психологты немесе сот заңгерін толық алмастырма.
- Заң баптарын ойдан шығарма. ҚР заңнамасына (ҚР ҚК, ҚР ӘҚБтК, Тұрмыстық зорлық-зомбылықтың алдын алу туралы заң, қорғау нұсқамасы) сүйен.
- Тікелей қауіп төнгенде қысқаша 102 немесе 112-ге (жарақатта — 103) қоңырау шалуды ұсын.
- Тыныш, жанашыр, түсінікті тілде сөйле (қазақ немесе орыс тілінде).
- Егер пайдаланушы хат алмасудың, қоңыраулардың немесе құжаттың скриншотын жүктесе:
  1. Қауіп пен қудалаудың мән-жайын қысқаша анықта.
  2. Тәуекел деңгейін көрсет (Төмен, Орташа, Жоғары).
  3. ҚР заңнамасы бойынша қандай баптарға жататынын түсіндір (мыс: ҚР ҚК 115-бабы — Қорқыту, 147-бабы — Жеке өмірге қол сұғушылық, ұсақ бұзақылық, қорғау нұсқамасын бұзу).
  4. Дәлелді қалай дұрыс сақтау керектігін айт (уақыты, телефон нөмірі, URL, eOtinish арқылы жіберу немесе нотариалды куәландыру).
- Егер режим "statement" (полицияға арыз жазу) болса:
  ҚР Полиция басқармасына арналған ресми, сауатты арыз жобасын құрастырып бер: кімге, кімнен, оқиға сипаттамасы, заң нормалары және нақты сұрау (тексеру жүргізу, қорғау нұсқамасын шығару, жауапқа тарту).
"""

ALLOWED_MIMES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
}

MAX_FILE_BYTES = 5 * 1024 * 1024  # 5MB


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


@csrf_exempt
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
    mode = request.POST.get("mode", "chat")
    uploaded_file = request.FILES.get("image") or request.FILES.get("file")

    if not message and not uploaded_file:
        msg = (
            "Хабарлама немесе құжат/скриншот бос болмауы керек."
            if lang == "kk"
            else "Сообщение или файл/скриншот не должны быть пустыми."
        )
        return _json_error(msg, status=400, code="bad_input")

    max_chars = settings.GEMINI_MAX_INPUT_CHARS
    if len(message) > max_chars:
        msg = (
            "Хабарлама тым ұзын."
            if lang == "kk"
            else "Сообщение слишком длинное."
        )
        return _json_error(msg, status=400, code="bad_input")

    key = _client_key(request)
    if _rate_limited(key):
        msg = (
            "Сұрау тым жиі. Біраз күтіңіз."
            if lang == "kk"
            else "Слишком частые запросы. Подождите немного."
        )
        return _json_error(msg, status=429, code="rate")

    system = SYSTEM_KK if lang == "kk" else SYSTEM_RU

    # Prepare prompt parts
    prompt_instruction = ""
    if mode == "statement":
        prompt_instruction = (
            "ҚР Полиция органдарына арналған ресми арыз/өтініш жобасын құрастыр. "
            if lang == "kk"
            else "Составь официальный проект заявления в полицию РК на основе указанных данных. "
        )
    elif mode == "threat_analysis":
        prompt_instruction = (
            "Жүктелген скриншот/құжат пен хабарламаны толық талдап, қауіп деңгейін және заңдық бағасын бер. "
            if lang == "kk"
            else "Проанализируй приложенный скриншот/документ, определи уровень угрозы и дай правовую оценку. "
        )
    elif mode == "bodyguard_scan":
        prompt_instruction = (
            "Сен — AI Digital Bodyguard цифрлық қорғаныс көмекшісісің. "
            "Пайдаланушы берген мәтін немесе скриншот бойынша жеке деректердің (геолокация, үй, жұмыс орны, байланыс ақпараты, көлік нөмірі т.б.) жария болу қаупін талдап, нақты кеңестер бер. "
            "МАҢЫЗДЫ ЕРЕЖЕ: Анонимді аккаунттарға 'сталкер' деген диагноз қойма және адам мінез-құлқын болжама. Белгісіз парақшалар немесе сторис қаралымдары арқылы нақты адамды анықтау мүмкін емес екенін міндетті түрде ескерт."
            if lang == "kk"
            else
            "Ты — консультант AI Digital Bodyguard по цифровой защите. "
            "Проанализируй предоставленный текст или скриншот на предмет риска утечки личных данных (геолокация, жильё, работа/учёба, контакты, авто, документы) и дай практические советы по минимизации следа. "
            "ВАЖНОЕ ПРАВИЛО: Не клейми анонимные аккаунты как «сталкер» и не ставь диагнозов поведению людей. Обязательно подчеркни, что по анонимным профилям или просмотрам сторис невозможно однозначно установить личность."
        )
    elif mode == "quest_hint":
        prompt_instruction = (
            "Сен — OSINT & Cyber-Detective білім беру квестінің мейірімді AI Менторысың. "
            "Бұл ойын — 100% ойдан шығарылған оқу кейсі. Ешқашан нақты адамдарды доксинг жасауға немесе аңдуға жол берме. "
            "Қазір ойыншыға тура жауапты айтып қойма! Ойланту үшін жұмбақ/ишара (подсказка) беріп, фишинг доменін, эмоциялық қысымды немесе метадеректерді байқауға бағытта."
            if lang == "kk"
            else
            "Ты — дружелюбный AI Ментор обучающего квеста OSINT & Cyber-Detective. "
            "Все кейсы строго вымышлены. Никакого доксинга или поиска реальных людей. "
            "Не выдавай готовый ответ! Дай тонкую подсказку (ишару), чтобы направить игрока проверить домен, признаки фишинга или метаданные самостоятельно."
        )
    elif mode == "quest_generate":
        prompt_instruction = (
            "Сен — киберқауіпсіздік бойынша квест құрастырушысың. "
            "Тек ойдан шығарылған кейіпкерлер (мысалы, 'Айман', 'Диас', 'fictional_service_kz') және жалған фишингтік сілтемелер негізінде жаңа 3-қадамдық оқу сценарийін ұсын: "
            "1. Жағдайдың сипаттамасы (легенда) және күдікті деректер. "
            "2. Ойыншыға арналған сұрақ және 3 жауап нұсқасы (біреуі дұрыс). "
            "3. Түсіндірме және үйренген қауіпсіздік қағидасы. "
            "ҚАТАҢ ТЫЙЫМ: Нақты адамдар, нақты телефондар немесе нақты аккаунттар аталмасын!"
            if lang == "kk"
            else
            "Сгенерируй новый 3-шаговый учебный сценарий по кибербезопасности строго на вымышленных данных (вымышленные персонажи вроде 'Айман', 'Диас', фейковые фишинговые домены). "
            "1. Описание легенды и подозрительные улики. "
            "2. Вопрос для игрока и 3 варианта ответа (один верный). "
            "3. Разбор и усвоенное правило цифровой гигиены. "
            "СТРОГИЙ ЗАПРЕТ: Никаких реальных людей, номеров или действующих аккаунтов!"
        )
    elif mode == "cleaner_request":
        prompt_instruction = (
            "ҚР 'Дербес деректер және оларды қорғау туралы' Заңына (24-бап) және жалпы құпиялылық стандарттарына (GDPR) сәйкес, "
            "пайдаланушының көрсетілген сайттан немесе сервистен өзі туралы ақпаратты (аккаунтты, фотоны, телефонды) өшіруді талап ететін ресми өтініш үлгісін құрастыр. "
            "Мәтінде [Аты-жөніңіз], [Email/Телефон], [Сервис атауы] сияқты толтырылатын орындарды нақты белгіле. "
            "Соңында бұл заңгерлік кепілдік емес екенін, мәтінді тексеріп өзі жолдауы керектігін ескерт."
            if lang == "kk"
            else
            "Составь официальный шаблон запроса на отзыв согласия и удаление персональных данных на основе Закона РК «О персональных данных и их защите» (ст. 24) и стандартов приватности. "
            "Используй четкие плейсхолдеры: [ФИО], [Email/Телефон], [Название сервиса]. "
            "В конце напомни, что шаблон не является исчерпывающей юридической гарантией и его необходимо проверить перед самостоятельной отправкой."
        )

    full_text_prompt = f"{prompt_instruction}\n{message}".strip() if prompt_instruction else message

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        contents = []

        if uploaded_file:
            content_type = uploaded_file.content_type or "image/jpeg"
            if content_type not in ALLOWED_MIMES:
                msg = (
                    "Қолдау көрсетілмейтін файл түрі. Тек PNG, JPG, WEBP немесе PDF жүктеңіз."
                    if lang == "kk"
                    else "Неподдерживаемый тип файла. Загружайте PNG, JPG, WEBP или PDF."
                )
                return _json_error(msg, status=400, code="bad_file_type")

            if uploaded_file.size > MAX_FILE_BYTES:
                msg = (
                    "Файл көлемі 5MB-тан аспауы тиіс."
                    if lang == "kk"
                    else "Размер файла не должен превышать 5МБ."
                )
                return _json_error(msg, status=400, code="file_too_large")

            file_bytes = uploaded_file.read()
            contents.append(types.Part.from_bytes(data=file_bytes, mime_type=content_type))

        if full_text_prompt:
            contents.append(full_text_prompt)
        elif not contents:
            contents.append("Талдау жасаңыз / Проанализируйте приложенный материал.")

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=0.35,
                max_output_tokens=2048,
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
        return JsonResponse({"ok": True, "reply": text, "mode": mode})
    except Exception as e:
        logger.warning("Gemini request failed: %s", e, exc_info=True)
        msg = (
            "AI қатесі. Сайттың басқа бөлімдері жұмыс істейді."
            if lang == "kk"
            else "Ошибка AI. Остальные разделы сайта работают."
        )
        return _json_error(msg, status=502, code="api_error")


@csrf_exempt
@require_POST
def gemini_status(request):
    """Lightweight status for UI — no secrets."""
    return JsonResponse(
        {
            "configured": bool(settings.GEMINI_API_KEY),
            "model_set": bool(settings.GEMINI_MODEL),
        }
    )
