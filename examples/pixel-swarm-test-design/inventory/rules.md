# Rules found in code

Scanned 15 files under `PixelSwarm`. 69 possible rules. The scan is generous: check each one in the code before you turn it into a case.

| Category | Matches |
|---|---|
| input-limit | 2 |
| validator | 0 |
| boundary | 33 |
| message | 12 |
| state | 14 |
| route | 0 |
| permission | 0 |
| flag | 8 |

## Input limits in HTML or components (boundary-value cases)

| Rule | Where | Code |
|---|---|---|
| maxlength=14 | index.html:185 | `<input id="name-input" maxlength="14" aria-label="Player name" hidden>` |
| maxlength=90 | index.html:619 | `<input id="rp-title" class="rp-input" maxlength="90" placeholder="e.g. Bees stop flying after a booster" autoc` |

## Numeric limits in code (boundary-value cases)

| Rule | Where | Code |
|---|---|---|
| blocks.length >= 3 | js/app.js:1449 | `blocks.push({ color, amount: n, mystery, frozen: blocks.length >= 3 && rand() < cfg.frozen ? 2 + Math.floor(pr` |
| seg.length < 2 | js/app.js:1494 | `if (seg.length < 2 \|\| seg.some((b) => !isBlock(b) \|\| b.link \|\| b.frozen)) continue;` |
| els.length < 2 | js/app.js:1674 | `if (els.length < 2) return;` |
| b.amount > 0 | js/app.js:1719 | `el.classList.toggle('stuck', !!(b && b.amount > 0 && !(b.inFlight > 0) && !canEat(b)));` |
| b.amount <= 0 | js/app.js:1725 | `if (b.amount <= 0 \|\| canEat(b)) return toast('The bees are eating ${colorName(b.color)} pixels');` |
| b.amount <= 0 | js/app.js:1981 | `if (!b \|\| b.amount <= 0) return;` |
| b.amount <= 0 | js/app.js:2022 | `const done = (b) => b.amount <= 0 && b.inFlight <= 0;` |
| b.amount > 0 | js/app.js:2029 | `const stuck = !g.bees.length && g.slots.every((b) => b && (b.amount > 0 ? !findTarget(g, b.color) : !!b.link))` |
| g.slots.length >= 7 | js/app.js:2122 | `if (g.slots.length >= 7) return toast('Maximum slots reached');` |
| group.length > 1 | js/app.js:2360 | `const link = group.length > 1 ? {} : null;` |
| s.amount > 0 | js/app.js:2389 | `for (let k = 0; k < g.cfg.beesPerLaunch && s.amount > 0; k++) {` |
| s.amount <= 0 | js/app.js:2396 | `slots.forEach((s, i) => { if (s && s.amount <= 0 && (!s.link \|\| slots.every((o) => !o \|\| o.link !== s.link` |
| o.amount <= 0 | js/app.js:2396 | `slots.forEach((s, i) => { if (s && s.amount <= 0 && (!s.link \|\| slots.every((o) => !o \|\| o.link !== s.link` |
| b.amount < 4 | js/app.js:2417 | `buildLevel(t.id, d, i).cols.flat().forEach((b) => { blocks += 1; if (b.amount < 4) tiny += 1; }); } }));` |
| lv.hidden.size > 0 | js/app.js:2425 | `key: lv.cols.flat().some((b) => b.kind === 'lock'), pipe: lv.cols.flat().some((b) => b.kind === 'pipe'), hidde` |
| lv.big.size > 0 | js/app.js:2425 | `key: lv.cols.flat().some((b) => b.kind === 'lock'), pipe: lv.cols.flat().some((b) => b.kind === 'pipe'), hidde` |
| sp.length === 1 | js/app.js:2668 | `if (sp.length === 1) return openSpeedStore();` |
| colors.size > 3 | js/app.js:2708 | `check('screenshot shows the board', colors.size > 3, colors.size + ' colors');` |
| main.data.coins === 1235 | js/app.js:2890 | `ok('save.slots', main.v === 2 && main.data.coins === 1235 && backup.data.coins === 1234, JSON.stringify([main.` |
| backup.data.coins === 1234 | js/app.js:2890 | `ok('save.slots', main.v === 2 && main.data.coins === 1235 && backup.data.coins === 1234, JSON.stringify([main.` |
| data.coins === 1234 | js/app.js:2892 | `ok('save.recover', readSave(SAVE_KEY) === null && readSave(SAVE_KEY + '.backup').data.coins === 1234);` |
| data.coins === 1235 | js/app.js:2895 | `ok('save.code', restoreFromCode(code) && JSON.parse(localStorage.getItem(SAVE_KEY)).data.coins === 1235 && !re` |
| o.coins === 7 | js/app.js:2896 | `ok('save.legacy', (() => { localStorage.setItem('ps.test', JSON.stringify({ coins: 7 })); const o = readSave('` |
| MIN_DE = 25 | js/data.js:41 | `const MIN_DE = 25; // clearly different at a glance (raised after playtest: 18–20 still looked alike)` |
| MIN_CELLS_PER_COLOR = 4 | js/data.js:74 | `const MIN_CELLS_PER_COLOR = 4;` |
| a.length > 120 | js/perf.js:49 | `a.push(ms); if (a.length > 120) a.shift();` |
| p.length < 3 | js/perf.js:207 | `if (p.length < 3) return null;` |
| memory.heapGrowthMBPerMin > 1 | js/perf.js:226 | `: memory.heapGrowthMBPerMin > 1 ? 'Possible leak: heap +${memory.heapGrowthMBPerMin} MB/min' : 'Memory stable ` |
| memory.domGrowthPerMin > 20 | js/perf.js:228 | `if (memory.domGrowthPerMin !== null && memory.domGrowthPerMin > 20) verdict.push('DOM keeps growing: +${memory` |
| memory.objectsGrowthPerMin > 50 | js/perf.js:229 | `if (memory.objectsGrowthPerMin !== null && memory.objectsGrowthPerMin > 50) verdict.push('Scene keeps growing:` |
| MAX_CRUMBS = 40 | js/report.js:12 | `const MAX_CRUMBS = 40, MAX_ERRORS = 20, MAX_LOG = 300, LOG_KEY = 'pixelswarm.log';` |
| MAX_ERRORS = 20 | js/report.js:12 | `const MAX_CRUMBS = 40, MAX_ERRORS = 20, MAX_LOG = 300, LOG_KEY = 'pixelswarm.log';` |
| MAX_LOG = 300 | js/report.js:12 | `const MAX_CRUMBS = 40, MAX_ERRORS = 20, MAX_LOG = 300, LOG_KEY = 'pixelswarm.log';` |

