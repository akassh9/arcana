// Experience & notes · The room (2 of 2) — the question written, the hold, the cut. Run after room-1.js.
const L = S.lib
const sec = await L.chapter('The room', { clear: false })
for (const n of sec.children.filter(n => /^The room · (Writing|The hold|The cut)/.test(n.name))) n.remove()
const WIN = 'shots-window/'

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
const smallWin = async (file, s, title, caption) => {
  const w = await L.window(WIN + file, { name: 'Window · ' + title })
  w.rescale(s)
  return L.col([w, L.text(title, 'smallStrong', { w: w.width }), caption ? L.text(caption, 'caption', { w: w.width }) : null], { gap: 8, name: 'State · ' + title })
}
const pic = async (path, w, title, caption) => L.figure(path, { w, title, caption })

// ---------- the question, written ----------------------------------------------
const wr = L.board({ name: 'The room · Writing the question', kicker: 'THE ROOM', title: 'The question, written', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'Before holding, you may type the question. There is no field, caret or box: the words appear where the invitation was, laid by a pen in gold that cools to ink. It is never sent anywhere, and kept only with a reading you return.',
  tags: ['panel', ['akash', 'Akash: keep the question with the reading']] })
sec.appendChild(wr)
L.add(wr, await annotatedWin(WIN + '19-writing.png', [
  { x: 792, y: 258, label: 'Wet ink at the nib', body: 'The newest letters are lit gold/light (#ECCE6E) for 0.15 s, then cool through gold/metal to ink by 0.9 s. A paste or an input method’s commit is laid as one batch and cools as one.', source: 'Quill.swift:73-88, 217, 248-257' },
  { x: 470, y: 258, label: 'Dry ink', body: 'Style voice/question: Didot Italic 19, ligatures off, ink/text-62 at rest. Letters never move once laid.', source: 'Quill.swift:61-62, 139-152' },
  { x: 628, y: 312, label: 'Always centred', body: 'As the line grows only its centring offset glides (min(0.6, 0.25 + step/700) s, about 0.26 s a letter). The line holds up to 560 pt of ink, about 73 Latin characters.', source: 'RootView.swift:819, 837; Quill.swift:62' },
  { x: 372, y: 373, label: 'Still choosing', body: '← → still choose the spread while writing (they never write); 1 2 3 are only numbers now.', source: 'QuillInput.swift:147-156' },
  { x: 160, y: 520, label: 'No field, no caret', body: 'A hidden 0 × 0 text view takes the keys, so accents, dead keys and input methods work. No selection or cursor is ever drawn.', source: 'QuillInput.swift:120-454' },
], { title: 'Writing, 1260 × 860', legendW: 520, caption: 'shots-window/19-writing · “Should I leave the city before winter”, the last letters still wet.' }))

