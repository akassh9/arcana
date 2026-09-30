// Experience & notes · The return & the moon's door (1 of 3) — header, the closing hold, what the return leaves.
// Run with the kit: node design/figma/bridge/run.mjs design/figma/build/pages/experience-b-kit.js design/figma/build/pages/return-moon-1.js
const L = S.lib, K = S.eb
const CH = "The return & the moon's door", PX = CH + ' · '
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Header', 'The closing hold', 'What the return leaves', "The moon's door", 'Kept readings', 'Hold to remember', 'One moon ago', 'Forgetting, and what is kept'].map(n => PX + n)
K.clearMine(sec, ORDER, ORDER.slice(0, 3))

// ---------- header ------------------------------------------------------------------------
const head = K.header(PX + 'Header', {
  title: "The return & the moon's door",
  lead: 'A reading ends the way it began: with a held breath. The ink sinks into the cards, the cards go home, and the moon keeps the reading. Click the moon (or press ↑) and the kept readings lie on the table again, pressed blank until a hold brings the ink back.',
  toc: ['The closing hold', 'What the return leaves', "The moon's door", 'Kept readings', 'Hold to remember', 'One moon ago', 'Forgetting, and what is kept'],
  notes: [
    { tags: ['panel'], title: 'The Return', body: 'A design panel recommended the closing hold on 24 Sep and Akash approved it as a package. They deleted the pre-return backup: “we won’t be going back”.' },
    { tags: ['akash'], title: 'Only returned readings are kept', body: 'Akash agreed that the moon keeps only readings given back with the hold (esc keeps none), and that the written question is kept with them.' },
    { tags: ['akash'], title: 'The returned question goes', body: 'A question comes back under the moon a lunar month later. Akash noticed it disappears once the door opens and said to keep it that way.' },
    { tags: ['claude'], title: 'Kept on this Mac, never counted', body: 'One plain file, sent nowhere. No totals, streaks or reminders. Claude’s proposal, which Akash approved on 26 Sep.' },
  ],
})
sec.appendChild(head)

// ---------- the closing hold ----------------------------------------------------------------
const CW = 2656
const hold = L.board({ name: PX + 'The closing hold', kicker: 'THE RETURN', title: 'The closing hold', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'After the spread rings as one chord, the same press and hold gives the reading back. The room goes quiet, each card’s ink sinks into its stock (last drawn first) and the cards turn face down and go home. The moon takes the reading.',
  tags: [['panel', 'Design panel: The Return'], ['akash', 'Akash approved'], 'shipped'] })
const sw = 496
L.add(hold, L.row([
  await K.win('67-closing-prompt.png', sw, '1 · After the chord', '‘HOLD · RETURN THE CARDS’ fades in (0.8 s) once the spread has rung. Hold the sky, space or return.', { source: 'RootView.swift:1156, 1179-1187' }),
  await K.win('15-returning.png', sw, '2 · The room quiets, the ink sinks', 'At 0.45 of the hold: halos, thread, names and verse have gone, and the last-drawn card is sinking first.', { source: 'Game.swift:298-319' }),
  await K.win('16-blank.png', sw, '3 · Pressed blanks', 'At 0.90: each card is blank stock, its heavy lines left as grooves, keeping its one gold.', { source: 'CardArt.swift:544; CardImages.swift:198' }),
  K.missingFig(sw, Math.round(sw * 860 / 1260), '4 · Face down, and home', 'Faces turn over (0.5 s); after 0.45 s the spread springs home to the deck and lands 0.6 s later.', { title: 'The fly home', body: 'No still of the cards turning over or in flight exists.' }),
  await K.win('51-moon-took.png', sw, '5 · The moon takes it', 'As the cards go home the moon brightens for one breath (5 s). The room is at rest again.', { source: 'Keeping.swift:169-173, 1083-1170' }),
], { gap: 44, align: 'MIN', name: 'Sequence' }))

