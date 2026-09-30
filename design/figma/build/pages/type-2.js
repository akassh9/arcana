// Chapter: Type, step 2 of 3 (the caps system and its 14 styles).
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-lib.js design/figma/build/pages/type-2.js
// Run after type-1.js; then type-3.js.
const L = S.lib, F = S.fa
const sec = await L.chapter('Type', { clear: false })
for (const n of [...sec.children]) if (/^Type · (Caps|Parity)/.test(n.name)) n.remove()
const W = 1600, CW = 1456

const caps = L.board({ name: 'Type · Caps', kicker: 'TYPE', title: 'Caps: every label', titleStyle: 'h1', w: W, leadW: 1100,
  lead: 'Every label in the app is one component, Caps: the string is written lowercase in the source (“press and hold”) and uppercased when drawn, in Didot Regular, small and widely tracked. Only the chosen spread’s name is Bold.',
  tags: [['akash', 'Akash: words as few as possible']] })

// size × tracking scatter: shows how the 14 variants spread
const V = [
  ['caps/spread', 11, 3], ['caps/altar-label', 10, 4.2], ['caps/prompt', 10, 4], ['caps/altar-numeral', 10, 3], ['caps/thread-action', 10, 3.8],
  ['caps/thread-status', 10, 3.2], ['caps/altar-keys', 10, 2.6], ['caps/foot-press', 9, 4.2], ['caps/foot-hold', 9, 4], ['caps/slot', 9, 3.2],
  ['caps/keys-word', 9, 2.6], ['caps/keycap', 9, 1.6], ['caps/moon', 8, 3.6], ['caps/whisper', 7, 3.2],
]
const PW = 760, PH = 360, X0 = 70, Y0 = 34, XW = 640, YH = 270
const px = t => X0 + (t - 1.4) / (4.4 - 1.4) * XW, py = s => Y0 + (11.5 - s) / (11.5 - 6.5) * YH
const plot = L.frame({ name: 'Caps variants · size × tracking', w: PW, h: PH, fill: '#FFFFFF', fillA: 0.6, stroke: L.C.stroke, r: 14 })
for (const s of [7, 8, 9, 10, 11]) {
  const g = figma.createRectangle(); g.name = 'Grid ' + s; g.resize(XW, 1); g.fills = [L.solid(L.C.rule)]; plot.appendChild(g); g.x = X0; g.y = py(s)
  const t = L.text(s + ' pt', 'code', { size: 10, lh: 12 }); plot.appendChild(t); t.x = 20; t.y = py(s) - 6
}
for (const tr of [1.6, 2.6, 3.2, 4.2]) { const t = L.text(String(tr), 'code', { size: 10, lh: 12 }); plot.appendChild(t); t.x = px(tr) - 8; t.y = Y0 + YH + 18 }
{ const t = L.text('tracking (pt) →', 'caption', { size: 10, lh: 12 }); plot.appendChild(t); t.x = X0 + XW - 80; t.y = PH - 22 }
const bySize = {}
for (const v of V) (bySize[v[1]] = bySize[v[1]] || []).push(v)
for (const list of Object.values(bySize)) list.sort((a, b) => a[2] - b[2]).forEach(([n, s, tr], i) => {
  const d = figma.createEllipse(); d.name = n; d.resize(10, 10); d.fills = [F.paint('gold/ink')]; plot.appendChild(d); d.x = px(tr) - 5; d.y = py(s) - 5
  const t = L.text(n.replace('caps/', ''), 'code', { size: 10, lh: 12, alpha: 0.75 }); plot.appendChild(t)
  t.x = px(tr) - t.width / 2; t.y = i % 2 ? py(s) + 8 : py(s) - 20
})
{ const d = figma.createEllipse(); d.name = 'Declared default (unused)'; d.resize(10, 10); d.fills = []; d.strokes = [L.solid(L.C.blood)]; d.strokeWeight = 1.5; d.dashPattern = [2, 2]; plot.appendChild(d); d.x = px(3.4) - 5; d.y = py(10) - 5
  // Its label is a key in the top right, so it never crowds the labels round it.
  const t = L.text('declared default, unused', 'code', { size: 10, lh: 12, color: L.C.blood, alpha: 1 }); plot.appendChild(t); t.x = X0 + XW - t.width; t.y = 12
  const k = figma.createEllipse(); k.name = 'Key · declared default'; k.resize(10, 10); k.fills = []; k.strokes = [L.solid(L.C.blood)]; k.strokeWeight = 1.5; k.dashPattern = [2, 2]; plot.appendChild(k); k.x = t.x - 16; k.y = 13 }
