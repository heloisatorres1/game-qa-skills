// Shared helpers for the Pixel Swarm full QA pass.
// Needs playwright-core (set PLAYWRIGHT_CORE to its index.mjs as a file:// URL if it is not installed here)
// and Microsoft Edge (or BROWSER_CHANNEL=chrome). The game must be served at BASE (default http://localhost:5199/).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');

export const RUN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BASE = process.env.BASE_URL || 'http://localhost:5199/';
export const SAVE_KEY = 'pixelswarm.save.v1';
export const PHONE = { width: 390, height: 844 };

export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// A returning player who has passed the age gate, story and tutorial (no first-launch popups, no daily offer).
export const PLAYER = () => ({
  ageGroup: '18+', tutorialSeen: true, launches: 3, offer: { seen: today(), ends: 0 },
  seen: { mystery: true, frozen: true, hidden: true, linked: true, big: true, pipe: true, key: true, wood: true, cookie: true, mlinked: true },
  playerId: 'TEST-0001',
});

export async function launch() {
  return chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
}

// New browser profile (videos are made with record(), below, so no ffmpeg is needed).
export async function newContext(browser, { size = PHONE, mobile = true } = {}) {
  const opts = { viewport: size, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile };
  return browser.newContext(opts);
}

// Collects console messages, page errors and failed requests for a page.
export function watch(page, log, tag) {
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.push(`[${tag}] [${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => log.push(`[${tag}] [pageerror] ${e.message}`));
  page.on('requestfailed', (r) => log.push(`[${tag}] [requestfailed] ${new URL(r.url()).pathname}`));
}

// Writes a save before the game loads (from a same-origin non-game URL, so the game cannot overwrite it on pagehide).
export async function seed(page, data) {
  await page.goto(BASE + 'package.json');
  await page.evaluate(([k, d]) => { localStorage.clear(); if (d) localStorage.setItem(k, JSON.stringify({ v: 2, savedAt: Date.now(), data: d })); }, [SAVE_KEY, data]);
}

// Opens the game (optionally a dev hash) and waits for the loading screen.
export async function openGame(page, hash = '', waitMs = 2800) {
  // always a full page load: going from BASE to BASE#hash would only change the hash, not restart the game
  if (page.url() !== 'about:blank') await page.goto('about:blank');
  await page.goto(BASE + (hash ? '#' + hash : ''));
  await page.waitForTimeout(waitMs);
  // without a dev hash the loading screen stays ~2.5 s and then fades out: wait until it is gone
  if (!hash) { await page.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(300); }
}

// Makes the game write its in-memory state, then reads the save.
export async function readSave(page) {
  return page.evaluate((k) => { window.dispatchEvent(new Event('pagehide')); const r = localStorage.getItem(k); return r ? JSON.parse(r).data : null; }, SAVE_KEY);
}

export const pick = (s, keys) => Object.fromEntries(keys.map((k) => [k, k.split('.').reduce((o, p) => (o == null ? o : o[p]), s)]));

// Runs a debug-panel command (pink DBG button).
export async function cheat(page, cmd) {
  await page.locator('#dbg-btn').click();
  await page.locator(`#popup-debug [data-cmd="${cmd}"]`).click();
  await page.waitForTimeout(300);
  if (await page.locator('#popup-debug').isVisible()) await page.keyboard.press('Escape');
}

export const visiblePopups = (page) => page.evaluate(() => [...document.querySelectorAll('.overlay:not([hidden])')].map((o) => o.id));
export const activeScreen = (page) => page.evaluate(() => (document.querySelector('.screen.active') || {}).id || null);

export function dirs(module) {
  const dir = path.join(RUN, module);
  const ev = path.join(dir, 'evidence');
  fs.mkdirSync(ev, { recursive: true });
  return { dir, ev, file: (n) => path.join(ev, n), rel: (n) => 'evidence/' + n };
}

export const writeJson = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2));

export async function shot(page, file, opts = {}) {
  await page.screenshot({ path: file, type: file.endsWith('.png') ? 'png' : 'jpeg', ...(file.endsWith('.png') ? {} : { quality: 80 }), ...opts });
}


export const sleep = (page, ms) => page.waitForTimeout(ms);

// ONLY=PR-D5,PZ-35 node scripts/x.mjs  -> run just those test blocks (results are merged by id)
export const only = (...ids) => !process.env.ONLY || ids.some((id) => process.env.ONLY.split(',').includes(id));
export function saveResults(file, results) {
  let old = [];
  try { old = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* first run */ }
  const ids = new Set(results.map((r) => r.id));
  writeJson(file, [...old.filter((r) => !ids.has(r.id)), ...results].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })));
}

// Video without ffmpeg: DevTools screencast frames, encoded to WebM by the browser's own MediaRecorder.
// const rec = await record(page); ...steps...; await rec.stop(file.webm, framesDir?)
export async function record(page, { maxWidth = 390 } = {}) {
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
      if (framesDir) { // a few evenly spaced stills, for reports that cannot play video
        fs.mkdirSync(framesDir, { recursive: true });
        const step = Math.max(1, Math.floor(frames.length / keepFrames));
        frames.filter((_, i) => i % step === 0).slice(0, keepFrames).forEach((f, i) => fs.writeFileSync(path.join(framesDir, `frame-${i + 1}.jpg`), Buffer.from(f.data, 'base64')));
      }
      const enc = await page.context().browser().newPage();
      const b64 = await enc.evaluate(async (fr) => {
        const imgs = await Promise.all(fr.map((f) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = 'data:image/jpeg;base64,' + f.data; })));
        const c = document.createElement('canvas'); c.width = imgs[0].width; c.height = imgs[0].height;
        document.body.appendChild(c);
        const g = c.getContext('2d'); g.drawImage(imgs[0], 0, 0);
        const stream = c.captureStream(0); const track = stream.getVideoTracks()[0];
        const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 600_000 });
        const chunks = []; rec.ondataavailable = (e) => chunks.push(e.data);
        const done = new Promise((r) => { rec.onstop = r; });
        rec.start(100);
        for (let i = 0; i < imgs.length; i++) {
          const hold = i + 1 < fr.length ? Math.min(Math.max((fr[i + 1].t - fr[i].t) * 1000, 33), 1500) : 1000;
          // repaint every ~100 ms while holding a frame so players show a steady picture
          for (let e = 0; e < hold; e += 100) { g.drawImage(imgs[i], 0, 0); track.requestFrame(); await new Promise((r) => setTimeout(r, Math.min(100, hold - e))); }
        }
        rec.stop(); await done;
        const buf = await new Blob(chunks, { type: 'video/webm' }).arrayBuffer();
        let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
        return btoa(s);
      }, frames);
      await enc.close();
      fs.writeFileSync(file, Buffer.from(b64, 'base64'));
      return file;
    },
  };
}
