// Chapter: Layout, step 1 of 3 (header, the window, the room's proportions). Clears the chapter.
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-b-lib.js design/figma/build/pages/layout-1.js
const L = S.lib, F = S.fb
const sec = await L.chapter('Layout')
const f1 = F.fmt

// ---- Header -------------------------------------------------------------------------------------
const head = L.board({ name: 'Layout · Header', kicker: 'FOUNDATIONS', title: 'Layout', w: 1600,
  lead: 'The room has no grid. Everything is placed by proportion of the stage (the window minus its 32 pt hidden title bar), centred on one vertical axis, so one composition holds from the 940 × 660 minimum up to a full screen. Past about 845 pt of height the cards stop growing.' })
L.add(head, F.intro(['The window', 'The room’s proportions', 'Redlines at 1260 × 860', 'Redlines at the minimum', 'Slots per spread', 'The ribbon', 'The altar', 'The keys page', 'Kept pages', 'Large windows']))
const hn = (tags, title, body, source) => L.note({ w: 346, tags, title, body, source })
L.add(head, L.row([
  hn(['fixed'], 'Stage points', 'Every number in this chapter is in stage points from the stage’s top left. In the window, add 32 to y. Renders from shots-window/ are the whole window, title bar included.', 'Game.swift:845-925; RootView.swift:20-24'),
  hn(['claude', 'shipped'], 'One axis', 'Everything is centred on W/2 except the moon (0.86 W) and the two corner glyphs. Heights are fractions of H plus a few fixed gaps (26, 20, 38, 44, 32).', 'Game.swift:865-891'),
  hn(['lesson'], 'Check a real titled window', 'On 24 Sep Akash found a white strip at the foot of the live window that no render showed (a safe-area bug). Static renders can hide window-level layout bugs.'),
  hn(['measured'], 'Computed, then checked', 'The values here come from a copy of the app’s Layout struct and were checked against the renders. Type sizes land on whole points: SwiftUI rounds Font.custom sizes.', 'Game.swift:845-925'),
], { gap: 24, name: 'Rules' }))
L.add(sec, head)

// ---- The window -----------------------------------------------------------------------------------
const win = L.board({ name: 'Layout · The window', kicker: 'LAYOUT', title: 'The window', titleStyle: 'h1', w: 2400,
  lead: 'One window, 1260 × 860 by default and never smaller than 940 × 660. The title bar is hidden and transparent: the sky runs under it and the traffic lights float on the sky. The stage, where everything is laid out, starts 32 pt down.' })
const s = 0.6
const dia = L.frame({ name: 'Diagram · window, drawn', w: 1260 * s + 260, h: 860 * s + 150 })
const ox = 90, oy = 60
F.rect(dia, ox, oy, 1260 * s, 860 * s, { fill: '#F9F7F2', color: L.C.ink, alpha: 0.35, r: 16 * s, name: 'Window 1260 × 860' })
F.rect(dia, ox, oy + 32 * s, 1260 * s, 828 * s, { fill: L.C.sky, fillA: 0.28, color: F.RED, dash: [6, 4], name: 'Stage 1260 × 828' })
F.rect(dia, ox, oy, 940 * s, 660 * s, { color: F.BLUE, dash: [4, 4], name: 'Minimum 940 × 660' })
F.rect(dia, ox, oy + 32 * s, 940 * s, 628 * s, { color: F.BLUE, alpha: 0.5, dash: [2, 3], name: 'Minimum stage 940 × 628' })
const tb = L.component('Window/Title bar')
if (tb) { const v = tb.children.find(c => c.name === 'State=Active') || tb.children[0]; const inst = v.createInstance(); inst.resize(1260, 32); inst.rescale(s); F.put(dia, inst, ox, oy); inst.name = 'Title bar (component)' }
// corner glyphs
F.rect(dia, ox + 18 * s, oy + (32 + 18) * s, 26 * s, 26 * s, { color: F.RED, name: 'Key glyph 26 × 26' })
F.rect(dia, ox + (1260 - 18 - 26) * s, oy + (32 + 18) * s, 26 * s, 26 * s, { color: F.RED, name: 'Bowl glyph 26 × 26' })
F.put(dia, F.tag('key glyph 26 × 26, 18 in'), ox + 40 * s, oy + (32 + 20) * s)
const bt = F.tag('bowl glyph 26 × 26, 18 in'); F.put(dia, bt, ox + (1260 - 50) * s - bt.width, oy + (32 + 20) * s)
// dimension lines
const dimH = (x1, x2, y, label, color) => { F.poly(dia, [[x1, y], [x2, y]], { color, name: 'Dim' }); F.poly(dia, [[x1, y - 5], [x1, y + 5]], { color }); F.poly(dia, [[x2, y - 5], [x2, y + 5]], { color }); const t = F.tag(label, { color }); F.put(dia, t, (x1 + x2) / 2 - t.width / 2, y - 9) }
const dimV = (x, y1, y2, label, color, dx = 8) => { F.poly(dia, [[x, y1], [x, y2]], { color, name: 'Dim' }); F.poly(dia, [[x - 5, y1], [x + 5, y1]], { color }); F.poly(dia, [[x - 5, y2], [x + 5, y2]], { color }); const t = F.tag(label, { color }); F.put(dia, t, dx < 0 ? x + dx - t.width : x + dx, (y1 + y2) / 2 - 9) }
dimH(ox, ox + 1260 * s, oy - 26, '1260 default', L.C.ink)
dimH(ox, ox + 940 * s, oy + 860 * s + 22, '940 minimum', F.BLUE)
dimV(ox - 26, oy, oy + 860 * s, '860', L.C.ink, -8)
dimV(ox - 60, oy, oy + 660 * s, '660 min', F.BLUE, -8)
dimV(ox + 1260 * s + 22, oy, oy + 32 * s, '32 title bar', F.RED)
dimV(ox + 1260 * s + 22, oy + 32 * s, oy + 860 * s, 'stage 828', F.RED)
F.put(dia, F.tag('stage 940 × 628 at the minimum', { color: F.BLUE }), ox + 940 * s - 230, oy + 660 * s - 26)
F.put(dia, F.tag('traffic lights 14 × 14 at x 9, 32, 55 · y 9'), ox + 90 * s, oy + 6)

