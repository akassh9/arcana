// Experience & notes · Keys & Settings (1 of 3) — header, the keys page, the old key, the words and their history.
// Run with the kit: node design/figma/bridge/run.mjs design/figma/build/pages/experience-b-kit.js design/figma/build/pages/keys-settings-1.js
const L = S.lib, K = S.eb
const CH = 'Keys & Settings', PX = CH + ' · '
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Header', 'The keys page', 'The old key', 'The words and their history', 'Settings', 'Window chrome', 'The menus', 'System surfaces'].map(n => PX + n)
K.clearMine(sec, ORDER, ORDER.slice(0, 4))
const CW = 2656, KS = 'surfaces/keys/', GK = 'glyphs/ui/keys/'

// ---------- header ----------------------------------------------------------------------------
const head = K.header(PX + 'Header', {
  title: 'Keys & Settings',
  lead: 'Two small surfaces sit around the room: the keys page, opened from an old key in the top-left corner, and the Settings window, where an OpenAI key lets the thread be found. Then the chrome, the menus, and the system panels a reader meets on the way in.',
  toc: ['The keys page', 'The old key: opening and closing', 'The words and their history', 'Settings', 'Window chrome', 'The menus', 'System surfaces nobody captured'],
  notes: [
    { tags: ['akash'], title: 'A page of the keys', body: 'Akash proposed a pop-up listing the controls, opened by a button like the sound bowl but top left: “go implement it fully… I trust your direction”.' },
    { tags: ['akash'], title: '“Too wordy”', body: 'The first page was “too wordy king, let’s keep it simple and easy to read… As minimal as possible.” It became six lines.' },
    { tags: ['claude'], title: 'The lines, the key, ⌘/', body: 'The line words, the old key turned 45°, the pen-drawn keycaps and ⌘/ are Claude’s choices. All open.' },
    { tags: ['akash'], title: 'Settings as a window', body: 'Akash chose a ⌘, window over a Terminal command, chose its text from a preview, and later added ‘⌘ , settings’ to the keys (1.3).' },
  ],
})
sec.appendChild(head)

// ---------- the keys page ----------------------------------------------------------------------
const page = L.board({ name: PX + 'The keys page', kicker: 'THE KEYS', title: 'The keys page', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'Seven lines over a pearl veil, while the table fades away. Click anywhere, or press esc, space, return or ?, and it goes. It is the only list of controls in the app; nothing else on screen explains a key.',
  tags: [['akash', 'Akash: a controls page'], ['claude', 'Claude: lines and keycaps'], 'shipped'] })
L.add(page, await K.annotated('62-keys.png', [
  { x: 62, y: 64, label: 'The old key, lit', body: 'Gold ink with a gold light while the page is open. Click it again to close.', source: 'Legend.swift:312-376' },
  { x: 520, y: 313, label: 'THE KEYS', body: 'A 46 × 1 gold hairline (gold ink 55 %), then 18 pt below it Didot Bold 21, tracking 8, ink, with a gold-light glow 45 %, r 14. The last letter’s tracking is balanced with 8 pt of leading padding.', source: 'Legend.swift:103-114' },
  { x: 548, y: 376, label: 'The keys column', body: '150 pt wide, right-aligned, 5 pt between caps. Seven lines 22 pt tall, 15 pt apart, starting 38 pt under the title.', source: 'Legend.swift:117-146' },
  { x: 705, y: 376, label: 'What they do', body: 'A 22 pt gap, then a 150 pt column: Didot Italic 17, ink 82 %, lower case as written.', source: 'Legend.swift:135-137' },
  { x: 565, y: 413, label: 'A word, not a key', body: '‘TYPE’ has no keycap: Caps 9, tracking 2.6, ink 66 %.', source: 'Legend.swift:125-126' },
  { x: 607, y: 626, label: 'The drawn comma', body: 'Added in 1.3. A filled drop of ink with a short tail; a Didot comma vanished and a hollow ring read as a 9.', tags: [['lesson', 'Lesson: the comma']], source: 'Legend.swift:254-310' },
  { x: 630, y: 720, label: 'The veil', body: 'Radial pearl 80 % → 60 % → 32 % (at 0, 0.5, 1), reaching 0.72 × the stage’s longer side. The whole page is 322 pt wide, centred.', tags: [['claude', 'Claude: table fades, veil covers']], source: 'Legend.swift:60-100' },
  { x: 1082, y: 166, label: 'The room steps aside', body: 'The table (and a kept page) fades out, the hold ring goes out, and the moon takes no press. Only m (sound) still works.', source: 'Game.swift:601-617; RootView.swift:140-143, 233-246' },
], { title: 'The keys page', w: 1900, legendW: 600, caption: 'shots-window/62-keys · the default 1260 × 860 window.' }))

