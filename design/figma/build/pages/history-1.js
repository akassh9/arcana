// Experience & notes · History & rejected directions (1 of 2) — header and the nine days.
// Run: node design/figma/bridge/run.mjs design/figma/build/pages/notes-kit.js design/figma/build/pages/history-1.js
const L = S.lib, N = S.nk
const CH = 'History & rejected directions', PX = 'History · '
const ORDER = ['Header', 'The nine days', 'Dark and first light', 'Rejected directions', "The panel's unbuilt ideas"].map(n => PX + n)
const sec = await L.chapter(CH, { clear: false })
N.clearMine(sec, ORDER, ORDER.slice(0, 2))

// ---------- header ----------------------------------------------------------------------------
const head = N.header(PX + 'Header', {
  title: 'History & rejected directions',
  lead: 'Arcana was designed in nine days, 21 to 29 September 2026. Akash judged by eye and by feeling; Claude rendered candidates and built what was chosen. This is what was tried, what replaced it and why, so you know which choices are Akash’s and which are open.',
  toc: ['The nine days', 'Dark and first light', 'Rejected directions', 'The panel’s unbuilt ideas'],
  notes: [
    { tags: ['akash'], title: 'Light, never dark', body: 'The first redesign was dark. Akash doesn’t like dark themes and prefers lighter colours, but said the direction was right. The ritual and the craft were kept.' },
    { tags: ['lesson'], title: 'Render it, then let Akash choose', body: 'Decisions were made by looking: candidates side by side at 2×, and Akash picked. Expect to show, not argue.' },
    { tags: ['panel'], title: 'The panel’s choices aren’t rules', body: 'A design panel’s spec choices were approved as a package. One (nothing persists) was overturned two days later.' },
    { tags: ['rejected'], title: 'Most rejected work was not kept', body: 'Only the candle-black version survives, in _original/. Everything else rejected exists only as the descriptions on this page.' },
  ],
})
sec.appendChild(head)

// ---------- the nine days ---------------------------------------------------------------------
const TL = await L.json('brand/history/timeline.json')
const TITLE = {}
for (const e of TL.eras) for (const c of (e.commits || [])) TITLE[c.sha.slice(0, 7)] = c.title

const BW = 2300, INNER = BW - 144
const b = L.board({ name: PX + 'The nine days', kicker: 'HISTORY', title: 'The nine days', titleStyle: 'h1', w: BW, leadW: 1300,
  lead: 'From the first build to this handoff. The repository starts on 24 September, so the first three days survive only as the mark and the _original/ folder. Every render below is real; the ones from 24 September onwards were rendered on 30 September from the current sources, so they show each feature as it stands now.',
  tags: [['fixed', 'Source: git log · HISTORY.md']] })

