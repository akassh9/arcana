// Experience & notes · Edge cases & accessibility (1 of 3) — header, small windows, large windows.
// Run with the kit: node design/figma/bridge/run.mjs design/figma/build/pages/experience-b-kit.js design/figma/build/pages/edge-cases-1.js
const L = S.lib, K = S.eb
const CH = 'Edge cases & accessibility', PX = CH + ' · '
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Header', 'Small windows', 'Large windows', 'Reduce Motion', 'Contrast', 'VoiceOver', 'Interaction states', 'Language and input'].map(n => PX + n)
K.clearMine(sec, ORDER, ORDER.slice(0, 3))
const CW = 2656

// ---------- header -----------------------------------------------------------------------------
const head = K.header(PX + 'Header', {
  title: 'Edge cases & accessibility',
  lead: 'Where the room was designed at one size, one language and one kind of reader. Small windows were checked; large windows, Reduce Motion, contrast, VoiceOver, focus and other languages each need a design decision. Each open question is tagged.',
  toc: ['Small windows', 'Large windows', 'Reduce Motion', 'Contrast', 'VoiceOver', 'Interaction states', 'Language and input'],
  notes: [
    { tags: ['akash', 'open'], title: 'Quiet by design', body: 'Akash asked for as few words as possible. The small, faint labels that carry them fall under WCAG AA. Deliberate, but a real legibility risk.' },
    { tags: ['open'], title: 'Only Reduce Motion is read', body: 'Increase Contrast, Reduce Transparency, Differentiate Without Colour and larger text are all ignored.' },
    { tags: ['open'], title: 'The table is invisible to VoiceOver', body: 'Cards have no accessibility elements, so the draw and the altar can’t be reached without sight.' },
    { tags: ['open'], title: 'English only', body: 'Every string is a literal, dates are forced to en_US, and fixed widths assume English lengths.' },
  ],
})
sec.appendChild(head)

// ---------- small windows -----------------------------------------------------------------------
const small = L.board({ name: PX + 'Small windows', kicker: 'EDGE CASES', title: 'Small windows', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'The window can shrink to 940 × 660: a 940 × 628 stage under the 32 pt title bar (measured 32.0 pt). Cards, the fan and the verse shrink toward their floors, and everything still fits. These are the states that were checked.',
  tags: [['measured', 'Measured: 940 × 628 stage'], 'shipped'] })
const w3 = Math.floor((CW - 2 * 40) / 3)
L.add(small, L.row([
  await K.win('12-invocation-small.png', w3, 'At rest', 'ARCANA, the invitation, the chooser and the deck in the smallest window.'),
  await K.win('60-ribbon-small.png', w3, 'The draw', 'The ribbon with card 30 lifted under the pointer.'),
  await K.win('11-five-small.png', w3, 'The Long Road', 'Five cards and five verse lines. Verse drops to Didot 16 here (19 at the default).'),
  await K.win('26-long-small.png', w3, 'The longest question', 'The 560 pt question line still fits inside 940.'),
  await K.win('53-kept-small.png', w3, 'A kept Long Road', 'The date stays one line: why the moon shows the date alone while the door is open.'),
  await K.win('55-brought-back-small.png', w3, 'One moon ago', 'The longest question wraps to two lines under the moon.'),
], { gap: 40, wrap: true, wrapGap: 48, w: CW, align: 'MIN', name: 'Small window states' }))
L.add(small, L.source('shots-window/12-invocation-small, 60-ribbon-small, 11-five-small, 26-long-small, 53-kept-small, 55-brought-back-small · 940 × 660 windows', { w: CW }))
L.add(small, L.section('The true minimum stage', { style: 'h2', lead: 'Stage-only renders at exactly 940 × 628, the space the room gets inside the smallest window. No title bar is drawn over them.' }))
const w4 = Math.floor((CW - 3 * 40) / 4)
L.add(small, L.row([
  await K.stage('shots/76-min-stage.png', w4, 'At rest', 'Cards, fan and verse at their floors.'),
  await K.stage('shots/77-min-stage-draw.png', w4, 'The draw', 'The ribbon, empty places and prompt.'),
  await K.stage('shots/78-min-stage-reading.png', w4, 'Three Fates, spoken', 'With its closing prompt.'),
  await K.stage('shots/79-min-stage-five.png', w4, 'The Long Road', 'Verse at Didot 13, its floor.'),
], { gap: 40, align: 'MIN', name: 'Minimum stage' }))
L.add(small, L.row([
  L.table([{ label: 'Stage', w: 190 }, { label: 'One card', w: 150 }, { label: 'Three · five', w: 150 }, { label: 'Fan (deck)', w: 150 }, { label: 'Five-card verse', w: 170 }], [
    ['940 × 628 (smallest)', '276.3 pt', '194.7 pt', '135.0 pt', 'Didot 13'],
    ['940 × 660 (shot stage)', '290.4 pt', '204.6 pt', '141.9 pt', 'Didot 16'],
    ['1260 × 828 (default)', '360 (cap)', '256.7 pt', '178 (cap)', 'Didot 19'],
  ], { name: 'Sizes by stage' }),
  L.specs([
    ['Card height', 'max(110, min(cap, H × 0.31, width fit)); cap 262, or 360 for One Card (H × 0.44 in the reading). Width is height × 0.565.', 'Game.swift:853-860'],
    ['Fan', 'clamp(96, H × 0.215, 178).', 'Game.swift:862'],
    ['Two minimums', 'Some renders use a 940 × 660 stage, others the true 940 × 628. Build the minimum frame at 940 × 660 window / 940 × 628 stage.', 'Game.swift:853-863'],
  ], { w: 1500, keyW: 150 }),
], { gap: 56, align: 'MIN', name: 'Small specs' }))
sec.appendChild(small)