L.add(hold, L.section('One return, second by second', { style: 'h3', lead: 'Three Fates, held without letting go. Gold bars are what you see, dark ones what you hear or feel. The hold is 3.2 s; with Reduce Motion it is 0.8 s and every window keeps its share of it.', leadW: 1300 }))
L.add(hold, K.timeline([
  { label: 'The hold (press to full)', from: 0, to: 3.2, value: '3.2 s · 0.8 s with Reduce Motion', strong: true },
  { label: 'The room quiets (the hush)', from: 0.256, to: 0.96, value: '0.08 → 0.30 of the hold' },
  { label: 'Card 3 sinks (drawn last)', from: 0.96, to: 1.824, value: '0.30 → 0.57' },
  { label: 'Card 2 sinks', from: 1.392, to: 2.256, value: '0.435 → 0.705' },
  { label: 'Card 1 sinks (drawn first)', from: 1.824, to: 2.688, value: '0.57 → 0.84' },
  { label: 'Each card’s bowl, as it begins to sink', marks: [0.96, 1.392, 1.824], sound: true, value: 'gain 0.20' },
  { label: 'Trackpad pulse at half', marks: [1.6], sound: true, value: '1.60 s' },
  { label: 'Full: haptic land, card-stock slide', marks: [3.2], sound: true, value: 'slide 0.22' },
  { label: 'Faces turn down', from: 3.2, to: 3.7, value: '0.5 s easeInOut' },
  { label: 'The question on the table fades', from: 3.2, to: 3.65, value: '0.45 s easeOut' },
  { label: 'The spread springs home', from: 3.65, to: 4.45, value: 'spring 0.8, damping 0.86' },
  { label: 'The deck lands', marks: [4.25], sound: true, value: 'land 0.25' },
  { label: 'The moon’s breath of light', from: 3.5, to: 8.5, soft: true, value: 'rises 1.4 s, holds to 2.0 s, gone by 5.0 s' },
], { w: CW, t: 10, step: 1, labelW: 440, name: 'Timeline · the return' }))
L.add(hold, L.source('Game.swift:204-214, 270-340 (the hold and the sink), 343-373 (returnCards: turn, home, land); Keeping.swift:1083-1170 (MoonGlow); Sfx cues in Game.swift:326-333, 355, 372', { w: CW }))

const sink = K.timeline([
  { label: 'One Card · the card', from: 0.30, to: 0.84, value: '0.30 → 0.84' },
  { label: 'Three · slot 3', from: 0.30, to: 0.57, value: '0.30 → 0.57' },
  { label: 'Three · slot 2', from: 0.435, to: 0.705, value: '0.435 → 0.705' },
  { label: 'Three · slot 1', from: 0.57, to: 0.84, value: '0.57 → 0.84' },
  { label: 'Five · slot 5', from: 0.30, to: 0.48, value: '0.30 → 0.48' },
  { label: 'Five · slot 4', from: 0.39, to: 0.57, value: '0.39 → 0.57' },
  { label: 'Five · slot 3', from: 0.48, to: 0.66, value: '0.48 → 0.66' },
  { label: 'Five · slot 2', from: 0.57, to: 0.75, value: '0.57 → 0.75' },
  { label: 'Five · slot 1', from: 0.66, to: 0.84, value: '0.66 → 0.84' },
], { w: 1280, t: 1, step: 0.1, labelW: 230, unit: '', name: 'Sink windows' })
L.add(hold, L.row([
  L.col([L.text('Sink windows, as fractions of the hold', 'h3'), sink,
    L.text('Card k of n sinks from a = 0.30 + (n − 1 − k) × s to a + 2s, where s = 0.54 / (n + 1). So the windows overlap by half, and every spread is fully sunk at 0.84.', 'small', { w: 1280 }),
    L.source('Game.swift:298-319', { w: 1280 })], { gap: 14, name: 'Sink windows block' }),
  L.specs([
    ['The curve', 'sink = (progress through the card’s window)^1.8. The face raster fades at 1 − sink over its pressed blank, so it starts slowly and finishes fast.', 'Game.swift:318; CardImages.swift:363-378'],
    ['Letting go', 'The charge drains at twice the speed (1.6 s from full) and the ink rises back. A card let go before its window began waits to sound again.', 'Game.swift:245, 270-283, 326-333'],
    ['Who can hold', 'The sky (pointer anywhere), space or return, once the chord has rung, with the altar closed and the thread not being found.', 'Game.swift:143-145, 204-214'],
    ['Esc instead', 'Esc clears the table at once (0.6 s): the cards fly home and nothing is kept.', 'RootView.swift:213-220; Game.swift:729-752'],
    ['On the way out', 'No gold is written and no new gold appears. The sink is a plain fade.', 'CardImages.swift:363-378'],
  ], { w: 1300, keyW: 150 }),
], { gap: 76, align: 'MIN', name: 'Sink windows and specs' }))
sec.appendChild(hold)

