// The handoff file's own layout kit, installed into S.lib by bridge/run.mjs.
// Body of an async function: figma, bytes, text, save, log and S are in scope. Returns the kit.
const L = {}

// ---------- colour -------------------------------------------------------
// The file's chrome borrows the app's first-light palette (Sources/Arcana/Palette.swift).
L.C = {
  canvas: '#ECE7DE',      // page background, a shade under pearl so boards lift off it
  board: '#F9F7F2',       // Palette.pearl
  card: '#FFFFFF',
  rule: '#DDD4C4',
  stroke: '#E4DCCD',
  ink: '#26201C',         // Palette.text
  gold: '#8F6C21',        // Palette.goldInk
  blood: '#8C2E25',       // Palette.blood
  sky: '#CCDBF5',         // Palette.skyBlue
  lilac: '#E0D7F7',       // Palette.lilac
  rose: '#FDDDDC',        // Palette.rose
  dawn: '#FFE0B0',        // Palette.dawn
  paper: '#F3EDE0',       // Palette.paper
}
L.hex = h => {
  h = String(h).replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 }
}
L.rgba = (h, a = 1) => Object.assign(L.hex(h), { a })
L.solid = (h, a = 1) => ({ type: 'SOLID', color: L.hex(h), opacity: a })
L.sleep = ms => new Promise(r => setTimeout(r, ms))

// ---------- type ---------------------------------------------------------
const FONTS = [
  ['Inter', 'Regular'], ['Inter', 'Italic'], ['Inter', 'Medium'], ['Inter', 'Semi Bold'], ['Inter', 'Bold'],
  ['Didot', 'Regular'], ['Didot', 'Italic'], ['Didot', 'Bold'],
  ['JetBrains Mono', 'Regular'], ['JetBrains Mono', 'Medium'],
]
await Promise.all(FONTS.map(([family, style]) => figma.loadFontAsync({ family, style })))
L.loadFont = (family, style) => figma.loadFontAsync({ family, style })

// Presets for the file's own words. The app's type styles are real Figma text styles (Arcana/…).
L.TS = {
  display: { family: 'Didot', style: 'Bold', size: 96, lh: 104 },
  title: { family: 'Didot', style: 'Bold', size: 56, lh: 64 },
  h1: { family: 'Didot', style: 'Bold', size: 40, lh: 48 },
  h2: { family: 'Didot', style: 'Bold', size: 28, lh: 36 },
  h3: { family: 'Inter', style: 'Semi Bold', size: 16, lh: 24 },
  kicker: { family: 'Inter', style: 'Semi Bold', size: 11, lh: 16, ls: 16, upper: true, color: '#8F6C21' },
  lead: { family: 'Inter', style: 'Regular', size: 19, lh: 30, alpha: 0.88 },
  body: { family: 'Inter', style: 'Regular', size: 15, lh: 24, alpha: 0.86 },
  bodyStrong: { family: 'Inter', style: 'Semi Bold', size: 15, lh: 24 },
  small: { family: 'Inter', style: 'Regular', size: 13, lh: 20, alpha: 0.74 },
  smallStrong: { family: 'Inter', style: 'Semi Bold', size: 13, lh: 20 },
  caption: { family: 'Inter', style: 'Regular', size: 12, lh: 18, alpha: 0.6 },
  label: { family: 'Inter', style: 'Medium', size: 12, lh: 16, alpha: 0.8 },
  voice: { family: 'Didot', style: 'Italic', size: 22, lh: 30 },       // the app's own words, quoted
  voiceSmall: { family: 'Didot', style: 'Italic', size: 17, lh: 24 },
  code: { family: 'JetBrains Mono', style: 'Regular', size: 12, lh: 18, alpha: 0.72 },
  codeStrong: { family: 'JetBrains Mono', style: 'Medium', size: 13, lh: 20 },
}

