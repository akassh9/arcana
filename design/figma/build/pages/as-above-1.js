// Chapter: As Above (Design system), step 1 of 2: header, how an answer arrives, the Wheel, the Star.
//   node design/figma/bridge/run.mjs design/figma/build/pages/as-above-lib.js design/figma/build/pages/as-above-1.js
const L = S.lib
const sec = await L.chapter('As Above')
const { sm, ramp, keys, COL } = AA

// ---- 1. Header ----------------------------------------------------------------------------
const head = L.board({ name: 'As Above · Header', kicker: 'THE SKY', title: 'As Above', w: 1600,
  lead: 'Four of the 78 cards already have a counterpart in Arcana’s sky: the engraved wheel, the gold glints, tonight’s real moon and first light. When one of them is drawn, the sky answers it, with no words and no sound.',
  tags: ['claude', 'shipped'] })
L.add(head, L.rich([['In this chapter   ', 'smallStrong'], ['How an answer arrives  ·  Wheel of Fortune  ·  The Star  ·  The Moon  ·  The Sun  ·  Open questions', 'small']], 'small', { w: 1456 }))
L.add(head, AA.fig(await L.window('shots-window/39-heavens.png'), 'All four at once', 'The Long Road with The Star, The Moon, Wheel of Fortune, The Sun and The Fool. The answers compose: the lilac moonlight and the morning mix into a warm pink-lilac room, the stars are out, the wheel has turned.', 'Answers.swift:379-471'))
const four = L.table([
  { key: 'c', label: 'Card', w: 200, style: 'smallStrong' }, { key: 'k', label: 'In the sky', w: 190 }, { key: 'u', label: 'Upright', w: 480 }, { key: 'r', label: 'Reversed', w: 480 },
], [
  ['Wheel of Fortune · X', 'the engraved wheel', 'turns one house (30°) and stays', 'turns a house and comes back'],
  ['The Star · XVII', 'the gold glints', 'the glints come out as stars one by one, and stay', 'one star at a time comes out and goes in again'],
  ['The Moon · XVIII', 'tonight’s moon', 'a lilac half-light spreads from the moon, as strong as the real moon is lit', 'the lilac clears off the sky to plain pale blue'],
  ['The Sun · XIX', 'first light', 'first light rises into morning and the rays reach further', 'the light comes up white and the colour drains out'],
], { name: 'The four' })
L.add(head, L.col([L.text('The four, and how each answers', 'h3'), four, L.source('Answers.swift:11-32; Deck.swift:101-141')], { gap: 10 }))
L.add(head, L.row([
  L.note({ w: 344, tags: ['claude'], title: 'Only four Majors answer', body: 'Claude proposed As Above on 25 September and Akash approved it the same day: only the cards whose counterpart is already in the sky. Every other card leaves the sky alone.', source: 'Answers.swift:31-32' }),
  L.note({ w: 344, tags: ['claude'], title: 'No new shapes, words or sounds', body: 'An answer is opacity and transform only: a light laid over the sky’s own fields (which are never repainted), the wheel turning, or glints held lit.', source: 'Answers.swift:23-28' }),
  L.note({ w: 344, tags: ['akash'], title: 'Light on light', body: 'Every answer’s colour is light (lilac, a clear pale blue, dawn, white), so nothing ever darkens: Akash’s light-only rule, applied by Claude. The reversed answers lighten too.', source: 'Answers.swift:210-245' }),
  L.note({ w: 344, tags: ['claude'], title: 'Not replayed in kept readings', body: 'When a kept reading is remembered through the moon’s door, the sky does not answer again. Claude’s choice; a possible follow-up.' }),
], { gap: 24, align: 'MIN', name: 'Decisions' }))

// ---- 2. How an answer arrives ---------------------------------------------------------------
const how = L.board({ name: 'As Above · How an answer arrives', kicker: 'AS ABOVE', title: 'How an answer arrives', w: 2400,
  lead: 'Every answer has the same life. It waits for the card’s ink to cool, arrives over about one breath, stays while the card lies on the table and is given back with the card’s ink.', leadW: 1300, tags: ['claude'] })
