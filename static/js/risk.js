/**
 * Risk assessment — memory of the current tab only.
 * Never writes to localStorage, sessionStorage, cookies, or the network.
 */
(function () {
  var root = document.getElementById("risk-app");
  var form = document.getElementById("risk-form");
  var result = document.getElementById("risk-result");
  var showBtn = document.getElementById("risk-show");
  var resetBtn = document.getElementById("risk-reset");
  if (!root || !form || !result || !showBtn || !resetBtn) return;

  // In-memory only for this page instance
  var memoryAnswers = Object.create(null);

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
      // unsure / skip never reduce urgency — they are treated as potential concern
      if (a.value === "yes") {
        yesCount += 1;
        if (a.urgent) urgentYes = true;
        if (a.medical) medical = true;
      } else if (a.value === "unsure" || a.value === "skip") {
        if (a.urgent) {
          // do not downgrade: keep at least moderate when urgent question unanswered
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

    return { level: level, medical: medical, urgentYes: urgentYes };
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

    result.hidden = false;
    result.className = "result-box level-" + out.level;
    var html = "<h2>" + escapeHtml(title) + "</h2><p>" + escapeHtml(text) + "</p>";
    if (out.level === "high" || out.urgentYes) {
      html +=
        '<p><a class="call-mini" href="tel:102">102</a>' +
        '<a class="call-mini" href="tel:112">112</a>';
      if (out.medical) {
        html += '<a class="call-mini" href="tel:103">103</a>';
      }
      html += "</p>";
    }
    result.innerHTML = html;
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
  });
})();
