// Experience & notes · The room (1 of 2) — header, the room at rest (default and minimum), the title's light.
const L = S.lib
const sec = await L.chapter('The room')
const WIN = 'shots-window/'

// an annotated window: the real window render with its title bar, numbered pins, a legend beside it
const annotatedWin = async (path, pins, o = {}) => {
  const win = await L.window(path, { name: o.name || ('Window · ' + (o.title || path)), chrome: o.chrome })
  const s = o.scale || 1
  if (s !== 1) win.rescale(s)
  const holder = L.frame({ name: 'Annotated · ' + (o.title || path), w: win.width, h: win.height })
  holder.appendChild(win); win.x = 0; win.y = 0
  pins.forEach((p, i) => { const pn = L.pin(i + 1); holder.appendChild(pn); pn.x = Math.round(p.x * s - 13); pn.y = Math.round(p.y * s - 13) })
  const lw = o.legendW || 440
  const legend = L.col(pins.map((p, i) => L.row([L.pin(i + 1), L.col([
    L.text(p.label, 'smallStrong', { w: lw - 40 }),
    p.body ? L.text(p.body, 'small', { w: lw - 40 }) : null,
    p.tags ? L.chips(p.tags) : null,
    p.source ? L.source(p.source, { w: lw - 40 }) : null,
  ], { gap: 3 })], { gap: 12, name: 'Pin ' + (i + 1) + ' · ' + p.label })), { gap: 18, w: lw, name: 'Legend' })
  const left = L.col([holder, o.caption ? L.text(o.caption, 'caption', { w: win.width }) : null], { gap: 12, name: 'Screen' })
  return L.row([left, legend], { gap: 48, name: 'Annotated screen · ' + (o.title || path) })
}

// ---------- header -------------------------------------------------------------
const head = L.board({ name: 'The room · Header', kicker: 'EXPERIENCE', title: 'The room', w: 1600,
  lead: 'The whole main window is one stage over the dawn sky, with no panels, chrome or navigation. At rest it holds a title, one line of invitation, three spreads, tonight’s moon and a squared deck in a faint ring. Everything a reading needs happens here, as changes of this one surface.' })
L.add(head, L.rich([['In this chapter   ', 'smallStrong'], ['The room at rest  ·  The title and its passing light  ·  The question, written  ·  The hold  ·  The cut', 'small']], 'small', { w: 1456 }))
L.add(head, L.row([
  L.note({ w: 470, tags: ['akash'], title: 'Light colours only', body: 'Pearl, ink, dark gold and oxblood over a first-light sky. The dark “lapis night” version was rejected; Akash prefers light themes.' }),
  L.note({ w: 470, tags: ['akash'], title: 'As few words as possible', body: 'The room’s only instructions are PRESS AND HOLD, DRAW THREE and HOLD · RETURN THE CARDS. No tooltips.' }),
  L.note({ w: 470, tags: ['fixed'], title: 'It scales, it doesn’t reflow', body: 'Every position is a proportion of the stage, so a smaller window shrinks the room rather than rearranging it.', source: 'Game.swift:846-924' }),
], { gap: 23, name: 'Principles' }))
sec.appendChild(head)