// A native chart: commits per day.
const DAYS = [
  [21, 'Mon', null, 'First build'], [22, 'Tue', null, 'Nothing recorded'], [23, 'Wed', null, 'The dark era'],
  [24, 'Thu', 6, 'First light, the panel, the moon, Metal'], [25, 'Fri', 1, 'As Above, the Star’s stars'],
  [26, 'Sat', 5, 'What the Moon Keeps, the 78'], [27, 'Sun', 3, 'The keys, agents'], [28, 'Mon', 8, 'Releases 1.0–1.3, the film'],
  [29, 'Tue', 1, 'The demo'], [30, 'Wed', 0, 'This handoff'],
]
const CW = Math.floor((INNER - 9 * 16) / 10), BAR_H = 128, PER = 14
const cells = DAYS.map(([d, wd, n, what]) => {
  const area = L.frame({ name: 'Bar area', dir: 'v', w: CW, h: BAR_H, justify: 'MAX', align: 'CENTER' })
  if (n == null) {
    const box = L.frame({ name: 'Before the repo', dir: 'v', w: CW - 24, h: 56, r: 8, stroke: L.C.ink, strokeA: 0.25, justify: 'CENTER', align: 'CENTER' })
    box.dashPattern = [4, 4]
    L.add(box, L.text('before the repo', 'caption', { align: 'CENTER', w: CW - 40 }))
    L.add(area, box)
  } else if (n > 0) {
    const bar = figma.createRectangle(); bar.name = 'Bar · ' + n + ' commits'; bar.resize(56, n * PER); bar.cornerRadius = 4
    bar.fills = [L.solid(L.C.gold, 0.8)]
    L.add(area, L.text(String(n), 'codeStrong', { alpha: 0.8 }), L.spacer(1, 6), bar)
  } else {
    L.add(area, L.text('0', 'codeStrong', { alpha: 0.4 }), L.spacer(1, 6), L.rule(56, { h: 2, color: L.C.gold, alpha: 0.4 }))
  }
  const base = L.rule(CW, { h: 1, color: L.C.ink, alpha: 0.3 })
  return L.col([area, base,
    L.text(d + ' Sep', 'smallStrong', { w: CW, align: 'CENTER' }),
    L.text(wd, 'caption', { w: CW, align: 'CENTER' }),
    L.text(what, 'caption', { w: CW - 8, align: 'CENTER', alpha: 0.8 }),
  ], { gap: 6, name: 'Day · ' + d + ' Sep', align: 'CENTER', w: CW })
})
L.add(b, L.col([
  L.text('Commits per day', 'h3'),
  L.row(cells, { gap: 16, align: 'MIN', name: 'Commits per day' }),
  N.src('24 commits, 24–29 September · design/figma/assets/brand/history/timeline.json (git log at c7e12f4)', { w: INNER }),
], { gap: 16, name: 'Chart · commits per day' }))

