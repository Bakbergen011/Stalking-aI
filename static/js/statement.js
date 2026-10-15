/** Statement draft — built locally, never auto-submitted. */
(function () {
  var root = document.getElementById("statement-app");
  var buildBtn = document.getElementById("statement-build");
  var clearBtn = document.getElementById("statement-clear");
  var output = document.getElementById("statement-output");
  if (!root || !buildBtn || !clearBtn || !output) return;

  function val(name) {
    var el = root.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : "";
  }

  buildBtn.addEventListener("click", function () {
    var disclaimer = root.getAttribute("data-disclaimer") || "Бұл тек жергілікті жоба. Заңгерлік кеңес емес. Автоматты түрде жіберілмейді.";
    var text = [
      val("who"),
      "",
      val("from"),
      "",
      val("when"),
      "",
      val("what"),
      "",
      val("request"),
      "",
      "---",
      disclaimer,
    ].join("\n");
    output.value = text;
  });

  clearBtn.addEventListener("click", function () {
    root.querySelectorAll("input, textarea").forEach(function (el) {
      el.value = "";
    });
  });
})();