L.add(wr, L.section('The pen', { style: 'h2', lead: 'Close-ups of the pen at 3×, from the scratch build of the app. Times are the age of the letters.' }))
const CT = ['0.00', '0.05', '0.10', '0.15', '0.25', '0.40', '0.60', '0.90']
const cw = (2256 - 7 * 16) / 8
const cool = []
for (const t of CT) cool.push(await pic(`type-ink/quill/cooling-winter-${t}s@3x.png`, cw, t + ' s', null))
L.add(wr, L.col([L.text('One word cooling, from the nib to dry ink', 'h3'), L.row(cool, { gap: 16, name: 'Cooling' }), L.source('Quill.swift:217, 248-257 · the colour at every 0.05 s is in type-ink/quill/quill.json', {})], { gap: 12, name: 'Cooling block' }))
// every close-up at the same 3× (1 px = 1 unit), in wells of one height so the captions share a line
const well = async (path, w, title, caption) => {
  const im = await L.img(path, { w, name: 'Render · ' + path.split('/').pop() })
  const box = L.frame({ name: 'Well', dir: 'v', w, h: 282, align: 'CENTER', justify: 'CENTER', kids: [im] })
  const cw2 = Math.max(w, 360)
  return L.col([box, L.text(title, 'smallStrong', { w: cw2 }), L.text(caption, 'caption', { w: cw2 })], { gap: 10, name: 'Figure · ' + title })
}
L.add(wr, L.row([
  await well('type-ink/quill/laying-winters@3x.png', 318, 'Laying a word', 'Each letter a moment younger than the last: the oldest dry, the newest lit.'),
  await well('type-ink/quill/ligatures@3x.png', 577, 'Ligatures off', 'Top, the pen: no fi or fl ligature, so a colour change never splits one. Bottom, the same words with ligatures, as the invitation sets them.'),
  await well('type-ink/quill/composing@3x.png', 791, 'An input method composing', 'A dead key’s ´ still being composed, in gold at 75 %, after the laid ink.'),
  await well('type-ink/quill/spent-pen-detail@3x.png', 365, 'The spent pen', 'A key with no room: a 2.4 pt gold/ink dot at 45 %, just past the line. It fades in 0.7 s.'),
], { gap: 48, align: 'MIN', name: 'Pen details' }))
const lineFig = async (path, title, caption) => L.row([
  await L.img(path, { w: 1788, name: 'Render · ' + path.split('/').pop() }),
  L.col([L.text(title, 'smallStrong', { w: 420 }), L.text(caption, 'caption', { w: 420 })], { gap: 4 }),
], { gap: 48, align: 'CENTER', name: 'Figure · ' + title })
L.add(wr, L.col([
  await lineFig('type-ink/quill/full-width@3x.png', 'The longest line', 'A paste cut back to its last whole word inside 560 pt.'),
  await lineFig('type-ink/quill/spent-pen-fading@3x.png', 'The spent touch, 0.35 s later', 'The dot at half strength, just past the last letter; gone after 0.7 s.'),
], { gap: 8, name: 'Full line' }))
L.add(wr, L.row([
  await smallWin('20-written.png', 0.42, 'Written (dry)', 'shots-window/20-written'),
  await smallWin('26-long.png', 0.42, 'The longest question', 'shots-window/26-long'),
  await smallWin('74-spent.png', 0.42, 'Line full, the spent touch', 'shots-window/74-spent'),
  await smallWin('75-ime-composition.png', 0.42, 'An input method composing', 'shots-window/75-ime-composition'),
], { gap: 32, name: 'Writing states' }))
L.add(wr, L.row([
  L.note({ w: 540, title: 'Deleting', body: '⌫ a letter, ⌥⌫ a word, ⌘⌫ the whole line; esc erases it at once. Emptied, the invitation breathes back after 0.6 s.', source: 'QuillInput.swift:324-327, 362-372; Quill.swift:199-212' }),
  L.note({ w: 540, title: 'Pasting', body: '⌘V pastes, cleaned and cut back to its last whole word that fits.', source: 'QuillInput.swift:100-109, 418-430' }),
  L.note({ w: 540, tags: ['claude'], title: 'Ligatures off', body: 'Claude turned the pen’s ligatures off so letters of different ages never share one glyph.', source: 'Quill.swift:139-152' }),
  L.note({ w: 540, tags: ['open'], title: 'English only', body: 'The 560 pt line is about 73 Latin characters; there is no localisation anywhere in the app.', source: 'Quill.swift:62' }),
], { gap: 32, name: 'Writing notes' }))

// ---------- the hold -----------------------------------------------------------------
const hold = L.board({ name: 'The room · The hold', kicker: 'THE ROOM', title: 'The hold', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'Press anywhere on the sky, or hold space or return, for 3.2 s: one slow inhale. The room fades back, a ring of light fills round the deck, and a written question is given to it as gold dust. Let go early and it all drains back at twice the speed; nothing is lost.',
  tags: [['claude', 'Hold to ask · kept by Akash'], 'panel'] })
