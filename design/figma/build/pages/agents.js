// Chapter: Agents & releases (header, the agent Worker and its readings, the releases, install and notes). Clears the chapter.
//   node design/figma/bridge/run.mjs design/figma/build/pages/outside-lib.js design/figma/build/pages/agents.js
const L = S.lib, O = S.out
const CH = 'Agents & releases'
const sec = await L.chapter(CH)
const A = 'brand/agent/'
const REL = 'https://github.com/akassh9/arcana/releases'
const commit = h => `${L.REPO}/commit/${h}`
const linked = (str, url, preset = 'codeStrong', o = {}) => { const t = L.text(str, preset, Object.assign({ size: 12, lh: 18, color: L.C.gold }, o)); L.link(t, url); t.textDecoration = 'UNDERLINE'; return t }
// **bold** markdown into one rich text node
const md = (s, o = {}) => {
  const runs = s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(x => (x.startsWith('**') ? [x.slice(2, -2), 'bodyStrong'] : x))
  return L.rich(runs, 'body', Object.assign({ alpha: 0.9 }, o))
}

// ---- Header ------------------------------------------------------------------------------------------------
const head = O.header(CH,
  'Two surfaces sit outside the app, and neither has a visual design. One is a plain-text reading that people’s AI agents fetch. The other is the GitHub release that people download.',
  ['The agent Worker', 'Three live readings', 'The releases, 1.0 to 1.3', 'Install', 'The release notes'],
  [
    L.note({ w: 440, tags: [['akash']], title: 'The app is for people', body: 'The web is plain text for agents only. Akash cut the page for people that Claude had built. Don’t add surfaces nobody asked for.' }),
    L.note({ w: 440, tags: [['fixed', 'Not notarized']], title: 'Opened once by hand', body: 'The app is ad hoc signed, not notarized by Apple. The first time, people allow it in System Settings (Open Anyway).' }),
    L.note({ w: 440, tags: [['fixed', 'Never rename']], title: 'Addresses in the post', body: 'arcana.khanikad.workers.dev, agent/worker.js and releases/latest are in the published launch post. Keep them where they are.' }),
  ])
L.add(sec, head)

// ---- The agent Worker ---------------------------------------------------------------------------------------
const bA = O.board(CH, 'The agent Worker', { w: 2400, kicker: 'FOR YOUR AGENT',
  lead: 'A Cloudflare Worker answers every fetch with a fresh reading as plain UTF-8 text, in the deck’s own words, for an agent to fold into a morning brief. There is no page, no styling, no key, and nothing is stored.',
  tags: [['akash', 'Akash: agents only'], ['shipped']] })
