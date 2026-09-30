// Start here · Principles & provenance — who decided what, and how free the designer is to change it.
// Quotes are verbatim from design/figma/build/HISTORY.md (the building sessions, 21–29 September 2026).
const L = S.lib
const sec = await L.chapter('Principles & provenance')
const BW = 2400, IN = BW - 144, GAP = 24
const NAMES = ['Principles · How free you are', 'Principles · In Akash’s words', 'Principles · Lessons learned',
  'Principles · The panel’s defaults', 'Principles · Claude’s choices', 'Principles · Rejected at a glance']

const equalize = row => { const h = Math.max(...row.children.map(c => c.height)); for (const c of row.children) { c.layoutSizingVertical = 'FIXED'; c.resize(c.width, h) } return row }
const grid = (cards, cols, name) => {
  const g = L.col([], { gap: GAP, name })
  for (let i = 0; i < cards.length; i += cols) L.add(g, equalize(L.row(cards.slice(i, i + cols), { gap: GAP, name: name + ' row ' + (i / cols + 1), align: 'MIN' })))
  return g
}
const colW = cols => Math.floor((IN - GAP * (cols - 1)) / cols)
const card = (w, kids, name, o = {}) => L.col(kids.filter(Boolean), { gap: o.gap || 10, pad: o.pad || 24, w, fill: o.fill || L.C.card, fillA: o.fillA == null ? 0.7 : o.fillA, stroke: L.C.stroke, r: 16, name })
const date = (d, o = {}) => L.text(d, 'codeStrong', { size: 12, lh: 16, color: o.color || L.C.gold, alpha: 1 })

// ============ 1 · How free you are ============
{
  const b = L.board({ name: NAMES[0], w: BW, kicker: 'Start here', title: 'Principles & provenance', leadW: 1300,
    lead: 'Who decided what, so you know what you can overturn. Akash’s stated preferences are the brief. The lessons were learned the hard way. Everything the design panel and Claude chose is open to you.' })
  L.add(b.children[0], L.rich([['In this chapter   ', 'smallStrong'], ['How free you are  ·  In Akash’s words  ·  Lessons learned  ·  The panel’s defaults  ·  Claude’s choices  ·  Rejected at a glance', 'small']], 'small', { w: IN, name: 'In this chapter' }))
  const bar = figma.createRectangle(); bar.name = 'Scale · keep → overturn freely'
  bar.resize(IN, 6); bar.cornerRadius = 3
  bar.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [
    { position: 0, color: L.rgba('#8C2E25', 0.55) }, { position: 0.36, color: L.rgba('#7A5B17', 0.5) }, { position: 0.64, color: L.rgba('#54457F', 0.45) }, { position: 1, color: L.rgba('#34507F', 0.5) }] }]
  L.fillW(bar)
  const ends = L.row([L.text('Keep', 'kicker', { color: '#8C2E25' }), L.text('Overturn freely', 'kicker', { color: '#34507F' })], { name: 'Scale ends', justify: 'SPACE_BETWEEN', w: IN })
  const cw = colW(4)
  const F = [
    ['akash', 'The brief', 'Keep these unless you have talked to Akash. They were said out loud, and several were said more than once.'],
    ['lesson', 'Keep the lesson', 'Each was found by getting something wrong in front of Akash. Keep what it teaches; its current form is yours to change.'],
    ['panel', 'Argue freely', 'Akash approved the panel’s two features as a package. Its spec choices are not Akash’s rules, and one has already been overturned.'],
    ['claude', 'Overturn freely', 'Made while building and never argued; often the first thing that worked. A better idea wins.'],
  ]
  const cols = L.row(F.map(([k, t, body]) => card(cw, [L.chips([k]), L.text(t, 'h2'), L.text(body, 'body', { w: cw - 48 })], 'Freedom · ' + t)), { gap: GAP, name: 'Freedom', align: 'MIN' })
  equalize(cols)
  L.add(b, L.col([bar, ends], { gap: 10, name: 'Scale', w: IN }), cols)
  L.add(b, L.text('Also in this file: Open question (nobody has decided: yours), Rejected (tried and dropped: don’t bring it back without a new reason), Shipped (in 1.3), and Measured or Engineering fact (constraints, not taste). How to read this file, in Read me first, has the full key.', 'small', { w: 2000 }))
  sec.appendChild(b)
}

