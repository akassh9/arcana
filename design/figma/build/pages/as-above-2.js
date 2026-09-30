// Chapter: As Above (Design system), step 2 of 2: the Moon, the Sun, open questions.
//   node design/figma/bridge/run.mjs design/figma/build/pages/as-above-lib.js design/figma/build/pages/as-above-2.js
const L = S.lib
const sec = await L.chapter('As Above', { clear: false })
const MINE = ['As Above · The Moon', 'As Above · The Sun', 'As Above · Open questions']
for (const c of [...sec.children]) if (MINE.includes(c.name)) c.remove()
const { sm, COL } = AA
const TONIGHT = 0.791, SHOTS = 0.985   // illumination: 30 Sep 2026 21:00 Chicago (sky renders); 27 Sep 2026 (window renders)

// A light alone, over grey so white reads.
const alone = (path, name) => AA.full(path, 736, { back: AA.GREY, name })
// The halo, zoomed round the moon (2.5×), over grey, with the moon's face on top for context.
const haloZoom = async () => {
  const k = 2.5, W = 736, H = 502, f = AA.box('Halo round the moon, 2.5×', W, H, { back: AA.GREY })
  const cx = W / 2 - AA.MOON[0] * k, cy = H / 2 - AA.MOON[1] * k
  AA.put(f, await L.img('sky/answers/as-above-halo-1260x860.png', { w: 1260 * k, name: 'Render · halo' }), cx, cy)
  AA.put(f, await L.img('sky/moon/moon-composite-tonight@8x.png', { w: 192 * k, name: 'Moon (real render)' }), W / 2 - 96 * k, H / 2 - 96 * k)
  return f
}
// Illumination over one synodic month, with the phases and the two render dates.
const strength = async () => {
  const W = 1500, H = 360, X0 = 70, X1 = W - 40, Y0 = 30, Y1 = 230
  const f = L.frame({ name: 'Chart · illumination over a month', w: W, h: H, fill: '#FFFFFF', fillA: 0.6, r: 14, stroke: L.C.stroke })
  const X = a => X0 + (X1 - X0) * a, Y = v => Y1 - (Y1 - Y0) * v
  AA.vec(f, [[X0, Y1], [X1, Y1]], { color: L.C.ink, alpha: 0.35, sw: 1, name: 'Axis' })
  AA.vec(f, [[X0, Y0], [X1, Y0]], { color: L.C.ink, alpha: 0.18, sw: 1, dash: [3, 4], name: 'Full' })
  const pts = []; for (let a = 0; a <= 1.0001; a += 0.005) pts.push([X(a), Y((1 - Math.cos(2 * Math.PI * a)) / 2)])
  AA.vec(f, pts, { color: COL.b, sw: 2.5, name: 'Illumination = (1 − cos 2π·age) / 2' })
  const t = (s, x, y, o = {}) => { const n = L.text(s, o.p || 'code', Object.assign({ size: 11, lh: 14 }, o)); AA.put(f, n, x, y); return n }
  t('100%', 20, Y0 - 7); t('0', 38, Y1 - 7)
  for (const [a, v, s, dy] of [[0.5298, SHOTS, '27 Sep · 98.5% · the window renders', -34], [0.6512, TONIGHT, '30 Sep, 21:00 Chicago · 79% · the sky renders', -12]]) {
    const d = figma.createEllipse(); d.resize(10, 10); d.fills = [L.solid(L.C.blood)]; d.name = 'Marker · ' + s; AA.put(f, d, X(a) - 5, Y(v) - 5)
    t(s, X(a) + 12, Y(v) + dy, { color: L.C.blood, alpha: 0.9 })
  }
  const PH = await L.json('sky/moon/moon-phases.json')
  for (const p of PH.phases) { const im = await L.img(p.file, { w: 34, name: 'Phase ' + p.age }); const bg = AA.box('Phase tile', 40, 40, { back: '#DDD8F2', r: 20 }); AA.put(bg, im, 3, 3); AA.put(f, bg, X(p.age) - 20, Y1 + 18) }
  for (const [a, s] of [[0, 'new'], [0.25, 'first quarter'], [0.5, 'full'], [0.75, 'last quarter'], [1, 'new']]) t(s, X(a) - s.length * 3.3, Y1 + 70, { alpha: 0.6 })
  t('age of the moon, 0 → 1 = 29.53 days', X0, H - 26, { p: 'caption', family: 'Inter', style: 'Regular', size: 11 })
  return f
}

