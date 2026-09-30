// Experience & notes · the shared kit for experience-b's chapters (The return & the moon's door, Keys & Settings,
// Edge cases & accessibility). It installs S.eb. Run it in front of each of those steps:
//   node design/figma/bridge/run.mjs design/figma/build/pages/experience-b-kit.js design/figma/build/pages/<step>.js
{ // block scope, so the step that follows can declare its own L and K
const L = S.lib
const K = {}
K.WIN = 'shots-window/'
const P = p => (p.includes('/') ? p : K.WIN + p)

// A real window render (shots-window/ or surfaces/window/), scaled to width w, with a title and caption under it.
K.win = async (path, w, title, caption, o = {}) => {
  const win = await L.window(P(path), { name: 'Window · ' + title, chrome: o.chrome })
  win.rescale(w / win.width)
  return L.col([win, title ? L.text(title, 'smallStrong', { w }) : null, caption ? L.text(caption, 'caption', { w }) : null,
    o.tags ? L.chips(o.tags) : null, o.source ? L.source(o.source, { w }) : null], { gap: 8, name: 'State · ' + (title || path) })
}
// A stage-only render (shots/, surfaces/moon-door/…): no title bar, so it is captioned as such.
K.stage = async (path, w, title, caption, o = {}) => {
  // every shots/ render says so under it, in the file's one phrase
  if (/^shots\//.test(path)) caption = path.replace(/\.png$/, '') + ' · stage render, no title-bar inset.' + (caption ? ' ' + caption : '')
  const im = await L.img(path, { w, r: o.r == null ? 12 : o.r, shadow: o.shadow !== false, stroke: o.stroke, strokeA: o.strokeA == null ? 0.1 : o.strokeA, name: 'Render · ' + path.split('/').pop().replace(/\.png$/, '') })
  return L.col([im, title ? L.text(title, 'smallStrong', { w }) : null, caption ? L.text(caption, 'caption', { w }) : null,
    o.tags ? L.chips(o.tags) : null, o.source ? L.source(o.source, { w }) : null], { gap: 8, name: 'Figure · ' + (title || path) })
}
// An honest gap: a dashed box where no render exists.
K.missing = (w, h, title, body, o = {}) => {
  const f = L.frame({ name: 'No render · ' + title, dir: 'v', w, h, r: o.r == null ? 12 : o.r, fill: '#FFFFFF', fillA: 0.4, stroke: '#8A4B12', strokeA: 0.45, pad: 28, gap: 8, justify: 'CENTER', align: 'CENTER' })
  f.dashPattern = [7, 6]
  L.add(f, L.text(o.kicker || 'No render', 'kicker', { color: '#8A4B12' }), L.text(title, 'smallStrong', { w: w - 56, align: 'CENTER' }),
    body ? L.text(body, 'caption', { w: w - 56, align: 'CENTER', alpha: 0.72 }) : null)
  return f
}
K.missingFig = (w, h, title, caption, box, o = {}) => L.col([K.missing(w, h, box.title, box.body), L.text(title, 'smallStrong', { w }), caption ? L.text(caption, 'caption', { w }) : null, o.tags ? L.chips(o.tags) : null], { gap: 8, name: 'State · ' + title })

// A window with numbered pins (window-point coordinates) and a legend beside it.
K.annotated = async (path, pins, o = {}) => {
  const win = await L.window(P(path), { name: 'Window · ' + (o.title || path) })
  const s = o.w ? o.w / win.width : 1
  if (s !== 1) win.rescale(s)
  const holder = L.frame({ name: 'Annotated · ' + (o.title || path), w: win.width, h: win.height })
  holder.appendChild(win); win.x = 0; win.y = 0
  pins.forEach((p, i) => { const pn = L.pin(i + 1); holder.appendChild(pn); pn.x = Math.round(p.x * s - 13); pn.y = Math.round(p.y * s - 13) })
  const lw = o.legendW || 520
  const legend = L.col(pins.map((p, i) => L.row([L.pin(i + 1), L.col([
    L.text(p.label, 'smallStrong', { w: lw - 40 }),
    p.body ? L.text(p.body, 'small', { w: lw - 40 }) : null,
    p.tags ? L.chips(p.tags) : null,
    p.source ? L.source(p.source, { w: lw - 40 }) : null,
  ], { gap: 3 })], { gap: 12, name: 'Pin ' + (i + 1) + ' · ' + p.label })), { gap: 16, w: lw, name: 'Legend' })
  const left = L.col([holder, o.caption ? L.text(o.caption, 'caption', { w: win.width }) : null], { gap: 12, name: 'Screen' })
  return L.row([left, legend], { gap: 48, name: 'Annotated screen · ' + (o.title || path) })
}

// A chapter header board: kicker, title, lead, the chapter's contents, and provenance notes.
K.header = (name, o) => {
  const b = L.board({ name, kicker: o.kicker || 'EXPERIENCE', title: o.title, w: 1600, lead: o.lead })
  L.add(b, L.rich([['In this chapter   ', 'smallStrong'], [o.toc.join('  ·  '), 'small']], 'small', { w: 1456 }))
  if (o.notes) {
    const n = o.notes.length, hw = Math.floor((1456 - (n - 1) * 24) / n)
    L.add(b, L.row(o.notes.map(x => L.note(Object.assign({ w: hw }, x))), { gap: 24, name: 'Provenance' }))
  }
  return b
}

// A native timeline. rows: {label, from, to?, marks?: [s], sound?, soft?, value?}. o: {w, t, step, labelW, unit}
K.timeline = (rows, o) => {
  const W = o.w, LW = o.labelW || 420, T = o.t, CH = W - LW - 190, unit = o.unit == null ? ' s' : o.unit
  const px = s => LW + (s / T) * CH
  const RH = 34, top = 30
  const f = L.frame({ name: o.name || 'Timeline', w: W, h: top + rows.length * RH + 8 })
  rows.forEach((r, i) => { if (i % 2 === 0) { const z = figma.createRectangle(); z.name = 'Band'; z.resize(W, RH); z.x = 0; z.y = top + i * RH; z.fills = [L.solid('#FFFFFF', 0.5)]; f.appendChild(z) } })
  for (let s = 0; s <= T + 1e-6; s += o.step) {
    const x = Math.round(px(s))
    const ln = figma.createRectangle(); ln.name = 'Tick'; ln.resize(1, rows.length * RH + 6); ln.x = x; ln.y = top - 4; ln.fills = [L.solid(L.C.rule, 1)]; f.appendChild(ln)
    const t = L.text((o.fmt ? o.fmt(s) : s.toFixed(o.step < 1 ? 1 : 0)) + unit, 'code', { size: 11, lh: 14 }); f.appendChild(t); t.x = Math.round(x - t.width / 2); t.y = 6
  }
  rows.forEach((r, i) => {
    const y = top + i * RH
    const lab = L.text(r.label, r.strong ? 'smallStrong' : 'small', { w: LW - 24, alpha: 0.86 }); f.appendChild(lab); lab.x = 12; lab.y = y + Math.round((RH - lab.height) / 2)
    const col = r.sound ? L.C.ink : (r.color || L.C.gold)
    let endX = 0
    if (r.to != null) {
      const b = figma.createRectangle(); b.name = 'Bar · ' + r.label
      const x0 = px(r.from), x1 = px(r.to)
      b.resize(Math.max(4, x1 - x0), 12); b.x = x0; b.y = y + 11; b.cornerRadius = 6; b.fills = [L.solid(col, r.soft ? 0.3 : 0.8)]
      if (r.soft) { b.strokes = [L.solid(col, 0.8)]; b.strokeWeight = 1; b.dashPattern = [4, 3] }
      f.appendChild(b); endX = x1
    }
    for (const m of (r.marks || (r.to == null ? [r.from] : []))) {
      const d = figma.createEllipse(); d.name = 'Mark · ' + r.label; d.resize(12, 12); d.x = px(m) - 6; d.y = y + 11; d.fills = [L.solid(col, 0.9)]
      f.appendChild(d); endX = Math.max(endX, px(m) + 6)
    }
    const v = L.text(r.value || (r.to != null ? `${r.from.toFixed(2)} → ${r.to.toFixed(2)}${unit}` : `${r.from.toFixed(2)}${unit}`), 'code', { size: 11, lh: 14, alpha: 0.7 })
    f.appendChild(v); v.x = Math.round(endX + 10); v.y = y + 10
  })
  return f
}

// A block of code or data, set in the values face on a white card.
K.code = (str, w, o = {}) => L.col([o.title ? L.text(o.title, 'smallStrong', { w: w - 40 }) : null, L.text(str, 'code', { w: w - 40, size: 12, lh: 19, alpha: 0.8 }), o.source ? L.source(o.source, { w: w - 40 }) : null],
  { gap: 10, pad: 20, w, r: 12, fill: '#FFFFFF', fillA: 0.75, stroke: L.C.stroke, name: 'Code · ' + (o.title || 'block') })

// A column: a small heading, then kids.
K.block = (title, kids, o = {}) => L.col([L.text(title, o.style || 'h3', o.w ? { w: o.w } : {}), ...kids], { gap: o.gap || 12, name: 'Block · ' + title })

// Put a chapter's boards in ORDER (unknown ones last), fit it, arrange the page.
K.finish = async (sec, ORDER) => {
  const idx = n => { const i = ORDER.indexOf(n.name); return i < 0 ? 99 : i }
  ;[...sec.children].sort((a, b) => idx(a) - idx(b)).forEach((k, i) => sec.insertChild(i, k))
  L.fit(sec)
  await L.arrange('Experience & notes')
}
// Remove this step's own boards (and any stray unnamed ones) before rebuilding them.
K.clearMine = (sec, ORDER, MINE) => { for (const n of [...sec.children]) if (MINE.includes(n.name) || !ORDER.includes(n.name)) n.remove() }
K.snap = async (boards, dir, prefix, o = {}) => {
  const out = []
  for (const b of boards) out.push(await L.snap(b, 'pages/' + dir + '/' + b.name.replace(prefix, '').toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') + '.png', { scale: o.scale || 0.3, wait: out.length ? 300 : 2000 }))
  return out
}
S.eb = K
}