const line = 'Add a daily tarot reading to my morning brief. Use https://arcana.khanikad.workers.dev/today, and read the cards in light of what you know about me and my day.'
const lineBox = O.mono(line, { w: 900, size: 15, lh: 24, name: 'The line people paste', fill: '#FFFFFF' })
const left = L.col([
  O.quote('why do we need the for people on cloudflare? The for people is the app.. let’s reign in the implementation a little - only have the agents part.', { w: 900, size: 20, lh: 30, who: 'Akash, 27 Sep, cutting the page for people that Claude had built', tags: [['akash']] }),
  L.col([L.text('The one line people paste', 'h2'), lineBox,
    L.text('The asking lives in this line, not in the reading: a reading that told the agent what to do would look like prompt injection. Akash agreed to that ending after Claude flagged it.', 'small', { w: 900 }),
    L.chips([['akash', 'Akash chose the wording'], ['claude', 'Claude flagged the risk']]),
    O.src('README.md:124-139 (“For your agent”); commits 5bba8c3, 594c79e', { w: 900 })], { gap: 12, name: 'The line' }),
  L.col([L.text('What it answers', 'h3'), L.table([
    { key: 'u', label: 'GET', w: 330, style: 'code' }, { key: 'a', label: 'Answers', w: 500 },
  ], [
    ['/today', 'Three Fates: What Was · What Is · What Tends'],
    ['/today?spread=one', 'One Card: The Answer'],
    ['/today?spread=road', 'The Long Road: Situation · Crossing · Root · Counsel · Outcome'],
    ['/', 'The same as /today'],
    ['anything else', '404, “Not found.”'],
  ], { name: 'Endpoints', gap: 24 })], { gap: 8, name: 'Endpoints' }),

], { gap: 40, w: 900, name: 'The Worker' })
const reading = async (file, get, title) => {
  const t = (await text(A + file)).replace(/\s+$/, '')
  const url = 'https://arcana.khanikad.workers.dev' + get
  return L.col([
    L.text(title, 'h3', { w: 420 }),
    linked('GET ' + get, url),
    O.mono(t, { w: 420, size: 14, lh: 22, name: title }),
  ], { gap: 8, name: 'Reading · ' + title })
}
const right = L.col([
  L.text('Three live readings', 'h2'),
  L.text('What an agent gets, verbatim. Fetched 30 Sep 2026 at 10:28 UTC. Every fetch is a new shuffle, so these are one moment, not fixed copy. It has no design: show it, if at all, as plain text in a system or monospace face.', 'body', { w: 1308 }),
  L.row([await reading('reading-three.txt', '/today', 'Three Fates'), await reading('reading-one.txt', '/today?spread=one', 'One Card'), await reading('reading-road.txt', '/today?spread=road', 'The Long Road')], { gap: 24, align: 'MIN', name: 'Readings' }),
  O.src('agent/worker.js:1-55; agent/wrangler.toml', { w: 1308 }),
  L.spacer(1, 24),
  L.col([L.text('How it works', 'h3'), L.specs([
    ['Shuffle', 'On the server, so the cards are really random and the agent only reads them: all 78, each card turned with p = 0.42 as the app turns them, the spread taken from the top.', 'agent/worker.js:15-16, 41'],
    ['Words', 'agent/deck.json, written out of Deck.swift by Tools/deck, so the reading says exactly what the cards say in the app.', 'Tools/deck/main.swift; agent/deploy.sh'],
    ['Format', 'Line 1: Arcana · {spread} · drawn just now. Then per card: {position} · {card}[, reversed], and its line on the next line. Blocks split by one blank line; a middle dot with a space either side.', 'agent/worker.js:50-54'],
    ['Headers', 'content-type text/plain; charset=utf-8 · cache-control no-store (no cache hands back yesterday’s cards) · access-control-allow-origin *'],
    ['Reversals', 'The 42% rate is inherited from the first version; whose choice it was is not recorded.'],
  ], { w: 1308, keyW: 110 })], { gap: 8, name: 'How it works' }),
], { gap: 16, w: 1308, name: 'Three live readings' })
L.add(bA, L.row([left, right], { gap: 48, align: 'MIN', name: 'The agent Worker' }))
L.add(sec, bA)

// ---- The releases ----------------------------------------------------------------------------------------------
const bR = O.board(CH, 'The releases', { w: 2400, kicker: 'RELEASES',
  lead: 'Four releases in under three hours on the morning of 28 September (UTC), each one small. Every release is a single Arcana.zip, ad hoc signed and not notarized, for Apple silicon Macs on macOS 14 or later.',
  tags: [['shipped', 'Latest: 1.3']] })