## Messages shown on errors (expected results for negative cases)

| Rule | Where | Code |
|---|---|---|
| Not enough gems (need ${c.gems}) | js/app.js:391 | `if (state.gems < c.gems) { toast('Not enough gems (need ${c.gems})'); return; }` |
| Not enough gems (need ${LOOK_PRICE}) | js/app.js:808 | `if (state.gems < LOOK_PRICE) return toast('Not enough gems (need ${LOOK_PRICE})');` |
| Not enough gems (need ${s.price}) | js/app.js:830 | `if (state.gems < s.price) { toast('Not enough gems (need ${s.price})'); return; }` |
| ${b.name} (locked) | js/app.js:1736 | `: '<button class="bst locked" data-action="booster-locked" data-b="${b.id}" aria-label="${b.name} (locked)">${` |
| Not enough coins (need ${b.coins.toLocaleString('en-US')}) | js/app.js:1814 | `if (state.coins < b.coins) return toast('Not enough coins (need ${b.coins.toLocaleString('en-US')})');` |
| Not enough gems (need ${t.gems}) | js/app.js:1820 | `if (state.gems < t.gems) return toast('Not enough gems (need ${t.gems})');` |
| Locked! The bugs must collect its key 🔑 in the picture | js/app.js:1900 | `if (b.kind === 'lock') return 'Locked! The bugs must collect its key 🔑 in the picture';` |
| You can't see the color and amount until it reaches the front. | js/app.js:2214 | `mystery: { icon: 'puzzles/block_mystery', name: 'Mystery Blocks', desc: "You can't see the color and amount un` |
| stuck: a "${group[0].color}" block can't reach its pixels | js/app.js:2337 | `if (!moved) return 'stuck: a "${group[0].color}" block can't reach its pixels';` |
| Notifications are not allowed: enable them in the phone/browser settings | js/app.js:2635 | `'no-permission': 'Notifications are not allowed: enable them in the phone/browser settings', unsupported: 'Thi` |
| PixiJS unavailable, using 2D canvas | js/app.js:3174 | `.catch((e) => console.warn('PixiJS unavailable, using 2D canvas', e));` |
| screenshot failed:  | js/report.js:98 | `} catch (e) { logError('report', 'screenshot failed: ' + (e && e.message ? e.message : e)); return null; }` |

