// Creates the file's real design tokens from assets/tokens/tokens.json:
// colour variables, text styles, effect styles and gradient paint styles. Safe to re-run (updates in place).
const L = S.lib
const T = await L.json('tokens/tokens.json')
const title = s => s.split('/').map(p => p.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())).join('/')

// ---- colour variables
const col = await L.collection('Arcana colour')
if (col.modes[0].name !== 'First light') col.renameMode(col.modes[0].modeId, 'First light')
const vars = {}
for (const c of T.colors) {
  const v = await L.variable(col, c.name, 'COLOR', L.rgba(c.hex, c.alpha), {
    description: [c.usage, c.alpha < 1 ? `Alpha ${Math.round(c.alpha * 100)}%.` : '', 'Source: ' + c.source].filter(Boolean).join('\n'),
  })
  if (c.code) v.setVariableCodeSyntax('iOS', c.code)
  vars[c.name] = v
}

// ---- text styles
const text = []
for (const t of T.type) {
  const s = await L.textStyle(title(t.name), { family: t.family, style: t.style, size: t.size, lh: t.lh, lsPx: t.lsPx, upper: t.upper },
    [t.usage, `Didot ${t.face_note}, ${t.size} pt drawn, tracking ${t.lsPx} pt, line ${t.lh} pt${t.upper ? ', capitals' : ''}.`, 'Source: ' + t.source].join('\n'))
  text.push(s.name)
}

// ---- effect styles (glows are coloured light, shadows are warm shade — never black)
const fx = []
for (const e of T.effects) {
  const s = await L.effectStyle(e.name, [{
    type: 'DROP_SHADOW', color: L.rgba(e.color, e.alpha), offset: { x: e.x, y: e.y }, radius: e.figma_blur, spread: 0,
    visible: true, blendMode: 'NORMAL', showShadowBehindNode: false,
  }], `${e.usage}\nSwiftUI .shadow(color: ${e.color} @ ${e.alpha}, radius: ${e.swiftui_radius}${e.y ? ', y: ' + e.y : ''}) — Figma blur ${e.figma_blur}.\nSource: ${e.source}`)
  fx.push(s.name)
}

// ---- gradient paint styles
const stop = (p, h, a = 1) => ({ position: p, color: L.rgba(h, a) })
const diag = [[0.5, 0.5, 0], [-0.5, 0.5, 0.5]]   // top-left → bottom-right of the shape
const grads = [
  ['Gold/Leaf', [{ type: 'GRADIENT_LINEAR', gradientTransform: diag, gradientStops: [stop(0, '#F6E08F'), stop(0.42, '#C9A333'), stop(0.66, '#E7C761'), stop(1, '#94701F')] }],
    'Gold leaf: light, shadow, light, shadow — the banding of beaten metal. Runs from each shape\'s bounding-box top-left to bottom-right. Every gold fill carries a 0.8 pt card-ink keyline.\nSource: Palette.swift:41-46'],
  ['Card/Vignette (multiply)', [{ type: 'GRADIENT_RADIAL', blendMode: 'MULTIPLY', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [stop(0, '#734D20', 0), stop(0.44, '#734D20', 0), stop(1, '#734D20', 0.16)] }],
    'Candlelight on the card stock: clear to candle 16% from r110 to r250 pt on the 226×400 face, multiplied. Apply to a layer the size of the face; the stops approximate the radii.\nSource: CardImages.swift:107-111'],
  ['Light/Halo (screen)', [{ type: 'GRADIENT_RADIAL', blendMode: 'SCREEN', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [stop(0, '#ECCE6E', 1), stop(0.5, '#ECCE6E', 0.32), stop(1, '#ECCE6E', 0)] }],
    'The halo under a card on the table: goldLit 100% → 32% → 0, an ellipse 2.6 slotW × 1.7 slotH, Screen.\nSource: RootView.swift halos; Keeping.swift:728-734'],
]
for (const [name, paints, desc] of grads) await L.paintStyle(name, paints, desc)

return { variables: Object.keys(vars).length, textStyles: text.length, effectStyles: fx.length, paintStyles: grads.length }
