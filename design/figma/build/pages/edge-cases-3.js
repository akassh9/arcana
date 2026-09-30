// Experience & notes · Edge cases & accessibility (3 of 3) — VoiceOver; interaction states; language and input.
// Run with the kit: node design/figma/bridge/run.mjs design/figma/build/pages/experience-b-kit.js design/figma/build/pages/edge-cases-3.js
const L = S.lib, K = S.eb
const CH = 'Edge cases & accessibility', PX = CH + ' · '
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Header', 'Small windows', 'Large windows', 'Reduce Motion', 'Contrast', 'VoiceOver', 'Interaction states', 'Language and input'].map(n => PX + n)
K.clearMine(sec, ORDER, ORDER.slice(5, 8))
const CW = 2656, OPEN = '#8A4B12'

// ---------- voiceover ---------------------------------------------------------------------------
const vo = L.board({ name: PX + 'VoiceOver', kicker: 'ACCESSIBILITY', title: 'VoiceOver', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'Six things carry a spoken label; the table carries none. A VoiceOver reader can mute, open the keys, open the moon’s door and turn kept pages, but no card on the table is an element, so the draw and the altar can’t be reached. From the code; never tried with VoiceOver running.',
  tags: [['open', 'Needs a design decision'], ['open', 'Not tested with VoiceOver']] })
const said = [
  ['The question line', '“Hold the question in your mind.”, or the written question', 'The invisible text page under it is not an element; this line speaks for it.', 'RootView.swift:797'],
  ['The singing bowl', '“Sound”, a toggle, value On or Off', '', 'RootView.swift:1600-1602'],
  ['The old key', '“The keys”, a toggle, value Open or Closed', '', 'Legend.swift:324-326'],
  ['The keys page', '“The keys”, containing seven lines read as “left arrow right arrow: choose” … “command comma: settings”', 'The keycaps are ignored; each line is one element.', 'Legend.swift:141-153'],
  ['The moon', '“What the moon keeps” (closed) · “Back to tonight” (open)', 'No value or hint says whether anything is kept.', 'Keeping.swift:1011'],
  ['The chevrons', '“An earlier reading” · “A later reading”', '', 'Keeping.swift:968'],
]
const saidT = L.table([{ label: 'Element', w: 220 }, { label: 'VoiceOver says', w: 460 }, { label: 'Note', w: 300 }, { label: 'Source', w: 170 }],
  said.map(r => [L.text(r[0], 'smallStrong', { w: 220 }), L.text(r[1], 'small', { w: 460 }), L.text(r[2], 'small', { w: 300 }), L.source(r[3], { w: 170 })]), { name: 'Spoken labels', zebra: true })
const gaps = [
  ['Every card on the table', 'The deck, the ribbon, the spread and kept spreads are pictures under clear hit rectangles, with no element, label or action. A card’s name is never spoken.', 'RootView.swift:367-400; Keeping.swift:674-718'],
  ['The altar', 'Only a click on a card opens it, so it can’t be reached (there is no keyboard way either).', 'RootView.swift:371-399'],
  ['The hold', 'Press and hold has no accessibility action. Space and return work from the keyboard.', 'RootView.swift:193-212, 420-436'],
  ['The spread choices, FIND THE THREAD, try again', 'Plain buttons read from their own text, as SwiftUI does by default: no hints.', 'RootView.swift:1085-1133, 1294-1330'],
  ['The sky and As Above', 'Not elements. The sky’s answers to the Wheel, Star, Moon and Sun are silent to VoiceOver.', 'Chamber.swift:419-426; Answers.swift'],
]
const gapT = L.table([{ label: 'Gap', w: 260 }, { label: 'Today', w: 680 }, { label: 'Source', w: 270 }],
  gaps.map(r => [L.text(r[0], 'smallStrong', { w: 260, color: OPEN }), L.text(r[1], 'small', { w: 680 }), L.source(r[2], { w: 270 })]), { name: 'Gaps', zebra: true })
L.add(vo, L.row([
  L.col([L.text('What is spoken', 'h3'), saidT], { gap: 12, name: 'Spoken block' }),
  L.col([L.text('What is missing', 'h3'), gapT], { gap: 12, name: 'Gaps block' }),
], { gap: 56, align: 'MIN', name: 'VoiceOver tables' }))
L.add(vo, L.row([
  L.note({ w: 860, tags: ['open'], title: 'Cards as elements', body: 'Each placed card could be an element labelled with its name and position (‘The Star, what tends’), with an action to open the altar. The verse lines already carry the meaning as text.' }),
  L.note({ w: 860, tags: ['open'], title: 'A keyboard path to the altar', body: 'Today the reading ignores ← → ↑ 1 2 3. A keyboard way to open a card would also give VoiceOver a way in.' }),
  L.note({ w: 860, tags: ['fixed'], title: 'Tooltips were removed', body: 'The room had tooltips until 24 Sep. Nothing replaced them for hover, so the labels above are the only names things have.' }),
], { gap: 38, align: 'MIN', name: 'VoiceOver notes' }))
sec.appendChild(vo)