// ---- The Moon ------------------------------------------------------------------------------
const moon = await AA.card({
  title: 'The Moon', numeral: 'XVIII', tags: ['claude', 'shipped'],
  lead: 'A vast, soft lilac light spreads from the moon over the whole room, only as strong as tonight’s real moon is lit. Reversed, the lilac clears.',
  verses: ['Too dim to read. Go slowly.', 'The fog thins. It was ordinary.'], verseSrc: 'Deck.swift:135-137',
  say: ['A lilac half-light washes the room, with a pale halo close about the moon that keeps its seas readable.', 'The lilac haze high on the right clears to a plain pale blue: the fog lifting reads as ordinary daylight.'],
  after: ['sky/answers/as-above-sky-moon-1260x860.png', 'sky/answers/as-above-sky-moon-reversed-1260x860.png'],
  afterCap: ['At tonight’s strength: 79% lit (30 September, 21:00 Chicago).', 'The lilac cleared, at the same strength.'],
  windowLead: 'The real window. Rendered on 27 September, when the moon was 98.5% lit, so the Moon’s answer here is stronger than in tonight’s sky renders above.',
  windows: [['shots-window/42-one-moon.png', 'Upright · One Card: The Moon', 'Answered; the singular closing prompt, HOLD · RETURN THE CARD.'], ['shots-window/36-moon-reversed.png', 'Reversed', 'The lilac clears off the sky to a plain pale blue.']],
  aloneLead: 'Each light alone, as the app renders it, over grey so the white parts read.',
  alone: [
    AA.fig(await alone('sky/answers/as-above-moonlight-1260x860.png', 'Moonlight alone'), 'Moonlight', 'Lilac from the moon over the whole room.', 'Answers.swift:219-225'),
    AA.fig(await haloZoom(), 'Halo, 2.5×', 'Lilac over the disc, a ring of pale white just outside the limb, half-light out to 130 pt. The moon’s face is drawn on top, as in the sky.', 'Answers.swift:226-237'),
    AA.fig(await alone('sky/answers/as-above-clearing-1260x860.png', 'Clearing alone'), 'Clearing · reversed', 'A clear pale blue laid exactly over the lilac field’s own circle.', 'Answers.swift:210-218'),
  ],
  timeLead: 'Both rise over 9 s from 2.1 s after landing, to a peak set by the real moon: 0.79 tonight, 1 at the full moon, almost 0 at the new moon.',
  lanes: [
    { label: 'Upright', sub: 'moonlight and halo', top: '100%', curves: [{ f: t => sm((t - 2.1) / 9), color: COL.b, sw: 1.2, dash: [4, 4], name: 'At the full moon' }, { f: t => TONIGHT * sm((t - 2.1) / 9), color: COL.b, name: 'Tonight, 79%' }], legend: [[COL.b, 'tonight, 79% lit (solid) · at the full moon (dashed)']] },
    { label: 'Reversed', sub: 'the clearing', top: '100%', curves: [{ f: t => sm((t - 2.1) / 9), color: COL.c, sw: 1.2, dash: [4, 4], name: 'At the full moon' }, { f: t => TONIGHT * sm((t - 2.1) / 9), color: COL.c, name: 'Tonight, 79%' }] },
  ],
  T: 16,
  extra: { title: 'Its strength follows the real moon', lead: 'Every Moon light’s opacity is tonight’s illumination, (1 − cos 2π·age) / 2. The same card answers strongly at the full moon and hardly at all at the new moon. The renders in this file come from two nights.', node: L.row([await strength(), L.col([
    L.note({ w: 640, tags: ['claude'], title: 'Scaled by the real moon', body: 'Claude’s proposal, approved with As Above: the Moon’s answer is as strong as the moon is lit tonight, so it is never the same twice in a month.', source: 'Answers.swift:121-124' }),
    L.note({ w: 640, tags: ['open'], title: 'No way to pose a phase', body: 'The lights read tonight’s moon directly, so exports can only show the night they were made: 98.5% for the window renders (27 September), 79% for the sky renders (30 September).', source: 'Answers.swift:172, 464' }),
  ], { gap: 16 })], { gap: 64, align: 'MIN' }) },
  rows: [
    ['Layers', 'moonlight and halo: radial Core Animation gradients', 'clearing', 'Answers.swift:210-237'],
    ['Moonlight', 'lilac #E0D7F7 90% @0 → 50% @0.42 → 0 @1; centred on the moon (1083.6, 131.36); r 1.25 × max(W, H) = 1575 pt', '—', 'Answers.swift:219-225'],
    ['Halo', 'r 130 pt, fixed: lilac 55% out to 0.1255 (the limb × 1.02), white 50% @0.2655, lilac 28% @0.5628, 0 @1; sits under the moon’s face', '—', 'Answers.swift:226-237'],
    ['Clearing', '—', 'clear pale blue #D8E2F5 78% @0 → 36% @0.5 → 0; the lilac field’s circle, (0.86, 0.14) of the sky, r 0.44 span = 554.4 pt', 'Answers.swift:210-218'],
    ['Strength', 'opacity 0 → tonight’s illumination', 'the same', 'Answers.swift:122-124; Moon.swift:33'],
    ['Timing', 'from 2.1 s after landing; 9 s, smoothstep; Reduce Motion 1.2 s', 'the same', 'Answers.swift:463-469'],
  ],
  notes: [
    L.note({ w: 720, tags: ['open'], title: 'The reversed Moon at the new moon', body: 'The clearing is scaled by the illumination too, but the lilac it clears is always in the sky. At the new moon the reversed Moon does almost nothing. A design question.', source: 'Answers.swift:124' }),
    L.note({ w: 720, tags: ['open'], title: 'A halo that doesn’t scale', body: 'The halo is a fixed 130 pt while every other light scales with the window (0.44 to 1.25 × span), so in small windows it is proportionally larger.', source: 'Answers.swift:229' }),
    L.note({ w: 720, tags: ['akash'], title: 'Clearing lightens', body: 'The reversed answer never darkens: the fog lifting is a paler blue laid over the lilac. Akash’s light-only rule.', source: 'Answers.swift:210-218' }),
  ],
})

