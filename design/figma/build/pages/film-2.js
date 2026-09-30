// Chapter: Launch film & demo, step 2 of 3 (the riso palette, choices and lessons).
//   node design/figma/bridge/run.mjs design/figma/build/pages/outside-lib.js design/figma/build/pages/film-2.js
const L = S.lib, O = S.out
const CH = 'Launch film & demo'
const sec = await L.chapter(CH, { clear: false })
for (const n of [...sec.children]) if (/· (The riso palette|Choices and lessons)$/.test(n.name)) n.remove()
const F = 'brand/film/'
const SRC = 'film/arcana.html:29-51, 284-295; film/core.js:209-222'

// ---- The riso palette ---------------------------------------------------------------------------------------
const bP = O.board(CH, 'The riso palette', { w: 2400, kicker: 'THE LAUNCH FILM',
  lead: 'The places are printed the way a risograph prints: four inks, one plate each, a halftone screen and a little misregistration. Each ink prints one band of the app’s first-light sky, so together they give the room’s colours.',
  tags: [['akash', 'Akash: keep the “dither like effect”'], ['claude', 'Claude chose the riso look']] })
const INKS = [
  ['Cornflower', '#6F97E0', 'the blue overhead', '14.9°', '0, 0', 'sky/blue'],
  ['Lavender', '#9F8BE0', 'the lilac in the air', '75.1°', '2.2, −1.4', 'sky/lilac'],
  ['Rose', '#EF9690', 'rising from below the horizon', '45.3°', '−1.6, 1.8', 'sky/rose'],
  ['Apricot', '#F4B454', 'the dawn', '0.0°', '1.2, 2.4', 'sky/dawn'],
]
const inkCols = []
for (const [i, [name, hex, what, ang, mis, v]] of INKS.entries()) {
  const ink = L.swatch({ name: `${i + 1}  ${name}`, hex, value: hex, usage: `Prints ${what}. Screen ${ang}, off register by ${mis} px.`, w: 300, h: 150 })
  const app = await O.swatch({ name: 'The app’s colour', varName: v, hex: '#FFFFFF', w: 300, h: 44 })
  inkCols.push(L.col([ink, app], { gap: 16, name: 'Plate · ' + name }))
}
const halftone = L.frame({ name: 'Crop · halftone at 300%', w: 640, h: 640, r: 12, clip: true, stroke: L.C.stroke })
const big = await L.img(F + 'frames/film-0010-01-window.png', { w: 3240, name: 'film-0010 at 300%' })
halftone.appendChild(big); big.x = -1060; big.y = -470
const htFig = L.col([halftone, L.text('The window (frame 10) at 300%', 'smallStrong', { w: 640 }), L.text('The screen dots of the plates, laid in multiply on the paper grain.', 'caption', { w: 640, alpha: 0.72 })], { gap: 8, name: 'Figure · halftone' })
L.add(bP, L.row([
  L.col([L.text('Four inks, printed in this order', 'h2'), L.row(inkCols, { gap: 24, align: 'MIN', name: 'The plates' }),
    L.text('The inks are brighter than the app’s colours: at low coverage over the stock, each prints close to its band of the sky.', 'caption', { w: 1272 })], { gap: 16, name: 'Inks' }),
  htFig,
], { gap: 72, align: 'MIN', name: 'Inks and halftone' }))
// the stocks and the gold
const stock = []
for (const [name, hex, v, usage] of [
  ['Riso paper', '#F6F1E7', null, 'The places’ stock. Warmer than the app’s pearl #F9F7F2.'],
  ['Riso ink', '#2A2230', null, 'Line work on the places.'],
  ['Night', '#3B3357', null, 'The deepest shade on the places.'],
  ['Card stock', '#F3EDE0', 'card/paper', 'The deck’s cotton stock, as in the app.'],
  ['Card ink', '#15110E', 'card/ink', 'The pen’s ink, as in the app.'],
  ['Gold', '#C9A82F', 'gold/metal', 'Flat, hatched with gold lit and deep.'],
  ['Gold lit', '#ECCE6E', 'gold/light', 'Hatching at 55%, angle 0.8.'],
  ['Gold deep', '#8A6819', 'gold/deep', 'Hatching at 35%, angle −0.75.'],
  ['Oxblood', '#8C2E25', 'card/oxblood', 'The cards’ essences.'],
]) stock.push(v ? await O.swatch({ name, varName: v, hex, usage, w: 222, h: 72 }) : L.swatch({ name, hex, value: hex + '  film only', usage, w: 222, h: 72 }))
L.add(bP, L.col([L.text('Stock, ink and gold', 'h2'), L.row(stock, { gap: 20, align: 'MIN', name: 'Stock and gold' }),
  L.text('Swatches with a variable name are bound to the app’s colour; “film only” colours exist only in film/arcana.html.', 'caption', { w: 1400 })], { gap: 16, name: 'Stocks' }))
