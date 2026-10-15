/**
 * Safety plan — DOM only, never persisted.
 * Includes Safe PDF Export with camouflage filename.
 */
(function () {
  'use strict';

  var root = document.getElementById("plan-app");
  var clearBtn = document.getElementById("plan-clear");
  var exportBtn = document.getElementById("plan-export-pdf");
  if (!root) return;

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      root.querySelectorAll("textarea").forEach(function (el) {
        el.value = "";
      });
      if (window.showToast) window.showToast("Жоспар тазартылды");
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      var oldTitle = document.title;
      // Camouflage title so downloaded PDF has a harmless, neutral filename
      document.title = "Жұмыс_жазбалары_және_рецепттер";

      if (window.showToast) window.showToast("PDF сақталуда…");

      setTimeout(function () {
        window.print();
        setTimeout(function () {
          document.title = oldTitle;
        }, 1000);
      }, 200);
    });
  }
})();