// ---- The Sun -------------------------------------------------------------------------------
const sun = await AA.card({
  title: 'The Sun', numeral: 'XIX', tags: ['claude', 'shipped'],
  lead: 'First light rises into morning and the dawn’s rays reach further up the sky. Reversed, the light comes up white and the colour drains out.',
  verses: ['It works. You may enjoy it.', 'Brightness you are performing.'], verseSrc: 'Deck.swift:139-141',
  say: ['A large warm apricot glow from just below the table fills the lower two thirds of the room; the nine rays are drawn again, 1.4× longer.', 'A flat white veil at 42% bleaches the sky’s blue, lilac, rose and dawn toward pearl. The wheel, the moon and the near sky stay crisp above it.'],
  after: ['sky/answers/as-above-sky-sun-1260x860.png', 'sky/answers/as-above-sky-sun-reversed-1260x860.png'],
  afterCap: ['Morning and the longer rays, at their peak.', 'The white glare and the longer rays.'],
  windows: [['shots-window/37-sun.png', 'Upright · The Magician, The Sun, The World', 'First light rises into morning; the rays reach further.'], ['shots-window/38-sun-reversed.png', 'Reversed', 'The light comes up white and the colour drains out.']],
  aloneLead: 'Each light alone, as the app renders it, over grey so the white reads. The long rays come with both.',
  alone: [
    AA.fig(await alone('sky/answers/as-above-morning-1260x860.png', 'Morning alone'), 'Morning', 'Dawn from just below the foot of the window, 1.2 × span.', 'Answers.swift:238-244'),
    AA.fig(await alone('sky/answers/as-above-rays-1260x860.png', 'Long rays alone'), 'Long rays · both ways', 'The same nine shafts, 1.4× longer and a touch brighter at the root.', 'Answers.swift:250-292'),
    AA.fig(await alone('sky/answers/as-above-glare-1260x860.png', 'Glare alone'), 'Glare · reversed', 'Flat white over the whole sky, title bar included.', 'Answers.swift:410-412'),
  ],
  timeLead: 'Both rise over 9 s from 2.1 s after landing. Upright, the morning climbs to 100% and the long rays to 80%; reversed, the glare climbs to 42% with the same rays.',
  lanes: [
    { label: 'Upright', sub: 'morning and long rays', top: '100%', curves: [{ f: t => sm((t - 2.1) / 9), color: COL.a, name: 'Morning' }, { f: t => 0.8 * sm((t - 2.1) / 9), color: COL.c, dash: [6, 4], name: 'Long rays' }], legend: [[COL.a, 'morning → 100%'], [COL.c, 'long rays → 80% (dashed)']] },
    { label: 'Reversed', sub: 'glare and long rays', top: '100%', curves: [{ f: t => 0.42 * sm((t - 2.1) / 9), color: COL.d, name: 'Glare' }, { f: t => 0.8 * sm((t - 2.1) / 9), color: COL.c, dash: [6, 4], name: 'Long rays' }], legend: [[COL.d, 'glare → 42%'], [COL.c, 'long rays → 80% (dashed)']] },
  ],
  T: 16,
  rows: [
    ['Layers', 'morning and long rays', 'glare and long rays', 'Answers.swift:238-294, 410-412'],
    ['Morning', 'dawn #FFE0B0 90% @0 → 55% @0.38 → 0; centre (0.5, 1.04) of the sky = (630, 894.4); r 1.2 span = 1512 pt; peak 100%', '—', 'Answers.swift:238-244'],
    ['Long rays', 'the sky’s nine shafts (seed 1919), 1.4× longer, centre white × 1.1, 6.6% at half length; peak 80%. The morning all but hides the sky’s own rays beneath, so the light is never doubled', 'the same', 'Answers.swift:250-292'],
    ['Glare', '—', 'flat white #FFFFFF over the whole sky; peak 42%; under the wheel, the moon and the near sky', 'Answers.swift:410-412; Chamber.swift:294-295'],
    ['Timing', 'from 2.1 s after landing; 9 s, smoothstep; Reduce Motion 1.2 s', 'the same', 'Answers.swift:463-469'],
  ],
  notes: [
    L.note({ w: 720, tags: ['open'], title: 'The long rays are raster', body: 'In the app they are a 16-bit image drawn at half the sky’s points, so 4× upscaled per axis on Retina. Fine for soft light, but exports should redraw them as vector: the Sky/Backdrop ray wedges with the length × 1.4.', source: 'Answers.swift:253-264' }),
    L.note({ w: 720, tags: ['akash'], title: 'Glare whitens, never darkens', body: '“Brightness you are performing.” is shown as too much light, not as shadow: Akash’s light-only rule, applied by Claude.', source: 'Answers.swift:410-412' }),
    L.note({ w: 720, tags: ['fixed'], title: 'With the Moon', body: 'When the Sun and the Moon are both on the table, the lilac moonlight and the morning mix into a warm pink-lilac room (see the header).', source: 'Answers.swift:404-421' }),
  ],
})