const stage = (k, t, b) => L.col([L.text(k, 'kicker'), L.text(t, 'h3', { w: 300 }), L.text(b, 'small', { w: 300 })], { gap: 6, pad: 20, w: 340, fill: '#FFFFFF', fillA: 0.75, stroke: L.C.stroke, r: 14, name: 'Stage · ' + t })
const arrow = () => L.text('→', 'h2', { alpha: 0.35 })
L.add(how, L.row([
  stage('0 S', 'The card lands face up', 'The draw lays the card in its slot.'),
  arrow(),
  stage('2.1 S', 'Its ink writes itself', 'The answer waits for this (about 2.56 s after the click). Reduce Motion: 0.2 s.'),
  arrow(),
  stage('9 S · REVERSED WHEEL 14 S', 'The answer arrives', 'Smoothstep, cubic-bezier(0.333, 0, 0.667, 1). Reduce Motion: 1.2 s.'),
  arrow(),
  stage('WHILE THE CARD IS DOWN', 'It stays', 'Through the recital, the altar and the thread.'),
  arrow(),
  L.col([
    stage('THE RETURN HOLD · 3.2 S', 'Given back with the ink', 'Each answer fades as its card’s ink sinks, the last-drawn card first. Let go and it comes back.'),
    stage('ESC', 'Or let go with the table', 'Fades in 0.6 s, smoothstep, from wherever it is.'),
  ], { gap: 16 }),
], { gap: 16, align: 'CENTER', name: 'The life of an answer' }))
L.add(how, L.specs([
  ['Onset', '2.1 s after the card lands face up (the ink’s time); Reduce Motion 0.2 s', 'Game.swift:39, 469-488, 623-633'],
  ['Length', '9 s; the reversed Wheel 14 s; Reduce Motion 1.2 s for every answer', 'Answers.swift:59-62'],
  ['Easing', 'smoothstep 3t² − 2t³, which is exactly cubic-bezier(0.333, 0, 0.667, 1)', 'Answers.swift:318-319; Palette.swift:130-133'],
  ['Given back', 'card k of n sinks across a window of the hold’s progress: s = 0.54 / (n + 1), from a = 0.30 + (n − 1 − k) × s to a + 2s; v = ((progress − a) / 2s)^1.8; the answer shows × (1 − v)', 'Game.swift:298-303, 318; Answers.swift:85'],
  ['Let go (esc)', '0.6 s, smoothstep, from the current value to 0', 'Answers.swift:65, 342-356'],
  ['Engine', 'six Core Animation layers, always there at opacity 0; SwiftUI passes only the answers and how far each card has sunk, so an arriving answer costs the main thread nothing. The stars are drawn by the Metal near sky.', 'Answers.swift:379-471'],
], { w: 2256, keyW: 180 }))
const zs = ['Sky fields (pearl · high sky · lilac · rose · dawn · rays)', 'Clearing', 'Moonlight', 'Halo', 'Morning', 'Long rays', 'Glare', 'Engraved wheel', 'Moon', 'Near sky (stars)', 'Vignette']
const zrow = L.row([L.text('BOTTOM', 'kicker', { color: '#5E554C' })], { gap: 10, align: 'CENTER', name: 'Answer layers, bottom to top' })
zs.forEach((z, i) => { const own = i >= 1 && i <= 6; L.add(zrow, L.frame({ name: 'Layer · ' + z, dir: 'h', pad: [6, 12], r: 999, fill: own ? '#FFFFFF' : '#E9E6E1', stroke: L.C.stroke, kids: [L.text(z, own ? 'smallStrong' : 'small', { alpha: own ? 1 : 0.7 })] })); if (i < zs.length - 1) L.add(zrow, L.text('→', 'small', { alpha: 0.4 })) })
L.add(zrow, L.text('TOP', 'kicker', { color: '#5E554C' }))
L.add(how, L.col([L.text('Where the lights sit', 'h3'), zrow, L.text('The six answer lights (white) sit between the sky’s own fields and the wheel; all use plain Normal blending, premultiplied, no blend modes.', 'caption'), L.source('Chamber.swift:183-234; Answers.swift:404-423')], { gap: 10 }))
L.add(how, L.section('Before and after, in the window', { lead: 'The same reading, The Lovers, The Moon and Justice, spoken: before the sky answers and after. Rendered on 27 September, when the moon was 98.5% lit, so the Moon’s answer here is near its strongest.', leadW: 1300 }))
L.add(how, L.row([
  AA.fig(await AA.win('shots-window/35a-moon-before.png', 1104), 'Before', 'The Moon drawn and spoken; the sky not yet answering.', null),
  AA.fig(await AA.win('shots-window/35-moon.png', 1104), 'After', 'A lilac half-light from the moon over the room, and a pale halo that keeps its face readable.', null),
], { gap: 48, align: 'MIN' }))
L.add(how, L.section('It stays, and it is given back'))
L.add(how, L.row([
  AA.fig(await AA.win('shots-window/40-altar-moon.png', 1104), 'It stays through the altar', 'The Moon open on the altar while its moonlight still lies over the room.', null),
  AA.fig(await AA.win('shots-window/41-returning-star.png', 1104), 'Given back with the ink', 'A Star reading being returned, the hold at 0.55: the stars go as the ink sinks.', null),
], { gap: 48, align: 'MIN' }))