L.text = (chars, preset = 'body', o = {}) => {
  const p = Object.assign({}, L.TS[preset] || L.TS.body, o)
  const t = figma.createText()
  t.fontName = { family: p.family, style: p.style }
  t.fontSize = p.size
  t.lineHeight = p.lh ? { value: p.lh, unit: 'PIXELS' } : { unit: 'AUTO' }
  if (p.ls) t.letterSpacing = { value: p.ls, unit: 'PERCENT' }
  if (p.upper) t.textCase = 'UPPER'
  t.characters = String(chars == null ? '' : chars)
  t.fills = [L.solid(p.color || L.C.ink, p.alpha == null ? 1 : p.alpha)]
  if (p.align) t.textAlignHorizontal = p.align
  if (p.w) { t.resize(p.w, Math.max(1, t.height)); t.textAutoResize = 'HEIGHT' } else t.textAutoResize = 'WIDTH_AND_HEIGHT'
  t.name = o.name || String(chars).slice(0, 48)
  if (o.fill) L.fillW(t)
  return t
}

// Rich text: runs of [chars, preset?, overrides?] joined into one node.
L.rich = (runs, preset = 'body', o = {}) => {
  const all = runs.map(r => (typeof r === 'string' ? r : r[0])).join('')
  const t = L.text(all, preset, o)
  let i = 0
  for (const r of runs) {
    const chars = typeof r === 'string' ? r : r[0]
    if (typeof r !== 'string' && chars.length) {
      const p = Object.assign({}, L.TS[r[1] || preset], r[2] || {})
      const end = i + chars.length
      t.setRangeFontName(i, end, { family: p.family, style: p.style })
      t.setRangeFontSize(i, end, p.size)
      if (p.lh) t.setRangeLineHeight(i, end, { value: Math.max(p.lh, L.TS[preset].lh || 0), unit: 'PIXELS' })
      t.setRangeFills(i, end, [L.solid(p.color || L.C.ink, p.alpha == null ? 1 : p.alpha)])
      if (p.ls) t.setRangeLetterSpacing(i, end, { value: p.ls, unit: 'PERCENT' })
      if (p.upper) t.setRangeTextCase(i, end, 'UPPER')
    }
    i += chars.length
  }
  return t
}

// ---------- source references ------------------------------------------------
// "RootView.swift:1035-1055; Tools/shot/main.swift:85" → code text whose refs link to GitHub at the handoff's commit.
L.REPO = 'https://github.com/akassh9/arcana'
L.SHA = 'c7e12f4af78d1a7dd8cfe3ae5979e2988f91eb87'
L.srcUrl = (file, a, b) => {
  const path = file.includes('/') ? file : 'Sources/Arcana/' + file
  return `${L.REPO}/blob/${L.SHA}/${path}${a ? '#L' + a + (b ? '-L' + b : '') : ''}`
}
L.linkRefs = t => {
  const s = t.characters
  const re = /((?:[\w.-]+\/)*[\w.-]+\.swift)(?::(\d+)(?:[-–](\d+))?)?/g
  let m
  while ((m = re.exec(s))) {
    try { t.setRangeHyperlink(m.index, m.index + m[0].length, { type: 'URL', value: L.srcUrl(m[1], m[2], m[3]) }) } catch (e) {}
  }
  return t
}
L.source = (str, o = {}) => L.linkRefs(L.text(str, 'code', Object.assign({ size: 11, lh: 16, alpha: 0.55 }, o)))
L.link = (t, url, a = 0, b) => { t.setRangeHyperlink(a, b == null ? t.characters.length : b, { type: 'URL', value: url }); return t }

// ---------- frames -------------------------------------------------------
const FILL_W = new WeakSet(), FILL_H = new WeakSet()
L.fillW = n => { FILL_W.add(n); return n }
L.fillH = n => { FILL_H.add(n); return n }
const pads = p => (p == null ? [0, 0, 0, 0] : typeof p === 'number' ? [p, p, p, p] : p.length === 2 ? [p[0], p[1], p[0], p[1]] : p)

L.add = (parent, ...kids) => {
  for (const k of kids.flat()) {
    if (!k) continue
    parent.appendChild(k)
    if (parent.layoutMode && parent.layoutMode !== 'NONE') {
      if (FILL_W.has(k)) { k.layoutSizingHorizontal = 'FILL'; if (k.type === 'TEXT') k.textAutoResize = 'HEIGHT' }
      if (FILL_H.has(k)) k.layoutSizingVertical = 'FILL'
    }
  }
  return parent
}