// ---------- interaction states ------------------------------------------------------------------------
const NONE = '—  none'
const cell = (s, w) => L.text(s, 'small', { w, color: s.startsWith('—') ? OPEN : L.C.ink, alpha: s.startsWith('—') ? 1 : 0.86 })
const M = [
  ['Spread choices', 'Chosen: bracketed, gold gloss, bold. Others text 48 %.', NONE, 'System plain-button dim', NONE, 'Not clickable while holding or while the room comes back; quieted by the charge (1 − 0.9 × charge)', 'Arrow', 'RootView.swift:1085-1133'],
  ['FIND THE THREAD', 'Gold Caps 10 beside the thread glyph', NONE, 'System plain-button dim', NONE, 'Shown only with a working key; becomes ‘LETTING THE CARDS SETTLE’ while asking', 'Arrow', 'RootView.swift:1294-1321'],
  ['try again', 'Gold italic 13', NONE, 'System plain-button dim', NONE, 'Hidden for a refused key', 'Arrow', 'RootView.swift:1324-1330'],
  ['The singing bowl', 'Text 50 % with its two arcs; muted 30 %, no arcs', NONE, 'System plain-button dim', NONE, '—', 'Arrow', 'RootView.swift:1590-1640'],
  ['The old key', 'Text 50 %; lit gold while the keys are open', NONE, 'System plain-button dim', NONE, '—', 'Arrow', 'Legend.swift:312-376'],
  ['The moon (door)', 'Nothing marks it', 'White halo, 0.3 s', NONE, NONE, 'Inert when nothing is kept, the room isn’t at rest, or the keys are open', 'Pointing hand', 'Keeping.swift:979-1026; Chamber.swift:360-367'],
  ['Chevrons', 'Ink 36 %', 'Gold ink + gold glow, 0.2 s', NONE, NONE, 'Hidden when no reading lies that way, or under the altar', 'Pointing hand', 'Keeping.swift:908-975'],
  ['Ribbon cards (the draw)', 'Face down along the arc', 'The hand: lifts up to 38 pt, gold glow, a chime', 'Click takes it', '← → move the hand (no ring)', '—', 'Pointing hand', 'RootView.swift:371-399; Game.swift:433-455'],
  ['Cards in the reading', 'Written, halo 0.34', 'Lifts 12 pt, gold glow; its verse line lit, others 30 %', 'Click opens the altar', NONE, 'Dimmed to 4 % under the altar; no hover while holding', 'Pointing hand', 'RootView.swift:367-400, 1199-1227'],
  ['Kept cards', 'Pressed blank', 'Lifts 12 pt, gold glow (remembered only)', 'Click opens the altar', NONE, 'Not interactive while pressed, leaving or under the altar', 'Pointing hand', 'Keeping.swift:674-718'],
  ['The sky (the hold)', 'Hold ring at rest', NONE, 'The hold itself: the ring fills, the room answers', 'Space or return hold', 'Off during the draw', 'Arrow', 'RootView.swift:420-436'],
  ['The altar', 'The card floating, its words', 'The card tilts toward the pointer', 'Click anywhere closes', 'Space, return or esc close', '—', 'Arrow', 'RootView.swift:1393-1521'],
  ['The question line', 'The invitation at text 62 %', NONE, NONE, 'Always owns the keys at rest; no caret, no ring', 'Silent while held; ‘spent’ when the line is full', 'Arrow', 'RootView.swift:759-900; QuillInput.swift'],
  ['Settings field', 'System secure field', 'System', 'System', 'System focus ring and caret', 'System', 'I-beam', 'Settings.swift:30-32'],
]
const mt = L.table([
  { label: 'Control', w: 220 }, { label: 'Rest', w: 330 }, { label: 'Hover', w: 300 }, { label: 'Pressed', w: 260 },
  { label: 'Keyboard focus', w: 260 }, { label: 'Inert or disabled', w: 360 }, { label: 'Cursor', w: 120 }, { label: 'Source', w: 290 }],
  M.map(r => [L.text(r[0], 'smallStrong', { w: 220 }), cell(r[1], 330), cell(r[2], 300), cell(r[3], 260), cell(r[4], 260), cell(r[5], 360), cell(r[6], 120), L.source(r[7], { w: 290 })]),
  { name: 'State matrix', zebra: true, gap: 16 })
const st = L.board({ name: PX + 'Interaction states', kicker: 'ACCESSIBILITY', title: 'Interaction states', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'Every control, and the states it has today. The text buttons (the spreads, FIND THE THREAD, try again, the bowl, the key) have no hover look and only the system’s dim when pressed. Nothing anywhere shows keyboard focus: the stage is focusable with its focus effect turned off. The gaps are marked “none”.',
  tags: [['open', 'Missing states'], ['fixed', 'Tooltips removed 24 Sep']] })