L.add(caps, L.row([
  L.col([plot, L.text('The fourteen label styles by size and tracking. Code sizes 8.5 and 9.5 are plotted where they draw (9 and 10).', 'caption', { w: PW })], { gap: 8, name: 'Caps scatter' }),
  L.col([
    L.note({ w: 648, tags: ['open'], title: 'Fourteen variants, no single label style', body: 'Caps declares defaults (10 pt, tracking 3.4, ink at 50%) that no call site uses: all 19 override them. The result is 14 distinct label styles, 7–11 pt with tracking from 1.6 to 4.2, and the step between two of them is often too small to see. A designer may want to collapse them to three or four.', source: 'Palette.swift:87-100' }),
    L.note({ w: 648, tags: ['fixed'], title: 'How Caps is set', body: 'Text(text.uppercased()) in Didot or Didot-Bold, .tracking(t), one colour. SwiftUI’s line box is about 1.24 × the drawn size. Tracking follows the last letter too, so a centred label sits a hair left of centre unless padded.', source: 'Palette.swift:87-100' }),
  ], { gap: 16, name: 'Caps notes' }),
], { gap: 48, name: 'Caps overview', align: 'MIN' }))

L.add(caps, L.row(['Style', 'Specimen · 1× and 2×', 'Size · line · tracking, colour, use'].map((s, i) => L.text(s, 'kicker', { w: F.TYPE_COLS[i] })), { gap: 32, name: 'Header row' }))

// composite specimens (a style plus shapes), built at scale k
const numeral = async k => {
  const a = await F.styled('XVII', 'Caps/Altar numeral', 'ink/text-42'); const b = await F.styled('· REVERSED', 'Caps/Altar numeral', 'card/oxblood')
  if (k > 1) for (const t of [a, b]) { t.fontSize = 10 * k; t.letterSpacing = { value: 3 * k, unit: 'PIXELS' }; t.lineHeight = { value: 12 * k, unit: 'PIXELS' } }
  return L.row([a, b], { gap: 10 * k, align: 'CENTER', name: 'Altar numeral · reversed' + (k > 1 ? ' · 2× preview (size override)' : '') })
}
const keywords = async k => {
  const kids = []
  for (const [i, w] of ['HOPE', 'REPAIR', 'CLEAR SKY'].entries()) {
    if (i) { const d = figma.createRectangle(); d.name = 'Keyword diamond · gold/ink-55'; d.resize(4 * k, 4 * k); d.fills = [F.paint('gold/ink-55')]; d.rotation = 45; kids.push(L.frame({ name: 'Diamond', w: 6 * k, h: 6 * k, kids: [] })); kids[kids.length - 1].appendChild(d); d.x = 3 * k; d.y = 0.2 * k }
    const t = await F.styled(w, 'Caps/Altar keys', 'ink/text-50')
    if (k > 1) { t.fontSize = 10 * k; t.letterSpacing = { value: 2.6 * k, unit: 'PIXELS' }; t.lineHeight = { value: 12 * k, unit: 'PIXELS' } }
    kids.push(t)
  }
  return L.row(kids, { gap: 10 * k, align: 'CENTER', name: 'Altar keywords' + (k > 1 ? ' · 2× preview (size override)' : '') })
}
const pair = async (fn) => L.col([await fn(1), L.col([await fn(2), L.text('2× for reading · not a style', 'caption', { size: 10, lh: 14 })], { gap: 4, name: '2× preview' })], { gap: 14, name: 'Specimen pair' })