// o: name, dir ('h'|'v'), gap, pad, fill, fillA, stroke, strokeA, sw, r, clip, w, h, align, justify, wrap, wrapGap, kids, fillW
L.frame = (o = {}) => {
  const f = figma.createFrame()
  f.name = o.name || 'Frame'
  f.fills = o.fill ? [L.solid(o.fill, o.fillA == null ? 1 : o.fillA)] : []
  if (o.stroke) { f.strokes = [L.solid(o.stroke, o.strokeA == null ? 1 : o.strokeA)]; f.strokeWeight = o.sw || 1; f.strokeAlign = 'INSIDE' }
  f.cornerRadius = o.r || 0
  f.clipsContent = !!o.clip
  if (o.dir) {
    f.layoutMode = o.dir === 'h' ? 'HORIZONTAL' : 'VERTICAL'
    f.itemSpacing = o.gap || 0
    const [pt, pr, pb, pl] = pads(o.pad)
    f.paddingTop = pt; f.paddingRight = pr; f.paddingBottom = pb; f.paddingLeft = pl
    f.counterAxisAlignItems = o.align || 'MIN'
    f.primaryAxisAlignItems = o.justify || 'MIN'
    if (o.wrap) { f.layoutWrap = 'WRAP'; f.counterAxisSpacing = o.wrapGap == null ? (o.gap || 0) : o.wrapGap }
  }
  f.resize(o.w || 100, o.h || 100)
  if (o.dir) {
    f.layoutSizingHorizontal = o.w ? 'FIXED' : 'HUG'
    f.layoutSizingVertical = o.h ? 'FIXED' : 'HUG'
  }
  if (o.kids) L.add(f, o.kids)
  if (o.fillW) L.fillW(f)
  if (o.fillH) L.fillH(f)
  return f
}
L.row = (kids, o = {}) => L.frame(Object.assign({ name: 'Row', dir: 'h', gap: 16 }, o, { kids }))
L.col = (kids, o = {}) => L.frame(Object.assign({ name: 'Column', dir: 'v', gap: 12 }, o, { kids }))
L.spacer = (w, h) => { const f = L.frame({ name: 'Spacer', w: w || 1, h: h || 1 }); return f }
L.rule = (w, o = {}) => { const r = figma.createRectangle(); r.name = 'Rule'; r.resize(w || 100, o.h || 1); r.fills = [L.solid(o.color || L.C.rule, o.alpha == null ? 1 : o.alpha)]; if (o.fill !== false && !w) L.fillW(r); return r }

// Absolute children inside an auto-layout frame.
L.abs = (parent, node, x, y) => { parent.appendChild(node); if (parent.layoutMode && parent.layoutMode !== 'NONE') node.layoutPositioning = 'ABSOLUTE'; node.x = x; node.y = y; return node }

