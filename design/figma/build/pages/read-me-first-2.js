// Start here · Read me first, step 2 of 3 — How to read this file (the map, the tags, what's real, the renders).
const L = S.lib
const CH = 'Read me first'
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Read me first · Welcome', 'Read me first · A reading in seven moments', 'Read me first · Status and links',
  'Read me first · How it was made', 'Read me first · How to read this file', 'Read me first · Glossary',
  "Read me first · Where we'd most like your eyes"]
const MINE = [ORDER[4]]
for (const c of [...sec.children]) if (MINE.includes(c.name)) c.remove()

const BW = 2400, IN = BW - 144

// Live counts, so the words match the file.
const nVars = (await figma.variables.getLocalVariablesAsync('COLOR')).length
const nText = (await figma.getLocalTextStylesAsync()).length
const nFx = (await figma.getLocalEffectStylesAsync()).length
const nPaint = (await figma.getLocalPaintStylesAsync()).length
const ds = figma.root.children.find(p => p.name === 'Design system')
await ds.loadAsync()
const comps = ds.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })
const allComps = []
for (const pg of figma.root.children) { await pg.loadAsync(); allComps.push(...pg.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })) }
const nSets = allComps.filter(c => c.type === 'COMPONENT_SET').length
const nCardSets = allComps.filter(c => c.type === 'COMPONENT_SET' && /^Card\//.test(c.name)).length
const nSingle = allComps.filter(c => c.type === 'COMPONENT' && c.parent.type !== 'COMPONENT_SET').length
const cardComps = comps.filter(c => /card|major|minor|arcana|pip|court|back/i.test(c.name) || /card/i.test((c.parent && c.parent.name) || ''))

const b = L.board({ name: ORDER[4], w: BW, kicker: 'Start here', title: 'How to read this file', titleStyle: 'h1', leadW: 1300,
  lead: 'Three pages, because Akash’s Figma is on the Starter plan, which allows three. Each page is a row of chapters (Figma sections) that run left to right in reading order; every chapter opens with a header board.' })

// ---- the map ----
const MAP = {
  'Start here': [
    ['Cover', 'The file’s title and thumbnail: the README’s reading, with the Star answered, in the live window.'],
    ['Read me first', 'What Arcana is, a reading in seven moments, status and links, how it was made, this map, the glossary, where to look.'],
    ['Principles & provenance', 'Who decided what, and how free you are to change it.'],
  ],
  'Design system': [
    ['Colour', 'The 60 colour variables: the sky, ink and its contrast, the three golds, card stock, the moon, rendered vs code.'],
    ['Type', 'Didot in 35 text styles: display, card and voice, the 14 Caps labels, parity with the app, the one system font.'],
    ['Ink, gold & materials', 'The seeded pen, gold leaf, gold cooling to ink, the card stock and its emboss, glow and shadow.'],
    ['Layout', 'The stage by proportion: the window, redlines at two sizes, slots, the ribbon, the altar, the keys page, large windows.'],
    ['Motion', 'Principles, curves, all 47 motion tokens, one reading start to finish, frame strips.'],
    ['Sound', 'Synthesised in code: the voices, the notes in Hz, the event map, sequences and loudness, known issues.'],
    ['Components', 'The title bar and the room’s parts as components: glyphs, keys, choosing and drawing, thread and light, suits, courts, the pen.'],
    ['Card anatomy & back', 'One face part by part, reversed and returned, the embossed back, a card’s life, the base components.'],
    ['Major Arcana', 'The 22 Majors as components: upright, reversed and returned, and what each leaves when returned.'],
    ['Minor Arcana', 'The 56 suit cards as components: suit emblems, the court scheme, then each suit of fourteen.'],
    ['The words', 'Every card’s words, verbatim: name, essence, both lines and keys; the spreads; the words in a reading.'],
    ['Sky & moon', 'The sky’s layer stack rebuilt, the near sky, the hold ring, the engraved wheel, the rays, the moon, frame rates.'],
    ['As Above', 'How the Wheel, the Star, the Moon and the Sun make the sky answer, without words or sound.'],
  ],
  'Experience & notes': [
    ['Flow & keys', 'A reading state by state, every key and pointer moment, the three spreads, what the room ignores.'],
    ['The room', 'The room at rest, the title and its light, the question written, the hold, the cut.'],
    ['The reading', 'The ribbon and the hand, taking a card, the thread, the verse, the altar, find the thread, the epigraph.'],
    ["The return & the moon's door", 'The closing hold, the moon’s door, kept readings, hold to remember, one moon ago, forgetting.'],
    ['Keys & Settings', 'The keys page and the old key, Settings, the window chrome, the menus, the system panels.'],
    ['Edge cases & accessibility', 'Small and large windows, Reduce Motion, contrast, VoiceOver, interaction states, language and input.'],
    ['Brand & icon', 'The mark and its red matte, the app icon and its fallback, the wordmark, the README image.'],
    ['Launch film & demo', 'The 21 s riso launch film and the 57 s demo: briefs, storyboards, the riso palette, lessons.'],
    ['Agents & releases', 'The plain-text agent reading, and the four releases from 1.0 to 1.3 and how to install.'],
    ['History & rejected directions', 'The design history day by day; what was tried and dropped.'],
    ['Open questions & issues', '93 open issues by area, with evidence and severity; the ten that matter most first.'],
    ['Engineering notes', 'What rendering costs, cheap and expensive changes, the codebase, how this file was made, build and release.'],
  ],
}
const colW = Math.floor((IN - 2 * 48) / 3)
const mapCols = Object.entries(MAP).map(([page, chs], pi) => {
  const c = L.col([], { name: 'Page · ' + page, gap: 0, w: colW, pad: [28, 28, 20, 28], fill: L.C.card, fillA: 0.7, stroke: L.C.stroke, r: 16 })
  L.add(c, L.text('Page ' + (pi + 1), 'kicker'), L.spacer(1, 6), L.text(page, 'h2'), L.spacer(1, 4),
    L.text(chs.length + ' chapters, left to right', 'small', { alpha: 0.55 }), L.spacer(1, 16))
  chs.forEach(([name, line], i) => {
    const r = L.row([L.text(String(i + 1).padStart(2, '0'), 'code', { size: 12, lh: 20, color: L.C.gold, alpha: 1, w: 26 }),
      L.col([name === 'Read me first' ? L.row([L.text(name, 'smallStrong'), L.chip('open', 'You are here')], { gap: 10, align: 'CENTER', name: 'Name' }) : L.text(name, 'smallStrong', { w: colW - 56 - 40 }), L.text(line, 'small', { w: colW - 56 - 40 })], { gap: 0 })], { gap: 14, pad: [10, 0], name: 'Chapter · ' + name, w: colW - 56 })
    r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = 1; r.strokeBottomWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeAlign = 'INSIDE'
    L.add(c, r)
  })
  if (pi === 0) {
    const grow = L.spacer(1, 1); grow.name = 'Grow'
    L.add(c, grow, L.note({ w: colW - 56, fill: '#F3EFE7', fillA: 1, title: 'Where to go next', body: 'Read this page first. Page 2 is the system you would build with: tokens, type, motion, sound, components, the deck and the sky. Page 3 is the experience screen by screen, the brand and launch, and the notes: history, open questions and engineering.' }))
  }
  return c
})
const mapRow = L.row(mapCols, { gap: 48, name: 'The map', align: 'MIN' })
const hMax = Math.max(...mapCols.map(c => c.height))
for (const c of mapCols) { c.layoutSizingVertical = 'FIXED'; c.resize(c.width, hMax) }
const grow = mapCols[0].findOne(n => n.name === 'Grow'); if (grow) grow.layoutGrow = 1
L.add(b, L.section('The map', { lead: 'You are on page 1, chapter 2. The chapters below are the exact section names; search Layers for one to jump to it.', leadW: 1100 }), mapRow)

// ---- the tags ----
const TAGS = [
  ['akash', 'Akash’s own stated preference or decision, often in their words.', 'The brief. Change it only with Akash.'],
  ['lesson', 'Something learned by getting it wrong with Akash.', 'Keep the lesson; its current form is open.'],
  ['panel', 'A 15-agent design panel’s choice on 24 September, approved by Akash as a package.', 'Open to argument. Akash approved the feature, not every spec detail.'],
  ['claude', 'Claude’s choice while building. Nobody argued with it.', 'Open. Overturn it freely with a better idea.'],
  ['open', 'Unresolved. Nobody has decided.', 'Yours to decide. Your view is most welcome here.'],
  ['rejected', 'Tried and dropped, usually by Akash.', 'Don’t bring it back without a new reason.'],
  ['shipped', 'In the released app, 1.3.', 'What people have now. A change ships in a new release.'],
  ['measured', 'A measured engineering fact (performance, rendering).', 'A constraint, not a taste. Re-measure if the code changes.'],
  ['fixed', 'How the code works today.', 'A constraint of the current build; code can change.'],
]
const tagTable = L.table([
  { label: 'Tag', w: 220 }, { label: 'What it means', w: 820 }, { label: 'How free you are', w: 900, style: 'smallStrong', alpha: 0.9 },
], TAGS.map(([k, what, free]) => [L.row([L.chip(k)], { w: 220, name: 'Tag cell' }), what, free]), { name: 'Provenance tags' })
L.add(b, L.section('Provenance tags', { lead: 'Every decision in this file carries one of these, so you know what you can overturn. Principles & provenance lists every decision by who made it.', leadW: 1100 }), tagTable)

// ---- what's real ----
const note = (title, body, w, kids) => L.note({ title, body, w, bodyStyle: 'body', kids })
const nw = Math.floor((IN - 2 * 24) / 3)
const real = L.row([
  note('The tokens are real', `The colours are ${nVars} variables in the Arcana colour collection, the type is ${nText} text styles (Display/…, Card/…, Voice/…, Caps/…), the glows and shadows are ${nFx} effect styles, and gold leaf, the card vignette and the halo are ${nPaint} gradient paint styles. Inspect a swatch or a specimen and you see the token, not a raw value.`, nw),
  note('The cards are components', `Every card face, blank and back on the Design system page is an editable component: ${nCardSets} card sets with a State of Upright, Reversed or Returned (see Card anatomy & back, Major Arcana and Minor Arcana). The window’s title bar is the Window/Title bar set (Active, Inactive), used on every screen in this file. In all: ${nSets} component sets and ${nSingle} single components (card art, the pen’s primitives, motifs, key signs), in the deck chapters and Components.`, nw),
  note('Every source is a link', 'Grey monospace refs are links to those lines on GitHub at commit c7e12f4. Bare Swift file names live in Sources/Arcana/. Where a value was measured from a render rather than read from code, the file says so.', nw,
    [L.row([L.source('RootView.swift:1035-1055', {}), L.text('← for example, ARCANA', 'caption')], { gap: 10, align: 'CENTER' })]),
], { gap: 24, name: 'What is real', align: 'MIN' })
const rH = Math.max(...real.children.map(c => c.height))
for (const c of real.children) { c.layoutSizingVertical = 'FIXED'; c.resize(c.width, rH) }
L.add(b, L.section('What is real in this file'), real)

// ---- renders ----
const CAV = [
  'Every picture of the app is a render at @2x, made on 30 September 2026 from the code at c7e12f4 by the repo’s shot tool (SwiftUI’s ImageRenderer). Nothing is mocked up.',
  'shots-window/ renders are laid out as the live window: the stage sits 32 pt down, under a transparent title bar. The traffic lights and the rounded corners are not in the PNG; the Window/Title bar component draws them.',
  'shots/ renders are the stage alone, with no title-bar inset, so everything sits 16–28 pt higher than in the app. They appear only where no window render exists, and are captioned so.',
  'The shuffle is seeded, so posed readings repeat the same cards. Three Fates is always The Emperor, Nine of Pentacles and The Hermit reversed.',
  'The moon, its phase and the kept dates follow the render day: 30 September 2026, WANING GIBBOUS. The Moon card’s answer depends on the real moon.',
  'FIND THE THREAD is shown as it appears with a usable OpenAI key. Without a key it never appears (see 73-reading-no-key).',
  'The light that crosses ARCANA every 12 s is held off the word, except in 86-title-light.',
  'Stills can’t move or sound. The dust, the breathing, the writing and the bowls are specified in Motion and Sound; the demo video shows them live. Card shadows in the renders match the real screen recording.',
]
const half = Math.ceil(CAV.length / 2)
const bw = Math.floor((IN - 48) / 2)
const cav = L.row([L.bullets(CAV.slice(0, half), { w: bw, gap: 12 }), L.bullets(CAV.slice(half), { w: bw, gap: 12 })], { gap: 48, name: 'Render caveats', align: 'MIN' })
L.add(b, L.section('Renders and their caveats', { lead: 'Trust the renders for layout, colour and type; check motion against the demo video and the window against a real Mac.', leadW: 1100 }), cav)
sec.appendChild(b)

for (const name of ORDER) { const n = sec.children.find(c => c.name === name); if (n) sec.appendChild(n) }
L.fit(sec)
await L.arrange('Start here')
const shot = await L.snap(b, 'pages/read-me-first/5.png', { scale: 0.3, wait: 300 })
return { shot, nVars, nText, nFx, nPaint, comps: comps.length, cardComps: cardComps.length, sample: comps.slice(0, 12).map(c => c.name) }
