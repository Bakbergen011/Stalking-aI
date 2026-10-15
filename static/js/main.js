/**
 * Stalking — main.js
 * Handles:
 * - Nav hamburger & ARIA state
 * - Dark mode theme switcher with persistence
 * - SOS panic overlay popup
 * - Number counter animations for statistics
 * - Back to top button with smooth scroll
 * - Toast notification utility (window.showToast)
 * - Scroll-aware sticky header
 */
(function () {
  'use strict';

  /* ── 1. Theme Toggle (Dark / Light Mode) ────────────────── */
  var themeToggle = document.getElementById('theme-toggle');
  var metaTheme = document.getElementById('meta-theme');

  function getPreferredTheme() {
    try {
      var saved = localStorage.getItem('stalking_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#0f172a');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#1b3252');
    }
  }

  var currentTheme = getPreferredTheme();
  applyTheme(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var activeTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      try {
        localStorage.setItem('stalking_theme', newTheme);
      } catch (e) {}
    });
  }

  // Listen for system theme changes if not manually overridden
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      try {
        if (!localStorage.getItem('stalking_theme')) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      } catch (err) {}
    });
  }

  /* ── 2. Nav hamburger ─────────────────────────────────────── */
  var toggle = document.getElementById('nav-toggle');
  var nav    = document.getElementById('site-nav');

  function openNav() {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', toggle.getAttribute('data-close') || 'Мәзірді жабу');
  }

  function closeNav() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', toggle.getAttribute('data-open') || 'Мәзірді ашу');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (
        nav.classList.contains('is-open') &&
        !nav.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closeNav();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        toggle.focus();
      }
    });

    // Close nav on link click (mobile UX)
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth < 900) closeNav();
      });
    });
  }

  /* ── 3. SOS Panic Button ──────────────────────────────────── */
  var sosBtn = document.getElementById('sos-btn');
  var sosPanel = document.getElementById('sos-panel');
  var sosClose = document.getElementById('sos-close');

  function toggleSos() {
    if (!sosPanel) return;
    var isOpen = !sosPanel.hidden;
    if (isOpen) {
      sosPanel.hidden = true;
      sosBtn.setAttribute('aria-expanded', 'false');
    } else {
      sosPanel.hidden = false;
      sosBtn.setAttribute('aria-expanded', 'true');
      var firstLink = sosPanel.querySelector('a');
      if (firstLink) firstLink.focus();
    }
  }

  function closeSos() {
    if (sosPanel && !sosPanel.hidden) {
      sosPanel.hidden = true;
      if (sosBtn) {
        sosBtn.setAttribute('aria-expanded', 'false');
        sosBtn.focus();
      }
    }
  }

  if (sosBtn && sosPanel) {
    sosBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleSos();
    });

    if (sosClose) {
      sosClose.addEventListener('click', function (e) {
        e.stopPropagation();
        closeSos();
      });
    }

    document.addEventListener('click', function (e) {
      if (!sosPanel.hidden && !sosPanel.contains(e.target) && e.target !== sosBtn && !sosBtn.contains(e.target)) {
        closeSos();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !sosPanel.hidden) {
        closeSos();
      }
    });
  }

  /* ── 4. Back to top button ────────────────────────────────── */
  var backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 320) {
        backToTop.hidden = false;
      } else {
        backToTop.hidden = true;
      }
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 5. Toast Notification System ─────────────────────────── */
  var toastContainer = document.getElementById('toast-container');
  window.showToast = function (message, duration) {
    if (!toastContainer) return;
    var toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration || 2600);
  };

  /* ── 6. Stat Counter Animation ────────────────────────────── */
  function animateValue(obj, start, end, duration) {
    var startTimestamp = null;
    var step = function (timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      var progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      var factor = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      obj.textContent = Math.floor(factor * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.textContent = end;
      }
    };
    window.requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-target'), 10);
          if (!isNaN(target)) {
            animateValue(el, 0, target, 1200);
          }
          statObserver.unobserve(el);
        }
      });
    }, { threshold: 0.25 });

    document.querySelectorAll('.stat-number').forEach(function (el) {
      statObserver.observe(el);
    });

    /* General card entrance animations */
    var cardObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(
      '.path-card, .phone-card, .guide-card, .source-card, .resource-card, .plan-section, .checklist-item, .stat-card'
    ).forEach(function (el) {
      cardObserver.observe(el);
    });
  }

  /* ── 8. Stealth Disguise Mode (Interactive Calculator) ────── */
  var stealthToggle = document.getElementById('stealth-toggle');
  var disguiseOverlay = document.getElementById('disguise-overlay');
  var secretExit = document.getElementById('disguise-secret-exit');
  var textExit = document.getElementById('disguise-text-exit');
  var calcScreen = document.getElementById('calc-screen');
  var calcButtons = document.querySelectorAll('.calc-btn');

  var calcCurrent = '0';
  var calcPrev = null;
  var calcOp = null;
  var calcResetScreen = false;

  function updateCalcDisplay() {
    if (calcScreen) calcScreen.textContent = calcCurrent;
  }

  function openDisguise() {
    if (disguiseOverlay) {
      disguiseOverlay.hidden = false;
      disguiseOverlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      calcCurrent = '0';
      calcPrev = null;
      calcOp = null;
      updateCalcDisplay();
    }
  }

  function closeDisguise() {
    if (disguiseOverlay) {
      disguiseOverlay.hidden = true;
      disguiseOverlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  var btnExitBottom = document.getElementById('btn-exit-disguise');
  var titleExit = document.getElementById('disguise-title-exit');

  if (stealthToggle) {
    stealthToggle.addEventListener('click', openDisguise);
  }
  if (secretExit) {
    secretExit.addEventListener('click', closeDisguise);
  }
  if (textExit) {
    textExit.addEventListener('click', closeDisguise);
  }
  if (btnExitBottom) {
    btnExitBottom.addEventListener('click', closeDisguise);
  }
  if (titleExit) {
    titleExit.addEventListener('click', closeDisguise);
  }

  // Click outside calculator card to exit
  if (disguiseOverlay) {
    disguiseOverlay.addEventListener('click', function (e) {
      if (e.target === disguiseOverlay) {
        closeDisguise();
      }
    });
  }

  calcButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var num = btn.getAttribute('data-num');
      var act = btn.getAttribute('data-act');

      if (num !== null) {
        if (calcCurrent === '0' || calcResetScreen) {
          calcCurrent = num;
          calcResetScreen = false;
        } else {
          calcCurrent += num;
        }
        updateCalcDisplay();
        return;
      }

      if (act === 'clear') {
        calcCurrent = '0';
        calcPrev = null;
        calcOp = null;
        calcResetScreen = false;
        updateCalcDisplay();
      } else if (act === 'dot') {
        if (calcCurrent.indexOf('.') === -1) {
          calcCurrent += '.';
          updateCalcDisplay();
        }
      } else if (act === 'sign') {
        calcCurrent = (parseFloat(calcCurrent) * -1).toString();
        updateCalcDisplay();
      } else if (act === 'percent') {
        calcCurrent = (parseFloat(calcCurrent) / 100).toString();
        updateCalcDisplay();
      } else if (act === 'add' || act === 'subtract' || act === 'multiply' || act === 'divide') {
        calcPrev = parseFloat(calcCurrent);
        calcOp = act;
        calcResetScreen = true;
      } else if (act === 'equals') {
        if (calcOp && calcPrev !== null) {
          var curr = parseFloat(calcCurrent);
          var res = 0;
          if (calcOp === 'add') res = calcPrev + curr;
          else if (calcOp === 'subtract') res = calcPrev - curr;
          else if (calcOp === 'multiply') res = calcPrev * curr;
          else if (calcOp === 'divide') res = curr !== 0 ? calcPrev / curr : 'Error';
          calcCurrent = res.toString();
          calcPrev = null;
          calcOp = null;
          calcResetScreen = true;
          updateCalcDisplay();
        }
      }
    });
  });

  // Keyboard shortcut to close stealth: Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && disguiseOverlay && !disguiseOverlay.hidden) {
      closeDisguise();
    }
  });
})();
