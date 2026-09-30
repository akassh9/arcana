// Chapter: Type, step 3 of 3 (parity with the app, the one system font).
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-lib.js design/figma/build/pages/type-3.js
// Run after type-1.js and type-2.js.
const L = S.lib, F = S.fa
const sec = await L.chapter('Type', { clear: false })
for (const n of [...sec.children]) if (/^Type · (Parity|The system font)/.test(n.name)) n.remove()
const PW = 2000

const par = L.board({ name: 'Type · Parity with the app', kicker: 'TYPE', title: 'Parity with the app', titleStyle: 'h1', w: PW, leadW: 1200,
  lead: 'Does a Figma text style set the same as SwiftUI? Each row puts the app’s own render (ImageRenderer, 2×, on pearl) beside the same words in the Figma style, then lays the Figma text in red over the render. Where the two agree the red hides the ink; any dark edge is a difference.' })
const RED = '#E0201B'
const ROWS = [
  { style: 'Display/Title', token: 'display/title', png: '01-display-title', px: [974, 316], tf: [40, 40, 407], align: 'LEFT', pad: 10, color: 'ink/text', glow: 'Glow/Title — ARCANA', sample: 'ARCANA' },
  { style: 'Display/Altar name', token: 'display/altar-name', png: '02-display-altar-name', px: [880, 240], tf: [40, 40, 360], align: 'LEFT', color: 'ink/text', glow: 'Glow/Altar name', sample: 'THE HIGH PRIESTESS' },
  { style: 'Verse/One', token: 'verse/one', png: '07-verse-one', px: [1000, 234], tf: [40, 40, 420], align: 'CENTER', color: 'ink/text-92', sample: 'Choose what you can stand inside.' },
  { style: 'Voice/Question', token: 'voice/question', png: '13-voice-question', px: [656, 208], tf: [40, 40, 248], align: 'CENTER', color: 'ink/text-62', sample: 'Hold the question in your mind.' },
  { style: 'Card/Essence', token: 'card/essence', png: '06-card-essence', px: [524, 192], tf: [40, 40, 182], align: 'CENTER', color: 'card/oxblood', sample: 'Water Under Starlight' },
  { style: 'Caps/Foot hold', token: 'caps/foot-hold', png: '30-caps-foot-hold', px: [608, 182], tf: [40, 40, 224], align: 'CENTER', color: 'gold/ink-60', sample: 'HOLD · RETURN THE CARDS' },
  { style: 'Caps/Whisper', token: 'caps/whisper', png: '35-caps-whisper', px: [354, 178], tf: [40, 40, 97], align: 'CENTER', color: 'ink/text-36', sample: 'ONE MOON AGO' },
]
const VERDICT = {
  'Display/Title': 'Matches within a fraction of a point when set left-aligned 10 pt in, as the app pads it. Centred in a Figma box it lands 10 pt right: half its 20 pt tracking.',
  'Display/Altar name': 'Identical: the red covers the ink on both lines, wrap included (left-aligned, so no centring shift).',
  'Verse/One': 'Same size, line and letterforms. Seen at 3×, the line sits about half a point right of and above the render: rounding in the centring.',
  'Voice/Question': 'The same at 1×; not checked closer.',
  'Card/Essence': 'The same at 1×, at 13 pt, which is what 12.5 in code draws.',
  'Caps/Foot hold': 'Size and tracking match letter for letter, but centred it sits 2 pt right: half its 4 pt tracking. Nudge centred caps left by half their tracking.',
  'Caps/Whisper': 'The same at 1×. Expect the same half-tracking shift (1.6 pt); too small to see here.',
}
const COLW = 500
const colHead = L.row(['Style', 'SwiftUI render (the app)', 'Figma text style', 'Figma in red over the render'].map((s, i) => L.text(s, 'kicker', { w: i ? COLW : 260 })), { gap: 32, name: 'Header row' })
L.add(par, colHead)
for (const d of ROWS) {
  const w = d.px[0] / 2, h = d.px[1] / 2
  const place = async (color, glow, fillOverride) => {
    const t = await F.styled(d.sample, d.style, color, { w: d.tf[2] - (d.pad || 0), align: d.align, effect: glow })
    if (fillOverride) t.fills = [fillOverride]
    return t
  }
  const cellFrame = async (name, withRender, text) => {
    const f = L.frame({ name, w, h, fill: '#F9F7F2', clip: true, stroke: L.C.stroke, r: 6 })
    if (withRender) { const im = await L.img('type-ink/type/' + d.png + '@2x.png', { w, name: 'Render · ' + d.png }); f.appendChild(im); im.x = 0; im.y = 0 }
    if (text) { f.appendChild(text); text.x = d.tf[0] + (d.pad || 0); text.y = d.tf[1] }
    return L.frame({ name: name + ' · cell', w: COLW, h, kids: [f] })
  }
  const a = await cellFrame('SwiftUI render · ' + d.style, true, null)
  const b = await cellFrame('Figma text · ' + d.style, false, await place(d.color, d.glow))
  const c = await cellFrame('Overlay · ' + d.style, true, await place(null, null, L.solid(RED, 0.8)))
  for (const cell of [a, b, c]) cell.children[0].x = 0
  const left = L.col([L.text(d.style, 'h3', { w: 260 }), F.mono(d.token + '  ·  type-ink/type/' + d.png + '@2x.png', { w: 260 }),
    L.text(VERDICT[d.style] || 'Not yet compared.', 'small', { w: 260 })], { gap: 6, w: 260, name: 'Verdict' })
  const r = L.row([left, a, b, c], { gap: 32, pad: [18, 0], name: 'Parity · ' + d.style, align: 'MIN' })
  r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; r.strokeAlign = 'INSIDE'
  L.add(par, r)
}
L.add(par, L.row([
  L.note({ w: 560, tags: ['measured'], title: 'How close it is', body: 'Close. Both use the same Didot.ttc, so letterforms, sizes, tracking and baselines agree. One systematic difference: SwiftUI centres a tracked line including the space after its last letter and Figma centres it without, so centred tracked text in Figma sits half its tracking to the right (ARCANA 10 pt, the 9 pt caps 2 pt). Untracked lines agree within about half a point. Glows are approximate.', source: 'type-ink/type/*.png vs the Arcana text styles' }),
  L.note({ w: 560, tags: ['measured'], title: 'Line boxes, one point apart', body: 'The styles use the line heights in the tokens. SwiftUI’s measured line box differs by 1 pt on six: Page title 26 (style 27), Verse/Three 28 (27), Settings/Label 18 (19), Voice/Question 24 (23), Spread/Sub 14 (15), Caps/Spread 13 (14; the Bold chosen state measures 14). It only matters for stacked lines.', source: 'type-ink/type/type-scale.json (line_box_pt)' }),
  L.note({ w: 560, tags: ['fixed'], title: 'Glows', body: 'SwiftUI’s shadow radius is not Figma’s blur. The glow effect styles use blur = 2 × radius, the closest match found; compare against the renders before trusting a new one.', source: 'RootView.swift:1038' }),
], { gap: 24, name: 'Parity notes', align: 'MIN' }))
L.add(sec, par)

