// Reusable Playwright helpers for testing web games, with evidence built in.
// Copy it into your run folder (qa-reports/<run>/scripts/) and import it from your test scripts.
//
//   npm i playwright-core   (in the run folder, never in the game project)
//   Uses the installed Microsoft Edge or Chrome: BROWSER_CHANNEL=msedge|chrome (default msedge)
//   PLAYWRIGHT_CORE=file:///.../playwright-core/index.mjs if the package lives elsewhere
//
// What it gives you:
//   launch(), newContext()        browser + clean profile (phone size and touch by default)
//   watch(page, log, tag)         collects console errors, page errors, failed requests
//   open(page, url)               full page load (never a hash-only change) and waits for a "ready" condition
//   seed(page, origin, key, data) writes save data from a same-origin page before the game loads
//   record(page) -> stop(file)    VIDEO without ffmpeg: DevTools screencast frames encoded to WebM by the browser
//   shot(page, file, clip?)       screenshot (jpg/png) or close-up crop
//   check(...) / saveResults()    one result per check, written immediately (a crash never loses results)
//   only(...ids)                  ONLY=ID1,ID2 node test.mjs re-runs just those checks
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');

export const PHONE = { width: 390, height: 844 };

export function launch() {
  return chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
}

export function newContext(browser, { size = PHONE, mobile = true } = {}) {
  return browser.newContext({ viewport: size, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
}

export function watch(page, log, tag) {
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) log.push(`[${tag}] [${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => log.push(`[${tag}] [pageerror] ${e.message}`));
  page.on('requestfailed', (r) => log.push(`[${tag}] [requestfailed] ${new URL(r.url()).pathname}`));
}

// Full load every time: page.goto(url#a) from url#b only changes the hash and does NOT restart the game.
// `ready` is a function run in the page that returns true when the game is interactive
// (e.g. () => !document.getElementById('loading')). Prefer it to fixed sleeps.
export async function open(page, url, { ready = null, timeout = 20000, settleMs = 300 } = {}) {
  if (page.url() !== 'about:blank') await page.goto('about:blank');
  await page.goto(url);
  if (ready) await page.waitForFunction(ready, null, { timeout });
  await page.waitForTimeout(settleMs);
}

// Games often save their in-memory state on pagehide, which would overwrite a save written from inside the game.
// Write it from another URL on the same origin (any static file, e.g. /package.json or /favicon.ico) instead.
export async function seed(page, sameOriginUrl, key, value) {
  await page.goto(sameOriginUrl);
  await page.evaluate(([k, v]) => { localStorage.clear(); if (v !== null) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); }, [key, value]);
}

export async function shot(page, file, clip = null) {
  const png = file.endsWith('.png');
  await page.screenshot({ path: file, type: png ? 'png' : 'jpeg', ...(png ? {} : { quality: 80 }), ...(clip ? { clip } : {}) });
}

// Video without ffmpeg. Frames arrive only when the screen changes; each is held until the next one.
// const rec = await record(page); ...; await rec.stop('evidence/BUG-001.webm', { framesDir: 'evidence/BUG-001-frames' })
export async function record(page, { maxWidth = 390, bitrate = 600_000 } = {}) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    frames.push({ data, t: metadata.timestamp });
    try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch { /* page closing */ }
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth, everyNthFrame: 1 });
  return {
    frames,
    async stop(file, { framesDir = null, keepFrames = 6 } = {}) {
      try { await cdp.send('Page.stopScreencast'); } catch { /* ignore */ }
      if (!frames.length) return null;
      if (framesDir) {
        fs.mkdirSync(framesDir, { recursive: true });
        const step = Math.max(1, Math.floor(frames.length / keepFrames));
        frames.filter((_, i) => i % step === 0).slice(0, keepFrames)
          .forEach((f, i) => fs.writeFileSync(path.join(framesDir, `frame-${i + 1}.jpg`), Buffer.from(f.data, 'base64')));
      }
      const bc = page.context(), enc = await (bc.browser() ? bc.browser().newPage() : bc.newPage()); // persistent profiles have no browser()
      const b64 = await enc.evaluate(async ([fr, bps]) => {
        const imgs = await Promise.all(fr.map((f) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = 'data:image/jpeg;base64,' + f.data; })));
        const c = document.createElement('canvas'); c.width = imgs[0].width; c.height = imgs[0].height; document.body.appendChild(c);
        const g = c.getContext('2d'); g.drawImage(imgs[0], 0, 0);
        const stream = c.captureStream(0); const track = stream.getVideoTracks()[0];
        const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: bps });
        const chunks = []; rec.ondataavailable = (e) => chunks.push(e.data);
        const done = new Promise((r) => { rec.onstop = r; });
        rec.start(100);
        for (let i = 0; i < imgs.length; i++) {
          const hold = i + 1 < fr.length ? Math.min(Math.max((fr[i + 1].t - fr[i].t) * 1000, 33), 1500) : 1000;
          for (let e = 0; e < hold; e += 100) { g.drawImage(imgs[i], 0, 0); track.requestFrame(); await new Promise((r) => setTimeout(r, Math.min(100, hold - e))); }
        }
        rec.stop(); await done;
        const u = new Uint8Array(await new Blob(chunks, { type: 'video/webm' }).arrayBuffer());
        let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
        return btoa(s);
      }, [frames, bitrate]);
      await enc.close();
      fs.writeFileSync(file, Buffer.from(b64, 'base64'));
      return file;
    },
  };
}

// ONLY=PZ-35,ST-08 node test.mjs  -> only those checks run; results merge into results.json by id
export const only = (...ids) => !process.env.ONLY || ids.some((id) => process.env.ONLY.split(',').includes(id));

export function saveResults(file, results) {
  let old = [];
  try { old = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* first run */ }
  const ids = new Set(results.map((r) => r.id));
  fs.writeFileSync(file, JSON.stringify([...old.filter((r) => !ids.has(r.id)), ...results]
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })), null, 2));
}

// const check = makeCheck('qa-reports/run/evidence/results.json');
// check('ST-01', 'Gem pack: +100 gems', pass, expected, actual, ['ST-01-after.jpg'])
export function makeCheck(resultsFile) {
  return (id, name, pass, expected, actual, evidence = [], extra = {}) => {
    const r = { id, name, pass, expected, actual, evidence, ...extra };
    saveResults(resultsFile, [r]);
    console.log(pass ? 'PASS' : 'FAIL', id, name, '|', JSON.stringify(actual).slice(0, 240));
    return r;
  };
}
