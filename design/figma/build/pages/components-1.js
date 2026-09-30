// Components, step 1: the chapter's library header, the room's glyphs and the keys.
//   node design/figma/bridge/run.mjs design/figma/build/pages/components-lib.js design/figma/build/pages/components-1.js
const L = S.lib, CL = S.cl
const MINE = ['Components · Library', 'Components · Room glyphs', 'Components · The keys']
const sec = await CL.start(MINE)
const INNER = 868   // a card's stage, inside its padding, on a 1600 board

// ------------------------------------------------------------------ Library (the header)
{
  const b = L.board({ name: 'Components · Library', kicker: 'PARTS', title: 'Components', w: 1600,
    lead: 'Arcana’s drawn parts as real Figma components, made from the app’s own drawing code, not traced. Each card shows a part enlarged, its masters at 1×, its sizes and inks, where it lives in the code, and whose decision it was. The cards’ own components are in Card anatomy & back, Major Arcana and Minor Arcana.' })
  L.add(b, L.rich([['In this chapter   ', 'smallStrong'], 'Window / Title bar  ·  Room glyphs  ·  The keys  ·  Choosing & drawing  ·  Thread & light  ·  Suits & motifs  ·  Courts & the pen'], 'small', { w: 1456 }))
  const W = (1456 - 3 * 24) / 4
  L.add(b, L.row([
    L.note({ w: W, tags: ['fixed'], title: 'Drawn by the app’s pen', body: 'Every mark comes from the app’s code: the Pen’s strokes (Ink.swift), the suits (Suits.swift), the room’s shapes, converted path by path to SVG. Checked in Figma against the app’s rendering: 0.001–1.4 of 255 mean difference per channel, edge anti-aliasing only. Strokes are seeded, so a part traced by hand won’t share the hand: draw new parts with the Pen, in code.', source: 'Ink.swift:10-33, 77-325' }),
    L.note({ w: W, tags: ['fixed'], title: 'Glows are effect styles', body: 'SwiftUI shadows are the file’s Glow effect styles: Glow/Glyph lit is #ECCE6E at 80 %, SwiftUI radius 6, Figma blur 12. Halos need the Screen blend mode, set on their layers here. On hairlines Figma’s glow reads fainter than SwiftUI’s: judge by the app renders beside them. The hold ring and glints, drawn by Metal in the app, are rebuilt as vectors.', source: 'Legend.swift:372; Keeping.swift:956; Chamber.swift:503-548' }),
    L.note({ w: W, tags: ['fixed'], title: 'Inks are variables', body: 'Each solid ink in a component is bound to its Arcana colour variable (ink/text-50, gold/ink-60 …), so Inspect shows the token. Gold leaf is Palette.leaf, a four-stop gradient laid across each shape’s own box, top left to bottom right.', source: 'Palette.swift' }),
    L.note({ w: W, tags: ['fixed', 'open'], title: 'Hover is rare', body: 'Only the page-turn chevrons, the cards and the moon answer the pointer, with a hover look and a pointing hand. The bowl, the key and the spread choices are plain buttons: arrow cursor, only the system’s pressed dim. There is no keyboard focus ring anywhere.', source: 'RootView.swift:35-36, 1091-1131' }),
  ], { gap: 24, align: 'MIN', name: 'How these were made' }))
  sec.appendChild(b)
}

