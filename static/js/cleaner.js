/**
 * Digital Footprint Cleaner
 * Local self-assessment indicator and data deletion request constructor.
 * Strict zero-persistence.
 */
(function () {
  'use strict';

  var root = document.getElementById('cleaner-app');
  if (!root) return;

  var lang = root.getAttribute('data-lang') || 'kk';
  var isKk = lang === 'kk';

  // --- SECTION 1: SELF-ASSESSMENT SCORE ---
  var auditChecks = document.querySelectorAll('.audit-check');
  var scoreVal = document.getElementById('cleaner-score-val');
  var scoreBar = document.getElementById('cleaner-bar');
  var levelBadge = document.getElementById('cleaner-level-badge');
  var auditFeedback = document.getElementById('audit-feedback');

  function calculateScore() {
    var score = 100;
    var checkedCount = 0;

    auditChecks.forEach(function (chk) {
      if (chk.checked) {
        var penalty = parseInt(chk.getAttribute('data-penalty'), 10) || 15;
        score -= penalty;
        checkedCount++;
      }
    });

    if (score < 10) score = 10;
    scoreVal.textContent = score + '%';
    scoreBar.style.width = score + '%';

    if (score >= 80) {
      scoreBar.style.background = '#10b981';
      levelBadge.className = 'cleaner-badge good';
      levelBadge.textContent = isKk ? 'Жоғары қорғаныс деңгейі' : 'Высокий уровень защищённости';
    } else if (score >= 50) {
      scoreBar.style.background = '#f59e0b';
      levelBadge.className = 'cleaner-badge warn';
      levelBadge.textContent = isKk ? 'Орташа деңгей (жақсартуды қажет етеді)' : 'Средний уровень (требует внимания)';
    } else {
      scoreBar.style.background = '#ef4444';
      levelBadge.className = 'cleaner-badge danger';
      levelBadge.textContent = isKk ? 'Назар аударыңыз! Жеке деректердің ашылу қаупі бар' : 'Внимание! Высокий риск раскрытия данных';
    }

    if (checkedCount > 0) {
      auditFeedback.hidden = false;
      auditFeedback.innerHTML = isKk
        ? '<p>💡 Сіз <strong>' + checkedCount + '</strong> қауіп факторын белгіледіңіз. Төмендегі 2-бөлімдегі нұсқаулықтарды қарап, қолданылмайтын аккаунттарды өшіруді немесе жабуды ұсынамыз.</p>'
        : '<p>💡 Вы отметили <strong>' + checkedCount + '</strong> факторов риска. Рекомендуем ознакомиться с инструкциями в Разделе 2 для снижения публичности и удаления лишних аккаунтов.</p>';
    } else {
      auditFeedback.hidden = true;
      auditFeedback.innerHTML = '';
    }
  }

  auditChecks.forEach(function (chk) {
    chk.addEventListener('change', calculateScore);
  });

  // --- SECTION 3: REQUEST CONSTRUCTOR ---
  var reqService = document.getElementById('req-service');
  var reqDataType = document.getElementById('req-data-type');
  var reqLaw = document.getElementById('req-law');
  var reqConsent = document.getElementById('cleaner-ai-consent');
  var btnGenLocal = document.getElementById('btn-gen-local-req');
  var btnGenAi = document.getElementById('btn-gen-ai-req');
  var outputBox = document.getElementById('request-output-box');
  var draftTextarea = document.getElementById('draft-textarea');
  var btnCopy = document.getElementById('btn-copy-draft');
  var copyText = document.getElementById('copy-draft-text');

  function generateLocalTemplate() {
    var service = (reqService ? reqService.value : '').trim() || (isKk ? '[Сервис / Сайт атауы]' : '[Название сервиса / сайта]');
    var dataTypes = (reqDataType ? reqDataType.value : '').trim() || (isKk ? 'менің барлық аккаунтым, жарияланған жазбаларым, фотосуреттер мен байланыс мәліметтерім' : 'мой профиль, опубликованные посты, фотографии и контактные данные');
    var lawChoice = reqLaw ? reqLaw.value : 'kz';

    var dateStr = new Date().toLocaleDateString();

    var draft = '';
    if (lawChoice === 'kz') {
      if (isKk) {
        draft = service + ' әкімшілігіне / басшылығына\n' +
          'Кімнен: [Сіздің толық аты-жөніңіз]\n' +
          'Байланыс дерегі (email немесе телефон): [Email немесе телефон нөмірі]\n' +
          'Күні: ' + dateStr + '\n\n' +
          'ТАЛАП ЕТУ ӨТІНІШІ\n' +
          '(Дербес деректерді жинауға және өңдеуге берілген келісімді кері қайтарып алу және деректерді жою туралы)\n\n' +
          'Қазақстан Республикасының 2013 жылғы 21 мамырдағы «Дербес деректер және оларды қорғау туралы» Заңының 24-бабына (Дербес деректер субъектісінің құқықтары) сәйкес, мен өзімнің дербес деректерімді жинауға, өңдеуге берілген келісімімді кері қайтарып алатынымды мәлімдеймін.\n\n' +
          'Осыған байланысты, ' + service + ' платформасындағы келесі дербес деректерімді:\n' +
          '«' + dataTypes + '»\n' +
          'жүйеден, деректер қорынан толық жоюыңызды (бұғаттауыңызды) талап етемін.\n\n' +
          'ҚР «Дербес деректер және оларды қорғау туралы» Заңының 24-бабы 1-тармағының 6) тармақшасына сәйкес, өтініш қаралып, деректер жойылғандығы туралы осы электрондық мекенжайыма жауап беруіңізді сұраймын.\n\n' +
          'Құрметпен,\n' +
          '[Қолыңыз / Аты-жөніңіз]';
      } else {
        draft = 'В администрацию / службу поддержки ' + service + '\n' +
          'От: [Ваше ФИО]\n' +
          'Контактный email / телефон: [Ваш email или телефон]\n' +
          'Дата: ' + dateStr + '\n\n' +
          'ТРЕБОВАНИЕ / ЗАПРОС\n' +
          '(Об отзыве согласия на сбор и обработку персональных данных и их удалении)\n\n' +
          'На основании статьи 24 Закона Республики Казахстан от 21 мая 2013 года «О персональных данных и их защите» (Права субъекта персональных данных), настоящим я отзываю своё согласие на сбор и обработку моих персональных данных.\n\n' +
          'В связи с этим требую незамедлительно прекратить обработку и полностью удалить из ваших баз данных следующую информацию, привязанную к моим контактам на платформе ' + service + ':\n' +
          '«' + dataTypes + '».\n\n' +
          'Прошу направить официальное подтверждение об удалении персональных данных в установленный законом срок на указанный электронный адрес.\n\n' +
          'С уважением,\n' +
          '[ФИО / Подпись]';
      }
    } else {
      // GDPR template
      draft = 'To the Data Protection Officer / Support Team of ' + service + '\n' +
        'From: [Your Full Name]\n' +
        'Contact Email: [Your Email]\n' +
        'Date: ' + dateStr + '\n\n' +
        'REQUEST TO ERASE PERSONAL DATA (GDPR ARTICLE 17 - RIGHT TO BE FORGOTTEN)\n\n' +
        'Pursuant to Article 17 of the General Data Protection Regulation (Regulation (EU) 2016/679), I hereby exercise my right to have my personal data erased.\n\n' +
        'I withdraw my consent for the processing of my personal data on ' + service + ' and request the permanent erasure of the following data:\n' +
        '«' + dataTypes + '».\n\n' +
        'Please confirm within one calendar month that my data has been permanently deleted from your servers and databases.\n\n' +
        'Sincerely,\n' +
        '[Your Name]';
    }

    draftTextarea.value = draft;
    outputBox.hidden = false;
    draftTextarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (btnGenLocal) {
    btnGenLocal.addEventListener('click', generateLocalTemplate);
  }

  if (btnGenAi) {
    btnGenAi.addEventListener('click', function () {
      if (!reqConsent || !reqConsent.checked) {
        alert(isKk ? 'Алдымен келісімді растаңыз.' : 'Пожалуйста, подтвердите согласие на обработку данных.');
        return;
      }

      var service = (reqService ? reqService.value : '').trim();
      var dataTypes = (reqDataType ? reqDataType.value : '').trim();
      var lawChoice = reqLaw ? reqLaw.value : 'kz';

      btnGenAi.disabled = true;
      var origText = btnGenAi.innerHTML;
      btnGenAi.innerHTML = '<span>' + (root.getAttribute('data-thinking') || 'Құрастырылуда…') + '</span>';

      var promptMsg = "Сервис атауы: " + (service || "Онлайн қызмет") +
        "\nӨшірілетін деректер: " + (dataTypes || "аккаунт, фотолар, хабарламалар") +
        "\nЗаңдық негіз: " + (lawChoice === 'kz' ? "ҚР Заңы (24-бап)" : "GDPR Art. 17");

      var fd = new FormData();
      fd.append('message', promptMsg);
      fd.append('mode', 'cleaner_request');
      fd.append('consent', '1');
      fd.append('lang', lang);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/assistant/chat/');
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      xhr.onload = function () {
        btnGenAi.disabled = false;
        btnGenAi.innerHTML = origText;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data.ok && data.reply) {
              draftTextarea.value = data.reply;
              outputBox.hidden = false;
              draftTextarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
              generateLocalTemplate();
            }
          } catch (e) {
            generateLocalTemplate();
          }
        } else {
          generateLocalTemplate();
        }
      };

      xhr.onerror = function () {
        btnGenAi.disabled = false;
        btnGenAi.innerHTML = origText;
        generateLocalTemplate();
      };

      xhr.send(fd);
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', function () {
      if (!draftTextarea || !draftTextarea.value) return;
      draftTextarea.select();
      navigator.clipboard.writeText(draftTextarea.value).then(function () {
        var orig = copyText.textContent;
        copyText.textContent = root.getAttribute('data-copied') || 'Көшірілді!';
        btnCopy.classList.add('btn-copied');
        setTimeout(function () {
          copyText.textContent = orig;
          btnCopy.classList.remove('btn-copied');
        }, 2200);
      }).catch(function () {
        document.execCommand('copy');
        alert(isKk ? 'Көшірілді!' : 'Скопировано!');
      });
    });
  }

})();