// The rail: one row per moment.
const TW = 480, TH = 328, DW = 132, RW = 36, TXW = 900, CMW = INNER - DW - RW - TW - TXW - 4 * 36
const ROWS = [
  { d: '21 Sep', wd: 'Monday', title: 'First build', tile: 'mark',
    body: 'Tarot for the Mac: the 22 Major Arcana, a draw, a reading. It came before the repository, which starts on 24 September. What survives from these days is the mark (the dark compass-and-eclipse logo, still the app icon today), a code-drawn fallback icon, and the candle-black version kept in _original/. Where the logo came from isn’t recorded.',
    cap: 'Assets/arcana-logo.png (left) and the fallback icon Tools/icon draws (right). Both are dark.', tags: [['shipped', 'Still the app icon'], 'open'], commits: 'none' },
  { d: '23 Sep', wd: 'Wednesday', title: 'The dark era', tile: 'brand/history/original-candle-1-invocation.png', stage: true,
    body: 'Akash asked for more feeling and said they were open to radical change. Claude redesigned the room as a dark “lapis night sky” (not kept). The version it replaced is kept in _original/: a candle-black chamber (#0A0908) lit by a candle pool, with gold embers, cream Didot and the 22 Majors in a fan.',
    quote: ['evoke more emotions… feel transcendental to be on', 'Akash, the brief'], cap: 'The candle-black version it replaced, from _original/ (stage only, no title bar).', src: '_original/Sources/Arcana/Palette.swift:8', tags: ['rejected', ['akash', 'Akash rejected it']], commits: 'none' },
  { d: '24 Sep', wd: 'Thursday', title: 'First light', tile: 'shots-window/1-invocation.png',
    body: 'Akash rejected the dark version but kept its direction. The world became first light: a pale blue sky, dawn rising from below, ink type, cream card backs with a blind-embossed rose and one gold-leaf sun. The hold-to-ask ritual, the writing in gold, the bowls and the altar all came across. The repository went public the same day.',
    tags: [['akash', 'Akash: light colours only'], 'shipped'], commits: ['e7c5761', 'ca054f9'] },
  { d: '24 Sep', wd: 'Thursday', title: 'The Return and Question in Gold', tile: 'shots-window/15-returning.png',
    body: 'A design panel of 15 agents chose the next feature: The Return, a closing hold in which the ink sinks into the stock, last card first, and the cards turn face down; and Question in Gold, the typed question written by the pen and taken into the deck. Fused as “the cards go back, the question stays”. Akash approved both, then deleted the backup.',
    quote: ['we won’t be going back', 'Akash'], tags: ['panel', ['akash', 'Akash approved']], commits: ['e7c5761'] },
  { d: '24 Sep', wd: 'Thursday', title: 'The moon’s face', tile: 'sky/moon/moon-in-sky-crop@2x.png', fillTile: true,
    body: 'Akash asked for a prettier moon and sent Apple’s emoji moons for their texture and colour. A literal copy, saturated yellow with a navy shadow, was “very out of theme”. The idea stayed: real near-side seas and craters, painted per pixel in the sky’s own colours, pearl highlands and lilac seas.',
    cap: 'Tonight’s moon in the sky (30 September, waning gibbous).', tags: [['akash', 'Akash sent the reference'], ['lesson', 'Take the idea, not the palette']], commits: ['97bee64'] },
  { d: '24 Sep', wd: 'Thursday', title: 'Speed, and the white strip', tile: 'shots-window/2-holding.png',
    body: 'Akash: “I love how good it looks”, then asked whether it could be faster on their 120 Hz display. The near sky (dust, blooms, glints, the hold ring, ripples) moved to one Metal shader at 60 fps calm and 120 during the hold, matching the old drawing pixel for pixel. Akash also found a white strip at the bottom of the live window that no render had shown.',
    tags: ['measured', ['lesson', 'Check a real titled window']], commits: ['329a69b', '506e03d', 'dede3f4'] },
  { d: '25 Sep', wd: 'Friday', title: 'As Above', tile: 'shots-window/37-sun.png',
    body: 'Claude proposed it and Akash approved it. The four cards with a counterpart in the sky make it answer once their ink cools: the Wheel turns the engraved wheel one house, the Star keeps the glints lit, the Moon spreads lilac half-light, the Sun raises the dawn. No new shapes, words or sounds.',
    cap: 'The Sun answered: the dawn raised.', tags: [['claude', 'Claude proposed'], ['akash', 'Akash approved'], 'shipped'], commits: ['95c3ad2'] },
  { d: '25 Sep', wd: 'Friday', title: 'The Star’s stars', tile: 'shots-window/33-star.png',
    body: 'Akash said the Star’s stars “look bad”: equal-armed gold crosses with square ends read as plus signs. Claude rendered five looks over the real sky. Akash chose fading glints (four fine arms that thin to nothing, the upright longest, a soft halo, a pearl heart) and asked that every glint in the sky take that shape. The same day, asked whether there should be 78 cards: “no need to do anything about this yet”.',
    tags: [['akash', 'Akash chose'], ['lesson', 'Taper small lights']], commits: ['95c3ad2'] },
  { d: '26 Sep', wd: 'Saturday', title: 'What the Moon Keeps', tile: 'shots-window/44-kept.png',
    body: 'Every reading returned with the hold is kept on the Mac, and the moon becomes a door: ← → move through them, a hold brings the ink back, ⌘⌫ lets one go, and one lunation later the question comes back faintly under the moon. No counts, streaks or notifications. Akash agreed that only held returns are kept, with their question.',
    tags: [['akash', 'Akash: only held returns'], ['rejected', 'Overturns: nothing persists']], commits: ['c60899b', 'c15d2ed'] },
  { d: '26 Sep', wd: 'Saturday', title: 'The full deck', tile: 'shots-window/56-ribbon-hand.png',
    body: 'Akash raised the 78 themselves. Claude recommended Marseille-style pips drawn by the same pen, laid out as a ribbon to draw from. Akash approved a preview of the ribbon and the Cups; the other three suits were written without a review of their own.',
    quote: ['build it out fully… we are aligned well enough in terms of direction and vision.', 'Akash'], tags: [['akash', 'Akash asked for 78'], ['claude', 'Claude: pips, the ribbon']], commits: ['3829999', 'c00b0ed'] },
  { d: '27 Sep', wd: 'Sunday', title: 'The keys', tile: 'shots-window/62-keys.png',
    body: 'Akash proposed a page of the controls, opened by a button like the bowl but top left. The first version had four columns and fifteen entries. It became six lines of one to three words under an old key turned 45°, because a keycap glyph read as interface chrome over the sky. A seventh line, “⌘ , settings”, came in 1.3.',
    quote: ['too wordy king, let’s keep it simple and easy to read… As minimal as possible.', 'Akash'], tags: [['akash', 'Akash: minimal'], ['claude', 'Claude: the old key']], commits: ['2283c75', 'a778f81'] },
  { d: '27 Sep', wd: 'Sunday', title: 'For your agent', tile: 'agent',
    body: 'The launch post promises “connect your agent”: a plain-text reading at arcana.khanikad.workers.dev/today, for people’s agents to fold into a morning brief. Claude also built a page for people; Akash cut it. The reading gives the agent no instructions, which would read as prompt injection.',
    quote: ['The for people is the app.. let’s reign in the implementation a little - only have the agents part.', 'Akash'], cap: 'A live response from the Worker (/today, Three Fates).', tags: [['akash', 'Akash: agents only'], 'shipped'], commits: ['5bba8c3', '594c79e'] },
  { d: '27–28 Sep', wd: 'Sunday–Monday', title: 'No widget', tile: 'missing',
    body: 'A Notification Center widget was built and could not appear: macOS drops widgets from apps without an Apple team signature. All of its code was removed.',
    quote: ['meh scrap the widget idea. Fully clean, we are unlikely to build that in the future.', 'Akash'], tags: [['akash', 'Akash: scrapped'], 'rejected'], commits: 'never committed' },
  { d: '28 Sep', wd: 'Monday', title: 'Releases 1.0 to 1.3', tile: 'surfaces/settings/settings-window-ready@2x.png',
    body: '1.0 is the download. 1.1 takes an OpenAI key in Settings, kept in the Keychain. 1.2 checks the key with OpenAI. 1.3 adds “⌘ , settings” to the keys page, because Akash couldn’t find Settings. The app is ad hoc signed, not notarized, so people open it once, then choose Open Anyway.',
    cap: 'Settings with a key OpenAI accepted.', tags: [['akash', 'Akash: Settings as a window'], ['shipped', 'Shipped · 1.3 latest']], commits: ['666ec87', 'b42e592', '9b09f7f', 'a31b6e6', 'd1edf24', 'd5a73f8'] },
  { d: '28 Sep', wd: 'Monday', title: 'The launch film', tile: 'film',
    body: 'The first cut, from a real take of the app, was rejected as “a product demo”. Akash chose “Everyone’s question”, and it became a hand-drawn riso print: twelve private questions and twelve places at first light, the Star writing itself, ARCANA laid in gold cooling to ink.',
    quote: ['the point of the video is to evoke emotions not explain what the app is', 'Akash, the brief'], cap: 'Frames 172 and 255 of the film.', tags: [['akash', 'Akash chose'], ['lesson', 'A walkthrough reads as a demo']], commits: ['14b7fc6'] },
  { d: '28–29 Sep', wd: 'Monday–Tuesday', title: 'The demo', tile: 'brand/demo/stills/demo-37.5s-14-altar.png', fillTile: true,
    body: 'For people who won’t install it: one continuous 57 s take of a whole reading, with its own sound. It lives at akassh9.github.io/arcana/demo.mp4 and is linked from the launch post, so it must never move.',
    quote: ['Something that’s not too long but still walks through what the app looks like for people that won’t install it', 'Akash'], cap: 'The demo at 37.5 s: the Star on the altar.', tags: [['akash', 'Akash asked'], 'shipped'], commits: ['c7e12f4'] },
  { d: '30 Sep', wd: 'Wednesday', title: 'This handoff', tile: null,
    body: 'Akash and Claude hand Arcana to a designer. The code at c7e12f4 is the source of truth; every value in this file links to it.', tags: [], commits: 'design/ (not yet committed)' },
]