const RELS = [
  ['1.0', '1', 'v1.0', '594c79e', '05:10', 'The first download: the room as of 27 Sep, with the full deck, the moon’s door and the keys page.', null, 'A downloaded app had no way to be given an OpenAI key, so it could not find the thread.'],
  ['1.1', '2', 'v1.1', '9b09f7f', '06:07', 'Settings (⌘,): a small window with one field for an OpenAI key, kept in the Keychain. From the next reading the thread is offered.', 'b42e592', 'The notes gained “New in 1.1: to find the thread, paste an OpenAI key into Arcana ▸ Settings… (⌘,).”'],
  ['1.2', '3', 'v1.2', 'd1edf24', '07:28', 'Settings asks OpenAI whether it will take the key, and the line under the field says what it said.', 'a31b6e6', 'The notes’ line became “To find the thread: … and Settings checks with OpenAI that the key works.”'],
  ['1.3', '4', 'v1.3', 'd5a73f8', '07:49', 'The keys page gains a seventh line, “⌘ , settings”, because Akash couldn’t find Settings.', 'a778f81', 'Notes as 1.2.'],
]
const cards = RELS.map(([v, b, tag, sha, time, what, change, notes]) => {
  const c = L.col([], { name: 'Release · ' + v, gap: 10, pad: 28, w: 537, fill: v === '1.3' ? '#FFFFFF' : '#FFFFFF', fillA: v === '1.3' ? 1 : 0.6, stroke: v === '1.3' ? L.C.gold : L.C.stroke, r: 16 })
  L.add(c, L.row([L.text('Arcana ' + v, 'h1'), v === '1.3' ? L.chip('shipped', 'Latest') : null], { gap: 14, align: 'CENTER', name: 'Title' }))
  L.add(c, L.row([linked(tag, `${REL}/tag/${tag}`), L.text('build ' + b, 'code', { size: 12, lh: 18 }), linked(sha, commit(sha)), L.text('28 Sep, ' + time + ' UTC', 'code', { size: 12, lh: 18 })], { gap: 14, name: 'Meta' }))
  L.add(c, L.text(what, 'body', { w: 481 }))
  if (change) L.add(c, L.row([L.text('The change', 'caption'), linked(change, commit(change), 'code', { size: 11, lh: 16 })], { gap: 8, name: 'Change' }))
  L.add(c, L.text(notes, 'small', { w: 481 }))
  if (v === '1.3') L.add(c, L.chips([['akash', 'Akash couldn’t find Settings']]))
  return c
})
L.add(bR, L.row(cards, { gap: 36, align: 'MIN', name: 'Four releases' }))
cards.forEach(c => { c.layoutAlign = 'STRETCH' })
L.add(bR, O.src('build.sh:30-32 (CFBundleShortVersionString, CFBundleVersion, LSMinimumSystemVersion 14.0); gh release view v1.0 … v1.3', { w: 2256 }))
// install, and the notes as published
const steps = [
  ['Download', '**To install:** download **Arcana.zip**, open it, and drag **Arcana** into Applications.'],
  ['The first time', '**The first time:** Arcana isn’t notarized by Apple, so macOS won’t open it at first. Try once, then go to **System Settings ▸ Privacy & Security**, scroll down, and click **Open Anyway**. After that it opens like any other app.'],
  ['The thread', '**To find the thread:** paste an OpenAI key into **Arcana ▸ Settings…** (⌘,). It’s kept in your Keychain, and Settings checks with OpenAI that the key works.'],
]
const num = n => L.frame({ name: 'Step ' + n, dir: 'h', w: 32, h: 32, r: 16, fill: L.C.gold, align: 'CENTER', justify: 'CENTER', kids: [L.text(String(n), 'label', { family: 'Inter', style: 'Bold', size: 14, lh: 16, color: '#FFFFFF', alpha: 1 })] })
const install = L.col([
  L.text('Install', 'h2'),
  L.text('For Macs with Apple silicon, on macOS 14 or later. The three steps, in the release notes’ own words:', 'body', { w: 1000 }),
  ...steps.map(([k, s], i) => L.row([num(i + 1), md(s, { w: 940 })], { gap: 20, align: 'MIN', name: 'Step · ' + k })),
  L.row([L.chip('claude'), L.text('The notes lead with the Open Anyway steps, and the post links the release page, not the zip.', 'small', { w: 860 })], { gap: 10, align: 'CENTER', name: 'Whose' }),
  O.callout({ w: 1000, tags: [['open', 'Not captured']], title: 'What people see, unseen here',
    body: 'Nobody has captured macOS refusing the app, the Open Anyway button, or the Keychain asking to let Arcana read the key again after an update (the 1.1 change warns that macOS may ask once). There are no frames of these; capture them on a clean Mac before redesigning the first run.' }),
], { gap: 20, w: 1000, name: 'Install' })
const rel = JSON.parse(await text('brand/release/release-v1.3.json'))
const paras = rel.body.trim().split(/\n\n+/)
const gh = L.col([
  L.row([L.text(rel.name, 'h2'), L.chip('shipped', 'Latest')], { gap: 14, align: 'CENTER', name: 'Title' }),
  L.row([linked('releases/latest', REL + '/latest'), L.text('v1.3 · published 28 Sep 2026, 07:49 UTC', 'code', { size: 12, lh: 18 })], { gap: 16, name: 'Meta' }),
  L.rule(null),
  ...paras.map(p => md(p, { w: 1076 })),
  L.rule(null),
  L.specs([
    ['Asset', 'Arcana.zip · 1,007,205 bytes (about 1 MB)'],
    ['sha256', 'a6f5b67e9d3305416a388a81c8a39ad0a3f66de1813f1a5d56a1d3919ce6cdac'],
    ['Signed', 'Ad hoc (codesign --sign -), not notarized', 'build.sh:65'],
  ], { w: 1076, keyW: 90, valueStyle: 'code' }),
], { gap: 16, pad: 40, w: 1156, fill: '#FFFFFF', fillA: 1, stroke: L.C.stroke, r: 16, name: 'Release notes · 1.3' })
L.add(bR, L.row([install, L.col([L.text('The release notes, as published', 'h2'), gh, L.text('GitHub renders the Markdown; there is no custom design. The first four paragraphs have been the same in every release since 1.0.', 'caption', { w: 1156 })], { gap: 16, name: 'Notes' })], { gap: 100, align: 'MIN', name: 'Install and notes' }))
L.add(sec, bR)

sec.findAll(n => n.type === 'TEXT' && n.fontName !== figma.mixed && n.fontName.family === 'JetBrains Mono' && !n.hyperlink).forEach(O.linkAll)
L.fit(sec)
await L.arrange('Experience & notes')
return await O.snap(sec, 'agents-and-releases', 0.3)
