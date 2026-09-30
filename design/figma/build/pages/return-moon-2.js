// Experience & notes · The return & the moon's door (2 of 3) — the moon's door, kept readings, hold to remember.
// Run with the kit: node design/figma/bridge/run.mjs design/figma/build/pages/experience-b-kit.js design/figma/build/pages/return-moon-2.js
const L = S.lib, K = S.eb
const CH = "The return & the moon's door", PX = CH + ' · '
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Header', 'The closing hold', 'What the return leaves', "The moon's door", 'Kept readings', 'Hold to remember', 'One moon ago', 'Forgetting, and what is kept'].map(n => PX + n)
K.clearMine(sec, ORDER, ORDER.slice(3, 6))
const CW = 2656, MD = 'surfaces/moon-door/'

// ---------- the moon's door --------------------------------------------------------------------
const door = L.board({ name: PX + "The moon's door", kicker: 'WHAT THE MOON KEEPS', title: "The moon's door", titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'The day moon at the top right is the door. Nothing marks it until the pointer finds it. Click it, or press ↑, while the room is at rest and a reading is kept: the room fades away and the last reading lies on the table as the return left it.',
  tags: [['akash', 'Akash approved What the Moon Keeps'], ['claude', 'Claude: the moon is the door'], 'shipped'] })
const moonFig = async (file, w, title, caption, source) => K.stage(MD + file, w, title, caption, { r: 12, shadow: false, stroke: '#000000', source })
L.add(door, L.row([
  await moonFig('detail-moon-rest@2x.png', 300, 'At rest', 'Nothing marks the door. The arrow cursor.', 'Chamber.swift:331-393'),
  await moonFig('detail-moon-hover@2x.png', 300, 'Under the pointer', 'A white halo (50 % → 0 from r 16 to r 46 in a 96 pt square) eases in over 0.3 s; the cursor becomes a pointing hand.', 'Chamber.swift:360-367; Keeping.swift:990-1003'),
  await moonFig('detail-moon-breath-glow@2x.png', 300, 'Taking a reading', 'One breath of pale light to r 96 (70 % → 28 % at 0.42 → 0): rises 1.4 s, holds to 2.0 s, gone by 5.0 s.', 'Keeping.swift:1083-1170'),
  L.col([
    L.specs([
      ['Where', 'r 16 pt at x 0.86 W, y max(70, 0.12 H) of the stage.', 'Keeping.swift:979-1026; Chamber.swift:43-47'],
      ['Inert when', 'Nothing is kept, the room isn’t at rest (mid-reading, holding, charge moving), or the keys are open.', 'Keeping.swift:986-990, 1010'],
      ['Opens with', 'A click on the moon, or ↑ (not while a question is being written).', 'RootView.swift:170-173; Game.swift:582-590'],
      ['Closes with', 'A click on the moon, esc or ↓.', 'Keeping.swift:991-993; RootView.swift:277'],
      ['Sound', 'Opening is silent except the card-stock slide. No bowl of its own.', 'Keeping.swift:227; Sfx.swift:112-120'],
      ['VoiceOver', '“What the moon keeps” (door closed) · “Back to tonight” (open).', 'Keeping.swift:1011'],
    ], { w: 1500, keyW: 150 }),
  ], { gap: 16, name: 'Moon specs' }),
], { gap: 52, align: 'MIN', name: 'The moon, three states' }))