const R = [
  { style: 'Caps/Spread', token: 'caps/spread', sample: 'ONE CARD', color: 'ink/text-48', drawn: 11, lh: 14, tr: 3, pct: 27.3, colorLabel: 'ink/text when chosen (and Didot Bold) · ink/text-48 otherwise', use: 'Spread names in the chooser, 150 × 15, shrinks to 82%. The Bold chosen state has no style of its own.', source: 'RootView.swift:1107-1112', tags: [['open', 'Bold state unstyled']] },
  { style: 'Caps/Altar label', token: 'caps/altar-label', sample: 'WHAT IS', color: 'gold/ink', drawn: 10, lh: 12, tr: 4.2, pct: 42, use: 'The position’s name on the altar.', source: 'RootView.swift:1462' },
  { style: 'Caps/Prompt', token: 'caps/prompt', sample: 'DRAW THREE', color: 'ink/text-52', drawn: 10, lh: 12, tr: 4, pct: 40, use: 'DRAW ONE CARD, DRAW THREE, DRAW FIVE, under the 6 × 6 pips.', source: 'RootView.swift:1161-1172' },
  { style: 'Caps/Altar numeral', token: 'caps/altar-numeral', sample: 'XVII', kidsFn: numeral, color: 'ink/text-42', drawn: 10, lh: 12, tr: 3, pct: 30, colorLabel: 'ink/text-42 (numeral) · card/oxblood (· REVERSED), 10 pt apart', use: 'The altar’s numeral, and the reversed mark beside it (REVERSED alone on court cards).', source: 'RootView.swift:1472-1482' },
  { style: 'Caps/Thread action', token: 'caps/thread-action', sample: 'FIND THE THREAD', color: 'gold/ink', code: 9.5, drawn: 10, lh: 12, tr: 3.8, pct: 38, use: 'The thread button, beside the 8 pt thread glyph; 200 × 30.', source: 'RootView.swift:1296-1302' },
  { style: 'Caps/Thread status', token: 'caps/thread-status', sample: 'LETTING THE CARDS SETTLE', color: 'ink/text-52', code: 9.5, drawn: 10, lh: 12, tr: 3.2, pct: 32, use: 'LETTING THE CARDS SETTLE, THE THREAD STAYED QUIET.', source: 'RootView.swift:1311-1321' },
  { style: 'Caps/Altar keys', token: 'caps/altar-keys', sample: 'HOPE', kidsFn: keywords, color: 'ink/text-50', code: 9.5, drawn: 10, lh: 12, tr: 2.6, pct: 26, colorLabel: 'ink/text-50 · diamonds 4 × 4 gold/ink-55, 10 pt apart', use: 'The card’s keywords on the altar, parted by small diamonds (shapes, not glyphs).', source: 'RootView.swift:1500-1511' },
  { style: 'Caps/Foot press', token: 'caps/foot-press', sample: 'PRESS AND HOLD', color: 'gold/ink-75', drawn: 9, lh: 11, tr: 4.2, pct: 46.7, colorLabel: 'gold/ink-75 × (1 − charge): it fades as you hold', use: 'Under the deck in the opening room.', source: 'RootView.swift:448-450' },
  { style: 'Caps/Foot hold', token: 'caps/foot-hold', sample: 'HOLD · RETURN THE CARDS', color: 'gold/ink-60', code: 8.5, drawn: 9, lh: 11, tr: 4, pct: 44.4, use: 'HOLD · RETURN THE CARD(S) after the reading; HOLD · REMEMBER at the moon’s door. 32 pt above the window’s foot.', source: 'RootView.swift:1179-1181; Keeping.swift:897' },
  { style: 'Caps/Slot', token: 'caps/slot', sample: 'WHAT WAS', color: 'gold/ink-80', drawn: 9, lh: 11, tr: 3.2, pct: 35.6, colorLabel: 'ink/text-32 → gold/ink-80 face up → gold/ink while read (0.45 s)', use: 'Position names under the thread.', source: 'RootView.swift:674-680; Keeping.swift:806-808' },
  { style: 'Caps/Keys word', token: 'caps/keys-word', sample: 'TYPE', color: 'ink/text-66', drawn: 9, lh: 11, tr: 2.6, pct: 28.9, use: 'The keys page’s word for typing; +2.6 pt leading pad.', source: 'Legend.swift:125-126' },
  { style: 'Caps/Keycap', token: 'caps/keycap', sample: 'SPACE', color: 'ink/text-74', drawn: 9, lh: 11, tr: 1.6, pct: 17.8, use: 'SPACE and ESC inside pen-drawn keycaps (outline 0.85 pt ink/text-40).', source: 'Legend.swift:176-192' },
  { style: 'Caps/Moon', token: 'caps/moon', sample: 'WANING GIBBOUS', color: 'ink/text-40', drawn: 8, lh: 10, tr: 3.6, pct: 45, colorLabel: 'ink/text-40 (phase) · ink/text-55 (kept date)', use: 'The moon’s phase, or a kept reading’s date, 36 pt below the moon’s centre.', source: 'RootView.swift:737-740; Keeping.swift:1036' },
  { style: 'Caps/Whisper', token: 'caps/whisper', sample: 'ONE MOON AGO', color: 'ink/text-36', drawn: 7, lh: 9, tr: 3.2, pct: 45.7, use: 'The smallest type in the app, over a returned question.', source: 'Keeping.swift:1062' },
]
for (const d of R) {
  if (d.kidsFn) { d.kids = await pair(d.kidsFn); L.add(caps, await F.specRow(d)) }
  else L.add(caps, await F.specRow(Object.assign({ caps: true }, d)))
}
L.add(sec, caps)

L.fit(sec)
await L.arrange('Design system')
return JSON.stringify(await L.snapChapter(sec, 'pages/type', { scale: 0.3 }))
