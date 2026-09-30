// Chapter: Type, step 1 of 2 (header, the face, display / card / voice specimens).
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-lib.js design/figma/build/pages/type-1.js
// Clears the chapter: always run type-2.js after it.
const L = S.lib, F = S.fa
const sec = await L.chapter('Type')
const W = 1600, CW = 1456

// ---- 1. Header and the face ------------------------------------------------------------------
const head = L.board({ name: 'Type · Header', kicker: 'FOUNDATIONS', title: 'Type', w: W, leadW: 1080,
  lead: 'One face: Didot, the Linotype cut that ships with macOS, in Regular, Italic and Bold. Regular is the voice of the reading, Italic is the question and the essences, Bold is names and titles. Every label is small, widely tracked capitals.' })
L.add(head, F.intro(['The face', 'Display, card & voice (20 styles)', 'Caps (14 styles)', 'Parity with the app', 'The one system font']))
const face = async (style, role, sample, sampleStyle, colour) => {
  const aa = L.text('Aa', 'body', { family: 'Didot', style, size: 144, lh: 150, alpha: 1 })
  aa.name = 'Didot ' + style
  return L.col([aa,
    L.text('Didot ' + style, 'h3'),
    L.text(role, 'small', { w: 440 }),
    L.spacer(1, 8),
    await F.styled(sample, sampleStyle, colour, { w: 440 }),
    F.mono(sampleStyle + ' · ' + colour, { w: 440 }),
  ], { gap: 6, w: 456, name: 'Face · Didot ' + style })
}
L.add(head, L.row([
  await face('Regular', 'The voice of the reading: the verse, the altar’s line, the thread’s sentences, every label in capitals.', 'Choose what you can stand inside.', 'Verse/Three', 'ink/text-92'),
  await face('Italic', 'The question you write, the question read back, every essence, the keys’ words, try again.', 'Hold the question in your mind.', 'Voice/Question', 'ink/text-62'),
  await face('Bold', 'Names and titles: ARCANA, THE KEYS, the altar’s card name, the card’s printed name and numeral, the chosen spread.', 'THE HIGH PRIESTESS', 'Display/Altar name', 'ink/text'),
], { gap: 44, name: 'The three faces', align: 'MIN' }))
L.add(head, L.row([
  L.note({ w: 346, tags: ['open'], title: 'Didot is macOS-only', body: 'The app uses the system’s /System/Library/Fonts/Supplemental/Didot.ttc. On Figma in a browser or on Windows these styles fall back to a substitute; check the licence before setting Didot in marketing.' }),
  L.note({ w: 346, tags: ['measured'], title: 'Sizes round to whole points', body: 'SwiftUI’s Font.custom rounds halves up: 8.5 → 9, 9.5 → 10, 11.5 → 12, 12.5 → 13, 13.5 → 14, 18.5 → 19. These styles use the drawn sizes. Only the written question (an NSFont at 19) is exact.', source: 'CardImages.swift:89-94; Quill.swift:139-152' }),
  L.note({ w: 346, tags: ['fixed'], title: 'Tracking is in points', body: 'SwiftUI adds tracking after every glyph, the last one too, so centred titles pad their leading edge by the same amount: ARCANA 10, THE KEYS 8, TYPE 2.6, key caps 1.6. Figma’s letter spacing behaves the same way.', source: 'RootView.swift:1035-1055; Legend.swift:109-126' }),
  L.note({ w: 346, tags: ['claude'], title: 'No ligatures in the pen', body: 'The written question is set with common ligatures off, so a letter’s colour change never breaks an fi or fl apart.', source: 'Quill.swift:139-152' }),
], { gap: 24, name: 'Type notes', align: 'MIN' }))
L.add(head, L.note({ w: CW, fill: '#FFFFFF', fillA: 0.5, title: 'The styles are real', body: 'All 35 are text styles in this file (Display/…, Card/…, Verse/…, Voice/…, Caps/…, System/Field). Each specimen below is set in its style and coloured with its colour variable, so Inspect shows both. Opacity lives in the colour (ink/text-62), not on the layer. The kept identity: Didot and the hand-drawn pen came through the dark-to-light redesign unchanged.' }))
L.add(sec, head)