// ============ 2 · In Akash's words ============
{
  const b = L.board({ name: NAMES[1], w: BW, kicker: 'Principles', title: 'In Akash’s words', titleStyle: 'h1', leadW: 1300,
    lead: 'The owner’s stated preferences, in the order they were said. Quotation marks mean verbatim; the rest is the history’s summary. Together they are the brief.' })
  const Q = [
    ['23 Sep', 'Feel transcendental', 'evoke more emotions… feel transcendental to be on', 'Asking for a new direction, and open to radical changes. Feeling comes before efficiency of flow.'],
    ['24 Sep', 'Light colours only', null, 'Akash doesn’t like dark themes and prefers lighter colours in general, though the dark version’s direction was right. It became first light.'],
    ['24 Sep', 'Ornament stays restrained', 'tacky', 'On a saturated blue-and-gold card back with gilt edges. The back became quiet embossed cream with one gold-leaf sun.'],
    ['24 Sep', 'No going back', 'we won’t be going back', 'Deleting the backup from before The Return, the closing hold.'],
    ['24 Sep', 'In the theme, always', 'very out of theme', 'On a literal copy of Apple’s emoji moon, sent as the reference for its “texture and color”. The idea stayed; the palette went.'],
    ['24 Sep', 'The look comes first', 'I love how good it looks', 'Then asking whether it could be faster on a 120 Hz display. The near sky moved to Metal without changing a pixel.'],
    ['25 Sep', 'Light that tapers', 'look bad', 'On the Star’s equal-armed gold crosses. Akash chose fading glints from five renders and asked for every glint to take that shape.'],
    ['26 Sep', 'The full deck', 'build it out fully… we are aligned well enough in terms of direction and vision.', 'On 25 Sep it was “no need to do anything about this yet”; a day later Akash raised the 78 cards themselves.'],
    ['26 Sep', 'Keep what was returned', null, 'Only readings returned with the hold are kept, with their written question. The returned question disappears once the door opens: Akash said to keep it that way.'],
    ['27 Sep', 'As few words as possible', 'too wordy king, let’s keep it simple and easy to read… As minimal as possible.', 'On the first keys page, after “go implement it fully… I trust your direction”. Four columns and fifteen entries became six lines.'],
    ['27 Sep', 'The app is for people', 'The for people is the app.. let’s reign in the implementation a little - only have the agents part.', 'Cutting a web page for people. The Worker stays plain text, for agents.'],
    ['27–28 Sep', 'No widget', 'meh scrap the widget idea. Fully clean, we are unlikely to build that in the future.', 'After macOS dropped the widget for want of an Apple team signature. All its code is gone.'],
    ['28 Sep', 'Settings you can find', null, 'Akash couldn’t find Settings, so 1.3 added “⌘ , settings” to the keys page. Settings is its own window.'],
    ['28 Sep', 'Emotion, not explanation', 'the point of the video is to evoke emotions not explain what the app is… The purpose of the video is to get that click, time and attention.', 'The launch film’s brief. A cut from a real take was rejected as “a product demo”.'],
    ['28 Sep', 'The print, not the shadow', 'Very good amazing in fact… Everything else is AMAZING.', 'On the riso film. Then: the halftone “dither like effect” on the title card too, and no gold copy off register, which read as a “drop shadow”.'],
    ['28–29 Sep', 'A demo for people who won’t install', 'Something that’s not too long but still walks through what the app looks like for people that won’t install it', 'It became one continuous 57 s take of a whole reading.'],
  ]
  const cw = colW(4), tw = cw - 48
  const cards = Q.map(([d, head, quote, ctx]) => card(cw, [
    L.row([date(d, { color: '#8C2E25' }), L.chips(['akash'])], { gap: 12, align: 'CENTER', name: 'Date and tag' }),
    L.text(head, 'h3', { size: 18, lh: 26, w: tw }),
    quote ? L.text('“' + quote + '”', 'voice', { size: 21, lh: 29, w: tw, alpha: 0.92 }) : L.text('In the history’s words', 'caption', { w: tw, alpha: 0.5 }),
    L.text(ctx, 'small', { w: tw }),
  ], 'Akash · ' + head, { gap: 12 }))
  L.add(b, grid(cards, 4, 'Quotes'))
  L.add(b, L.text('Source: the building sessions, as curated in the design history (design/figma/build/HISTORY.md). Akash’s own spelling and punctuation are kept.', 'caption', { w: 1400 }))
  sec.appendChild(b)
}

