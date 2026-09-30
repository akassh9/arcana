// Chapter: Brand & icon, step 1 of 2 (header, the mark, the red matte, the app icon). Clears the chapter.
//   node design/figma/bridge/run.mjs design/figma/build/pages/outside-lib.js design/figma/build/pages/brand-1.js
const L = S.lib, O = S.out
const CH = 'Brand & icon'
const sec = await L.chapter(CH)
const B = 'brand/'

// ---- Header ------------------------------------------------------------------------------------------------
const head = O.header(CH,
  'Arcana has one mark: a raster painting of a compass over an eclipse, drawn before the room turned light. It is also the app icon. Inside the app the brand is the word ARCANA, set in Didot with a passing light.',
  ['The mark', 'The red matte', 'The app icon', 'The fallback icon', 'Two dark marks', 'The wordmark', 'The README image'],
  [
    L.note({ w: 336, tags: ['shipped'], title: 'What ships', body: 'The mark as the app icon, one 512 px image. The wordmark ARCANA in the room. The README picture on GitHub.' }),
    L.note({ w: 336, tags: ['open'], title: 'What is open', body: 'The mark wants a clean re-matte or a vector redraw, a macOS tile and small sizes. The two marks are dark, and the app is light.' }),
    L.note({ w: 336, tags: [['open', 'Origin not recorded']], title: 'Whose it is', body: 'The logo PNG predates the repo (21 Sep). Who made or chose it is not recorded, so treat it as open to change.' }),
    L.note({ w: 336, tags: ['fixed'], title: 'No vectors of the mark', body: 'The logo is a painting (pixels only). The fallback icon and the wordmark exist as true vector paths, both on this page.' }),
  ])
L.add(sec, head)

// ---- The mark ------------------------------------------------------------------------------------------------
const bM = O.board(CH, 'The mark', { w: 2400, kicker: 'THE MARK',
  lead: 'A cream crescent eclipsed by a near-black disc, inside a broken gold orbit, with four gold compass spikes and two small planets. It is the darkest thing in the brand.',
  tags: [['shipped'], ['open', 'Origin not recorded']] })
const logoPearl = await O.fig(B + 'logo/arcana-logo-on-pearl.png', { w: 700, scale: 1, frame: true, r: 16, title: 'On pearl #F9F7F2', caption: 'The app’s ground colour (Palette.pearl). This is how it reads in a light Finder and Dock. The mark ships on transparency, with no tile.' })
const logoDark = await O.fig(B + 'logo/arcana-logo-on-dark.png', { w: 700, scale: 1, frame: true, r: 16, title: 'On a dark ground #1E1E1E', caption: 'The black disc all but merges with a dark Dock, leaving the crescent and gold floating. #1E1E1E is a stand-in, not measured from macOS.' })
const sw = []
for (const [name, v, hex, usage] of [
  ['Eclipse disc', 'brand/logo-disc', '#171617', 'Near-black, the darkest colour in the brand.'],
  ['Crescent', 'brand/logo-crescent', '#F7ECD5', 'Cream with a paper grain.'],
  ['Gold', 'brand/logo-gold', '#C9954B', 'Mid of a textured gold that runs #BA8C4A to #D8B162.'],
  ['Jewels', 'brand/logo-oxblood', '#3C0D0B', 'On the N and S spikes. Much darker than the cards’ oxblood #8C2E25.'],
]) sw.push(await O.swatch({ name, varName: v, hex, usage, w: 360, h: 88 }))
const markSpecs = L.col([
  L.text('What it is', 'h3'),
  L.specs([
    ['File', 'Assets/arcana-logo.png: 1254 × 1254 px, RGB with alpha, no colour profile (read as sRGB). 73% of its pixels are clear.', 'Assets/arcana-logo.png; README.md:156'],
    ['Drawing', 'Crescent and disc with a thin gold rim; a broken gold orbit ring; four tapered spikes (N and S long, with oxblood jewels in gold bezels; E and W shorter, with gold ball ends); two gold planets with three-dot trails at 10 and 4 o’clock.'],
    ['Used as', 'The macOS app icon (Dock, Finder, Launchpad, the About panel). It appears nowhere inside the room.', 'build.sh:40-43'],
    ['Origin', 'Made before the repo, on 21 Sep, in the app’s dark first days. Who made or chose it is not recorded.'],
  ], { w: 760, keyW: 110 }),
  L.text('Colours, sampled from the PNG', 'h3'),
  L.frame({ name: 'Swatches', dir: 'h', gap: 24, wrap: true, wrapGap: 24, w: 760, kids: sw }),
  L.text('Sampled from pixels, so approximate. They are in the file as the brand/… colour variables.', 'caption', { w: 760 }),
], { gap: 16, w: 760, name: 'The mark · specs' })
L.add(bM, L.row([logoPearl, logoDark, markSpecs], { gap: 48, align: 'MIN', name: 'The mark' }))
L.add(sec, bM)