const tileFor = async r => {
  if (r.tile === null) return L.spacer(TW, 1)
  if (r.tile === 'mark') {
    const a = await L.img('brand/logo/arcana-logo-on-pearl.png', { w: 200, r: 10 })
    const f = await L.img('brand/icon/fallback-icon.png', { w: 200 })
    return N.tile(TW, TH, [a, f], { name: 'Tile · the marks', gap: 32 })
  }
  if (r.tile === 'agent') {
    const txt = (await text('brand/agent/reading-three.txt')).trim()
    const t = L.text(txt, 'code', { size: 12, lh: 20, w: TW - 80, alpha: 0.82 })
    return N.tile(TW, TH, [t], { name: 'Tile · the agent reading', fill: '#FFFFFF', pad: 32, dir: 'v' })
  }
  if (r.tile === 'missing') return N.missing(TW, TH, 'The widget', 'Never shipped, never committed. No render survives.')
  if (r.tile === 'film') {
    const a = await L.img('brand/film/frames/film-0172-23-answer-window-stars.png', { w: 208, r: 6 })
    const c = await L.img('brand/film/frames/film-0255-30-signoff-end.png', { w: 208, r: 6 })
    return N.tile(TW, TH, [a, c], { name: 'Tile · the film', gap: 20 })
  }
  if (r.tile.startsWith('surfaces/settings')) {
    const im = await L.img(r.tile, { w: 402, r: 10, shadow: true })
    return N.tile(TW, TH, [im], { name: 'Tile · Settings', fill: L.C.sky, fillA: 0.55 })
  }
  if (r.fillTile) return L.img(r.tile, { w: TW, h: TH, r: 12, stroke: '#000000', strokeA: 0.08, name: 'Render · ' + r.tile.split('/').pop() })
  if (r.stage) return N.stage(r.tile, TW)
  return N.win(r.tile, TW)
}