const lines = [
  ['keys-row-1-left-right-choose', '← →', 'choose', 'left arrow right arrow: choose'],
  ['keys-row-2-type-your-question', 'TYPE', 'your question', 'type: your question'],
  ['keys-row-3-space-hold', 'SPACE', 'hold', 'space: hold'],
  ['keys-row-4-up-past-readings', '↑', 'past readings', 'up arrow: past readings'],
  ['keys-row-5-command-delete-forget-a-reading', '⌘ ⌫', 'forget a reading', 'command delete: forget a reading'],
  ['keys-row-6-esc-back', 'ESC', 'back', 'esc: back'],
  ['keys-row-7-command-comma-settings', '⌘ ,', 'settings', 'command comma: settings'],
]
const rows = []
for (const [f, k, d, vo] of lines) rows.push([await L.img(KS + f + '@3x.png', { w: 537, scale: 3, name: 'Line · ' + d }), L.text(k, 'codeStrong', { w: 90 }), L.text(d, 'voiceSmall', { w: 190 }), L.text('“' + vo + '”', 'small', { w: 330 })])
const tbl = L.table([{ label: 'Line (render, 1.5×)', w: 537 }, { label: 'Keys', w: 90 }, { label: 'Words', w: 190 }, { label: 'VoiceOver says', w: 330 }], rows, { name: 'The seven lines' })
const signs = []
for (const [n, t] of [['left', '←'], ['right', '→'], ['up', '↑'], ['command', '⌘'], ['delete', '⌫'], ['comma', ',']]) {
  const g = await L.svg(GK + 'key-sign-' + n + '.svg', { w: 60 })
  signs.push(L.col([L.frame({ name: 'Sign · ' + n, dir: 'h', w: 96, h: 96, r: 12, fill: '#FFFFFF', fillA: 0.7, stroke: L.C.stroke, align: 'CENTER', justify: 'CENTER', kids: [g] }), L.text(t + '  ' + n, 'caption', { w: 96, align: 'CENTER' })], { gap: 6, align: 'CENTER', name: 'Sign ' + n }))
}
L.add(page, L.row([
  L.col([L.text('The seven lines', 'h3'), tbl, L.source('Legend.swift:43-51 (LegendLine.all), 22-33 and 53 (spoken), 141-142 (the label) · surfaces/keys/keys-row-*@3x', { w: 1250 })], { gap: 12, name: 'Lines block' }),
  L.col([
    L.text('Keycaps and signs, drawn by the pen', 'h3'),
    L.row(signs, { gap: 16, name: 'Signs' }),
    L.specs([
      ['Keycap', 'A rounded square the pen has not quite made true: each side bowed a hair, each corner turned round. At least 22 × 22 pt, outlined 0.85 pt in ink 40 %. Seeded, so it is the same every time.', 'Legend.swift:169-234 (KeyCap, CapShape)'],
      ['Sign', '10 × 10 pt, stroked 0.95 pt, ink 74 %, centred in its cap.', 'Legend.swift:254-310 (KeySigns)'],
      ['Named keys', '‘SPACE’ and ‘ESC’ in Caps 9, tracking 1.6, ink 74 %, 7 pt side padding.', 'Legend.swift:176-192'],
      ['States', 'None. The caps are pictures: no hover, no press.', 'Legend.swift:169-196'],
      ['Arriving', 'Title, then each line: 0.45 s easeOut out of a little blur, 0.16 s + 0.05 s × its place after the page opens.', 'Legend.swift:156-165'],
    ], { w: 1250, keyW: 130 }),
    L.note({ w: 1250, tags: ['claude'], title: 'Drawn, not typeset', body: 'Claude drew the keys with the same seeded pen as the cards, so they belong to the room rather than to macOS.' }),
  ], { gap: 16, name: 'Caps block' }),
], { gap: 100, align: 'MIN', name: 'Lines and caps' }))
sec.appendChild(page)