// ---- The red matte -------------------------------------------------------------------------------------------
const bF = O.board(CH, 'The red matte', { w: 2400, kicker: 'THE MARK',
  lead: 'Composited properly, the mark looks clean. But the soft edge pixels hold pure red. Any tool that drops, thresholds or boosts the alpha, or bleeds the edge, shows it as a red halo.',
  tags: [['open', 'Open: needs a re-matte']] })
const zoom = await O.fig(B + 'logo/arcana-logo-fringe-zoom.png', { w: 1100, scale: 4, frame: true, r: 12, title: 'The upper-left planet at 4×, no smoothing',
  caption: '1 On pearl, as composited: clean.  2 On #1E1E1E, as composited: clean.  3 Alpha ignored: the red matte.  4 Reveal: every partly clear pixel at full strength. The captions are baked into the render.' })
const ign = await O.fig(B + 'logo/arcana-logo-alpha-ignored.png', { w: 520, scale: 1, frame: true, r: 12, title: 'Alpha ignored', caption: 'The stored colour with alpha dropped, on the black that clear pixels hold. The red halo rings the orbit, spikes and planets.' })
const rev = await O.fig(B + 'logo/arcana-logo-fringe-reveal.png', { w: 520, scale: 1, frame: true, r: 12, title: 'Fringe reveal', caption: 'Partly clear pixels at full strength; opaque pixels dimmed to 35% over grey; empty pixels grey.' })
const matte = L.swatch({ name: 'The matte (not a token)', hex: '#E9110F', value: '≈ #E9110F', usage: 'What the edge pixels un-premultiply to.', w: 240, h: 72 })
const fSpecs = L.specs([
  ['Pixels', '9,903 partly clear pixels along every edge (bounding box 94,27 to 1152,1226).'],
  ['Their alpha', 'Tiny: 75% of them are 1/255, and none is above 16/255.'],
  ['Composited', 'The fringe adds about 1/255 of red, so it is invisible on light and dark grounds alike.'],
  ['Why it matters', 'Icon tools, glows, edge bleeds and alpha thresholds surface it. The mark will be reused in all of those.'],
  ['Fix', 'Re-matte the edge onto its own gold and cream (or clear black), or redraw the mark as vectors.'],
], { w: 780, keyW: 140 })
L.add(bF, L.row([
  zoom,
  L.col([L.row([ign, rev], { gap: 24, align: 'MIN', name: 'Diagnostics' }), L.row([matte, fSpecs], { gap: 24, align: 'MIN', name: 'Numbers' }),
    O.src('Measured from Assets/arcana-logo.png (inventory probe, 2026-09-30)', { w: 1064 })], { gap: 32, name: 'Diagnostics and numbers' }),
], { gap: 56, align: 'MIN', name: 'The red matte' }))
L.add(sec, bF)

