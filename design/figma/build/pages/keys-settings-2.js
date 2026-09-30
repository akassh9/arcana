// Experience & notes · Keys & Settings (2 of 3) — Settings in every state; the window chrome.
// Run with the kit: node design/figma/bridge/run.mjs design/figma/build/pages/experience-b-kit.js design/figma/build/pages/keys-settings-2.js
const L = S.lib, K = S.eb
const CH = 'Keys & Settings', PX = CH + ' · '
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Header', 'The keys page', 'The old key', 'The words and their history', 'Settings', 'Window chrome', 'The menus', 'System surfaces'].map(n => PX + n)
K.clearMine(sec, ORDER, ORDER.slice(4, 6))
const CW = 2656, ST = 'surfaces/settings/settings-window-', WN = 'surfaces/window/'

// ---------- settings --------------------------------------------------------------------------
const set = L.board({ name: PX + 'Settings', kicker: 'SETTINGS', title: 'Settings', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'Arcana ▸ Settings… (⌘,) opens one small window with one field: an OpenAI key, kept in the Keychain, that lets the thread be found. Once the field has rested for 0.7 s, Settings asks OpenAI whether the key works and says so in one line.',
  tags: [['akash', 'Akash: Settings as a window'], ['akash', 'Akash: check the key'], ['claude', 'Claude: the verdict lines'], 'shipped'] })
L.add(set, await K.annotated(ST + 'empty@2x.png', [
  { x: 202, y: 16, label: 'Its own title bar', body: '‘Arcana Settings’, white, a hairline (#E6E6E6) at its foot. Only close is lit: the window can’t be minimised or resized.', source: 'ArcanaApp.swift:25-29 · surfaces/geometry.json' },
  { x: 14, y: 68, label: 'OpenAI key', body: 'Didot 15, ink #26201C, 28 pt from the left, 24 pt from the top.', source: 'Settings.swift:27-29' },
  { x: 388, y: 68, label: 'The real system field', body: 'An AppKit secure field with a rounded border, 250 × 24 pt, 14 pt from the label, placeholder ‘sk-…’. Its type is the system font (SF Pro 13): the only type in Arcana’s own views that isn’t Didot.', tags: [['open', 'The only non-Didot type']], source: 'Settings.swift:30-32' },
  { x: 14, y: 99, label: 'The verdict', body: 'Didot Italic 13, 12 pt under the field. Quiet lines in ink 55 %, ‘ready’ in gold ink, refusals in oxblood.', source: 'Settings.swift:34-38, 58-69' },
  { x: 14, y: 119, label: 'Kept in your Keychain.', body: 'Always there, 3 pt under the verdict, ink 55 %.', source: 'Settings.swift:36' },
], { title: 'Arcana Settings', w: 1206, legendW: 620, caption: 'surfaces/settings/settings-window-empty · 402 × 151 pt, shown at 3×. Light appearance is forced, as everywhere in Arcana.' }))

const states = [
  ['empty', 'Empty', 'For find the thread.', 'No key kept: the field shows its placeholder.'],
  ['typing', 'Typing', 'For find the thread.', 'A key pasted or being typed. Nothing is asked until the field has not changed for 0.7 s.'],
  ['checking', 'Asking', 'Asking OpenAI…', 'After the 0.7 s pause, and whenever the window opens with a key: GET /v1/models/<model> is in flight.'],
  ['ready', 'Ready', 'The thread is ready.', 'OpenAI answered 200. Gold ink #8F6C21.'],
  ['refused', 'Refused', "This key won't open the thread.", '401, or 404 model_not_found. Oxblood #8C2E25. Remembered across launches as a digest of the key, and the thread is not offered.'],
  ['out-of-credit', 'Out of credit', 'This key is out of credit.', 'A thread request this launch got 429 insufficient_quota. Oxblood. Outranks every other verdict until the next launch, or a thread succeeds.'],
  ['unreachable', 'Unreachable', "OpenAI couldn't be reached.", 'The check failed with a network error. Ink 55 %.'],
]
const tw = 603
const cells = []
for (const [f, t, line, when] of states) {
  const w = await L.window(ST + f + '@2x.png', { name: 'Window · Settings · ' + t })
  w.rescale(tw / w.width)
  cells.push(L.col([w, L.text(t, 'smallStrong', { w: tw }), L.text(line, 'voiceSmall', { w: tw }), L.text(when, 'caption', { w: tw })], { gap: 8, name: 'State · ' + t }))
}
const real = await L.window(ST + 'real-swiftui-inactive@2x.png', { name: 'Window · Settings · the real scene' }); real.rescale(tw / real.width)
cells.push(L.col([real, L.text('The real scene (reference)', 'smallStrong', { w: tw }), L.text('SwiftUI’s own Settings window, drawn from its backing store in a probe that never reached the screen. Never key, so grey lights, grey title, no caret. It confirms the posed frames.', 'caption', { w: tw })], { gap: 8, name: 'State · the real scene' }))
L.add(set, L.section('Every state', { style: 'h2', lead: 'The first line is the only thing that changes. Verbatim, straight apostrophes as in the code.' }))
L.add(set, L.row(cells, { gap: 48, wrap: true, wrapGap: 56, w: CW, align: 'MIN', name: 'Settings states' }))
L.add(set, L.source('surfaces/settings/settings-window-*@2x · Settings.swift:12-83 (the view and its verdicts), 128-158 (refusals remembered, out of credit)', { w: CW }))
L.add(set, L.row([
  L.specs([
    ['Window', 'Titled ‘Arcana Settings’, 402 × 151 pt, not resizable (titled | closable | fullSizeContentView). Content pearl #F9F7F2, 402 × 119 pt, padded 28 pt at the sides and 24 pt top and bottom.', 'ArcanaApp.swift:25-29; Settings.swift:12-44'],
    ['Layout', 'Label and field in a row 14 pt apart; the two lines 12 pt below, 3 pt apart, 16 pt tall each.', 'Settings.swift:24-40'],
    ['The check', 'GET /v1/models/<model>, 0.7 s after the last edit and on opening with a kept key. Nothing is sent but the key.', 'Settings.swift:53, 64, 72-82'],
    ['Keychain item', 'Service local.arcana.reader, account ‘OpenAI API key’, label ‘Arcana — OpenAI key’.', 'Settings.swift:91-93'],
    ['Appearance', 'Light, forced (.preferredColorScheme(.light)).', 'Settings.swift:44'],
  ], { w: 1300, keyW: 140 }),
  L.col([
    L.note({ w: 1300, tags: ['akash'], title: 'Chosen from a preview', body: 'Akash picked a window (⌘,) from Claude’s options and chose its content from a preview with this text: ‘OpenAI key [sk-…] / For find the thread. / Kept in your Keychain.’ Claude drafted the words.' }),
    L.note({ w: 1300, tags: ['claude'], title: 'The verdicts are Claude’s', body: 'The six verdict lines and their colours (gold for ready, oxblood for refused and out of credit, quiet otherwise) were built by Claude. There is no record of Akash choosing them.' }),
    L.note({ w: 1300, tags: ['open'], title: 'The field is macOS’s', body: 'The secure field keeps the system font, border and focus ring. Restyling it in Didot is possible but was never tried. The window’s title is macOS’s own type too.' }),
  ], { gap: 20, name: 'Settings notes' }),
], { gap: 56, align: 'MIN', name: 'Settings specs' }))
sec.appendChild(set)

