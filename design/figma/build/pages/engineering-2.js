// Experience & notes · Engineering notes (2 of 2) — the codebase, how this file was made, build and release.
// Run: node design/figma/bridge/run.mjs design/figma/build/pages/notes-kit.js design/figma/build/pages/engineering-2.js
const L = S.lib, N = S.nk
const CH = 'Engineering notes', PX = 'Engineering · '
const ORDER = ['Header', 'What rendering costs', 'Cheap and expensive changes', 'The codebase', 'How this file was made', 'Build and release'].map(n => PX + n)
const sec = await L.chapter(CH, { clear: false })
N.clearMine(sec, ORDER, ORDER.slice(3))
const BW = 2300, IN = BW - 144
const code = (s, o = {}) => N.linkAll(L.text(s, 'codeStrong', Object.assign({ size: 13, lh: 20 }, o)))
const cmd = (s, w) => L.frame({ name: 'Command · ' + s.slice(0, 40), dir: 'v', pad: [10, 14], r: 8, fill: '#FFFFFF', fillA: 0.8, stroke: L.C.stroke, kids: [L.text(s, 'code', { size: 12, lh: 19, w: w - 28, alpha: 0.9 })], w })

// ---------- the codebase --------------------------------------------------------------------------
const cb = L.board({ name: PX + 'The codebase', kicker: 'ENGINEERING', title: 'The codebase', titleStyle: 'h1', w: BW, leadW: 1300,
  lead: 'Twenty Swift files in Sources/Arcana, 11,203 lines, compiled straight into the app with no Xcode project and no dependencies. Every file name links to it on GitHub at c7e12f4.',
  tags: [['fixed', 'Engineering fact']] })
