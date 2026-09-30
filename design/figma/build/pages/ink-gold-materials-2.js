// Chapter: Ink, gold & materials, step 2 of 2 (card materials, glow & shadow).
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-lib.js design/figma/build/pages/ink-gold-materials-2.js
// Run after ink-gold-materials-1.js.
const L = S.lib, F = S.fa
const sec = await L.chapter('Ink, gold & materials', { clear: false })
for (const n of [...sec.children]) if (/· (Card materials|Glow & shadow)$/.test(n.name)) n.remove()
const W = 1600, CW = 1456, PAPER = '#F3EDE0'
const CARD_W = 150, K = CARD_W / 226, CARD_H = 400 * K
const step = (node, title, caption, o = {}) => L.col([node, L.text(title, 'smallStrong', { w: o.w || CARD_W }), caption ? L.text(caption, 'caption', { w: o.w || CARD_W }) : null], { gap: 6, w: o.w || CARD_W, name: 'Step · ' + title })
const plus = () => L.frame({ name: 'Then', dir: 'v', w: 24, h: CARD_H, align: 'CENTER', justify: 'CENTER', kids: [L.text('→', 'h3', { alpha: 0.4 })] })
// the back, as the app's own layered vector, with some layers hidden
const back = async (show, name) => {
  const n = await L.svg('cards/shared/card-back.svg', { w: CARD_W }); n.fills = []; n.name = name
  for (const id of ['stock', 'blind-emboss', 'emboss-light', 'emboss-shade', 'emboss-floor', 'gold-hairline', 'gold-leaf-sun', 'stock-edge']) {
    const g = n.findOne(x => x.name === id); if (!g) continue
    if (['emboss-light', 'emboss-shade', 'emboss-floor'].includes(id)) g.visible = show.includes(id) || show.includes('blind-emboss')
    else if (id === 'blind-emboss') g.visible = show.some(s => s.startsWith('emboss') || s === 'blind-emboss')
    else g.visible = show.includes(id)
  }
  n.clipsContent = true
  return n
}

// ---- 5. Card materials -------------------------------------------------------------------------
const mat = L.board({ name: 'Ink, gold & materials · Card materials', kicker: 'MATERIALS', title: 'Card materials', titleStyle: 'h1', w: W, leadW: 1120,
  lead: 'A card is 226 × 400 pt of heavy cotton stock. A face is paper, then the print, a candle vignette and paper grain over everything. The back and a returned card are pressed, not printed: blind embossing, seen only as light and shade from the upper left.' })

L.add(mat, L.section('A face, layer by layer', { style: 'h3' }))
const paperOnly = F.rect(CARD_W, CARD_H, [F.paint('card/paper')], { name: 'card/paper', r: 0 })
const vig = L.frame({ name: 'Candle vignette over paper (native rebuild)', w: 226, h: 400, clip: true, fill: PAPER })
{ const e = figma.createEllipse(); e.name = 'Card/Vignette (multiply)'; e.resize(500, 500); vig.appendChild(e); e.x = -137; e.y = -50; e.fills = [L.solid('#734D20', 0.1)]; await L.useFill(e, 'Card/Vignette (multiply)') }
vig.rescale(K)
const grain = await L.img('cards/shared/grain-tile.png', { w: CARD_W, scale: 1, name: 'Grain tile (96 × 96, shown larger)' })
L.add(mat, L.row([
  step(paperOnly, 'Paper', 'card/paper #F3EDE0.'),
  plus(),
  step(vig, 'Candle vignette', 'card/candle, clear to 110 pt, 16% at 250 pt, Multiply. Rebuilt with the Card/Vignette paint style.'),
  plus(),
  step(grain, 'Paper grain', 'A 96 pt tile of greys 200–254, seed 9121, Multiply at 50%. Shown at 1.6×.'),
  plus(),
  step(await L.img('cards/shared/face-stock.png', { w: CARD_W, scale: 3 }), 'The stock', 'Paper, vignette and grain: the app’s render.'),
  plus(),
  step(await L.img('cards/shared/face-template.png', { w: CARD_W, scale: 3 }), 'The frame', 'The printed frame on the stock.'),
  plus(),
  step(await L.img('cards/faces/star.png', { w: CARD_W, scale: 3 }), 'A face', 'Art, numeral, name and essence.'),
], { gap: 12, name: 'Face build-up', align: 'MIN' }))
L.add(mat, L.source('CardImages.swift:45-123 (the face); Palette.swift:103-127 (grain); CardImages.swift:107-118 (vignette and grain)'))