// ---------- pages and chapters ---------------------------------------------
// Figma's Starter plan allows three pages, so the file is three pages of chapters.
// A chapter is a Figma Section on its page; chapters sit left to right in reading order.
L.PAGES = {
  'Start here': ['Cover', 'Read me first', 'Principles & provenance'],
  'Design system': ['Colour', 'Type', 'Ink, gold & materials', 'Layout', 'Motion', 'Sound', 'Components',
    'Card anatomy & back', 'Major Arcana', 'Minor Arcana', 'The words', 'Sky & moon', 'As Above'],
  'Experience & notes': ['Flow & keys', 'The room', 'The reading', "The return & the moon's door", 'Keys & Settings',
    'Edge cases & accessibility', 'Brand & icon', 'Launch film & demo', 'Agents & releases',
    'History & rejected directions', 'Open questions & issues', 'Engineering notes'],
}
L.pageOf = chapter => Object.keys(L.PAGES).find(p => L.PAGES[p].includes(chapter))
L.page = async (name, o = {}) => {
  const p = figma.root.children.find(x => x.name === name)
  if (!p) throw new Error(`No page "${name}". The file has three pages (${Object.keys(L.PAGES).join(', ')}); build into a chapter with L.chapter(name).`)
  await figma.setCurrentPageAsync(p)
  p.backgrounds = [L.solid(o.bg || L.C.canvas)]
  return p
}
// Get (or make) a chapter's section, cleared unless { clear: false }. Boards go inside it; call L.fit(section) at the end.
L.chapter = async (name, o = {}) => {
  const pageName = L.pageOf(name)
  if (!pageName) throw new Error(`Unknown chapter "${name}". Chapters: ${Object.values(L.PAGES).flat().join(' | ')}`)
  const page = await L.page(pageName)
  let s = page.children.find(n => n.type === 'SECTION' && n.name === name)
  if (!s) {
    s = figma.createSection()
    s.name = name
    page.appendChild(s)
    const others = page.children.filter(n => n !== s)
    s.x = others.length ? Math.max(...others.map(n => n.x + n.width)) + 480 : 0
    s.y = 0
    s.resizeWithoutConstraints(2000, 2000)
  }
  s.fills = [L.solid('#E4DED3', 1)]
  if (o.clear !== false) for (const c of [...s.children]) c.remove()
  return s
}
// Stack a chapter's boards and size the section around them (room at the top for the section's name).
L.fit = (section, o = {}) => {
  const pad = o.pad == null ? 120 : o.pad, top = o.top == null ? 200 : o.top
  const kids = section.children
  if (!kids.length) return section
  if (o.stack !== false) L.stack(kids, { x: pad, y: top, gap: o.gap == null ? 160 : o.gap })
  const w = Math.max(...kids.map(n => n.x + n.width)) + pad
  const h = Math.max(...kids.map(n => n.y + n.height)) + pad
  section.resizeWithoutConstraints(Math.max(w, 1200), Math.max(h, 800))
  return section
}
// Lay a page's chapters out left to right in reading order, and list them in that order in Layers.
L.arrange = async (pageName, o = {}) => {
  const page = await L.page(pageName)
  const order = L.PAGES[pageName]
  const secs = order.map(n => page.children.find(c => c.type === 'SECTION' && c.name === n)).filter(Boolean)
  let x = 0
  for (const s of secs) { s.x = x; s.y = 0; x += s.width + (o.gap || 480) }
  for (const s of [...secs].reverse()) page.appendChild(s)
  return secs.map(s => s.name)
}
L.orderPages = names => {
  let i = 0
  for (const n of names) {
    const p = figma.root.children.find(x => x.name === n)
    if (p) figma.root.insertChild(i++, p)
  }
  return figma.root.children.map(p => p.name)
}
// Lay out top-level frames in a column (or row) with even gaps.
L.stack = (nodes, o = {}) => {
  let x = o.x || 0, y = o.y || 0
  for (const n of nodes.filter(Boolean)) {
    n.x = x; n.y = y
    if (o.dir === 'h') x += n.width + (o.gap == null ? 160 : o.gap)
    else y += n.height + (o.gap == null ? 160 : o.gap)
  }
  return nodes
}

// ---------- provenance ---------------------------------------------------
// Whose decision a thing was. The designer should know what they can overturn freely.
L.CHIP = {
  akash: { label: 'Akash decided', fill: '#F6E2DF', color: '#8C2E25' },
  panel: { label: 'Design panel', fill: '#EAE4F8', color: '#54457F' },
  claude: { label: 'Claude chose', fill: '#E2E9F6', color: '#34507F' },
  lesson: { label: 'Lesson learned', fill: '#F3EAD0', color: '#7A5B17' },
  measured: { label: 'Measured', fill: '#E4EFE6', color: '#2F6140' },
  open: { label: 'Open question', fill: '#FBE9D5', color: '#8A4B12' },
  rejected: { label: 'Rejected', fill: '#EDE8E2', color: '#5E554C' },
  shipped: { label: 'Shipped', fill: '#E4EFE6', color: '#2F6140' },
  fixed: { label: 'Engineering fact', fill: '#E9E6E1', color: '#4A433D' },
}
L.chip = (kind, label) => {
  const c = L.CHIP[kind] || L.CHIP.fixed
  const t = L.text(label || c.label, 'label', { family: 'Inter', style: 'Semi Bold', size: 10, lh: 14, ls: 8, upper: true, color: c.color, alpha: 1 })
  return L.frame({ name: 'Tag · ' + (label || c.label), dir: 'h', pad: [4, 9], r: 999, fill: c.fill, kids: [t], align: 'CENTER' })
}
L.chips = (kinds, o = {}) => L.row(kinds.map(k => (Array.isArray(k) ? L.chip(k[0], k[1]) : L.chip(k))), Object.assign({ gap: 6, name: 'Tags', wrap: true }, o))

