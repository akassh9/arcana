// Shared helpers for the Components chapter (installed into S.cl). Prepend to each step:
//   node design/figma/bridge/run.mjs design/figma/build/pages/components-lib.js design/figma/build/pages/components-1.js
{
const L = S.lib
const CL = {}
CL.G = 'glyphs/'
// Board order in the chapter: the header first, then the Window chrome board (made once by
// components-window.js and kept, since every screen in the file instances its Window/Title bar).
CL.ORDER = ['Components · Library', 'Components · Window chrome', 'Components · Room glyphs', 'Components · The keys',
  'Components · Choosing & drawing', 'Components · Thread & light', 'Components · Suits & motifs', 'Components · Courts & the pen']

CL.start = async boards => {
  const sec = await L.chapter('Components', { clear: false })
  for (const n of [...sec.children]) if (boards.includes(n.name)) n.remove()
  return sec
}
CL.finish = async sec => {
  const rank = n => { const i = CL.ORDER.indexOf(n.name); return i < 0 ? 99 : i }
  const kids = [...sec.children].sort((a, b) => rank(a) - rank(b))
  kids.forEach((k, i) => sec.insertChild(i, k))
  // SVG imports name every path "Vector"; say what each one is
  for (const k of kids) if (k.name !== 'Components · Window chrome') for (const v of k.findAll(n => n.type === 'VECTOR' && n.name === 'Vector')) {
    const filled = Array.isArray(v.fills) && v.fills.some(f => f.visible !== false), stroked = v.strokes.length > 0 && v.strokeWeight > 0
    v.name = filled && stroked ? 'Mark' : filled ? 'Fill' : 'Stroke'
  }
  L.fit(sec)
  await L.arrange('Design system')
}

// ---- tokens in the file ----
CL.vars = (await figma.variables.getLocalVariablesAsync('COLOR')).map(v => ({ v, c: Object.values(v.valuesByMode)[0] })).filter(x => x.c && x.c.r != null)
CL.varByName = name => { const x = CL.vars.find(x => x.v.name === name); if (!x) throw new Error('No variable ' + name); return x }
CL.paint = name => { const { v, c } = CL.varByName(name); return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a == null ? 1 : c.a }, 'color', v) }
const close = (a, b, t) => Math.abs(a - b) < t
CL.match = (col, a) => CL.vars.find(({ c }) => close(c.r, col.r, 0.003) && close(c.g, col.g, 0.003) && close(c.b, col.b, 0.003) && close(c.a == null ? 1 : c.a, a, 0.006))
// Bind every solid ink in a node to the Arcana colour variable of the same value, where there is one.
CL.bound = 0
CL.bind = node => {
  const all = [node, ...(node.findAll ? node.findAll(() => true) : [])]
  for (const x of all) for (const key of ['fills', 'strokes']) {
    if (!(key in x) || x[key] === figma.mixed || !x[key].length) continue
    let changed = false
    const ps = x[key].map(p => {
      if (p.type !== 'SOLID') return p
      const m = CL.match(p.color, p.opacity == null ? 1 : p.opacity)
      if (!m) return p
      changed = true; CL.bound++
      return figma.variables.setBoundVariableForPaint(p, 'color', m.v)
    })
    if (changed) x[key] = ps
  }
  return node
}
CL.fxCache = {}
CL.fx = async name => { if (!CL.fxCache[name]) { const s = await L.styleByName('effect', name); if (!s) throw new Error('No effect style ' + name); CL.fxCache[name] = s } return CL.fxCache[name] }
CL.glow = async (node, name) => { await node.setEffectStyleIdAsync((await CL.fx(name)).id); return node }
CL.txCache = {}
CL.style = async (node, name) => {
  if (!CL.txCache[name]) { const s = await L.styleByName('text', name); if (!s) throw new Error('No text style ' + name); CL.txCache[name] = s }
  await node.setTextStyleIdAsync(CL.txCache[name].id)
  return node
}
// Native type set in one of the file's Arcana text styles.
CL.type = async (chars, style, fillVar, o = {}) => {
  const t = figma.createText()
  t.fontName = { family: 'Didot', style: 'Regular' }
  t.characters = chars
  await CL.style(t, style)
  if (o.font) t.fontName = o.font
  t.fills = [CL.paint(fillVar)]
  t.name = o.name || chars
  if (o.w) { t.textAutoResize = 'NONE'; t.resize(o.w, o.h || 15); t.textAlignHorizontal = o.align || 'CENTER'; t.textAlignVertical = 'CENTER' }
  else t.textAutoResize = 'WIDTH_AND_HEIGHT'
  return t
}

