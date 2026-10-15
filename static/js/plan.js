/** Safety plan — DOM only, never persisted. */
(function () {
  var root = document.getElementById("plan-app");
  var clearBtn = document.getElementById("plan-clear");
  if (!root || !clearBtn) return;

  clearBtn.addEventListener("click", function () {
    root.querySelectorAll("textarea").forEach(function (el) {
      el.value = "";
    });
  });
})();
