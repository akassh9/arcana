// Helpers for the chapters Layout, Motion and Sound (builder foundations-b). Sets S.fb.
// Run it before any of layout-*.js, motion-*.js, sound-*.js:
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-b-lib.js design/figma/build/pages/layout-1.js
{
const L = S.lib
const F = {}
F.RED = '#C8323A'      // redlines: a clear red, so guides never read as part of the app
F.BLUE = '#2F5E9E'     // x guides and secondary marks
F.intro = items => L.rich([['In this chapter   ', 'smallStrong'], [items.join('  ·  '), 'small']], 'small', { w: 1400, name: 'In this chapter' })
F.mono = (s, o = {}) => L.text(s, 'code', Object.assign({ size: 11, lh: 16, alpha: 0.78 }, o))
F.fmt = (v, d = 1) => (typeof v === 'number' ? (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(d)) : String(v))

// A polyline (or polygon) vector at absolute coordinates in a non-auto-layout parent.
F.poly = (parent, pts, o = {}) => {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const x0 = Math.min(...xs), y0 = Math.min(...ys)
  const v = figma.createVector()
  v.name = o.name || 'Line'
  const d = pts.map((p, i) => (i ? 'L ' : 'M ') + (p[0] - x0).toFixed(2) + ' ' + (p[1] - y0).toFixed(2)).join(' ') + (o.close ? ' Z' : '')
  v.vectorPaths = [{ windingRule: o.close ? 'NONZERO' : 'NONE', data: d }]
  v.strokes = o.stroke === false ? [] : [L.solid(o.color || F.RED, o.alpha == null ? 1 : o.alpha)]
  v.strokeWeight = o.sw || 1
  v.strokeCap = o.cap || 'NONE'
  v.strokeJoin = 'ROUND'
  if (o.dash) v.dashPattern = o.dash
  v.fills = o.fill ? [L.solid(o.fill, o.fillA == null ? 1 : o.fillA)] : []
  parent.appendChild(v)
  if (parent.layoutMode && parent.layoutMode !== 'NONE') v.layoutPositioning = 'ABSOLUTE'
  v.x = x0; v.y = y0
  return v
}
F.rect = (parent, x, y, w, h, o = {}) => {
  const r = figma.createRectangle()
  r.name = o.name || 'Box'
  r.resize(Math.max(0.5, w), Math.max(0.5, h))
  r.fills = o.fill ? [L.solid(o.fill, o.fillA == null ? 1 : o.fillA)] : []
  if (o.stroke !== false) { r.strokes = [L.solid(o.color || F.RED, o.alpha == null ? 1 : o.alpha)]; r.strokeWeight = o.sw || 1; r.strokeAlign = o.align || 'CENTER'; if (o.dash) r.dashPattern = o.dash }
  if (o.r) r.cornerRadius = o.r
  if (o.rot) r.rotation = o.rot
  parent.appendChild(r)
  if (parent.layoutMode && parent.layoutMode !== 'NONE') r.layoutPositioning = 'ABSOLUTE'
  r.x = x; r.y = y
  return r
}
F.ellipse = (parent, cx, cy, rx, ry, o = {}) => {
  const e = figma.createEllipse()
  e.name = o.name || 'Circle'
  e.resize(rx * 2, ry * 2)
  e.fills = o.fill ? [L.solid(o.fill, o.fillA == null ? 1 : o.fillA)] : []
  if (o.stroke !== false) { e.strokes = [L.solid(o.color || F.RED, o.alpha == null ? 1 : o.alpha)]; e.strokeWeight = o.sw || 1; if (o.dash) e.dashPattern = o.dash }
  parent.appendChild(e)
  if (parent.layoutMode && parent.layoutMode !== 'NONE') e.layoutPositioning = 'ABSOLUTE'
  e.x = cx - rx; e.y = cy - ry
  return e
}
F.put = (parent, node, x, y) => { parent.appendChild(node); if (parent.layoutMode && parent.layoutMode !== 'NONE') node.layoutPositioning = 'ABSOLUTE'; node.x = x; node.y = y; return node }
// A small value tag, for use over images.
F.tag = (s, o = {}) => {
  const t = L.text(s, 'code', { size: o.size || 10.5, lh: 14, color: o.color || F.RED, alpha: 1, family: 'JetBrains Mono', style: 'Medium' })
  return L.frame({ name: 'Tag · ' + s.slice(0, 30), dir: 'h', pad: [2, 6], r: 4, fill: '#FFFFFF', fillA: o.fillA == null ? 0.9 : o.fillA, kids: [t] })
}

// A render with redlines drawn natively over it and labels in a column to its right.
// Coordinates are stage points (the app's layout space); off is the stage's offset in the render (32 for shots-window/).
// o.guides [{y, name, f, v}], o.vs [{x, name, v}], o.pts [{x, y, name}], o.boxes [{x, y, w, h, name}], o.rings [{x, y, r, name}]
F.redlines = async (path, o = {}) => {
  const s = o.scale || 1, off = o.off == null ? (/shots-window\//.test(path) ? 32 : 0) : o.off
  const win = /shots-window\/|surfaces\/window\//.test(path) ? await L.window(path, { shadow: false }) : await L.img(path, { r: 16, name: 'Render · ' + path.split('/').pop() })
  const W = win.width * s, H = win.height * s
  if (s !== 1) win.rescale(s)
  const labelW = o.labelW || 380
  const holder = L.frame({ name: 'Redlines · ' + (o.title || path.split('/').pop()), w: W + 40 + labelW, h: H })
  holder.appendChild(win); win.x = 0; win.y = 0
  const Y = y => (y + off) * s, X = x => x * s
  const col = o.color || F.RED
  for (const b of o.boxes || []) {
    F.rect(holder, X(b.x), Y(b.y), b.w * s, b.h * s, { color: b.color || col, dash: b.dash || [5, 4], name: 'Box · ' + b.name })
    if (b.name) F.put(holder, F.tag(b.name, { color: b.color || col }), X(b.x) + (b.tx || 0), Y(b.y) - 20 + (b.ty || 0))
  }
  for (const r of o.rings || []) {
    F.ellipse(holder, X(r.x), Y(r.y), r.r * s, (r.ry || r.r) * s, { color: r.color || col, dash: [5, 4], name: 'Ring · ' + r.name })
    if (r.name) F.put(holder, F.tag(r.name, { color: r.color || col }), X(r.x) + (r.tx == null ? r.r * s * 0.72 : r.tx), Y(r.y) + (r.ty == null ? -r.r * s * 0.72 - 20 : r.ty))
  }
  for (const v of o.vs || []) {
    F.poly(holder, [[X(v.x), v.y0 == null ? 0 : Y(v.y0)], [X(v.x), v.y1 == null ? H : Y(v.y1)]], { color: v.color || F.BLUE, dash: [6, 4], name: 'Guide x · ' + v.name })
    if (v.name) F.put(holder, F.tag(v.name, { color: v.color || F.BLUE }), X(v.x) + 4, v.ty != null ? Y(v.ty) : H - 26)
  }
  for (const p of o.pts || []) {
    const x = X(p.x), y = Y(p.y)
    F.poly(holder, [[x - 9, y], [x + 9, y]], { color: p.color || col, sw: 1.25, name: 'Mark' })
    F.poly(holder, [[x, y - 9], [x, y + 9]], { color: p.color || col, sw: 1.25, name: 'Mark' })
    if (p.name) F.put(holder, F.tag(p.name, { color: p.color || col }), x + (p.tx == null ? 10 : p.tx), y + (p.ty == null ? 6 : p.ty))
  }
  // horizontal guides, labels de-collided in the right-hand column
  const gs = [...(o.guides || [])].sort((a, b) => a.y - b.y)
  let prev = -1e9
  for (const g of gs) {
    const y = Y(g.y)
    F.poly(holder, [[g.x0 == null ? 0 : X(g.x0), y], [W + 10, y]], { color: g.color || col, dash: [6, 4], name: 'Guide y · ' + g.name })
    const lab = L.col([
      L.rich([[g.name, 'smallStrong', { color: g.color || col, alpha: 1 }], ['  ' + (g.f || ''), 'code', { size: 11, lh: 20, alpha: 0.7 }]], 'small', { w: labelW, name: 'Label' }),
      g.v != null ? F.mono(g.v, { w: labelW, alpha: 0.9, style: 'Medium' }) : null,
    ], { gap: 0, name: 'Label · ' + g.name })
    const top = Math.max(y - 10, prev + 6)
    F.put(holder, lab, W + 40, top)
    F.poly(holder, [[W + 10, y], [W + 24, top + 10], [W + 34, top + 10]], { color: g.color || col, alpha: 0.7, name: 'Leader' })
    prev = top + lab.height
  }
  holder.resize(holder.width, Math.max(H, prev + 4))
  return holder
}

// Arcana's Layout struct (Game.swift:845-925), in JS, so every number on these pages is computed the app's way.
F.layout = (W, H, n = 3, phase = 'reading') => {
  const ratio = 0.565, solo = n === 1
  const byH = H * (solo ? (phase === 'reading' ? 0.44 : 0.36) : 0.31)
  const byW = (W * 0.84) / (n * ratio + (n - 1) * ratio * 0.2)
  const slotH = Math.max(110, Math.min(Math.min(solo ? 360 : 262, byH), byW))
  const slotW = slotH * ratio
  const fanH = Math.max(96, Math.min(178, H * 0.215)), fanW = fanH * ratio
  const rowY = H * (phase === 'reading' ? (solo ? 0.38 : 0.36) : 0.33)
  const threadY = rowY + slotH / 2 + 26, labelY = threadY + 20, stanzaTop = labelY + 38
  const askY = H - 32, inviteY = askY - 44
  const gap = slotW * 0.2, total = n * slotW + Math.max(0, n - 1) * gap, x0 = (W - total) / 2 + slotW / 2
  const slots = [...Array(n)].map((_, i) => x0 + i * (slotW + gap))
  const handY = H * 0.775, deck = { x: W / 2, y: handY - 11 }, ringR = fanH * 0.66
  const pref = n === 1 ? 27 : (n <= 3 ? 22 : 18.5), vgap = n >= 5 ? 8 : 12
  const room = inviteY - 24 - stanzaTop
  const fit = (room - Math.max(n - 1, 0) * vgap) / (n * 1.34)
  const verse = Math.max(13, Math.min(pref, fit)), verseH = n * verse * 1.34 + Math.max(n - 1, 0) * vgap
  const epigraphY = Math.max(44, rowY - slotH / 2 - 40)
  const promptY = Math.max(H * 0.6, labelY + 46)
  const findY = Math.min(inviteY, stanzaTop + verseH + 44)
  const ringTop = deck.y - 1.25 * ringR - 16
  const invocationY = Math.max(170, (40 + ringTop) / 2)
  const moon = { x: W * 0.86, y: Math.max(70, H * 0.12) }
  const pressY = deck.y + ringR * 1.2 + 26
  const altarH = Math.min(480, H * 0.62), altarW = altarH * ratio, altarGap = Math.min(72, W * 0.055)
  return { W, H, n, phase, slotH, slotW, fanH, fanW, rowY, threadY, labelY, stanzaTop, askY, inviteY, gap, slots, handY, deck, ringR,
    verse, vgap, verseH, fit, epigraphY, promptY, findY, ringTop, invocationY, moon, pressY, altarH, altarW, altarGap,
    span: W * 0.74, sag: H * 0.055, moonLabelY: moon.y + 36, returnedY: moon.y + 80, returnedW: Math.min(300, 2 * (W - moon.x) - 40),
    chevL: Math.max(30, slots[0] - (slotW / 2 + 58)), chevR: Math.min(W - 30, slots[n - 1] + slotW / 2 + 58) }
}

// A small chart: fns [{f(t) -> y in 0..1 (may overshoot), color, name, dash}], t in [t0, t1].
F.chart = (o = {}) => {
  const w = o.w || 420, h = o.h || 220, padL = 40, padB = 28, padT = 14, padR = 14
  const f = L.frame({ name: 'Chart · ' + (o.title || ''), w, h, fill: '#FFFFFF', fillA: 0.6, r: 10, stroke: L.C.stroke })
  const pw = w - padL - padR, ph = h - padT - padB
  const t0 = o.t0 || 0, t1 = o.t1 == null ? 1 : o.t1, y0 = o.y0 == null ? 0 : o.y0, y1 = o.y1 == null ? 1 : o.y1
  const PX = t => padL + (t - t0) / (t1 - t0) * pw, PY = v => padT + (1 - (v - y0) / (y1 - y0)) * ph
  // grid: 0 and 1 lines, axis
  F.poly(f, [[padL, PY(0)], [padL + pw, PY(0)]], { color: L.C.ink, alpha: 0.25, name: 'Axis 0' })
  F.poly(f, [[padL, PY(1)], [padL + pw, PY(1)]], { color: L.C.ink, alpha: 0.12, dash: [3, 3], name: 'Axis 1' })
  F.poly(f, [[padL, padT], [padL, padT + ph]], { color: L.C.ink, alpha: 0.25, name: 'Axis y' })
  for (const [v, s] of [[0, '0'], [1, '1']]) F.put(f, F.mono(s, { size: 10, alpha: 0.5 }), padL - 14, PY(v) - 8)
  const ticks = o.ticks || [t0, t1]
  for (const t of ticks) { F.poly(f, [[PX(t), padT + ph], [PX(t), padT + ph + 4]], { color: L.C.ink, alpha: 0.3, name: 'Tick' }); const lab = F.mono((o.tfmt || (x => F.fmt(x, 2)))(t), { size: 10, alpha: 0.5 }); F.put(f, lab, PX(t) - lab.width / 2, padT + ph + 6) }
  for (const fn of o.fns || []) {
    const N = fn.n || 160, pts = []
    for (let i = 0; i <= N; i++) { const t = t0 + (t1 - t0) * i / N; const v = fn.f(t); if (v == null || !isFinite(v)) continue; pts.push([PX(t), PY(v)]) }
    F.poly(f, pts, { color: fn.color || L.C.gold, sw: fn.sw || 2, dash: fn.dash, alpha: fn.alpha == null ? 1 : fn.alpha, name: 'Curve · ' + (fn.name || ''), cap: 'ROUND' })
  }
  for (const m of o.marks || []) { F.poly(f, [[PX(m.t), padT], [PX(m.t), padT + ph]], { color: m.color || F.RED, alpha: 0.6, dash: [3, 3], name: 'Mark' }); if (m.name) F.put(f, F.mono(m.name, { size: 10, color: m.color || F.RED, alpha: 1 }), PX(m.t) + 4, padT + 2 + (m.dy || 0)) }
  if (o.legend) { let ly = padT + 4; for (const fn of o.fns) if (fn.name) { const row = L.row([F.lineKey(fn.color || L.C.gold, fn.dash), L.text(fn.name, 'caption', { alpha: 0.8 })], { gap: 6, align: 'CENTER', name: 'Key' }); F.put(f, row, o.legendX == null ? padL + pw - 190 : o.legendX, ly + (o.legendY || 0)); ly += 18 } }
  return f
}
F.lineKey = (color, dash) => { const k = L.frame({ name: 'Key line', w: 18, h: 10 }); F.poly(k, [[0, 5], [18, 5]], { color, sw: 2, dash }); return k }

// A labelled figure card for charts: title, chart, formula, use, source, tags.
F.chartCard = (o) => L.col([
  o.tags ? L.chips(o.tags) : null,
  L.text(o.title, 'h3', { w: o.w || 420 }),
  F.chart(o),
  o.formula ? F.mono(o.formula, { w: o.w || 420, alpha: 0.9 }) : null,
  o.body ? L.text(o.body, 'small', { w: o.w || 420 }) : null,
  o.source ? L.source(o.source, { w: o.w || 420 }) : null,
], { gap: 8, name: 'Curve · ' + o.title })

// SwiftUI's spring (response = undamped period, dampingFraction = ζ): step response from 0 to 1.
F.spring = (response, zeta) => {
  const w0 = 2 * Math.PI / response
  if (zeta >= 1) return t => 1 - Math.exp(-w0 * t) * (1 + w0 * t)
  const wd = w0 * Math.sqrt(1 - zeta * zeta)
  return t => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t))
}
F.settle = (response, zeta, tol = 0.01) => { const f = F.spring(response, zeta); let last = 0; for (let t = 0; t < 6; t += 0.001) if (Math.abs(f(t) - 1) > tol) last = t; return last }
F.smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t) }
F.ramp = (x, a, b) => F.smooth((x - a) / (b - a))

S.fb = F
log('foundations-b lib ready')
}
