/**
 * OSINT & Cyber-Detective Quest
 * Safe educational gamified scenarios based purely on fictional data.
 * Zero real-world tracking, zero doxxing.
 */
(function () {
  'use strict';

  var root = document.getElementById('quest-app');
  if (!root) return;

  var lang = root.getAttribute('data-lang') || 'kk';
  var isKk = lang === 'kk';

  // Pre-built Fictional Scenarios (100% offline ready)
  var SCENARIOS = {
    1: {
      title: isKk ? "Кейс #1: Шұғыл посылка және жалған KazPost хабарламасы" : "Кейс #1: Срочная посылка и фейковое SMS от KazPost",
      stage1: {
        clueHtml: isKk
          ? '<div class="sms-mock">' +
            '<div class="sms-sender">SMS: +7 (700) 000-00-00 (беймәлім нөмір)</div>' +
            '<div class="sms-body">«Құрметті клиент! Сіздің атыңызға KazPost сәлемдемесі келді. Мекенжай қате көрсетілген! Сәлемдеме жойылмас үшін 2 сағат ішінде мына сілтеме бойынша деректеріңізді растаңыз: <strong>http://kazpost-track-delivery.online/verify/login</strong>»</div>' +
            '</div>'
          : '<div class="sms-mock">' +
            '<div class="sms-sender">SMS: +7 (700) 000-00-00 (неизвестный номер)</div>' +
            '<div class="sms-body">«Уважаемый клиент! На ваше имя поступила посылка KazPost. Неверно указан адрес! Во избежание утилизации подтвердите данные в течение 2 часов: <strong>http://kazpost-track-delivery.online/verify/login</strong>»</div>' +
            '</div>',
        question: isKk
          ? "Осы хабарламадағы ең басты фишинг белгілері қандай?"
          : "Какие главные признаки фишинга присутствуют в этом сообщении?",
        options: isKk
          ? [
              { text: "Сілтеме ресми сайтқа емес (ресми: post.kz немесе kazpost.kz), және 2 сағаттық эмоциялық асықтыру бар.", correct: true },
              { text: "Хабарлама қазақ тілінде жазылғандықтан бұл қауіпті.", correct: false },
              { text: "Мұнда ешқандай қауіп жоқ, бірден сілтемеге өтіп парольді енгізу керек.", correct: false }
            ]
          : [
              { text: "Ссылка ведёт на поддельный домен (официальный: post.kz / kazpost.kz), плюс создаётся искусственная спешка (2 часа).", correct: true },
              { text: "Опасность только в том, что SMS пришло днём, а не ночью.", correct: false },
              { text: "Опасности нет, нужно сразу перейти по ссылке и ввести данные для подтверждения.", correct: false }
            ],
        explanation: isKk
          ? "Дұрыс! Фишингтің негізгі айласы — адамды қорқыту («2 сағатта жойылады») және ресми атауға ұқсас жалған домендерді (kazpost-track-delivery.online) пайдалану. Ресми KazPost домендері: post.kz және kazpost.kz."
          : "Верно! Главный приём фишеров — запугивание и спешка («сгорит через 2 часа»), а также использование созвучных фейковых доменов. Официальные сайты Казпочты — post.kz и kazpost.kz.",
        principles: isKk
          ? [
              "Сілтеменің доменін тексеріңіз: ресми ме, әлде қосымша сөздері бар жалған ба?",
              "Эмоциялық қысымға («шұғыл», «аккаунт бұғатталады», «2 сағат ішінде») ермеңіз.",
              "Күдікті сілтемені баспай, ресми қосымшаны (Post.kz) өзіңіз ашып тексеріңіз."
            ]
          : [
              "Всегда проверяйте доменное имя: не добавлены ли лишние слова и дефисы?",
              "Не поддавайтесь эмоциональному давлению и требованию срочности.",
              "Не переходите по ссылкам из SMS — открывайте официальное приложение самостоятельно."
            ]
      }
    },
    2: {
      title: isKk ? "Кейс #2: Абайсызда жарияланған сторис пен гео-деректер" : "Кейс #2: Неосторожная сторис и утечка геолокации",
      stage1: {
        clueHtml: isKk
          ? '<div class="post-mock">' +
            '<div class="post-author">@ayman_life_demo (Ойдан шығарылған ашық аккаунт)</div>' +
            '<div class="post-image-placeholder">📸 Фото: «Ақыры өз пәтеріме де жеттім, демалыс басталды!»<br><span class="highlight-tag">Фонда: Көше атауы «көш. Абай 154», аулада тұрған көлік нөмірі «777 XYZ 02» және бірінші қабаттағы дүкен маңдайшасы көрініп тұр.</span></div>' +
            '</div>'
          : '<div class="post-mock">' +
            '<div class="post-author">@ayman_life_demo (Вымышленный открытый аккаунт)</div>' +
            '<div class="post-image-placeholder">📸 Фото: «Наконец-то добралась до своей квартиры, выходные!»<br><span class="highlight-tag">На фоне: Табличка «ул. Абая 154», госномер машины во дворе «777 XYZ 02» и вывеска магазина на первом этаже.</span></div>' +
            '</div>',
        question: isKk
          ? "Бұл фото арқылы бейтаныс адамдар қандай қауіпті мәліметті біліп қоюы мүмкін?"
          : "Какую критически важную информацию раскрывает эта публикация?",
        options: isKk
          ? [
              { text: "Нақты тұрғылықты үйдің мекенжайын, ауласын және адамның дәл қазір үйде екенін.", correct: true },
              { text: "Тек телефон маркасын ғана.", correct: false },
              { text: "Бұл жерде ешқандай жеке дерек жоқ, мұндай фотоны бәрі сала береді.", correct: false }
            ]
          : [
              { text: "Точный адрес дома, подъезд/двор и факт нахождения человека дома прямо сейчас.", correct: true },
              { text: "Только марку телефона, на который сделан снимок.", correct: false },
              { text: "Никаких рисков нет, это обычная бытовая фотография.", correct: false }
            ],
        explanation: isKk
          ? "Өте дұрыс! Көше тақтайшасы мен танымал дүкен арқылы үйді оңай табуға болады, ал «үйге жеттім» деген сөз нақты осы уақытта сол жерде екеніңізді білдіреді."
          : "Совершенно верно! Адресная табличка в сочетании с вывеской магазина позволяет однозначно установить жильё, а подпись в реальном времени выдаёт ваше присутствие дома.",
        principles: isKk
          ? [
              "Үй, пәтер, подъезд немесе терезе көрінісін жариялағанда көше атауларын жауып қойыңыз.",
              "Нақты уақытта (real-time) фото салмаңыз — орыннан кеткеннен кейін ғана жариялаңыз (time-delay).",
              "Өз көлігіңіздің немесе жақындарыңыздың мемлекеттік нөмірлерін бұлдыратыңыз (blur)."
            ]
          : [
              "Скрывайте адресные таблички, ориентиры и виды из окон жилья.",
              "Публикуйте истории с временной задержкой (после того, как покинули локацию).",
              "Замазывайте госномера автомобилей и документы перед публикацией."
            ]
      }
    },
    3: {
      title: isKk ? "Кейс #3: «Парақшаңызды кім аңдып жүр?» деген жалған бот" : "Кейс #3: Фейковый бот «Кто шпионит за вашей страницей»",
      stage1: {
        clueHtml: isKk
          ? '<div class="bot-mock">' +
            '<div class="bot-head">🤖 Telegram Bot: «Stalker-Spy-Viewer-Bot»</div>' +
            '<div class="bot-body">«Сіздің парақшаңызды соңғы 24 сағатта кім қарағанын білгіңіз келе ме? Біздің жүйе барлық анонимді қаралымдарды ашады! Бастау үшін: Instagram логиніңіз бен телефоныңызға келген SMS растау кодын жіберіңіз!»</div>' +
            '</div>'
          : '<div class="bot-mock">' +
            '<div class="bot-head">🤖 Telegram Bot: «Stalker-Spy-Viewer-Bot»</div>' +
            '<div class="bot-body">«Хотите узнать, кто следит за вашей страницей? Наша программа раскрывает всех анонимных гостей! Для входа отправьте логин Instagram и SMS-код подтверждения, который пришёл на телефон!»</div>' +
            '</div>',
        question: isKk
          ? "Бұл бот не істеуге тырысып жатыр және дұрыс қауіпсіз шешім қандай?"
          : "Что на самом деле делает этот сервис, и как правильно поступить?",
        options: isKk
          ? [
              { text: "Бұл — аккаунтты тартып алуға (ұрлауға) арналған алаяқтық. Ешқашан SMS растау кодын бөгде боттарға беруге болмайды.", correct: true },
              { text: "Бұл пайдалы қызмет, SMS кодын енгізіп сталкердің кім екенін білу керек.", correct: false },
              { text: "Ботты достарыңызға жіберіп, оларға да тексеруге ұсыну керек.", correct: false }
            ]
          : [
              { text: "Это попытка кражи аккаунта через перехват 2FA. Никогда нельзя передавать SMS-коды сторонним сервисам.", correct: true },
              { text: "Это полезный сервис, нужно ввести код из SMS и разоблачить следящего.", correct: false },
              { text: "Переслать бота друзьям, чтобы они тоже проверили гостей.", correct: false }
            ],
        explanation: isKk
          ? "Дұрыс! Әлеуметтік желілерде «кім қарады» деген нақты дерек үшінші тарапқа берілмейді. Мұндай боттар адамдардың сенгіштігін пайдаланып, 2FA растау кодын алып, аккаунтты ұрлайды."
          : "Верно! Соцсети не передают данные о «гостях профиля» сторонним сервисам. Под видом «разоблачения сталкеров» боты выманивают одноразовые коды 2FA и крадут аккаунты.",
        principles: isKk
          ? [
              "SMS арқылы келген екі факторлы (2FA) құпия кодтарды ЕШКІМГЕ бермеңіз.",
              "«Қонақтарды көрсетеді» немесе «аңдушыны анықтайды» деген қосымшалардың 100% алаяқтық екенін есте сақтаңыз.",
              "Аккаунтыңызды қорғау үшін үшінші тарап қолданбаларының рұқсаттарын үнемі тексеріп, күдіктілерін өшіріңіз."
            ]
          : [
              "Никогда и никому не сообщайте коды двухфакторной аутентификации из SMS.",
              "Сервисы «гости страницы» или «детектор сталкеров» — это 100% фишинг и вредоносное ПО.",
              "Регулярно проверяйте список связанных приложений и отзывайте неизвестные доступы."
            ]
      }
    }
  };

  var currentCaseId = 1;
  var currentStep = 'stage1';
  var selectedOptionIdx = -1;

  var arenaTitle = document.getElementById('arena-title');
  var clueContent = document.getElementById('clue-content');
  var taskQuestion = document.getElementById('task-question');
  var taskOptions = document.getElementById('task-options');
  var btnSubmit = document.getElementById('btn-submit-answer');
  var btnNextStep = document.getElementById('btn-next-step');
  var feedbackBox = document.getElementById('answer-feedback');
  var completionBox = document.getElementById('quest-completion-box');
  var principlesList = document.getElementById('principles-list');
  var btnRestartQuest = document.getElementById('btn-restart-quest');
  var caseButtons = document.querySelectorAll('.case-card');
  var btnAskHint = document.getElementById('btn-ask-hint');
  var mentorBubble = document.getElementById('mentor-bubble');
  var mentorText = document.getElementById('mentor-text');
  var btnAiGenCase = document.getElementById('btn-ai-gen-case');

  function loadCase(id) {
    currentCaseId = id;
    var c = SCENARIOS[id];
    if (!c) return;

    // Reset UI
    feedbackBox.hidden = true;
    feedbackBox.innerHTML = '';
    btnNextStep.hidden = true;
    btnSubmit.hidden = false;
    btnSubmit.disabled = false;
    completionBox.hidden = true;
    mentorBubble.hidden = true;
    selectedOptionIdx = -1;

    arenaTitle.textContent = c.title;
    var stepData = c.stage1;
    clueContent.innerHTML = stepData.clueHtml;
    taskQuestion.textContent = stepData.question;

    var optHtml = '';
    stepData.options.forEach(function (opt, idx) {
      optHtml += '<label class="task-option-label" data-idx="' + idx + '">' +
        '<input type="radio" name="quest_opt" value="' + idx + '"> ' +
        '<span>' + opt.text + '</span>' +
        '</label>';
    });
    taskOptions.innerHTML = optHtml;

    // Add listeners to radio options
    var labels = taskOptions.querySelectorAll('.task-option-label');
    labels.forEach(function (lbl) {
      lbl.addEventListener('click', function () {
        labels.forEach(function (l) { l.classList.remove('is-selected'); });
        lbl.classList.add('is-selected');
        var r = lbl.querySelector('input');
        if (r) r.checked = true;
        selectedOptionIdx = parseInt(lbl.getAttribute('data-idx'), 10);
      });
    });

    // Update active button
    caseButtons.forEach(function (b) {
      if (parseInt(b.getAttribute('data-case'), 10) === id) {
        b.classList.add('is-active');
      } else {
        b.classList.remove('is-active');
      }
    });
  }

  caseButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cid = parseInt(btn.getAttribute('data-case'), 10);
      loadCase(cid);
    });
  });

  if (btnSubmit) {
    btnSubmit.addEventListener('click', function () {
      if (selectedOptionIdx === -1) {
        alert(isKk ? 'Жауап нұсқасын таңдаңыз.' : 'Пожалуйста, выберите вариант ответа.');
        return;
      }

      var c = SCENARIOS[currentCaseId];
      var stepData = c.stage1;
      var chosen = stepData.options[selectedOptionIdx];

      feedbackBox.hidden = false;
      if (chosen.correct) {
        feedbackBox.className = 'answer-feedback success';
        feedbackBox.innerHTML = '<strong>' + (isKk ? '✅ Дұрыс жауап!' : '✅ Правильно!') + '</strong><br>' + stepData.explanation;
        btnSubmit.hidden = true;
        btnNextStep.hidden = false;
      } else {
        feedbackBox.className = 'answer-feedback error';
        feedbackBox.innerHTML = '<strong>' + (isKk ? '❌ Қате.' : '❌ Не совсем так.') + '</strong> ' +
          (isKk ? 'Мұқият қайта оқып көріңіз немесе AI Ментордан ишара сұраңыз.' : 'Попробуйте ещё раз или обратитесь за подсказкой к AI Ментору.');
      }
    });
  }

  if (btnNextStep) {
    btnNextStep.addEventListener('click', function () {
      var c = SCENARIOS[currentCaseId];
      var stepData = c.stage1;
      feedbackBox.hidden = true;
      btnNextStep.hidden = true;
      taskOptions.innerHTML = '';
      taskQuestion.textContent = '';
      clueContent.innerHTML = '';

      completionBox.hidden = false;
      var pList = '';
      stepData.principles.forEach(function (p) {
        pList += '<li>' + p + '</li>';
      });
      principlesList.innerHTML = pList;
    });
  }

  if (btnRestartQuest) {
    btnRestartQuest.addEventListener('click', function () {
      var nextId = (currentCaseId % 3) + 1;
      loadCase(nextId);
    });
  }

  // --- AI MENTOR HINTS ---
  if (btnAskHint) {
    btnAskHint.addEventListener('click', function () {
      var c = SCENARIOS[currentCaseId];
      if (!c) return;

      btnAskHint.disabled = true;
      mentorBubble.hidden = false;
      mentorText.textContent = isKk ? 'AI Ментор ойланып жатыр…' : 'AI Ментор обдумывает подсказку…';

      var contextMsg = "Кейс тақырыбы: " + c.title + "\nСұрақ: " + c.stage1.question;
      var fd = new FormData();
      fd.append('message', contextMsg);
      fd.append('mode', 'quest_hint');
      fd.append('consent', '1');
      fd.append('lang', lang);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/assistant/chat/');
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      xhr.onload = function () {
        btnAskHint.disabled = false;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data.ok && data.reply) {
              mentorText.textContent = data.reply;
            } else {
              mentorText.textContent = isKk ? 'Ишара: Сілтеменің ресми сайтымен сәйкестігін және эмоциялық қысымды тексеріңіз.' : 'Подсказка: Обратите внимание на написание домена и искусственную спешку.';
            }
          } catch (e) {
            mentorText.textContent = isKk ? 'Сілтеменің жалған әріптеріне назар аударыңыз.' : 'Обратите внимание на детали в тексте ссылки.';
          }
        } else {
          mentorText.textContent = isKk ? 'Ишара: Ресми домен мен фишингтік сілтеменің айырмашылығын байқаңыз.' : 'Подсказка: Сравните адрес из сообщения с настоящим доменом.';
        }
      };

      xhr.onerror = function () {
        btnAskHint.disabled = false;
        mentorText.textContent = isKk ? 'Ишара: Доменді тексеріп көріңіз.' : 'Подсказка: Проверьте домен.';
      };

      xhr.send(fd);
    });
  }

  // --- AI GENERATE NEW FICTIONAL CASE ---
  if (btnAiGenCase) {
    btnAiGenCase.addEventListener('click', function () {
      btnAiGenCase.disabled = true;
      var origText = btnAiGenCase.innerHTML;
      btnAiGenCase.innerHTML = '<span>' + (isKk ? 'Жаңа кейс құрастырылуда…' : 'Генерация нового кейса…') + '</span>';

      var fd = new FormData();
      fd.append('message', isKk ? 'Жаңа ойдан шығарылған фишинг/әлеуметтік инженерия кейсін құрастыр.' : 'Сгенерируй новый вымышленный кейс по распознаванию фишинга.');
      fd.append('mode', 'quest_generate');
      fd.append('consent', '1');
      fd.append('lang', lang);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/assistant/chat/');
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      xhr.onload = function () {
        btnAiGenCase.disabled = false;
        btnAiGenCase.innerHTML = origText;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data.ok && data.reply) {
              // Present the new AI-generated case
              completionBox.hidden = true;
              feedbackBox.hidden = true;
              btnNextStep.hidden = true;
              btnSubmit.hidden = true;
              arenaTitle.textContent = isKk ? '✨ AI жасаған жаңа ойдан шығарылған кейс' : '✨ Новый вымышленный кейс от AI';
              clueContent.innerHTML = '<div class="ai-generated-case-box">' +
                '<p>' + data.reply.replace(/\n/g, '<br>') + '</p>' +
                '</div>';
              taskQuestion.textContent = isKk ? 'Кейс деректерін оқып, қандай қауіпсіздік қағидасын үйренуге болатынын қорытындылаңыз.' : 'Ознакомьтесь с кейсом и проанализируйте усвоенный принцип безопасности.';
              taskOptions.innerHTML = '';
            } else {
              alert(isKk ? 'Жаңа кейс генерациялау сәтсіз аяқталды.' : 'Не удалось сгенерировать кейс.');
            }
          } catch (e) {
            alert('Қате.');
          }
        } else {
          alert(isKk ? 'Сервер қатесі.' : 'Ошибка сервера.');
        }
      };

      xhr.onerror = function () {
        btnAiGenCase.disabled = false;
        btnAiGenCase.innerHTML = origText;
        alert(isKk ? 'Желілік қателік.' : 'Ошибка сети.');
      };

      xhr.send(fd);
    });
  }

  // Initial load
  loadCase(1);

})();