L.add(bP, L.row([
  L.col([L.text('Halftone and grain', 'h3'), L.specs([
    ['Cell', '5.4 px on the 1080 frame'],
    ['Dot', 'radius = cell × 0.62 × √coverage; coverage capped at 0.72; jitter 0.07 cell'],
    ['Plates', 'Each drawn as grey on white, sampled on a one-cell grid (luma .299 / .587 / .114), laid in multiply at 95%'],
    ['Paper', '1400 specks at 6%, size 1.6; the card stock 900 specks at 7%, size 0.9'],
  ], { w: 680, keyW: 90 })], { gap: 10, name: 'Halftone' }),
  L.col([L.text('Type', 'h3'), L.specs([
    ['Sign-off', 'ARCANA in bold Didot, 108 px on the 1080 frame, letter-spacing 32.4 px; laid letter by letter in gold that cools to ink; then the title’s light passes once'],
    ['Fallback', 'Didot, “Bodoni 72”, serif'],
    ['Cards', 'Numeral bold 15, tracking 3.2; name bold 17, tracking 1.4, caps; essence italic 12.5 in oxblood'],
  ], { w: 680, keyW: 90 })], { gap: 10, name: 'Type' }),
  L.col([L.text('Format', 'h3'), L.specs([
    ['Frame', '1080 × 1080 (1:1). Drawn at 12 fps, packed to 24. 256 frames, 21.33 s'],
    ['Video', 'H.264 yuv420p, CRF 18, +faststart. 17.4 MB'],
    ['Audio', 'AAC 48 kHz stereo, 192 kbps; two-pass loudnorm to −16 LUFS, true peak −1.5'],
  ], { w: 680, keyW: 90 })], { gap: 10, name: 'Format' }),
], { gap: 48, align: 'MIN', name: 'Specs' }))
L.add(bP, L.row([
  O.callout({ w: 1400, tags: [['open']], title: 'Where the film parts from the app',
    body: 'The film’s palette comment lists rose #fdddcc; Palette.rose is #FDDDDC (a typo), and lilac #e0d8f7 against #E0D7F7 is rounding. Its paper #f6f1e7 is warmer than pearl. Its gold is flat and hatched, where the app’s is a four-stop gradient leaf. Its moon is a flat pearl disc with four lilac halftone seas, not the app’s day moon. None of the film has its own system: change the app’s look and the film should follow (film/arcana.html:32-51).' }),
  L.col([O.src(SRC, { w: 700 }), O.src('Palette.swift (the app’s sky)', { w: 700 })], { gap: 6, name: 'Sources' }),
], { gap: 56, align: 'MIN', name: 'Differences' }))
L.add(sec, bP)

// ---- Choices and lessons ------------------------------------------------------------------------------------
const bL = O.board(CH, 'Choices and lessons', { w: 2400, kicker: 'THE LAUNCH FILM',
  lead: 'What the film says was Claude’s choice and is open. How it looks was shaped by Akash, cut by cut. Four lessons came out of it that hold for anything made about Arcana.' })
const col = (title, tags, items, w = 680) => L.col([L.text(title, 'h2', { w }), L.chips(tags), L.bullets(items, { w, style: 'small' })], { gap: 14, w, name: 'Column · ' + title })
L.add(bL, L.row([
  col('Claude chose (open)', [['claude']], [
    'The twelve places: a lit window, a pier, a crossroads, a doorway with a case, two people apart on a bench, a station clock, a boat, a hilltop, a bridge, a lighthouse, a light held up in a field, a ring box. Each has one gold light at the exact centre.',
    'The Star as the answer, written in gold that cools to ink.',
    'ARCANA alone at the end, with no line under it.',
    'The riso look, and the app’s own sounds rebuilt for Web Audio, cued off the picture’s timeline.',
  ]),
  col('Akash decided', [['akash']], [
    'Emotion, not explanation: a launch film, not a demo.',
    '“Everyone’s question”, square.',
    'The halftone on every frame, the title card included.',
    'No off-register gold copies of type, no faint rings, no dots under the name.',
    'The last card wholly in frame.',
    'The film kept in the repo (film/).',
  ]),
  col('Lessons', [['lesson']], [
    'Any walkthrough of the flow reads as a demo, even with no captions. A launch is fragments and feeling.',
    'In riso, four inks at low coverage everywhere read as confetti. Give each area one ink (two at seams), and use multiply for glows.',
    'An anchor rule must never push the hero object out of frame. Probe every card’s placement in numbers, at 1:1, 16:9 and 9:16.',
    'Off-register copies of type read as drop shadows.',
    'Thumbnails made in the browser show moiré; contact sheets scaled by ffmpeg don’t.',
  ]),
], { gap: 56, align: 'MIN', name: 'Choices and lessons' }))
L.add(bL, L.col([L.text('How it is made', 'h3'), L.specs([
  ['Drawing', 'Every frame is drawn on a canvas by film/arcana.html, on core.js (a hand-drawn canvas core by Alexey Fateev, MIT; notice in film/LICENSE-canvas-core). Nothing is filmed or generated.'],
  ['The cards', 'CardArt.swift and Ink.swift ported stroke for stroke, with the same seeded pen, so each card is drawn exactly as the app draws it.'],
  ['Rendering', 'render.mjs draws the frames in Chrome, score.mjs renders the score, make.sh does the loudness pass and muxes. Needs Node 18 or later, Google Chrome and ffmpeg.', 'film/README.md; film/make.sh'],
], { w: 2256, keyW: 150 })], { gap: 10, name: 'How it is made' }))
L.add(sec, bL)

sec.findAll(n => n.type === 'TEXT' && n.fontName !== figma.mixed && n.fontName.family === 'JetBrains Mono').forEach(O.linkAll)
O.order(sec, CH, ['Header', 'The brief and the verdicts', 'Storyboard: the launch film', 'The riso palette', 'Choices and lessons', 'Storyboard: the demo'])
L.fit(sec)
await L.arrange('Experience & notes')
return await O.snap(sec, 'launch-film-and-demo', 0.3, [bP.name, bL.name])