L.add(mat, L.section('The three-pass blind emboss', { style: 'h3', lead: 'The same marks drawn three times, flat, a fraction of a point apart: a highlight below right, a wall above left, and a faint floor. Nothing is printed, so it reads as a groove pressed into the stock.', leadW: 1100 }))
const zoomBack = L.frame({ name: 'Emboss, close up (3×)', w: 300, h: CARD_H, clip: true, fill: '#F2EBDD', r: 10 })
{ const n = await back(['stock', 'blind-emboss', 'gold-hairline', 'gold-leaf-sun', 'stock-edge'], 'Back at 3×'); n.rescale(3); zoomBack.appendChild(n); n.x = -(n.width - 300) / 2; n.y = -(n.height - CARD_H) / 2 }
L.add(mat, L.row([
  step(await back(['stock', 'emboss-light'], 'Pass 1 · highlight'), 'Highlight', 'light/white at 95% × s, offset (+0.7, +0.8).', { w: CARD_W }),
  step(await back(['stock', 'emboss-shade'], 'Pass 2 · wall'), 'Wall', 'shade/warm at 24% × s, offset (−0.5, −0.6).'),
  step(await back(['stock', 'emboss-floor'], 'Pass 3 · floor'), 'Floor', 'shade/warm at 8% × s, no offset.'),
  step(await back(['stock', 'blind-emboss'], 'All three passes'), 'Together', 's = 1.0 on the back, 0.85 on returned blanks; flip −1 for reversed art.'),
  step(zoomBack, 'Close up', 'The back’s rose at 3×: the groove is only light and shade.', { w: 300 }),
  L.specs([
    ['Highlight', 'white 95% × s at (+0.7, +0.8)', 'CardImages.swift:178-193'],
    ['Wall', 'shade 24% × s at (−0.5, −0.6)'],
    ['Floor', 'shade 8% × s at 0'],
    ['Strength s', '1.0 back · 0.85 blanks'],
    ['What presses', 'only strokes ≥ 1.2 pt and solid ink or oxblood shapes; hatching and hairlines sink without a trace', 'CardArt.swift:540-555'],
  ], { w: 340, keyW: 96, name: 'Emboss spec' }),
], { gap: 24, name: 'Emboss passes', align: 'MIN' }))

L.add(mat, L.section('The back, and a returned blank', { style: 'h3', tags: ['akash'], lead: 'Akash kept the cream embossed back: a saturated blue-and-gold back with gilt edges was called tacky. Ornament stays restrained: one small sun of leaf.', leadW: 1100 }))
L.add(mat, L.row([
  step(await back(['stock'], 'Back · stock'), 'Stock', 'card/back-stock #F2EBDD.'),
  plus(),
  step(await back(['stock', 'blind-emboss'], 'Back · pressed rose'), 'The rose, pressed', 'A celestial rose, mirrored so the back never shows which way up a card lies.'),
  plus(),
  step(await back(['stock', 'blind-emboss', 'gold-hairline', 'gold-leaf-sun'], 'Back · gold'), 'The gold', 'A 0.9 pt gold/metal hairline (flat) and a leaf sun, r 11, keyline gold/deep.'),
  plus(),
  step(await back(['stock', 'blind-emboss', 'gold-hairline', 'gold-leaf-sun', 'stock-edge'], 'Back · edge'), 'The edge', 'A 1.2 pt line of shade/warm at 13%, drawn just inside the edge. No vignette.'),
  plus(),
  step(await L.img('cards/shared/card-back.png', { w: CARD_W, scale: 3 }), 'The back', 'With grain at 35% Multiply: the app’s render.'),
  L.spacer(24, 1),
  step(await L.img('cards/blanks/star-blank.png', { w: CARD_W, scale: 3 }), 'A returned blank', 'The Star after the return: pressed frame and art at 0.85, the leaf kept, no type.'),
], { gap: 12, name: 'Back build-up', align: 'MIN' }))
L.add(mat, L.source('CardImages.swift:198-261 (CardBlank, CardBackStatic); CardArt.swift:468-491 (the back’s marks); cards/shared/card-back.svg (the layers used here)'))
L.add(sec, mat)

