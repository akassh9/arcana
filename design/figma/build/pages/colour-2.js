// Chapter: Colour, step 2 of 2 (the three golds, card stock / shade / light / moon, outside the app, rendered vs code).
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-lib.js design/figma/build/pages/colour-2.js
// Run after colour-1.js (which clears the chapter).
const L = S.lib, F = S.fa
const sec = await L.chapter('Colour', { clear: false })
for (const n of [...sec.children]) if (/^Colour · (The three golds|Card stock|Outside the app|Rendered vs code)/.test(n.name)) n.remove()
const W = 1600, CW = 1456

// ---- 4. The three golds ------------------------------------------------------------------------------
const gold = L.board({ name: 'Colour · The three golds', kicker: 'COLOUR', title: 'The three golds', titleStyle: 'h1', w: W, leadW: 1100,
  lead: 'Gold does three different jobs in Arcana, and each has its own colour. Keep them apart: gold that is read, gold that is metal, and gold that is light.',
  tags: [['claude', 'Claude chose: gold/ink for the light sky']] })
const stage = (kids, h = 168) => L.frame({ name: 'In the app', dir: 'v', w: 464, h, pad: 20, gap: 10, fill: '#F9F7F2', stroke: L.C.stroke, r: 14, align: 'CENTER', justify: 'CENTER', kids })
const role = (name, roleTitle, usage, source, ex, exCaption) => L.col([
  F.rect(464, 132, [F.paint(name)], { name: 'Swatch · ' + name }),
  L.text(roleTitle, 'h2', { w: 464 }),
  L.text(name + '   ' + F.hex(name), 'codeStrong', { w: 464 }),
  L.text(usage, 'small', { w: 464 }),
  L.source(source, { w: 464 }),
  L.spacer(1, 6),
  ex, L.text(exCaption, 'caption', { w: 464 }),
], { gap: 8, w: 464, name: 'Gold role · ' + name })
const readEx = stage([
  await F.styled('FIND THE THREAD', 'Caps/Thread action', 'gold/ink'),
  await F.styled('Water Under Starlight', 'Altar/Essence', 'gold/ink'),
  await F.styled('try again', 'Italic/Small', 'gold/ink'),
])
const metalEx = stage([await L.img('type-ink/ink/stroke-ramp-line-detail@6x.png', { w: 424, scale: 6 })])
const lightEx = stage([await L.img('type-ink/title/wordmark@2x.png', { w: 340 })], 168)
L.add(gold, L.row([
  role('gold/ink', 'Gold you can read', 'Type and hairlines on the sky: lit slot names, FIND THE THREAD, try again, the altar label and essence, the thread’s question, the lit key glyph. 4.52:1 on pearl.', 'Palette.swift:22-23', readEx, 'Real text styles in gold/ink: Caps/Thread action, Altar/Essence, Italic/Small.'),
  role('gold/metal', 'Wet gold being laid', 'A card stroke as it is laid, a typed letter for its first 0.15 s, gold dust, the title’s passing light (95%), text an input method is composing (75%), the back’s hairline. Never type at rest.', 'Palette.swift:28', metalEx, 'The app’s render: a line of the Star’s water being laid, wet gold behind the nib.'),
  role('gold/light', 'Light, never type', 'Every glow and halo, the nib’s point of light, a letter’s first instant, the thread’s underlay, the charge arc’s glow. 1.44:1 on pearl: it can’t carry words.', 'Palette.swift:29', lightEx, 'The app’s render: ARCANA in ink with its glow, gold/light at 55%, radius 22.'),
], { gap: 32, name: 'Three golds', align: 'MIN' }))