// ------------------------------------------------------------------ Room glyphs
{
  const b = L.board({ name: 'Components · Room glyphs', kicker: 'PARTS · THE ROOM', title: 'Room glyphs', w: 1600,
    lead: 'The few marks on the sky around the table: the sound bowl top right, the old key top left, the page-turn chevrons on a kept reading, the hairlines, and the dot the pen leaves when the question line is full.' })

  // Glyph/Bowl
  const on = { c: await CL.comp('ui/bowl-sound-on.svg', 'Sound=On'), label: 'Sound on', sub: 'text 50 %' }
  const mu = { c: await CL.comp('ui/bowl-muted.svg', 'Sound=Muted'), label: 'Muted', sub: 'text 30 %' }
  const bowl = CL.grid([on, mu], 'Glyph/Bowl', { labels: false, pad: 12, gap: 16,
    desc: 'The sound toggle, top right of the room, 18 pt in: a singing bowl drawn by the pen, two arcs of its note rising while the room is heard. 26 × 26 pt. Muting fades the note out and the bowl from 50 % to 30 % text ink over 0.35 s ease-out. No hover look: a plain button, arrow cursor.', src: 'Sources/Arcana/RootView.swift:1612-1644' })
  L.add(b, await CL.card({ name: 'Glyph/Bowl',
    what: 'The sound toggle, top right of the room, 18 pt in from the corner: a singing bowl drawn by the pen, two arcs of its note rising off it while the room is heard.',
    stage: [CL.previews([on, mu], { k: 4, colW: 120 }), CL.masters(bowl.holder)],
    specs: [
      ['Variants', 'Sound = On · Muted'],
      ['Size', '26 × 26 pt (the pen’s 24 pt space drawn into 26 pt)', 'RootView.swift:1612-1615'],
      ['Ink', 'text 50 % on, 30 % muted; strokes 1.05, 1.0, 0.9 pt × 26/24', 'RootView.swift:1617-1634'],
      ['Motion', 'the note fades out and the bowl dims over 0.35 s ease-out', 'RootView.swift:1632-1641'],
      ['Hover', 'none: a plain button, arrow cursor, the system’s pressed dim'],
    ],
    tags: ['shipped', ['open', 'No hover look']] }))

  // Glyph/Key
  const kr = { c: await CL.comp('ui/key-glyph-rest.svg', 'State=Rest'), label: 'Rest', sub: 'text 50 %' }
  const kl = { c: await CL.comp('ui/key-glyph-lit.svg', 'State=Lit', { glow: 'Glow/Glyph lit' }), label: 'Lit', sub: 'keys page open' }
  const key = CL.grid([kr, kl], 'Glyph/Key', { labels: false, pad: 16, gap: 24,
    desc: 'Top left of the room, 18 pt in, where the bowl is top right: an old key turned 45° as in a lock, bow low and bit high. Opens and closes the keys page (also ? or ⌘/). Rest: text 50 %. Lit (keys page open): gold ink with Glow/Glyph lit. Cross-fades over 0.35 s ease-out. No hover look.', src: 'Sources/Arcana/Legend.swift:337-377' })
  L.add(b, await CL.card({ name: 'Glyph/Key',
    what: 'Top left of the room, 18 pt in, where the bowl is top right: an old key turned 45° as in a lock, bow low and bit high. It opens and closes the keys page (so do ? and ⌘/).',
    stage: [CL.previews([kr, kl], { k: 4, colW: 120, h: 216,
      extra: [await CL.render('glyphs/ui/key-glyph-lit-app@3x.png', 'App render', { scale: 0.75, sub: 'lit, with its glow' })] }), CL.masters(key.holder)],
    specs: [
      ['Variants', 'State = Rest · Lit'],
      ['Size', '26 × 26 pt', 'Legend.swift:337-340'],
      ['Ink', 'rest: text 50 %. Lit: gold ink 100 % + Glow/Glyph lit (#ECCE6E 80 %, blur 12)', 'Legend.swift:367-373'],
      ['Motion', 'cross-fade 0.35 s ease-out', 'Legend.swift:376'],
      ['Hover', 'none: a plain button, arrow cursor'],
    ],
    tags: [['akash', 'Akash: a button like the bowl, top left'], ['claude', 'Claude: an old key, turned 45°'], ['lesson', 'A keycap read as UI chrome']] }))

  // Chevron
  const ch = [
    { c: await CL.comp('ui/chevron-left-rest.svg', 'Direction=Left, State=Rest'), label: 'Left · rest', sub: 'text 36 %' },
    { c: await CL.comp('ui/chevron-left-hover.svg', 'Direction=Left, State=Hover', { glow: 'Glow/Glyph lit' }), label: 'Left · hover', sub: 'gold ink + glow' },
    { c: await CL.comp('ui/chevron-right-rest.svg', 'Direction=Right, State=Rest'), label: 'Right · rest', sub: 'text 36 %' },
    { c: await CL.comp('ui/chevron-right-hover.svg', 'Direction=Right, State=Hover', { glow: 'Glow/Glyph lit' }), label: 'Right · hover', sub: 'gold ink + glow' },
  ]
  const chev = CL.grid(ch, 'Chevron', { labels: false, pad: 16, gap: 24,
    desc: 'The page turns on a kept reading: an open angle in the pen’s hand beside the spread, on the card row’s centre line, half a slot + 58 pt out (at least 30 pt from the edge); shown only when there is a reading that way. 12 × 24 pt mark, 44 × 64 pt hit area. Rest text 36 %; hover gold ink + Glow/Glyph lit, pointing hand, 0.2 s ease-out. Appears and leaves with a 0.4 s fade.', src: 'Sources/Arcana/Keeping.swift:928-975' })
  L.add(b, await CL.card({ name: 'Chevron',
    what: 'On a kept reading, the way to the reading before or after: an open angle in the pen’s hand beside the spread, on the card row’s centre line, half a slot + 58 pt out (at least 30 pt from the edge). Shown only when there is a reading that way.',
    stage: [CL.previews(ch, { k: 4, colW: 96, h: 208, gap: 24,
      extra: [await CL.render('glyphs/ui/chevron-left-hover-app@3x.png', 'App render', { scale: 0.75, sub: 'left · hover' })] }), CL.masters(chev.holder)],
    specs: [
      ['Variants', 'Direction = Left · Right  ×  State = Rest · Hover'],
      ['Size', '12 × 24 pt mark; hit area 44 × 64 pt centred on it', 'Keeping.swift:928-975'],
      ['Ink', 'rest: text 36 %, 1.0 pt round. Hover: gold ink + Glow/Glyph lit', 'Keeping.swift:951-957'],
      ['Motion', 'hover 0.2 s ease-out; appears and leaves with a 0.4 s fade', 'Keeping.swift:961-962'],
      ['Cursor', 'pointing hand'],
    ],
    tags: [['claude', 'Claude: pen-drawn chevrons'], 'shipped'] }))

  // Rule + Spent pen dot
  const rules = [
    { c: await CL.comp('ui/rule-title.svg', 'Use=Title'), label: 'Title · 46 × 1', sub: 'under ARCANA; over THE KEYS' },
    { c: await CL.comp('ui/rule-epigraph.svg', 'Use=Epigraph'), label: 'Epigraph · 30 × 1', sub: 'over the question read back' },
    { c: await CL.comp('ui/rule-altar.svg', 'Use=Altar'), label: 'Altar · 54 × 1', sub: 'between essence and line' },
  ]
  const op = n => Math.round(((n.findOne(x => x.type === 'RECTANGLE' || x.type === 'ELLIPSE' || x.type === 'VECTOR') || {}).fills || [{ opacity: 1 }])[0].opacity * 100)
  const ruleInk = rules.map(r => op(r.c) + ' %').join(', ')
  const rule = CL.grid(rules, 'Rule', { labels: false, pad: 16, gap: 32,
    desc: 'The hairlines. Title 46 × 1 (between ARCANA and the question, which sits 14 pt under it; on the keys page 18 pt over THE KEYS). Epigraph 30 × 1 (21 pt above the question read back over the spread). Altar 54 × 1 (between a card’s essence and its line on the altar). Static.', src: 'Sources/Arcana/RootView.swift:709' })
  const dotC = await CL.comp('ui/spent-dot.svg', 'Spent pen dot')
  CL.doc(dotC, 'When a key finds no room at the end of the 560 pt question line, the pen touches the paper just past the last letter and lays nothing: a 2.4 pt gold dot, 0.5 pt after the text, its centre 1.2 pt above the baseline. Appears at 45 % and fades to 0 over 0.7 s (smoothstep).', 'Sources/Arcana/RootView.swift:895-911')
  const dot = { c: dotC, label: 'Spent pen dot', sub: '2.4 pt, gold ink 45 %' }
  L.add(b, await CL.card({ name: 'Rule · Spent pen dot',
    what: 'Three gold hairlines that part the room’s type, and the dot the pen leaves when a key finds no room at the end of the 560 pt question line: it touches the paper just past the last letter and lays nothing.',
    stage: [L.row([CL.previews(rules, { k: 3, gap: 40, h: 12, colW: 170 }), CL.previews([dot], { k: 12, colW: 120, h: 40 })], { gap: 56, align: 'MIN', name: 'Previews' }),
      L.row([CL.masters(rule.holder), CL.masters(CL.shelf([{ c: dotC }], 'Spent pen dot · master', { colW: 24, h: 24 }))], { gap: 40, name: 'Masters' })],
    specs: [
      ['Variants', 'Rule: Use = Title · Epigraph · Altar. Spent pen dot: one state'],
      ['Size', 'rules 46, 30 and 54 × 1 pt; the dot 2.4 pt', 'RootView.swift:709, 1013, 1491'],
      ['Ink', 'rules gold ink at ' + ruleInk + '; the dot gold ink, layer 45 %'],
      ['Place', 'title rule: the question line 14 pt under it; epigraph rule 21 pt above the question read back; dot 0.5 pt after the text, centre 1.2 pt above the baseline', 'RootView.swift:895-911'],
      ['Motion', 'rules static; the dot fades from 45 % to 0 over 0.7 s (smoothstep)', 'RootView.swift:895-911'],
    ],
    tags: ['shipped'] }))
  sec.appendChild(b)
}