const rail = L.col([], { name: 'The nine days · rail', gap: 0 })
for (let i = 0; i < ROWS.length; i++) {
  const r = ROWS[i], last = i === ROWS.length - 1
  const date = L.col([L.text(r.d, 'h3', { w: DW }), L.text(r.wd, 'caption', { w: DW })], { gap: 2, name: 'Date', w: DW })
  const dot = figma.createEllipse(); dot.name = 'Dot'; dot.resize(14, 14); dot.fills = [L.solid(L.C.gold, 1)]
  dot.strokes = [L.solid(L.C.board, 1)]; dot.strokeWeight = 3; dot.strokeAlign = 'OUTSIDE'
  const line = figma.createRectangle(); line.name = 'Rail'; line.resize(2, 10); line.fills = [L.solid(L.C.gold, last ? 0 : 0.35)]
  const railCol = L.col([L.spacer(1, 6), dot, line], { gap: 6, w: RW, align: 'CENTER', name: 'Rail' })
  const tile = await tileFor(r)
  const tileCol = L.col([tile, r.cap ? L.text(r.cap, 'caption', { w: TW }) : null], { gap: 10, name: 'Render', w: TW })
  const txt = L.col([
    L.text(r.title, 'h2', { w: TXW }),
    L.text(r.body, 'body', { w: TXW }),
    r.quote ? N.quote(r.quote[0], r.quote[1], TXW, { small: true }) : null,
    r.src ? N.src(r.src, { w: TXW }) : null,
    r.tags && r.tags.length ? L.chips(r.tags) : null,
  ], { gap: 12, name: 'Text', w: TXW })
  const cm = L.col([L.text('COMMITS', 'kicker', { alpha: 0.9 })], { gap: 6, name: 'Commits', w: CMW })
  if (Array.isArray(r.commits)) for (const s of r.commits) L.add(cm, N.commit(s, TITLE[s] || '', CMW))
  else L.add(cm, L.text(r.commits, 'caption', { w: CMW }))
  const row = L.row([date, railCol, tileCol, txt, cm], { gap: 36, align: 'MIN', pad: [0, 0, last ? 0 : 56, 0], name: 'Moment · ' + r.d + ' · ' + r.title })
  L.add(rail, row)
  railCol.layoutSizingVertical = 'FILL'
  line.layoutGrow = 1
}
L.add(b, rail)
sec.appendChild(b)

N.sortIn(sec, ORDER)
L.fit(sec)
await L.arrange('Experience & notes')
return await N.snap([head, b], 'history', PX, { scale: 0.3 })
