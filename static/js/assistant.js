/**
 * AI assistant UI — Multimodal Vision, Voice Input, Statement Drafting & Chat.
 * Features:
 * - Vision File Upload (PNG/JPG/PDF) with image preview & in-chat thumbnails
 * - Voice Input (Web Speech API) with recording indicator
 * - Mode Switcher: Chat / Threat Analysis / Police Statement Drafter
 * - Quick prompt chips
 * - Copy-to-clipboard button & formatted markdown
 * - Strict privacy: in-memory only, no localStorage, no server disk storage.
 */
(function () {
  'use strict';

  var root = document.getElementById("assistant-app");
  if (!root) return;

  var configured = root.getAttribute("data-configured") === "1";
  var consent = document.getElementById("ai-consent");
  var consentBox = document.getElementById("consent-box");
  var input = document.getElementById("chat-input");
  var form = document.getElementById("chat-form");
  var sendBtn = document.getElementById("chat-send");
  var clearBtn = document.getElementById("chat-clear");
  var log = document.getElementById("chat-log");
  var charCount = document.getElementById("char-count");
  var quickPrompts = document.querySelectorAll(".prompt-chip");
  var lang = root.getAttribute("data-lang") || "ru";
  var copyLabel = root.getAttribute("data-copy") || "Көшіру";
  var copiedLabel = root.getAttribute("data-copied") || "Көшірілді!";
  var thinkingText = root.getAttribute("data-thinking") || "AI жауап дайындауда…";

  // Mode and Tools
  var currentMode = "chat";
  var modeTabs = document.querySelectorAll(".ai-mode-tab");
  var attachBtn = document.getElementById("ai-attach-btn");
  var fileInput = document.getElementById("ai-file-input");
  var previewStrip = document.getElementById("file-preview-strip");
  var fileThumb = document.getElementById("file-thumb");
  var fileName = document.getElementById("file-name");
  var fileSize = document.getElementById("file-size");
  var removeFileBtn = document.getElementById("btn-remove-file");
  var voiceBtn = document.getElementById("ai-voice-btn");
  var welcomeDesc = document.getElementById("chat-welcome-desc");

  var selectedFile = null;
  var recognition = null;
  var isRecording = false;

  function syncEnabled() {
    var ok = configured && consent && consent.checked;
    if (input) input.disabled = !ok;
    if (sendBtn) sendBtn.disabled = !ok;
    if (attachBtn) attachBtn.disabled = !ok;
    if (voiceBtn) voiceBtn.disabled = !ok;
  }

  function getTimeStr() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  function formatText(text) {
    var escaped = String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    // Bold **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Headers ### Title
    escaped = escaped.replace(/^### (.*$)/gim, '<h4 class="chat-subhead">$1</h4>');

    // Bullet lists lines starting with * or -
    var lines = escaped.split('\n');
    var inList = false;
    var out = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (/^[-*]\s+(.*)$/.test(line)) {
        if (!inList) {
          out.push('<ul>');
          inList = true;
        }
        out.push('<li>' + line.replace(/^[-*]\s+/, '') + '</li>');
      } else {
        if (inList) {
          out.push('</ul>');
          inList = false;
        }
        if (line === '') {
          out.push('<br>');
        } else {
          out.push('<p>' + line + '</p>');
        }
      }
    }
    if (inList) out.push('</ul>');
    return out.join('');
  }

  function bubble(role, text, fileDataUrl) {
    var wrapper = document.createElement("div");
    wrapper.className = "chat-row " + role;

    var avatar = document.createElement("div");
    avatar.className = "bubble-avatar";
    avatar.textContent = role === "user" ? "👤" : "🤖";

    var bubbleDiv = document.createElement("div");
    bubbleDiv.className = "chat-bubble " + role;

    // Attached Image Preview inside User bubble
    if (fileDataUrl) {
      var imgWrap = document.createElement("div");
      imgWrap.className = "bubble-img-wrap";
      var img = document.createElement("img");
      img.src = fileDataUrl;
      img.alt = "Attached evidence screenshot";
      img.className = "bubble-attached-img";
      imgWrap.appendChild(img);
      bubbleDiv.appendChild(imgWrap);
    }

    var contentDiv = document.createElement("div");
    contentDiv.className = "bubble-content";
    contentDiv.innerHTML = formatText(text);
    bubbleDiv.appendChild(contentDiv);

    var metaDiv = document.createElement("div");
    metaDiv.className = "bubble-meta";
    
    var timeSpan = document.createElement("span");
    timeSpan.className = "bubble-time";
    timeSpan.textContent = getTimeStr();
    metaDiv.appendChild(timeSpan);

    if (role === "ai") {
      var copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "bubble-copy-btn";
      copyBtn.title = copyLabel;
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> ' + copyLabel;
      
      copyBtn.addEventListener("click", function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            copyBtn.textContent = copiedLabel;
            if (window.showToast) window.showToast(copiedLabel);
            setTimeout(function () {
              copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> ' + copyLabel;
            }, 2000);
          });
        }
      });
      metaDiv.appendChild(copyBtn);
    }

    bubbleDiv.appendChild(metaDiv);
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubbleDiv);
    log.appendChild(wrapper);
    log.scrollTop = log.scrollHeight;
    return wrapper;
  }

  function showTypingIndicator() {
    var wrapper = document.createElement("div");
    wrapper.className = "chat-row ai typing-indicator-row";
    wrapper.id = "typing-indicator";

    var avatar = document.createElement("div");
    avatar.className = "bubble-avatar";
    avatar.textContent = "🤖";

    var bubbleDiv = document.createElement("div");
    bubbleDiv.className = "chat-bubble ai typing-indicator-bubble";
    bubbleDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div><span class="typing-text">' + thinkingText + '</span>';

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubbleDiv);
    log.appendChild(wrapper);
    log.scrollTop = log.scrollHeight;
    return wrapper;
  }

  function removeTypingIndicator() {
    var indicator = document.getElementById("typing-indicator");
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

  function csrfToken() {
    var el = form ? form.querySelector("[name=csrfmiddlewaretoken]") : null;
    return el ? el.value : "";
  }

  function updateCharCount() {
    if (!input || !charCount) return;
    var len = input.value.length;
    var suffix = root.getAttribute("data-char-suffix") || "";
    charCount.textContent = len + ' / 2000 ' + suffix;
  }

  /* ── Mode Switching ───────────────────────────────────────── */
  modeTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      modeTabs.forEach(function (t) {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      currentMode = tab.getAttribute("data-mode");

      if (currentMode === "threat_analysis") {
        input.placeholder = lang === "kk"
          ? "Скриншотты тіркеңіз немесе хат мәтінін жазыңыз (қауіп деңгейі мен заң баптары талданады)…"
          : "Прикрепите скриншот или введите текст (будет проанализирован уровень угрозы и статьи закона)…";
        if (welcomeDesc) {
          welcomeDesc.textContent = lang === "kk"
            ? "Қауіпті хабарламалар немесе құжат скриншотын жүктеңіз. AI оның мәнін, қауіп деңгейін және ҚР заңнамасы бойынша қандай баптарға сәйкес келетінін түсіндіреді."
            : "Загрузите скриншот угроз или документ. AI определит уровень риска, выделит состав правонарушения по законам РК и подскажет как зафиксировать доказательства.";
        }
        if (!selectedFile && fileInput) {
          fileInput.click();
        }
      } else if (currentMode === "statement") {
        input.placeholder = lang === "kk"
          ? "Оқиғаны сипаттаңыз: кім, қашан және қандай қорқыту/аңду болды (полицияға дайын арыз құрастырылады)…"
          : "Опишите ситуацию: кто, когда и какие действия совершал (будет составлен официальный проект заявления в полицию)…";
        if (welcomeDesc) {
          welcomeDesc.textContent = lang === "kk"
            ? "Болған жағдайды жазыңыз немесе скриншот жүктеңіз. AI ҚР Ішкі істер органдарына (Полицияға) арналған ресми сауатты арыз жобасын құрастырады."
            : "Опишите произошедшее или прикрепите файлы. AI составит официальный проект заявления в полицию РК со ссылками на законы.";
        }
      } else {
        input.placeholder = lang === "kk"
          ? "Жалпы сұрағыңызды жазыңыз (жеке дерексіз)…"
          : "Напишите общий вопрос (без личных данных)…";
      }
    });
  });

  /* ── File Attachment ──────────────────────────────────────── */
  if (attachBtn && fileInput) {
    attachBtn.addEventListener("click", function () {
      fileInput.click();
    });

    fileInput.addEventListener("change", function () {
      if (fileInput.files && fileInput.files[0]) {
        var file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) {
          if (window.showToast) window.showToast("Файл 5MB-тан аспауы керек");
          fileInput.value = "";
          return;
        }
        selectedFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = (file.size / 1024 / 1024).toFixed(2) + " MB";

        if (file.type.indexOf("image") !== -1) {
          var reader = new FileReader();
          reader.onload = function (e) {
            fileThumb.innerHTML = '<img src="' + e.target.result + '" alt="preview">';
          };
          reader.readAsDataURL(file);
        } else {
          fileThumb.textContent = "📄";
        }
        previewStrip.hidden = false;
        if (window.showToast) window.showToast("Файл тіркелді: " + file.name);
      }
    });
  }

  if (removeFileBtn) {
    removeFileBtn.addEventListener("click", function () {
      selectedFile = null;
      if (fileInput) fileInput.value = "";
      previewStrip.hidden = true;
      fileThumb.innerHTML = "📄";
    });
  }

  /* ── Voice Input (Web Speech API) ─────────────────────────── */
  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec) {
    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang === "kk" ? "kk-KZ" : "ru-RU";

    recognition.onstart = function () {
      isRecording = true;
      voiceBtn.classList.add("recording");
      voiceBtn.querySelector(".tool-label").textContent = root.getAttribute("data-voice-listen") || "Тыңдауда…";
      if (window.showToast) window.showToast(root.getAttribute("data-voice-listen") || "Тыңдап тұрмын…");
    };

    recognition.onresult = function (event) {
      var transcript = event.results[0][0].transcript;
      if (transcript) {
        input.value = (input.value ? input.value + " " : "") + transcript;
        updateCharCount();
      }
    };

    recognition.onerror = function () {
      isRecording = false;
      voiceBtn.classList.remove("recording");
      voiceBtn.querySelector(".tool-label").textContent = "Дауыс";
    };

    recognition.onend = function () {
      isRecording = false;
      voiceBtn.classList.remove("recording");
      voiceBtn.querySelector(".tool-label").textContent = "Дауыс";
    };

    if (voiceBtn) {
      voiceBtn.addEventListener("click", function () {
        if (!consent || !consent.checked) {
          consent.checked = true;
          syncEnabled();
        }
        if (isRecording) {
          recognition.stop();
        } else {
          recognition.start();
        }
      });
    }
  } else {
    if (voiceBtn) {
      voiceBtn.addEventListener("click", function () {
        if (window.showToast) window.showToast("Бұл браузер дауысты қолдамайды (Chrome/Safari пайдаланыңыз)");
      });
    }
  }

  /* ── Input Handlers ───────────────────────────────────────── */
  if (input) {
    input.addEventListener("input", updateCharCount);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (form && sendBtn && !sendBtn.disabled) {
          form.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      }
    });
  }

  if (consent) {
    consent.addEventListener("change", syncEnabled);
  }
  syncEnabled();

  // Quick Prompt Chips
  quickPrompts.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var prompt = btn.getAttribute("data-prompt");
      if (!prompt) return;

      if (!consent || !consent.checked) {
        if (consent) {
          consent.checked = true;
          syncEnabled();
          if (consentBox) {
            consentBox.classList.add("highlight-pulse");
            setTimeout(function () { consentBox.classList.remove("highlight-pulse"); }, 1000);
          }
        }
      }

      if (input) {
        input.value = prompt;
        updateCharCount();
        input.focus();
        if (form) {
          form.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      }
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (log) {
        log.innerHTML = '<div class="chat-welcome"><div class="assistant-avatar">🤖</div><div class="welcome-text"><p><strong>Stalking AI</strong></p><p>' + (welcomeDesc ? welcomeDesc.textContent : "") + '</p></div></div>';
      }
      if (input) {
        input.value = "";
        updateCharCount();
      }
      selectedFile = null;
      if (fileInput) fileInput.value = "";
      if (previewStrip) previewStrip.hidden = true;
      if (window.showToast) window.showToast("Диалог тазаланды");
    });
  }

  if (!form || !configured) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!consent.checked) return;
    var text = (input.value || "").trim();
    if (!text && !selectedFile) return;

    var previewUrl = null;
    if (selectedFile && selectedFile.type.indexOf("image") !== -1) {
      previewUrl = URL.createObjectURL(selectedFile);
    }

    bubble("user", text || (lang === "kk" ? "Тіркелген файлды талдаңыз" : "Проанализируйте файл"), previewUrl);

    input.value = "";
    updateCharCount();
    sendBtn.disabled = true;

    showTypingIndicator();

    var body = new FormData();
    body.append("message", text);
    body.append("lang", lang);
    body.append("mode", currentMode);
    body.append("consent", "1");
    body.append("csrfmiddlewaretoken", csrfToken());
    if (selectedFile) {
      body.append("image", selectedFile);
    }

    // Reset selected file for next query
    selectedFile = null;
    if (fileInput) fileInput.value = "";
    if (previewStrip) previewStrip.hidden = true;

    fetch("/api/assistant/chat/", {
      method: "POST",
      body: body,
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (payload) {
        removeTypingIndicator();
        if (payload.data && payload.data.ok) {
          bubble("ai", payload.data.reply);
        } else {
          bubble(
            "ai",
            (payload.data && payload.data.error) ||
              root.getAttribute("data-network")
          );
        }
      })
      .catch(function () {
        removeTypingIndicator();
        bubble("ai", root.getAttribute("data-network"));
      })
      .finally(function () {
        syncEnabled();
      });
  });
})();
