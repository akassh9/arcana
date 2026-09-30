// Experience & notes · The return & the moon's door (3 of 3) — one moon ago; forgetting, the kept file, small windows.
// Run with the kit: node design/figma/bridge/run.mjs design/figma/build/pages/experience-b-kit.js design/figma/build/pages/return-moon-3.js
const L = S.lib, K = S.eb
const CH = "The return & the moon's door", PX = CH + ' · '
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Header', 'The closing hold', 'What the return leaves', "The moon's door", 'Kept readings', 'Hold to remember', 'One moon ago', 'Forgetting, and what is kept'].map(n => PX + n)
K.clearMine(sec, ORDER, ORDER.slice(6, 8))
const CW = 2656, MD = 'surfaces/moon-door/'

// ---------- one moon ago ------------------------------------------------------------------------
const ago = L.board({ name: PX + 'One moon ago', kicker: 'WHAT THE MOON KEEPS', title: 'One moon ago', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'A lunar month after a question was asked, when the moon is back where it was that night, the question comes back faintly under it in the room at rest. Opening the door opens on that reading, and the returned question is gone.',
  tags: [['claude', 'Claude: ONE MOON AGO'], ['akash', 'Akash: it goes once the door opens, keep it that way']] })
L.add(ago, L.row([
  await K.win('50-brought-back.png', 1500, 'The room at rest, one moon on', 'Under WANING GIBBOUS: ONE MOON AGO, then “Should I leave the city before winter”, asked 29.6 days before.', { source: 'Keeping.swift:1049-1081' }),
  L.col([
    await K.stage(MD + 'detail-one-moon-ago@2x.png', 680, 'The moon’s corner at 2×', null, { shadow: false, stroke: '#000000', r: 10 }),
    L.specs([
      ['When', 'From one synodic month (29.53 days) − 12 h to + 36 h after the reading: a window of about 48 h.', 'Keeping.swift:194-200'],
      ['Which', 'Only readings with a written question that has not come back before; if several qualify, only the latest.', 'Keeping.swift:194-200'],
      ['The words', '‘ONE MOON AGO’ in Caps 7, tracking 3.2, ink 36 % (the smallest type in the app). 8 pt below, the question in Didot Italic 13.5 (draws 14) at ink 55 %: centred, up to 3 lines, min(300, (W − moon x) × 2 − 40) pt wide.', 'Keeping.swift:1049-1081'],
      ['Until', 'The door opens. It opens on that reading, and every reading asked within 36 h of it is marked broughtBack, so none comes back again. Or the window passes.', 'Keeping.swift:209-222'],
    ], { w: 1100, keyW: 110 }),
  ], { gap: 24, name: 'One moon ago specs' }),
], { gap: 56, align: 'MIN', name: 'One moon ago' }))
L.add(ago, L.row([
  await K.win('55-brought-back-small.png', 940, 'The longest question, smallest window', '940 × 660: the question wraps to two lines under the moon.'),
  L.col([
    L.note({ w: 760, tags: ['akash'], title: 'Gone once opened', body: 'Akash noticed the returned question disappears as soon as the door opens, and said to keep it that way. It comes back once, then it is only in the kept reading.' }),
    L.note({ w: 760, tags: ['claude'], title: 'ONE MOON AGO', body: 'Claude’s words and the lunar-month idea. The −12 h / +36 h window is an implementation detail that was never discussed with Akash.' }),
    L.note({ w: 760, tags: ['open'], title: 'At the edge of legibility', body: 'Caps 7 at ink 36 % is about 2.2:1 on the sky. It is meant to be almost missed, but see Edge cases & accessibility.' }),
  ], { gap: 20, name: 'One moon ago notes' }),
], { gap: 56, align: 'MIN', name: 'Small and notes' }))
sec.appendChild(ago)

