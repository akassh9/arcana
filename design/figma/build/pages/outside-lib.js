// Helpers for the three "outside the app" chapters: Brand & icon, Launch film & demo, Agents & releases.
// Run first in the same bridge call:  node run.mjs pages/outside-lib.js pages/<step>.js
{
  const L = S.lib
  const O = {}
  // ---- sources that aren't Swift: link any repo path (build.sh, README.md, agent/worker.js, film/arcana.html …)
  O.BARE = { 'build.sh': 'build.sh', 'README.md': 'README.md', 'worker.js': 'agent/worker.js', 'core.js': 'film/core.js',
    'arcana.html': 'film/arcana.html', 'make.sh': 'film/make.sh', 'score.mjs': 'film/score.mjs', 'wrangler.toml': 'agent/wrangler.toml',
    'deploy.sh': 'agent/deploy.sh', 'deck.json': 'agent/deck.json' }
  O.TOP = /^(Sources|Tools|agent|film|docs|Assets)\//
  O.url = (p, a, b) => `${L.REPO}/blob/${L.SHA}/${p}${a ? '#L' + a + (b ? '-L' + b : '') : ''}`
  O.linkAll = t => {
    const s = t.characters
    const re = /((?:[\w.-]+\/)*[\w.-]+\.(?:swift|sh|md|js|mjs|html|toml|json|png|mp4))(?::(\d+)(?:[-–](\d+))?)?/g
    let m
    while ((m = re.exec(s))) {
      let p = m[1]
      if (s[m.index - 1] === '/' || s[m.index - 1] === '~') continue
      if (!p.includes('/')) p = O.BARE[p] || (p.endsWith('.swift') ? 'Sources/Arcana/' + p : null)
      if (!p || !(O.TOP.test(p) || Object.values(O.BARE).includes(p)) || /^film\/out\//.test(p)) continue
      try { t.setRangeHyperlink(m.index, m.index + m[0].length, { type: 'URL', value: O.url(p, m[2], m[3]) }) } catch (e) {}
    }
    return t
  }
  O.src = (str, o = {}) => O.linkAll(L.text(str, 'code', Object.assign({ size: 11, lh: 16, alpha: 0.55 }, o)))
  O.url2 = (t, url, sub) => { const i = sub ? t.characters.indexOf(sub) : 0; if (i >= 0) L.link(t, url, i, sub ? i + sub.length : undefined); return t }

  // ---- the chapter header (first board)
  O.header = (chapter, lead, items, notes) => {
    const b = L.board({ name: chapter + ' · Header', kicker: 'OUTSIDE THE APP', title: chapter, lead, w: 1600 })
    L.add(b, L.rich([['In this chapter   ', 'smallStrong'], [items.join('  ·  '), 'small']], 'small', { w: 1456, name: 'In this chapter' }))
    if (notes && notes.length) L.add(b, L.row(notes, { gap: 24, align: 'MIN', name: 'Notes' }))
    return b
  }
  // a board with the usual head (kicker, h1 title, lead, tags)
  O.board = (chapter, title, o = {}) => L.board(Object.assign({ name: chapter + ' · ' + title, kicker: o.kicker || chapter.toUpperCase(), title, titleStyle: 'h1', w: o.w || 1600 }, o))

  // ---- someone's words (not the app's): Inter italic with a rule, who and when underneath
  O.quote = (q, o = {}) => {
    const w = o.w || 520
    const bar = figma.createRectangle(); bar.name = 'Rule'; bar.resize(3, 20); bar.fills = [L.solid(o.color || L.C.blood, 0.55)]
    const body = L.col([
      L.text('“' + q + '”', 'body', { family: 'Inter', style: 'Italic', size: o.size || 17, lh: o.lh || 26, w: w - 23, alpha: 0.9 }),
      o.who ? L.text(o.who, 'caption', { w: w - 23, alpha: 0.7 }) : null,
      o.tags ? L.chips(o.tags) : null,
    ], { gap: 8, name: 'Quote body' })
    const r = L.row([bar, body], { gap: 20, name: 'Quote · ' + q.slice(0, 40) })
    bar.layoutSizingVertical = 'FILL'
    return r
  }
  // monospace block (plain text as an agent or a terminal sees it)
  O.mono = (str, o = {}) => {
    const t = L.text(str, 'code', { size: o.size || 14, lh: o.lh || 22, alpha: 0.9, w: o.w ? o.w - 2 * (o.pad || 24) : undefined, name: o.name || 'Plain text' })
    return L.col([t], { name: o.frameName || 'Text · ' + (o.name || str.slice(0, 30)), pad: o.pad || 24, fill: o.fill || '#FFFFFF', fillA: 1, stroke: L.C.stroke, r: 12, w: o.w })
  }

  // ---- colour variables
  O.vars = null
  O.variable = async name => { if (!O.vars) O.vars = await figma.variables.getLocalVariablesAsync('COLOR'); return O.vars.find(x => x.name === name) || null }
  O.varHex = async name => {
    const v = await O.variable(name); if (!v) return null
    const c = v.valuesByMode[Object.keys(v.valuesByMode)[0]]
    const h = x => Math.round(x * 255).toString(16).padStart(2, '0').toUpperCase()
    return '#' + h(c.r) + h(c.g) + h(c.b) + (c.a != null && c.a < 0.995 ? ' · ' + Math.round(c.a * 100) + '%' : '')
  }
  // a swatch bound to an Arcana colour variable (o.varName); o.hex is only the fallback
  O.swatch = async (o = {}) => {
    let value = o.value
    if (o.varName) { const hx = await O.varHex(o.varName); if (hx) value = (o.valuePrefix || '') + hx + '  ' + o.varName }
    const s = L.swatch(Object.assign({}, o, { hex: o.hex || '#000000', value, source: null }))
    if (o.varName) {
      const v = await O.variable(o.varName)
      if (v) { const rect = s.children[0]; rect.fills = [figma.variables.setBoundVariableForPaint(L.solid(o.hex || '#000000'), 'color', v)] }
    }
    if (o.source) L.add(s, O.src(o.source, { w: o.w || 232 }))
    return s
  }

  // ---- pictures
  O.fig = async (path, o = {}) => {
    const im = await L.img(path, o)
    let pic = im
    if (o.frame) {  // put the picture on a card so its edge shows on the pearl board
      pic = L.frame({ name: 'Mount · ' + (o.title || path.split('/').pop()), w: im.width, h: im.height, r: o.r || 0, clip: true, fill: o.frameFill, stroke: o.frameStroke === false ? null : L.C.stroke })
      pic.appendChild(im); im.x = 0; im.y = 0
    }
    const w = im.width
    const c = L.col([pic], { name: 'Figure · ' + (o.title || path.split('/').pop()), gap: 8 })
    if (o.title) L.add(c, L.text(o.title, 'smallStrong', { w }))
    if (o.caption) L.add(c, L.text(o.caption, 'caption', { w, alpha: 0.72 }))
    if (o.source) L.add(c, O.src(o.source, { w }))
    if (o.tags) L.add(c, L.chips(o.tags))
    return c
  }
  // a strong callout (an open question the designer must answer)
  O.callout = (o = {}) => {
    const n = L.col([], { name: 'Callout · ' + (o.title || ''), gap: 12, pad: 32, fill: o.fill || '#FBE9D5', fillA: 1, stroke: '#E9C9A2', r: 18, w: o.w || 700 })
    if (o.tags) L.add(n, L.chips(o.tags))
    if (o.title) L.add(n, L.text(o.title, 'h2', { fill: true }))
    if (o.body) L.add(n, L.text(o.body, 'body', { fill: true }))
    if (o.kids) L.add(n, o.kids)
    return n
  }

  // ---- keep a chapter's boards in reading order (steps that rebuild a middle board append it at the end)
  O.order = (sec, chapter, names) => {
    for (const nm of names) { const n = sec.children.find(c => c.name === chapter + ' · ' + nm); if (n) sec.appendChild(n) }
  }
  // ---- export every board of a chapter
  O.snap = async (sec, slug, scale = 0.3, only) => {
    const out = []
    for (const b of sec.children) {
      if (only && !only.includes(b.name)) continue
      const f = 'pages/' + slug + '/' + b.name.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() + '.png'
      out.push(await L.snap(b, f, { scale, wait: out.length ? 300 : 2000 }))
    }
    return out
  }
  S.out = O
}
