/**
 * AI assistant UI — sends only the textarea text after consent + click.
 * Does not read risk/plan/evidence/statement fields.
 * Does not store chat in localStorage/sessionStorage.
 */
(function () {
  var root = document.getElementById("assistant-app");
  if (!root) return;

  var configured = root.getAttribute("data-configured") === "1";
  var consent = document.getElementById("ai-consent");
  var input = document.getElementById("chat-input");
  var form = document.getElementById("chat-form");
  var sendBtn = document.getElementById("chat-send");
  var clearBtn = document.getElementById("chat-clear");
  var log = document.getElementById("chat-log");
  var lang = root.getAttribute("data-lang") || "ru";

  // In-tab memory only
  var messages = [];

  function syncEnabled() {
    var ok = configured && consent && consent.checked;
    if (input) input.disabled = !ok;
    if (sendBtn) sendBtn.disabled = !ok;
  }

  function bubble(role, text) {
    var div = document.createElement("div");
    div.className = "chat-bubble " + role;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function csrfToken() {
    var el = form ? form.querySelector("[name=csrfmiddlewaretoken]") : null;
    return el ? el.value : "";
  }

  if (consent) {
    consent.addEventListener("change", syncEnabled);
  }
  syncEnabled();

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      messages = [];
      if (log) log.innerHTML = "";
      if (input) input.value = "";
    });
  }

  if (!form || !configured) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!consent.checked) return;
    var text = (input.value || "").trim();
    if (!text) return;

    bubble("user", text);
    messages.push({ role: "user", text: text });
    input.value = "";
    sendBtn.disabled = true;
    bubble("ai", root.getAttribute("data-loading") || "...");

    var body = new FormData();
    body.append("message", text);
    body.append("lang", lang);
    body.append("consent", "1");
    body.append("csrfmiddlewaretoken", csrfToken());

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
        // remove loading bubble
        if (log.lastChild) log.removeChild(log.lastChild);
        if (payload.data && payload.data.ok) {
          bubble("ai", payload.data.reply);
          messages.push({ role: "ai", text: payload.data.reply });
        } else {
          bubble(
            "ai",
            (payload.data && payload.data.error) ||
              root.getAttribute("data-network")
          );
        }
      })
      .catch(function () {
        if (log.lastChild) log.removeChild(log.lastChild);
        bubble("ai", root.getAttribute("data-network"));
      })
      .finally(function () {
        syncEnabled();
      });
  });
})();
