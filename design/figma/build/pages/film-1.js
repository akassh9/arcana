// Chapter: Launch film & demo, step 1 of 3 (header and links, the brief and the verdicts, the film's storyboard). Clears the chapter.
//   node design/figma/bridge/run.mjs design/figma/build/pages/outside-lib.js design/figma/build/pages/film-1.js
const L = S.lib, O = S.out
const CH = 'Launch film & demo'
const sec = await L.chapter(CH)
const F = 'brand/film/'
const DEMO = 'https://akassh9.github.io/arcana/demo.mp4'
const TREE = `${L.REPO}/tree/${L.SHA}/film`

// ---- Header ------------------------------------------------------------------------------------------------
const linkRow = (label, value, url, note) => {
  const v = L.text(value, 'codeStrong', { w: 760, size: 13, lh: 20, color: url ? L.C.gold : L.C.ink })
  if (url) { L.link(v, url); v.textDecoration = 'UNDERLINE' }
  const r = L.row([L.text(label, 'smallStrong', { w: 200 }), L.col([v, note ? L.text(note, 'small', { w: 760 }) : null], { gap: 4 })], { gap: 24, pad: [12, 0], name: 'Link · ' + label, fillW: true })
  r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; r.strokeAlign = 'INSIDE'
  return r
}
const head = O.header(CH,
  'Two films were made for the launch, both on 28 September. The launch film is 21 seconds, drawn by hand in code, and is made for feeling. The demo is one real 57-second take of the app, for people who won’t install it.',
  ['The brief and the verdicts', 'Storyboard: the launch film', 'The riso palette', 'Choices and lessons', 'Storyboard: the demo'])
const links = L.col([
  L.text('Figma can’t hold video, so the films are linked here and shown as their frames.', 'body', { w: 1000 }),
  linkRow('The demo', DEMO, DEMO, 'docs/demo.mp4 at c7e12f4, served by GitHub Pages from main’s /docs. It is linked in the launch post: never move or rename it.'),
  linkRow('The launch film', 'Not online: the mp4 is not in the repo', null, 'Renders (film/out) are gitignored. The posted file is on Akash’s Mac (Downloads/arcana-launch-2.mp4). A copy is in the handoff kit: design/figma/assets/brand/film/arcana-launch-film.mp4.'),
  linkRow('The film’s source', 'github.com/akassh9/arcana · film/', TREE, 'arcana.html draws every frame; npm install && ./make.sh renders it again, frame for frame (the score differs by about −86 dB between runs).'),
  linkRow('The launch post', 'Not in the repo', null, 'Only in Akash’s own draft. It ends “Launch video attached and demo here:”. Ask Akash for it.'),
], { gap: 0, w: 1000, name: 'Links' })
L.add(head, links)
L.add(sec, head)

// ---- The brief and the verdicts ------------------------------------------------------------------------------
const bB = O.board(CH, 'The brief and the verdicts', { w: 2400, kicker: 'THE LAUNCH FILM',
  lead: 'Akash judged the launch film by feeling. A walkthrough of the app was turned down; what was kept is a film of fragments: twelve private questions, and one answer.',
  tags: [['akash'], ['lesson']] })
const quotes = L.col([
  L.text('The brief', 'h2'),
  O.quote('the point of the video is to evoke emotions not explain what the app is… people can figure it out. The purpose of the video is to get that click, time and attention.', { w: 760, size: 22, lh: 32, who: 'Akash, 28 Sep', tags: [['akash']] }),
  O.quote('Very good amazing in fact… Everything else is AMAZING', { w: 760, who: 'Akash, on the first cut of the drawn film', tags: [['akash']] }),
  L.note({ w: 760, tags: [['akash']], title: 'The idea, chosen by Akash', body: '“Everyone’s question”, square (1:1), from three pitches: Everyone’s question, One question and Omens.' }),
], { gap: 28, w: 760, name: 'Quotes' })
const Q = s => L.text('“' + s + '”', 'small', { family: 'Inter', style: 'Italic', w: 500, alpha: 0.9 })
const cuts = L.table([
  { key: 'c', label: 'Cut', w: 300, style: 'smallStrong' },
  { key: 'q', label: 'What Akash said', w: 500 },
  { key: 'd', label: 'What changed', w: 520 },
], [
  ['Draft: a real take of the app', Q('its a product demo rn instead of a launch video'), 'Dropped. Any walkthrough of the flow reads as a demo, even with no captions.'],
  ['Cut 1 of “Everyone’s question”, rendered from the app’s code (20 s)', 'No comment recorded. Later that day Akash asked again: ' + '“make a launch video for the app? Not a demo - a launch video”.', 'A new film, drawn by hand in code as a riso print (this chapter).'],
  ['Drawn, cut 1 (20.8 s)', Q('Very good amazing in fact… Everything else is AMAZING'), 'The ending only: Claude’s faint rings and the two dots under the name removed. The title’s light now passes once across ARCANA (cut 2, 21.3 s).'],
  ['Cut 2', Q('is the final card being slightly out of frame intended? the star?'), 'It wasn’t: the Star’s bottom edge reached 1,134 px of 1,080. The Star is now centred with even margins; riffle faces stay in frame (cut 3).'],
  ['Cut 3', 'Likes “a dither like effect” on most frames; the text’s “drop shadow” (the gold copy printed off register) had to go.', 'Version 2, the film as posted: the title card printed in the same four inks, each letter’s gold cooling to ink in place.'],
  ['Version 2', Q('save it to the codebase, commit and push'), 'film/ in 14b7fc6. Renders and node_modules are gitignored; the mp4 is not committed.'],
], { name: 'Cut by cut', gap: 24 })
L.add(bB, L.row([quotes, L.col([L.text('Cut by cut', 'h2'), cuts, O.src('Sources: the project notes (arcana-launch-video); film/arcana.html; commit 14b7fc6', { w: 1400 })], { gap: 16, name: 'Cuts' })], { gap: 72, align: 'MIN', name: 'The brief and the verdicts' }))
L.add(sec, bB)

