/**
 * Headless runner for the browser verification suites (Stage 11 F6).
 *
 * Serves the repo root over localhost (the suites need http, not file://),
 * opens every `_*_tests.html` page in headless Chromium, waits for the shared
 * harness summary (`#summary.ok` / `#summary.bad`), and additionally runs
 * `_nojs_selftest.html`, checking its verdict AND that the exported bytes
 * still hash to the protected v3.1 baseline (docs/baselines/README.md).
 *
 * Usage: npm test   (exit code 0 = everything green)
 */
import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_NOJS_SHA = '8792330fed7689725be6b73595dc7a06b6c68129fbd34f08965cedbc8310cb2f';
const SUITE_TIMEOUT_MS = 180_000; // _import_tests chews through a 5.5 MB fixture

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function startServer() {
  return new Promise((ready) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let filePath = normalize(join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
      if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => ready(server));
  });
}

async function runHarnessSuite(page, base, file) {
  await page.goto(`${base}/${file}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#summary.ok, #summary.bad', { timeout: SUITE_TIMEOUT_MS });
  const summary = await page.textContent('#summary');
  const ok = await page.locator('#summary.ok').count() === 1;
  const failures = ok ? [] : await page.$$eval('tbody tr', (rows) =>
    rows.filter((r) => r.querySelector('td.f'))
      .map((r) => Array.from(r.children).map((td) => td.textContent.trim()).join(' | ')));
  return { file, ok, summary: summary.trim(), failures };
}

async function runNoJsSelftest(page, base) {
  await page.goto(`${base}/_nojs_selftest.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#verdict.pass, #verdict.fail', { timeout: SUITE_TIMEOUT_MS });
  const verdictPass = await page.locator('#verdict.pass').count() === 1;
  const sha = await page.evaluate(async () => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(window.__noJsHtml));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  });
  const shaOk = sha === BASELINE_NOJS_SHA;
  return {
    file: '_nojs_selftest.html',
    ok: verdictPass && shaOk,
    summary: `verdict=${verdictPass ? 'PASS' : 'FAIL'} baseline=${shaOk ? 'byte-identical' : 'DRIFT ' + sha}`,
    failures: shaOk ? [] : [`no-JS export hash ${sha} != protected baseline ${BASELINE_NOJS_SHA}`],
  };
}

const server = await startServer();
const base = `http://127.0.0.1:${server.address().port}`;
const suites = (await readdir(ROOT)).filter((f) => /^_.*_tests\.html$/.test(f)).sort();

console.log(`Serving ${ROOT} at ${base}`);
console.log(`Suites: ${suites.join(', ')} + _nojs_selftest.html\n`);

const browser = await chromium.launch();
const results = [];
for (const file of suites) {
  const page = await browser.newPage();
  try {
    results.push(await runHarnessSuite(page, base, file));
  } catch (err) {
    results.push({ file, ok: false, summary: `runner error: ${err.message}`, failures: [] });
  }
  await page.close();
}
{
  const page = await browser.newPage();
  try {
    results.push(await runNoJsSelftest(page, base));
  } catch (err) {
    results.push({ file: '_nojs_selftest.html', ok: false, summary: `runner error: ${err.message}`, failures: [] });
  }
  await page.close();
}
await browser.close();
server.close();

let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? '  PASS' : '! FAIL'}  ${r.file.padEnd(28)} ${r.summary}`);
  for (const f of r.failures) console.log(`         ${f}`);
  if (!r.ok) failed++;
}
console.log(`\n${results.length - failed} / ${results.length} suites green`);
process.exit(failed ? 1 : 0);