// ---------- building blocks -----------------------------------------------
// A board is one topic on a page: kicker, title, lead, then content.
L.board = (o = {}) => {
  const w = o.w || 1600
  const b = L.frame({ name: o.name || o.title || 'Board', dir: 'v', gap: o.gap == null ? 40 : o.gap, pad: o.pad == null ? 72 : o.pad, fill: o.fill || L.C.board, stroke: o.noStroke ? null : L.C.stroke, r: 24, w, clip: false })
  const head = L.col([], { name: 'Header', gap: 12, fillW: true })
  if (o.kicker) L.add(head, L.text(o.kicker, 'kicker'))
  if (o.title) L.add(head, L.text(o.title, o.titleStyle || 'title', { w: Math.min(w - 144, 1200) }))
  if (o.lead) L.add(head, L.text(o.lead, 'lead', { w: Math.min(w - 144, o.leadW || 980) }))
  if (o.tags) L.add(head, L.chips(o.tags))
  if (head.children.length) L.add(b, head)
  return b
}

// A section heading inside a board.
L.section = (title, o = {}) => {
  const c = L.col([], { name: 'Section · ' + title, gap: 8, fillW: true })
  L.add(c, L.rule(null, { color: o.ruleColor || L.C.gold, alpha: 0.35 }))
  if (o.kicker) L.add(c, L.text(o.kicker, 'kicker'))
  L.add(c, L.text(title, o.style || 'h2'))
  if (o.lead) L.add(c, L.text(o.lead, 'body', { w: o.leadW || 900 }))
  if (o.tags) L.add(c, L.chips(o.tags))
  return c
}

// A note card: optional tags, a title and body text.
L.note = (o = {}) => {
  const n = L.col([], { name: 'Note · ' + (o.title || ''), gap: 8, pad: o.pad == null ? 20 : o.pad, fill: o.fill || L.C.card, fillA: o.fillA == null ? 0.7 : o.fillA, stroke: L.C.stroke, r: 14, w: o.w || 360 })
  if (o.tags) L.add(n, L.chips(o.tags))
  if (o.title) L.add(n, L.text(o.title, o.titleStyle || 'h3', { fill: true }))
  if (o.body) L.add(n, L.text(o.body, o.bodyStyle || 'small', { fill: true }))
  if (o.voice) L.add(n, L.text(o.voice, 'voiceSmall', { fill: true }))
  if (o.source) L.add(n, L.source(o.source, { fill: true }))
  if (o.kids) L.add(n, o.kids)
  if (o.fillW) L.fillW(n)
  return n
}

// Key–value spec list.
L.specs = (pairs, o = {}) => {
  const w = o.w || 520, kw = o.keyW || 180
  const c = L.col([], { name: o.name || 'Specs', gap: 0, w })
  pairs.forEach(([k, v, src], i) => {
    const r = L.row([
      L.text(k, 'smallStrong', { w: kw }),
      L.col([L.text(v, o.valueStyle || 'small', { fill: true, alpha: 0.86 }), src ? L.source(src, { fill: true }) : null], { gap: 2, fillW: true }),
    ], { gap: 16, pad: [10, 0], name: 'Spec · ' + k, fillW: true })
    r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = i === 0 ? 1 : 0; r.strokeBottomWeight = 1; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeAlign = 'INSIDE'
    L.add(c, r)
  })
  if (o.fillW) L.fillW(c)
  return c
}