// ------------------------------------------------------------------ The keys
{
  const b = L.board({ name: 'Components · The keys', kicker: 'PARTS · THE KEYS', title: 'The keys', w: 1600,
    lead: 'The keys page (the old key, ? or ⌘/) draws each key by the pen: a sign in place of a typeset symbol, and a cap the pen has not quite made true.' })

  const SIGNS = ['Left', 'Right', 'Up', 'Command', 'Delete', 'Comma']
  const GLYPH = { Left: '←', Right: '→', Up: '↑', Command: '⌘', Delete: '⌫', Comma: ',' }
  const sign = {}
  for (const s of SIGNS) {
    sign[s] = await CL.comp('ui/keys/key-sign-' + s.toLowerCase() + '.svg', 'Key sign/' + s)
    CL.doc(sign[s], 'Keys page sign for ' + GLYPH[s] + ', drawn by the pen in place of a typeset symbol. 10 × 10 pt, text 74 %, 0.95 pt round; all its strokes are one path stroked once, so crossings don’t darken. Sits centred in its 22 × 22 keycap.', 'Sources/Arcana/Legend.swift:254-308')
  }
  const signItems = SIGNS.map(s => ({ c: sign[s], label: s, sub: GLYPH[s] }))
  const shelf = CL.shelf(signItems.map(i => ({ c: i.c })), 'Key sign · masters', { colW: 40, gap: 16, pad: 12 })
  // previews need the masters placed first (instances of components not yet parented are fine too)
  L.add(b, await CL.card({ name: 'Key sign/*',
    what: 'The signs on the keys page, drawn by the pen in place of typeset symbols. Six components: ← → ↑ ⌘ ⌫ and the comma.',
    stage: [CL.previews(signItems, { k: 6, colW: 96, gap: 24 }), CL.masters(shelf, 'Masters · 1× (Key sign/Left … Key sign/Comma)')],
    specs: [
      ['Components', 'Key sign/Left · Right · Up · Command · Delete · Comma'],
      ['Size', '10 × 10 pt, drawn 1:1, centred in a 22 × 22 cap', 'Legend.swift:181-184'],
      ['Ink', 'text 74 %, 0.95 pt round caps and joins', 'Legend.swift:173-184'],
      ['Build', 'one path stroked once, so crossings don’t darken: keep it one vector', 'Legend.swift:236-249'],
      ['States', 'one: the page has no hover or press look'],
    ],
    tags: [['claude', 'Claude: the keys page'], ['lesson', 'The comma became a filled drop']] }))

  // Keycap: outline + nested sign or word
  const CAPS = [
    ['left-choose', 'Left', 'Choose', 'Left'], ['right-choose', 'Right', 'Choose', 'Right'], ['space-hold', 'Space', 'Hold', 'space'],
    ['up-past-readings', 'Up', 'Past readings', 'Up'], ['command-forget-a-reading', 'Command', 'Forget a reading', 'Command'],
    ['delete-forget-a-reading', 'Delete', 'Forget a reading', 'Delete'], ['esc-back', 'Esc', 'Back', 'esc'],
    ['command-settings', 'Command', 'Settings', 'Command'], ['comma-settings', 'Comma', 'Settings', 'Comma'],
  ]
  const caps = []
  for (const [file, k, line, what] of CAPS) {
    const c = await CL.comp('ui/keys/keycap-' + file + '.svg', 'Key=' + k + ', Line=' + line)
    const outline = c.children[0]; if (outline) outline.name = 'Cap outline'
    if (sign[what]) {
      const i = sign[what].createInstance(); i.name = 'Sign'
      c.appendChild(i); i.x = (c.width - 10) / 2; i.y = (c.height - 10) / 2
    } else {
      const t = await CL.type(what, 'Caps/Keycap', 'ink/text-74', { w: c.width - 2, h: 22, name: 'Word' })
      c.appendChild(t); t.x = 1 + 0.8; t.y = 1
    }
    caps.push({ c, label: (GLYPH[k] || k.toUpperCase()) + '  ' + line.toLowerCase(), k })
  }
  const capSet = CL.grid(caps, 'Keycap', { labels: false, pad: 12, gap: 14, valign: 'center',
    desc: 'A key on the keys page: a rounded square the pen has not quite made true, each side bowed a hair, each corner turned round (CapShape), outlined 0.85 pt in text 40 %. Sign caps are 22 × 22 with a Key sign inside; word caps (SPACE, ESC) are the word’s width + 1.6 pt + 7 pt either side, 22 tall, Caps/Keycap (Didot 9, tracking 1.6) in text 74 %. Frames are the cap’s box inset 1 pt so the stroke isn’t clipped. Each cap has its own seed, so the two ⌘ caps are different drawings. No hover or press look.', src: 'Sources/Arcana/Legend.swift:169-231' })
  // previews grouped as the keys page's lines, three to a row
  const LINES = [['Choose', 'choose'], ['Hold', 'hold'], ['Past readings', 'past readings'], ['Forget a reading', 'forget a reading'], ['Back', 'back'], ['Settings', 'settings']]
  const group = ([line, words]) => {
    const insts = caps.filter(c => c.c.name.endsWith('Line=' + line)).map(c => { const i = c.c.createInstance(); i.rescale(3); i.name = 'Preview · ' + c.c.name; return i })
    return L.col([L.row(insts, { gap: 8, name: 'Caps' }), L.text(words, 'label', { align: 'CENTER' })], { gap: 10, align: 'CENTER', name: 'Line · ' + words, w: 250 })
  }
  const capPreviews = L.col([0, 3].map(i => L.row(LINES.slice(i, i + 3).map(group), { gap: 24, align: 'MIN', name: 'Lines' })), { gap: 28, name: 'Previews ×3, by line' })
  L.add(b, await CL.card({ name: 'Keycap',
    what: 'A key on the keys page: a rounded square the pen has not quite made true, each side bowed a hair, each corner turned round. Sign keys hold a Key sign; SPACE and ESC are set in type.',
    stage: [capPreviews, CL.masters(capSet.holder, 'Masters · 1×, in the keys page’s order')],
    specs: [
      ['Variants', 'Key × Line, nine caps, one per key on the page', 'Legend.swift:43-51'],
      ['Size', 'sign caps 22 × 22 pt; ESC 39.6 × 22; SPACE 54.6 × 22 (word + 1.6 pt + 7 pt either side)', 'Legend.swift:176-192'],
      ['Ink', 'outline text 40 %, 0.85 pt round; sign or word text 74 %', 'Legend.swift:173-196'],
      ['Type', 'Caps/Keycap: Didot 9 pt, tracking 1.6, capitals', 'Legend.swift:176-180'],
      ['Seeds', 'each cap its own (seedHash of its line + index), so no two caps are the same drawing', 'Legend.swift:129'],
      ['States', 'one: the page has no hover or press look'],
    ],
    tags: [['claude', 'Claude: pen-drawn keycaps'], ['akash', 'Akash: “as minimal as possible”'], 'shipped'] }))
  sec.appendChild(b)
}

await CL.finish(sec)
const boards = sec.children.filter(n => MINE.includes(n.name))
const snaps = []
for (const n of boards) snaps.push(await L.snap(n, 'pages/components/' + n.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.png', { scale: 0.4, wait: snaps.length ? 300 : 1500 }))
return { bound: CL.bound, snaps }
