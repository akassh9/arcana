// Shared helpers for the As Above chapter. Prepend to a step:
//   node design/figma/bridge/run.mjs design/figma/build/pages/as-above-lib.js design/figma/build/pages/as-above-1.js
const AA = {}
{
  const L = S.lib
  AA.BACK = 'sky/backdrop/backdrop-composite-charge-0-1260x860.png'
  AA.MOON = [1083.6, 131.36]
  AA.GREY = '#8F96A3'
  AA.SKYBLUE = '#CCDBF5'
  AA.box = (name, w, h, o = {}) => L.frame({ name, w, h, r: o.r == null ? 10 : o.r, clip: true, fill: o.back, stroke: '#000000', strokeA: 0.08 })
  AA.put = (f, n, x = 0, y = 0) => { f.appendChild(n); n.x = x; n.y = y; return n }
  AA.cap = (title, body, src, w) => L.col([
    title ? L.text(title, 'smallStrong', { w }) : null,
    body ? L.text(body, 'small', { w }) : null,
    src ? L.source(src, { w }) : null,
  ], { gap: 4, name: 'Caption · ' + (title || '') })
  AA.fig = (node, title, body, src) => L.col([node, AA.cap(title, body, src, node.width)], { gap: 10, name: 'Figure · ' + title })
  // A 1260 × 860 render shown w wide, optionally over a backing colour or over the resting backdrop.
  AA.full = async (path, w, o = {}) => {
    const k = w / 1260, f = AA.box(o.name || 'Render · ' + path.split('/').pop(), w, Math.round(860 * k), { back: o.back })
    if (o.overSky) AA.put(f, await L.img(AA.BACK, { w, name: 'Backdrop (real render, at rest)' }))
    AA.put(f, await L.img(path, { w, name: 'Render · ' + path.split('/').pop() }))
    return f
  }
  // The sky before any answer, composed from the app's renders: the resting backdrop, tonight's moon, the near sky's
  // dust, blooms and glints at the stills' moment. The hold ring is out, as during a reading.
  AA.before = async (w) => {
    const k = w / 1260, f = AA.box('Before · the sky with no answer (composed)', w, Math.round(860 * k))
    AA.put(f, await L.img(AA.BACK, { w, name: 'Backdrop (real render, at rest)' }))
    AA.put(f, await L.img('sky/moon/moon-composite-tonight@8x.png', { w: 192 * k, name: 'Moon (real render)' }), (AA.MOON[0] - 96) * k, (AA.MOON[1] - 96) * k)
    for (const p of ['field-motes-charge-0', 'field-blooms', 'field-glints']) AA.put(f, await L.img(`sky/near/${p}-1260x860@2x.png`, { w, name: 'Near sky · ' + p }))
    return f
  }
  AA.win = async (path, w) => { const f = await L.window(path); f.rescale(w / f.width); return f }
  const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x) }
  AA.sm = sm
  AA.ramp = (x, a, b) => sm((x - a) / (b - a))
  // Keyframed curve, smoothstep in each span.
  AA.keys = (values, times) => p => {
    p = Math.max(0, Math.min(1, p))
    for (let i = 1; i < times.length; i++) if (p <= times[i]) return values[i - 1] + (values[i] - values[i - 1]) * sm((p - times[i - 1]) / (times[i] - times[i - 1]))
    return values[values.length - 1]
  }
  const vec = (parent, pts, o = {}) => {
    const v = figma.createVector(); v.name = o.name || 'Curve'
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const bx = Math.min(...xs), by = Math.min(...ys)
    v.vectorPaths = [{ windingRule: 'NONE', data: 'M ' + pts.map(p => (p[0] - bx).toFixed(1) + ' ' + (p[1] - by).toFixed(1)).join(' L ') }]
    v.strokes = [L.solid(o.color || L.C.gold, o.alpha == null ? 1 : o.alpha)]; v.strokeWeight = o.sw || 2; v.fills = []
    v.strokeCap = 'ROUND'; v.strokeJoin = 'ROUND'
    if (o.dash) v.dashPattern = o.dash
    parent.appendChild(v); v.x = bx; v.y = by
    return v
  }
  AA.vec = vec
  const txt = (parent, s, x, y, o = {}) => { const t = L.text(s, o.preset || 'code', Object.assign({ size: 11, lh: 14 }, o)); parent.appendChild(t); t.x = x; t.y = y; return t }
  AA.COL = { a: '#8F6C21', b: '#54457F', c: '#34507F', d: '#8C2E25' }
  // A timeline: lanes of curves over T seconds after the card lands face up. Each curve f(t) → 0..1 (of the lane's height).
  AA.timeline = (lanes, o = {}) => {
    const W = o.w || 2256, T = o.T || 24, LH = o.laneH || 150, X0 = 250, X1 = W - 30, top = 16
    const H = top + lanes.length * LH + 56
    const f = L.frame({ name: o.name || 'Timeline', w: W, h: H, fill: '#FFFFFF', fillA: 0.6, r: 14, stroke: L.C.stroke })
    const X = t => X0 + (X1 - X0) * t / T
    lanes.forEach((ln, i) => {
      const y0 = top + i * LH + 14, y1 = y0 + LH - 40
      const ink = figma.createRectangle(); ink.name = 'Ink writes itself (0–2.1 s)'; ink.resize(X(2.1) - X(0), y1 - y0); ink.fills = [L.solid('#E9E6E1', 0.8)]; AA.put(f, ink, X(0), y0)
      if (i === 0) txt(f, 'the card writes itself', X(0) + 6, y0 + 4, { preset: 'caption', size: 10, lh: 12, family: 'Inter', style: 'Regular' })
      vec(f, [[X(0), y1], [X(T), y1]], { color: L.C.ink, alpha: 0.3, sw: 1, name: 'Baseline' })
      vec(f, [[X(0), y0], [X(T), y0]], { color: L.C.ink, alpha: 0.18, sw: 1, dash: [3, 4], name: 'Peak line' })
      const lt = L.text(ln.label, 'smallStrong', { w: 210 }); AA.put(f, lt, 16, y0)
      if (ln.sub) { const st = L.text(ln.sub, 'caption', { w: 210 }); AA.put(f, st, 16, y0 + lt.height + 2) }
      if (ln.top) txt(f, ln.top, X(T) - 8 - ln.top.length * 6.6, y0 - 14, { alpha: 0.5 })
      for (const c of ln.curves) {
        const pts = []
        for (let t = 0; t <= T + 1e-6; t += 0.04) pts.push([X(t), y1 - (y1 - y0) * c.f(t)])
        vec(f, pts, { color: c.color, sw: c.sw || 2, dash: c.dash, name: c.name })
      }
      for (const m of (ln.marks || [])) txt(f, m.label, X(m.t) + (m.dx || 4), (m.y === 'top' ? y0 + 2 : y1 - 16) + (m.dy || 0), { alpha: 0.7, color: m.color })
      if (ln.legend) { let lx = X0; const ly = y1 + 6; for (const [c, s] of ln.legend) { vec(f, [[lx, ly + 7], [lx + 18, ly + 7]], { color: c, sw: 2.5, name: 'Key' }); const t = txt(f, s, lx + 24, ly, { alpha: 0.75 }); lx += 24 + t.width + 28 } }
    })
    const ay = top + lanes.length * LH + 4
    vec(f, [[X(0), ay], [X(T), ay]], { color: L.C.ink, alpha: 0.4, sw: 1, name: 'Axis' })
    for (let s = 0; s <= T; s++) { vec(f, [[X(s), ay], [X(s), ay + (s % 2 ? 3 : 6)]], { color: L.C.ink, alpha: 0.4, sw: 1, name: 'Tick' }); if (s % 2 === 0) txt(f, s + ' s', X(s) - 8, ay + 9, { alpha: 0.6 }) }
    txt(f, 'seconds after the card lands face up', 16, ay + 9, { preset: 'caption', family: 'Inter', style: 'Regular', size: 11 })
    return f
  }
  // A comparison table: Aspect | Upright | Reversed | Source.
  AA.compare = (rows, o = {}) => {
    const t = L.table([
      { key: 'a', label: 'Aspect', w: 180, style: 'smallStrong' }, { key: 'u', label: 'Upright', w: o.uw || 700 }, { key: 'r', label: 'Reversed', w: o.rw || 700 }, { key: 's', label: 'Source', w: o.sw || 520, style: 'code' },
    ], rows.map(r => ({ a: r[0], u: r[1], r: r[2], s: r[3] || '' })), { name: o.name || 'What changes' })
    for (const row of t.children.slice(1)) L.linkRefs(row.children[3])
    return t
  }
  // One card's board.
  AA.card = async (c) => {
    const b = L.board({ name: 'As Above · ' + c.title, kicker: 'AS ABOVE · ' + c.numeral, title: c.title, w: 2400, lead: c.lead, leadW: 1300, tags: c.tags })
    L.add(b, L.row([
      L.col([L.text('UPRIGHT', 'kicker'), L.text('“' + c.verses[0] + '”', 'voice', { w: 1000 }), L.text(c.say[0], 'small', { w: 1000 })], { gap: 6 }),
      L.col([L.text('REVERSED', 'kicker'), L.text('“' + c.verses[1] + '”', 'voice', { w: 1000 }), L.text(c.say[1], 'small', { w: 1000 })], { gap: 6 }),
    ], { gap: 128, align: 'MIN', name: 'The card’s lines' }), L.source(c.verseSrc + ' (the verse lines, verbatim)'))
    const FW = 736
    L.add(b, L.section('The sky, before and after', { lead: 'The whole sky with no cards and no words, as the app renders it. The first frame is the sky with no answer, composed in this file from the app’s own renders (backdrop, moon, near sky; the hold ring is out, as during a reading).', leadW: 1300 }))
    L.add(b, L.row([
      AA.fig(await AA.before(FW), 'Before · no answer', 'Composed from the app’s renders. Checked: away from the wheel’s lines it matches the app’s Wheel render to 0.19/255 on average.', null),
      AA.fig(await AA.full(c.after[0], FW), 'After · upright', c.afterCap[0], null),
      AA.fig(await AA.full(c.after[1], FW), 'After · reversed', c.afterCap[1], null),
    ], { gap: 24, align: 'MIN', name: 'Before and after' }))
    L.add(b, L.section('In the window', { lead: c.windowLead || 'The real window, title bar included, with the reading on the table.', leadW: 1300 }))
    const ws = []
    for (const [p, t, s] of c.windows) ws.push(AA.fig(await AA.win(p, 1104), t, s, null))
    L.add(b, L.row(ws, { gap: 48, align: 'MIN', name: 'Windows' }))
    L.add(b, L.section(c.aloneTitle || 'The part that changes, alone', { lead: c.aloneLead, leadW: 1300 }))
    L.add(b, L.row(c.alone, { gap: 24, align: 'MIN', name: 'Alone' }))
    L.add(b, L.section('How long it takes', { lead: c.timeLead, leadW: 1300 }))
    L.add(b, AA.timeline(c.lanes, { name: 'Timeline · ' + c.title, T: c.T || 24 }))
    if (c.extra) { L.add(b, L.section(c.extra.title, { lead: c.extra.lead, leadW: 1300 })); L.add(b, c.extra.node) }
    L.add(b, L.section('What changes'))
    L.add(b, AA.compare(c.rows))
    L.add(b, L.row(c.notes, { gap: 32, align: 'MIN', name: 'Notes' }))
    return b
  }
}