// ============ 3 · Lessons learned ============
{
  const b = L.board({ name: NAMES[2], w: BW, kicker: 'Principles', title: 'Lessons learned', titleStyle: 'h1', leadW: 1300,
    lead: 'Eight things that went wrong once, in front of Akash. Keep what they teach.' })
  const LS = [
    ['24 Sep', 'Take a reference’s idea, not its palette', 'The emoji moon, copied literally, was out of theme. What stayed was the idea: real seas, craters and a jagged terminator, painted in the sky’s own colours.'],
    ['24 Sep', 'A render is not the window', 'Akash found a white strip at the foot of the live window that no render showed: a safe-area bug. Check layout in a real titled window.'],
    ['25 Sep', 'Taper small lights', 'Small lights drawn with equal, square-ended arms read as plus signs, as type. The glints thin to nothing, the upright arm longest.'],
    ['25 Sep', 'Show candidates side by side', 'Render the options at 2× over the real sky and let Akash choose. That is how the glints were chosen, from five.'],
    ['28 Sep', 'Off-register type reads as a shadow', 'In the launch film, a gold copy of the title printed off register read as a text drop shadow. It was removed.'],
    ['28 Sep', 'Any walkthrough reads as a demo', 'The film’s first cut, from a real take of the app, was “a product demo”. Feeling came from drawing instead.'],
    ['28 Sep', 'Never push the hero out of frame', 'An anchor rule in the film moved the Star 54 px out of the frame. An anchor must never cost the hero object.'],
    ['28 Sep', 'In riso, sparse inks read as confetti', 'Four inks at low coverage everywhere read as confetti.'],
  ]
  const cw = colW(4), tw = cw - 48
  L.add(b, grid(LS.map(([d, head, body]) => card(cw, [
    L.row([date(d, { color: '#7A5B17' }), L.chips(['lesson'])], { gap: 12, align: 'CENTER', name: 'Date and tag' }),
    L.text(head, 'h3', { size: 18, lh: 26, w: tw }), L.text(body, 'small', { w: tw })], 'Lesson · ' + head, { gap: 12 })), 4, 'Lessons'))
  sec.appendChild(b)
}