// ---------- forgetting, and what is kept -----------------------------------------------------
const fk = L.board({ name: PX + 'Forgetting, and what is kept', kicker: 'WHAT THE MOON KEEPS', title: 'Forgetting, and what is kept', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: '⌘⌫ lets a kept reading go for good. What the moon keeps is one small file on this Mac, sent nowhere and never counted.' })
const caps = await Promise.all(['keycap-command-forget-a-reading', 'keycap-delete-forget-a-reading'].map(n => L.svg('glyphs/ui/keys/' + n + '.svg', { h: 72 })))
const capRow = L.row(caps, { gap: 16, name: 'Keys · ⌘⌫', align: 'CENTER' })
L.add(fk, L.row([
  L.col([
    L.row([capRow, L.text('forget a reading', 'voice', { alpha: 0.82 })], { gap: 28, align: 'CENTER', name: 'Keys line' }),
    L.text('The pen-drawn keycaps from the keys page, at 3×.', 'caption'),
    L.specs([
      ['When', 'A kept page is on the table, nothing is held, no card is on the altar.', 'RootView.swift:268-272; Keeping.swift:176-178'],
      ['What happens', 'The reading is deleted from kept.json at once. A low dark bowl (C3, gain 0.22). The reading before it fades in with no drift, or the one after if it was the first. If it was the last, the door closes.', 'Keeping.swift:176-189'],
      ['No way back', 'No undo, no confirmation.', 'Keeping.swift:176-189'],
      ['Why ⌘', 'With no undo, a bare ⌫ was too easy to press. While writing a question, ⌘⌫ clears the line instead.', 'RootView.swift:268-272; QuillInput.swift:362-372'],
    ], { w: 1240, keyW: 140 }),
    L.row([
      L.note({ w: 608, tags: [['claude', 'Claude: ⌘⌫']], title: 'A modifier, because nothing undoes it', body: 'Claude’s choice while building. It is also on the keys page as ‘forget a reading’.' }),
      K.missing(608, 150, 'Forgetting in motion', 'No render of a page being let go exists.'),
    ], { gap: 24, align: 'MIN', name: 'Forget notes' }),
  ], { gap: 20, name: 'Forgetting' }),
  L.col([
    K.code(`// ~/Library/Application Support/Arcana/kept.json (INVENTED example)
{ "readings": [
  { "at": "2026-09-18T22:15:30Z",
    "cards": [ { "card": "sun",       "reversed": false },
               { "card": "priestess", "reversed": false },
               { "card": "death",     "reversed": true } ],
    "id": "1A7E0000-0000-4000-8000-000020260918",
    "question": "Should I leave the city before winter",
    "spread": "three",
    "thread": {
      "question": "What would you tend if no one were watching the roots?",
      "thread": "What was rooted is being lifted into the light. The hand that steadies it is already yours." } },
  { "at": "2026-08-18T21:42:07Z",
    "broughtBack": "2026-09-17T08:03:51Z",
    "cards": [ { "card": "hermit", "reversed": false } ],
    "question": "Is it time to call her", "spread": "one", … } ] }`, 1320, { title: 'The kept file', source: 'Keeping.swift:18-23 (kept on this Mac, sent nowhere), 36-50 (Kept), 499-514 (encoder) · surfaces/kept-sample.json' }),
    L.specs([
      ['What is kept', 'When, the spread, each card and whether it was reversed, the written question (if any), and the thread (if one was found). Not the verse: that is read from the deck.', 'Keeping.swift:27-50'],
      ['What is not', 'Readings cleared with esc. Nothing is counted: no totals, no streaks, no reminders.', 'Game.swift:350; Keeping.swift:18-23'],
      ['This example', 'Invented for this handoff in the app’s own encoding. It is not Akash’s file.', 'surfaces/kept-sample.json'],
    ], { w: 1320, keyW: 140 }),
  ], { gap: 20, name: 'The kept file' }),
], { gap: 96, align: 'MIN', name: 'Forget and file' }))

L.add(fk, L.section('Small windows', { style: 'h2', lead: 'The door works the same at the smallest window, 940 × 660 (a 940 × 628 stage under the title bar). The cards and the verse shrink toward their floors; the date stays a single line.' }))
const sw = Math.floor((CW - 2 * 40) / 3)
L.add(fk, L.row([
  await K.win('53-kept-small.png', sw, 'A kept Long Road, remembered', 'shots-window/53-kept-small · 940 × 660.'),
  await K.win('55-brought-back-small.png', sw, 'One moon ago', 'shots-window/55-brought-back-small · 940 × 660.'),
  await K.stage(MD + 'kept-page-five-cards-940x660@2x.png', sw, 'Five cards remembered, all five lines', 'surfaces/moon-door/kept-page-five-cards-940x660 · stage render, no title-bar inset: the whole 940 × 660 is stage, so everything sits about 16 pt higher than in the app.'),
], { gap: 40, align: 'MIN', name: 'Small windows' }))
sec.appendChild(fk)

await K.finish(sec, ORDER)
return await K.snap([ago, fk], 'return-moon', PX)
