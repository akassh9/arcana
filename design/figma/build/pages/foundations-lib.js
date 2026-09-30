// Shared helpers for the chapters Colour, Type and Ink, gold & materials (installed into S.fa).
// Run it in front of any of their steps (it is a block, so it can be concatenated with a step):
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-lib.js design/figma/build/pages/colour-1.js
{
const L = S.lib
const F = {}

// The file's Arcana colour variables, by name (ink/text-62 …).
F.vars = {}
for (const v of await figma.variables.getLocalVariablesAsync('COLOR')) F.vars[v.name] = v
F.val = name => { const v = F.vars[name]; if (!v) throw new Error('No variable ' + name); return Object.values(v.valuesByMode)[0] }
F.hex = name => { const c = F.val(name); return '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase() }
F.pct = a => Math.round(a * 1000) / 10 + '%'
// A solid paint bound to a variable (its alpha comes from the variable, so Inspect shows the token).
F.paint = name => {
  const c = F.val(name)
  return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a == null ? 1 : c.a }, 'color', F.vars[name])
}
F.rect = (w, h, fills, o = {}) => {
  const r = figma.createRectangle(); r.name = o.name || 'Swatch'; r.resize(w, h); r.cornerRadius = o.r == null ? 12 : o.r
  r.fills = fills
  if (o.stroke !== false) { r.strokes = [L.solid('#000000', o.strokeA == null ? 0.06 : o.strokeA)]; r.strokeAlign = 'INSIDE'; r.strokeWeight = 1 }
  if (o.opacity != null) r.opacity = o.opacity
  return r
}
// A swatch bound to its variable: title = token name, value = hex · alpha.
F.swatch = (name, o = {}) => {
  const c = F.val(name)
  const sw = L.swatch({ w: o.w || 272, h: o.h || 120, paints: [F.paint(name)], name: o.title || name,
    value: o.value || (F.hex(name) + (c.a < 1 ? ' · ' + F.pct(c.a) : '')), usage: o.usage, source: o.source, tags: o.tags })
  sw.name = 'Colour · ' + name
  sw.children[0].name = 'Swatch · ' + name
  return sw
}
// A raw (non-token) swatch, labelled as such.
F.raw = (hex, title, o = {}) => {
  const sw = L.swatch({ w: o.w || 200, h: o.h || 96, hex, alpha: o.alpha, name: title, value: o.value || hex.toUpperCase(), usage: o.usage, source: o.source, tags: o.tags })
  sw.name = 'Colour (not a token) · ' + title
  return sw
}
// Gradient paints. Linear top → bottom or along any box direction; radial as a true circle at (cx, cy) radius R
// inside a box of w × h (all in the same units).
F.stops = list => list.map(([p, hex, a]) => ({ position: p, color: L.rgba(hex, a == null ? 1 : a) }))
F.linearV = stops => ({ type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: F.stops(stops) })
F.linearH = stops => ({ type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: F.stops(stops) })
F.radial = (stops, cx, cy, R, w, h, blend) => {
  const p = { type: 'GRADIENT_RADIAL', gradientTransform: [[w / (2 * R), 0, 0.5 - cx / (2 * R)], [0, h / (2 * R), 0.5 - cy / (2 * R)]], gradientStops: F.stops(stops) }
  if (blend) p.blendMode = blend
  return p
}
// Text in one of the file's Arcana text styles, coloured by a variable.
F.styled = async (chars, style, varName, o = {}) => {
  const t = figma.createText()
  t.fontName = { family: 'Didot', style: 'Regular' }
  t.characters = chars
  await L.useText(t, style)
  if (varName) t.fills = [F.paint(varName)]
  if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, Math.max(1, t.height)) } else t.textAutoResize = 'WIDTH_AND_HEIGHT'
  if (o.align) t.textAlignHorizontal = o.align
  if (o.effect) { const e = await L.styleByName('effect', o.effect); if (e) await t.setEffectStyleIdAsync(e.id) }
  t.name = o.name || style + ' · ' + chars.slice(0, 32)
  return t
}
F.intro = (items) => L.rich([['In this chapter   ', 'smallStrong'], [items.join('  ·  '), 'small']], 'small', { w: 1300, name: 'In this chapter' })
// A labelled block: small heading + content.
F.block = (title, kids, o = {}) => L.col([L.text(title, 'smallStrong', { w: o.w }), ...[kids].flat()], Object.assign({ gap: 10, name: 'Block · ' + title }, o.col || {}))
// A pearl stage with padding for showing a real element.
F.stage = (kids, o = {}) => L.frame(Object.assign({ name: 'Stage', dir: 'h', pad: o.pad == null ? 28 : o.pad, gap: 16, fill: o.fill || '#F9F7F2', stroke: L.C.stroke, r: 14, align: 'CENTER', justify: 'CENTER' }, o, { kids }))
F.mono = (s, o = {}) => L.text(s, 'code', Object.assign({ size: 11, lh: 16, alpha: 0.72 }, o))