const FILES = [
  ['The app and the stage'],
  ['ArcanaApp.swift', 31, 'The app: one window (minimum 940 × 660, default 1260 × 860) and the Settings scene. Removes New; replaces Help.', 'ArcanaApp'],
  ['RootView.swift', 1735, 'The stage, absolutely positioned: the title and its light, the invitation, the spread chooser, the deck and PRESS AND HOLD, slots, halos, the thread, the verse, prompts, the altar, the bowl and the key glyph. All key handling, and the window’s size on appear.', 'RootView, Inspector, Halos, Thread (private)'],
  ['Game.swift', 924, 'The state machine and its timing: the held question, the draw, the writing of each card, the recital, the return. Layout gives every size as a formula of the stage.', 'Game, Layout'],
  ['The cards'],
  ['Palette.swift', 133, 'The colours, Didot, Caps (the spaced capitals label) and the paper grain.', 'Palette, Caps'],
  ['Ink.swift', 325, 'The pen: strokes wobbled like a hand from a seeded random stream, and the marks every drawing is made of.', 'Pen, Mark'],
  ['CardImages.swift', 385, 'The card as an object: stock, grain, vignette, frame, art, the letterpress band and gold leaf; faces and returned blanks, rasterised once and reused.', 'CardFace, CardBlank'],
  ['CardArt.swift', 592, 'The 22 Major compositions, the frame, the back, the engraved wheel’s marks and the fallback icon’s marks.', 'CardArt'],
  ['Suits.swift', 1173, 'The 56 minors: four emblems (cup, wand, sword, pentacle), the pip layouts and the court devices.', 'Suits'],
  ['Deck.swift', 434, 'Every card’s words (name, essence, a line upright and reversed, keys) and the three spreads with their positions.', 'Card, Spread'],
  ['The sky'],
  ['Chamber.swift', 637, 'The sky at first light: the gradients, the engraved wheel, the moon’s place and glow. It hands the near sky’s shapes to the GPU.', 'Chamber, NearSky'],
  ['SkyRenderer.swift', 505, 'The near sky on the GPU: dust, blooms, glints, the hold ring and its arc, ripples and the cut’s flash, at the display’s pace.', 'SkyRenderer, SkyLayer'],
  ['Moon.swift', 465, 'Tonight’s moon: the phase from a known new moon and the synodic month; its face painted per pixel (seas, craters, a jagged terminator).', 'Moon'],
  ['Answers.swift', 540, 'As Above: the Wheel’s turn, the Star’s glints, the Moon’s half-light and the Sun’s dawn, as Core Animation layers.', 'Heavens, SkyLights, WheelTurn'],
  ['The question, the moon’s door and the rest'],
  ['Quill.swift', 322, 'The written question: each letter laid in gold and cooling to ink; the hold gives it to the deck as dust.', 'Quill'],
  ['QuillInput.swift', 454, 'The page the question is typed on: a real, invisible text view, so accents, dead keys and input methods work.', 'QuillField, QuillTextView'],
  ['Keeping.swift', 1170, 'What the Moon Keeps: kept.json in Application Support, the moon’s door, kept pages and chevrons, remembering, forgetting, ONE MOON AGO.', 'Keeping, Kept, MoonDoor'],
  ['Legend.swift', 377, 'The keys page: the old-key glyph and its seven pen-drawn lines.', 'LegendPage, LegendKey'],
  ['Weave.swift', 265, 'Find the thread: one quiet synthesis of a finished spread by OpenAI, which sees only the deck’s own words and the positions.', 'WeaveService, WeaveResult'],
  ['Settings.swift', 200, 'The Settings window: one field for an OpenAI key, kept in the Keychain, and a line saying whether OpenAI will take it.', 'SettingsView'],
  ['Sfx.swift', 536, 'Sound, all synthesised at launch: a bowl per card, chimes, the drone, the hand’s sounds and the reverb. No audio files.', 'Sfx, Synth'],
]
const CWF = 260, CWL = 70, CWD = 1180, CWT = 480
const tbl = L.col([], { gap: 0, name: 'Files' })
const hr = L.row([['File', CWF], ['Lines', CWL], ['What it draws or does', CWD], ['Main types', CWT]].map(([t, w]) => L.text(t, 'kicker', { w })), { gap: 24, pad: [8, 12], name: 'Header row' })
L.add(tbl, hr)
let zi = 0
for (const f of FILES) {
  if (f.length === 1) { L.add(tbl, L.col([L.text(f[0], 'h3', { color: L.C.gold })], { pad: [22, 12, 8, 12], name: 'Group · ' + f[0] })); continue }
  const r = L.row([code(f[0], { w: CWF }), L.text(String(f[1]), 'code', { w: CWL, align: 'RIGHT' }), L.text(f[2], 'small', { w: CWD }), L.text(f[3], 'code', { w: CWT })], { gap: 24, pad: [11, 12], align: 'MIN', name: 'File · ' + f[0] })
  r.fills = zi++ % 2 ? [L.solid('#FFFFFF', 0.55)] : []
  r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; r.strokeAlign = 'INSIDE'
  L.add(tbl, r)
}
L.add(cb, tbl)
L.add(cb, L.section('Around the app', { style: 'h2' }))
const AROUND = [
  ['Tools/shot/main.swift', 'Posed stage renders for review, through rebuild-shots.sh into build/shots (no title bar).'],
  ['Tools/icon/main.swift', 'The code-drawn fallback icon, used only if the logo can’t be read.'],
  ['Tools/deck/main.swift', 'Writes the deck’s words to agent/deck.json for the agent reading.'],
  ['Assets/arcana-logo.png', 'The app icon’s source image.'],
  ['agent/', 'The Cloudflare Worker: worker.js (never rename it), deck.json, deploy.sh, wrangler.toml.'],
  ['film/', 'The launch film: arcana.html draws every frame on canvas; score.mjs makes the score; make.sh renders it.'],
  ['docs/', 'GitHub Pages: arcana.png (the README picture) and demo.mp4 (linked in the post; never move it).'],
  ['_original/', 'The candle-black version from before the redesign: its sources, a build and renders (23 September).'],
  ['build.sh · rebuild-shots.sh', 'Build the app; render the posed stage shots. Package.swift describes the same sources as a Swift package; build.sh doesn’t use it.'],
  ['design/figma/', 'This file’s assets, render tools, bridge and build steps (not yet committed).'],
]
const AW = Math.floor((IN - 32) / 2)
const acol = items => L.col(items.map(([p, d]) => L.row([code(p, { w: 280, size: 12, lh: 18 }), L.text(d, 'small', { w: AW - 300 })], { gap: 20, align: 'MIN', name: 'Around · ' + p })), { gap: 12, w: AW, name: 'Around' })
L.add(cb, L.row([acol(AROUND.slice(0, 5)), acol(AROUND.slice(5))], { gap: 32, align: 'MIN', name: 'Around the app' }))
sec.appendChild(cb)