## States and statuses (state-transition cases)

| Rule | Where | Code |
|---|---|---|
| mode = pick | js/app.js:1658 | `const pick = game.mode === 'pick';` |
| mode = wing | js/app.js:1827 | `const wind = !!(game && game.mode === 'wing');` |
| mode = pick | js/app.js:1850 | `if (idx > 0 && g.mode !== 'pick') return;` |
| mode = pick | js/app.js:1851 | `const pick = g.mode === 'pick';` |
| phase = out | js/app.js:1953 | `g.bees.push({ el, block: slotBlock, t, sx, sy, ex, ey, hx: sx, hy: sy, phase: 'out',` |
| phase = back | js/app.js:1996 | `const back = bee.phase === 'back';` |
| mode = wing | js/app.js:2136 | `if (!g \|\| g.mode !== 'wing' \|\| g.over) return;` |
| mode = autoplay | js/app.js:2547 | `info: () => ({ mode: 'autoplay', speed: AUTOPLAY_SPEED, extraBugs, levelsStarted: run.levels, wins: run.wins,` |
| state = suspended | js/audio.js:33 | `if (ctx.state === 'suspended') ctx.resume();` |
| state = running | js/audio.js:102 | `if (!sfxOn \|\| !SFX[name] \|\| !ensure() \|\| ctx.state !== 'running') return;` |
| state = running | js/audio.js:168 | `if (!ctx \|\| ctx.state !== 'running') return; // starts on the first tap` |
| state = none | js/audio.js:200 | `const debug = () => ({ state: ctx ? ctx.state : 'none', music: current, played: { ...played } });` |
| mode = none | js/data.js:211 | `if (mode === 'none') return g;` |
| mode = both | js/data.js:219 | `else if (mode === 'both' && botEdge && DARK[ch]) out[y][x] = DARK[ch];` |

## Feature flags and debug switches (configurations to cover or exclude)

| Rule | Where | Code |
|---|---|---|
| DEBUG | js/app.js:80 | `const DEBUG = true;` |
| DEBUG | js/app.js:3132 | `$('dbg-btn').hidden = !DEBUG;` |
| DEBUG | js/app.js:3197 | `else if (DEBUG) { try { if (localStorage.getItem('pixelswarm.simsafe')) setSafeSim(true); } catch (e) { /* ign` |
| DEBUG | js/app.js:3210 | `platform: () => (PSNative.native ? 'Android app' : 'web'), version: APP_VERSION, build: DEBUG ? 'debug' : 'rel` |
| DEBUG | js/app.js:3216 | `PSReport.info('game ready · v${APP_VERSION} (${DEBUG ? 'debug' : 'release'}, ${PSNative.native ? 'Android app'` |
| DEBUG | js/app.js:3220 | `if (DEBUG && PSPerf.wasOn) PSPerf.show(true);` |
| DEBUG | scripts/build.mjs:23 | `app = app.replace(/const DEBUG = (true\|false);/, 'const DEBUG = ${debug};');` |
| DEBUG | scripts/build.mjs:33 | `console.log('Built Pixel Swarm v${pkg.version} into dist/ (${debug ? 'DEBUG build' : 'release build, debug men` |

