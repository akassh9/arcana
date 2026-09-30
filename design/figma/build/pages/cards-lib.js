// cards-lib.js — the deck's component generator (S.cards). Plain JS, no chapter of its own.
//
// Include it in front of a step: run.mjs joins the files it is given, so
//   node design/figma/bridge/run.mjs design/figma/build/pages/cards-lib.js design/figma/build/pages/<step>.js
// and the step can then use S.cards (S.lib must already be installed, which run.mjs does first).
//
//   await S.cards.load()               deck.json, the colour variables and the grain image (call once per step)
//   S.cards.card(id)                   the deck.json record of a card ('fool', 'cups-7', 'wands-knight' …)
//   await S.cards.base()               { finish, stock, stockReturned, back } — finds or makes the base components
//   await S.cards.art(id)              component 'Art/<Card name>' (186 × 248, from cards/art/<id>.svg)
//   await S.cards.blankArt(id)         component 'Art/Returned/<Card name>' (from cards/blank-art/<id>-blank.svg)
//   await S.cards.makeCard(id, o)      component set 'Card/<Card name>', variant property State = Upright | Reversed | Returned
//                                      o.rebuild: build it again and swap every existing instance over to the new one
//   S.cards.variant(id, state)         the variant component ('Upright' | 'Reversed' | 'Returned'), or null
//   S.cards.instance(id, state)        an instance of that variant
//   S.cards.rescue(section)            before clearing a chapter that holds deck components, move them out to a parking
//                                      frame so clearing doesn't delete them (instances elsewhere keep working)
//   S.cards.unpark()                   removes the parking frame once it is empty
//
// New components are made in the parking frame ('Deck components · parking', on the Design system page); a step then
// appends them to its boards. makeCard is idempotent: it returns the existing set unless o.rebuild.
//
// How a face is built (CardImages.swift:45-122, CardFace): paper, frame, art, type, then the candle vignette and the
// paper grain multiplied over everything. So a variant is: Stock (its own Finish switched off) → Art → Numeral, Name,
// Essence (live text, text styles Card/Numeral, Card/Name, Card/Essence, at deck.json's measured placements) → Finish.
// Reversed turns the art 180° about its centre (113, 176); the type stays upright, lifted 6.5 pt, with the oxblood
// diamond under it. Returned (CardBlank, CardImages.swift:198-235) is the pressed stock, the pressed art and the kept
// leaf, no type. A reversed card's blank also turns (with the light kept upper left); that pose is not a variant here —
// use the render cards/blanks-reversed/<id>-blank-reversed.png.