// ---------- how this file was made ------------------------------------------------------------------
const hf = L.board({ name: PX + 'How this file was made', kicker: 'ENGINEERING', title: 'How this file was made', titleStyle: 'h1', w: BW, leadW: 1300,
  lead: 'Every image in this file was rendered from the app’s own code on 30 September, and every board was placed by code. Both can be run again after the app changes.' })
L.add(hf, L.section('The assets', { style: 'h2', leadW: 1300, lead: 'Each renderer copies Sources/Arcana (all but ArcanaApp.swift) into its own src/ and patches only the copy: no sound, no network, no Keychain, no kept readings. The repository itself is never touched. Output goes to design/figma/assets/<family>/ with a manifest.json; assets/_index.json lists the families, known problems and gaps. Each family’s README (design/figma/render/<family>/README.md) gives its options, such as rendering only some parts.' }))
const FAM = [
  ['shots, shots-window', 'Every screen state of the room: stage renders, and real-window renders with the 32 pt title bar, checked against a measured titled window.', 'cd design/figma/render/shots && ./build.sh', 'ImageRenderer, @2x; AppKit measurement'],
  ['cards', 'All 78 faces, reversed faces, returned blanks, the back; PNG and SVG.', 'design/figma/render/cards/build.sh && python3 design/figma/render/cards/make_deck.py && python3 design/figma/render/cards/make_manifest.py', 'ImageRenderer, about 40 s'],
  ['glyphs', 'Every small drawn thing as SVG: room glyphs, key signs, diamonds, thread, emblems, the pen’s vocabulary.', 'cd design/figma/render/glyphs && ./run.sh', 'The app’s marks, as paths'],
  ['sky', 'The sky, the moon (every phase) and every light, with vector rebuilds.', 'cd design/figma/render/sky && ./prepare.sh && ./mksky ../../assets/sky && python3 svg.py && ./sheets.sh && python3 manifest.py', 'ImageRenderer, Core Graphics, the app’s Metal SkyRenderer.still'],
  ['type-ink', 'Type and the pen in motion: specimens, the quill, the ink cooling, verse, the altar, the thread.', 'cd design/figma/render/type-ink && ./build.sh && python3 manifest.py', 'ImageRenderer, 8-bit sRGB'],
  ['surfaces', 'Settings, the window frame, menus, the keys page, the moon’s door.', 'cd design/figma/render/surfaces && ./build.sh && bin/surfaces ../../assets/surfaces work && python3 make_menus.py && python3 make_manifest.py', 'ImageRenderer; an invented kept.json'],
  ['brand', 'Logo, icon, wordmark, film frames, demo stills, the README picture, history, agent, releases.', 'cd design/figma/render/brand && ./make.sh', 'Needs build/Arcana.app, film/out, build/preview (all gitignored); about 2 min'],
  ['sound', 'Every voice as WAV, with waveforms and spectrograms.', 'cd design/figma/render/sound && ./run.sh', 'The app’s own Synth, never the live engine; about 2 min'],
  ['tokens', '60 colours, 35 type styles, 14 effects, 47 motion specs, which became this file’s variables and styles.', 'python3 design/figma/render/tokens/compile.py', 'Compiled from the inventories'],
]
const FW1 = 220, FW2 = 640, FW3 = 760, FW4 = 440
const ft = L.col([L.row([['Family', FW1], ['What', FW2], ['Re-run', FW3], ['How', FW4]].map(([t, w]) => L.text(t, 'kicker', { w })), { gap: 24, pad: [8, 12], name: 'Header row' })], { gap: 0, name: 'Families' })
FAM.forEach(([f, w, c, h], i) => {
  const r = L.row([L.text(f, 'codeStrong', { w: FW1, size: 13, lh: 20 }), L.text(w, 'small', { w: FW2 }), cmd(c, FW3), L.text(h, 'small', { w: FW4, alpha: 0.7 })], { gap: 24, pad: [10, 12], align: 'MIN', name: 'Family · ' + f })
  r.fills = i % 2 ? [L.solid('#FFFFFF', 0.4)] : []
  r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; r.strokeAlign = 'INSIDE'
  L.add(ft, r)
})
L.add(hf, ft)