// ---------- the room at rest ------------------------------------------------------
const rest = L.board({ name: 'The room · At rest', kicker: 'THE ROOM', title: 'The room at rest', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'The default window, 1260 × 860 pt, as it opens. The title bar is hidden and transparent, so the sky runs under the traffic lights; the stage below it is 1260 × 828.' })
sec.appendChild(rest)
L.add(rest, await annotatedWin(WIN + '1-invocation.png', [
  { x: 62, y: 63, label: 'The old key · the keys page', body: 'Top left, a 26 × 26 hit area. Pen-drawn and turned 45°, lit while the keys are open. Always works, before the ask too.', tags: ['claude'], source: 'Legend.swift:312-330' },
  { x: 590, y: 152, label: 'Hairline', body: '46 × 1 pt in gold/ink-55, 22 pt above the title.', source: 'RootView.swift:703-735' },
  { x: 410, y: 213, label: 'ARCANA', body: 'Style display/title: Didot Bold 62, tracking 20, ink/text, with the effect Glow/Title — ARCANA (gold/light 55 %, radius 22). A gold light crosses it every 12 s (next board).', source: 'RootView.swift:1029-1057' },
  { x: 482, y: 279, label: 'The invitation', body: '“Hold the question in your mind.” Style voice/question: Didot Italic 19, ink/text-62, 14 pt under the title. The first letter typed breathes it out (0.25 s, blur 4).', source: 'RootView.swift:756-799' },
  { x: 372, y: 373, label: 'Three spreads', body: 'Each choice 150 × 86, 34 pt apart, 42 pt under the invitation. Chosen: caps/spread in Didot Bold, ink/text, gold pips that glow, corner brackets in gold/ink-60. The others at 48 %.', source: 'RootView.swift:1085-1133' },
  { x: 1044, y: 130, label: 'Tonight’s moon', body: 'The real phase, painted as a day moon in the sky’s colours. Its name in caps/moon (Didot 8, tracking 3.6), ink/text-40, 36 pt under its centre. With a reading kept, it is the door to them.', tags: [['akash', 'Akash: the emoji moon as reference'], ['lesson', 'Its idea, not its palette']], source: 'RootView.swift:737-742; Moon.swift:35-46; Keeping.swift:979-1013' },
  { x: 474, y: 566, label: 'The deck in its ring', body: '78 cards squared at the deck point (630, 630.7 on the 1260 × 828 stage: 0.775 H − 11). The ring, radius 117.5 pt, and a hairline at 1.2 × in gold/ink, breathe with the sky every 10 s. Drawn by the near sky on the GPU.', source: 'Game.swift:890-891, 918-923; Chamber.swift:530-548' },
  { x: 530, y: 828, label: 'PRESS AND HOLD', body: 'Style caps/foot-press: Didot 9, tracking 4.2, gold/ink-75, fading as 1 − charge. Set 1.2 ring radii + 26 pt under the deck.', tags: [['akash', 'Akash: as few words as possible']], source: 'RootView.swift:438-460' },
  { x: 1200, y: 63, label: 'The singing bowl · sound', body: 'Top right, 26 × 26, 18 pt in from the corner. Pen-drawn in ink/text-50, 30 % when muted; the note arcs fade in 0.35 s. After the ask, m does the same.', tags: ['claude'], source: 'RootView.swift:1587-1641' },
  { x: 160, y: 520, label: 'First light', body: 'The sky itself: pale blue overhead, lilac and rose in the air, dawn rising from below, the engraved wheel faint behind. See the chapter Sky & moon.', source: 'Chamber.swift:186-212' },
], { title: 'The room at rest, 1260 × 860', legendW: 520, caption: 'shots-window/1-invocation · the live window’s layout, Three Fates chosen, 30 Sep 2026 (waning gibbous). The ARCANA light is held off the word in this render.' }))