CL.url = src => {
  const m = /((?:[\w.-]+\/)*[\w.-]+\.swift)(?::(\d+)(?:[-–](\d+))?)?/.exec(src || '')
  return m ? L.srcUrl(m[1], m[2], m[3]) : L.REPO
}
CL.doc = (node, desc, src) => {
  if (desc) node.description = desc
  if (src) { try { node.documentationLinks = [{ uri: CL.url(src) }] } catch (e) { log('doc link: ' + e) } }
  return node
}

// A component made from one of the glyph SVGs (the app's own marks, converted path by path).
CL.comp = async (file, name, o = {}) => {
  const n = await L.svg(/^(sky|surfaces|glyphs|cards)\//.test(file) ? file : CL.G + file, { name })
  n.fills = []
  n.clipsContent = false
  const c = figma.createComponentFromNode(n)
  c.name = name
  c.fills = []
  c.clipsContent = false
  CL.bind(c)
  // a shadow on a fill-less frame casts nothing, so the glow goes on the marks themselves
  if (o.glow) for (const k of c.children) await CL.glow(k, o.glow)
  if (o.desc) c.description = o.desc
  return c
}

// Combine components as variants and lay them out on a grid, each with a label under it.
// items: [{ c, label, sub }]; o.rows: [[item, …], …] or o.cols; o.colW: minimum column width.
CL.grid = (items, name, o = {}) => {
  const pad = o.pad == null ? 24 : o.pad, gap = o.gap == null ? 32 : o.gap, rowGap = o.rowGap == null ? 24 : o.rowGap
  const lab = o.labels !== false
  const labH = lab ? (items.some(i => i.sub) ? 46 : 28) : 0
  const holder = L.frame({ name: name + ' · masters' })
  const set = figma.combineAsVariants(items.map(i => i.c), holder)
  set.name = name
  set.fills = []
  set.cornerRadius = 8
  let rows = o.rows
  if (!rows) { rows = []; const k = o.cols || items.length; for (let i = 0; i < items.length; i += k) rows.push(items.slice(i, i + k)) }
  const labels = []
  let y = pad, maxW = 0
  for (const row of rows) {
    const rowH = Math.max(...row.map(it => it.c.height))
    let x = pad
    for (const it of row) {
      const w = Math.max(it.c.width, o.colW || 0)
      it.c.x = x + (w - it.c.width) / 2
      it.c.y = y + (o.valign === 'top' ? 0 : o.valign === 'bottom' ? rowH - it.c.height : (rowH - it.c.height) / 2)
      if (lab && it.label) labels.push([it, x, y + rowH + 10, w])
      x += w + gap
    }
    maxW = Math.max(maxW, x - gap + pad)
    y += rowH + labH + rowGap
  }
  const H = y - rowGap + pad - (lab ? 0 : 0)
  set.resizeWithoutConstraints(Math.max(1, maxW), Math.max(1, H))
  holder.resize(set.width, set.height)
  for (const [it, x, ly, w] of labels) {
    const t = L.text(it.label, 'label', { w: Math.max(w, 60), align: 'CENTER' })
    holder.appendChild(t); t.x = x - (Math.max(w, 60) - w) / 2; t.y = ly
    if (it.sub) { const s = L.text(it.sub, 'caption', { w: Math.max(w, 60), align: 'CENTER' }); holder.appendChild(s); s.x = t.x; s.y = ly + 18 }
  }
  if (o.desc || o.src) CL.doc(set, o.desc, o.src)
  return { holder, set }
}

// Standalone components (not variants) in a row, each labelled; returns the holder.
CL.shelf = (items, name, o = {}) => {
  const tiles = items.map(it => L.col([
    L.frame({ name: 'Master', dir: 'h', align: 'CENTER', justify: 'CENTER', w: Math.max(it.c.width, o.colW || 0), h: o.h || it.c.height, kids: [it.c] }),
    it.label ? L.text(it.label, 'label', { w: Math.max(it.c.width, o.colW || 0), align: 'CENTER' }) : null,
  ], { name: 'Master · ' + it.c.name, gap: 10, align: 'CENTER' }))
  return L.row(tiles, { name, gap: o.gap == null ? 24 : o.gap, pad: o.pad == null ? 0 : o.pad, align: 'MIN', wrap: !!o.w, w: o.w })
}

// Enlarged instances of each variant, for reading the detail; the masters stay at 1×.
CL.previews = (items, o = {}) => {
  const k = o.k || 4
  const insts = items.map(it => { const i = it.c.createInstance(); if (k !== 1) i.rescale(k); i.name = 'Preview · ' + (it.label || it.c.name); return i })
  const boxH = o.h || Math.max(...insts.map(i => i.height))
  const tiles = items.map((it, j) => {
    const w = Math.max(insts[j].width, o.colW || 0)
    const art = L.frame({ name: 'Art', w, h: boxH })
    art.appendChild(insts[j]); insts[j].x = (w - insts[j].width) / 2; insts[j].y = (boxH - insts[j].height) / 2
    return L.col([art, it.label ? L.text(it.label, 'label', { w: Math.max(w, 72), align: 'CENTER' }) : null,
      it.sub ? L.text(it.sub, 'caption', { w: Math.max(w, 72), align: 'CENTER' }) : null], { name: 'Preview · ' + (it.label || ''), gap: 8, align: 'CENTER' })
  })
  if (o.extra) tiles.push(...o.extra)
  return L.row(tiles, { name: 'Previews ×' + k, gap: o.gap == null ? 32 : o.gap, align: 'MIN', wrap: !!o.w, w: o.w, wrapGap: 24 })
}
// An app render beside the previews, labelled as such.
CL.render = async (path, label, o = {}) => {
  const im = await L.img(path, { scale: o.scale || 3, w: o.w, h: o.h, name: 'App render · ' + label, r: 8, stroke: '#000000', strokeA: 0.06 })
  return L.col([L.frame({ name: 'Art', dir: 'h', align: 'CENTER', justify: 'CENTER', w: im.width, h: o.boxH || im.height, kids: [im] }),
    L.text(label, 'label', { w: Math.max(im.width, 80), align: 'CENTER' }), o.sub ? L.text(o.sub, 'caption', { w: Math.max(im.width, 80), align: 'CENTER' }) : null], { name: 'App render · ' + label, gap: 8, align: 'CENTER' })
}

// Stage backgrounds: the real sky (the room's parts sit on it) or the card's paper (the card's parts).
CL.SKY = 'sky/backdrop/backdrop-composite-charge-0-940x660.png'
CL.bg = async kind => {
  if (kind === 'sky') { if (!S.img[CL.SKY]) (await L.img(CL.SKY)).remove(); return [{ type: 'IMAGE', imageHash: S.img[CL.SKY].hash, scaleMode: 'FILL' }] }
  if (kind === 'paper') return [CL.paint('card/paper')]
  if (kind === 'blue') return [CL.paint('sky/blue')]
  return [L.solid('#F3EFE7')]
}
CL.cap = (s, o = {}) => L.text(s, 'caption', Object.assign({ alpha: 0.7 }, o))
CL.stage = async (kids, o = {}) => {
  const st = L.frame({ name: 'Stage', dir: 'v', gap: o.gap == null ? 28 : o.gap, pad: o.pad == null ? 32 : o.pad, r: 12, clip: true, align: o.align || 'MIN' })
  st.fills = await CL.bg(o.bg || 'sky')
  L.add(st, kids)
  return st
}
// A component card: the stage (previews, masters) and, beside it, what it is, its specs, source and provenance.
CL.card = async o => {
  const infoW = o.infoW || 420
  const stage = await CL.stage(o.stage, o)
  const head = [
    L.text(o.name, 'codeStrong', { size: 17, lh: 24, alpha: 1, w: infoW, name: 'Component name' }),
    o.what ? L.text(o.what, 'small', { w: infoW, alpha: 0.86 }) : null,
  ]
  const specs = o.specs ? L.specs(o.specs, { w: infoW, keyW: 88 }) : null
  const tags = o.tags ? L.chips(o.tags, { w: infoW }) : null
  let info
  if (o.stack) {
    info = L.row([L.col([...head, tags], { gap: 12, w: infoW, name: 'About' }), specs ? L.fillW(specs) : null], { gap: 48, name: 'About · ' + o.name, fillW: true })
  } else info = L.col([...head, specs, tags], { name: 'About · ' + o.name, gap: 16, w: infoW })
  const card = L.frame({ name: 'Component · ' + o.name, dir: o.stack ? 'v' : 'h', gap: o.stack ? 32 : 40, pad: 32, fill: '#FFFFFF', fillA: 0.72, stroke: L.C.stroke, r: 18, fillW: !o.w, w: o.w })
  if (o.stack) L.add(card, info, o.stageFill === false ? stage : L.fillW(stage)); else L.add(card, L.fillW(stage), info)
  return card
}
CL.masters = (node, note) => L.col([CL.cap(note || 'Masters · 1×'), node], { name: 'Masters', gap: 10 })
CL.rowOf = (kids, o = {}) => L.row(kids, Object.assign({ gap: 48, align: 'MIN', name: 'Row' }, o))

S.cl = CL
}
