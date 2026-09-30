// Chapter: Brand & icon, step 2 of 2 (the fallback icon, two dark marks, the wordmark, the README image).
//   node design/figma/bridge/run.mjs design/figma/build/pages/outside-lib.js design/figma/build/pages/brand-2.js
const L = S.lib, O = S.out
const CH = 'Brand & icon'
const sec = await L.chapter(CH, { clear: false })
for (const n of [...sec.children]) if (/· (The fallback icon|Two dark marks, one light room|The wordmark|The README image)$/.test(n.name)) n.remove()
const B = 'brand/'

// ---- The fallback icon ---------------------------------------------------------------------------------------
const bFb = O.board(CH, 'The fallback icon', { w: 2400, kicker: 'THE ICON',
  lead: 'If the build can’t read the logo PNG, it draws a different mark in code, with the same pen as the cards. It has never shipped. It is a second mark, and a dark one.',
  tags: [['fixed', 'Never shipped'], ['open']] })
const fbSvg = await L.svg(B + 'icon/fallback-icon.svg', { w: 640, name: 'Fallback icon (vector)' })
const fbComp = figma.createComponentFromNode(fbSvg); fbComp.name = 'Brand/Fallback icon (never shipped)'
fbComp.description = 'IconView from Tools/icon/main.swift, drawn by build.sh only if Assets/arcana-logo.png cannot be read. Never shipped. Vector import of design/figma/assets/brand/icon/fallback-icon.svg (the 10% overlay grain is left out).'
const fbFig = L.col([fbComp,
  L.text('Vector, 1144 × 1144 pt, shown at 56%', 'smallStrong', { w: 640 }),
  L.text('A component. The SVG matches the Swift render, gold bands in the same direction. Only the 10% overlay grain is left out, because it is a raster tile.', 'caption', { w: 640, alpha: 0.72 })], { gap: 8, name: 'Figure · Fallback icon' })
const fbSw = []
for (const [name, v, usage] of [
  ['Ground', 'icon/void', 'Palette.void. Used only here.'],
  ['Glow', 'icon/glow', 'Radial, r 40 → 560 on 1024.'],
  ['Rays and ring', 'card/paper', 'The cards’ paper cream.'],
  ['Diamond', 'card/oxblood', 'The cards’ oxblood.'],
  ['Pupil', 'card/ink', 'The cards’ ink.'],
]) fbSw.push(await O.swatch({ name, varName: v, usage, w: 230, h: 64 }))
const leaf = L.swatch({ hex: '#C9A333', name: 'Eye', value: 'Gold/Leaf', usage: 'The four-stop gold leaf.', w: 230, h: 64 })
await L.useFill(leaf.children[0], 'Gold/Leaf')
fbSw.push(leaf)
const fbSpecs = L.col([
  L.specs([
    ['When', 'Only if build.sh can’t read Assets/arcana-logo.png. It always can, so this has never been built into a release.', 'build.sh:44-63'],
    ['Drawn by', 'IconView, with CardArt.iconMarks(): the cards’ seeded pen (seed 31).', 'Tools/icon/main.swift:5-22; CardArt.swift:455-463'],
    ['Marks', 'A sun of 16 cream rays (width 7) through a wobbly cream ring (r 196, width 8.5); an oxblood diamond (r 226, width 5.5); the Magician’s gold-leaf eye (112 × 50) with an ink pupil.'],
    ['Ground', 'A near-black body 1024 pt square, continuous corners r 180, with a radial glow and a 10% overlay grain, padded 60 into a 1144 canvas.'],
    ['Grid', 'The body fills 89.5% of the canvas. Apple’s macOS grid is 824 of 1024 (80.5%).'],
    ['Sizes', 'Unlike the logo, this path writes a full iconset: 16 to 512 at 1× and 2×.', 'build.sh:51-59'],
    ['Stale files', 'build/icon.png and build/AppIcon.iconset (21 Sep, gitignored) are old fallback outputs that match nothing shipped.'],
  ], { w: 1500, keyW: 150 }),
  L.text('Colours', 'h3'),
  L.frame({ name: 'Swatches', dir: 'h', gap: 20, wrap: true, wrapGap: 20, w: 1500, kids: fbSw }),
], { gap: 20, w: 1500, name: 'Fallback · specs' })
L.add(bFb, L.row([fbFig, fbSpecs], { gap: 72, align: 'MIN', name: 'The fallback icon' }))
L.add(sec, bFb)