// A table: cols [{key, label, w, style}], rows [{key: value}].
L.table = (cols, rows, o = {}) => {
  const t = L.col([], { name: o.name || 'Table', gap: 0 })
  const mk = (cells, head, i) => {
    const r = L.row(cols.map((c, j) => {
      const v = cells[j]
      if (v && typeof v === 'object' && v.type) return v    // a node
      return L.text(v == null ? '' : v, head ? 'kicker' : (c.style || 'small'), { w: c.w, alpha: head ? 1 : (c.alpha == null ? 0.86 : c.alpha), color: head ? L.C.gold : undefined })
    }), { gap: o.gap || 20, pad: [head ? 8 : 10, 12], name: head ? 'Header row' : 'Row ' + i, align: 'MIN' })
    r.fills = !head && o.zebra && i % 2 ? [L.solid('#FFFFFF', 0.5)] : []
    r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; r.strokeAlign = 'INSIDE'
    return r
  }
  L.add(t, mk(cols.map(c => c.label), true, 0))
  rows.forEach((row, i) => L.add(t, mk(cols.map(c => (Array.isArray(row) ? row[cols.indexOf(c)] : row[c.key])), false, i + 1)))
  return t
}

L.bullets = (items, o = {}) => L.col(items.map(it => L.row([
  L.text(o.mark || '—', o.style || 'body', { alpha: 0.4 }),
  typeof it === 'string' ? L.text(it, o.style || 'body', { w: (o.w || 800) - 28 }) : it,
], { gap: 10, name: 'Bullet' })), { gap: o.gap || 8, name: o.name || 'Bullets' })

// A colour swatch.
L.swatch = (o = {}) => {
  const w = o.w || 232
  const block = figma.createRectangle()
  block.name = 'Swatch'
  block.resize(w, o.h || 120)
  block.cornerRadius = 12
  block.fills = o.paints || [L.solid(o.hex, o.alpha == null ? 1 : o.alpha)]
  block.strokes = [L.solid('#000000', 0.06)]; block.strokeWeight = 1; block.strokeAlign = 'INSIDE'
  if (o.styleId) block.fillStyleId = o.styleId
  const c = L.col([block], { name: 'Colour · ' + (o.name || o.hex), gap: 6, w })
  L.add(c, L.text(o.name || '', 'h3', { w }))
  if (o.value) L.add(c, L.text(o.value, 'codeStrong', { w, size: 12, lh: 18 }))
  if (o.usage) L.add(c, L.text(o.usage, 'small', { w }))
  if (o.source) L.add(c, L.source(o.source, { w }))
  if (o.tags) L.add(c, L.chips(o.tags))
  return c
}

// ---------- assets ---------------------------------------------------------
// Assets are served from design/figma/assets. PNGs are @2x unless o.scale says otherwise.
S.img = S.img || {}
L.img = async (path, o = {}) => {
  let rec = S.img[path]
  if (!rec || o.fresh) {
    const b = await bytes(path)
    const im = figma.createImage(b)
    rec = { hash: im.hash, size: await im.getSizeAsync() }
    S.img[path] = rec
  }
  const scale = o.scale || 2
  let w = o.w, h = o.h
  if (w && !h) h = w * rec.size.height / rec.size.width
  else if (h && !w) w = h * rec.size.width / rec.size.height
  else if (!w && !h) { w = rec.size.width / scale; h = rec.size.height / scale }
  const r = figma.createRectangle()
  r.name = o.name || path.split('/').pop()
  r.resize(Math.max(1, w), Math.max(1, h))
  r.fills = [{ type: 'IMAGE', imageHash: rec.hash, scaleMode: o.mode || 'FILL' }]
  if (o.r) r.cornerRadius = o.r
  if (o.stroke) { r.strokes = [L.solid(o.stroke, o.strokeA == null ? 1 : o.strokeA)]; r.strokeWeight = 1; r.strokeAlign = 'INSIDE' }
  if (o.shadow) r.effects = [{ type: 'DROP_SHADOW', color: { r: 0.15, g: 0.12, b: 0.08, a: 0.14 }, offset: { x: 0, y: 12 }, radius: 36, spread: 0, visible: true, blendMode: 'NORMAL' }]
  if (o.fillW) L.fillW(r)
  return r
}
L.svg = async (path, o = {}) => {
  const s = await text(path)
  const n = figma.createNodeFromSvg(s)
  n.name = o.name || path.split('/').pop().replace(/\.svg$/, '')
  if (o.w) n.rescale(o.w / n.width)
  else if (o.h) n.rescale(o.h / n.height)
  n.clipsContent = false
  return n
}
L.json = async path => JSON.parse(await text(path))