// ============ 4 · The panel's defaults ============
{
  const b = L.board({ name: NAMES[3], w: BW, kicker: 'Principles', title: 'The panel’s defaults', titleStyle: 'h1', leadW: 1300,
    lead: 'On 24 September a 15-agent design panel was asked for the next feature. Akash approved what it recommended as a package. Its details are defaults, not Akash’s rules.', tags: ['panel'] })
  const cw = colW(4), tw = cw - 48
  const item = (title, body, tags) => L.col([L.text(title, 'smallStrong', { w: tw }), L.text(body, 'small', { w: tw }), tags ? L.chips(tags) : null].filter(Boolean), { gap: 4, name: 'Item · ' + title })
  const col = (kicker, title, items, o = {}) => card(cw, [L.text(kicker, 'kicker'), L.text(title, 'h2', { w: tw }), L.rule(null, { color: L.C.gold, alpha: 0.3 }), ...items], 'Panel · ' + title, { gap: 14 })
  const cols = L.row([
    col('Recommended · built 24 Sep', 'What it gave', [
      item('The Return', 'A closing hold after the recital: the ink sinks into the stock, last drawn first, the bowls falling to the root, leaving pressed grooves with the gold leaf kept; then the cards turn face down.', ['panel', 'shipped']),
      item('Question in Gold', 'The typed question is written by the pen and taken into the deck by the hold. Fused with The Return as “the cards go back, the question stays”.', ['panel', 'shipped']),
    ]),
    col('Spec choices', 'Not Akash’s rules', [
      item('Nothing persists', 'Overturned on 26 September by What the Moon Keeps: readings returned with the hold are now kept.', [['rejected', 'Overturned']]),
      item('Gold never re-appears on the way out', 'The return only sinks ink; nothing is gilded again as the cards leave.', ['panel']),
      item('The question arrives whole', 'Read back as an epigraph, it is printed at once, never re-typed.', ['panel']),
    ]),
    col('Rejected by the panel', 'What it turned down', [
      item('A firmament', 'Past readings kept as constellations in the sky. It reads as a tracker.', ['rejected']),
      item('The Minor Arcana', 'It would dilute the small word list and the fan. Built anyway on 26 September, at Akash’s request.', [['rejected', 'Overturned'], 'akash']),
      item('A cross layout for five cards', 'Polish, not a new feeling.', ['rejected']),
    ]),
    col('Scored · never built', 'Ideas on the shelf', [
      L.table([{ label: 'Idea', w: tw - 90 }, { label: 'Score', w: 50, style: 'codeStrong' }], [
        ['turning in the light', '5.9'], ['when the draw answers', '5.75'], ['arriving at first light', '5.6'], ['the handled deck', '5.25'],
        ['the hours', '5.0'], ['given to the moon', '5.0'], ['shuffle', '4.75'], ['hinges', '4.6']], { name: 'Scores', gap: 16 }),
      L.text('Out of 10, as scored by the panel. On 25 September Claude proposed As Above instead, and Akash approved it.', 'caption', { w: tw }),
    ]),
  ], { gap: GAP, name: 'Panel', align: 'MIN' })
  equalize(cols)
  L.add(b, cols)
  sec.appendChild(b)
}

// ============ 5 · Claude's choices ============
{
  const b = L.board({ name: NAMES[4], w: BW, kicker: 'Principles', title: 'Claude’s choices', titleStyle: 'h1', leadW: 1300,
    lead: 'Made while building, never argued, all open. If one of these is in your way, overturn it.', tags: ['claude'] })
  const cw = colW(5), tw = cw - 48
  const G = [
    ['Deck and words', [
      'The court cards by where they stand: the page on the ground, the knight on the road, the queen in the ring, the king on the squared seat. Wings only on the Knight of Cups.',
      'About one gold per card (with a few exceptions).',
      'Roman numerals on the pips (Ace = I), and an empty numeral band on the courts.',
      'A pentagram on each Pentacle.',
      'Marseille-style pips, laid out after Rider–Waite–Smith scenes.',
      'British spelling in the app’s copy.',
    ]],
    ['Keys and glyphs', [
      'The old key glyph, turned 45° as it would sit in a lock. A keycap read as UI chrome over the sky.',
      '⌘/ opens the keys.',
      'The seven key lines and their words.',
      'The pen-drawn page-turn chevrons.',
      'The comma sign as a filled drop with a short tail (a Didot comma vanished; a hollow ring read as a 9).',
    ]],
    ['The moon’s door', [
      'Only the date under the moon while the door is open.',
      '⌘⌫ to forget. There is no undo, so it asks for a modifier.',
      '“one moon ago”, set in tiny caps.',
      '“hold · remember”.',
      'Pages drift in from the side time was turned.',
    ]],
    ['The sky', [
      'The sky answers only four Majors: the Wheel, the Star, the Moon and the Sun.',
      'As Above is not replayed when a kept reading is remembered.',
      'The altar’s veil is radial, so the sky still shows at the edges.',
    ]],
    ['Films', [
      'The launch film’s twelve private questions and twelve places at first light.',
      'The Star, writing itself, as the film’s hero.',
    ]],
  ]
  const SEE = { 'Deck and words': 'Card anatomy & back · Minor Arcana · The words', 'Keys and glyphs': 'Keys & Settings · Components', 'The moon’s door': "The return & the moon's door", 'The sky': 'As Above · The reading', 'Films': 'Launch film & demo' }
  const cols = L.row(G.map(([t, items]) => { const grow = L.spacer(1, 1); grow.name = 'Grow'; return card(cw, [L.text(t, 'h2', { w: tw }), L.rule(null, { color: L.C.gold, alpha: 0.3 }), L.bullets(items, { w: tw, style: 'small', gap: 10 }), grow, L.rule(null, { alpha: 0.8 }), L.col([L.text('See it in', 'kicker', { color: '#34507F' }), L.text(SEE[t], 'small', { w: tw })], { gap: 4, name: 'See it in' })], 'Claude · ' + t, { gap: 14 }) }), { gap: GAP, name: 'Choices', align: 'MIN' })
  equalize(cols)
  for (const c of cols.children) { const g = c.findOne(n => n.name === 'Grow'); if (g) g.layoutGrow = 1 }
  L.add(b, cols)
  sec.appendChild(b)
}