// ---- 2. Display, card & voice ----------------------------------------------------------------------
const board = L.board({ name: 'Type · Display, card & voice', kicker: 'TYPE', title: 'Display, card & voice', titleStyle: 'h1', w: W, leadW: 1100,
  lead: 'Twenty styles for everything that is not a label. Samples are the app’s own words. Sizes are as drawn; the code size is given where it differs. Line is the line box SwiftUI gives one line.' })
const hdr = L.row(['Style', 'Specimen', 'Size · line · tracking, colour, use'].map((s, i) => L.text(s, 'kicker', { w: F.TYPE_COLS[i] })), { gap: 32, name: 'Header row' })
L.add(board, hdr)
const PAPER = '#F3EDE0'
const R = [
  { style: 'Display/Title', token: 'display/title', sample: 'ARCANA', color: 'ink/text', drawn: 62, lh: 78, tr: 20, pct: 32.3, glow: 'Glow/Title — ARCANA', use: 'The wordmark in the room. A slow gold light crosses it every 12 s. +10 pt leading pad.', source: 'RootView.swift:1035-1055' },
  { style: 'Display/Altar name', token: 'display/altar-name', sample: 'THE HIGH PRIESTESS', color: 'ink/text', drawn: 32, lh: 40, tr: 4, pct: 12.5, glow: 'Glow/Altar name', use: 'The card’s name on the altar; wraps inside a 360 pt column.', source: 'RootView.swift:1466-1471' },
  { style: 'Display/Page title', token: 'display/page-title', sample: 'THE KEYS', color: 'ink/text', drawn: 21, lh: 27, tr: 8, pct: 38.1, glow: 'Glow/Keys title — THE KEYS', use: 'The keys page title, +8 pt leading pad.', source: 'Legend.swift:109-114' },
  { style: 'Card/Name', token: 'card/name', sample: 'THE STAR', color: 'card/ink', bg: PAPER, drawn: 17, lh: 21, tr: 1.4, pct: 8.2, use: 'The printed name, centred in a 182 pt column at (113, 345); up to two lines, shrinks to 70%.', source: 'CardImages.swift:81-88' },
  { style: 'Card/Numeral', token: 'card/numeral', sample: 'XVII', color: 'card/ink', bg: PAPER, drawn: 15, lh: 19, tr: 3.2, pct: 21.3, use: 'The numeral: O, I–XXI; I–X on pips; empty on court cards. At (114, 33).', source: 'CardImages.swift:73-77' },
  { style: 'Card/Essence', token: 'card/essence', sample: 'Water Under Starlight', color: 'card/oxblood', bg: PAPER, code: 12.5, drawn: 13, lh: 16, tr: 0, use: 'The printed essence in oxblood, one line, shrinks to 70%.', source: 'CardImages.swift:89-94' },
  { style: 'Verse/One', token: 'verse/one', sample: 'Choose what you can stand inside.', color: 'ink/text-92', drawn: 27, lh: 33, tr: 0, use: 'A one-card verse. 92% while read, 30% otherwise; fits down to 13 pt in small windows.', source: 'RootView.swift:1199-1227' },
  { style: 'Verse/Three', token: 'verse/three', sample: 'The old street is smaller now.', color: 'ink/text-92', drawn: 22, lh: 27, tr: 0, use: 'A three-card verse, lines 12 pt apart.', source: 'RootView.swift:1199-1227' },
  { style: 'Verse/Five', token: 'verse/five', sample: 'Row for the calmer water.', color: 'ink/text-92', code: 18.5, drawn: 19, lh: 24, tr: 0, use: 'A five-card verse, lines 8 pt apart; 16 pt at 940 × 660, 13 at 940 × 628.', source: 'RootView.swift:1199-1227' },
  { style: 'Altar/Line', token: 'altar/line', sample: 'Less than you can, every day.', color: 'ink/text-92', drawn: 25, lh: 31, tr: 0, use: 'The card’s line on the altar, wrapping inside 360 pt.', source: 'RootView.swift:1494-1497' },
  { style: 'Thread/Body', token: 'thread/body', sample: 'What was rooted is being lifted into the light. The hand that steadies it is already yours.', color: 'ink/text-92', drawn: 19, lh: 24, tr: 0, use: 'The thread’s two sentences, centred, +5 line spacing, column min(660, 0.62 W).', source: 'RootView.swift:1337-1342; Keeping.swift:858-863' },
  { style: 'Settings/Label', token: 'settings/label', sample: 'OpenAI key', color: 'ink/text', drawn: 15, lh: 19, tr: 0, use: 'The one label in Settings.', source: 'Settings.swift:27-29' },
  { style: 'Voice/Question', token: 'voice/question', sample: 'Hold the question in your mind.', color: 'ink/text-62', drawn: 19, lh: 23, tr: 0, colorLabel: 'ink/text-62 at rest → ink/text-98 held, glow Glow/Held question', use: 'The invitation, and the question you write (an NSFont at exactly 19, ligatures off, one line up to 560 pt).', source: 'RootView.swift:766-768, 900; Quill.swift:139-152' },
  { style: 'Altar/Essence', token: 'altar/essence', sample: 'Water Under Starlight', color: 'gold/ink', drawn: 20, lh: 25, tr: 0, use: 'The essence on the altar.', source: 'RootView.swift:1486-1488' },
  { style: 'Thread/Question', token: 'thread/question', sample: 'What would you tend if no one were watching the roots?', color: 'gold/ink', glow: 'Glow/Thread question', drawn: 18, lh: 22, tr: 0, use: 'The thread’s question, centred, +3 line spacing.', source: 'RootView.swift:1353-1359; Keeping.swift:873-879' },
  { style: 'Keys/Description', token: 'keys/description', sample: 'past readings', color: 'ink/text-82', drawn: 17, lh: 21, tr: 0, use: 'The keys page’s words (“choose”, “hold”…), a 150 pt column, left.', source: 'Legend.swift:135-137' },
  { style: 'Voice/Epigraph', token: 'voice/epigraph', sample: 'Should I leave the city before winter', color: 'ink/text-62', drawn: 16, lh: 20, tr: 0, use: 'Your question read back above the spread: one line under a 30 × 1 gold rule.', source: 'RootView.swift:1003-1016' },
  { style: 'Voice/Returned', token: 'voice/returned', sample: 'Should I leave the city before winter', color: 'ink/text-55', code: 13.5, drawn: 14, lh: 17, tr: 0, use: 'The question brought back one moon later, under the moon; up to three lines.', source: 'Keeping.swift:1063-1069' },
  { style: 'Italic/Small', token: 'italic/small', sample: 'try again', color: 'gold/ink', drawn: 13, lh: 16, tr: 0, colorLabel: 'gold/ink (try again) · ink/text-55, gold/ink or card/oxblood in Settings', use: 'try again, and Settings’ verdict line and “Kept in your Keychain.”', source: 'RootView.swift:1324-1327; Settings.swift:34-38' },
  { style: 'Spread/Sub', token: 'spread/sub', sample: 'was · is · tends', color: 'gold/ink', code: 11.5, drawn: 12, lh: 15, tr: 0, colorLabel: 'gold/ink when chosen · ink/text-40 otherwise', use: 'A spread’s gloss under its name, 150 × 15, shrinks to 85%.', source: 'RootView.swift:1114-1119' },
]
for (const d of R) L.add(board, await F.specRow(d))
L.add(sec, board)

L.fit(sec)
await L.arrange('Design system')
return JSON.stringify(await L.snapChapter(sec, 'pages/type', { scale: 0.3 }))
