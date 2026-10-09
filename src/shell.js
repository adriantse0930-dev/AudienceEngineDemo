// Shell: hash router, menu, tool header, About panel, Run sample and transitions.
// Tool pages live in an iframe (srcdoc); the shell never reaches into them except to
// call window.demoSample().
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var view = $('view'), menu = $('menu'), tool = $('tool'), notFound = $('notFound');
  var REDUCE = !/[?&]motion/.test(location.search) && !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var EASE = 'cubic-bezier(.2,.8,.2,1)';
  var current = null, lastCard = null;
  var BY_ROUTE = {};
  TOOLS.forEach(function (t) { BY_ROUTE[t.route] = t; });

  var ICONS = {
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.3 3.3 0 0 1 0 6.5M18 14.8c2 .7 3.2 2.5 3.6 5.2"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    swap: '<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="1.8"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.8"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    map: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
    merge: '<circle cx="6" cy="5" r="2.2"/><circle cx="18" cy="5" r="2.2"/><circle cx="12" cy="19" r="2.2"/><path d="M6 7.2c0 5 6 4.6 6 9.6M18 7.2c0 5-6 4.6-6 9.6"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-7M21 20H3"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="2.5"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/><rect x="10" y="10" width="4" height="4" rx=".8"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  var ICON_FOR = { '/onboarding-decks': 'users', '/audience-tracker': 'receipt', '/taxonomy': 'search', '/survey-conversion': 'swap', '/streamed-media': 'headphones',
    '/ca-geo': 'pin', '/ca-geo-fsaldu': 'map', '/us-geo': 'globe', '/geo': 'globe', '/cross-impute': 'merge', '/dmp-insights': 'chart', '/1p-modeling': 'chip' };
  ICONS.info = '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>';
  var FOOT = '<b>Fully functional mock-up with sample output.</b> The real version lives at my previous employer, and no data was extracted from it. ' +
    'This demonstrates an AI vibe-coded tool that was widely adopted across my team for analytical work, streamlining our processes and the quality of our output.';
  var GROUP_ICON = { ops: 'briefcase', discover: 'compass', analysis: 'layers' };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[k] || '') + '</svg>'; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pathFromHash() { return (location.hash.replace(/^#/, '') || '/').split('?')[0].replace(/\/+$/, '') || '/'; }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} return null; }
  function anim(el, kf, o) {
    if (!el || !el.animate) return Promise.resolve();
    if (REDUCE) o = Object.assign({}, o, { duration: 1, delay: 0 });
    return el.animate(kf, Object.assign({ fill: 'both', easing: EASE }, o)).finished.catch(function () {});
  }
  function clearAnims(el) { if (el && el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); }); }

  // ── Menu ────────────────────────────────────────────────────────────────
  function buildMenu() {
    var h = '<div class="menu-inner">';
    GROUPS.forEach(function (g) {
      h += '<section class="group"><h2>' + icon(GROUP_ICON[g.id]) + '<span>' + esc(g.title) + '</span></h2><div class="cards c' + g.cols + '">';
      (g.items || []).forEach(function (r) {
        var t = BY_ROUTE[r]; if (!t) return;
        var wide = (g.wide || []).indexOf(r) >= 0;
        h += '<a class="card-t' + (wide ? ' wide' : '') + '" href="#' + t.route + '" style="--c:' + t.accent + '">' +
          '<span class="card-icon" aria-hidden="true">' + icon(ICON_FOR[t.route]) + '</span>' +
          '<span class="card-title">' + esc(t.title) + '</span><span class="card-blurb">' + esc(t.blurb) + '</span>' +
          (t.route === '/geo' ? '<span class="card-modes"><span>United States · ZIP</span><span>Canada · FSA</span><span>Canada · FSALDU</span></span>' : '') +
          '<span class="card-go">' + icon('arrow') + '</span></a>';
      });
      h += '</div></section>';
    });
    menu.innerHTML = h + '<footer class="foot">' + icon('info') + '<span>' + FOOT + '</span></footer></div>';
    menu.querySelectorAll('.card-t').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      c.addEventListener('click', function () { lastCard = c.getAttribute('href').slice(1); lastRect = c.getBoundingClientRect(); });
    });
  }
  var lastRect = null;
  function menuIn() {
    menu.querySelectorAll('.group h2').forEach(function (h, i) { anim(h, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: i * 110 }); });
    anim(menu.querySelector('.foot'), [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 700 });
    menu.querySelectorAll('.card-t').forEach(function (c, i) {
      anim(c, [{ opacity: 0, transform: 'translateY(18px) scale(.96)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 560, delay: 50 * i })
        .then(function () { clearAnims(c); });
    });
  }
  window.__menuIn = menuIn;

  // ── About panel ─────────────────────────────────────────────────────────
  function aboutHtml(t) {
    var a = t.about, s = a.sample, num = {};
    (s.num || []).forEach(function (i) { num[i] = 1; });
    var table = '<table class="smp"><thead><tr>' + s.cols.map(function (c, i) { return '<th' + (num[i] ? ' class="n"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      s.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (num[i] ? ' class="n"' : '') + '>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    return '<div class="ab-col"><h3>Sample output</h3><div class="smp-wrap"><div class="smp-cap"><span>' + esc(s.caption) + '</span><span>Illustrative</span></div>' + table + '</div>' +
      (s.note ? '<p class="smp-note">' + esc(s.note) + '</p>' : '') + '</div>' +
      '<div class="ab-col"><h3>How it works</h3><p class="ab-what">' + esc(a.what) + '</p><ol class="ab-steps">' +
      a.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>';
  }
  function setAbout(open, route) {
    $('about').classList.toggle('open', open);
    $('aboutBtn').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (route) store('ae:about:' + route, open ? '1' : '0');
  }
  $('aboutBtn').addEventListener('click', function () { setAbout(!$('about').classList.contains('open'), current); });

  // ── Run sample ──────────────────────────────────────────────────────────
  var sampleBtn = $('sampleBtn');
  view.addEventListener('load', function () {
    var ok = false;
    try { ok = typeof view.contentWindow.demoSample === 'function'; } catch (e) {}
    sampleBtn.disabled = !ok;
  });
  sampleBtn.addEventListener('click', function () {
    var fn; try { fn = view.contentWindow.demoSample; } catch (e) {}
    if (typeof fn !== 'function') return;
    setAbout(false, current);
    sampleBtn.disabled = true; sampleBtn.classList.add('busy'); sampleBtn.querySelector('span').textContent = 'Running…';
    Promise.resolve().then(function () { return fn(); }).catch(function (e) { console.error(e); }).then(function () {
      sampleBtn.disabled = false; sampleBtn.classList.remove('busy'); sampleBtn.querySelector('span').textContent = 'Run sample';
    });
  });

  // ── Transitions ─────────────────────────────────────────────────────────
  function insetFor(rect) {
    var t = tool.getBoundingClientRect();
    return 'inset(' + Math.max(0, rect.top - t.top) + 'px ' + Math.max(0, t.right - rect.right) + 'px ' + Math.max(0, t.bottom - rect.bottom) + 'px ' + Math.max(0, rect.left - t.left) + 'px round 18px)';
  }
  function toolIn(rect) {
    var from = rect ? insetFor(rect) : 'inset(8% 8% 8% 8% round 18px)';
    anim(tool, [{ clipPath: from, opacity: rect ? 1 : 0 }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.7,0,.2,1)' })
      .then(function () { clearAnims(tool); });
    [].forEach.call($('toolhead').children, function (el, i) {
      anim(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 220 + i * 60 }).then(function () { clearAnims(el); });
    });
  }
  function toolOut(rect) {
    var to = rect ? insetFor(rect) : 'inset(8% 8% 8% 8% round 18px)';
    return anim(tool, [{ clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }, { clipPath: to, opacity: rect ? .9 : 0 }], { duration: 420, easing: 'cubic-bezier(.7,0,.2,1)' })
      .then(function () { clearAnims(tool); });
  }

  // ── Geo modes: one tool, three engines ─────────────────────────────────
  var GEO_BY_ROUTE = {}, GEO_BY_PAGE = {};
  GEO_MODES.forEach(function (m) { GEO_BY_ROUTE[m.route] = m; GEO_BY_PAGE[m.page] = m; });
  function geoDefault(country) {
    var last = store('ae:geo');
    if (country === 'ca') { var ca = store('ae:geo:ca'); return GEO_BY_ROUTE[ca] ? ca : '/geo/ca/fsa'; }
    return GEO_BY_ROUTE[last] ? last : '/geo/ca/fsa';
  }
  // Old per-tool geo routes and bare /geo or /geo/ca land on a concrete mode.
  function canonical(p) {
    if (GEO_BY_PAGE[p]) return GEO_BY_PAGE[p].route;
    if (p === '/geo') return geoDefault();
    if (p === '/geo/ca') return geoDefault('ca');
    return p;
  }
  function placePill(seg) {
    var on = seg.querySelector('button.on'), pill = seg.querySelector('.seg-pill');
    if (!on) { pill.style.width = '0'; return; }
    pill.style.width = on.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  }
  function setModebar(m) {
    $('modebar').hidden = !m;
    if (!m) return;
    $('segCountry').querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === m.country); b.setAttribute('aria-pressed', b.dataset.v === m.country); });
    $('segLevel').querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === m.level); b.setAttribute('aria-pressed', b.dataset.v === m.level); });
    $('segLevel').classList.toggle('off', m.country !== 'ca');
    requestAnimationFrame(function () { placePill($('segCountry')); placePill($('segLevel')); });
  }
  $('segCountry').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    location.hash = '#' + (b.dataset.v === 'us' ? '/geo/us' : geoDefault('ca'));
  });
  $('segLevel').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    location.hash = '#/geo/ca/' + b.dataset.v;
  });
  window.addEventListener('resize', function () { if (!$('modebar').hidden) { placePill($('segCountry')); placePill($('segLevel')); } });

  // Fill the tool view for a route. Geo modes show the Geo Analysis header with the
  // chosen engine's description, About content and page.
  function fillTool(p) {
    var mode = GEO_BY_ROUTE[p], page = mode ? mode.page : p;
    var t = mode ? BY_ROUTE['/geo'] : BY_ROUTE[p], m = mode ? BY_ROUTE[page] : t;
    if (!t || !m || !PAGES[page]) return false;
    $('crumbName').textContent = t.title; $('crumb').hidden = false;
    $('thTitle').textContent = t.title; $('thDesc').textContent = m.blurb;
    $('thIcon').style.setProperty('--c', t.accent); $('thIcon').innerHTML = icon(ICON_FOR[t.route]);
    $('aboutInner').innerHTML = aboutHtml(m);
    var saved = store('ae:about:' + page);
    setAbout(saved === null ? innerWidth > 820 : saved === '1');
    setModebar(mode);
    if (mode) { store('ae:geo', p); if (mode.country === 'ca') store('ae:geo:ca', p); }
    sampleBtn.disabled = true;
    var modeName = mode ? (mode.country === 'us' ? 'United States' : 'Canada ' + mode.level.toUpperCase()) : '';
    document.title = (mode ? t.title + ' · ' + modeName : t.title) + ' — Audience Analytics Engine';
    view.srcdoc = PAGES[page];
    return true;
  }
  function fromCard(p) { return lastCard === p || (lastCard === '/geo' && !!GEO_BY_ROUTE[p]); }

  // ── Router ──────────────────────────────────────────────────────────────
  function render() {
    var raw = pathFromHash(), p = canonical(raw);
    if (p !== raw) { location.replace('#' + p); return; }
    if (p === current) return;
    var prev = current; current = p;

    // Switching between geo modes: swap the engine in place.
    if (prev && GEO_BY_ROUTE[prev] && GEO_BY_ROUTE[p] && !tool.hidden) {
      anim(view, [{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).then(function () {
        fillTool(p);
        anim(view, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 340 }).then(function () { clearAnims(view); });
      });
      return;
    }
    var leavingTool = prev && prev !== '/' && !tool.hidden;
    var go = function () {
      notFound.hidden = true; tool.hidden = true; menu.hidden = true; $('crumb').hidden = true;
      if (p === '/') {
        menu.hidden = false; view.removeAttribute('srcdoc'); setModebar(null); document.title = 'Audience Analytics Engine';
        if (prev) menuIn();
        return;
      }
      if (!fillTool(p)) { notFound.hidden = false; document.title = 'Not found — Audience Analytics Engine'; return; }
      tool.hidden = false;
      toolIn(fromCard(p) ? lastRect : null);
    };
    if (leavingTool && p === '/') toolOut(fromCard(prev) ? lastRect : null).then(go);
    else go();
  }

  window.addEventListener('message', function (e) {
    if (e.source !== view.contentWindow || !e.data || typeof e.data.demoNav !== 'string') return;
    location.hash = '#' + e.data.demoNav;
  });
  window.addEventListener('hashchange', render);
  buildMenu();
  render();
})();
