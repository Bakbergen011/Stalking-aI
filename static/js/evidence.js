/** Evidence checklist — export only on explicit click; no auto-save.
 * Answers remain in tab memory only — never stored anywhere. */
(function () {
  var root = document.getElementById("evidence-app");
  var exportBtn = document.getElementById("evidence-export");
  var clearBtn = document.getElementById("evidence-clear");
  if (!root || !exportBtn || !clearBtn) return;

  function collect() {
    var exportTitle = root.getAttribute("data-export-title") || "Stalking дәлелдер тізімі (жергілікті экспорт)";
    var exportNote = root.getAttribute("data-export-note") || "ескертпе:";
    var exportDisclaimer = root.getAttribute("data-export-disclaimer") || "Бұл файл тек құрылғыңызда сақталады. Соттың қабылдауына кепілдік жоқ.";
    var lines = [exportTitle, ""];
    root.querySelectorAll("#evidence-list > li").forEach(function (li) {
      var cb = li.querySelector('input[type="checkbox"]');
      var label = li.querySelector("label[for]");
      var note = li.querySelector("textarea");
      var mark = cb && cb.checked ? "[x]" : "[ ]";
      lines.push(mark + " " + (label ? label.textContent.trim() : ""));
      if (note && note.value.trim()) {
        lines.push("    " + exportNote + " " + note.value.trim());
      }
    });
    lines.push("");
    lines.push(exportDisclaimer);
    return lines.join("\n");
  }

  exportBtn.addEventListener("click", function () {
    var warn = root.querySelector(".warn-inline");
    if (warn && !window.confirm(warn.textContent.trim())) return;
    var blob = new Blob([collect()], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "stalking-evidence-checklist.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  clearBtn.addEventListener("click", function () {
    root.querySelectorAll('input[type="checkbox"]').forEach(function (el) {
      el.checked = false;
    });
    root.querySelectorAll("textarea").forEach(function (el) {
      el.value = "";
    });
  });
})();