// ---------- window chrome ------------------------------------------------------------------------
const ch = L.board({ name: PX + 'Window chrome', kicker: 'THE WINDOW', title: 'Window chrome', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'The room is one window with a hidden, transparent title bar: the sky runs under the traffic lights and nothing else of macOS shows. Every window render in this file wears the Window/Title bar component (Design system ▸ Components).',
  tags: [['fixed', 'Whose: not recorded'], ['akash', 'Akash: light only']] })
const light = async (n, hex) => { const im = await L.img(WN + 'traffic-light-' + n + '@2x.png', { w: 112, name: 'Light · ' + n }); return L.col([im, L.text(n, 'smallStrong', { w: 140 }), L.text(hex, 'code', { w: 140 })], { gap: 6, name: 'Light · ' + n }) }
L.add(ch, L.row([
  await K.win(WN + 'window-default-1260x860@2x.png', 1400, 'The default window, 1260 × 860', 'The stage is 1260 × 828 under a 32 pt title bar. The room lays everything out in the stage.', { source: 'ArcanaApp.swift:6-15; RootView.swift:1647-1677 (WindowSetup)' }),
  L.col([
    L.row([
      await K.stage(WN + 'window-default-corner-lights-and-key@2x.png', 600, 'Default corner', 'The lights over the sky, the old key under them.', { shadow: false }),
      await K.stage(WN + 'window-minimum-corner-lights-and-key@2x.png', 600, 'Smallest window', 'The chrome is identical at every size.', { shadow: false }),
    ], { gap: 32, name: 'Corners' }),
    L.row([
      await light('close', 'centre #FF5C5F · rim #FF2025'),
      await light('minimize', 'centre #FAC800 · rim #F8B300'),
      await light('zoom', 'centre #34C759 · rim #00B21C'),
      L.col([L.text('Traffic lights', 'h3'), L.text('14 × 14 pt at x 9, 32 and 55, y 9, as AppKit draws them (colours sampled). All three are live in the room’s window; in Settings only close is.', 'small', { w: 640 }), L.source('surfaces/geometry.json · surfaces/window/traffic-light-*', { w: 640 })], { gap: 8, name: 'Lights text' }),
    ], { gap: 28, align: 'MIN', name: 'Lights' }),
    L.specs([
      ['Style', 'titled | closable | miniaturizable | resizable | fullSizeContentView (styleMask 32783), title bar transparent, title hidden (the window is called ‘Arcana’ in the Window menu).', 'ArcanaApp.swift:6-15; RootView.swift:1647-1677'],
      ['Sizes', 'Default 1260 × 860, smallest 940 × 660. Corner radius 16 pt (macOS 26).', 'RootView.swift:1647-1677'],
      ['One window', 'File ▸ New Window is removed, so there is only ever one room.', 'ArcanaApp.swift:17'],
      ['Appearance', 'Light, forced everywhere.', 'ArcanaApp.swift:11'],
    ], { w: 1232, keyW: 120 }),
  ], { gap: 36, name: 'Chrome details' }),
], { gap: 24, align: 'MIN', name: 'Chrome' }))
L.add(ch, L.row([
  await K.stage(WN + 'window-titlebar-overlay-1260@2x.png', 1260, 'The title bar overlay, active', 'The frame’s own drawing across a 1260 × 32 pt title bar, on transparency: lay it over any render.', { shadow: false, r: 4 }),
  await K.stage('shots-window/titlebar-inactive-1260.png', 1260, 'Inactive', 'The same strip as AppKit draws it for a window that isn’t key: grey lights over the sky.', { shadow: false, r: 4 }),
], { gap: 136, align: 'MIN', name: 'Title bar strips' }))
sec.appendChild(ch)

await K.finish(sec, ORDER)
return await K.snap([set, ch], 'keys-settings', PX)