// Wrapped in a block so a step joined after it can declare its own `const L`.
{
const L = S.lib
const C = S.cards = S.cards || {}
C.PARK = 'Deck components · parking'
C.FRAME_W = 226; C.FRAME_H = 400

C.load = async () => {
  if (!C.deck) C.deck = await L.json('cards/deck.json')
  C.byId = {}
  for (const c of C.deck.cards) C.byId[c.id] = c
  C.vars = {}
  for (const v of await figma.variables.getLocalVariablesAsync('COLOR')) C.vars[v.name] = v
  if (!C.grainHash) {
    const im = figma.createImage(await bytes('cards/shared/grain-tile.png'))
    await im.getBytesAsync()
    C.grainHash = im.hash
  }
  C.refresh()
  return C
}
C.card = id => { const c = C.byId[id]; if (!c) throw new Error('No card ' + id); return c }
C.title = id => C.card(id).name

// A solid paint bound to one of the file's Arcana colour variables (so Inspect shows the token).
C.paint = (hex, varName, a = 1) => {
  const p = L.solid(hex, a)
  const v = varName && C.vars[varName]
  return v ? figma.variables.setBoundVariableForPaint(p, 'color', v) : p
}

// Index of the deck's components by name (cheaper than searching the whole file each time).
C.refresh = () => {
  C.byName = {}
  const page = figma.root.children.find(p => p.name === 'Design system')
  const nodes = page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })
  for (const n of nodes) {
    if (n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') continue
    if (/^(Card|Art)\//.test(n.name)) C.byName[n.name] = n
  }
  return C.byName
}
C.find = name => { const n = C.byName[name]; return n && !n.removed ? n : null }

C.parking = () => {
  const page = figma.root.children.find(p => p.name === 'Design system')
  let f = page.children.find(n => n.name === C.PARK)
  if (!f) {
    f = figma.createFrame(); f.name = C.PARK; f.fills = []; f.clipsContent = false
    page.appendChild(f); f.x = -12000; f.y = 0
    f.layoutMode = 'HORIZONTAL'; f.itemSpacing = 40; f.layoutWrap = 'WRAP'; f.counterAxisSpacing = 40
    f.resize(6000, 100); f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'AUTO'
  }
  return f
}
C.park = n => { C.parking().appendChild(n); return n }
C.unpark = () => { const f = C.parking(); if (!f.children.length) f.remove() }
C.rescue = section => {
  const hits = section.findAll(n => (n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent.type !== 'COMPONENT_SET')) && /^(Card|Art)\//.test(n.name))
  for (const h of hits) C.park(h)
  return hits.length
}

// ---- base components ---------------------------------------------------------
const svgNode = async path => { const n = figma.createNodeFromSvg(await text(path)); n.clipsContent = false; return n }
// Move an imported SVG's layers into a component (keeping their positions) and drop the empty root.
const adopt = (comp, svg) => { for (const k of [...svg.children]) comp.appendChild(k); svg.remove(); return comp }
const component = (name, w, h, o = {}) => {
  const c = figma.createComponent()
  c.name = name; c.resize(w, h); c.fills = o.fills || []; c.clipsContent = o.clip !== false
  if (o.description) c.description = o.description
  C.park(c)
  return c
}
const finishProp = comp => Object.keys(comp.componentPropertyDefinitions || {}).find(k => k.startsWith('Finish'))

C.base = async () => {
  if (!C.deck) await C.load()
  let finish = C.find('Card/Finish')
  if (!finish) {
    finish = component('Card/Finish', 226, 400, { description: 'The finish every face and blank is printed under: the candle vignette (radial, clear to 110 pt, candle #734D20 rising to 16% at 250 pt, Multiply) and the paper grain (96 pt tile, Multiply, 50%). In the app they are multiplied over everything, art and type included, so a card variant puts this on top. CardImages.swift:108-117.' })
    const vig = figma.createEllipse(); vig.name = 'Vignette'; finish.appendChild(vig)
    vig.resize(500, 500); vig.x = 113 - 250; vig.y = 200 - 250
    const cd = L.hex('#734D20')
    vig.fills = [{ type: 'GRADIENT_RADIAL', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [
      { position: 0, color: Object.assign({}, cd, { a: 0 }) }, { position: 0.44, color: Object.assign({}, cd, { a: 0 }) }, { position: 1, color: Object.assign({}, cd, { a: 0.16 }) }] }]
    vig.blendMode = 'MULTIPLY'
    const grain = figma.createRectangle(); grain.name = 'Grain'; finish.appendChild(grain)
    grain.resize(226, 400)
    grain.fills = [{ type: 'IMAGE', scaleMode: 'TILE', scalingFactor: 1, imageHash: C.grainHash }]
    grain.blendMode = 'MULTIPLY'; grain.opacity = 0.5
  }
  const stockOf = async (name, framePath, description) => {
    let s = C.find(name)
    if (s) return s
    s = component(name, 226, 400, { description })
    const paper = figma.createRectangle(); paper.name = 'Paper'; s.appendChild(paper); paper.resize(226, 400)
    paper.fills = [C.paint('#F3EDE0', 'card/paper')]
    const fr = await svgNode(framePath); fr.name = 'Frame'; s.appendChild(fr); fr.x = 0; fr.y = 0
    const fi = finish.createInstance(); fi.name = 'Finish'; s.appendChild(fi); fi.x = 0; fi.y = 0
    const key = s.addComponentProperty('Finish', 'BOOLEAN', true)
    fi.componentPropertyReferences = { visible: key }
    return s
  }
  const stock = await stockOf('Card/Stock', 'cards/shared/face-frame.svg',
    'The face stock: cotton paper #F3EDE0, the printed frame (outer hairline 1.1 pt, heavy border 2.4 pt, art window 1.3 pt, band rule 2.2 pt, four oxblood corner brackets 1.1 pt; every line bowed by the pen) and the Finish. Turn Finish off when art and type go on top, and put a Card/Finish over them, as the app does. CardImages.swift:45-122; CardArt.swift:439-453.')
  const stockReturned = await stockOf('Card/Stock · Returned', 'cards/shared/blank-frame.svg',
    'The stock of a returned blank: the heavy border, art window and band rule survive as blind grooves (three emboss passes at strength 0.85: light #FFFFFF 81% at +0.7,+0.8; shade #4D381F 20% at -0.5,-0.6; floor 7%). The hairline and brackets sink without trace. CardImages.swift:198-235.')
  let back = C.find('Card/Back')
  if (!back) {
    back = component('Card/Back', 226, 400, { description: 'The reverse of every card: a celestial rose blind-embossed into cream stock #F2EBDD (light from the upper left), a gold hairline, one gold-leaf sun, the paper grain at 35% Multiply and a 1.2 pt shaded stock edge. Mirrored through its centre, so it never shows which way up a card lies. No vignette. CardImages.swift:239-260; CardArt.swift:468-491.' })
    const svg = await svgNode('cards/shared/card-back.svg')
    adopt(back, svg)
    const stockG = back.children.find(n => n.name === 'stock')
    const r = stockG && (stockG.type === 'RECTANGLE' ? stockG : stockG.findOne && stockG.findOne(n => n.type === 'RECTANGLE' || n.type === 'VECTOR'))
    if (r) r.fills = [C.paint('#F2EBDD', 'card/back-stock')]
    const edge = back.children.find(n => n.name === 'stock-edge')
    const grain = figma.createRectangle(); grain.name = 'Grain'; grain.resize(226, 400)
    grain.fills = [{ type: 'IMAGE', scaleMode: 'TILE', scalingFactor: 1, imageHash: C.grainHash }]
    grain.blendMode = 'MULTIPLY'; grain.opacity = 0.35
    back.insertChild(edge ? back.children.indexOf(edge) : back.children.length, grain)
    if (edge) for (const p of edge.findAll ? edge.findAll(n => 'strokes' in n && n.strokes.length) : []) p.strokes = [L.solid('#4D381F', 0.13)]
    if (edge && edge.strokes && edge.strokes.length) edge.strokes = [L.solid('#4D381F', 0.13)]
  }
  C.parts = { finish, stock, stockReturned, back }
  return C.parts
}

// ---- art ---------------------------------------------------------------------------
const describeArt = c => `${c.art.what_it_shows} ${c.art.gold.replace(/^gold = /, 'Gold: ')} CardArt.swift (art: ${c.art.kind}). Placed at (20, 52) on the face, not clipped.`
C.art = async (id, o = {}) => {
  const c = C.card(id), name = 'Art/' + c.name
  let a = C.find(name)
  if (a && !o.rebuild) return a
  const n = component(name, 186, 248, { clip: false, description: describeArt(c) })
  adopt(n, await svgNode(c.files.art_svg))
  if (a) { for (const i of await a.getInstancesAsync()) i.swapComponent(n); a.remove() }
  C.byName[name] = n
  return n
}
C.blankArt = async (id, o = {}) => {
  const c = C.card(id), name = 'Art/Returned/' + c.name
  let a = C.find(name)
  if (a && !o.rebuild) return a
  const n = component(name, 186, 248, { clip: false, description: `What ${c.name} leaves in the stock when the reading is returned: its heavy marks as blind grooves (${c.art.pressed_marks} pressed marks) and its gold leaf (${c.art.leaf_marks}). Opacity sits on each path, as the app strokes each mark separately. CardImages.swift:178-235; CardArt.swift:539-591.` })
  adopt(n, await svgNode(c.files.blank_art_svg))
  if (a) { for (const i of await a.getInstancesAsync()) i.swapComponent(n); a.remove() }
  C.byName[name] = n
  return n
}

// ---- the card --------------------------------------------------------------------
const typeNode = async (parent, chars, style, color, varName, place, fixedW) => {
  const t = figma.createText()
  parent.appendChild(t)
  await L.useText(t, style)
  t.characters = chars
  t.fills = [C.paint(color, varName)]
  if (fixedW) { t.textAlignHorizontal = 'CENTER'; t.textAutoResize = 'HEIGHT'; t.resize(fixedW, t.height) } else t.textAutoResize = 'WIDTH_AND_HEIGHT'
  t.x = place.x; t.y = place.y
  return t
}
const faceVariant = async (c, state) => {
  const P = C.parts, rev = state === 'Reversed'
  const v = figma.createComponent(); v.name = 'State=' + state; v.resize(226, 400); v.fills = []; v.clipsContent = true
  C.park(v)
  const st = P.stock.createInstance(); st.name = 'Stock'; v.appendChild(st); st.x = 0; st.y = 0
  st.setProperties({ [finishProp(P.stock)]: false })
  const art = (await C.art(c.id)).createInstance(); art.name = 'Art'; v.appendChild(art)
  if (rev) art.relativeTransform = [[-1, 0, 20 + 186], [0, -1, 52 + 248]]
  else { art.x = 20; art.y = 52 }
  const T = c.type[rev ? 'reversed' : 'upright']
  if (c.numeral) { const t = await typeNode(v, T.numeral.text, 'Card/Numeral', '#15110E', 'card/ink', T.numeral.figma); t.name = 'Numeral' }
  const nm = await typeNode(v, T.name.text, 'Card/Name', '#15110E', 'card/ink', T.name.figma, 182); nm.name = 'Name'
  const es = await typeNode(v, T.essence.text, 'Card/Essence', '#8C2E25', 'card/oxblood', T.essence.figma, 182); es.name = 'Essence'
  if (rev) {
    const d = figma.createVector(); d.name = 'Reversed mark'; v.appendChild(d)
    const h = 5 * Math.SQRT1_2 // half the 7.07 pt diagonal of a 5 × 5 square turned 45°
    d.vectorPaths = [{ windingRule: 'NONZERO', data: `M ${h} 0 L ${2 * h} ${h} L ${h} ${2 * h} L 0 ${h} Z` }]
    d.fills = [C.paint('#8C2E25', 'card/oxblood')]; d.strokes = []
    const [cx, cy] = T.diamond.center; d.x = cx - h; d.y = cy - h
  }
  const fi = P.finish.createInstance(); fi.name = 'Finish'; v.appendChild(fi); fi.x = 0; fi.y = 0
  return v
}
const returnedVariant = async c => {
  const P = C.parts
  const v = figma.createComponent(); v.name = 'State=Returned'; v.resize(226, 400); v.fills = []; v.clipsContent = true
  C.park(v)
  const st = P.stockReturned.createInstance(); st.name = 'Stock · Returned'; v.appendChild(st); st.x = 0; st.y = 0
  st.setProperties({ [finishProp(P.stockReturned)]: false })
  const art = (await C.blankArt(c.id)).createInstance(); art.name = 'Pressed art & leaf'; v.appendChild(art); art.x = 20; art.y = 52
  const fi = P.finish.createInstance(); fi.name = 'Finish'; v.appendChild(fi); fi.x = 0; fi.y = 0
  return v
}
C.STATES = ['Upright', 'Reversed', 'Returned']
C.makeCard = async (id, o = {}) => {
  if (!C.parts) await C.base()
  const c = C.card(id), name = 'Card/' + c.name
  const old = C.find(name)
  if (old && !o.rebuild) return old
  const vs = [await faceVariant(c, 'Upright'), await faceVariant(c, 'Reversed'), await returnedVariant(c)]
  const set = figma.combineAsVariants(vs, C.parking())
  set.name = name
  set.layoutMode = o.dir === 'h' ? 'HORIZONTAL' : 'VERTICAL'
  set.itemSpacing = o.gap == null ? 24 : o.gap
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 0
  set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO'
  set.fills = []
  set.description = `${c.numeral ? c.numeral + ' · ' : ''}${c.name} — “${c.essence}”. Upright: “${c.upright}” (${c.keys.join(', ')}). Reversed: “${c.reversed}” (${c.keys_reversed.join(', ')}). Deck.swift; face CardImages.swift:45-122, blank 198-235.`
  if (old) {
    for (const st of C.STATES) {
      const ov = old.children.find(k => k.name === 'State=' + st), nv = set.children.find(k => k.name === 'State=' + st)
      if (ov && nv) for (const i of await ov.getInstancesAsync()) i.swapComponent(nv)
    }
    const parent = old.parent, idx = parent.children.indexOf(old)
    parent.insertChild(idx, set)
    old.remove()
  }
  C.byName[name] = set
  return set
}
C.variant = (id, state = 'Upright') => {
  const set = C.find('Card/' + C.card(id).name)
  return set ? set.children.find(k => k.name === 'State=' + state) : null
}
C.instance = (id, state = 'Upright') => { const v = C.variant(id, state); if (!v) throw new Error('No card component for ' + id + ' — call makeCard first'); const i = v.createInstance(); i.name = C.card(id).name + ' · ' + state; return i }
}
