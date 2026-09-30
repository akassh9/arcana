// The window's title bar as a component, drawn natively from the measured geometry
// (32 pt hidden, transparent title bar; traffic lights 14 × 14 pt at x 9, 32, 55, y 9).
// Lives on the Components page in its own board, so the parts builder keeps it.
const L = S.lib
const page = await L.chapter('Components', { clear: false })
for (const n of page.children.filter(n => n.name === 'Components · Window chrome')) n.remove()

const LIGHTS = [['Close', '#FF5C5F', '#E0443E'], ['Minimise', '#FAC800', '#D9A200'], ['Zoom', '#34C759', '#24A148']]
const make = active => {
  const c = figma.createComponent()
  c.name = 'State=' + (active ? 'Active' : 'Inactive')
  c.resize(1260, 32)
  c.fills = []
  c.clipsContent = false
  LIGHTS.forEach(([name, fill, edge], i) => {
    const e = figma.createEllipse()
    e.name = name
    e.resize(14, 14)
    e.x = 9 + 23 * i; e.y = 9
    e.fills = active ? [L.solid(fill)] : [L.solid('#000000', 0.19)]
    e.strokes = active ? [L.solid(edge, 0.9)] : []
    e.strokeWeight = 0.5; e.strokeAlign = 'INSIDE'
    c.appendChild(e)
    e.constraints = { horizontal: 'MIN', vertical: 'MIN' }
  })
  return c
}
const a = make(true), b = make(false)
const board = L.board({ name: 'Components · Window chrome', kicker: 'PARTS · WINDOW', title: 'Window / Title bar', w: 1600,
  lead: 'The main window hides its title and makes the title bar transparent, so the sky runs under the traffic lights. Place this at the top of every window frame; stretch it to the window width.' })
page.appendChild(board)
const holder = L.frame({ name: 'Window / Title bar — holder', dir: 'v', gap: 24, pad: 24, fill: '#CCDBF5', r: 12 })
L.add(board, holder)
const set = figma.combineAsVariants([a, b], holder)
set.name = 'Window/Title bar'
set.layoutMode = 'VERTICAL'; set.itemSpacing = 16; set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 16
set.layoutSizingHorizontal = 'HUG'; set.layoutSizingVertical = 'HUG'
set.fills = []
set.description = 'The 32 pt hidden, transparent title bar of Arcana\'s main window (styleMask titled, closable, miniaturizable, resizable, fullSizeContentView; titlebarAppearsTransparent; titleVisibility hidden). Traffic lights 14 × 14 pt at x 9, 32, 55, y 9. Stage under it: 1260 × 828 at the default size, 940 × 628 at the minimum. macOS 26 window corner radius 16 pt. Measured offscreen on 30 Sep 2026 (design/figma/assets/surfaces/geometry.json).'
set.documentationLinks = [{ uri: L.srcUrl('RootView.swift', 1652, 1662) }]
L.add(board, L.specs([
  ['Title bar', '32 pt, transparent, title hidden; the sky runs under it', 'ArcanaApp.swift; assets/surfaces/geometry.json'],
  ['Traffic lights', '14 × 14 pt at x 9, 32, 55 · y 9 (centres 23 pt apart)', 'assets/surfaces/geometry.json'],
  ['Window', 'default 1260 × 860 · minimum 940 × 660 · corner radius 16 pt (macOS 26)', 'RootView.swift:1664-1676'],
  ['Stage', '1260 × 828 at default · 940 × 628 at minimum', 'assets/shots/manifest.json'],
], { w: 900, keyW: 180 }))
L.add(board, L.chips(['measured', 'shipped']))
board.x = 120; board.y = 200
L.fit(page, { stack: false })
await L.arrange('Design system')
return { set: set.id, variants: set.children.map(c => c.name), snap: await L.snap(board, 'pages/components/window.png', { scale: 0.5, wait: 300 }) }