L.add(st, mt)
L.add(st, L.row([
  L.note({ w: 860, tags: ['open'], title: 'Hover for the text buttons', body: 'Only the moon, the chevrons and cards answer the pointer. The spreads and the bowl could borrow the chevrons’ gold-and-glow, which already reads as “this can be pressed” in the room’s language.' }),
  L.note({ w: 860, tags: ['open'], title: 'A focus look', body: 'Keyboard focus is invisible because the room owns the keys itself. If Tab ever moves focus, it needs a look that isn’t macOS’s blue ring.', source: 'RootView.swift:35-36' }),
  L.note({ w: 860, tags: ['open'], title: 'Pressed', body: 'SwiftUI’s plain-button dim is the only press feedback on the text buttons. The hold has its own, richer feedback; small buttons have none of the room’s own.' }),
], { gap: 38, align: 'MIN', name: 'State notes' }))
sec.appendChild(st)

// ---------- language and input --------------------------------------------------------------------
const li = L.board({ name: PX + 'Language and input', kicker: 'EDGE CASES', title: 'Language and input', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'Arcana speaks English only, and its fixed widths were drawn around English. It takes four kinds of input: hover, click, press and hold, and keys. Everything else is ignored, which is worth knowing before specifying a gesture.',
  tags: [['open', 'English only'], ['claude', 'Claude: British spelling']] })
L.add(li, L.row([
  L.col([L.text('Language', 'h2'), L.specs([
    ['Strings', 'Every word on screen is a Swift string literal. No Localizable.strings, no String Catalog.', 'Deck.swift; RootView.swift; Legend.swift; Keeping.swift'],
    ['Dates', 'Forced to en_US: ‘SEPTEMBER 18’, ‘SEPTEMBER 18, 2025’ in another year.', 'Keeping.swift:1016-1022'],
    ['The question line', '560 pt, one line, Didot Italic 19: about 73 Latin characters. The pen stops at a word that won’t fit.', 'Quill.swift:61-62, 139-152'],
    ['Card names', 'A 182 pt column, up to 2 lines, shrinking to 70 %. About 29 of the 78 English names already wrap.', 'CardImages.swift:81-88'],
    ['Spread names and glosses', '150 × 15 pt each, shrinking to 82 % and 85 %.', 'RootView.swift:1107-1119'],
    ['The keys page', 'Two 150 pt columns, so a line’s words must fit 150 pt of Didot Italic 17.', 'Legend.swift:117-146'],
    ['Settings', 'A fixed 402 pt window: ‘OpenAI key’ plus a 250 pt field.', 'Settings.swift:24-40'],
    ['Caps labels', 'Tracked small capitals (tracking 2.6–4.2). Tracking assumes Latin capitals.', 'Palette.swift:81-100'],
    ['Spelling', 'British in the app’s own words: ‘Judgement’, ‘instalments’.', 'Deck.swift:115, 143'],
    ['Not tried', 'Right-to-left layout, and questions typed in scripts Didot doesn’t cover.', null],
  ], { w: 1270, keyW: 190 })], { gap: 16, name: 'Language' }),
  L.col([L.text('Input the room ignores', 'h2'), L.specs([
    ['Gestures', 'No scroll, pinch or swipe: a trackpad scroll over the ribbon does nothing. No context menus, no drag and drop.', 'RootView.swift:161-288, 420-436'],
    ['Tab', 'Swallowed everywhere.', 'QuillInput.swift:151, 285'],
    ['At rest, before writing', '↓, page keys, forward delete and ⌘⌫ do nothing. m and ? are letters: they begin the question.', 'QuillInput.swift:139-153, 282-292'],
    ['While writing', '↑ ↓ tab and page keys are swallowed; ↑ does not open the moon while something is written.', 'QuillInput.swift:151, 362-372'],
    ['The draw', 'Space or return with no card under the hand does nothing; the first arrow press puts the hand on the ribbon, and nothing says so. 1 2 3 and ↑ do nothing.', 'RootView.swift:171, 208-212'],
    ['The reading', '← → ↑ 1 2 3 do nothing: no keyboard way to open a card or find the thread.', 'RootView.swift:171, 180-189'],
    ['Keys page open', 'Every key but esc, space, return, ? and m is swallowed.', 'RootView.swift:233-246'],
    ['Leaving the window', 'Any hold is let go when the window loses focus.', 'RootView.swift:46-48; QuillInput.swift:70-77'],
    ['Haptics', 'Only on Force Touch trackpads: a tap per card, a pulse at half a hold, a firm click at the cut and the return.', 'Game.swift:250-253, 336-339, 348, 409, 465'],
  ], { w: 1270, keyW: 190 })], { gap: 16, name: 'Input' }),
], { gap: 116, align: 'MIN', name: 'Language and input' }))
L.add(li, L.row([
  L.note({ w: 1270, tags: ['open'], title: 'If Arcana is ever translated', body: 'The fixed widths, the one-line question and the tracked capitals are the first things to break. The card names and verse live in Deck.swift and would need their own translation, not string by string.' }),
  L.note({ w: 1270, tags: ['open'], title: 'The draw’s first key', body: 'At the start of the draw no card is under the hand, so space does nothing until an arrow is pressed. A quiet sign could say where the hand is.' }),
], { gap: 116, align: 'MIN', name: 'Language notes' }))
sec.appendChild(li)

await K.finish(sec, ORDER)
return await K.snap([vo, st, li], 'edge-cases', PX)