// ---------- large windows ------------------------------------------------------------------------
const large = L.board({ name: PX + 'Large windows', kicker: 'EDGE CASES', title: 'Large windows', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'Past the default size the cards stop growing, the type stays the same size, and only the sky, the engraved wheel, the ribbon and the rings keep scaling. On a 16-inch MacBook Pro in full screen, or a 27-inch display, the room is sparser. Nobody has designed it.',
  tags: [['open', 'Needs a design decision']] })
L.add(large, L.row([
  await K.stage('shots/80-large-1728.png', w3, '1728 × 1117 · at rest', 'A 16-inch MacBook Pro’s worth of points. The sky, wheel and ring scale; the type and chooser don’t.'),
  await K.stage('shots/81-large-1728-reading.png', w3, '1728 × 1117 · Three Fates', 'The cards stop at 262 pt.'),
  await K.stage('shots/82-large-1728-draw.png', w3, '1728 × 1117 · the draw', 'The ribbon spans 0.74 of the width; its cards stay 178 pt.'),
  await K.stage('shots/83-large-2560.png', w3, '2560 × 1440 · at rest', 'A 27-inch display (rendered at 1.5×).'),
  await K.stage('shots/84-large-2560-reading.png', w3, '2560 × 1440 · Three Fates', 'The spoken reading, small in a large sky.'),
  await K.stage('shots/85-large-2560-altar.png', w3, '2560 × 1440 · the altar', 'Nine of Pentacles; the altar card stops at 480 pt.'),
], { gap: 40, wrap: true, wrapGap: 48, w: CW, align: 'MIN', name: 'Large window states' }))
L.add(large, L.text('Stage-only renders: the whole frame is stage, with no title bar. A real window of the same size has a stage 32 pt shorter.', 'caption', { w: CW }))
L.add(large, L.row([
  L.specs([
    ['Stops growing', 'Cards at 262 pt (360 for One Card), reached at a stage about 845 pt tall, so just past the default. The fan at 178, the altar card at 480, the verse at 27 / 22 / 19 pt.', 'Game.swift:853-863; RootView.swift:1199-1227, 1406'],
    ['Keeps scaling', 'The sky and its gradients, the engraved wheel (1.32 × the span), the ribbon (0.74 W), the rows’ and rings’ positions (fractions of H).', 'Chamber.swift:220; Game.swift:864-905'],
    ['Never grows', 'All type: ARCANA 62, the invitation 19, every Caps label.', 'RootView.swift:1035-1055'],
    ['Full screen', 'The window allows it (resizable, zoom enabled), and nobody has looked at it.', 'ArcanaApp.swift:6-15'],
  ], { w: 1500, keyW: 150 }),
  L.col([
    L.note({ w: 1100, tags: ['open'], title: 'What should a big sky hold?', body: 'Options to weigh: let the cards and type keep growing, cap the stage and let the sky frame it, or accept the sparseness as more sky. It needs a rule, not a per-size fix.' }),
    L.note({ w: 1100, tags: ['lesson'], title: 'Check in a real window', body: 'Static renders have no safe area and can hide window-level layout bugs; confirm any large-window rule in a real titled window.' }),
  ], { gap: 20, name: 'Large notes' }),
], { gap: 56, align: 'MIN', name: 'Large specs' }))
sec.appendChild(large)

await K.finish(sec, ORDER)
return await K.snap([head, small, large], 'edge-cases', PX)
