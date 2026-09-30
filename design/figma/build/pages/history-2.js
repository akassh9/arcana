// Experience & notes · History & rejected directions (2 of 2) — dark and first light, rejected directions, the panel's ideas.
// Run: node design/figma/bridge/run.mjs design/figma/build/pages/notes-kit.js design/figma/build/pages/history-2.js
const L = S.lib, N = S.nk
const CH = 'History & rejected directions', PX = 'History · '
const ORDER = ['Header', 'The nine days', 'Dark and first light', 'Rejected directions', "The panel's unbuilt ideas"].map(n => PX + n)
const sec = await L.chapter(CH, { clear: false })
N.clearMine(sec, ORDER, ORDER.slice(2))

// ---------- dark and first light -----------------------------------------------------------------
const BW = 2400, INNER = BW - 144
const dark = L.board({ name: PX + 'Dark and first light', kicker: 'HISTORY', title: 'Dark and first light', titleStyle: 'h1', w: BW, leadW: 1300,
  lead: 'The candle-black version from before the redesign, kept in _original/, beside the app as it ships. The dark “lapis night sky” that replaced it on 23 September wasn’t kept. Akash turned the dark look down on 24 September but kept its direction, so the moments are the same and only the light changed. The dark renders are stage-only (no title bar, rendered 23 September); the light ones are real window renders.',
  tags: [['akash', 'Akash: light colours only'], 'rejected', 'shipped'] })
const LW = 216, IW = Math.floor((INNER - LW - 2 * 32) / 2)
const colHead = (kicker, t, c) => L.col([L.text(kicker, 'kicker', { color: c }), L.text(t, 'small', { w: IW })], { gap: 4, w: IW, name: 'Column head · ' + kicker })
L.add(dark, L.row([L.spacer(LW, 1),
  colHead('Replaced · before the redesign', 'Candle-black, from _original/shots (stage only).', '#5E554C'),
  colHead('Shipped · first light', 'The same moment in the app today (window render, 30 September).', '#2F6140')], { gap: 32, name: 'Column heads' }))
const PAIRS = [
  ['At rest', 'A candle pool on near-black became a pale sky with dawn rising from below. Cream Didot on black became ink on pearl.', 'brand/history/original-candle-1-invocation.png', 'shots-window/1-invocation.png'],
  ['The draw', 'Twenty-two engraved backs in a fan over dark slots with gold brackets. Today, 78 cream backs in a ribbon (since 26 September).', 'brand/history/original-candle-2-draw.png', 'shots-window/3-draw.png'],
  ['The reading', 'The spread, the verse and the thread came across as they were; only the ground and the ink changed.', 'brand/history/original-candle-4-reading.png', 'shots-window/5-reading.png'],
  ['The altar', 'A card on a black altar with cream type became a card lifted over a pearl veil with its halo.', 'brand/history/original-candle-5-inspect.png', 'shots-window/7-inspect.png'],
]
for (const [label, note, a, c] of PAIRS) {
  const left = L.col([L.text(label, 'h2', { w: LW }), L.text(note, 'small', { w: LW })], { gap: 10, w: LW, name: 'Label · ' + label })
  L.add(dark, L.row([left, await N.stage(a, IW, { r: 14 }), await N.win(c, IW)], { gap: 32, align: 'MIN', name: 'Pair · ' + label }))
}
const kept = ['The hold-to-ask ritual, with a breathing ring', 'Quiet embossed cream card backs; ornament stays restrained', 'Cards that write themselves in gold cooling to ink',
  'A singing-bowl tone per card, together a chord', 'A breathing drone, and hover chimes across the fan', 'A thread of light under the spread',
  'The reading recited as verse', 'The inspector as an altar', 'Tonight’s real moon phase']
const changed = ['Near-black #0A0908 → the pearl sky (pearl #F9F7F2, sky blue, lilac, rose, dawn)', 'A candle pool and embers → dawn light and drifting dust', 'Cream type on black → ink type on pearl',
  'The dark raster logo stayed as the app icon, and is still dark (see Open questions & issues)']
const half = Math.floor((INNER - LW - 32 - 32) / 2)
L.add(dark, L.row([L.spacer(LW, 1),
  L.col([L.text('Kept from the dark direction', 'h3'), L.bullets(kept, { w: half, style: 'small', gap: 6 })], { gap: 12, w: half, name: 'Kept' }),
  L.col([L.text('What changed', 'h3'), L.bullets(changed, { w: half, style: 'small', gap: 6 }),
    N.src('HISTORY.md (24 Sep) · _original/Sources/Arcana/Palette.swift:8 · Palette.swift:13-38', { w: half })], { gap: 12, w: half, name: 'Changed' }),
], { gap: 32, align: 'MIN', name: 'Kept and changed' }))
sec.appendChild(dark)

