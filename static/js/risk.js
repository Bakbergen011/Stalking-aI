/**
 * Risk assessment — memory of the current tab only.
 * Features:
 * - Real-time progress bar (answered count / total)
 * - Visual Risk Gauge component (Low / Moderate / High)
 * - Emergency quick dials on High/Moderate risk
 * - Link to Gemini AI assistant for personalized advice
 * - Strict privacy: in-memory only, no localStorage, no network tracking.
 */
(function () {
  'use strict';

  var root = document.getElementById("risk-app");
  var form = document.getElementById("risk-form");
  var result = document.getElementById("risk-result");
  var showBtn = document.getElementById("risk-show");
  var resetBtn = document.getElementById("risk-reset");
  var progressBar = document.getElementById("risk-progress-bar");
  var progressCount = document.getElementById("risk-progress-count");

  if (!root || !form || !result || !showBtn || !resetBtn) return;

  var lang = root.getAttribute("data-lang") || "kk";
  var totalQuestions = form.querySelectorAll("fieldset.risk-q").length;
  var memoryAnswers = Object.create(null);

  function updateProgress() {
    var answered = 0;
    var fields = form.querySelectorAll("fieldset.risk-q");
    fields.forEach(function (fs) {
      var name = fs.getAttribute("data-id");
      if (form.querySelector('input[name="' + name + '"]:checked')) {
        answered++;
      }
    });

    if (progressBar) {
      var pct = Math.round((answered / totalQuestions) * 100);
      progressBar.style.width = pct + "%";
    }
    if (progressCount) {
      progressCount.textContent = answered + " / " + totalQuestions;
    }
  }

  form.addEventListener("change", function (e) {
    if (e.target && e.target.type === "radio") {
      updateProgress();
    }
  });

  function readAnswers() {
    var fields = form.querySelectorAll("fieldset.risk-q");
    var answers = [];
    fields.forEach(function (fs) {
      var name = fs.getAttribute("data-id");
      var checked = form.querySelector('input[name="' + name + '"]:checked');
      var value = checked ? checked.value : "skip";
      memoryAnswers[name] = value;
      answers.push({
        id: name,
        value: value,
        urgent: fs.getAttribute("data-urgent") === "1",
        medical: fs.getAttribute("data-medical") === "1",
      });
    });
    return answers;
  }

  function score(answers) {
    var level = "low";
    var medical = false;
    var urgentYes = false;
    var yesCount = 0;

    answers.forEach(function (a) {
      if (a.value === "yes") {
        yesCount += 1;
        if (a.urgent) urgentYes = true;
        if (a.medical) medical = true;
      } else if (a.value === "unsure" || a.value === "skip") {
        if (a.urgent) {
          if (level === "low") level = "moderate";
        }
      }
    });

    if (urgentYes || medical) {
      level = "high";
    } else if (yesCount >= 2) {
      level = "high";
    } else if (yesCount === 1 || level === "moderate") {
      level = "moderate";
    }

    return { level: level, medical: medical, urgentYes: urgentYes, yesCount: yesCount };
  }

  function render(out) {
    var title =
      out.level === "high"
        ? root.getAttribute("data-high")
        : out.level === "moderate"
          ? root.getAttribute("data-moderate")
          : root.getAttribute("data-low");
    var text =
      out.level === "high"
        ? root.getAttribute("data-high-text")
        : out.level === "moderate"
          ? root.getAttribute("data-moderate-text")
          : root.getAttribute("data-low-text");

    var gaugeLow = root.getAttribute("data-gauge-low") || "Төмен";
    var gaugeMod = root.getAttribute("data-gauge-mod") || "Орташа";
    var gaugeHigh = root.getAttribute("data-gauge-high") || "Жоғары";
    var askAiText = root.getAttribute("data-ask-ai") || "AI-көмекшімен сөйлесу";

    result.hidden = false;
    result.className = "result-box level-" + out.level + " fade-in";

    var gaugeHtml =
      '<div class="risk-gauge" aria-hidden="true">' +
        '<div class="gauge-segments">' +
          '<div class="gauge-seg seg-low' + (out.level === 'low' ? ' is-active' : '') + '"><span>' + escapeHtml(gaugeLow) + '</span></div>' +
          '<div class="gauge-seg seg-mod' + (out.level === 'moderate' ? ' is-active' : '') + '"><span>' + escapeHtml(gaugeMod) + '</span></div>' +
          '<div class="gauge-seg seg-high' + (out.level === 'high' ? ' is-active' : '') + '"><span>' + escapeHtml(gaugeHigh) + '</span></div>' +
        '</div>' +
      '</div>';

    var html = gaugeHtml +
      '<div class="result-header">' +
        '<span class="level-indicator level-' + out.level + '"></span>' +
        '<h2>' + escapeHtml(title) + '</h2>' +
      '</div>' +
      '<p class="result-description">' + escapeHtml(text) + '</p>';

    if (out.level === "high" || out.urgentYes) {
      html +=
        '<div class="emergency-dials">' +
          '<p class="dials-title">Шұғыл байланыс нөмірлері:</p>' +
          '<div class="dials-row">' +
            '<a class="call-mini call-police" href="tel:102"><span class="call-icon">📞</span> 102 — Полиция</a>' +
            '<a class="call-mini call-emergency" href="tel:112"><span class="call-icon">🚨</span> 112 — Жедел қызмет</a>';
      if (out.medical) {
        html += '<a class="call-mini call-medical" href="tel:103"><span class="call-icon">🚑</span> 103 — Жедел жәрдем</a>';
      }
      html += '<a class="call-mini call-email" href="mailto:maratkyzyerkenaz9@gmail.com"><span class="call-icon">✉️</span> maratkyzyerkenaz9@gmail.com</a>';
      html += '</div></div>';
    }

    // Direct CTA to consult AI Assistant
    html +=
      '<div class="result-ai-cta">' +
        '<a href="/' + lang + '/assistant/" class="btn secondary">' +
          '<span>🤖 ' + escapeHtml(askAiText) + '</span>' +
        '</a>' +
      '</div>';

    result.innerHTML = html;

    // Smooth scroll down to result
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  showBtn.addEventListener("click", function () {
    render(score(readAnswers()));
  });

  resetBtn.addEventListener("click", function () {
    form.reset();
    memoryAnswers = Object.create(null);
    result.hidden = true;
    result.innerHTML = "";
    updateProgress();
    if (window.showToast) window.showToast("Сұрақтар тазартылды");
  });

  updateProgress();
})();