// ============ 6 · Rejected at a glance ============
{
  const b = L.board({ name: NAMES[5], w: BW, kicker: 'Principles', title: 'Rejected at a glance', titleStyle: 'h1',
    lead: 'Tried and dropped. Don’t bring one back without a new reason. The whole story, with dates, is in Experience & notes ▸ History & rejected directions.', leadW: 1800 })
  const R = [
    ['23–24 Sep', 'The dark night sky', 'A lapis night sky, and a candle-black version before it (kept in _original/). Akash doesn’t like dark themes.', 'akash'],
    ['24 Sep', 'A blue-and-gold back', 'A saturated back with gilt edges: “tacky”.', 'akash'],
    ['24 Sep', 'The emoji-coloured moon', 'A saturated yellow lit side and a navy shadow: “very out of theme”.', 'akash'],
    ['24 Sep', 'Tooltips', 'Removed. The mute became a pen-drawn singing bowl.', null],
    ['24 Sep', 'A firmament', 'Past readings as constellations. It reads as a tracker.', 'panel'],
    ['24 Sep', 'A cross for five cards', 'Polish, not a new feeling.', 'panel'],
    ['24 → 26 Sep', 'Nothing persists', 'The panel’s rule, overturned by What the Moon Keeps.', 'panel'],
    ['24 → 26 Sep', 'No Minor Arcana', 'The panel’s call, overturned when Akash asked for all 78.', 'panel'],
    ['25 Sep', 'Plus-sign glints', 'Equal, square-ended gold crosses: they “look bad”.', 'akash'],
    ['27 Sep', 'A keycap for the keys', 'It read as UI chrome over the sky. It became the old key.', 'claude'],
    ['27 Sep', 'The wordy keys page', 'Four columns, fifteen entries, a subtitle and a footer: “too wordy”.', 'akash'],
    ['27 Sep', 'The comma as type', 'A Didot comma all but vanished; a hollow ring read as a 9.', 'claude'],
    ['27 Sep', 'A web page for people', '“The for people is the app.” The Worker is for agents only.', 'akash'],
    ['27–28 Sep', 'A widget', 'It could never appear without an Apple team signature: “meh scrap the widget idea”.', 'akash'],
    ['28 Sep', 'A film from a real take', 'It read as “a product demo”.', 'akash'],
    ['28 Sep', 'Rings, dots and a shadow', 'In the film: the faint rings and two dots under the name, and the off-register gold copy that read as a “drop shadow”.', 'akash'],
  ]
  const cw = colW(4), tw = cw - 48
  L.add(b, grid(R.map(([d, t, body, who]) => card(cw, [
    L.row([date(d, { color: '#5E554C' }), L.chips(who ? ['rejected', [who, { akash: 'By Akash', panel: 'By the panel', claude: 'By Claude' }[who]]] : ['rejected'])], { gap: 12, align: 'CENTER', name: 'Date and tags' }),
    L.text(t, 'h3', { size: 17, lh: 24, w: tw }), L.text(body, 'small', { w: tw })], 'Rejected · ' + t, { gap: 10, pad: 22 })), 4, 'Rejected'))
  sec.appendChild(b)
}

L.fit(sec)
await L.arrange('Start here')
const out = []
for (const n of sec.children) out.push(await L.snap(n, 'pages/principles/' + (NAMES.indexOf(n.name) + 1) + '.png', { scale: 0.3, wait: 300 }))
return out
