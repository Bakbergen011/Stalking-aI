/**
 * Stalking — main.js
 * Handles: nav toggle, ARIA state, focus trap (nav), scroll-aware header.
 * No analytics, no localStorage, no external calls.
 */
(function () {
  'use strict';

  /* ── Nav hamburger ─────────────────────────────────────── */
  var toggle = document.getElementById('nav-toggle');
  var nav    = document.getElementById('site-nav');

  function openNav() {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', toggle.getAttribute('data-close') || 'Закрыть меню');
  }

  function closeNav() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', toggle.getAttribute('data-open') || 'Открыть меню');
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

  /* ── Scroll-aware sticky header shadow ─────────────────── */
  var header = document.querySelector('.site-header');
  if (header) {
    var lastScroll = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > 8) {
        header.style.boxShadow = '0 2px 20px rgba(26,43,74,0.1)';
      } else {
        header.style.boxShadow = '';
      }
      lastScroll = y;
    }, { passive: true });
  }

  /* ── Animate elements on intersection ──────────────────── */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll(
      '.path-card, .phone-card, .guide-card, .source-card, .resource-card, .plan-section, .checklist-item'
    ).forEach(function (el) {
      io.observe(el);
    });
  }
})();
