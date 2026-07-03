/**
 * Shared chrome for the _*_tests.html verification suites: result table,
 * summary, polling, cache busting, hashing, stable stringify.
 * (Older suites — _nojs_tests, _nojs_selftest — are frozen Stage 8 regression
 * guards and intentionally keep their own copies.)
 *
 * Usage: HCETestHarness.init(); then addRow/finish/poll/etc.
 */
(function () {
  'use strict';

  var results = [];
  var caseNo = 0;
  var rowsEl = null;
  var summaryEl = null;

  function init(rowsId, summaryId) {
    rowsEl = document.getElementById(rowsId || 'rows');
    summaryEl = document.getElementById(summaryId || 'summary');
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function addRow(name, pass, evidence) {
    caseNo++;
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + caseNo + '</td><td>' + escapeHtml(name) + '</td>' +
      '<td class="' + (pass ? 'p">PASS' : 'f">FAIL') + '</td><td>' + escapeHtml(evidence) + '</td>';
    rowsEl.appendChild(tr);
    results.push({ name: name, pass: pass, evidence: evidence });
  }

  function finish() {
    var passed = results.filter(function (r) { return r.pass; }).length;
    summaryEl.textContent = passed + ' / ' + results.length + ' passed';
    summaryEl.className = passed === results.length ? 'ok' : 'bad';
    return results;
  }

  function fatal(err) {
    addRow('suite [fatal]', false, (err && err.message) || String(err));
    summaryEl.textContent = 'FATAL: ' + ((err && err.message) || err);
    summaryEl.className = 'bad';
    return results;
  }

  function poll(fn, timeoutMs, everyMs) {
    var deadline = Date.now() + (timeoutMs || 4000);
    return new Promise(function (resolve) {
      (function tick() {
        var v = null;
        try { v = fn(); } catch (e) { v = null; }
        if (v) return resolve(v);
        if (Date.now() > deadline) return resolve(null);
        setTimeout(tick, everyMs || 50);
      })();
    });
  }

  function stableStringify(value) {
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(function (k) {
        return JSON.stringify(k) + ':' + stableStringify(value[k]);
      }).join(',') + '}';
    }
    return JSON.stringify(value);
  }

  async function sha256(text) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  // Revalidate index.html and everything it references so an iframe-mounted
  // editor never runs stale cached scripts (a stale run once produced false
  // geometry results — see stage-9 overview).
  async function bustCaches() {
    var idxText = await (await fetch('index.html', { cache: 'no-cache' })).text();
    var urls = [];
    for (var m of idxText.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (!/^(?:https?:)?\/\//.test(m[1])) urls.push(m[1]);
    }
    await Promise.all(urls.map(function (u) {
      return fetch(u, { cache: 'no-cache' }).catch(function () {});
    }));
  }

  window.HCETestHarness = {
    init: init, addRow: addRow, finish: finish, fatal: fatal,
    poll: poll, stableStringify: stableStringify, sha256: sha256,
    bustCaches: bustCaches, escapeHtml: escapeHtml,
    results: function () { return results; },
  };
})();