// ---------- the old key --------------------------------------------------------------------------
const key = L.board({ name: PX + 'The old key', kicker: 'THE KEYS', title: 'The old key: opening and closing', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'An old key turned 45° as in a lock, 18 pt in from the top-left corner of the stage, as the singing bowl is from the top right. It is the page’s only way in by pointer; ? and ⌘/ open it from the keyboard.',
  tags: [['claude', 'Claude: the old key turned 45°'], ['lesson', 'Lesson: a keycap read as UI chrome']] })
const gl = async (p, title, caption, w) => { const g = p.endsWith('.svg') ? await L.svg(p, { w: w || 104 }) : await L.img(p, { w: w || 108, scale: 3 }); return L.col([L.frame({ name: 'Glyph · ' + title, dir: 'h', w: 180, h: 180, r: 14, fill: '#FFFFFF', fillA: 0.7, stroke: L.C.stroke, align: 'CENTER', justify: 'CENTER', kids: [g] }), L.text(title, 'smallStrong', { w: 180 }), L.text(caption, 'caption', { w: 180 })], { gap: 8, name: 'Key · ' + title }) }
L.add(key, L.row([
  await gl('glyphs/ui/key-glyph-rest.svg', 'At rest', 'Text ink 50 %. 26 × 26 pt.'),
  await gl('glyphs/ui/key-glyph-lit.svg', 'Lit (page open)', 'Gold ink with a gold light.'),
  await gl('glyphs/ui/key-glyph-lit-app@3x.png', 'Lit, as the app draws it', 'The app’s own render, glow included.', 108),
  await K.stage('surfaces/window/window-default-corner-lights-and-key@2x.png', 600, 'In its corner', 'The top-left 300 × 90 pt of the default window: the lights over the sky, the key under them.', { shadow: false }),
  L.specs([
    ['Opens with', 'A click on the key. ? anywhere except while a question is being written before the ask (there it is a letter). ⌘/ (Help ▸ The Keys) at any moment.', 'Legend.swift:312-333; RootView.swift:225, 265, 284; ArcanaApp.swift:18-22'],
    ['As it opens', 'Any breath being held is let go and a word being composed is laid first.', 'Game.swift:601-617'],
    ['While open', 'esc, space, return or ? close it; m still mutes; every other key is swallowed. A click anywhere closes it.', 'RootView.swift:233-246; Legend.swift:150'],
    ['Cursor', 'The arrow. The key is a plain button with no hover look.', 'Legend.swift:312-333'],
    ['VoiceOver', '“The keys”, a toggle, value Open or Closed.', 'Legend.swift:323-326'],
  ], { w: 1250, keyW: 130 }),
], { gap: 36, align: 'MIN', name: 'The key' }))
const openK = K.timeline([
  { label: 'The table fades out', from: 0, to: 0.25 },
  { label: 'The hold ring goes out', from: 0, to: 0.25 },
  { label: 'The veil and page fade in', from: 0, to: 0.35 },
  { label: 'THE KEYS arrives', from: 0.16, to: 0.61 },
  { label: 'Line 1 arrives', from: 0.21, to: 0.66 },
  { label: 'Line 7 arrives', from: 0.51, to: 0.96 },
  { label: 'The key turns gold', from: 0, to: 0.35, soft: true, value: 'with the page' },
], { w: 1290, t: 1.2, step: 0.2, labelW: 300, name: 'Timeline · keys open' })
const closeK = K.timeline([
  { label: 'The page fades', from: 0, to: 0.25 },
  { label: 'The table returns', from: 0.2, to: 0.7, value: '0.5 s after 0.2 s' },
  { label: 'The hold ring returns', from: 0.2, to: 0.7 },
], { w: 1290, t: 1.2, step: 0.2, labelW: 300, name: 'Timeline · keys close' })
L.add(key, L.row([
  L.col([L.text('Opening', 'h3'), openK, L.source('RootView.swift:140-143; Legend.swift:60-165; Chamber.swift:462-466', { w: 1290 })], { gap: 12, name: 'Opening block' }),
  L.col([L.text('Closing', 'h3'), closeK, L.text('With Reduce Motion the ring goes off at once and the lines are simply there.', 'small', { w: 1290 }), L.source('RootView.swift:140-143; Chamber.swift:462-466', { w: 1290 })], { gap: 12, name: 'Closing block' }),
], { gap: 76, align: 'MIN', name: 'Keys timelines' }))
const kw = Math.floor((CW - 40) / 2)
L.add(key, L.row([
  await K.win('surfaces/window/window-default-keys-open-1260x860@2x.png', kw, 'Open over the room at rest', 'surfaces/window/window-default-keys-open · 1260 × 860.'),
  await K.win('surfaces/window/window-minimum-keys-open-940x660@2x.png', Math.round(kw * 940 / 1260), 'Open in the smallest window', 'surfaces/window/window-minimum-keys-open · 940 × 660: all seven lines still fit.'),
], { gap: 40, align: 'MIN', name: 'Keys in two windows' }))
L.add(key, L.row([
  L.note({ w: 860, tags: ['claude', 'lesson'], title: 'An old key, not a keycap', body: 'The first glyph was a keycap. Over the sky it read as UI chrome, so it became an old key turned 45° as in a lock, bow low and bit high.' }),
  L.note({ w: 860, tags: ['claude'], title: '⌘/ rather than ⌘?', body: 'Help ▸ The Keys replaces SwiftUI’s ‘Arcana Help’. ⇧⌘/ (⌘?) is macOS’s own shortcut for searching the Help menu, so Claude took ⌘/.' }),
  L.note({ w: 860, tags: ['open'], title: 'No hover, no focus', body: 'Like the bowl, the key is a plain button: no hover look, the arrow cursor, no focus ring. See Edge cases & accessibility.' }),
], { gap: 38, align: 'MIN', name: 'Key notes' }))
sec.appendChild(key)