const specs = L.specs([
  ['Default', '1260 × 860 pt (defaultSize, ideal size).', 'ArcanaApp.swift:8-15'],
  ['Minimum', '940 × 660 pt. The window resizes freely above it (contentMinSize).', 'ArcanaApp.swift:8-15'],
  ['Title bar', 'Hidden and transparent. The content runs under it; the sky, the keys veil and the altar veil fill the whole window. The stage starts 32 pt down (measured 32.0 pt: content layout rect 1260 × 828).', 'ArcanaApp.swift:14; RootView.swift:1658; RootView.swift:20-24'],
  ['Stage', '1260 × 828 by default, 940 × 628 at the minimum. All layout is in this space.', 'RootView.swift:20-24'],
  ['Traffic lights', 'The standard three, 14 × 14 pt at x 9, 32, 55 and y 9, floating on the sky. The zoom button is kept visible.', 'RootView.swift:1663'],
  ['Background', 'Pearl #F9F7F2, opaque, light appearance forced.', 'RootView.swift:1659-1661; ArcanaApp.swift:11'],
  ['At launch', 'If the window is smaller than min(1260, visible width − 80) × min(860, visible height − 80), or off every screen, it is set to that size and centred on the visible frame, without animation.', 'RootView.swift:1664-1675'],
  ['One window', 'File ▸ New is removed. Settings is a separate window sized to its content.', 'ArcanaApp.swift:18, 28-31'],
], { w: 820, keyW: 150, name: 'Window specs' })
L.add(win, L.row([dia, specs], { gap: 80, name: 'Window and specs' }))

// launch sizing: two example screens, drawn at 1/4
const launch = (vw, vh, label) => {
  const k = 0.25, ww = Math.min(1260, vw - 80), wh = Math.min(860, vh - 80)
  const f = L.frame({ name: 'Launch · ' + label, w: vw * k + 20, h: vh * k + 20 })
  F.rect(f, 10, 10, vw * k, vh * k, { fill: '#FFFFFF', fillA: 0.6, color: L.C.ink, alpha: 0.3, name: 'Visible frame' })
  F.rect(f, 10 + (vw - ww) / 2 * k, 10 + (vh - wh) / 2 * k, ww * k, wh * k, { fill: L.C.sky, fillA: 0.5, color: F.RED, r: 4, name: 'Window' })
  return L.col([f, L.text(label, 'smallStrong', { w: vw * k + 20 }), F.mono(`visible ${vw} × ${vh} → window ${ww} × ${wh}`, { w: vw * k + 40 })], { gap: 6, name: 'Launch example' })
}
L.add(win, L.row([
  L.col([L.text('Launch enlarges, never shrinks', 'h3'), L.text('Opened on a small screen, the window fills the visible frame less 40 pt on each side. A window the person made larger is left alone; one left off-screen is brought back and centred.', 'small', { w: 420 }), L.chips([['claude'], ['shipped']])], { gap: 8, name: 'Launch text' }),
  launch(1440, 875, 'A 1440 × 900 display'),
  launch(1280, 775, 'A 1280 × 800 display'),
  launch(1728, 1085, 'A 14" MacBook Pro'),
], { gap: 56, align: 'MIN', name: 'Launch examples' }))
L.add(win, L.col([
  await L.img('shots-window/titlebar-inactive-1260.png', { w: 1260, name: 'Title bar strip, inactive', stroke: L.C.stroke }),
  L.text('The title bar as AppKit draws it over the sky, window inactive (1260 × 32). The file’s Window/Title bar component has both states.', 'caption', { w: 1260 }),
], { gap: 8, name: 'Title bar strip' }))
L.add(sec, win)