sec.appendChild(hold)
L.add(hold, await annotatedWin(WIN + '21-giving.png', [
  { x: 772, y: 596, label: 'The charge', body: 'Fills clockwise from twelve, linear over 3.2 s: 14 pt and 6 pt gold/light glows under a 1.8 pt gold/ink core, round caps, a spark at its head.', source: 'Chamber.swift:530-548; Game.swift:182-203, 236-269' },
  { x: 706, y: 430, label: 'The question as dust', body: 'From charge 0.45 (1.44 s in) each letter, in the order written, thins away over a tenth of the charge while its gold falls as one mote and spirals into the deck.', source: 'Quill.swift:219-235; Chamber.swift:469, 583-611' },
  { x: 792, y: 258, label: 'The letters still held', body: 'Darken and glow as the charge rises: ink 0.62 + 0.36c, glow gold/light 0.9c at radius 14 (effect Glow/Held question).', source: 'RootView.swift:923-953' },
  { x: 410, y: 213, label: 'The room quiets', body: 'Title, hairline, spreads, the moon’s name and a returned question fade to 1 − 0.9c; PRESS AND HOLD to 1 − c. The spreads can’t be clicked while holding.', source: 'RootView.swift:449, 702, 710-745' },
  { x: 160, y: 520, label: 'The whole sky is the button', body: 'Press anywhere, over the words too. Or hold return, or space (on a written line space must be held 0.28 s; a tap is a space). Key and pointer can hold together; the last to lift lets go.', source: 'RootView.swift:420-436; QuillInput.swift:306-355' },
  { x: 1090, y: 700, label: 'Sound and touch', body: 'A swell rises from the current charge and the drone climbs from 0.42 to 0.92; the trackpad pulses at half. Letting go fades the swell in 0.35 s.', source: 'Game.swift:202, 231, 250-253, 267' },
], { title: 'Holding a written question, 1260 × 860', legendW: 520, caption: 'shots-window/21-giving · about two thirds of the way through the hold: “Should I leave the city be” already given, “fore winter” still held.' }))

L.add(hold, L.section('The ring, the words and the dust as the charge rises', { style: 'h2', lead: 'Renders of each part alone, from the scratch build. Charge runs 0 → 1 over 3.2 s.' }))
const RC = [['0.0', '0'], ['0.25', '0.25'], ['0.5', '0.5'], ['0.75', '0.75'], ['1.0', '1']]
const rings = []
for (const [f, c] of RC) rings.push(await pic(`sky/near/ring-charge-${f}@4x.png`, 240, 'charge ' + c, (Number(c) * 3.2).toFixed(1) + ' s'))
rings.push(await pic('sky/near/ring-rest-breath-0@4x.png', 240, 'at rest, breath out', 'the 10 s breath'))
rings.push(await pic('sky/near/ring-rest-breath-1@4x.png', 240, 'at rest, breath in', ''))
L.add(hold, L.col([L.row(rings, { gap: 36, name: 'Ring' }), L.source('Chamber.swift:449-480, 530-548 · vector versions: sky/near/ring-vector-charge-*.svg', {})], { gap: 12, name: 'Ring block' }))
const HC = ['0.00', '0.44', '0.60', '0.76', '0.85']
const held = []
for (const c of HC) held.push(await pic(`type-ink/quill/held-${c}@3x.png`, 420, 'charge ' + c, null))
L.add(hold, L.col([L.text('The written question while it is held', 'h3'), L.row(held, { gap: 34, name: 'Held' }), L.source('RootView.swift:873, 884, 923-953; Quill.swift:219-235', {})], { gap: 12, name: 'Held block' }))
const DC = [['1', '0.44'], ['3', '0.58'], ['5', '0.74'], ['7', '0.94']]
const dust = []
for (const [n, c] of DC) dust.push(await pic(`type-ink/quill/given-as-dust-${n}-charge-${c}@3x.png`, 400, 'charge ' + c, null))
dust.push(await smallWin('2-holding.png', 0.46, 'Holding with nothing written', 'shots-window/2-holding · no dust; the invitation itself darkens and glows.'))
L.add(hold, L.col([L.text('The question given as dust', 'h3'), L.row(dust, { gap: 34, align: 'MIN', name: 'Dust' }), L.source('Chamber.swift:583-611; Quill.swift:219-235 · mote formulas in type-ink/quill/given-as-dust.json', {})], { gap: 12, name: 'Dust block' }))
L.add(hold, L.row([
  L.note({ w: 540, title: 'Letting go early', body: 'The charge drains at twice the speed (1.6 s from full). Press again and it resumes from where it is. Esc lets go too.', source: 'Game.swift:219-234, 260-265' }),
  L.note({ w: 540, title: 'Motes only go forward', body: 'The dust never flies back up. Let go and the motes in the air fade where they are; the last letter leaves at charge 0.70 (2.24 s).', source: 'Chamber.swift:469, 583-611; Quill.swift:219-235' }),
  L.note({ w: 540, title: 'Reduce Motion', body: 'The hold takes 0.8 s, and the letters fade as a whole instead of leaving one by one.', source: 'Game.swift:201; RootView.swift:831-834' }),
  L.note({ w: 540, tags: ['panel'], title: 'Question in Gold', body: 'The design panel’s runner-up, fused with The Return as “the cards go back, the question stays”. Built on 24 Sep.' }),
], { gap: 32, name: 'Hold notes' }))