const openT = K.timeline([
  { label: 'The room fades', from: 0, to: 0.4 },
  { label: 'The deck fades', from: 0, to: 0.4 },
  { label: 'The sky’s hold ring goes out', from: 0, to: 0.45 },
  { label: 'The moon turns to that night', from: 0, to: 0.9 },
  { label: 'The page, out of a 4 pt blur', from: 0.3, to: 1.1, value: '0.8 s easeOut after 0.3 s' },
  { label: 'Chevrons fade in', from: 0.3, to: 0.7, value: '0.4 s' },
], { w: 1290, t: 1.6, step: 0.2, labelW: 300, name: 'Timeline · door opens' })
const closeT = K.timeline([
  { label: 'The page fades and blurs', from: 0, to: 0.35 },
  { label: 'Chevrons fade', from: 0, to: 0.5 },
  { label: 'The deck returns', from: 0.4, to: 1.3 },
  { label: 'The room returns', from: 0.45, to: 1.45 },
  { label: 'The hold ring returns', from: 0.5, to: 1.1 },
  { label: 'Page images released', marks: [0.7], sound: true, value: 'memory, unseen' },
], { w: 1290, t: 1.6, step: 0.2, labelW: 300, name: 'Timeline · door closes' })
L.add(door, L.row([
  L.col([L.text('Opening', 'h3'), openT, L.source('Game.swift:582-590; Keeping.swift:206-229, 588-607', { w: 1290 })], { gap: 12, name: 'Opening block' }),
  L.col([L.text('Closing', 'h3'), closeT, L.source('Keeping.swift:231-251; RootView.swift:95-99, 360-367', { w: 1290 })], { gap: 12, name: 'Closing block' }),
], { gap: 76, align: 'MIN', name: 'Door timelines' }))
const dw = Math.floor((CW - 2 * 40) / 3)
L.add(door, L.row([
  await K.win('52-moon-hover.png', dw, 'The room at rest, the moon hovered', 'The halo gathers; the phase name stays under it.'),
  await K.win('surfaces/window/window-default-kept-three-cards-1260x860@2x.png', dw, 'The door open', 'The room gone, a kept reading on the table, the moon on that night.'),
  await K.win('51-moon-took.png', dw, 'Just after a return', 'The breath of light, 1.7 s after the moon took the reading.'),
], { gap: 40, align: 'MIN', name: 'Door states' }))
sec.appendChild(door)

// ---------- kept readings -------------------------------------------------------------------------
const kept = L.board({ name: PX + 'Kept readings', kicker: 'WHAT THE MOON KEEPS', title: 'Kept readings', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'A kept reading lies pressed: cream blanks keeping their gold, the question above, the moon on that night and the date under it. ← and → (or the chevrons) turn to earlier and later readings. The past lies to the left.' })
L.add(kept, await K.annotated('44-kept.png', [
  { x: 490, y: 161, label: 'The question, kept with it', body: 'Set as the live epigraph: a short gold hairline over Didot Italic 16 at 62 %. No question, no line.', tags: [['akash', 'Akash: keep the question']], source: 'Keeping.swift:655-660; RootView.swift:970' },
  { x: 1050, y: 110, label: 'The moon on that night', body: 'It cross-fades to the phase on the night of the reading (0.9 s).', tags: ['claude'], source: 'Chamber.swift:354; Keeping.swift:1015-1045' },
  { x: 1012, y: 167, label: 'The date alone', body: 'Caps 8, tracking 3.6, ink 55 %, 36 pt under the moon’s centre: ‘SEPTEMBER 18’, or ‘SEPTEMBER 18, 2025’ in another year. No phase line: a second line crowded The Long Road in small windows.', tags: [['claude', 'Claude: date-only label']], source: 'Keeping.swift:1015-1045' },
  { x: 325, y: 296, label: 'An earlier reading', body: 'A pen-drawn chevron. It shows only when a reading lies that way.', tags: [['claude', 'Claude: chevrons']], source: 'Keeping.swift:908-975' },
  { x: 934, y: 296, label: 'A later reading', body: 'Mirrored, toward tonight.', source: 'Keeping.swift:908-975' },
  { x: 455, y: 482, label: 'Pressed blanks', body: 'As the return left them: 148 × 262 pt here, each tilted ±0.7° (even −, odd +). Not interactive until remembered.', source: 'Keeping.swift:632-718' },
  { x: 405, y: 647, label: 'The thread’s question', body: 'If a thread was found, its gold question shows over the blanks before remembering, as it stayed on the table during the return.', tags: [['open', 'Whose call: not recorded']], source: 'Keeping.swift:847-890' },
  { x: 532, y: 827, label: 'HOLD · REMEMBER', body: 'The page’s only instruction: Caps 8.5 (draws 9), tracking 4, gold ink 60 %, at H − 32.', tags: [['claude', 'Claude: hold · remember']], source: 'Keeping.swift:892-906' },
], { title: 'A kept Three Fates', w: 1900, legendW: 600, caption: 'shots-window/44-kept · Three Fates kept on 18 Sep with the question “Should I leave the city before winter” and a found thread.' }))