// ---- Two dark marks ------------------------------------------------------------------------------------------
const bTwo = O.board(CH, 'Two dark marks, one light room', { w: 2400, kicker: 'THE OPEN QUESTION',
  lead: 'The product has two marks that have never been reconciled, and both lean dark. The room they stand for is first light. This is the brand’s biggest open question.',
  tags: [['open', 'Open: the biggest brand question'], ['akash', 'Akash: light colours only']] })
const logoS = await O.fig(B + 'logo/arcana-logo-on-pearl.png', { w: 460, scale: 1, frame: true, r: 16, title: 'The mark that ships', caption: 'The logo, the app icon. Its near-black eclipse disc is #171617.' })
const fbPng = await O.fig(B + 'icon/fallback-icon.png', { w: 460, scale: 1, frame: true, r: 16, title: 'The mark that never ships', caption: 'The code-drawn fallback, on Palette.void #030409.' })
const room = await L.window('shots-window/1-invocation.png', { name: 'Window · The room at rest' })
room.rescale(0.62)
const roomFig = L.col([room, L.text('The room they stand for', 'smallStrong', { w: room.width }), L.text('The room at rest, at first light (a real-window render, shown at 62%).', 'caption', { w: room.width, alpha: 0.72 })], { gap: 8, name: 'Figure · The room' })
L.add(bTwo, L.row([logoS, fbPng, roomFig], { gap: 48, align: 'MIN', name: 'The two marks and the room' }))
L.add(bTwo, L.row([
  O.callout({ w: 1080, tags: [['open', 'Open question']], title: 'One mark, and a light one?',
    body: 'Akash asked for light colours only and rejected the dark first version of the app. Both marks come from before that turn. Nobody has yet decided whether there should be one mark or two, or whether the mark is redrawn in the room’s light or kept as a night object against a day room. Whatever is chosen will need a vector master, a tile on the macOS grid and hand-tuned small sizes (see the app icon above).' }),
  L.col([
    L.text('In the code, the icon’s ground is still named for the night:', 'small', { w: 1080 }),
    L.text('The app icon’s ground, from the night the mark was drawn in.', 'voice', { w: 1080 }),
    O.src('Palette.swift:37-38 (a code comment, not on screen)', { w: 1080 }),
    L.note({ w: 1080, tags: [['akash']], title: 'Akash, 24 Sep', body: 'On the dark “lapis night sky” version: they don’t like dark themes and prefer lighter colours in general, but the direction was right. The room became first light that day. (Paraphrased in the project notes, not a quote.)' }),
  ], { gap: 12, w: 1080, name: 'Evidence' }),
], { gap: 96, align: 'MIN', name: 'The question' }))
L.add(sec, bTwo)

// ---- The wordmark --------------------------------------------------------------------------------------------
const bW = O.board(CH, 'The wordmark', { w: 2400, kicker: 'THE WORDMARK',
  lead: 'Inside the app the brand is a word. ARCANA is set in Didot Bold with a faint gold glow, and every 12 seconds a slanted band of gold light passes across it, like a flame moving past gilt.',
  tags: [['shipped'], ['open', 'Didot: origin not recorded']] })
// the native specimen: the real text style, the ink variable and the glow effect style
const word = L.text('ARCANA', 'body', { name: 'ARCANA (Display/Title + Glow/Title)' })
await L.useText(word, 'Display/Title')
const inkV = await O.variable('ink/text')
if (inkV) word.fills = [figma.variables.setBoundVariableForPaint(L.solid('#26201C'), 'color', inkV)]
const glow = await L.styleByName('effect', 'Glow/Title — ARCANA')
if (glow) await word.setEffectStyleIdAsync(glow.id)
const spec = L.frame({ name: 'Specimen · ARCANA', dir: 'v', w: 720, h: 300, align: 'CENTER', justify: 'CENTER', pad: [0, 0, 0, 10], fill: '#F9F7F2', r: 16, stroke: L.C.stroke, kids: [word] })
const specFig = L.col([spec, L.text('Native, at 1:1', 'smallStrong', { w: 720 }),
  L.text('Live text with the file’s styles: text style Display/Title, fill ink/text, effect style Glow/Title — ARCANA, and the 10 pt leading pad. Didot ships with macOS; elsewhere Figma substitutes it.', 'caption', { w: 720, alpha: 0.72 })], { gap: 8, name: 'Figure · Native specimen' })