// ---- 6. Glow & shadow ------------------------------------------------------------------------------
const glow = L.board({ name: 'Ink, gold & materials · Glow & shadow', kicker: 'MATERIALS', title: 'Glow & shadow', titleStyle: 'h1', w: W, leadW: 1120,
  lead: 'Light is always gold/light; shadows are always shade/warm. These are the file’s fourteen effect styles, each applied to the element it belongs to. Inspect any of them to see the style.',
  tags: ['claude'] })
const eff = async (node, name) => { const e = await L.styleByName('effect', name); if (e) await node.setEffectStyleIdAsync(e.id); return node }
const tile = (w, h, kids, title, spec, source) => L.col([
  L.frame({ name: 'Stage · ' + title, dir: 'h', w, h, gap: 20, fill: '#F9F7F2', stroke: L.C.stroke, r: 14, align: 'CENTER', justify: 'CENTER', kids }),
  L.text(title, 'smallStrong', { w }), F.mono(spec, { w }), source ? L.source(source, { w }) : null,
], { gap: 4, w, name: 'Effect · ' + title })
const TW = (CW - 3 * 24) / 4, WIDE = (CW - 24) / 2
const card = async (id, name, w = 104) => L.img(`cards/faces/${id}.png`, { w, scale: 3, name })
const pips = L.row([await L.svg('glyphs/ui/diamonds/diamond-spread-pip-chosen.svg', { w: 12 }), await L.svg('glyphs/ui/diamonds/diamond-spread-pip-chosen.svg', { w: 12 }), await L.svg('glyphs/ui/diamonds/diamond-spread-pip-chosen.svg', { w: 12 })], { gap: 10, name: 'Chosen spread pips' })
for (const p of pips.children) { p.fills = []; await eff(p, 'Glow/Spread pips chosen') }
const key = await L.svg('glyphs/ui/key-glyph-lit.svg', { w: 52 }); key.fills = []; await eff(key, 'Glow/Glyph lit')
const diamond = F.rect(7, 7, [F.paint('gold/ink')], { name: 'A diamond (size illustrative)', r: 0, stroke: false }); diamond.rotation = 45
const dHold = L.frame({ name: 'Diamond', w: 14, h: 14 }); dHold.appendChild(diamond); diamond.x = 7; diamond.y = 2; await eff(diamond, 'Glow/Thread end diamond')
const altarCard = await card('star', 'The Star on the altar'); await eff(altarCard, 'Shadow/Altar card')
const altar = L.frame({ name: 'Altar back-light', w: altarCard.width, h: altarCard.height, kids: [altarCard] }); await eff(altar, 'Glow/Altar back-light')
L.add(glow, L.row([
  tile(WIDE, 200, [await F.styled('ARCANA', 'Display/Title', 'ink/text', { effect: 'Glow/Title — ARCANA' })], 'Glow/Title — ARCANA', 'gold/light 55% · SwiftUI radius 22 → blur 44', 'RootView.swift:1038'),
  tile(WIDE, 200, [await F.styled('THE HIGH PRIESTESS', 'Display/Altar name', 'ink/text', { effect: 'Glow/Altar name' })], 'Glow/Altar name', 'gold/light 45% · radius 16 → blur 32', 'RootView.swift:1470'),
], { gap: 24, name: 'Glows · display' }))
L.add(glow, L.row([
  tile(TW, 160, [await F.styled('THE KEYS', 'Display/Page title', 'ink/text', { effect: 'Glow/Keys title — THE KEYS' })], 'Glow/Keys title — THE KEYS', 'gold/light 45% · radius 14 → blur 28', 'Legend.swift:113'),
  tile(TW, 160, [await F.styled('Hold the question in your mind.', 'Voice/Question', 'ink/text-98', { effect: 'Glow/Held question' })], 'Glow/Held question', 'gold/light 90% × charge · radius 14 → blur 28', 'RootView.swift:832, 950'),
  tile(TW, 160, [await F.styled('Row for the calmer water.', 'Verse/Five', 'ink/text-92', { effect: 'Glow/Verse lit' })], 'Glow/Verse lit', 'gold/light 90% · radius 12 → blur 24', 'RootView.swift:1224; Keeping.swift:832'),
  tile(TW, 160, [await F.styled('What would you tend?', 'Thread/Question', 'gold/ink', { effect: 'Glow/Thread question' })], 'Glow/Thread question', 'gold/light 60% · radius 12 → blur 24', 'RootView.swift:1356; Keeping.swift:876'),
], { gap: 24, name: 'Glows · type', align: 'MIN' }))
L.add(glow, L.row([
  tile(TW, 200, [dHold], 'Glow/Thread end diamond', 'gold/light 100% · radius 5 → blur 10', 'RootView.swift:1348'),
  tile(TW, 200, [pips], 'Glow/Spread pips chosen', 'gold/light 90% · radius 4 → blur 8', 'RootView.swift:1100'),
  tile(TW, 200, [key, await L.img('glyphs/ui/key-glyph-lit-app@3x.png', { w: 54, scale: 3, name: 'The app’s render, for comparison' })], 'Glow/Glyph lit', 'gold/light 80% · radius 6 → blur 12 · left Figma, right the app', 'Legend.swift:372; Keeping.swift:956'),
  tile(TW, 200, [await eff(await card('sun', 'A card lit', 88), 'Glow/Card lit')], 'Glow/Card lit', 'gold/light 55% · radius 26 → blur 52', 'RootView.swift:357; Keeping.swift:690'),
], { gap: 24, name: 'Glows · marks', align: 'MIN' }))
L.add(glow, L.row([
  tile(TW, 250, [await eff(await card('moon', 'A card on the table'), 'Shadow/Card on table')], 'Shadow/Card on table', 'shade/warm 35% · radius 18 → blur 36 · y 11', 'RootView.swift:354-356; Keeping.swift:689'),
  tile(TW, 250, [await eff(await card('world', 'A card lifted'), 'Shadow/Card lifted')], 'Shadow/Card lifted', 'shade/warm 35% · radius 28 → blur 56 · y 20', 'RootView.swift:354-356'),
  tile(TW, 250, [altar], 'Shadow/Altar card + Glow/Altar back-light', 'shade/warm 32% · blur 72 · y 22, over gold/light 30–45% breathing · blur 100', 'RootView.swift:1567-1568'),
  L.col([
    L.note({ w: TW, tags: ['measured'], title: 'Radius is not blur', body: 'SwiftUI’s shadow radius is not Figma’s blur. These styles use blur = 2 × radius, the closest found. Compare a new glow with a 2× render before trusting it.' }),
    L.note({ w: TW, tags: ['fixed'], title: 'Blend modes', body: 'Halos Screen (Light/Halo paint style); the altar sheen white 0/30/0% Soft Light; vignette and grain Multiply.', source: 'RootView.swift:1550-1561' }),
  ], { gap: 12, name: 'Glow notes' }),
], { gap: 24, name: 'Shadows', align: 'MIN' }))
L.add(sec, glow)

L.fit(sec)
await L.arrange('Design system')
return JSON.stringify((await L.snapChapter(sec, 'pages/ink-gold-materials', { scale: 0.3 })).map(s => s.path + ' ' + s.h))