// ---- the one system font -----------------------------------------------------------------------
const sys = L.board({ name: 'Type · The system font', kicker: 'TYPE', title: 'The one system font', titleStyle: 'h1', w: 1600, leadW: 1100,
  lead: 'Settings holds the only non-Didot type in the app’s own views: the key field is a system SecureField with a rounded border, so it is set in SF Pro at 13 pt with the system’s placeholder colour.' })
const win = await L.img('surfaces/settings/settings-window-empty@2x.png', { w: 402, name: 'Settings window · empty', shadow: true, r: 12 })
const field = await F.styled('sk-…', 'System/Field', null)
field.fills = [L.solid('#000000', 0.498)]
// The render and the Figma text in matching framed boxes, so the two read as a pair.
const fieldRender = await L.img('type-ink/type/36-system-field@2x.png', { w: 110, name: 'SwiftUI render · System/Field' })
fieldRender.strokes = [L.solid(L.C.stroke)]; fieldRender.strokeWeight = 1; fieldRender.strokeAlign = 'INSIDE'; fieldRender.cornerRadius = 6
const fieldFigma = L.frame({ name: 'Figma text · System/Field', dir: 'h', w: 110, h: Math.round(fieldRender.height), fill: '#F9F7F2', stroke: L.C.stroke, r: 6, kids: [field] })
fieldFigma.primaryAxisSizingMode = 'FIXED'; fieldFigma.counterAxisSizingMode = 'FIXED'; fieldFigma.resize(110, Math.round(fieldRender.height))
fieldFigma.primaryAxisAlignItems = 'CENTER'; fieldFigma.counterAxisAlignItems = 'CENTER'
L.add(sys, L.row([
  L.col([win, L.text('The app’s render of Settings (⌘ ,), 402 × 151 pt, empty.', 'caption', { w: 402 })], { gap: 10, name: 'Settings render' }),
  L.col([L.row([L.col([fieldRender, L.text('SwiftUI render', 'caption')], { gap: 6, name: 'Field render' }),
    L.col([fieldFigma, L.text('System/Field in Figma', 'caption')], { gap: 6, name: 'Field in Figma' })], { gap: 24, name: 'Field pair' }),
    L.specs([
      ['Style', 'System/Field · SF Pro Regular 13, line 16', 'Settings.swift:30-32'],
      ['Placeholder', 'sk-…  in the system placeholder colour (black at 49.8% as rendered)', 'type-ink/type/type-scale.json'],
      ['Field', 'SecureField, .roundedBorder, 250 pt wide', 'Settings.swift:30-32'],
      ['Label beside it', 'OpenAI key · Settings/Label (Didot 15)', 'Settings.swift:27-29'],
    ], { w: 620, keyW: 150 }),
  ], { gap: 20, name: 'System field' }),
  L.note({ w: 380, tags: ['open'], title: 'Keep it, or draw it?', body: 'A system field is the honest choice for a secret (it hides the text, supports paste and the Keychain) but it is the one control that doesn’t look drawn by the pen. Worth deciding on purpose.', source: 'Settings.swift:30-32' }),
], { gap: 48, name: 'System font row', align: 'MIN' }))
L.add(sec, sys)

L.fit(sec)
await L.arrange('Design system')
const shots = await L.snapChapter(sec, 'pages/type', { scale: 0.3 })
for (const nm of []) { const n = par.findOne(x => x.name === nm); if (n) shots.push(await L.snap(n, 'pages/type/zoom-' + nm.split('/')[1].replace(/\s+/g, '-').toLowerCase() + '.png', { scale: 3, wait: 100 })) }
return JSON.stringify(shots.map(s => s.path))