L.add(hf, L.section('The Figma file', { style: 'h2', leadW: 1300, lead: 'Each chapter is a step file run inside the open Figma file by a small local plugin, the Arcana Bridge. A step clears and rebuilds only its own chapter, so any chapter can be rebuilt on its own. design/figma/build/rebuild.sh lists every step of the whole file in order, with its kits, and can run them all.' }))
// A native diagram of the pipeline.
const BOXW = 400, BOXH = 150, GAPX = 110
const BOXES = [
  ['Step file', 'design/figma/build/pages/<slug>.js', 'One chapter, as code. Kits (…-kit.js, …-lib.js) run in front of it.'],
  ['run.mjs', 'design/figma/bridge/run.mjs', 'Sends the step, with build/lib.js installed as S.lib.'],
  ['server.mjs', '127.0.0.1:7719', 'Queues steps one at a time and serves assets/.'],
  ['Arcana Bridge', 'bridge/code.js · ui.html · manifest.json', 'A development plugin that runs each step inside this file.'],
]
const dia = L.frame({ name: 'Diagram · the bridge', w: BOXES.length * BOXW + (BOXES.length - 1) * GAPX, h: BOXH + 120 })
BOXES.forEach(([t, p, d], i) => {
  const bx = L.col([L.text(t, 'h3', { size: 18, lh: 26 }), L.text(p, 'code', { size: 11, lh: 16, w: BOXW - 48 }), L.text(d, 'small', { w: BOXW - 48 })], { gap: 6, pad: 24, w: BOXW, h: BOXH, r: 14, fill: i === 3 ? L.C.lilac : L.C.card, fillA: i === 3 ? 0.6 : 0.8, stroke: L.C.stroke, name: 'Box · ' + t })
  dia.appendChild(bx); bx.x = i * (BOXW + GAPX); bx.y = 0
  if (i < BOXES.length - 1) L.arrow(dia, bx.x + BOXW + 12, BOXH / 2, bx.x + BOXW + GAPX - 12, BOXH / 2, { color: L.C.gold, alpha: 0.9, sw: 2 })
})
const lastX = 3 * (BOXW + GAPX) + BOXW / 2
L.arrow(dia, lastX, BOXH + 10, lastX, BOXH + 60, { color: L.C.gold, alpha: 0.9, sw: 2 })
const outT = L.text('PNG exports of each board → design/figma/out/pages/<slug>/', 'code', { size: 12, lh: 18, alpha: 0.8 }); dia.appendChild(outT); outT.x = lastX - outT.width + 60; outT.y = BOXH + 72
L.add(hf, dia)
const SW = Math.floor((IN - 32) / 2)
L.add(hf, L.row([
  L.col([L.text('To rebuild a chapter', 'h3'),
    L.text('1  Start the server.', 'small', { w: SW }), cmd('node design/figma/bridge/server.mjs', SW),
    L.text('2  In the Figma desktop app, import the plugin from design/figma/bridge/manifest.json (Plugins ▸ Development) and run Arcana Bridge in this file.', 'small', { w: SW }),
    L.text('3  Send the chapter’s steps, in order, each with its kit in front.', 'small', { w: SW }),
    cmd('node design/figma/bridge/run.mjs design/figma/build/pages/notes-kit.js design/figma/build/pages/history-1.js', SW),
    cmd('node design/figma/bridge/run.mjs --status', SW),
    L.text('To rebuild the whole file: the tokens, the title bar, then every chapter’s steps in reading order (a first step may clear its chapter, so later steps follow it), and last, each page put in order. List the steps, or run them from any number:', 'small', { w: SW }),
    cmd('design/figma/build/rebuild.sh            # list every step, numbered', SW),
    cmd('design/figma/build/rebuild.sh --run [n]  # run them all, or from step n', SW)], { gap: 10, w: SW, name: 'Rebuild' }),
  L.col([L.text('Rules the steps keep', 'h3'),
    L.bullets([
      'The file has three pages (Figma’s Starter plan): never add or rename one. Each topic is a section on its page.',
      'A step touches only its own chapter; L.arrange puts the chapters back in reading order.',
      'Colour variables, text styles and effect styles come from tokens.json. Steps bind to them and never delete them.',
      'Screens use L.window with shots-window/ renders, so they carry the real 32 pt title bar.',
      'build/PLAN.md holds the plan and conventions; build/HISTORY.md the design history.',
    ], { w: SW, style: 'small', gap: 8 })], { gap: 10, w: SW, name: 'Rules' }),
], { gap: 32, align: 'MIN', name: 'Rebuild and rules' }))
sec.appendChild(hf)