// ---------- the cut ------------------------------------------------------------------
const cut = L.board({ name: 'The room · The cut', kicker: 'THE ROOM', title: 'The cut', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'When the charge is full the deck is cut: a flash at the deck and a ring of light across the sky, a riffle and a low bowl. The question is taken, the room’s words vanish at once, and the 78 cards open into the ribbon.' })
sec.appendChild(cut)
L.add(cut, await pic('sky/near/flash-cut-strip-over-sky.png', 2256, 'The flash and ripple over the resting sky', '0.00 · 0.15 · 0.35 · 0.65 · 1.00 · 1.60 s after the cut (sky/near/flash-cut-strip-over-sky; the single frames are alpha overlays for the whole window).'))
const drain = []
for (const [n, t] of [[1, '0.40'], [2, '0.80'], [3, '1.20'], [4, '1.44']]) drain.push(await pic(`sky/near/ring-draining-${n}-${t}s@4x.png`, 200, t + ' s', null))
const deal = await smallWin('3-draw.png', 0.95, 'Then the draw', 'shots-window/3-draw · the ribbon of 78, the empty slots and DRAW THREE.')
L.add(cut, L.row([
  L.col([L.text('The ring after the cut', 'h3'), L.row(drain, { gap: 20, name: 'Ring draining' }), L.text('It stays whole for about 0.53 s, then fades over about 1.07 s (opacity min(1, 1.5c) as the charge drains).', 'small', { w: 860 }), L.source('Game.swift:229-233, 258; Chamber.swift:449-480', {}),
    L.specs([
      ['Flash', 'White 85 % → gold/light 35 %, from radius 70 to 70 + 240 × strength (1.5); fades as k² over 1.3 s.', 'Chamber.swift:613-636; Game.swift:812-822'],
      ['Ripple', 'A 7 pt gold/light 35 % ring with a 1 pt gold/ink 45 % core, easing out (cubic) across the sky over 2.2 s.', 'Chamber.swift:613-636'],
      ['Sound', 'A riffle, a handful of uneven ticks (gain 0.8), and the deck’s dark bowl on C3 (0.55). The drone settles to 0.62.', 'Game.swift:411-413; Sfx.swift:514'],
      ['Touch', 'A firm click on a Force Touch trackpad.', 'Game.swift:409'],
      ['The deck', 'Reshuffled at the cut, with each card’s reversal drawn (42 %). The question never touches the shuffle.', 'Game.swift:155-157, 379-416'],
      ['The words', 'Title, invitation, spreads and PRESS AND HOLD vanish at once; they come back only with the room.', 'RootView.swift:93-99, 458'],
      ['The deal', 'Each card springs from the squared deck to its place on the ribbon (spring 0.72 / 0.8), 6.8 ms apart, turning up to ±12°.', 'RootView.swift:408-411; Game.swift:415'],
    ], { w: 900, keyW: 120 }),
  ], { gap: 14, name: 'After the cut' }),
  deal,
], { gap: 64, align: 'MIN', name: 'Cut row' }))

L.fit(sec)
await L.arrange('Experience & notes')
return await L.snapChapter(sec, 'pages/room', { scale: 0.3 })