// leaf and deep gold
const leafBig = F.rect(680, 150, [L.solid('#C9A333')], { name: 'Gold/Leaf (paint style)' })
await L.useFill(leafBig, 'Gold/Leaf')
const stopSw = (name, pos) => L.col([F.rect(155, 56, [F.paint(name)], { name: 'Swatch · ' + name, r: 8 }), L.text(name, 'smallStrong', { w: 155 }), F.mono(F.hex(name) + ' · stop ' + pos, { w: 155 })], { gap: 4, w: 155, name: 'Leaf stop · ' + name })
const leafShapes = L.row([await L.svg('glyphs/pen/pen-fillDiamond-gold.svg', { w: 120 }), await L.svg('glyphs/pen/pen-fillPoly.svg', { w: 120 }), await L.svg('glyphs/pen/pen-eye.svg', { w: 120 })], { gap: 8, name: 'Leaf on pen shapes' })
for (const n of leafShapes.children) n.fills = []
L.add(gold, L.section('Gold leaf, and the deep gold', { style: 'h3' }))
L.add(gold, L.row([
  L.col([leafBig,
    L.row([stopSw('gold/leaf-0', '0'), stopSw('gold/leaf-42', '0.42'), stopSw('gold/leaf-66', '0.66'), stopSw('gold/leaf-100', '1.0')], { gap: 20, name: 'Leaf stops' }),
    L.text('Palette.leaf: four bands, light, dark, light, dark, like beaten leaf catching a candle. It is a paint style (Gold/Leaf). On a card it runs across each shape’s own box, top left to bottom right, so its angle changes with the shape; see Ink, gold & materials.', 'small', { w: 680 }),
    L.source('Palette.swift:40-46; CardImages.swift:31-39', { w: 680 }),
  ], { gap: 14, w: 680, name: 'Gold leaf' }),
  L.col([leafShapes, L.text('Leaf on the pen’s shapes (the app’s own paths): a diamond, a polygon, the eye. Each gold shape carries a 0.8 pt ink keyline.', 'caption', { w: 376 })], { gap: 10, w: 376, name: 'Leaf in use' }),
  F.swatch('gold/deep', { w: 304, usage: 'Only the 0.8 pt keyline round the card back’s gold sun.', source: 'Palette.swift:30; CardArt.swift:468-491' }),
], { gap: 48, name: 'Leaf row', align: 'MIN' }))
L.add(gold, L.row([
  L.note({ w: 460, tags: ['panel'], title: 'Gold never comes back on the way out', body: 'When cards are returned the ink sinks into the stock and the leaf stays, but no gold is re-laid. A design panel’s choice, approved by Akash as part of The Return, not a rule of theirs.', source: 'CardImages.swift:198-235; CardArt.swift:557-571' }),
  L.note({ w: 460, tags: ['claude'], title: 'About one gold per card', body: 'Leaf is used sparingly: most cards carry one gold shape (a sun, a cup, a crown). A habit of Claude’s while drawing the deck, not a spec.', source: 'CardImages.swift:197' }),
  L.note({ w: 472, tags: ['fixed'], title: 'Don’t use gold/metal for type', body: 'It is 2.15:1 on pearl. A letter is gold/metal only while it is wet; it cools to ink within 0.9 s (see Ink, gold & materials).', source: 'Quill.swift:214-257' }),
], { gap: 24, name: 'Gold notes', align: 'MIN' }))
L.add(sec, gold)

// ---- 5. Card stock, shade, light & the moon ------------------------------------------------------------
const mat = L.board({ name: 'Colour · Card stock, shade, light & the moon', kicker: 'COLOUR', title: 'Card stock, shade, light & the moon', titleStyle: 'h1', w: W, leadW: 1100,
  lead: 'The cards are heavy cream cotton printed in near-black ink with an oxblood accent. Shadows are warm brown, light is gold or white, and the day moon is painted in the sky’s own pale colours.' })
L.add(mat, L.section('Card stock', { style: 'h3' }))
L.add(mat, L.row([
  F.swatch('card/paper', { usage: 'Face and blank stock; paper cut-outs (the Priestess’s and the Moon’s crescents, clouds).', source: 'Palette.swift:26' }),
  F.swatch('card/back-stock', { usage: 'The card’s reverse: the face’s stock a breath warmer and darker, so a squared deck reads as one material.', source: 'Palette.swift:35' }),
  F.swatch('card/ink', { usage: 'Every pen line on a card, the numeral and the name, the 0.8 pt keyline round gold. 16.1:1 on paper.', source: 'Palette.swift:27' }),
  F.swatch('card/oxblood', { usage: 'Accent diamonds and brackets, the essence, the reversed mark, · REVERSED on the altar, Settings’ refused lines. 7.11:1 on paper.', source: 'Palette.swift:31' }),
  F.swatch('card/candle', { usage: 'The face vignette: clear to 110 pt, 16% at 250 pt, Multiply.', source: 'Palette.swift:32; CardImages.swift:107-111' }),
], { gap: 24, name: 'Card colours', align: 'MIN' }))