// the minimum window
const minWin = await L.window(WIN + '12-invocation-small.png', { name: 'Window · Minimum 940 × 660' })
L.add(rest, L.section('The smallest the window goes', { style: 'h2' }))
L.add(rest, L.row([
  L.col([minWin, L.text('shots-window/12-invocation-small · 940 × 660, the minimum.', 'caption', { w: 940 })], { gap: 12, name: 'Minimum window' }),
  L.col([
    L.specs([
      ['Window', 'Minimum 940 × 660; default 1260 × 860. It opens at min(1260, screen − 80) × min(860, screen − 80), centred.', 'ArcanaApp.swift:8-15; RootView.swift:1666-1675'],
      ['Stage', '940 × 628 at the minimum, 1260 × 828 at the default: the window less the 32 pt title bar.', 'RootView.swift:19-159'],
      ['Deck in the ribbon', 'A card is clamp(96…178, 0.215 × H) tall: 178 × 100.6 pt at the default.', 'Game.swift:862-863'],
      ['PRESS AND HOLD', 'y 797.7 on the 1260 × 828 stage, 608.6 on 940 × 628.', 'RootView.swift:450, 454'],
      ['Returned question', 'Its column narrows from 300 pt to 223 pt.', 'Keeping.swift:1049-1078'],
      ['Verse', 'Shrinks to fit, never under 13 pt.', 'RootView.swift:1199-1206'],
    ], { w: 760, keyW: 170 }),
    L.note({ w: 760, tags: ['lesson'], title: 'Check the room in a real window', body: 'A white strip at the foot of the live window once hid from every static render (a safe-area bug). Renders without a title bar sit 16–28 pt higher than the app; judge layout in shots-window/ renders or the running app.' }),
  ], { gap: 24, name: 'At the minimum' }),
], { gap: 56, name: 'Minimum row' }))

// ---------- the title and its passing light ------------------------------------------------
const title = L.board({ name: 'The room · The title and its light', kicker: 'THE ROOM', title: 'The title and its passing light', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'Every 12 s a band of gold crosses ARCANA, masked by the letters. It is the room’s only motion at rest besides the sky, and it rests when no one can see it or when Reduce Motion is on.' })
sec.appendChild(title)
const T = [[1, 0.16], [2, 0.475], [3, 0.791], [4, 1.106], [5, 1.422], [6, 1.737], [7, 2.053], [8, 2.368]]
const fw = (2256 - 3 * 24) / 4
const frames = []
for (const [n, t] of T) frames.push(await L.figure(`type-ink/title/light-${n}-of-8@2x.png`, { w: fw, title: `${t.toFixed(2)} s into the cycle`, caption: `frame ${n} of 8` }))
L.add(title, L.col([L.row(frames.slice(0, 4), { gap: 24 }), L.row(frames.slice(4), { gap: 24 })], { gap: 28, name: 'The pass, eight frames' }))
const tw = await L.window(WIN + '86-title-light.png', { name: 'Window · The light crossing ARCANA' })
tw.rescale(0.72)
L.add(title, L.row([
  L.col([tw, L.text('shots-window/86-title-light · the one render with the light on the word.', 'caption', { w: tw.width })], { gap: 12, name: 'In the room' }),
  L.col([
    L.specs([
      ['Band', 'A linear gradient: clear → gold/metal (#C9A82F) at 95 % → clear, running diagonally (y 0.1 → 0.9), masked by the glyphs over their own ink and glow. In Figma, use #C9A82F at 0 % for the clear stops.', 'RootView.swift:1040-1053'],
      ['Clock', 'k = (t mod 12) / 3.2, t the wall clock. The band moves two widths per unit of k, linearly.', 'RootView.swift:1040-1050'],
      ['What you see', 'Light on the word for about 2.2 s of every 12 s (0.16–2.4 s into the cycle); the bright centre crosses in about 1.6 s.', 'RootView.swift:1040-1050'],
      ['Cost', 'Its clock ticks at 60 fps for 3.3 s of every 12 s and sleeps in between.', 'RootView.swift:1061-1083'],
      ['Rests', 'Paused under Reduce Motion, and when no one can see the window.', 'RootView.swift:1029-1041'],
      ['Under the hold', 'The word, its hairline and its light fade to 1 − 0.9 × charge.', 'RootView.swift:702, 923-953'],
    ], { w: 1100, keyW: 150 }),
    L.note({ w: 1100, tags: ['fixed'], title: 'Earlier notes said “a 3.2 s crossing”', body: '3.2 is the divisor of the clock, not the time on screen. Spec the visible pass: about 2.2 s, centre about 1.6 s.' }),
  ], { gap: 24, name: 'Title light specs' }),
], { gap: 56, name: 'Title light row' }))

L.fit(sec)
await L.arrange('Experience & notes')
return 'room-1 done'