// ---------- rejected directions ----------------------------------------------------------------
const RB = 2480, RIN = RB - 144, CWD = Math.floor((RIN - 3 * 32) / 4), TH = 220
const rej = L.board({ name: PX + 'Rejected directions', kicker: 'HISTORY', title: 'Rejected directions', titleStyle: 'h1', w: RB, leadW: 1300,
  lead: 'Everything that was tried and turned down, what replaced it, and why, in Akash’s words where they were recorded. Only the dark version survives as a render; for the rest, the picture shows what replaced it.' })
const thumb = async (t) => {
  if (!t) return null
  if (t.missing) return N.missing(CWD, TH, t.missing, t.body)
  if (t.win) { const w = await N.win(t.win, CWD * 0.72, { shadow: false }); return N.tile(CWD, TH, [w], { fill: L.C.paper }) }
  if (t.fill) return L.img(t.fill, { w: CWD, h: TH, r: 12, stroke: '#000000', strokeA: 0.08, name: 'Render · ' + t.fill.split('/').pop() })
  if (t.svg) { const n = await L.svg(t.svg, { h: t.h || 110 }); return N.tile(CWD, TH, [n], { fill: t.bg || L.C.board }) }
  const im = await L.img(t.img, { h: t.h || 180 })
  return N.tile(CWD, TH, [im], { fill: t.bg || L.C.paper })
}
const REJ = [
  { title: 'The dark versions', date: '23–24 Sep', t: { fill: 'brand/history/original-candle-contact.png' }, shown: 'Shown: the rejected candle-black screens (_original/).',
    tried: 'A candle-black chamber (the version before the redesign), then a dark “lapis night sky” (not kept).', by: 'First light: a pale sky, dawn from below, ink on pearl.',
    why: 'Akash doesn’t like dark themes and prefers lighter colours. The ritual and the craft were right, so they stayed.', tags: [['akash', 'Akash rejected it']] },
  { title: 'The blue-and-gold back', date: '24 Sep', t: { img: 'cards/shared/card-back.png', h: 190 }, shown: 'Shown: what replaced it.',
    tried: 'A saturated blue-and-gold card back with gilt edges.', by: 'Cream stock, a blind-embossed rose, a gold hairline and one gold-leaf sun.',
    why: 'Called tacky. Ornament stays restrained.', tags: [['akash', 'Akash: tacky']] },
  { title: 'The emoji-coloured moon', date: '24 Sep', t: { img: 'sky/moon/moon-composite-tonight@8x.png', h: 170, bg: L.C.sky }, shown: 'Shown: what replaced it (tonight’s moon).',
    tried: 'A literal copy of Apple’s emoji moon: saturated yellow, navy shadow.', by: 'A day moon in the sky’s palette: pearl highlands, lilac seas, a lilac ghost.',
    quote: 'very out of theme', tags: ['akash', ['lesson', 'The idea, not the palette']] },
  { title: 'Plus-sign glints', date: '25 Sep', t: { img: 'sky/near/glint-size-7-peak@16x.png', h: 150, bg: L.C.sky }, shown: 'Shown: what replaced it (a fading glint).',
    tried: 'Equal-armed gold crosses with square ends.', by: 'Fading glints: four fine arms that thin to nothing, chosen from five renders.',
    quote: 'look bad', tags: [['akash', 'Akash chose'], ['lesson', 'Taper small lights']] },
  { title: 'A keycap for the keys', date: '27 Sep', t: { svg: 'glyphs/ui/key-glyph-rest.svg', h: 120 }, shown: 'Shown: what replaced it (the old key).',
    tried: 'A keycap glyph in the top-left corner.', by: 'An old key drawn by the pen, turned 45° as in a lock, bow low and bit high.',
    why: 'A keycap read as interface chrome over the sky.', tags: ['claude'] },
  { title: 'The wordy keys page', date: '27 Sep', t: { img: 'glyphs/ui/keys/keys-column@3x.png', h: 190, bg: L.C.board }, shown: 'Shown: what replaced it.',
    tried: 'Four columns, fifteen entries with italic sentences, a subtitle and a footer.', by: 'Six lines of one to three words; a seventh, “⌘ , settings”, in 1.3.',
    quote: 'too wordy king, let’s keep it simple and easy to read… As minimal as possible.', tags: [['akash', 'Akash: minimal']] },
  { title: 'The typeset comma', date: '28 Sep', t: { svg: 'glyphs/ui/keys/key-sign-comma.svg', h: 96 }, shown: 'Shown: what replaced it (the drawn comma).',
    tried: 'A Didot comma, then a larger hollow ring.', by: 'A filled drop, ring within ring, with a short tail, drawn by the pen.',
    why: 'The Didot comma all but vanished; the ring read as a “9”.', tags: ['claude'] },
  { title: 'Tooltips', date: '24 Sep', t: { svg: 'glyphs/ui/bowl-sound-on.svg', h: 110 }, shown: 'Shown: the bowl that replaced the mute button.',
    tried: 'System tooltips on the room’s controls.', by: 'No tooltips. The mute became a pen-drawn singing bowl.',
    why: 'Recorded only as removed; whose call it was isn’t written down.', tags: ['rejected'] },
  { title: 'A web page for people', date: '27 Sep', t: { missing: 'The page for people', body: 'Removed before release. No render survives.' },
    tried: 'A human page on the Cloudflare Worker, beside the agent reading.', by: 'Plain text for agents only. People use the app.',
    quote: 'why do we need the for people on cloudflare? The for people is the app..', tags: [['akash', 'Akash cut it']] },
  { title: 'The widget', date: '27–28 Sep', t: { missing: 'The Notification Center widget', body: 'All code removed. No render survives.' },
    tried: 'A Notification Center widget.', by: 'Nothing. macOS drops widgets from apps without an Apple team signature.',
    quote: 'meh scrap the widget idea. Fully clean, we are unlikely to build that in the future.', tags: [['akash', 'Akash scrapped it']] },
  { title: 'The firmament', date: '24 Sep', t: { missing: 'Never built', body: 'Rejected by the panel at the proposal stage.' },
    tried: 'Past readings kept as constellations in the sky.', by: 'Nothing kept at first; since 26 September, What the Moon Keeps, with no counts.',
    why: 'It reads as a tracker.', tags: ['panel'] },
  { title: 'No Minor Arcana', date: '24–26 Sep', t: { win: 'shots-window/57-minors.png' }, shown: 'Shown: what replaced it (a reading of suit cards).',
    tried: 'The panel kept the deck to the 22 Majors.', by: 'The full 78, built on 26 September at Akash’s request.',
    why: 'The panel thought suits would dilute the small word list and the fan. Akash first said “no need to do anything about this yet”, then asked for them.', tags: ['panel', ['akash', 'Akash overturned it']] },
  { title: 'A cross for five cards', date: '24 Sep', t: { win: 'shots-window/8-five.png' }, shown: 'Shown: what stayed (The Long Road).',
    tried: 'A cross layout for the five-card spread.', by: 'The Long Road stays a row of five.',
    why: 'Polish, not a new feeling.', tags: ['panel'] },
  { title: 'Nothing persists', date: '24–26 Sep', t: { fill: 'surfaces/moon-door/kept-page-three-cards@2x.png' }, shown: 'Shown: what replaced it (a kept reading).',
    tried: 'The panel’s rule: a reading leaves nothing behind.', by: 'What the Moon Keeps: held returns are kept, with their question.',
    why: 'Akash agreed to keep only readings returned with the hold; esc keeps none.', tags: ['panel', ['akash', 'Akash: held returns']] },
  { title: 'The film’s first cut', date: '28 Sep', t: { missing: 'Cut 1 and the real-app take', body: 'Neither is in the repo.' },
    tried: 'A launch film cut from a real take of the app.', by: '“Everyone’s question”, hand-drawn as a riso print.',
    quote: 'a product demo', tags: [['akash', 'Akash rejected it'], ['lesson', 'A walkthrough reads as a demo']] },
  { title: 'The film’s details', date: '28 Sep', t: { img: 'brand/film/frames/film-0240-29-signoff-light-passing.png', h: 200 }, shown: 'Shown: the sign-off as it shipped.',
    tried: 'Faint rings and two dots under the name; a gold copy of the title printed off register; a flat title card.', by: 'Removed, removed, and the halftone “dither like effect” on the title card too.',
    why: 'The off-register gold read as a “drop shadow”. Claude also learnt that four inks at low coverage read as confetti, and that an anchor rule must never push the hero out of frame (the Star drifted 54 px out).', tags: [['akash', 'Akash asked'], 'lesson'] },
]
const cards = []
for (const r of REJ) {
  const tw = CWD - 40
  const kids = [
    await thumb(r.t),
    L.col([
      r.shown ? L.text(r.shown, 'caption', { w: tw }) : null,
      L.row([L.text(r.date, 'code', { size: 11, lh: 16, alpha: 0.6 }), L.chips(r.tags)], { gap: 10, align: 'CENTER', name: 'Meta' }),
      L.text(r.title, 'h2', { w: tw }),
      L.rich([['Tried  ', 'smallStrong'], [r.tried, 'small']], 'small', { w: tw }),
      L.rich([['Replaced by  ', 'smallStrong', { color: '#2F6140' }], [r.by, 'small']], 'small', { w: tw }),
      r.quote ? N.quote(r.quote, 'Akash', tw, { small: true }) : null,
      r.why ? L.rich([['Why  ', 'smallStrong'], [r.why, 'small']], 'small', { w: tw }) : null,
    ], { gap: 10, pad: [6, 20, 20, 20], name: 'Words', w: CWD }),
  ]
  cards.push(L.col(kids, { gap: 10, w: CWD, name: 'Rejected · ' + r.title, fill: L.C.card, fillA: 0.6, r: 14, stroke: L.C.stroke, clip: true }))
}
const grid = L.col([], { gap: 32, name: 'Rejected directions grid' })
for (let i = 0; i < cards.length; i += 4) {
  const row = L.row(cards.slice(i, i + 4), { gap: 32, align: 'MIN', name: 'Row ' + (i / 4 + 1) })
  L.add(grid, row); N.equalize(row.children)
}
L.add(rej, grid)
L.add(rej, N.src('HISTORY.md (the timeline and “Other rejected or replaced details”) · brand/history/timeline.json (not_preserved)', { w: RIN }))
sec.appendChild(rej)