// ---- Open questions ------------------------------------------------------------------------
const oq = L.board({ name: MINE[2], kicker: 'AS ABOVE · OPEN', title: 'Open questions', w: 1600,
  lead: 'Things a designer should decide or check. Those found by reading the code and not yet seen in the app say so.', tags: ['open'] })
const Q = [
  ['open', 'The Wheel lands on its own symmetry', '30° is the wheel’s own symmetry, so after the turn only the star of eight and the inner rays differ, at 5.5%. The quietest answer: the motion shows, the end state hardly does.', 'CardArt.swift:498-522; Chamber.swift:222'],
  ['open', 'Reduce Motion freezes the reversed Star', 'The still sky is redrawn only when something else changes; after 1.25 s it shows star 1 frozen at about 37% and may jump later. Found in the code, not observed.', 'Chamber.swift:423-426; Answers.swift:184-188'],
  ['open', 'The reversed Wheel under Reduce Motion', 'It shows nothing at all, so the card goes unanswered.', 'Answers.swift:533-535'],
  ['open', 'The reversed Star never rests', 'It cycles through the eleven stars every 71.5 s for as long as the card is down, while every other answer settles.', 'Answers.swift:184-188'],
  ['open', 'The reversed Moon at the new moon', 'The clearing is scaled by the illumination, but the lilac it clears is always there, so near the new moon it does almost nothing.', 'Answers.swift:124'],
  ['open', 'No way to pose a phase', 'The Moon’s lights read tonight’s moon directly; exports can only show the night they were made.', 'Answers.swift:172, 464'],
  ['open', 'A halo that doesn’t scale', 'The halo is a fixed 130 pt while the other lights scale with the window.', 'Answers.swift:229'],
  ['open', 'Raster long rays', 'The Sun’s rays are a half-resolution image; exports should use vector.', 'Answers.swift:253-264'],
  ['claude', 'Not replayed in kept readings', 'Remembering a kept reading through the moon’s door does not make the sky answer again. Claude’s choice; a possible follow-up.', null],
]
const qn = Q.map(([k, t, b, s]) => L.note({ w: 464, tags: [k], title: t, body: b, source: s }))
for (let i = 0; i < qn.length; i += 3) L.add(oq, L.row(qn.slice(i, i + 3), { gap: 32, align: 'MIN', name: 'Questions ' + (i + 1) + '–' + (i + 3) }))

L.add(sec, moon, sun, oq)
const want = ['As Above · Header', 'As Above · How an answer arrives', 'As Above · Wheel of Fortune', 'As Above · The Star', ...MINE]
const kids = [...sec.children].sort((a, b) => { const i = want.indexOf(a.name), j = want.indexOf(b.name); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) })
kids.forEach((k, i) => sec.insertChild(i, k))
L.fit(sec)
await L.arrange('Design system')
const out = []
for (const b of [moon, sun, oq]) out.push(await L.snap(b, 'pages/as-above/' + b.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: out.length ? 300 : 1500 }))
return out