L.add(mat, L.section('Shade and light', { style: 'h3', lead: 'shade/warm is the only dark in the sky. It is used at these opacities and never at 100%; there is no black shadow anywhere.', leadW: 1100 }))
const shadeUses = [[0.35, 'Card on the table'], [0.32, 'The altar card'], [0.24, 'Emboss wall'], [0.13, 'The back’s edge'], [0.09, 'The page’s edge'], [0.08, 'Emboss floor']]
const shadeLadder = L.row(shadeUses.map(([a, t]) => L.col([F.rect(96, 64, [F.paint('shade/warm')], { name: 'shade/warm at ' + Math.round(a * 100) + '%', opacity: a, r: 8 }), L.text(Math.round(a * 100) + '%', 'codeStrong', { size: 12, lh: 16 }), L.text(t, 'caption', { w: 96 })], { gap: 4, w: 96, name: 'Shade · ' + t })), { gap: 12, name: 'Shade ladder' })
const cardShadow = await L.img('cards/faces/star.png', { w: 120, scale: 3, name: 'The Star on the table' })
{ const e = await L.styleByName('effect', 'Shadow/Card on table'); if (e) await cardShadow.setEffectStyleIdAsync(e.id) }
const shadowStage = L.frame({ name: 'Warm shadow, real card', dir: 'h', w: 232, h: 272, fill: '#F9F7F2', stroke: L.C.stroke, r: 14, align: 'CENTER', justify: 'CENTER', kids: [cardShadow] })
L.add(mat, L.row([
  L.col([F.swatch('shade/warm', { usage: 'Every shadow, never black.', source: 'Palette.swift:18' }), shadeLadder], { gap: 20, name: 'Shade' }),
  L.col([shadowStage, L.text('The Star with the Shadow/Card on table effect style: shade/warm at 35%, blur 36, y 11.', 'caption', { w: 232 }), L.source('RootView.swift:354-356', { w: 232 })], { gap: 8, w: 232, name: 'Shadow in use' }),
  F.swatch('light/white', { w: 320, usage: 'Light only, never a surface: the rays (17–27% at the centre), blooms, the flash (85%), the moon’s aureole and hover, the altar sheen (30%, Soft Light).', source: 'Chamber.swift:331-393; Keeping.swift:1096-1099; RootView.swift:1550-1561' }),
], { gap: 40, name: 'Shade and light row', align: 'MIN' }))

L.add(mat, L.section('The day moon', { style: 'h3', tags: ['lesson'], lead: 'The reference was Apple’s emoji moon; its idea (real seas, craters, a jagged terminator) was kept and its palette was not. Pearl-ivory highlands, lilac seas, a translucent lilac ghost for the unlit disc.', leadW: 1100 }))
L.add(mat, L.row([
  F.swatch('moon/highland', { usage: 'Lit highlands.', source: 'Moon.swift:94' }),
  F.swatch('moon/sea', { usage: 'Lit seas.', source: 'Moon.swift:95' }),
  F.swatch('moon/limb', { usage: 'The warm limb, mixed in up to 35% at the edge.', source: 'Moon.swift:96, 161' }),
  F.swatch('moon/ghost-highland', { usage: 'The unlit disc.', source: 'Moon.swift:97' }),
  F.swatch('moon/ghost-sea', { usage: 'Seas in the unlit disc.', source: 'Moon.swift:98' }),
], { gap: 24, name: 'Moon colours', align: 'MIN' }))
L.add(mat, L.col([await L.img('sky/moon/moon-phases-strip-on-sky.png', { w: CW, scale: 4, r: 10 }), L.text('The app’s render: the sixteen phases on the sky, new moon to waning crescent, at 2.7× their size in the window (32 pt).', 'caption', { w: CW })], { gap: 8, name: 'Moon phases render' }))
L.add(sec, mat)