const kw = Math.floor((CW - 40) / 2)
L.add(kept, L.row([
  await K.win('49-kept-one.png', kw, 'One card (remembered)', 'The oldest reading, so only the right chevron shows. The Hermit, “Is it time to call her”, AUGUST 21. The card is 203.4 × 360 pt.', { source: 'Keeping.swift:580-620' }),
  await K.win('48-kept-five.png', kw, 'Five cards (pressed)', 'The Long Road with no question written: The Fool, The Tower reversed, The Empress, The Star, The World. SEPTEMBER 27, the latest, so only the left chevron shows.', { source: 'Keeping.swift:580-720' }),
], { gap: 40, align: 'MIN', name: 'One and five' }))

const chev = async (file, title, caption) => K.stage(MD + file, 180, title, caption, { shadow: false, stroke: '#000000', r: 10 })
L.add(kept, L.section('The chevrons, and turning a page', { style: 'h2', tags: [['claude', 'Claude: pen-drawn chevrons'], ['claude', 'Claude: pages drift from the side time was turned']] }))
L.add(kept, L.row([
  await chev('detail-chevron-left-rest@2x.png', 'Left · rest', 'Ink 36 %.'),
  await chev('detail-chevron-left-hover@2x.png', 'Left · hover', 'Gold ink, gold-light glow 80 %, r 6, in 0.2 s.'),
  await chev('detail-chevron-right-rest@2x.png', 'Right · rest', 'Mirrored.'),
  await chev('detail-chevron-right-hover@2x.png', 'Right · hover', 'Only the one under the pointer lights.'),
  await K.stage(MD + 'detail-chevron-left-in-context@2x.png', 276, 'Beside the first card', 'Half a card + 58 pt from the card’s centre.', { shadow: false, stroke: '#000000', r: 10 }),
  L.specs([
    ['Drawing', 'An open angle by the pen, 12 × 24 pt, stroked 1.0 pt with round caps. Hit area 44 × 64 pt; pointing-hand cursor.', 'Keeping.swift:908-975'],
    ['Place', 'On the card row’s centre line at x = max(30, first card x − (card width / 2 + 58)): x 320.3 and 939.7 for three cards.', 'Keeping.swift:908-926'],
    ['Shown', 'Only when a reading lies that way; fades 0.4 s. Hidden while a card is on the altar.', 'Keeping.swift:928-975'],
    ['Turning', 'The old page fades and blurs in place (0.35 s). The new one drifts 28 pt in from the left (back in time) or the right (toward tonight), out of a 4 pt blur, 0.8 s easeOut after 0.1 s. The date cross-fades 0.6 s. Slide sound 0.18.', 'Keeping.swift:254-261, 588-607, 621-622'],
    ['Reduce Motion', 'Pages only fade (no drift, no blur), and each arrives already remembered.', 'Keeping.swift:330-335, 588-589'],
    ['VoiceOver', '“An earlier reading” · “A later reading”.', 'Keeping.swift:968'],
  ], { w: 1240, keyW: 140 }),
], { gap: 32, align: 'MIN', name: 'Chevrons' }))
sec.appendChild(kept)

// ---------- hold to remember -------------------------------------------------------------------
const rem = L.board({ name: PX + 'Hold to remember', kicker: 'WHAT THE MOON KEEPS', title: 'Hold to remember', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'Holding a kept page runs the return backwards: the ink rises out of the stock card by card, first drawn first, each card’s bowl ringing. Held to the end, the reading is spoken again, and a found thread comes back in the verse’s place.',
  tags: [['claude', 'Claude: hold · remember'], 'shipped'] })