const block = await O.fig(B + 'wordmark/title-block-rest@2x.png', { scale: 2, frame: true, r: 12, title: 'In the room, at 1:1', caption: 'The render: the short gold rule, ARCANA with its glow, and the invitation, over the sky and the wheel’s fine lines.', source: 'Tools/shot/main.swift:85 (pose 1-invocation)' })
const svgW = await L.svg(B + 'wordmark/wordmark-arcana.svg', { name: 'ARCANA outlines' })
const wComp = figma.createComponentFromNode(svgW); wComp.name = 'Brand/Wordmark ARCANA (outlines)'
wComp.description = 'Six Didot Bold 62 pt glyph outlines in SwiftUI’s own text box (396.75 × 78 pt, widened 2 pt on the left for the first A’s serif). No glow, no light. For use where Didot is missing.'
const wCard = L.frame({ name: 'Mount · outlines', dir: 'v', w: 560, h: 190, align: 'CENTER', justify: 'CENTER', fill: '#FFFFFF', fillA: 0.7, r: 12, stroke: L.C.stroke, kids: [wComp] })
const wFig = L.col([wCard, L.text('Outlines, at 1:1', 'smallStrong', { w: 560 }),
  L.text('A component: six glyph paths in SwiftUI’s own text box. Checked against SwiftUI’s Text at 4×: mean difference 0.042/255 in alpha.', 'caption', { w: 560, alpha: 0.72 })], { gap: 8, name: 'Figure · Outlines' })
L.add(bW, L.row([specFig, block, wFig], { gap: 48, align: 'MIN', name: 'Specimens' }))
// the sweep
const frames = []
for (const [f, t, cap] of [['title-rest', 'At rest', 'Most of every 12 s: no band.'], ['title-light-k25', 't mod 12 = 0.80 s · k = .25', 'The band on the first A, R and C.'], ['title-light-k45', 't mod 12 = 1.44 s · k = .45', 'On the second A and the N.'], ['title-light-k65', 't mod 12 = 2.08 s · k = .65', 'Leaving on the last A.']])
  frames.push(await O.fig(B + `wordmark/${f}@2x.png`, { scale: 2, frame: true, r: 10, title: t, caption: cap }))
// a 12 s clock with the 3.3 s burst
const TW = 1904, clock = L.frame({ name: 'Diagram · 12 s clock', w: TW, h: 64 })
const bar = figma.createRectangle(); bar.resize(TW, 10); bar.cornerRadius = 5; bar.fills = [L.solid(L.C.rule)]; clock.appendChild(bar); bar.y = 8
const burst = figma.createRectangle(); burst.resize(TW * 3.3 / 12, 10); burst.cornerRadius = 5; burst.fills = [L.solid('#C9A82F', 0.9)]; clock.appendChild(burst); burst.y = 8
for (const [s, lab] of [[0, '0 s'], [0.8, '.80'], [1.44, '1.44'], [2.08, '2.08'], [3.3, '3.3 s: the clock sleeps'], [12, '12 s']]) {
  const x = TW * s / 12, tk = figma.createRectangle(); tk.resize(1, 18); tk.fills = [L.solid(L.C.ink, 0.5)]; clock.appendChild(tk); tk.x = Math.min(x, TW - 1); tk.y = 4
  const tl = L.text(lab, 'code', { size: 11, lh: 14 }); clock.appendChild(tl); tl.x = s === 12 ? TW - tl.width : x + 4; tl.y = 30
}
const sweep = L.col([L.text('The passing light', 'h2'), L.row(frames, { gap: 24, align: 'MIN', name: 'Sweep frames' }), clock,
  L.text('k runs 0 → 1 over 3.2 s, but the band moves two widths per unit of k, so light touches the word for only about 2.2 s (t ≈ 0.16–2.4 s) and its bright centre crosses in about 1.6 s. The clock ticks at 60 fps for 3.3 s of every 12, then sleeps. Spec the visible timing (Open questions & issues, Motion).', 'caption', { w: 1200 })], { gap: 20, name: 'The sweep' })