// ---- 6. Outside the app ------------------------------------------------------------------------------
const out = L.board({ name: 'Colour · Outside the app', kicker: 'COLOUR', title: 'Outside the app: the icon and the film', titleStyle: 'h1', w: W, leadW: 1100,
  lead: 'Two palettes live outside the room. The icon comes from the dark era, before the light direction. The launch film has its own riso inks, made from the app’s sky. Neither is part of the app’s system.' })
L.add(out, L.section('The icon · from the dark era', { style: 'h3', tags: ['open'] }))
const logo = await L.img('brand/icon/app-icon-512-shipped.png', { w: 200, scale: 1, name: 'App icon as shipped' })
const fallback = await L.img('brand/icon/fallback-icon.png', { w: 200, scale: 1, name: 'Fallback pen icon' })
L.add(out, L.row([
  L.col([logo, L.text('Shipped: the raster eclipse-and-compass mark', 'caption', { w: 200 })], { gap: 8, name: 'Shipped icon' }),
  L.col([L.row([
    F.swatch('brand/logo-disc', { w: 200, h: 88, usage: 'The eclipse disc (sampled).' }),
    F.swatch('brand/logo-crescent', { w: 200, h: 88, usage: 'The cream crescent (sampled).' }),
    F.swatch('brand/logo-gold', { w: 200, h: 88, usage: 'Mid of the textured gold, #BA8C4A–#D8B162.' }),
    F.swatch('brand/logo-oxblood', { w: 200, h: 88, usage: 'The jewel dots, far darker than card/oxblood.' }),
  ], { gap: 20, name: 'Logo colours', align: 'MIN' }),
  L.text('Sampled from Assets/arcana-logo.png, which uses none of the app’s tokens. The PNG predates the light direction (21 September).', 'small', { w: 860 })], { gap: 12, name: 'Logo colours block' }),
], { gap: 40, name: 'Icon row', align: 'MIN' }))
L.add(out, L.row([
  L.col([fallback, L.text('Fallback only: the pen-drawn Magician’s eye', 'caption', { w: 200 })], { gap: 8, name: 'Fallback icon' }),
  L.row([
    F.swatch('icon/void', { w: 200, h: 88, usage: 'The fallback icon’s ground. Not used by the app.', source: 'Palette.swift:38; Tools/icon/main.swift:8' }),
    F.swatch('icon/glow', { w: 200, h: 88, usage: 'The fallback’s radial glow, r 40 → 560 on 1024.', source: 'Tools/icon/main.swift:9-11' }),
  ], { gap: 20, align: 'MIN', name: 'Fallback colours' }),
  L.note({ w: 400, tags: ['open'], title: 'The icon needs a decision', body: 'The shipped icon is a dark mark in a light-only app, drawn in a different language from the pen. The code can draw a pen icon, but build.sh uses it only if the PNG is missing.', source: 'CardArt.swift:455-463' }),
], { gap: 40, name: 'Fallback row', align: 'MIN' }))

L.add(out, L.section('The launch film’s riso inks · for reference, not tokens', { style: 'h3', tags: ['akash', 'lesson'], lead: 'Akash asked for the film’s halftone, “a dither like effect”. Four inks print the sky; plates at low coverage everywhere read as confetti, so each keeps to its part of the picture.', leadW: 1100 }))
const inks = [['#6F97E0', 'Cornflower', 'Plate 1 · the blue overhead · 14.9°'], ['#9F8BE0', 'Lavender', 'Plate 2 · the lilac in the air · 75.1°'], ['#EF9690', 'Rose', 'Plate 3 · rising from below · 45.3°'], ['#F4B454', 'Apricot', 'Plate 4 · the dawn · 0°'], ['#F6F1E7', 'Film paper', 'Warmer than pearl #F9F7F2'], ['#2A2230', 'Film ink', 'The film’s line, not card/ink']]
const film = await L.img('brand/film/frames/film-0024-02-pier.png', { w: 300, scale: 1, r: 10, name: 'Film frame · the pier' })
L.add(out, L.row([
  L.col([L.row(inks.slice(0, 3).map(([h, t, u]) => F.raw(h, t, { w: 320, h: 80, usage: u })), { gap: 24, align: 'MIN', name: 'Inks 1' }),
    L.row(inks.slice(3).map(([h, t, u]) => F.raw(h, t, { w: 320, h: 80, usage: u })), { gap: 24, align: 'MIN', name: 'Inks 2' }),
    L.text('From brand/film/film-palette.json (film/arcana.html:32, 286-293). The film’s own comment gives rose as #fdddcc, a typo for the app’s #FDDDDC. Keep this palette separate from the app’s.', 'small', { w: 1008 })], { gap: 20, name: 'Film inks' }),
  L.col([film, L.text('A frame of the film: the pier, printed in the four inks.', 'caption', { w: 300 })], { gap: 8, name: 'Film frame' }),
], { gap: 48, name: 'Film row', align: 'MIN' }))
L.add(sec, out)