// ---- The room's proportions -----------------------------------------------------------------------
const A = F.layout(1260, 828, 3), B = F.layout(940, 628, 3)
const Ad = F.layout(1260, 828, 3, 'draw'), Bd = F.layout(940, 628, 3, 'draw')
const A1 = F.layout(1260, 828, 1), B1 = F.layout(940, 628, 1), A1d = F.layout(1260, 828, 1, 'draw'), B1d = F.layout(940, 628, 1, 'draw')
const A5 = F.layout(1260, 828, 5), B5 = F.layout(940, 628, 5)
const rows = [
  ['Stage', 'window − 32 pt title bar', '1260 × 828', '940 × 628', 'Window 1260 × 860 / 940 × 660.', 'RootView.swift:20-24'],
  ['slotH, 3 or 5 cards', 'max(110, min(262, 0.31 H, 0.84 W ÷ (0.565 n + 0.113 (n − 1))))', f1(A.slotH), f1(B.slotH), 'Bound by height at both sizes. Reaches its 262 cap at H ≈ 845.', 'Game.swift:852-858'],
  ['slotH, one card', 'max(110, min(360, 0.36 H drawing · 0.44 H reading))', f1(A1d.slotH) + ' · ' + f1(A1.slotH), f1(B1d.slotH) + ' · ' + f1(B1.slotH), 'Grows when the reading begins.', 'Game.swift:852-858'],
  ['slotW · card gap', '0.565 slotH (226 : 400) · 0.2 slotW', f1(A.slotW) + ' · ' + f1(A.gap), f1(B.slotW) + ' · ' + f1(B.gap), 'The row is centred on W/2.', 'Game.swift:850, 859, 880-885'],
  ['rowY', '0.33 H drawing · 0.36 H reading · 0.38 H one card', f1(Ad.rowY) + ' · ' + f1(A.rowY) + ' · ' + f1(A1.rowY), f1(Bd.rowY) + ' · ' + f1(B.rowY) + ' · ' + f1(B1.rowY), 'The card row’s centre.', 'Game.swift:865-867'],
  ['epigraphY', 'max(44, rowY − slotH/2 − 40)', f1(A.epigraphY), f1(B.epigraphY), 'The written question, read back above the cards.', 'RootView.swift:970'],
  ['threadY', 'rowY + slotH/2 + 26', f1(A.threadY), f1(B.threadY), 'The thread of light.', 'Game.swift:871'],
  ['labelY', 'threadY + 20', f1(A.labelY), f1(B.labelY), 'Position names (WHAT WAS …).', 'Game.swift:872'],
  ['stanzaTop', 'labelY + 38', f1(A.stanzaTop), f1(B.stanzaTop), 'Top of the verse.', 'Game.swift:876'],
  ['Verse size', 'max(13, min(pref, fit)); pref 27 · 22 · 18.5 for 1 · 3 · 5 lines; fit = (inviteY − 24 − stanzaTop − (n − 1) gap) ÷ 1.34 n', `${f1(A1.verse)} · ${f1(A.verse)} · ${f1(A5.verse)} (draws 19)`, `${f1(B1.verse)} · ${f1(B.verse)} · ${f1(B5.verse, 2)} (draws 13)`, 'Line box 1.34 × size; gap 12 (8 for five). Only five cards at the minimum hit the fit.', 'RootView.swift:1199-1206'],
  ['FIND THE THREAD', 'min(inviteY, stanzaTop + verse height + 44)', f1(A.findY), f1(B.findY), 'Sits under the verse, never below inviteY.', 'RootView.swift:1258'],
  ['inviteY', 'askY − 44', f1(A.inviteY), f1(B.inviteY), 'Foot of the verse’s room.', 'Game.swift:878'],
  ['askY', 'H − 32', f1(A.askY), f1(B.askY), '‘HOLD · RETURN THE CARDS’ and ‘hold · remember’.', 'Game.swift:877; RootView.swift:1182; Keeping.swift:898'],
  ['Draw prompt', 'max(0.60 H, labelY + 46), in the drawing layout', f1(Ad.promptY), f1(Bd.promptY), '', 'RootView.swift:1174'],
  ['fanH × fanW', 'max(96, min(178, 0.215 H)) × 0.565', f1(A.fanH) + ' × ' + f1(A.fanW), f1(B.fanH) + ' × ' + f1(B.fanW), 'The ribbon’s cards and the squared deck.', 'Game.swift:862-863'],
  ['handY', '0.775 H', f1(A.handY), f1(B.handY), 'The ribbon’s centre line.', 'Game.swift:887'],
  ['Deck (ring centre)', '(W/2, handY − 11)', `${f1(A.deck.x)}, ${f1(A.deck.y)}`, `${f1(B.deck.x)}, ${f1(B.deck.y)}`, '', 'Game.swift:890'],
  ['ringR', '0.66 fanH', f1(A.ringR), f1(B.ringR), 'The hold ring’s radius.', 'Game.swift:891'],
  ['PRESS AND HOLD', 'deck.y + 1.2 ringR + 26', f1(A.pressY), f1(B.pressY), '', 'RootView.swift:450'],
  ['Invocation centre', 'max(170, (40 + deck.y − 1.25 ringR − 16) ÷ 2)', f1(A.invocationY), f1(B.invocationY), 'Rule, ARCANA, the question line and the chooser (3 × 150, gaps 34).', 'RootView.swift:703-735'],
  ['Moon', '(0.86 W, max(70, 0.12 H)), radius 16', `${f1(A.moon.x)}, ${f1(A.moon.y)}`, `${f1(B.moon.x)}, ${f1(B.moon.y)}`, 'Its view frame is 96 × 96; the door’s hit area a 60 pt circle.', 'Chamber.swift:43-47; Keeping.swift:994'],
  ['Moon label · returned question', 'moon.y + 36 · moon.y + 80, width min(300, 2 (W − moon.x) − 40)', `${f1(A.moonLabelY)} · ${f1(A.returnedY)}, ${f1(A.returnedW)} wide`, `${f1(B.moonLabelY)} · ${f1(B.returnedY)}, ${f1(B.returnedW)} wide`, '', 'RootView.swift:740; Keeping.swift:1062-1075'],
  ['Corner glyphs', '26 × 26, 18 in from the stage’s top corners', 'key 18, 18 · bowl 1216, 18', 'key 18, 18 · bowl 896, 18', 'The key sits under the traffic lights.', 'RootView.swift:1594-1606; Legend.swift:316-331'],
  ['Ribbon', 'x = W/2 + 0.37 W k, y = handY + 0.055 H k² − lift, angle 12k° (k from −1 to 1)', `x ${f1(630 - A.span / 2)} to ${f1(630 + A.span / 2)}; ends ${f1(A.sag)} lower`, `x ${f1(470 - B.span / 2)} to ${f1(470 + B.span / 2)}; ends ${f1(B.sag)} lower`, '', 'Game.swift:894-905'],
  ['Altar card · gap', 'h = min(480, 0.62 H), w = 0.565 h · min(72, 0.055 W); text column ≤ 360', `${f1(A.altarH)} × ${f1(A.altarW)} · ${f1(A.altarGap)}`, `${f1(B.altarH)} × ${f1(B.altarW)} · ${f1(B.altarGap)}`, '', 'RootView.swift:1406-1407, 1440, 1515'],
]
const tb2 = L.board({ name: 'Layout · The room’s proportions', kicker: 'LAYOUT', title: 'The room’s proportions', titleStyle: 'h1', w: 2400,
  lead: 'Every position in the room, as the code computes it, at the default stage and at the minimum. Three cards in the reading unless the row says otherwise. y is from the stage’s top; add 32 for the window.',
  tags: [['claude'], ['shipped']] })
L.add(tb2, L.table([
  { key: 'm', label: 'Measure', w: 240, style: 'smallStrong' },
  { key: 'f', label: 'Formula', w: 640, style: 'code' },
  { key: 'a', label: '1260 × 828', w: 250, style: 'codeStrong' },
  { key: 'b', label: '940 × 628', w: 250, style: 'codeStrong' },
  { key: 'n', label: 'Notes', w: 460 },
  { key: 's', label: 'Source', w: 300, style: 'code' },
], rows.map(r => ({ m: r[0], f: r[1], a: r[2], b: r[3], n: r[4], s: r[5] })), { zebra: true, name: 'Proportions table' }))
// link the source column
tb2.findAll(n => n.type === 'TEXT' && /\.swift/.test(n.characters)).forEach(t => L.linkRefs(t))
L.add(sec, tb2)

L.fit(sec)
await L.arrange('Design system')
const out = []
for (const b of [head, win, tb2]) out.push(await L.snap(b, 'pages/layout/' + b.name.replace(/[^\w]+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: 800 }))
return out
