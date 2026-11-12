/* Graf wpisów i szukajka na górze /blog/ (_layouts/blog-list.html).
   Dane: assets/data/graf.json (budowane z _posts). Style: landing.css, sekcja „Blog: graf”.
   Kropka to wpis, linia to link w treści jednego wpisu do drugiego, większa kropka = więcej linków do wpisu.
   Wyszukiwane frazy idą do GoatCounter jako zdarzenia „szukaj/<fraza>”, kliknięte wyniki jako „szukaj-klik/<wpis>”. */
(function () {
  var box = document.getElementById('graf');
  if (!box) return;
  var input = document.getElementById('graf-q');
  var out = document.getElementById('graf-wyniki');
  var count = document.getElementById('graf-ile');
  var svg = box.querySelector('svg');
  var panel = document.getElementById('graf-panel');
  var NS = 'http://www.w3.org/2000/svg';
  var W = 1120, H = 560;

  var norm = function (s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  };

  /* GoatCounter: fraza po 1,5 s bez pisania albo po Enter, od 3 znaków, każda raz na wizytę */
  var sent = {}, timer = null, lastQ = '', lastN = 0;
  function track(path, title) {
    if (sent[path]) return;
    sent[path] = true;
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: path, title: title, event: true });
  }
  function logQuery() {
    clearTimeout(timer);
    var q = lastQ.trim().toLowerCase().slice(0, 40);
    if (q.length >= 3) track('szukaj/' + q, q + ' (' + (lastN || 'brak') + ' wyników)');
  }

  fetch(box.getAttribute('data-src')).then(function (r) { return r.json(); }).then(init).catch(function () {});

  function init(data) {
    var P = data.wpisy, T = data.tematy, byId = {};
    P.forEach(function (p) { byId[p.id] = p; p.in = 0; p.ins = []; p.s = norm(p.t + ' ' + p.e + ' ' + p.g.join(' ')); });
    var E = [], seen = {};
    P.forEach(function (p) {
      p.l.forEach(function (l) {
        if (!byId[l]) return;
        byId[l].in++; byId[l].ins.push(p.id);
        var k = p.id < l ? p.id + '|' + l : l + '|' + p.id;
        if (!seen[k]) { seen[k] = 1; E.push([p, byId[l]]); }
      });
    });

    /* Układ: tematy na elipsie, w środku prosta symulacja sił (odpychanie, sprężyny linków, przyciąganie do tematu) */
    var keys = Object.keys(T).filter(function (k) { return P.some(function (p) { return p.c === k; }); });
    var C = {};
    keys.forEach(function (k, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / keys.length;
      C[k] = { x: W / 2 + Math.cos(a) * 380, y: H / 2 + 12 + Math.sin(a) * 190 };
    });
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    P.forEach(function (p) {
      p.r = 4 + Math.sqrt(p.in) * 3.2;
      p.x = C[p.c].x + (rnd() - .5) * 60; p.y = C[p.c].y + (rnd() - .5) * 60; p.vx = 0; p.vy = 0;
    });
    for (var it = 0; it < 300; it++) {
      var alpha = 1 - it / 300;
      for (var i = 0; i < P.length; i++) {
        var a = P[i];
        for (var j = i + 1; j < P.length; j++) {
          var b = P[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy || .01, d = Math.sqrt(d2);
          if (d2 > 22500) continue;
          var f = 90 / d2, min = a.r + b.r + 4;
          if (d < min) f += (min - d) / d * .5;
          a.vx -= dx * f * alpha; a.vy -= dy * f * alpha; b.vx += dx * f * alpha; b.vy += dy * f * alpha;
        }
        a.vx += (C[a.c].x - a.x) * .012; a.vy += (C[a.c].y - a.y) * .012;
      }
      E.forEach(function (e) {
        var dx = e[1].x - e[0].x, dy = e[1].y - e[0].y;
        e[0].vx += dx * .004 * alpha; e[0].vy += dy * .004 * alpha; e[1].vx -= dx * .004 * alpha; e[1].vy -= dy * .004 * alpha;
      });
      P.forEach(function (p) {
        var v = Math.sqrt(p.vx * p.vx + p.vy * p.vy); if (v > 8) { p.vx *= 8 / v; p.vy *= 8 / v; }
        p.x += p.vx; p.y += p.vy; p.vx *= .6; p.vy *= .6;
        p.x = Math.max(p.r + 6, Math.min(W - p.r - 6, p.x)); p.y = Math.max(p.r + 30, Math.min(H - p.r - 6, p.y));
      });
    }

    /* Rysowanie */
    var el = function (n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; };
    var gE = el('g', { 'class': 'edges' }), gN = el('g', { 'class': 'nodes' }), gL = el('g', { 'class': 'topics', 'aria-hidden': 'true' });
    E.forEach(function (e) {
      e.el = el('line', { x1: e[0].x.toFixed(1), y1: e[0].y.toFixed(1), x2: e[1].x.toFixed(1), y2: e[1].y.toFixed(1) });
      gE.appendChild(e.el);
    });
    P.forEach(function (p) {
      var a = el('a', { href: p.u, 'aria-label': p.t, 'class': 't-' + p.c });
      a.appendChild(el('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: p.r.toFixed(1) }));
      var t = el('title', {}); t.textContent = p.t; a.appendChild(t);
      a.addEventListener('click', function (e) { e.preventDefault(); select(p.id); });
      p.el = a; gN.appendChild(a);
    });
    keys.forEach(function (k) {
      var ns = P.filter(function (p) { return p.c === k; });
      var x = ns.reduce(function (s, p) { return s + p.x; }, 0) / ns.length;
      var y = Math.min.apply(null, ns.map(function (p) { return p.y - p.r; })) - 12;
      var t = el('text', { x: x.toFixed(0), y: Math.max(16, y).toFixed(0), 'text-anchor': 'middle', 'class': 't-' + k });
      t.textContent = T[k]; gL.appendChild(t);
    });
    svg.appendChild(gE); svg.appendChild(gN); svg.appendChild(gL);
    box.classList.add('ready');

    /* Panel po prawej: wybrany wpis i jego powiązania, bez wyboru wpisy, do których prowadzi najwięcej linków */
    var selected = null;
    var fmt = function (d) { return new Date(d + 'T12:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }); };
    var item = function (id) { var p = byId[id]; return '<li><button type="button" data-id="' + esc(id) + '"><i class="dot t-' + esc(p.c) + '"></i><span>' + esc(p.t) + '</span></button></li>'; };
    function renderPanel() {
      var p = selected && byId[selected];
      if (!p) {
        var top = P.slice().sort(function (a, b) { return b.in - a.in; }).slice(0, 6);
        panel.innerHTML = '<span class="meta">Wybierz wpis</span><h3>Od czego zacząć</h3>' +
          '<p>Kliknij kropkę na grafie albo jeden z wpisów, do których prowadzi najwięcej linków:</p><ul>' + top.map(function (t) { return item(t.id); }).join('') + '</ul>';
        return;
      }
      /* Powiązane: linki w obie strony, bez powtórzeń, od najnowszego */
      var rel = [], seenRel = {};
      p.l.concat(p.ins).forEach(function (l) { if (byId[l] && !seenRel[l]) { seenRel[l] = 1; rel.push(l); } });
      rel.sort(function (x, y) { return byId[y].d.localeCompare(byId[x].d); });
      panel.innerHTML = '<span class="meta t-' + esc(p.c) + '">' + esc(T[p.c]) + '</span><h3>' + esc(p.t) + '</h3><time>' + fmt(p.d) + '</time><p>' + esc(p.e) + '</p>' +
        '<a class="open" href="' + esc(p.u) + '" data-id="' + esc(p.id) + '">Otwórz wpis →</a>' +
        '<h4>Powiązane (' + rel.length + ')</h4>' + (rel.length ? '<ul>' + rel.map(item).join('') + '</ul>' : '<p>Ten wpis nie ma jeszcze powiązanych wpisów.</p>');
    }
    function select(id) {
      selected = selected === id ? null : id;
      var p = selected && byId[selected], nb = {};
      if (p) { nb[p.id] = 1; p.l.forEach(function (l) { nb[l] = 1; }); p.ins.forEach(function (l) { nb[l] = 1; }); }
      box.classList.toggle('selecting', !!p);
      P.forEach(function (q) { q.el.classList.toggle('nb', !!nb[q.id]); q.el.classList.toggle('sel', q.id === selected); });
      E.forEach(function (e) { e.el.classList.toggle('on', !!(p && (e[0] === p || e[1] === p))); });
      renderPanel();
    }
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-id]');
      if (b) { select(b.getAttribute('data-id')); return; }
      var a = e.target.closest('a.open');
      if (a) track((input.value.trim() ? 'szukaj-klik/' : 'graf-klik/') + a.getAttribute('data-id'), byId[a.getAttribute('data-id')].t);
    });
    renderPanel();
    /* Kliknięcie w puste miejsce grafu wraca do stanu początkowego */
    svg.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      if (selected) select(selected);
      if (input.value) { logQuery(); input.value = ''; search(); }
    });

    /* Szukanie */
    function search() {
      var q = norm(input.value.trim());
      lastQ = input.value;
      if (selected) select(selected);
      var words = q.split(/\s+/).filter(Boolean);
      var hit = words.length ? P.filter(function (p) { return words.every(function (w) { return p.s.indexOf(w) > -1; }); }) : [];
      var on = {}; hit.forEach(function (p) { on[p.id] = 1; });
      lastN = hit.length;
      box.classList.toggle('searching', words.length > 0);
      P.forEach(function (p) { p.el.classList.toggle('hit', !!on[p.id]); });
      E.forEach(function (e) { e.el.classList.toggle('hit', !!(on[e[0].id] && on[e[1].id])); });
      if (!words.length) { out.innerHTML = ''; count.textContent = ''; return; }
      count.textContent = hit.length ? (hit.length + ' ' + (hit.length === 1 ? 'wpis' : (hit.length % 10 >= 2 && hit.length % 10 <= 4 && (hit.length % 100 < 10 || hit.length % 100 >= 20) ? 'wpisy' : 'wpisów'))) : 'Nic nie znalazłem. Spróbuj innego słowa.';
      /* Ten sam wygląd co lista „Wszystkie wpisy” (.index-list), data z rokiem, bo wyniki są z różnych lat */
      out.innerHTML = hit.map(function (p) {
        var d = p.d.split('-');
        return '<li><time datetime="' + esc(p.d) + '">' + d[2] + '.' + d[1] + '.' + d[0] + '</time><a href="' + esc(p.u) + '" data-id="' + esc(p.id) + '"><h3>' + esc(p.t) + '</h3><p>' + esc(p.e) + '</p></a>' +
          (p.g[0] ? '<span class="meta">' + esc(p.g[0]) + '</span>' : '') + '</li>';
      }).join('');
    }
    input.addEventListener('input', function () { search(); clearTimeout(timer); timer = setTimeout(logQuery, 1500); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); logQuery(); } });
    input.form && input.form.addEventListener('submit', function (e) { e.preventDefault(); });
    out.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a) { logQuery(); track('szukaj-klik/' + a.getAttribute('data-id'), a.querySelector('h3').textContent); }
    });
    window.addEventListener('pagehide', logQuery);
    if (input.value) search();
  }
})();