const rw = Math.floor((CW - 3 * 40) / 4)
L.add(rem, L.row([
  await K.win('44-kept.png', rw, '1 · Pressed', 'HOLD · REMEMBER at the foot. Hold the sky, space or return.'),
  await K.win('45-kept-rising.png', rw, '2 · Ink rising (0.45)', 'The invitation and the thread’s question have faded; faces come up out of the blanks.'),
  await K.win('46-kept-remembered.png', rw, '3 · Remembered', 'Faces whole, halos and thread back, position names, the verse spoken again.'),
  await K.win('47-kept-threaded.png', rw, '4 · With its thread', '2.6 s after the chord the thread takes the verse’s place: Didot 19, a gold diamond, the question in gold italic 18.'),
], { gap: 40, align: 'MIN', name: 'Remembering' }))
L.add(rem, L.row([
  L.col([L.text('Remembering three cards, second by second', 'h3'), K.timeline([
    { label: 'The hold', from: 0, to: 3.2, value: '3.2 s · 0.8 s with Reduce Motion', strong: true },
    { label: 'Invitation and thread’s question fade', from: 0, to: 0.512, value: '0 → 0.16 of the hold' },
    { label: 'Card 1 rises (drawn first)', from: 0.512, to: 1.376, value: '0.16 → 0.43' },
    { label: 'Card 2 rises', from: 0.944, to: 1.808, value: '0.295 → 0.565' },
    { label: 'Card 3 rises', from: 1.376, to: 2.24, value: '0.43 → 0.70' },
    { label: 'Halos, thread and names return', from: 2.24, to: 2.944, value: '0.70 → 0.92' },
    { label: 'Bowls, drone swell, pulse at half', marks: [0.512, 0.944, 1.376, 1.6], sound: true, value: 'drone 0.78 at the end' },
    { label: 'Verse lines, 1.45 s apart', marks: [3.9, 5.35, 6.8], sound: true, value: 'bowl 0.26 each, then the chord 0.34' },
  ], { w: 1500, t: 8, step: 1, labelW: 340, name: 'Timeline · remembering' }),
  L.text('The windows are the return’s, reversed: ((1 − progress)^1.8). Let go early and everything sinks back at twice the speed; a bowl that rang may ring again next time.', 'small', { w: 1500 }),
  L.source('Keeping.swift:342-444 (rising), 380-395 (sinking back), 449-478 (recital, thread); Game.swift:37', { w: 1500 })], { gap: 12, name: 'Remembering block' }),
  L.col([
    await K.stage(MD + 'detail-hold-remember@2x.png', 600, 'HOLD · REMEMBER', 'The only words on a pressed page. They fade as the hold begins and are gone once remembered (easeOut 0.6 s).', { shadow: false, stroke: '#000000', r: 10, source: 'Keeping.swift:892-906' }),
    L.note({ w: 600, tags: ['claude'], title: 'As Above is not replayed', body: 'A remembered Wheel, Star, Moon or Sun does not bring the sky’s answer back. A possible follow-up, never discussed with Akash.' }),
  ], { gap: 24, name: 'Invitation' }),
], { gap: 76, align: 'MIN', name: 'Remember timing' }))
const aw = Math.floor((CW - 2 * 40) / 3)
L.add(rem, L.row([
  await K.win('54-kept-altar.png', aw, 'A kept card on the altar', 'Click a remembered card: the same altar as the live table. The page drops to 6 %, the question to 40 %; verse, thread, invitation and chevrons go.', { tags: [['claude', 'Claude: the same altar']], source: 'Keeping.swift:284-308, 639-667' }),
  L.col([
    L.specs([
      ['While held', 'Several holders can hold together: the pointer on the sky, space, return.', 'Keeping.swift:342-379'],
      ['Haptics', 'A pulse at half; a firm ‘land’ when remembered (not with Reduce Motion).', 'Keeping.swift:440-443, 455'],
      ['Reduce Motion', 'A kept page opens already remembered: faces up, verse lines 0.15 s apart after 0.1 s, the thread 0.2 s after the chord.', 'Keeping.swift:310-335, 455-476'],
      ['Not while', 'Turning, forgetting and the altar wait until nothing is held.', 'RootView.swift:268-280'],
    ], { w: aw, keyW: 140 }),
    L.note({ w: aw, tags: ['claude'], title: 'Opening already remembered', body: 'With Reduce Motion there is no hold to watch, so Claude made each page arrive remembered.' }),
  ], { gap: 24, name: 'Remember specs' }),
  K.missingFig(aw, 300, 'A remembered card under the pointer', 'It lifts 12 pt with a gold glow; its halo, node and name brighten and its verse line glows while the others dim to 30 %. Pointing-hand cursor.', { title: 'Hovered kept card', body: 'No render of this state exists.' }, { tags: [['open', 'Needs a render']] }),
], { gap: 40, align: 'MIN', name: 'Remembered states' }))
sec.appendChild(rem)

await K.finish(sec, ORDER)
return await K.snap([door, kept, rem], 'return-moon', PX)