// ---------- what the return leaves ------------------------------------------------------------
const left = L.board({ name: PX + 'What the return leaves', kicker: 'THE RETURN', title: 'What the return leaves', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'A returned card keeps what was pressed or laid: its heavy lines as blind grooves, and its gold leaf. The type, the hatching and the ink’s colour go. Any question on the table stays with the blanks until the cards go home.',
  tags: [['panel', 'Design panel: grooves and gold'], ['panel', 'Gold never re-appears on the way out']] })
L.add(left, L.row([
  await K.stage('shots/13b-sink.png', 1100, 'A card given back', 'Wheel of Fortune and The Sun reversed at 0, 25, 50, 75 and 100 % of their sink.', { source: 'CardImages.swift:363-378' }),
  L.col([
    L.specs([
      ['Survives as a groove', 'Every stroke of 1.2 pt or more.', 'CardArt.swift:540-555'],
      ['Becomes an outline', 'Ink and oxblood fills turn into 1.0 pt outline grooves.', 'CardArt.swift:540-555'],
      ['Vanishes', 'Hatching, hairlines, ticks, fine rays, and all the type: name, numeral and essence.', 'CardArt.swift:544; CardImages.swift:198'],
      ['Stays as leaf', 'Gold fills (without their ink outline) and paper cuts, in drawing order.', 'CardArt.swift:556-573'],
      ['The groove', 'Lit from the upper left: a bright lower-right wall, a shaded upper-left wall, a faint floor. Highlight white at 95 % × 0.85 on face blanks (1.0 on the back).', 'CardImages.swift:186'],
    ], { w: 1300, keyW: 180 }),
    L.row([
      L.note({ w: 638, tags: ['claude'], title: 'The Sun’s eye sinks', body: 'A gold shape lying wholly inside an earlier gold is treated as paint, so the eye on the Sun’s disc goes with the ink and the disc stays.', source: 'CardArt.swift:556-559' }),
      L.note({ w: 638, tags: ['panel'], title: 'The cards go back, the question stays', body: 'The Return and Question in Gold were fused in one line. The written question, and a found thread’s question, stay over the blanks.' }),
    ], { gap: 24, name: 'Notes' }),
  ], { gap: 24, name: 'What survives' }),
], { gap: 76, align: 'MIN', name: 'Sink detail' }))
const gw = Math.floor((CW - 2 * 40) / 3)
L.add(left, L.row([
  await K.win('19-one-blank.png', gw, 'One Card, returned', 'A single blank keeps its gold under the moon.'),
  await K.win('17-returning-five.png', gw, 'The Long Road at 0.55', 'Mid-return: the right-hand cards, drawn last, are already blank.'),
  await K.win('59-returning-minors.png', gw, 'Suit cards keep their gold', 'Three of Swords, Ten of Swords, Five of Cups: the heart, the dawn, the two standing cups.'),
  await K.win('27-blank-asked.png', gw, 'Under the written question', 'The question read back above the spread stays while the ink goes.'),
  await K.win('18-carried.png', gw, 'The thread’s question carried', 'When a thread was found, its gold question is left on the table.'),
  await K.win('30-carried-asked.png', gw, 'Both questions', 'The written question above, the thread’s question below.'),
], { gap: 40, wrap: true, wrapGap: 48, w: CW, align: 'MIN', name: 'Returned states' }))
L.add(left, L.source('shots-window/19-one-blank, 17-returning-five, 59-returning-minors, 27-blank-asked, 18-carried, 30-carried-asked · RootView.swift:970-1025 (epigraph); Keeping.swift:847-855', { w: CW }))
sec.appendChild(left)

await K.finish(sec, ORDER)
return await K.snap([head, hold, left], 'return-moon', PX)