const wSpecs = L.specs([
  ['Type', 'Didot Bold 62 pt, tracking 20 after every letter (the last included). Text style Display/Title.', 'RootView.swift:1034'],
  ['Ink', 'Palette.text #26201C (ink/text).', 'RootView.swift:1036'],
  ['Glow', 'Palette.goldLit #ECCE6E at 55%, radius 22 (Figma blur 44). Effect style Glow/Title — ARCANA.', 'RootView.swift:1037'],
  ['Leading pad', '10 pt, an optical correction for the tracked final letter.', 'RootView.swift:1054'],
  ['The band', 'A linear gradient, clear → Palette.gold #C9A82F at 95% → clear, from (−0.5 + 2k, 0.1) to (−0.1 + 2k, 0.9), masked to the word. k = (t mod 12) / 3.2.', 'RootView.swift:1038-1052'],
  ['When', 'Bursts(period 12, length 3.3, fps 60). Paused under Reduce Motion, and while no one can see the room.', 'RootView.swift:1039'],
  ['Didot', 'Didot is a macOS system font. Figma on Windows or the web substitutes it, and using it in marketing off macOS may raise licensing questions. The film falls back to Bodoni 72.'],
], { w: 1904, keyW: 150 })
L.add(bW, sweep, wSpecs)
L.add(sec, bW)

// ---- The README image ----------------------------------------------------------------------------------------
const bR = O.board(CH, 'The README image', { w: 2400, kicker: 'THE README',
  lead: 'The repo’s public face on GitHub is a picture of the app itself: a Three Fates reading from the full deck, with the Star answered by stars in the day sky.',
  tags: [['akash', 'Akash chose the picture'], ['open', 'Open: shows a feature that needs a key']] })
const rd = await L.img(B + 'readme/docs-arcana.png', { scale: 1, r: 16, shadow: true, name: 'docs/arcana.png' })
const rdFig = L.col([rd, L.text('docs/arcana.png, 1260 × 860 at 1×, as it is on GitHub', 'smallStrong', { w: 1260 }),
  L.text('A stage-only render (no title bar), so it is shown without window chrome.', 'caption', { w: 1260, alpha: 0.72 })], { gap: 8, name: 'Figure · README image' })
const rdSide = L.col([
  L.text('The README’s words', 'h3'),
  L.text('A tarot reading room for macOS. Native SwiftUI, no dependencies — all seventy-eight cards are drawn by code and every sound is synthesised at launch.', 'body', { w: 780 }),
  O.src('README.md:3-4', { w: 780 }),
  L.text('Alt text', 'h3'),
  L.text('A Three Fates reading in Arcana: the written question set above the spread, the Six of Cups, the Star and the Six of Swords, and the reading spoken as verse', 'small', { w: 780 }),
  O.src('README.md:6', { w: 780 }),
  L.text('In the picture (the app’s own words)', 'h3'),
  L.text('Should I leave the city before winter', 'voice', { w: 780 }),
  L.text('The old street is smaller now.\nLess than you can, every day.\nRow for the calmer water.', 'voiceSmall', { w: 780 }),
  L.specs([
    ['Pose', 'Shot pose 00-readme, posed as the verse is spoken (before the chord, so no HOLD · RETURN).', 'Tools/shot/main.swift:257'],
    ['Chosen by', 'Akash asked for the full deck in the picture, and said shot-tool renders are fine for the README (no titled-window capture).'],
    ['Stale', 'Rendered 27 Sep (2283c75), before the 28 Sep changes. Re-render with ARCANA_SHOT_SCALE=2 for a 2× image.'],
    ['Needs a key', 'FIND THE THREAD shows only because the render had an OpenAI key. A downloaded app with no key never shows it.'],
  ], { w: 780, keyW: 120 }),
  L.chips([['akash'], ['open']]),
], { gap: 12, w: 780, name: 'README · words and notes' })
L.add(bR, L.row([rdFig, rdSide], { gap: 72, align: 'MIN', name: 'The README image' }))
L.add(sec, bR)

sec.findAll(n => n.type === 'TEXT' && n.fontName !== figma.mixed && n.fontName.family === 'JetBrains Mono').forEach(O.linkAll)
O.order(sec, CH, ['Header', 'The mark', 'The red matte', 'The app icon', 'The fallback icon', 'Two dark marks, one light room', 'The wordmark', 'The README image'])
L.fit(sec)
await L.arrange('Experience & notes')
return await O.snap(sec, 'brand-and-icon', 0.3, [bFb.name, bTwo.name, bW.name, bR.name])
