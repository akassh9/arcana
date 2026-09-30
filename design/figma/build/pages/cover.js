// Start here · Cover — one 1920 × 1080 frame that is also the file's thumbnail.
const L = S.lib
const sec = await L.chapter('Cover')

// Arcana colour variables, bound so the designer sees the token when inspecting.
const VARS = await figma.variables.getLocalVariablesAsync('COLOR')
const V = name => VARS.find(v => v.name === name)
const bound = (hex, varName, a = 1) => {
  const p = L.solid(hex, a)
  const v = V(varName)
  return v ? figma.variables.setBoundVariableForPaint(p, 'color', v) : p
}

const W = 1920, H = 1080
const cover = L.frame({ name: 'Cover', w: W, h: H, clip: true })
cover.fills = [bound('#F9F7F2', 'sky/pearl')]
sec.appendChild(cover)

// First light, after the room's own sky (Chamber.swift:186-212): pale blue overhead, dawn rising from below.
const high = figma.createRectangle()
high.name = 'Sky · high (after Chamber.swift:186-193)'
high.resize(W, H)
high.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: [
  { position: 0, color: L.rgba('#CCDBF5', 0.7) }, { position: 0.34, color: L.rgba('#CCDBF5', 0.28) }, { position: 0.7, color: L.rgba('#CCDBF5', 0) }] }]
cover.appendChild(high)
const lilac = figma.createEllipse()
lilac.name = 'Sky · lilac in the air (after Chamber.swift:195-201)'
lilac.resize(1500, 1500); lilac.x = W * 0.86 - 750; lilac.y = H * 0.1 - 750
lilac.fills = [{ type: 'GRADIENT_RADIAL', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [
  { position: 0, color: L.rgba('#E0D7F7', 0.55) }, { position: 1, color: L.rgba('#E0D7F7', 0) }] }]
cover.appendChild(lilac)
const rose = figma.createEllipse()
rose.name = 'Sky · rose in the air (after Chamber.swift:195-201)'
rose.resize(1400, 1400); rose.x = W * 0.06 - 700; rose.y = H * 0.86 - 700
rose.fills = [{ type: 'GRADIENT_RADIAL', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [
  { position: 0, color: L.rgba('#FDDDDC', 0.5) }, { position: 1, color: L.rgba('#FDDDDC', 0) }] }]
cover.appendChild(rose)
const dawn = figma.createEllipse()
dawn.name = 'Sky · first light (after Chamber.swift:203-212)'
dawn.resize(2600, 2000); dawn.x = W / 2 - 1300; dawn.y = H + 80 - 1000
dawn.fills = [{ type: 'GRADIENT_RADIAL', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [
  { position: 0, color: L.rgba('#FFE0B0', 0.95) }, { position: 0.42, color: L.rgba('#FFE0B0', 0.4) }, { position: 1, color: L.rgba('#FFE0B0', 0) }] }]
cover.appendChild(dawn)

// The title block, set like the room's own: a short gold rule, ARCANA, then a line in the pen's italic.
const rule = figma.createRectangle()
rule.name = 'Rule · gold (as the room, 46 × 1 pt)'
rule.resize(64, 1.5)
rule.fills = [bound('#8F6C21', 'gold/ink', 0.55)]
cover.appendChild(rule); rule.x = (W - 64) / 2; rule.y = 100

const title = L.text('ARCANA', 'display', { size: 124, lh: 150, ls: 32, name: 'ARCANA' })
// The app sets ARCANA in Didot Bold 62 with 20 pt tracking (32 %); the glow is the file's effect style.
const glow = await L.styleByName('effect', 'Glow/Title — ARCANA')
if (glow) await title.setEffectStyleIdAsync(glow.id)
title.fills = [bound('#26201C', 'ink/text')]
cover.appendChild(title)
// SwiftUI tracking (like Figma's) adds space after the last letter too; the app pads the leading edge to re-centre.
const trail = 124 * 0.32
title.x = Math.round((W - title.width + trail) / 2); title.y = 126

const sub = L.text('Design handoff', 'voice', { size: 36, lh: 44, name: 'Design handoff' })
sub.fills = [bound('#26201C', 'ink/text-62', 0.62)]
cover.appendChild(sub); sub.x = Math.round((W - sub.width) / 2); sub.y = 284

// The hero: the README reading — Six of Cups, the Star answered, Six of Swords — as the live window lays it out.
const win = await L.window('shots-window/00-readme.png', { name: 'Window · The README reading (shots-window/00-readme @2x)' })
const s = 0.65
win.rescale(s)
cover.appendChild(win)
win.x = Math.round((W - win.width) / 2); win.y = 384

const meta = L.text('Version 1.3 · macOS 14+ · Apple Silicon · rendered from the code at c7e12f4, 30 September 2026', 'body', { size: 15, lh: 22, alpha: 0.55, ls: 1, name: 'Meta line' })
meta.fills = [bound('#26201C', 'ink/text-55', 0.55)]
cover.appendChild(meta); meta.x = Math.round((W - meta.width) / 2); meta.y = win.y + win.height + 42
L.link(meta, 'https://github.com/akassh9/arcana/tree/' + L.SHA, meta.characters.indexOf('c7e12f4'), meta.characters.indexOf('c7e12f4') + 7)

await figma.setFileThumbnailNodeAsync(cover)
L.fit(sec)
await L.arrange('Start here')
return { win: [win.x, win.y, win.width, win.height], meta: meta.y + meta.height, title: [title.x, title.width], snap: await L.snap(cover, 'pages/cover/cover.png', { scale: 0.5 }) }
