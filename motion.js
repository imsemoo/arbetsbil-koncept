/* Arbetsbil prototype motion: scroll reveals, hero intro, self-demonstrating slider, drawn annotations, content swaps. */
(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = window.requestAnimationFrame;
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  root.classList.add('m');

  // ---- collect reveal units -------------------------------------------------
  var units = [];
  function unit(el, d) {
    if (!el || el.__rv) return;
    el.__rv = 1; el.classList.add('rv'); el.style.setProperty('--d', d + 'ms'); units.push(el);
  }
  function isGrid(el) { return el.children.length >= 2 && getComputedStyle(el).display === 'grid'; }
  var heroImgs = $$('[data-hero-img]'), annots = $$('[data-annot]');
  var skip = heroImgs.concat(annots);

  $$('.root > section, .root > footer, .root > div').forEach(function (block) {
    if (block.offsetHeight < 120 || skip.indexOf(block) >= 0) return;
    if (getComputedStyle(block).position === 'fixed') return;
    var container = (block.tagName === 'SECTION' && block.children.length === 1) ? block.firstElementChild : block;
    var kids = Array.prototype.filter.call(container.children, function (k) {
      return getComputedStyle(k).position !== 'absolute' && skip.indexOf(k) < 0;
    });
    var hero = block.hasAttribute('data-hero');
    var d = 0, step = hero ? 110 : 90;
    kids.forEach(function (k) {
      if (hero && kids.length <= 2 && k.children.length >= 3 && !isGrid(k)) {
        Array.prototype.forEach.call(k.children, function (c) { unit(c, d); d += step; });
        return;
      }
      if (isGrid(k) && k.children.length <= 12) {
        Array.prototype.forEach.call(k.children, function (c) { if (skip.indexOf(c) < 0) { unit(c, d); d += 70; } });
        return;
      }
      unit(k, d); d += step;
    });
  });

  // ---- reveal on intersection ---------------------------------------------
  function show(el) {
    el.classList.add('in');
    var d = parseFloat(el.style.getPropertyValue('--d')) || 0;
    setTimeout(function () { el.classList.remove('rv', 'in'); el.style.removeProperty('--d'); el.classList.add('shown'); }, d + 1400);
    var slider = el.matches('[data-slider]') ? el : el.querySelector('[data-slider]');
    if (slider) demoSlider(slider);
    $$('[data-count]', el).concat(el.matches('[data-count]') ? [el] : []).forEach(count);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
  // the last rows of the page can never cross the margin line: reveal whatever is left once the bottom is reached
  function revealRest() { units.forEach(function (u) { if (u.classList.contains('rv') && !u.classList.contains('in')) show(u); }); }
  window.addEventListener('scroll', function () {
    if (document.documentElement.getBoundingClientRect().bottom <= window.innerHeight + 4) revealRest();
  }, { passive: true });

  // ---- hero image wipe ------------------------------------------------------
  heroImgs.forEach(function (h) { h.classList.add('wipe'); });
  var ioHero = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ioHero.unobserve(e.target); } });
  }, { threshold: 0.05 });

  // ---- engineering annotations ---------------------------------------------
  annots.forEach(function (a) {
    a.classList.add('annot');
    $$('svg path', a).forEach(function (p, i) { p.setAttribute('pathLength', '1'); p.style.transitionDelay = (500 + i * 170) + 'ms'; });
    $$('svg circle', a).forEach(function (c, i) { c.style.transitionDelay = (450 + i * 170) + 'ms'; });
    $$(':scope > span, :scope > div', a).forEach(function (l, i) { l.style.transitionDelay = (850 + i * 170) + 'ms'; });
  });
  var ioAnnot = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ioAnnot.unobserve(e.target); } });
  }, { threshold: 0.2 });

  // ---- before/after slider: one gentle self-demo, cancelled by touch -------
  function demoSlider(s) {
    if (reduce || s.__demo) return;
    s.__demo = 1;
    var input = s.querySelector('[data-cut="input"]'); if (!input) return;
    var stop = false;
    s.addEventListener('pointerdown', function () { stop = true; }, { once: true });
    setTimeout(function () {
      var t0 = null, dur = 2400;
      function frame(ts) {
        if (stop) return;
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var e = 0.5 - 0.5 * Math.cos(Math.PI * 2 * p);   // 50 -> 30 -> 50, sinusoidal
        input.value = 50 - 20 * e;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        if (p < 1) raf(frame); else s.setAttribute('data-demo', 'done');
      }
      raf(frame);
    }, 800);
  }

  // ---- counters (63) --------------------------------------------------------
  function count(el) {
    if (el.__c) return; el.__c = 1;
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    if (reduce) { el.textContent = target; return; }
    el.style.fontVariantNumeric = 'tabular-nums';
    var t0 = null, dur = 1100;
    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e);
      if (p < 1) raf(frame);
    }
    setTimeout(function () { raf(frame); }, 350);
  }

  // ---- persona / job swaps: fade the old content out, new content in --------
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-persona], [data-job]') : null;
    if (!b || reduce) return;
    var isJob = b.hasAttribute('data-job');
    var targets = isJob ? $$('[data-bind="jobLabel"]') : $$('[data-bind-src="sel.img"], [data-bind]');
    var box = isJob ? document.querySelector('[data-items]') : null;
    targets.forEach(function (t) { t.classList.add('swap', 'out'); });
    if (box) box.style.opacity = '0';
    setTimeout(function () {
      targets.forEach(function (t) { void t.offsetWidth; t.classList.remove('out'); });
      if (box) {
        var rows = Array.prototype.slice.call(box.children);
        rows.forEach(function (r, i) { r.classList.add('rv'); r.style.setProperty('--d', (i * 60) + 'ms'); });
        box.style.opacity = '';
        void box.offsetWidth;
        rows.forEach(function (r) { r.classList.add('in'); });
        setTimeout(function () { rows.forEach(function (r) { r.classList.remove('rv', 'in'); r.style.removeProperty('--d'); }); }, 1000);
      }
    }, 40);
  }, true);

  // ---- mobile action bar slides up --------------------------------------------
  var bars = $$('.root > div[style*="position: fixed"]');
  bars.forEach(function (bar) { bar.classList.add('bar'); });

  // ---- start once the webfonts are in (capped), so the intro plays in the real typeface
  var started = false;
  function start() {
    if (started) return; started = true;
    units.forEach(function (u) { io.observe(u); });
    heroImgs.forEach(function (h) { ioHero.observe(h); });
    annots.forEach(function (a) { ioAnnot.observe(a); });
    raf(function () {
      root.classList.add('m-ready');
      raf(function () { bars.forEach(function (bar) { bar.classList.add('in'); }); });
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start);
  setTimeout(start, 900);
})();