// ---------- the panel's unbuilt ideas ------------------------------------------------------------
const pb = L.board({ name: PX + "The panel's unbuilt ideas", kicker: 'HISTORY', title: 'The panel’s unbuilt ideas', titleStyle: 'h1', w: 1600,
  lead: 'Ideas the design panel had scored out of 10 and nobody built. On 25 September Claude proposed As Above instead, and Akash approved it. Only the names and scores survive; the panel’s descriptions of them aren’t in the repo or the build notes, so ask Akash before reviving one.',
  tags: ['panel', 'open'] })
const IDEAS = [['turning in the light', 5.9], ['when the draw answers', 5.75], ['arriving at first light', 5.6], ['the handled deck', 5.25], ['the hours', 5.0], ['given to the moon', 5.0], ['shuffle', 4.75], ['hinges', 4.6]]
const LBW = 300, TRACK = 900
const chart = L.col([], { gap: 0, name: 'Chart · panel scores' })
const axis = L.frame({ name: 'Axis', w: LBW + 24 + TRACK + 80, h: 22 })
for (const v of [0, 2.5, 5, 7.5, 10]) { const t = L.text(String(v), 'code', { size: 11, lh: 14 }); axis.appendChild(t); t.x = LBW + 24 + (v / 10) * TRACK - t.width / 2; t.y = 0 }
L.add(chart, axis)
for (const [name, v] of IDEAS) {
  const track = L.frame({ name: 'Track', w: TRACK, h: 40 })
  for (const g of [0, 2.5, 5, 7.5, 10]) { const ln = figma.createRectangle(); ln.name = 'Grid'; ln.resize(1, 40); ln.fills = [L.solid(L.C.rule, 1)]; track.appendChild(ln); ln.x = Math.min(TRACK - 1, (g / 10) * TRACK); ln.y = 0 }
  const bar = figma.createRectangle(); bar.name = 'Bar · ' + name; bar.resize((v / 10) * TRACK, 20); bar.cornerRadius = 4; bar.fills = [L.solid('#54457F', 0.75)]
  track.appendChild(bar); bar.x = 0; bar.y = 10
  L.add(chart, L.row([L.text(name, 'body', { w: LBW, align: 'RIGHT' }), track, L.text(v.toFixed(2).replace(/0$/, ''), 'codeStrong', { w: 60 })], { gap: 24, align: 'CENTER', name: 'Idea · ' + name }))
}
L.add(pb, chart)
L.add(pb, L.row([
  L.note({ tags: ['panel', 'shipped'], title: 'What the panel chose (24 Sep)', body: 'The Return (the closing hold) and, as runner-up, Question in Gold. Both were built that day. Their scores weren’t recorded.', w: 440 }),
  L.note({ tags: [['claude', 'Claude proposed'], ['akash', 'Akash approved']], title: 'What was built instead (25 Sep)', body: 'As Above: the sky answers the Wheel, the Star, the Moon and the Sun. No new shapes, words or sounds.', w: 440 }),
  L.note({ tags: ['open'], title: 'For you', body: 'None of these is promised. They’re a record of what was weighed, not a roadmap.', w: 440 }),
], { gap: 24, align: 'MIN', name: 'Context' }))
L.add(pb, N.src('HISTORY.md (24 and 25 Sep)', { w: 1456 }))
sec.appendChild(pb)
N.equalize(pb.children[pb.children.length - 2].children)

N.sortIn(sec, ORDER)
L.fit(sec)
await L.arrange('Experience & notes')
return await N.snap([dark, rej, pb], 'history', PX, { scale: 0.3 })
