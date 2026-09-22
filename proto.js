(function () {
  var doc = document.documentElement;
  var W = parseInt(doc.getAttribute('data-w'), 10) || 0;
  var fit = doc.getAttribute('data-fit') || 'max1';
  function applyZoom() {
    if (!W) return;
    var z = window.innerWidth / W;
    if (fit === 'max1') z = Math.min(1, z);
    doc.style.zoom = z;
  }
  applyZoom();
  window.addEventListener('resize', applyZoom);

  var P = window.PROTO || {};
  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function find(list, id) { return (list || []).filter(function (x) { return x[0] === id; })[0]; }

  function setPersona(id) {
    var p = find(P.personas, id); if (!p) return;
    all('[data-persona]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-persona') === id); });
    var map = { 'sel.label': p[1].toLowerCase(), 'sel.build': p[3], 'sel.desc': p[4] };
    all('[data-bind]').forEach(function (e) { var k = e.getAttribute('data-bind'); if (map[k] != null) e.textContent = map[k]; });
    all('[data-bind-src="sel.img"]').forEach(function (e) { e.src = p[5]; e.alt = p[3]; });
  }
  all('[data-persona]').forEach(function (b) { b.addEventListener('click', function () { setPersona(b.getAttribute('data-persona')); }); });

  function setJob(id) {
    var j = find(P.jobs, id); if (!j) return;
    all('[data-job]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-job') === id); });
    all('[data-bind="jobLabel"]').forEach(function (e) { e.textContent = j[1].toLowerCase(); });
    var tpl = document.getElementById('items-tpl'), box = document.querySelector('[data-items]');
    if (tpl && box) box.innerHTML = j[2].map(function (it) { return tpl.innerHTML.replace(/%NAME%/g, it[0]).replace(/%NOTE%/g, it[1]); }).join('');
  }
  all('[data-job]').forEach(function (b) { b.addEventListener('click', function () { setJob(b.getAttribute('data-job')); }); });

  all('[data-chip]').forEach(function (b) {
    b.addEventListener('click', function () { all('[data-chip]', b.parentNode).forEach(function (x) { x.classList.toggle('on', x === b); }); });
  });

  all('[data-slider]').forEach(function (root) {
    var input = root.querySelector('[data-cut="input"]'); if (!input) return;
    function set(v) {
      v = Math.max(0, Math.min(100, +v));
      var img = root.querySelector('[data-cut="img"]'); if (img) img.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      all('[data-cut="left"]', root).forEach(function (e) { e.style.left = v + '%'; });
    }
    input.addEventListener('input', function () { set(input.value); });
    set(input.value);
  });
})();
