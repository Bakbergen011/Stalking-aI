/**
 * AI Digital Bodyguard (Scanner & SOS Safety Timer)
 * Strict zero-persistence: runs purely in DOM / client memory.
 * No tracking, no background GPS, no simulated dispatcher.
 */
(function () {
  'use strict';

  var root = document.getElementById('bodyguard-app');
  if (!root) return;

  var lang = root.getAttribute('data-lang') || 'kk';
  var isKk = lang === 'kk';

  // --- TAB SWITCHING (Scanner, SOS, Evidence) ---
  var tabScannerBtn = document.getElementById('tab-scanner-btn');
  var tabSosBtn = document.getElementById('tab-sos-btn');
  var tabEvidenceBtn = document.getElementById('tab-evidence-btn');
  var secScanner = document.getElementById('section-scanner');
  var secSos = document.getElementById('section-sos');
  var secEvidence = document.getElementById('section-evidence');

  var allTabs = [
    { key: 'scanner', btn: tabScannerBtn, sec: secScanner },
    { key: 'sos', btn: tabSosBtn, sec: secSos },
    { key: 'evidence', btn: tabEvidenceBtn, sec: secEvidence }
  ];

  function switchTab(target) {
    allTabs.forEach(function (tab) {
      if (!tab.btn || !tab.sec) return;
      var isActive = tab.key === target;
      tab.btn.classList.toggle('is-active', isActive);
      tab.btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.sec.hidden = !isActive;
    });
  }

  allTabs.forEach(function (tab) {
    if (tab.btn) {
      tab.btn.addEventListener('click', function () { switchTab(tab.key); });
    }
  });

  // Check URL hash if user clicked direct link (e.g. #evidence)
  if (window.location.hash === '#evidence') {
    switchTab('evidence');
  } else if (window.location.hash === '#sos') {
    switchTab('sos');
  }

  // --- CHECKLIST EVALUATION ---
  var factorChecks = document.querySelectorAll('.factor-check');
  var checklistBox = document.getElementById('checklist-result-box');

  var adviceMap = {
    geo: isKk
      ? "Геолокация: Жазбаларда нақты мекенжай мен тегтерді алып тастаңыз. Камераның EXIF-метадеректерінде GPS сақталмағанын тексеріңіз."
      : "Геолокация: Удалите отметки мест и геотеги. Убедитесь, что в камере отключено добавление координат в EXIF-данные фото.",
    home: isKk
      ? "Тұрғын үй: Терезеден көрінетін ерекше ғимараттар, подъезд нөмірі немесе аула суреттерін жарияламауға тырысыңыз."
      : "Жильё: Не публикуйте панорамы из окна с узнаваемыми ориентирами, подъезды, номера домов или дворы.",
    work: isKk
      ? "Жұмыс/Оқу: Жұмыс орнының атауы, күнделікті келу-кету уақыты немесе студенттік билет ақпаратын ашық көрсетпеңіз."
      : "Работа/Учёба: Избегайте точных названий организаций, графика прихода/ухода и бейджей с персональными данными.",
    phone: isKk
      ? "Байланыс деректері: Телефон нөмірі мен жеке email-ді профильден алып тастаңыз, мессенджерде нөмір көрінуін шектеңіз."
      : "Контакты: Скройте номер телефона и личный email из публичного доступа в мессенджерах и соцсетях.",
    settings: isKk
      ? "Аккаунт баптаулары: Профильді тек таныстар үшін жабық (private) режимге ауыстырыңыз және фотоға белгілеуді тек рұқсатпен қосыңыз."
      : "Настройки аккаунта: Переведите профиль в закрытый режим (только для одобренных подписчиков) и ограничьте отметки на фото."
  };

  function updateChecklist() {
    var checked = [];
    factorChecks.forEach(function (chk) {
      if (chk.checked) checked.push(chk.getAttribute('data-name'));
    });

    if (checked.length === 0) {
      checklistBox.hidden = true;
      checklistBox.innerHTML = '';
      return;
    }

    checklistBox.hidden = false;
    var html = '<div class="summary-head">' +
      '<strong>' + (isKk ? 'Анықталған қауіп факторлары бойынша ұсыныстар:' : 'Рекомендации по отмеченным факторам риска:') + '</strong>' +
      '</div><ul class="summary-bullets">';

    checked.forEach(function (key) {
      if (adviceMap[key]) {
        html += '<li>' + adviceMap[key] + '</li>';
      }
    });

    html += '</ul>';
    checklistBox.innerHTML = html;
  }

  factorChecks.forEach(function (chk) {
    chk.addEventListener('change', updateChecklist);
  });

  // --- LOCAL SCANNER LOGIC ---
  var btnLocalScan = document.getElementById('btn-local-scan');
  var btnAiScan = document.getElementById('btn-ai-scan');
  var scannerText = document.getElementById('scanner-text');
  var scannerFile = document.getElementById('scanner-file');
  var scannerFileLabel = document.getElementById('scanner-file-label');
  var scannerFileName = document.getElementById('scanner-file-name');
  var scannerConsent = document.getElementById('scanner-ai-consent');
  var scannerOutput = document.getElementById('scanner-output');

  if (scannerFile) {
    scannerFile.addEventListener('change', function () {
      if (scannerFile.files && scannerFile.files[0]) {
        var f = scannerFile.files[0];
        scannerFileName.textContent = f.name + ' (' + Math.round(f.size / 1024) + ' KB)';
        scannerFileName.hidden = false;
      } else {
        scannerFileName.hidden = true;
        scannerFileName.textContent = '';
      }
    });
  }

  if (btnLocalScan) {
    btnLocalScan.addEventListener('click', function () {
      var text = (scannerText ? scannerText.value : '').trim();
      if (!text && (!scannerFile || !scannerFile.files.length)) {
        alert(isKk ? 'Тексеру үшін мәтін енгізіңіз немесе файл таңдаңыз.' : 'Введите текст или выберите файл для проверки.');
        return;
      }

      var warnings = [];
      // Basic client-side regex checks (phone, email, address keywords)
      if (/\+?[0-9\s\-\(\)]{10,18}/.test(text)) {
        warnings.push(isKk ? 'Мәтінде телефон нөміріне ұқсас сандар анықталды.' : 'Обнаружены цифры, похожие на номер телефона.');
      }
      if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
        warnings.push(isKk ? 'Жеке электрондық пошта (email) мекенжайы табылды.' : 'Найден адрес личной электронной почты (email).');
      }
      if (/(көше|көш|улица|ул|үй|дом|пәтер|кв|район|мкр|мкрн|аудан|жұмыс|работа|мектеп|школа|универ|садик)/i.test(text)) {
        warnings.push(isKk ? 'Мекенжайға, үйге немесе жұмыс/оқу орнына сілтейтін сөздер байқалды.' : 'Обнаружены ключевые слова, указывающие на адрес, жильё или место работы/учёбы.');
      }

      var outHtml = '<div class="local-scan-box">';
      outHtml += '<h4>' + (isKk ? 'Жергілікті экспресс-талдау нәтижесі:' : 'Результат локального экспресс-анализа:') + '</h4>';
      if (warnings.length > 0) {
        outHtml += '<p class="warn-head">' + (isKk ? '⚠️ Жариялау алдында өшіру қажет болуы мүмкін белгілер:' : '⚠️ Внимание к следующим фрагментам:') + '</p><ul>';
        warnings.forEach(function (w) { outHtml += '<li>' + w + '</li>'; });
        outHtml += '</ul>';
      } else {
        outHtml += '<p class="safe-note">' + (isKk ? '✅ Мәтінде тікелей телефон, email немесе нақты мекенжай маркерлері табылмады. Дегенмен, тұрғылықты қала немесе күн тәртібі сияқты жанама деректерді де қадағалаңыз.' : '✅ В тексте не найдено явных номеров, email или точных адресов. Тем не менее следите за косвенными ориентирами (распорядок дня, город).') + '</p>';
      }

      outHtml += '<div class="anon-reminder"><small>' +
        (isKk
          ? 'Ескерту: Бұл автоматты сүзгі. Белгісіз парақшалар мен сторис қарағандардан адамның кім екенін анықтау мүмкін емес және анонимдерге диагноз қойылмайды.'
          : 'Напоминание: Это базовый фильтр. Неизвестные просмотры историй не позволяют определить реальную личность, и сервис не ставит диагнозов.') +
        '</small></div>';
      outHtml += '</div>';

      scannerOutput.innerHTML = outHtml;
      scannerOutput.hidden = false;
    });
  }

  // AI Scan
  if (btnAiScan) {
    btnAiScan.addEventListener('click', function () {
      if (!scannerConsent || !scannerConsent.checked) {
        alert(isKk ? 'Алдымен деректерді өңдеуге келісімді растаңыз.' : 'Пожалуйста, подтвердите согласие на обработку данных.');
        return;
      }

      var text = (scannerText ? scannerText.value : '').trim();
      var file = scannerFile && scannerFile.files ? scannerFile.files[0] : null;

      if (!text && !file) {
        alert(isKk ? 'Тексеру үшін мәтін жазыңыз немесе скриншот тіркеңіз.' : 'Вставьте текст или прикрепите скриншот для проверки.');
        return;
      }

      btnAiScan.disabled = true;
      var origContent = btnAiScan.innerHTML;
      btnAiScan.innerHTML = '<span>' + (root.getAttribute('data-thinking') || 'Талдануда…') + '</span>';
      scannerOutput.hidden = false;
      scannerOutput.innerHTML = '<div class="scanner-thinking">' + (isKk ? 'AI талдап жатыр, күте тұрыңыз…' : 'AI анализирует данные, пожалуйста, подождите…') + '</div>';

      var fd = new FormData();
      fd.append('message', text || (isKk ? 'Осы деректер мен скриншоттағы жеке деректердің ашылу қаупін талдаңыз.' : 'Проанализируйте риски раскрытия персональных данных.'));
      fd.append('mode', 'bodyguard_scan');
      fd.append('consent', '1');
      fd.append('lang', lang);
      if (file) {
        fd.append('file', file);
      }

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/assistant/chat/');
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      xhr.onload = function () {
        btnAiScan.disabled = false;
        btnAiScan.innerHTML = origContent;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data.ok && data.reply) {
              scannerOutput.innerHTML = '<div class="ai-reply-card">' +
                '<h4>' + (isKk ? '🤖 AI Digital Bodyguard талдауы:' : '🤖 Анализ AI Digital Bodyguard:') + '</h4>' +
                '<div class="ai-reply-body">' + escapeHtmlAndFormat(data.reply) + '</div>' +
                '</div>';
            } else {
              scannerOutput.innerHTML = '<p class="error-msg">' + (data.error || 'Қате орын алды.') + '</p>';
            }
          } catch (e) {
            scannerOutput.innerHTML = '<p class="error-msg">Жауапты өңдеу қатесі.</p>';
          }
        } else {
          scannerOutput.innerHTML = '<p class="error-msg">' + (isKk ? 'Сервермен байланыс қатесі.' : 'Ошибка связи с сервером.') + '</p>';
        }
      };

      xhr.onerror = function () {
        btnAiScan.disabled = false;
        btnAiScan.innerHTML = origContent;
        scannerOutput.innerHTML = '<p class="error-msg">' + (isKk ? 'Желілік қателік.' : 'Сетевая ошибка.') + '</p>';
      };

      xhr.send(fd);
    });
  }

  function escapeHtmlAndFormat(str) {
    if (!str) return '';
    var safe = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    // Bold **text**
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet points * item or - item
    safe = safe.replace(/^[*-]\s+(.+)$/gm, '<li>$1</li>');
    safe = safe.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    // Line breaks
    safe = safe.replace(/\n\n+/g, '<br><br>');
    return safe;
  }

  // --- SECTION 2: SOS REAL-TIME SAFETY TIMER ---
  var timerSetupView = document.getElementById('timer-setup-view');
  var timerActiveView = document.getElementById('timer-active-view');
  var timerExpiredView = document.getElementById('timer-expired-view');

  var presetBtns = document.querySelectorAll('.preset-btn');
  var customMinutesInput = document.getElementById('custom-minutes');
  var btnStartTimer = document.getElementById('btn-start-timer');
  var btnPauseTimer = document.getElementById('btn-pause-timer');
  var btnAdd5m = document.getElementById('btn-add-5m');
  var btnAdd15m = document.getElementById('btn-add-15m');
  var btnStopTimer = document.getElementById('btn-stop-timer');
  var btnAlarmDismiss = document.getElementById('btn-alarm-dismiss');
  var timerClock = document.getElementById('timer-clock');
  var timerStatusText = document.getElementById('timer-status-text');

  var selectedMinutes = 20;
  var timerInterval = null;
  var totalSeconds = 0;
  var isPaused = false;
  var audioContext = null;

  presetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      presetBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      selectedMinutes = parseInt(btn.getAttribute('data-minutes'), 10) || 20;
      if (customMinutesInput) customMinutesInput.value = selectedMinutes;
    });
  });

  if (customMinutesInput) {
    customMinutesInput.addEventListener('input', function () {
      var val = parseInt(customMinutesInput.value, 10);
      if (val && val > 0 && val <= 180) {
        selectedMinutes = val;
        presetBtns.forEach(function (b) { b.classList.remove('is-active'); });
      }
    });
  }

  function formatTime(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function playAlertBeep() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === 'suspended') audioContext.resume();

      var osc = audioContext.createOscillator();
      var gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + 1.2);
    } catch (e) {}
  }

  function triggerExpiredAlarm() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerActiveView.hidden = true;
    timerExpiredView.hidden = false;
    playAlertBeep();
    // Repeat alert beep 3 times
    setTimeout(playAlertBeep, 1500);
    setTimeout(playAlertBeep, 3000);
  }

  function startTimer() {
    totalSeconds = selectedMinutes * 60;
    isPaused = false;
    timerClock.textContent = formatTime(totalSeconds);
    timerStatusText.textContent = isKk ? 'Таймер белсенді' : 'Таймер активен';
    btnPauseTimer.textContent = isKk ? 'Кідірту' : 'Пауза';

    timerSetupView.hidden = true;
    timerActiveView.hidden = false;
    timerExpiredView.hidden = true;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      if (!isPaused) {
        totalSeconds--;
        if (totalSeconds <= 0) {
          triggerExpiredAlarm();
        } else {
          timerClock.textContent = formatTime(totalSeconds);
        }
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timerActiveView.hidden = true;
    timerExpiredView.hidden = true;
    timerSetupView.hidden = false;
  }

  if (btnStartTimer) btnStartTimer.addEventListener('click', startTimer);
  if (btnStopTimer) btnStopTimer.addEventListener('click', stopTimer);
  if (btnAlarmDismiss) btnAlarmDismiss.addEventListener('click', stopTimer);

  if (btnPauseTimer) {
    btnPauseTimer.addEventListener('click', function () {
      isPaused = !isPaused;
      if (isPaused) {
        btnPauseTimer.textContent = isKk ? 'Жалғастыру' : 'Продолжить';
        timerStatusText.textContent = isKk ? 'Кідіртілді' : 'На паузе';
      } else {
        btnPauseTimer.textContent = isKk ? 'Кідірту' : 'Пауза';
        timerStatusText.textContent = isKk ? 'Таймер белсенді' : 'Таймер активен';
      }
    });
  }

  if (btnAdd5m) {
    btnAdd5m.addEventListener('click', function () {
      totalSeconds += 5 * 60;
      timerClock.textContent = formatTime(totalSeconds);
    });
  }

  if (btnAdd15m) {
    btnAdd15m.addEventListener('click', function () {
      totalSeconds += 15 * 60;
      timerClock.textContent = formatTime(totalSeconds);
    });
  }


  // --- EVIDENCE CHECKLIST & EXPORT LOGIC ---
  var exportBtn = document.getElementById('evidence-export');
  var clearBtn = document.getElementById('evidence-clear');

  function collectEvidence() {
    var exportTitle = root.getAttribute('data-export-title') || 'Stalking дәлелдер тізімі (жергілікті экспорт)';
    var exportNote = root.getAttribute('data-export-note') || 'ескертпе:';
    var exportDisclaimer = root.getAttribute('data-export-disclaimer') || 'Бұл файл тек құрылғыңызда сақталады. Соттың қабылдауына кепілдік жоқ.';
    var lines = [exportTitle, ''];
    root.querySelectorAll('#evidence-list > li').forEach(function (li) {
      var cb = li.querySelector('input[type="checkbox"]');
      var label = li.querySelector('label[for]');
      var note = li.querySelector('textarea');
      var mark = cb && cb.checked ? '[x]' : '[ ]';
      lines.push(mark + ' ' + (label ? label.textContent.trim() : ''));
      if (note && note.value.trim()) {
        lines.push('    ' + exportNote + ' ' + note.value.trim());
      }
    });
    lines.push('');
    lines.push(exportDisclaimer);
    return lines.join('\n');
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      var warn = root.querySelector('.warn-inline');
      if (warn && !window.confirm(warn.textContent.trim())) return;
      var blob = new Blob([collectEvidence()], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'stalking-evidence-checklist.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      root.querySelectorAll('#evidence-list input[type="checkbox"]').forEach(function (el) {
        el.checked = false;
      });
      root.querySelectorAll('#evidence-list textarea').forEach(function (el) {
        el.value = '';
      });
    });
  }
})();