// ---- 3. Wheel of Fortune -------------------------------------------------------------------
const WT = 600
const wheelTile = async (turned, name) => {
  const f = AA.box(name, WT, WT, { back: '#F9F7F2' })
  const n = await L.svg(turned ? 'sky/wheel/engraved-wheel-turned-30.svg' : 'sky/wheel/engraved-wheel.svg', { w: WT }); AA.put(f, n)
  return { f, n }
}
const a0 = await wheelTile(false, 'Wheel · unturned'), a1 = await wheelTile(true, 'Wheel · turned 30°')
const ov = AA.box('Wheel · both, overlaid', WT, WT, { back: '#F9F7F2' })
const o0 = await L.svg('sky/wheel/engraved-wheel.svg', { w: WT }); AA.put(ov, o0); o0.opacity = 0.9
const o1 = await L.svg('sky/wheel/engraved-wheel-turned-30.svg', { w: WT }); AA.put(ov, o1)
for (const v of o1.findAll(n => n.type === 'VECTOR')) { if (v.strokes.length) v.strokes = [L.solid('#8C2E25', 0.85)]; if (v.fills.length) v.fills = [L.solid('#8C2E25', 0.85)] }
o1.name = 'Turned 30° (drawn in oxblood here)'
const wheel = await AA.card({
  title: 'Wheel of Fortune', numeral: 'X', tags: ['claude', 'shipped'],
  lead: 'The celestial wheel engraved faintly on the sky turns one house. It is the quietest of the four answers.',
  verses: ['The turn has started. Join it.', 'The same loop, unedited.'], verseSrc: 'Deck.swift:101-103',
  say: ['The wheel turns one house, 30° clockwise, over 9 s and stays turned.', 'It turns a house and comes back over 14 s, ending where it began.'],
  after: ['sky/answers/as-above-sky-wheel-1260x860.png', 'sky/answers/as-above-sky-wheel-reversed-mid-turn-1260x860.png'],
  afterCap: ['Turned 30° and staying. Hard to tell from before: see the open question below.', '7 s into its 14 s, at the far end of its turn, about to come back.'],
  windows: [['shots-window/31-wheel.png', 'Upright · The Tower, Wheel of Fortune, The Hermit', 'The engraved wheel has turned one house; the closing prompt is showing.'], ['shots-window/32-wheel-reversed.png', 'Reversed · 7 s in', 'Caught at the far end of its turn.']],
  aloneLead: 'The wheel at full ink; the sky shows it at 5.5%. Laid over each other, the houses, rings and ticks land back on themselves. Only the star of eight and the sixteen inner rays show the turn.',
  alone: [
    AA.fig(a0.f, 'Unturned', 'Vector, full ink.', 'CardArt.swift:492-526'),
    AA.fig(a1.f, 'Turned one house', 'Where the upright answer ends and stays.', 'Answers.swift:151-158'),
    AA.fig(ov, 'Both, overlaid', 'Unturned in the wheel’s ink, turned in oxblood. Where the two coincide, nothing visibly moves.', null),
  ],
  timeLead: 'Both begin once the card has written itself, 2.1 s after it lands. Upright: 9 s, smoothstep. Reversed: 0 → 30° by 46% of 14 s, a short hold, and back by 14 s.',
  lanes: [
    { label: 'Upright', sub: 'rotation 0 → 30°, stays', top: '30°', curves: [{ f: t => sm((t - 2.1) / 9), color: COL.a, name: 'Rotation, upright' }], marks: [{ t: 11.1, label: 'turned · stays', y: 'top', dy: 6 }] },
    { label: 'Reversed', sub: 'turns and comes back', top: '30°', curves: [{ f: t => keys([0, 1, 1, 0], [0, 0.46, 0.54, 1])((t - 2.1) / 14), color: COL.b, name: 'Rotation, reversed' }], marks: [{ t: 8.54, label: '30° at 8.5 s', y: 'top', dy: 6, dx: -96 }, { t: 9.66, label: 'back from 9.7 s', y: 'top', dy: 6 }, { t: 16.1, label: 'home at 16.1 s (14 s in)', dx: 6 }] },
  ],
  rows: [
    ['Layer', 'the engraved wheel (layer 7), a Core Animation layer', 'same', 'Answers.swift:473-540; Chamber.swift:246-269'],
    ['Property', 'rotation about the wheel’s centre, (630, 379.76) in the window', 'same', 'Answers.swift:488-491'],
    ['From → to', '0° → 30° clockwise, and stays', '0° → 30° → 0°: ends where it began', 'Answers.swift:151-158'],
    ['Timing', 'from 2.1 s after landing; 9 s, smoothstep', '14 s: turned by 6.44 s, held to 7.56 s, back by 14 s; each span smoothstep', 'Answers.swift:59-62, 155-158'],
    ['Reduce Motion', 'no turn: a pre-turned copy cross-fades in over 1.2 s', 'nothing shows', 'Answers.swift:532-539'],
    ['Opacity', 'unchanged: 5.5% (10.5% only while a question is held)', 'same', 'Chamber.swift:222'],
  ],
  notes: [
    L.note({ w: 720, tags: ['open'], title: 'The turn lands on its own symmetry', body: '30° is the wheel’s own symmetry: its twelve houses, house rings and 120 / 72 tick rings land back on themselves. Only the star of eight and the inner rays end up changed, and at 5.5% the end state hardly differs from the start. The motion shows while it happens.', source: 'CardArt.swift:498-522; Chamber.swift:222' }),
    L.note({ w: 720, tags: ['claude'], title: 'The reversed answers follow the line', body: 'Each reversed answer does what its line says: here “The same loop, unedited.”, a turn that comes back to where it began.', source: 'Answers.swift:11-21' }),
    L.note({ w: 720, tags: ['open'], title: 'Nothing under Reduce Motion, reversed', body: 'With Reduce Motion the reversed Wheel shows nothing at all, so that card goes unanswered. Is a still sign wanted?', source: 'Answers.swift:533-535' }),
  ],
})