// ---- The app icon --------------------------------------------------------------------------------------------
const bI = O.board(CH, 'The app icon', { w: 2400, kicker: 'THE ICON',
  lead: 'The icon is the logo scaled to one 512 px image. There is no tile, no other size and no dark variant, so macOS resamples that one picture wherever it draws the icon.',
  tags: [['shipped', 'Shipped in 1.3'], ['open', 'Open: no tile, one size']] })
const SIZES = [[16, 'Lists and menus at 1×'], [32, 'Lists and menus at 2×'], [64, 'Finder icons at 1×'], [128, 'Dock at 64 pt, 2×'], [256, 'Finder at 2×, Get Info'], [512, 'As stored']]
const strip = async (ground, label, textColor) => {
  const items = []
  for (const [s, use] of SIZES) {
    const im = await L.img(B + `icon/app-icon-${s}.png`, { scale: 1, name: `Icon ${s} px` })
    const cw = Math.max(s, 116)
    const holder = L.frame({ name: 'Holder', dir: 'v', w: cw, h: 512, justify: 'MAX', align: 'CENTER', kids: [im] })
    items.push(L.col([holder,
      L.text(s + ' px', 'codeStrong', { w: cw, align: 'CENTER', color: textColor, alpha: 0.9 }),
      L.text(use, 'caption', { w: cw, align: 'CENTER', color: textColor, alpha: 0.7 })], { gap: 6, name: `Size · ${s}`, align: 'CENTER' }))
  }
  const f = L.frame({ name: 'Strip · ' + label, dir: 'v', gap: 20, pad: [28, 36, 28, 36], fill: ground, r: 16, kids: [
    L.text(label, 'label', { color: textColor, alpha: 0.75 }),
    L.row(items, { gap: 30, align: 'MAX', name: 'Sizes' })] })
  return f
}
const light = await strip('#ECECEC', 'On a light ground #ECECEC, at 1:1', L.C.ink)
const dark = await strip('#1E1E1E', 'On a dark ground #1E1E1E, at 1:1', '#F3EDE0')
const iSpecs = L.col([
  L.text('How it is made', 'h3'),
  L.specs([
    ['Build', 'sips -z 512 512 Assets/arcana-logo.png, then sips -s format icns → AppIcon.icns.', 'build.sh:40-43'],
    ['What the icns holds', 'One representation, icon_512x512.png. iconutil lists nothing else.'],
    ['Missing', 'The 16, 32, 128 and 256 px sizes; 512 @2x (1024 px); hand-tuned small sizes; the macOS rounded-square tile, its shadow; light, dark and tinted variants.'],
    ['Small sizes', 'Below 64 px the fine orbit, jewels and trails break up. On dark the black disc vanishes into the ground and the mark reads as a thin crescent.'],
    ['Large sizes', 'There is no 1024 px image, so at 512 pt on a Retina screen macOS upsamples the 512 and it goes soft.'],
  ], { w: 700, keyW: 150 }),
  O.callout({ w: 700, tags: [['open', 'Not checked']], title: 'How macOS shows it', body: 'macOS 26 may put an icon that isn’t a full rounded square into a system tile. Nobody has looked: there is no capture of the Dock, Finder or the About panel, only these resamples (macOS’s own resampler may differ slightly).' }),
], { gap: 16, w: 700, name: 'The app icon · specs' })
L.add(bI, L.row([L.col([light, dark], { gap: 24, name: 'Strips' }), iSpecs], { gap: 48, align: 'MIN', name: 'The app icon' }))
L.add(sec, bI)

sec.findAll(n => n.type === 'TEXT' && n.fontName !== figma.mixed && n.fontName.family === 'JetBrains Mono').forEach(O.linkAll)
L.fit(sec)
await L.arrange('Experience & notes')
const ts = (await figma.getLocalTextStylesAsync()).find(s => s.name === 'Display/Title')
return { snaps: await O.snap(sec, 'brand-and-icon', 0.3), titleLS: ts && ts.letterSpacing, gold: await O.varHex('gold/metal'), goldLit: await O.varHex('gold/light'), ink: await O.varHex('card/ink'), paper: await O.varHex('card/paper') }