// An image with a caption under it.
L.figure = async (path, o = {}) => {
  const im = await L.img(path, o)
  const c = L.col([im], { name: 'Figure · ' + (o.title || path), gap: 10, w: o.w ? undefined : undefined })
  if (o.title) L.add(c, L.text(o.title, 'smallStrong', { w: im.width }))
  if (o.caption) L.add(c, L.text(o.caption, 'caption', { w: im.width }))
  if (o.tags) L.add(c, L.chips(o.tags))
  return c
}

// Numbered pins over an image, with a legend beside it.
L.pin = n => {
  const c = L.frame({ name: 'Pin ' + n, dir: 'h', w: 26, h: 26, r: 13, fill: L.C.blood, align: 'CENTER', justify: 'CENTER' })
  L.add(c, L.text(String(n), 'label', { family: 'Inter', style: 'Bold', size: 12, lh: 14, color: '#FFFFFF', alpha: 1 }))
  c.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.18 }, offset: { x: 0, y: 2 }, radius: 6, spread: 0, visible: true, blendMode: 'NORMAL' }]
  return c
}
// pins: [{x, y, label, body}] in the image's point space (x, y from its top left).
L.annotated = async (path, pins, o = {}) => {
  const im = await L.img(path, o)
  const holder = L.frame({ name: 'Annotated · ' + (o.title || path), w: im.width, h: im.height, clip: false })
  holder.appendChild(im)
  pins.forEach((p, i) => { const pn = L.pin(i + 1); holder.appendChild(pn); pn.x = p.x - 13; pn.y = p.y - 13 })
  const legend = L.col(pins.map((p, i) => L.row([L.pin(i + 1), L.col([L.text(p.label, 'smallStrong', { w: (o.legendW || 380) - 40 }), p.body ? L.text(p.body, 'small', { w: (o.legendW || 380) - 40 }) : null, p.source ? L.source(p.source, { w: (o.legendW || 380) - 40 }) : null], { gap: 2 })], { gap: 12, align: 'MIN' })), { gap: 14, w: o.legendW || 380, name: 'Legend' })
  const r = L.row([holder, legend], { gap: 40, name: 'Annotated screen · ' + (o.title || path) })
  return r
}

// Straight arrow as a vector (x1,y1 → x2,y2) in the parent's space.
L.arrow = (parent, x1, y1, x2, y2, o = {}) => {
  const v = figma.createVector()
  v.name = o.name || 'Arrow'
  v.vectorNetwork = { vertices: [{ x: 0, y: 0 }, { x: x2 - x1, y: y2 - y1, strokeCap: 'ARROW_LINES' }], segments: [{ start: 0, end: 1 }], regions: [] }
  v.strokes = [L.solid(o.color || L.C.ink, o.alpha == null ? 0.55 : o.alpha)]
  v.strokeWeight = o.sw || 1.5
  if (o.dash) v.dashPattern = o.dash
  parent.appendChild(v)
  if (parent.layoutMode && parent.layoutMode !== 'NONE') v.layoutPositioning = 'ABSOLUTE'
  v.x = Math.min(x1, x2); v.y = Math.min(y1, y2)
  return v
}