// ---------- build and release -----------------------------------------------------------------------
const br = L.board({ name: PX + 'Build and release', kicker: 'ENGINEERING', title: 'Build and release', titleStyle: 'h1', w: 1600,
  lead: 'Arcana 1.3 is the current release: a zip on GitHub for Apple silicon Macs on macOS 14 or later, ad hoc signed and not notarized.',
  tags: [['shipped', 'Shipped · 1.3 (build 4)']] })
const RW = 1456, TW = 380, BW2 = RW - TW - 40
const STEPS = [
  ['Build', 'swiftc compiles Sources/Arcana straight into build/Arcana.app. The script writes Info.plist (version 1.3, build 4), turns the logo into a 512 px AppIcon.icns with sips, and signs ad hoc.', ['./build.sh && open build/Arcana.app'], 'build.sh'],
  ['Look', 'Posed stage renders for a quick visual check (no title bar). For design work use design/figma/render instead.', ['./rebuild-shots.sh 35 37     # only the Moon and the Sun'], 'rebuild-shots.sh · Tools/shot/main.swift'],
  ['Release', 'From a clean export of the commit, never the working tree. Bump the version in build.sh first. Plain ditto -k adds a __MACOSX folder; a short sha makes gh fail. Keep the asset name Arcana.zip: the README and the post link to releases/latest.',
    ['git archive <sha> | tar -x      # in an empty folder', './build.sh                       # in that folder', 'ditto -c -k --norsrc --noextattr --keepParent build/Arcana.app Arcana.zip', 'gh release create vX Arcana.zip --target <full sha>'], 'build.sh · brand/release/release-v1.3.json'],
  ['First open', 'macOS refuses the first open because the app isn’t notarized. People try once, then System Settings ▸ Privacy & Security ▸ Open Anyway. After an ad hoc update the Keychain may ask again before Arcana can read the key.', [], 'Settings.swift:170-198 · release notes'],
  ['The agent reading', 'Regenerates agent/deck.json from Deck.swift, then deploys the Worker (needs wrangler login once). Never rename worker.js: its URL is in the launch post.', ['agent/deploy.sh'], 'agent/deploy.sh · Tools/deck/main.swift'],
  ['The demo', 'docs/ is served by GitHub Pages from main. docs/demo.mp4 is linked in the post: never move or rename it.', [], 'docs/demo.mp4'],
]
const sl = L.col([], { gap: 0, name: 'Steps' })
STEPS.forEach(([t, d, cmds, src], i) => {
  const r = L.row([
    L.row([L.text(String(i + 1), 'h1', { color: L.C.gold, w: 48 }), L.text(t, 'h2', { w: TW - 64 })], { gap: 16, align: 'CENTER', w: TW, name: 'Title' }),
    L.col([L.text(d, 'body', { w: BW2 }), ...cmds.map(c => cmd(c, BW2)), N.src(src, { w: BW2 })], { gap: 10, w: BW2, name: 'Body' }),
  ], { gap: 40, pad: [22, 0], align: 'MIN', name: 'Step · ' + t })
  r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = i === 0 ? 1 : 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; r.strokeAlign = 'INSIDE'
  L.add(sl, r)
})
L.add(br, sl)
L.add(br, L.text('The release recipe is the one used for 1.3 (Claude’s session notes, 28 September); the download’s hash and signature were checked then.', 'caption', { w: RW }))
sec.appendChild(br)

N.sortIn(sec, ORDER)
L.fit(sec)
await L.arrange('Experience & notes')
return await N.snap([cb, hf, br], 'engineering', PX, { scale: 0.3 })