// ---- 4. The Star ---------------------------------------------------------------------------
const zt = async (path, name) => { const f = AA.box(name, 232, 232, { back: AA.SKYBLUE }); AA.put(f, await L.img(path, { w: 232 })); return f }
const starAlone = [
  AA.fig(await AA.full('sky/answers/as-above-stars-held-1260x860@2x.png', 736, { overSky: true, name: 'Stars held, over the backdrop' }), 'All eleven held', 'The stars alone, over the resting backdrop.', null),
  AA.fig(await zt('sky/near/glint-size-5-peak@16x.png', 'Ordinary glint'), 'An ordinary glint', 'At its height, 7×, over sky blue.', 'Chamber.swift:514-517'),
  AA.fig(await zt('sky/near/star-coming-out-1-held-0.25@16x.png', 'Star 25%'), 'Coming out · 25%', 'Every part × held.', null),
  AA.fig(await zt('sky/near/star-coming-out-2-held-0.5@16x.png', 'Star 50%'), 'Coming out · 50%', null, null),
  AA.fig(await zt('sky/near/star-coming-out-3-held-0.75@16x.png', 'Star 75%'), 'Coming out · 75%', null, null),
  AA.fig(await zt('sky/near/star-held-size-5@16x.png', 'Star held'), 'Held', 'A white halo, longer arms, a gold core and a pearl heart.', 'Chamber.swift:521-525'),
]
const starUp = k => t => ramp((t - 2.1) / 9, k / 11 * 0.72, k / 11 * 0.72 + 0.28)
const starRev = t => { const age = t - 2.1; if (age < 0) return 0; const u = age / 6.5, f = u - Math.floor(u); return 0.85 * ramp(f, 0, 0.42) * (1 - ramp(f, 0.55, 0.95)) }
const star = await AA.card({
  title: 'The Star', numeral: 'XVII', tags: ['claude', 'akash', 'shipped'],
  lead: 'Where the sky’s momentary gold glints are, stars come out in the day sky. They are the glints held lit, in the fading-glint shape Akash chose.',
  verses: ['Less than you can, every day.', 'Waiting to feel hopeful first.'], verseSrc: 'Deck.swift:131-133',
  say: ['The eleven glints come out as stars one by one across 9 s, and stay.', 'One star at a time comes out and goes in again, 6.5 s each. The sky never keeps more than one.'],
  after: ['sky/answers/as-above-sky-star-1260x860.png', 'sky/answers/as-above-sky-star-reversed-1260x860.png'],
  afterCap: ['All eleven stars held.', 'The third star at the height of its coming out, 16.1 s in.'],
  windows: [['shots-window/33-star.png', 'Upright · The Empress, The Star, The Chariot', 'The sky’s glints held lit as stars.'], ['shots-window/34-star-reversed.png', 'Reversed · 16 s in', 'One star at a time: the third, at its height.']],
  aloneLead: 'The stars stand exactly where the glints are (see Sky & moon · Seeded positions). A held star is the same tapered shape, 2.2× the glint’s size instead of 1.6×, in a soft white light.',
  alone: starAlone,
  timeLead: 'Upright, star k starts at k/11 × 0.72 of the 9 s answer and comes out over 2.52 s: the first at 2.1 s, all eleven lit by 10.5 s. Reversed, one star at a time, 6.5 s each, from the moment the answer begins, round and round.',
  lanes: [
    { label: 'Upright', sub: 'eleven stars, one by one, and stay', top: 'held', curves: Array.from({ length: 11 }, (_, k) => ({ f: starUp(k), color: k % 2 ? COL.c : COL.a, sw: 1.6, name: 'Star ' + (k + 1) })), marks: [{ t: 2.1, label: 'star 1', y: 'top', dy: 6, dx: 6 }, { t: 10.51, label: 'all lit · 10.5 s', y: 'top', dy: 6, dx: 8 }] },
    { label: 'Reversed', sub: 'one at a time, 6.5 s each; loops every 71.5 s', top: 'held', curves: [{ f: starRev, color: COL.b, name: 'Held, reversed' }], marks: [0, 1, 2, 3].map(k => ({ t: 2.1 + 6.5 * k, label: 'star ' + (k + 1), y: 'top', dy: 6, dx: 6 })) },
  ],
  rows: [
    ['Layer', 'the eleven glints in the near sky (Metal)', 'same', 'Chamber.swift:500-528'],
    ['Property', 'held 0 → 1: the glint becomes a star and its twinkle stops', 'held 0 → 0.85 → 0, one star at a time', 'Answers.swift:175-189'],
    ['Order', 'star k from p = k/11 × 0.72, over 0.28 of p (2.52 s); first at 2.1 s, all lit by 10.5 s', 'stars 1 → 11 in turn: in by 2.73 s, held to 3.58 s, out by 6.18 s, dark to 6.5 s; a 71.5 s round, forever', 'Answers.swift:179-188'],
    ['Starts', '2.1 s after landing, spread across the 9 s answer', 'at once when the answer begins; not spread by the 9 s', 'Answers.swift:184-188'],
    ['Reduce Motion', 'all eleven fade in within 1.2 s, staggered', 'freezes, probably on one star part-lit (found in the code, not seen)', 'Answers.swift:179-188; Chamber.swift:423-426'],
    ['The held star', 'white halo r 14 at 50%; goldInk arms 2.2 × size × (0.94 + 0.06 breath), 1.1 pt at the heart, at 50%; goldLit core r 4 at 80%; pearl heart r 0.9, white 90%', 'the same, at up to 85%', 'Chamber.swift:521-525'],
  ],
  notes: [
    L.note({ w: 720, tags: ['akash', 'lesson'], title: 'Fading glints, not crosses', body: 'The first stars were equal-armed gold crosses with square ends; Akash said they “look bad”. From five renders Akash chose fading glints and asked every glint to take that shape. Small lights with equal, square arms read as plus signs: taper them.', source: 'SkyRenderer.swift:90-94, 154-160' }),
    L.note({ w: 720, tags: ['open'], title: 'The reversed Star never rests', body: 'It cycles through the eleven stars every 71.5 s for as long as the card lies on the table, while the other answers settle. Its 9 s “length” is only bookkeeping.', source: 'Answers.swift:184-188' }),
    L.note({ w: 720, tags: ['open'], title: 'Reduce Motion freezes the reversed Star', body: 'The still sky is redrawn only when stirring, sinking or covering change, and the Star stops stirring 1.25 s in. After that it shows star 1 frozen at about 37% of a held star, and may jump on a later redraw. Found by reading the code, not observed.', source: 'Chamber.swift:423-426; Answers.swift:184-188' }),
  ],
})

L.add(sec, head, how, wheel, star)
L.fit(sec)
await L.arrange('Design system')
// The composed "before" checked against the app's Wheel render (they differ only by the wheel's turn at 5.5%).
const chk = await AA.before(1260)
await L.sleep(1500)
await save('pages/as-above/_before-1x.png', await chk.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } }))
chk.remove()
const snaps = await L.snapChapter(sec, 'pages/as-above', { scale: 0.3 })
return snaps