// ---------- real styles, variables and components --------------------------
L.paintStyle = async (name, paints, description) => {
  const all = await figma.getLocalPaintStylesAsync()
  let s = all.find(x => x.name === name)
  if (!s) { s = figma.createPaintStyle(); s.name = name }
  s.paints = paints
  if (description != null) s.description = description
  return s
}
L.textStyle = async (name, p, description) => {
  const all = await figma.getLocalTextStylesAsync()
  let s = all.find(x => x.name === name)
  if (!s) { s = figma.createTextStyle(); s.name = name }
  await figma.loadFontAsync({ family: p.family, style: p.style })
  s.fontName = { family: p.family, style: p.style }
  s.fontSize = p.size
  s.lineHeight = p.lh ? { value: p.lh, unit: 'PIXELS' } : { unit: 'AUTO' }
  s.letterSpacing = p.lsPx != null ? { value: p.lsPx, unit: 'PIXELS' } : { value: p.ls || 0, unit: 'PERCENT' }
  s.textCase = p.upper ? 'UPPER' : 'ORIGINAL'
  if (description != null) s.description = description
  return s
}
L.effectStyle = async (name, effects, description) => {
  const all = await figma.getLocalEffectStylesAsync()
  let s = all.find(x => x.name === name)
  if (!s) { s = figma.createEffectStyle(); s.name = name }
  s.effects = effects
  if (description != null) s.description = description
  return s
}
L.collection = async name => {
  const all = await figma.variables.getLocalVariableCollectionsAsync()
  return all.find(c => c.name === name) || figma.variables.createVariableCollection(name)
}
L.variable = async (collection, name, type, value, o = {}) => {
  const vars = await figma.variables.getLocalVariablesAsync(type)
  let v = vars.find(x => x.name === name && x.variableCollectionId === collection.id)
  if (!v) v = figma.variables.createVariable(name, collection, type)
  v.setValueForMode(collection.modes[0].modeId, value)
  if (o.description != null) v.description = o.description
  if (o.scopes) v.scopes = o.scopes
  if (o.code) v.setVariableCodeSyntax('iOS', o.code)
  return v
}
L.styleByName = async (kind, name) => {
  const get = { paint: 'getLocalPaintStylesAsync', text: 'getLocalTextStylesAsync', effect: 'getLocalEffectStylesAsync' }[kind]
  return (await figma[get]()).find(s => s.name === name) || null
}
// Apply one of the file's text styles (Arcana/…) to a node.
L.useText = async (node, styleName) => { const s = await L.styleByName('text', styleName); if (s) await node.setTextStyleIdAsync(s.id); return node }
L.useFill = async (node, styleName) => { const s = await L.styleByName('paint', styleName); if (s) await node.setFillStyleIdAsync(s.id); return node }

// Find a component (or component set) anywhere in the file by name; remembered once found.
S.comp = S.comp || {}
L.component = name => {
  const id = S.comp[name]
  const hit = id && figma.getNodeById(id)
  if (hit && !hit.removed) return hit
  const n = figma.root.findOne(x => (x.type === 'COMPONENT' || x.type === 'COMPONENT_SET') && x.name === name)
  if (n) S.comp[name] = n.id
  return n || null
}

// A window frame: a render at its point size, 16 pt corners (macOS 26), the Window/Title bar on top
// (for real-window renders from shots-window/ and surfaces/window/, or with { chrome: true }), and a soft shadow.
L.window = async (path, o = {}) => {
  const im = await L.img(path, { scale: o.scale || 2, name: 'Render · ' + path.split('/').pop().replace(/\.png$/, '') })
  const f = L.frame({ name: o.name || 'Window · ' + path.split('/').pop().replace(/\.png$/, ''), w: im.width, h: im.height, r: o.r == null ? 16 : o.r, clip: true })
  f.appendChild(im); im.x = 0; im.y = 0
  const real = /shots-window\/|surfaces\/window\//.test(path)
  const set = (o.chrome === true || (o.chrome !== false && real)) ? L.component('Window/Title bar') : null
  if (set) {
    const v = set.children.find(c => c.name === 'State=' + (o.inactive ? 'Inactive' : 'Active')) || set.children[0]
    const inst = v.createInstance()
    f.appendChild(inst); inst.x = 0; inst.y = 0; inst.resize(im.width, 32)
    inst.name = 'Title bar'
  }
  f.effects = o.shadow === false ? [] : [{ type: 'DROP_SHADOW', color: { r: 0.18, g: 0.14, b: 0.1, a: 0.16 }, offset: { x: 0, y: 16 }, radius: 44, spread: 0, visible: true, blendMode: 'NORMAL' }]
  if (o.fillW) L.fillW(f)
  return f
}

// ---------- output ---------------------------------------------------------
// Export a node to design/figma/out/<path> (PNG). Images need a moment to decode first.
L.snap = async (node, path, o = {}) => {
  await L.sleep(o.wait == null ? 1500 : o.wait)
  const png = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: o.scale || 0.5 } })
  await save(path, png)
  return { path, bytes: png.length, w: Math.round(node.width), h: Math.round(node.height) }
}
L.snapPage = async (page, dir, o = {}) => {
  const out = []
  for (const n of page.children) out.push(await L.snap(n, dir + '/' + n.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.png', Object.assign({ wait: out.length ? 200 : 1500 }, o)))
  return out
}
L.snapChapter = L.snapPage

return L