// ---- Storyboard: the launch film -----------------------------------------------------------------------------
const TL = [[0.0, 1.5, 'window', 'riso'], [1.5, 1.0, 'pier', 'riso'], [2.5, 0.75, 'crossroads', 'riso'], [3.25, 0.75, 'door', 'riso'],
  [4.0, 2.67, 'montage', 'riso'], [6.67, 1.5, 'gather', 'paper'], [8.17, 0.08, 'flash', 'paper'], [8.25, 2.58, 'riffle', 'ink'],
  [10.83, 3.0, 'star', 'ink'], [13.83, 4.0, 'answer', 'riso'], [17.83, 3.5, 'sign-off', 'riso']]
const BEATS = {
  window: 'A city at first light, one window lit; it rings.', pier: 'The end of a pier, a lamp, someone facing the sea.', crossroads: 'A signpost at a fork in the road.',
  door: 'A doorway lit gold, someone on the step with a case.', montage: 'Bench, clock, boat, hill, bridge, lighthouse, field, ring: faster and faster.',
  gather: 'Every place into the wheel’s twelve houses; the wheel turns and all of it goes into the light.', flash: 'The cut.',
  riffle: 'The deck riffles past and slows; the back; the turn.', star: 'The Star writes itself in gold that cools to ink.',
  answer: 'The places again; stars come out in the day sky.', 'sign-off': 'ARCANA laid letter by letter; the title’s light passes.' }
const LOOK = { riso: ['#E0D7F7', 'Riso: four inks on pearl stock'], paper: ['#F3EDE0', 'Paper: the engraved wheel'], ink: ['#FFFFFF', 'Ink: the cards on cotton stock'] }
const FR = [
  [10, 'window', 'The window. A gold light at the centre rings like a struck bowl.'], [24, 'pier', 'The pier.'], [34, 'crossroads', 'The crossroads.'], [43, 'door', 'The door, someone with a case.'],
  [50, 'bench', 'Two on a bench under a lamp. The montage begins.'], [56, 'clock', 'A station clock, someone waiting.'], [62, 'boat', 'A rowing boat with a lamp.'], [66, 'hill', 'Someone on a hilltop.'],
  [69, 'bridge', 'A footbridge with a lamp.'], [72, 'lighthouse', 'A lighthouse, its beam.'], [75, 'field', 'A light held up in a field.'], [78, 'ring', 'An open ring box, the ring lit gold.'],
  [86, 'gather-wheel-of-houses', 'Every place in the wheel’s twelve houses.'], [95, 'gather-into-the-light', 'The wheel shrinks into the light.'], [98, 'flash', 'The cut: one near-white frame.'],
  [103, 'riffle-the-sun', 'The Majors flick past, one a frame (the Sun).'], [118, 'riffle-strength-slowing', 'Slowing on Strength (3 frames).'], [123, 'the-back', 'The back: embossed rose, one gold sun.'],
  [127, 'the-turn', 'The turn: the back on its edge.'], [138, 'star-writing', 'The Star writing itself: frame and gold first.'], [150, 'star-cooling', 'Its strokes cooling from gold to ink.'],
  [164, 'star-written', 'Written: XVII, THE STAR, “Water Under Starlight”.'], [172, 'answer-window-stars', 'The window again, stars in the day sky.'], [183, 'answer-pier-stars', 'The pier with stars.'],
  [192, 'answer-boat-stars', 'The boat with stars.'], [199, 'answer-hill-stars', 'The hill with stars.'], [211, 'answer-lighthouse-stars', 'The lighthouse, stars at their fullest.'],
  [222, 'signoff-laying', 'ARCANA laid in gold that cools to ink.'], [240, 'signoff-light-passing', 'The title’s light passes once.'], [255, 'signoff-end', 'The last frame. The sound fades.'],
]
const beatAt = t => { let b = TL[0]; for (const x of TL) if (t >= x[0] - 1e-6) b = x; return b }
const FW = 300, GAP = 24, PER = 10, W = PER * FW + (PER - 1) * GAP
const bS = O.board(CH, 'Storyboard: the launch film', { w: W + 144, kicker: 'THE LAUNCH FILM',
  lead: '“Everyone’s question, drawn”. Twenty-one seconds, square. Twelve people somewhere quiet at first light, each with a gold light that is their question. The lights gather into one, the deck is cut, the Star writes itself, and the day sky answers every one of them with stars.',
  leadW: 1400, tags: [['claude', 'Claude chose the content'], ['akash', 'Akash approved it'], ['shipped', 'Posted with the launch']] })
