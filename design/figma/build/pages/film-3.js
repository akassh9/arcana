// Chapter: Launch film & demo, step 3 of 3 (the demo's storyboard).
//   node design/figma/bridge/run.mjs design/figma/build/pages/outside-lib.js design/figma/build/pages/film-3.js
const L = S.lib, O = S.out
const CH = 'Launch film & demo'
const sec = await L.chapter(CH, { clear: false })
for (const n of [...sec.children]) if (/· Storyboard: the demo$/.test(n.name)) n.remove()
const D = 'brand/demo/stills/'
const DEMO = 'https://akassh9.github.io/arcana/demo.mp4'
const ST = [
  ['00.8', '01-room-title-light', 'The room at rest as it opens, the title’s light passing. The first frame makes a clean thumbnail.'],
  ['03.0', '02-spreads', 'Choosing between the three spreads.'],
  ['06.5', '03-question-writing', 'The question being written, the newest letters still wet gold.'],
  ['09.5', '04-question-written', 'The question in ink, in place of the invitation.'],
  ['12.0', '05-hold', 'The hold: a gold arc runs round the deck’s ring; the room quiets.'],
  ['13.3', '06-giving', 'The letters give their gold as dust into the deck.'],
  ['14.3', '07-cut', 'The ring complete: the cut.'],
  ['16.5', '08-ribbon-hand', 'The ribbon of 78, the hand sweeping it.'],
  ['20.0', '09-cards-drawn', 'The Six of Cups drawn into the first place.'],
  ['22.5', '10-three-cards-writing', 'The Six of Cups and the Star written; the Six of Swords arriving.'],
  ['27.5', '11-star-answers-in-the-sky', 'The Star answers: stars come out in the day sky.'],
  ['30.5', '12-verse', 'The verse, spoken line by line.'],
  ['33.8', '13-hover', 'A card risen under the pointer, its line in full ink.'],
  ['37.5', '14-altar', 'The Star on the altar.'],
  ['41.5', '15-return', 'The return: the ink sinks into the stock, last card first.'],
  ['43.5', '16-cards-go-home', 'The blank cards turn over and go home.'],
  ['45.5', '17-moons-door', 'The moon’s door: the kept reading as the return left it.'],
  ['47.5', '18-remembering', 'Remembering: a hold brings the ink back.'],
  ['49.5', '19-remembered', 'The kept reading remembered.'],
  ['56.5', '20-close', 'Back in the room, as it opened.'],
  ['57.4', '21-fade-to-pearl', 'The last moment: the fade toward pearl.'],
]
const FW = 480, GAP = 24, PER = 7, W = PER * FW + (PER - 1) * GAP
const bD = O.board(CH, 'Storyboard: the demo', { w: W + 144, kicker: 'THE DEMO',
  lead: 'One continuous 57-second take of the real app, with no cuts inside it: a whole Three Fates reading, from the room at rest to the moon’s door and back. Unlike the launch film, a walkthrough is exactly what was asked for.',
  leadW: 1400, tags: [['akash', 'Akash asked for it'], ['claude', 'Claude chose what it shows'], ['shipped', 'Linked in the post']] })
const url = L.text(DEMO, 'codeStrong', { size: 15, lh: 22, color: L.C.gold }); L.link(url, DEMO); url.textDecoration = 'UNDERLINE'
L.add(bD, L.row([
  L.col([
    O.quote('something that’s not too long but still walks through what the app looks like for people that won’t install it', { w: 900, size: 22, lh: 32, who: 'Akash, 28 Sep, asking for the demo', tags: [['akash']] }),
    L.col([L.text('Watch it', 'h3'), url, L.text('docs/demo.mp4, served by GitHub Pages from main’s /docs. GitHub’s file view doesn’t play video and raw links download, which is why it goes through Pages. Never move or rename it; anything added to docs/ is public.', 'small', { w: 900 })], { gap: 6, name: 'Link' }),
  ], { gap: 32, w: 900, name: 'Brief and link' }),
  L.specs([
    ['Format', '57.5 s, 1920 × 1200 (16:10) of a 1440 × 900 pt window, 60 fps. H.264 CRF 16 with AAC, −16 LUFS.'],
    ['The take', 'Recorded 28 Sep by an in-process harness: the app’s RootView in a borderless, click-through panel, driven directly; ScreenCaptureKit to ProRes, 0 frames dropped. Akash okayed it (“Record now”), since the window covers the screen.'],
    ['Posed', 'A fresh store and a separate Keychain service, so none of Akash’s readings or keys were touched. With no key, the thread is not offered.'],
    ['Left out', 'The keys page, cut from the end by Claude: it shows controls, not the experience.'],
    ['Could change', 'Claude’s notes: shorter (the spreads and remembering can go), no fade, 16:9. A re-take is cheap, but ask Akash before the window appears.'],
  ], { w: 1100, keyW: 130, name: 'The take' }),
], { gap: 96, align: 'MIN', name: 'About the demo' }))
const cells = []
for (const [t, slug, cap] of ST) {
  const im = await L.img(`${D}demo-${t}s-${slug}.png`, { w: FW, r: 8, stroke: L.C.stroke, name: `Still ${t} s` })
  cells.push(L.col([im, L.rich([[(+t).toFixed(1) + ' s', 'codeStrong', { size: 12, lh: 16 }], ['   ' + slug.replace(/^\d+-/, '').replace(/-/g, ' '), 'code', { size: 11, lh: 16 }]], 'code', { w: FW }), L.text(cap, 'small', { w: FW })], { gap: 6, name: `Still · ${t} s · ${slug}` }))
}
for (let i = 0; i < cells.length; i += PER) L.add(bD, L.row(cells.slice(i, i + PER), { gap: GAP, align: 'MIN', name: 'Stills ' + (i + 1) + '–' + Math.min(i + PER, cells.length) }))
L.add(bD, L.text('Frames of the video (1920 × 1200 px, 4/3 px to the point). The harness hosts the room in a borderless panel, so there is no title bar. The sample question is the shot tool’s: “Should I leave the city before winter”. The source for every still is docs/demo.mp4 at c7e12f4.', 'caption', { w: 1400 }))
L.add(sec, bD)

sec.findAll(n => n.type === 'TEXT' && n.fontName !== figma.mixed && n.fontName.family === 'JetBrains Mono').forEach(O.linkAll)
O.order(sec, CH, ['Header', 'The brief and the verdicts', 'Storyboard: the launch film', 'The riso palette', 'Choices and lessons', 'Storyboard: the demo'])
L.fit(sec)
await L.arrange('Experience & notes')
return await O.snap(sec, 'launch-film-and-demo', 0.3, [bD.name])