// ---- Type specimens (chapter Type) ----
// d: { style, token, sample, color, code, drawn, lh, tr, pct, glow, use, source, bg, caps, kids }
F.TYPE_COLS = [250, 640, 500]
F.specRow = async (d) => {
  const [c1, c2, c3] = F.TYPE_COLS
  let spec
  if (d.kids) spec = d.kids
  else spec = await F.styled(d.sample, d.style, d.color, { effect: d.glow, name: d.style + ' · specimen' })
  if (spec.type === 'TEXT' && spec.width > c2 - 40) { spec.textAutoResize = 'HEIGHT'; spec.resize(c2 - 40, spec.height) }
  const inner = [spec]
  if (d.caps) {
    const big = await F.styled(d.sample, d.style, d.color, { name: d.style + ' · 2× preview (size override)' })
    big.fontSize = d.drawn * 2; big.letterSpacing = { value: d.tr * 2, unit: 'PIXELS' }; big.lineHeight = { value: d.lh * 2, unit: 'PIXELS' }
    inner.push(L.col([big, L.text('2× for reading · not a style', 'caption', { size: 10, lh: 14 })], { gap: 4, name: '2× preview' }))
  }
  const box = L.frame({ name: 'Specimen', dir: 'v', w: c2, pad: [20, 20], gap: 14, align: 'MIN', fill: d.bg || null, r: d.bg ? 10 : 0, kids: inner })
  const sizeLine = d.code != null && d.code !== d.drawn ? `${d.drawn} pt (code ${d.code})` : `${d.drawn} pt`
  const specs = L.col([
    L.text(`${sizeLine} · line ${d.lh} · tracking ${d.tr ? d.tr + ' pt' : '0'}${d.pct ? ' (' + d.pct + '%)' : ''}`, 'codeStrong', { size: 12, lh: 18, w: c3 }),
    L.text(d.colorLabel || (d.color + (d.glow ? ' · glow ' + d.glow : '')), 'code', { w: c3, size: 11, lh: 16, alpha: 0.8 }),
    L.text(d.use, 'small', { w: c3 }),
    L.source(d.source, { w: c3 }),
  ], { gap: 4, w: c3, name: 'Spec' })
  const tags = []
  if (d.code != null && d.code !== d.drawn) tags.push(['measured', 'Rounds to ' + d.drawn])
  if (d.tags) tags.push(...d.tags)
  const left = L.col([L.text(d.style, 'h3', { w: c1 }), F.mono(d.token, { w: c1 }), tags.length ? L.chips(tags, { w: c1 }) : null], { gap: 4, w: c1, name: 'Style name' })
  const r = L.row([left, box, specs], { gap: 32, pad: [16, 0], name: 'Type · ' + d.style, align: 'MIN' })
  r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; r.strokeAlign = 'INSIDE'
  return r
}

S.fa = F
}