// the timeline, to scale
const PX = W / 21.333
const tl = L.frame({ name: 'Timeline · 21.33 s to scale', w: W, h: 118 })
for (const [s, d, name, look] of TL) {
  const x = Math.round(s * PX), w = Math.max(3, Math.round(d * PX) - 3)
  const r = figma.createRectangle(); r.name = 'Beat · ' + name; r.resize(w, 44); r.cornerRadius = 6; r.fills = [L.solid(LOOK[look][0])]; r.strokes = [L.solid(L.C.stroke)]; r.strokeWeight = 1
  tl.appendChild(r); r.x = x; r.y = 0
  if (d >= 0.5) { const t = L.text(name, 'label', { size: 11, lh: 14 }); tl.appendChild(t); t.x = x + 8; t.y = 8; const tt = L.text(s.toFixed(2) + ' s', 'code', { size: 10, lh: 12 }); tl.appendChild(tt); tt.x = x + 8; tt.y = 24 }
}
{ const fl = L.text('flash 8.17 s', 'code', { size: 10, lh: 12 }); tl.appendChild(fl); fl.x = Math.round(8.17 * PX) - 22; fl.y = 50 }
let lx = 0
for (const k of ['riso', 'paper', 'ink']) {
  const r = figma.createRectangle(); r.resize(18, 12); r.cornerRadius = 3; r.fills = [L.solid(LOOK[k][0])]; r.strokes = [L.solid(L.C.stroke)]; r.strokeWeight = 1
  tl.appendChild(r); r.x = lx; r.y = 92
  const t = L.text(LOOK[k][1], 'caption'); tl.appendChild(t); t.x = lx + 26; t.y = 89; lx += t.width + 70
}
{ const t = L.text('Drawn at 12 fps, packed to 24; 256 frames; 1080 × 1080. Frame n is at n ÷ 12 s.', 'caption'); tl.appendChild(t); t.x = W - t.width; t.y = 89 }
L.add(bS, tl)
// the frames
const cells = []
for (const [n, slug, cap] of FR) {
  const num = String(n).padStart(4, '0'), idx = String(cells.length + 1).padStart(2, '0')
  const im = await L.img(`${F}frames/film-${num}-${idx}-${slug}.png`, { w: FW, r: 8, stroke: L.C.stroke, name: `Frame ${num}` })
  const t = n / 12, beat = beatAt(t)
  cells.push(L.col([im,
    L.rich([[t.toFixed(2) + ' s', 'codeStrong', { size: 12, lh: 16 }], ['   frame ' + n + ' · ' + beat[2], 'code', { size: 11, lh: 16 }]], 'code', { w: FW }),
    L.text(cap, 'small', { w: FW }),
  ], { gap: 6, name: `Frame · ${t.toFixed(2)} s · ${slug}` }))
}
for (let i = 0; i < cells.length; i += PER) L.add(bS, L.row(cells.slice(i, i + PER), { gap: GAP, align: 'MIN', name: 'Frames ' + (i + 1) + '–' + Math.min(i + PER, cells.length) }))
const beatsList = L.table([{ key: 'a', label: 'From', w: 90, style: 'code' }, { key: 'b', label: 'Beat', w: 110, style: 'smallStrong' }, { key: 'c', label: 'Look', w: 80 }, { key: 'd', label: 'What happens', w: 640 }],
  TL.map(([s, d, n, look]) => [s.toFixed(2) + ' s', n, look, BEATS[n] + '  (' + d + ' s)']), { name: 'The beats', gap: 20 })
L.add(bS, L.row([beatsList, L.col([
  L.text('The picture and the sound share one timeline, so every cue lands on its cut. The sound is the app’s own (bowls, chimes, the drone, the swell, the riffle and the card stock of Sfx.swift), rebuilt for Web Audio.', 'body', { w: 900 }),
  O.src('film/arcana.html:922 (TIMELINE); scenes :750-857; sound :857-919; film/README.md', { w: 900 }),
  L.text('These are 30 picked frames. The film’s own contact sheet (every 6th frame) and the mp4 are in design/figma/assets/brand/film/.', 'caption', { w: 900 }),
], { gap: 12, name: 'About the timeline' })], { gap: 80, align: 'MIN', name: 'Beats and notes' }))
L.add(sec, bS)

sec.findAll(n => n.type === 'TEXT' && n.fontName !== figma.mixed && n.fontName.family === 'JetBrains Mono').forEach(O.linkAll)
L.fit(sec)
await L.arrange('Experience & notes')
return await O.snap(sec, 'launch-film-and-demo', 0.3)
