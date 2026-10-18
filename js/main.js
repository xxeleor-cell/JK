/*
 * Небольшие улучшения интерфейса. Сайт полностью работает и без JavaScript.
 * Нет сторонних библиотек, нет аналитики, нет отправки данных.
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Шапка: граница при прокрутке ---------- */
  var header = $('[data-header]');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  var burger = $('[data-burger]');
  var nav = $('[data-nav]');
  var burgerLabel = $('[data-burger-label]');
  var outside = $$('main, footer, .ph-banner');
  var mqDesktop = window.matchMedia('(min-width: 1180px)');

  function setMenu(open, opts) {
    if (!burger || !nav) return;
    burger.setAttribute('aria-expanded', String(open));
    if (burgerLabel) burgerLabel.textContent = open ? 'Закрыть меню' : 'Открыть меню';
    // Меню начинается сразу под шапкой (над ней может быть плашка)
    if (open) nav.style.setProperty('--menu-top', Math.round(header.getBoundingClientRect().bottom) + 'px');
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-active', open);
    document.body.classList.toggle('menu-open', open);
    // Пока меню открыто, остальная страница недоступна для фокуса и скринридеров
    outside.forEach(function (el) { open ? el.setAttribute('inert', '') : el.removeAttribute('inert'); });
    if (open) {
      var first = $('.nav__link', nav);
      if (first) first.focus({ preventScroll: true });
    } else if (!(opts && opts.silent)) {
      burger.focus({ preventScroll: true });
    }
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && burger.getAttribute('aria-expanded') === 'true') setMenu(false, { silent: true });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
    var onBreakpoint = function (e) { if (e.matches) setMenu(false, { silent: true }); };
    if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', onBreakpoint);
    else if (mqDesktop.addListener) mqDesktop.addListener(onBreakpoint);
  }

  /* ---------- Подсветка активного раздела в навигации ---------- */
  var navLinks = $$('.nav__link');
  // Наблюдаем все секции: на разделах вне меню подсветка снимается
  var sections = $$('main section[id]');

  function setActive(id) {
    navLinks.forEach(function (a) {
      var active = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Плавное появление блоков ---------- */
  var revealEls = $$('[data-reveal]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    // Небольшая задержка для элементов одной группы — эффект «лесенки»
    revealEls.forEach(function (el) {
      var parent = el.parentElement;
      var siblings = parent ? $$(':scope > [data-reveal]', parent) : [];
      var i = siblings.indexOf(el);
      if (i > 0) el.style.setProperty('--reveal-delay', Math.min(i, 6) * 0.07 + 's');
    });
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { revealer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Мобильная кнопка записи ---------- */
  var mobileCta = $('[data-mobile-cta]');
  var hero = $('.hero');
  var contact = $('#contact');
  if (mobileCta && hero && contact && 'IntersectionObserver' in window) {
    // Кнопка скрыта, пока на экране первый экран, блок записи или подвал
    var ctaLink = $('a', mobileCta);
    var visibleZones = new Set();
    var zoneObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visibleZones.add(e.target); else visibleZones.delete(e.target);
      });
      var show = visibleZones.size === 0;
      mobileCta.classList.toggle('is-visible', show);
      mobileCta.setAttribute('aria-hidden', String(!show));
      if (ctaLink) ctaLink.tabIndex = show ? 0 : -1;
    }, { threshold: 0 });
    [hero, contact, $('.footer')].forEach(function (el) { if (el) zoneObserver.observe(el); });
  }

  /* ---------- Копирование шаблона сообщения ---------- */
  $$('[data-copy]').forEach(function (btn) {
    var source = $(btn.getAttribute('data-copy'));
    var label = $('[data-copy-label]', btn);
    var status = $('[data-copy-status]', btn.parentElement);
    var timer;
    btn.addEventListener('click', function () {
      if (!source) return;
      var text = source.textContent.trim();
      var done = function (ok) {
        if (status) status.textContent = ok ? 'Текст скопирован — вставьте его в сообщение.' : 'Не удалось скопировать. Выделите текст вручную.';
        if (label) label.textContent = ok ? 'Скопировано' : 'Скопировать текст';
        clearTimeout(timer);
        timer = setTimeout(function () {
          if (label) label.textContent = 'Скопировать текст';
          if (status) status.textContent = '';
        }, 4000);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
      } else {
        done(fallbackCopy(text));
      }
    });
  });

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  /* ---------- Просмотр документов ---------- */
  var dialog = $('[data-doc-dialog]');
  if (dialog && typeof dialog.showModal === 'function') {
    var dImg = $('[data-doc-dialog-img]', dialog);
    var dTitle = $('[data-doc-dialog-title]', dialog);
    var lastTrigger = null;

    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[data-doc]');
      if (!link) return;
      e.preventDefault();
      lastTrigger = link;
      var title = link.getAttribute('data-doc-title') || 'Документ';
      dTitle.textContent = title;
      dImg.alt = 'Скан: ' + title;
      dImg.src = link.getAttribute('href');
      dialog.showModal();
    });

    $('[data-doc-dialog-close]', dialog).addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () {
      dImg.removeAttribute('src');
      if (lastTrigger) lastTrigger.focus();
    });
  }

  /* ---------- Текущий год ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