// ---------- the words and their history ------------------------------------------------------------
const hist = L.board({ name: PX + 'The words and their history', kicker: 'THE KEYS', title: 'The words and their history', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'The page went from fifteen entries to six lines in one afternoon, then gained a seventh when Akash couldn’t find Settings. Each version’s words are below, verbatim where they survive.' })
const vcol = (kicker, title, kids, tags) => L.col([L.text(kicker, 'kicker'), L.text(title, 'h2', { w: 820 }), tags ? L.chips(tags) : null, ...kids], { gap: 14, w: 840, name: 'Version · ' + title })
const lineList = arr => L.col(arr.map(([k, d]) => L.row([L.text(k, 'codeStrong', { w: 110, align: 'RIGHT', alpha: 0.7 }), L.text(d, 'voice', { alpha: 0.86 })], { gap: 22, align: 'CENTER', name: 'Line · ' + d })), { gap: 8, pad: [24, 28], w: 840, r: 14, fill: '#FFFFFF', fillA: 0.7, stroke: L.C.stroke, name: 'Lines' })
const six = [['← →', 'choose'], ['TYPE', 'your question'], ['SPACE', 'hold'], ['↑', 'past readings'], ['⌘ ⌫', 'forget a reading'], ['ESC', 'back']]
L.add(hist, L.row([
  vcol('27 SEP · NEVER COMMITTED', 'Fifteen entries', [
    K.missing(840, 330, 'The first keys page', 'Four columns, fifteen entries with italic sentences, a subtitle and a footer. It was never committed, so no render or code survives.'),
    L.text('“too wordy king, let’s keep it simple and easy to read… As minimal as possible.”', 'voice', { w: 840 }),
    L.text('Akash, 27 Sep. The rule now covers every word on screen.', 'caption', { w: 840 }),
  ], [['akash', 'Akash: too wordy'], 'rejected']),
  vcol('27 SEP · 2283c75 · 1.0 – 1.2', 'Six lines', [lineList(six),
    L.text('One to three words a line. The six lines and their wording are Claude’s.', 'small', { w: 840 }),
  ], [['claude', 'Claude: the lines and words']]),
  vcol('28 SEP · a778f81 · 1.3', 'Seven lines', [lineList([...six, ['⌘ ,', 'settings']]),
    L.text('Akash couldn’t find Settings, so ‘⌘ , settings’ was added. Claude placed it last, after ‘back’, and drew the comma.', 'small', { w: 840 }),
  ], [['akash', 'Akash: ⌘ , settings'], ['claude', 'Claude: placed last'], 'shipped']),
], { gap: 68, align: 'MIN', name: 'Versions' }))
L.add(hist, L.source('Legend.swift:43-51 · git log -- Sources/Arcana/Legend.swift (2283c75 “The keys: the room’s few, from an old key in the corner”; a778f81 “The keys: ⌘, for Settings”)', { w: CW }))
sec.appendChild(hist)

await K.finish(sec, ORDER)
return await K.snap([head, page, key, hist], 'keys-settings', PX)
