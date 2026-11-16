// Builds one storyboard PNG per showcased bug (key frames + captions + red marks) for docs/bugs/,
// so the bug is visible right in GitHub's Markdown, where WebM videos do not play inline.
import fs from 'node:fs';
import path from 'node:path';
import * as L from './lib.mjs';

const OUT = path.resolve(L.RUN, '../../docs/bugs');
fs.mkdirSync(OUT, { recursive: true });
const ev = (p) => path.join(L.RUN, p);
const dataUrl = (p) => `data:image/${p.endsWith('.png') ? 'png' : 'jpeg'};base64,${fs.readFileSync(ev(p)).toString('base64')}`;

// marks: boxes {x, y, w, h} or taps {tap: [x, y]} in source-image pixels
const BOARDS = [
  { id: 'BUG-001', title: 'Level Complete closes on a tap outside it: the +30 coins are never paid', width: 280, panels: [
    { img: 'test-progression/evidence/PR-W2-run1-1-popup.jpg', caption: '1. Level won. The popup promises +30 coins (player has 100)', marks: [{ x: 270, y: 970, w: 240, h: 90 }] },
    { img: 'test-progression/evidence/PR-W2-run1-1-popup.jpg', caption: '2. The player taps the dimmed area outside the card (here: the top-left corner) or presses Escape', marks: [{ tap: [52, 52] }] },
    { img: 'test-progression/evidence/PR-W2-run1-2-after-tap.jpg', caption: '3. Popup gone: coins still 100, empty board, no Continue', marks: [{ x: 600, y: 30, w: 170, h: 70 }, { x: 80, y: 220, w: 620, h: 600 }] },
  ] },
  { id: 'BUG-002', title: '360 px phones: buying gems and coins pushes Settings and Close off screen', width: 720, stack: true, panels: [
    { img: 'test-ui/evidence/UI-21-1-menu-100-coins.png', caption: '1. Main menu, 100 coins / 20 gems: the Settings gear is already half cut', marks: [{ x: 655, y: 10, w: 64, h: 110 }] },
    { img: 'test-ui/evidence/UI-21-2-store-9100-coins.png', caption: '2. Store after buying gems and coins: no Close X on screen', marks: [{ x: 640, y: 10, w: 79, h: 110 }] },
    { img: 'test-ui/evidence/UI-21-3-menu-9100-coins.png', caption: '3. Back on the menu, 9,100 coins / 2,180 gems: the Settings gear is gone', marks: [{ x: 640, y: 10, w: 79, h: 110 }] },
  ] },
  { id: 'BUG-003', title: 'The store sells the $4.99 offer with No Ads to a player who owns No Ads', width: 300, panels: [
    { img: 'test-store/evidence/ST-08-run1-2-bought-again.jpg', caption: 'No Ads is "Owned", yet the Special Offer with No Ads is still for sale, and buying it says "No Ads" again', marks: [{ x: 25, y: 300, w: 730, h: 225 }, { x: 505, y: 585, w: 225, h: 110 }, { x: 40, y: 1390, w: 700, h: 80 }] },
    { img: 'test-store/evidence/ST-08-run1-crop.png', caption: 'The offer card, close up', marks: [] },
  ] },
  { id: 'BUG-004', title: 'Add Slot from Out of Slots has no limit: 10 squeezed slots (the booster stops at 7)', width: 300, panels: [
    { img: 'test-puzzles/evidence/PZ-35-run1-after-6-ads.jpg', caption: 'After 6 x "Add Slot" from the Out of Slots popup: 10 slots', marks: [{ x: 15, y: 995, w: 750, h: 125 }] },
    { img: 'test-puzzles/evidence/PZ-35-run1-crop.png', caption: 'The slot row, close up (4 -> 10 slots)', marks: [] },
  ] },
  { id: 'BUG-008', source: 'found by full-playthrough (game-qa-skills) after all 102 levels · full evidence in examples/pixel-swarm-playthrough', title: 'Player XP never grows: after 102 wins the player is still level 1 and level-gated content stays locked', width: 300, panels: [
    { img: '../pixel-swarm-playthrough/evidence/BUG-008-1-profile-after-102-wins.jpg', caption: 'Profile after winning all 102 levels: Level 1, XP 1/2, next reward 50 coins (never paid)', marks: [{ x: 170, y: 300, w: 180, h: 110 }, { x: 195, y: 560, w: 155, h: 75 }] },
    { img: '../pixel-swarm-playthrough/evidence/BUG-008-2-firefly-locked.jpg', caption: 'Firefly and all 7 looks: "Unlocks at player level 5", unreachable without the debug menu', marks: [{ x: 220, y: 340, w: 100, h: 45 }, { x: 95, y: 695, w: 205, h: 40 }] },
  ] },
];

const browser = await L.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 1 });
for (const b of BOARDS) {
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#fff;font:15px/1.35 system-ui,'Segoe UI',sans-serif;color:#1d1d1f}
    .wrap{display:inline-block;padding:18px 18px 16px;background:#fff}
    h1{font-size:18px;margin:0 0 12px;max-width:${b.stack ? b.width : b.width * b.panels.length + 16 * (b.panels.length - 1)}px}
    h1 b{color:#b42318;margin-right:8px}
    .row{display:flex;gap:16px;flex-direction:${b.stack ? 'column' : 'row'};align-items:flex-start}
    figure{margin:0;width:${b.width}px}
    .pic{position:relative;border:1px solid #d0d0d0;border-radius:6px;overflow:hidden;line-height:0}
    .pic img{width:100%;display:block}
    .box{position:absolute;border:3px solid #e5262f;border-radius:6px;box-shadow:0 0 0 2px rgba(255,255,255,.7)}
    .tap{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border:4px solid #e5262f;border-radius:50%;background:rgba(229,38,47,.25)}
    figcaption{margin-top:6px;font-size:14px}
    .foot{margin-top:10px;font-size:12px;color:#6b6b70}
  </style><div class="wrap" id="board"><h1><b>${b.id}</b>${b.title}</h1><div class="row">${b.panels.map((p) => `
    <figure><div class="pic" data-src="${p.img}"><img src="${dataUrl(p.img)}">${(p.marks || []).map((m) => m.tap
      ? `<i class="tap" data-x="${m.tap[0]}" data-y="${m.tap[1]}"></i>`
      : `<i class="box" data-x="${m.x}" data-y="${m.y}" data-w="${m.w}" data-h="${m.h}"></i>`).join('')}</div>
    <figcaption>${p.caption}</figcaption></figure>`).join('')}</div>
    <div class="foot">Pixel Swarm v1.0.0 · ${b.source || 'recorded by test-game-full (game-qa-skills) · full evidence in examples/pixel-swarm-full'}</div></div>`;
  await page.setContent(html);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth));
  // place marks: source pixels -> displayed pixels
  await page.evaluate(() => document.querySelectorAll('.pic').forEach((pic) => {
    const img = pic.querySelector('img'), k = img.clientWidth / img.naturalWidth;
    pic.querySelectorAll('.box').forEach((m) => Object.assign(m.style, { left: m.dataset.x * k + 'px', top: m.dataset.y * k + 'px', width: m.dataset.w * k + 'px', height: m.dataset.h * k + 'px' }));
    pic.querySelectorAll('.tap').forEach((m) => Object.assign(m.style, { left: m.dataset.x * k + 'px', top: m.dataset.y * k + 'px' }));
  }));
  await page.locator('#board').screenshot({ path: path.join(OUT, `${b.id}.png`) });
  console.log('wrote', `docs/bugs/${b.id}.png`);
}
await browser.close();