// ---- 7. Rendered vs code --------------------------------------------------------------------------------
const rvc = L.board({ name: 'Colour · Rendered vs code', kicker: 'COLOUR', title: 'Rendered vs code', titleStyle: 'h1', w: W, leadW: 1100,
  lead: 'Three colours draw differently from what their code says. The tokens in this file use what the app actually puts on screen, measured from its renders. Earlier notes and inventories wrote the other values.' })
const cmp = (codeHex, drawnHex, label) => L.row([
  L.col([F.rect(150, 64, [L.solid(codeHex)], { name: 'As written ' + codeHex, r: 8 }), F.mono('as written ' + codeHex)], { gap: 4, name: 'As written' }),
  L.col([F.rect(150, 64, [L.solid(drawnHex)], { name: 'As drawn ' + drawnHex, r: 8 }), F.mono('as drawn ' + drawnHex, { alpha: 1 })], { gap: 4, name: 'As drawn' }),
], { gap: 12, name: 'Compare · ' + label })
const rv = (title, body, source, a, b) => L.note({ w: 346, tags: ['measured'], title, body, source, kids: [cmp(a, b, title)] })
L.add(rvc, L.row([
  rv('Wheel ink #97782F', 'The code gives (0.52, 0.40, 0.14) as a Generic RGB colour (gamma 1.8), painted into a device bitmap. It draws #97782F, not #856624, the same numbers read as sRGB.', 'Chamber.swift:69-77', '#856624', '#97782F'),
  rv('Shade #4D381F', 'Red is 0.300 × 255 = 76.5, a rounding tie. Rendered into an 8-bit sRGB context it draws #4D381F; composites that used #4C381F are off by one in red.', 'Palette.swift:18', '#4C381F', '#4D381F'),
  rv('Candle #734D20', 'The same tie in green. It renders #734D20, not #734C20. At 16% under Multiply the difference is invisible, but the token should match.', 'Palette.swift:32', '#734C20', '#734D20'),
  L.note({ w: 346, tags: ['open'], title: 'Blends go olive', body: 'Colour is interpolated in gamma-encoded sRGB, so halfway from gold to ink turns khaki: the question at 0.5 s is #8F7F4D over pearl. A perceptual (OKLCH) blend would stay warmer. Worth a designer’s eye.', source: 'Quill.swift:248-257; CardImages.swift:159-160' }),
], { gap: 24, name: 'Rendered vs code notes', align: 'MIN' }))
{ const r = rvc.children[rvc.children.length - 1]; const hMax = Math.max(...r.children.map(k => k.height)); for (const k of r.children) { k.layoutSizingVertical = 'FIXED'; k.resize(k.width, hMax) } }
L.add(rvc, L.source('Also minor: the paper grain is built in DeviceRGB (Palette.swift:109), and the window background repeats pearl as a literal NSColor rather than Palette.pearl (RootView.swift:1659-1660).', { w: CW, size: 12, lh: 18, alpha: 0.7 }))
L.add(sec, rvc)

L.fit(sec)
await L.arrange('Design system')
return JSON.stringify(await L.snapChapter(sec, 'pages/colour', { scale: 0.3 }))
