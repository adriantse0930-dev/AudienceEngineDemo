/* ============================================================================
 * mock-core.js — the demo's in-browser "server".
 *
 * Every tool page keeps its original front-end code and still calls fetch()
 * against the same /tool/api/... paths the Flask app served. This file swaps
 * window.fetch for a router so those calls are answered by the per-tool mock
 * handlers (mocks/<tool>.js) with randomly generated data. Nothing leaves the
 * browser except map tiles and CDN libraries.
 *
 * Handler contract (see Mock.route):
 *   Mock.route('POST', '/taxonomy/api/search', async req => ({ results: [...] }))
 *   req = { method, path, url, query:{}, params:{}, json, form:FormData|null, text }
 *   return a plain object/array (sent as JSON, status 200),
 *          Mock.json(obj, status)          for a non-200 JSON reply,
 *          Mock.file(data, name, mime)     for a download (string | Blob | ArrayBuffer),
 *          or a real Response.
 *   Throwing an Error returns {error: message} with status 500.
 * ========================================================================== */
(function () {
  'use strict';
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  var routes = [];

  // ── Seeded randomness ──────────────────────────────────────────────────────
  function hashStr(s) {
    var h = 2166136261 >>> 0;
    s = String(s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  // mulberry32: rng(seed) -> () => float in [0,1)
  function rng(seed) {
    var a = (typeof seed === 'number' ? seed : hashStr(seed)) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function R(r) { return r || Math.random; }
  function randInt(min, max, r) { return Math.floor(R(r)() * (max - min + 1)) + min; }
  function randFloat(min, max, r) { return R(r)() * (max - min) + min; }
  function pick(arr, r) { return arr[Math.floor(R(r)() * arr.length)]; }
  function shuffle(arr, r) {
    var a = arr.slice(), f = R(r);
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(f() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function gauss(mean, sd, r) {
    var f = R(r), u = 1 - f(), v = f();
    return (mean || 0) + (sd == null ? 1 : sd) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function round(x, d) { var p = Math.pow(10, d || 0); return Math.round(x * p) / p; }
  function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function delay(min, max) { return sleep(randInt(min == null ? 180 : min, max == null ? (min == null ? 520 : min) : max)); }

  // ── CSV helpers ────────────────────────────────────────────────────────────
  function parseCSV(text) {
    text = String(text || '').replace(/^﻿/, '');
    var rows = [], row = [], field = '', q = false;
    var delim = (text.split('\n')[0].split('\t').length > text.split('\n')[0].split(',').length) ? '\t' : ',';
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return { columns: [], rows: [] };
    var cols = rows[0].map(function (c) { return c.trim(); });
    return {
      columns: cols,
      rows: rows.slice(1).map(function (r) {
        var o = {};
        cols.forEach(function (c, i) {
          var v = r[i] == null ? '' : r[i].trim();
          o[c] = (v !== '' && !isNaN(v) && !/^0\d/.test(v)) ? Number(v) : v;
        });
        return o;
      })
    };
  }
  function toCSV(rows, cols) {
    cols = cols || (rows[0] ? Object.keys(rows[0]) : []);
    function esc(v) {
      if (v == null) return '';
      v = String(v);
      return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }
    return [cols.map(esc).join(',')].concat(rows.map(function (r) {
      return cols.map(function (c) { return esc(r[c]); }).join(',');
    })).join('\r\n');
  }
  function readFile(file) {
    if (!file) return Promise.resolve('');
    if (typeof file === 'string') return Promise.resolve(file);
    if (file.text) return file.text();
    return new Promise(function (res, rej) {
      var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsText(file);
    });
  }

  // ── Excel output (SheetJS loaded on demand from cdnjs) ──────────────────────
  var xlsxLoading = null;
  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxLoading) return xlsxLoading;
    xlsxLoading = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = function () { res(window.XLSX); };
      s.onerror = function () { xlsxLoading = null; rej(new Error('Could not load the Excel library (offline?)')); };
      document.head.appendChild(s);
    });
    return xlsxLoading;
  }
  // sheets: { 'Sheet name': [ {col: val}, ... ] }  -> Promise<Blob>
  function xlsxBlob(sheets) {
    return loadXLSX().then(function (X) {
      var wb = X.utils.book_new();
      Object.keys(sheets).forEach(function (name) {
        X.utils.book_append_sheet(wb, X.utils.json_to_sheet(sheets[name] || []), name.slice(0, 31));
      });
      var out = X.write(wb, { bookType: 'xlsx', type: 'array' });
      return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    });
  }

  // ── Persistent store (localStorage, falls back to memory) ──────────────────
  var mem = {};
  function store(ns) {
    var prefix = 'audienceAnalyticsDemo:' + ns + ':';
    return {
      get: function (key, dflt) {
        try { var v = localStorage.getItem(prefix + key); if (v != null) return JSON.parse(v); } catch (e) {}
        if (Object.prototype.hasOwnProperty.call(mem, prefix + key)) return JSON.parse(mem[prefix + key]);
        return typeof dflt === 'function' ? dflt() : dflt;
      },
      set: function (key, val) {
        var s = JSON.stringify(val);
        mem[prefix + key] = s;
        try { localStorage.setItem(prefix + key, s); } catch (e) {}
        return val;
      },
      remove: function (key) {
        delete mem[prefix + key];
        try { localStorage.removeItem(prefix + key); } catch (e) {}
      }
    };
  }

  // ── Responses ──────────────────────────────────────────────────────────────
  function Reply(kind, data) { this.kind = kind; this.data = data; }
  function json(obj, status) { return new Reply('json', { body: obj, status: status || 200 }); }
  function file(data, name, mime) { return new Reply('file', { data: data, name: name, mime: mime }); }

  function toResponse(out) {
    if (out instanceof Response) return out;
    if (out instanceof Reply && out.kind === 'file') {
      var d = out.data, mime = d.mime || (/\.csv$/i.test(d.name) ? 'text/csv' : /\.xlsx$/i.test(d.name)
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/octet-stream');
      var blob = d.data instanceof Blob ? d.data : new Blob([d.data], { type: mime });
      return new Response(blob, { status: 200, headers: {
        'Content-Type': blob.type || mime,
        'Content-Disposition': 'attachment; filename="' + d.name + '"'
      } });
    }
    var body = out instanceof Reply ? out.data.body : out;
    var status = out instanceof Reply ? out.data.status : 200;
    return new Response(JSON.stringify(body === undefined ? {} : body), {
      status: status, headers: { 'Content-Type': 'application/json' }
    });
  }

  // ── Router ─────────────────────────────────────────────────────────────────
  function compile(pattern) {
    var keys = [];
    var re = new RegExp('^' + pattern.replace(/\/+$/, '').replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/:(\w+)/g, function (_, k) { keys.push(k); return '([^/]+)'; })
      .replace(/\*/g, '.*') + '/?$');
    return { re: re, keys: keys };
  }
  function route(method, pattern, handler, opts) {
    var c = compile(pattern);
    routes.push({ method: method.toUpperCase(), re: c.re, keys: c.keys, handler: handler,
                  latency: opts && opts.latency });
  }
  function localPath(url) {
    var s = typeof url === 'string' ? url : (url && url.url) || String(url);
    if (/^(https?:|blob:|data:)/i.test(s)) return null;      // real network / object URLs
    var m = s.match(/^[^?#]*/)[0];
    if (m.charAt(0) !== '/') m = '/' + m.replace(/^\.\//, '');
    return { path: m, search: s.indexOf('?') >= 0 ? s.slice(s.indexOf('?')) : '' };
  }

  async function dispatch(url, init) {
    init = init || {};
    var lp = localPath(url);
    var method = (init.method || (url && url.method) || 'GET').toUpperCase();
    var match = null, params = {};
    for (var i = 0; i < routes.length && !match; i++) {
      var r = routes[i];
      if (r.method !== method && r.method !== '*') continue;
      var m = lp.path.match(r.re);
      if (m) { match = r; r.keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); }); }
    }
    if (!match) {
      console.warn('[demo] no mock for', method, lp.path);
      return toResponse(json({ error: 'Not available in the demo: ' + method + ' ' + lp.path }, 404));
    }
    var query = {};
    new URLSearchParams(lp.search).forEach(function (v, k) { query[k] = v; });
    var body = init.body, jsonBody = null, form = null, text = null;
    if (typeof FormData !== 'undefined' && body instanceof FormData) form = body;
    else if (typeof body === 'string') {
      text = body;
      try { jsonBody = JSON.parse(body); } catch (e) {
        if (/=/.test(body)) { jsonBody = {}; new URLSearchParams(body).forEach(function (v, k) { jsonBody[k] = v; }); }
      }
    } else if (body instanceof URLSearchParams) { jsonBody = {}; body.forEach(function (v, k) { jsonBody[k] = v; }); }
    var req = { method: method, path: lp.path, url: lp.path + lp.search, query: query, params: params,
                json: jsonBody || {}, form: form, text: text, headers: init.headers || {} };
    try {
      var lat = match.latency;
      if (lat !== 0) await delay(lat ? lat[0] : 150, lat ? lat[1] : 450);
      return toResponse(await match.handler(req));
    } catch (err) {
      console.error('[demo] mock error', lp.path, err);
      return toResponse(json({ error: (err && err.message) || String(err) }, 500));
    }
  }

  window.fetch = function (url, init) {
    if (localPath(url) === null) return realFetch(url, init);
    return dispatch(url, init);
  };

  // XMLHttpRequest shim for local paths (a couple of pages use XHR for upload progress).
  var RealXHR = window.XMLHttpRequest;
  function MockXHR() {
    var x = new RealXHR(), self = this, local = null, headers = {};
    this.upload = { addEventListener: function () {}, onprogress: null };
    this.readyState = 0; this.status = 0; this.responseText = ''; this.response = null; this.responseType = '';
    this.open = function (m, u) { local = localPath(u) ? { m: m, u: u } : null; if (!local) x.open.apply(x, arguments); self.readyState = 1; };
    this.setRequestHeader = function (k, v) { if (local) headers[k] = v; else x.setRequestHeader(k, v); };
    this.getResponseHeader = function (k) { return self._h ? self._h.get(k) : null; };
    this.getAllResponseHeaders = function () { return ''; };
    this.abort = function () { if (!local) x.abort(); };
    this.addEventListener = function (ev, fn) { self['on' + ev] = fn; };
    this.send = function (body) {
      if (!local) return x.send(body);
      dispatch(local.u, { method: local.m, body: body, headers: headers }).then(function (res) {
        self._h = res.headers; self.status = res.status;
        return self.responseType === 'blob' ? res.blob() : res.text();
      }).then(function (data) {
        if (self.responseType === 'blob') self.response = data;
        else { self.responseText = data; self.response = self.responseType === 'json' ? JSON.parse(data) : data; }
        self.readyState = 4;
        if (self.onreadystatechange) self.onreadystatechange();
        if (self.onload) self.onload({ target: self });
        if (self.onloadend) self.onloadend({ target: self });
      }).catch(function (e) { if (self.onerror) self.onerror(e); });
    };
    ['onload', 'onerror', 'onreadystatechange', 'onloadend'].forEach(function (k) { self[k] = null; });
    // proxy real XHR events when not mocked
    x.onreadystatechange = function () {
      self.readyState = x.readyState; self.status = x.status;
      try { self.responseText = x.responseText; } catch (e) {}
      self.response = x.response;
      if (self.onreadystatechange) self.onreadystatechange();
      if (x.readyState === 4 && self.onload) self.onload({ target: self });
    };
  }
  window.XMLHttpRequest = MockXHR;

  // ── Navigation inside the single-file demo ─────────────────────────────────
  // Tool pages live in iframes; links to "/something" are routed by the parent.
  function nav(path) {
    try { if (window.parent && window.parent !== window) { window.parent.postMessage({ demoNav: path }, '*'); return; } } catch (e) {}
    location.hash = '#' + path;
  }
  function triggerDownload(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name || 'download';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  async function downloadFrom(path) {
    var res = await window.fetch(path);
    if (!res.ok) { var e = {}; try { e = await res.json(); } catch (x) {} alert(e.error || 'Download failed'); return; }
    var cd = res.headers.get('Content-Disposition') || '';
    var m = cd.match(/filename="?([^";]+)"?/);
    triggerDownload(await res.blob(), m ? m[1] : path.split('/').pop().split('?')[0]);
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    // In a srcdoc iframe "#x" resolves against the PARENT's URL and would load
    // the whole shell inside the frame; keep fragment links in this document.
    if (href && href.charAt(0) === '#') {
      e.preventDefault();
      if (href.length > 1) {
        var el = document.getElementById(href.slice(1));
        try { location.hash = href; } catch (x) {}
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    if (!href || href.charAt(0) !== '/' || href.indexOf('//') === 0) return;
    e.preventDefault();
    if (/\/api\//.test(href)) downloadFrom(href);
    else nav(href);
  }, false);
  // Forms that post straight to an /api/ path (rare) — route through fetch.
  document.addEventListener('submit', function (e) {
    var f = e.target, act = f.getAttribute && f.getAttribute('action');
    if (!act || act.charAt(0) !== '/') return;
    e.preventDefault();
    var fd = new FormData(f);
    window.fetch(act, { method: (f.method || 'POST').toUpperCase(), body: fd }).then(async function (res) {
      var cd = res.headers.get('Content-Disposition') || '';
      if (/attachment/.test(cd)) { var m = cd.match(/filename="?([^";]+)"?/); triggerDownload(await res.blob(), m ? m[1] : 'download'); }
    });
  }, true);

  // ── Shared synthetic geography: 100 Ontario FSAs ───────────────────────────
  var fsaGeo = window.DEMO_FSA_GEOJSON || { type: 'FeatureCollection', features: [] };
  var gr = rng('fsa-base-2026');
  var fsaList = fsaGeo.features.map(function (f) {
    var p = f.properties;
    var urban = /Toronto|Mississauga|Brampton|Markham|Ottawa/.test(p.CITY);
    var pop = Math.round(randFloat(urban ? 18000 : 9000, urban ? 62000 : 34000, gr));
    var hh = Math.round(pop / randFloat(2.2, 3.1, gr));
    return { FSA: p.FSA, CITY: p.CITY, REGION: p.REGION, PROVINCE: 'ON', LAT: p.LAT, LON: p.LON,
             POPULATION: pop, HOUSEHOLDS: hh };
  });

  window.Mock = {
    route: route, json: json, file: file,
    rng: rng, hash: hashStr, randInt: randInt, randFloat: randFloat, pick: pick, shuffle: shuffle,
    gauss: gauss, round: round, sleep: sleep, delay: delay,
    csv: { parse: parseCSV, stringify: toCSV }, readFile: readFile,
    xlsxBlob: xlsxBlob, loadXLSX: loadXLSX,
    store: store, nav: nav, download: triggerDownload, downloadFrom: downloadFrom,
    fsaGeoJSON: fsaGeo, fsaList: fsaList,
    DEMO_NOTE: 'Demo build — all data is randomly generated.'
  };
  window.__nav = nav;
})();

