// Experience & notes · Keys & Settings (3 of 3) — the menus; the system surfaces nobody captured.
// Run with the kit: node design/figma/bridge/run.mjs design/figma/build/pages/experience-b-kit.js design/figma/build/pages/keys-settings-3.js
const L = S.lib, K = S.eb
const CH = 'Keys & Settings', PX = CH + ' · '
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Header', 'The keys page', 'The old key', 'The words and their history', 'Settings', 'Window chrome', 'The menus', 'System surfaces'].map(n => PX + n)
K.clearMine(sec, ORDER, ORDER.slice(6, 8))
const CW = 2656
const SHADOW = [{ type: 'DROP_SHADOW', color: { r: 0.15, g: 0.12, b: 0.08, a: 0.14 }, offset: { x: 0, y: 10 }, radius: 28, spread: 0, visible: true, blendMode: 'NORMAL' }]
const GOLD = '#8F6C21'

// ---------- the menus ---------------------------------------------------------------------------
const menus = await L.json('surfaces/menus.json')
const APP = { 'Settings…': 'Added: the Settings scene', 'The Keys': 'Replaces ‘Arcana Help ⌘?’' }
const MW = 400
const menuCard = (m, note) => {
  const card = L.col([], { name: 'Menu · ' + m.title, gap: 0, pad: [6, 0], w: MW, r: 10, fill: '#FFFFFF', fillA: 0.95, stroke: '#000000', strokeA: 0.08 })
  card.effects = SHADOW
  if (!m.items.length) L.add(card, L.row([L.text('(empty as built; macOS fills it at run time)', 'caption', { w: MW - 28 })], { pad: [8, 14], name: 'Empty' }))
  for (const it of m.items) {
    if (it.hidden) continue
    if (it.separator) { L.add(card, L.col([L.rule(MW - 20, { color: '#000000', alpha: 0.1 })], { pad: [4, 10], name: 'Separator' })); continue }
    const app = APP[it.title]
    const sub = it.items ? '  ▸' : ''
    const r = L.row([
      L.text(it.title + sub, 'body', { family: 'Inter', style: app ? 'Semi Bold' : 'Regular', size: 14, lh: 20, w: MW - 110, color: app ? GOLD : L.C.ink, alpha: app ? 1 : 0.86 }),
      L.text(it.shortcut || '', 'body', { family: 'Inter', style: 'Regular', size: 14, lh: 20, w: 68, align: 'RIGHT', alpha: 0.5 }),
    ], { gap: 14, pad: [3, 14], name: 'Item · ' + it.title, w: MW, fill: app ? '#F3EAD0' : undefined })
    L.add(card, r)
  }
  return L.col([L.text(m.title, 'h3'), card, note ? L.text(note, 'caption', { w: MW }) : null], { gap: 10, name: 'Menu block · ' + m.title })
}
const byTitle = t => menus.menu_bar.find(m => m.title === t)
const sub = t => (byTitle('Edit').items.find(i => i.title === t) || {}).items || []
const subList = t => sub(t).filter(i => !i.separator).map(i => i.title).join(', ')
const menuRow = L.row([
  menuCard(byTitle('Arcana'), 'The app menu. ‘Settings… ⌘,’ appears because the app declares a Settings scene. Services ▸ is filled by macOS.'),
  L.col([L.text('File', 'h3'), K.missing(MW, 150, 'No File menu', 'New Window ⌘N is removed, and with its only item gone SwiftUI left the whole menu out, Close ⌘W included (checked with no window open). The red light still closes the window.', { kicker: 'Removed' }), L.source('ArcanaApp.swift:17', { w: MW })], { gap: 10, name: 'Menu block · File' }),
  menuCard(byTitle('Edit'), 'SwiftUI’s defaults: the route for pasting into the question. Writing Tools ▸ (' + subList('Writing Tools') + ') needs Apple Intelligence. AutoFill ▸ (' + subList('AutoFill') + ').'),
  menuCard(byTitle('View'), 'While the room’s window is open macOS adds Enter Full Screen and the tab-bar items. Not captured.'),
  menuCard(byTitle('Window'), 'macOS adds its tiling items (Fill, Center, Move & Resize ▸, Full Screen Tile ▸), the tab items and the window list (‘Arcana’, and ‘Arcana Settings’ while open). Not captured.'),
  menuCard(byTitle('Help'), 'macOS puts its Search field at the top. The Keys is the only item: it opens the keys page, or closes it if open.'),
], { gap: 48, align: 'MIN', name: 'Menus' })
const bar = L.row(['', 'Arcana', 'Edit', 'View', 'Window', 'Help'].map((t, i) => i === 0 ? L.text('', 'body', { size: 13 }) : L.text(t, 'body', { family: 'Inter', style: t === 'Arcana' ? 'Bold' : 'Regular', size: 13, lh: 18, alpha: 0.86 })), { gap: 22, pad: [7, 20], r: 8, fill: '#FFFFFF', fillA: 0.7, stroke: '#000000', strokeA: 0.06, name: 'Menu bar', align: 'CENTER' })
const mb = L.board({ name: PX + 'The menus', kicker: 'THE WINDOW', title: 'The menus', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'The menu bar is SwiftUI’s, with three changes: no File ▸ New Window, Settings… added to the app menu, and Help replaced by The Keys. Drawn here from a dump of the shipped app’s menu (v1.3), not a screenshot; items macOS adds only while a window is open are noted, not drawn.',
  tags: [['claude', 'Claude: The Keys ⌘/ in Help'], ['fixed', 'Whose: not recorded (one window)']] })
L.add(mb, bar)
L.add(mb, menuRow)
L.add(mb, L.row([
  L.specs([
    ['Changed by the app', 'Removed: File ▸ New Window ⌘N. Added: Arcana ▸ Settings… ⌘,. Replaced: Help ▸ Arcana Help ⌘? with Help ▸ The Keys ⌘/. Gold above.', 'ArcanaApp.swift:16-29'],
    ['Not in any menu', 'The room’s own keys: ← → space ↑ ⌘⌫ esc ? m. They are on the keys page.', 'RootView.swift:161-288'],
    ['How it was read', 'The app’s scene and command declarations, run as a background-only probe with no window; NSApp.mainMenu dumped after launch. macOS 26.6.1 (25G76).', 'surfaces/menus.json · render/surfaces/menu-probe/main.swift'],
  ], { w: 1300, keyW: 170 }),
  L.note({ w: 1300, tags: ['open'], title: 'Close ⌘W with the window open', body: 'The probe had no window, so nobody has checked whether SwiftUI adds File ▸ Close while the room is open. Worth a look before designing any window behaviour.' }),
], { gap: 56, align: 'MIN', name: 'Menu specs' }))
sec.appendChild(mb)

// ---------- system surfaces -------------------------------------------------------------------------
const ss = L.board({ name: PX + 'System surfaces', kicker: 'THE WINDOW', title: 'System surfaces nobody captured', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'Three panels macOS draws, which every new reader meets and which were never captured (showing them would have put windows on screen). They are drawn here as outlines holding their words. Gold words are the app’s own; grey italics are macOS’s wording, approximate and version-dependent.',
  tags: [['open', 'Not captured'], 'shipped'] })
const PW = 840
const panel = (title, kids, o = {}) => {
  const p = L.col(kids, { name: 'Panel · ' + title, gap: 14, pad: [28, 32], w: PW, r: 16, fill: '#FFFFFF', fillA: 0.6, stroke: '#8A4B12', strokeA: 0.4, align: o.center ? 'CENTER' : 'MIN' })
  p.dashPattern = [7, 6]
  return p
}
const appWords = (s, o = {}) => L.text(s, 'body', Object.assign({ family: 'Inter', style: 'Semi Bold', size: 15, lh: 22, color: GOLD, alpha: 1, w: PW - 64 }, o))
const osWords = (s, o = {}) => L.text(s, 'body', Object.assign({ family: 'Inter', style: 'Italic', size: 14, lh: 21, alpha: 0.62, w: PW - 64 }, o))
const btns = labels => L.row(labels.map(b => L.frame({ name: 'Button · ' + b, dir: 'h', pad: [5, 14], r: 6, fill: '#FFFFFF', stroke: '#000000', strokeA: 0.14, kids: [L.text(b, 'body', { family: 'Inter', style: 'Italic', size: 13, lh: 18, alpha: 0.62 })] })), { gap: 10, name: 'Buttons' })
const icon = await L.img('brand/icon/app-icon-128.png', { w: 96, name: 'App icon (as shipped)' })
const colOf = (title, pnl, specs, notes) => L.col([L.text(title, 'h2', { w: PW }), pnl, specs, ...(notes || [])], { gap: 18, name: 'Surface · ' + title })
L.add(ss, L.row([
  colOf('About Arcana', panel('About', [
    L.text('NOT CAPTURED · macOS’S STANDARD PANEL', 'kicker', { color: '#8A4B12' }),
    icon, appWords('Arcana', { align: 'CENTER', size: 17 }), appWords('Version 1.3 (4)', { align: 'CENTER', style: 'Regular', size: 13 }),
    osWords('(no copyright line)', { align: 'CENTER' }),
  ], { center: true }), L.specs([
    ['Opened by', 'Arcana ▸ About Arcana (orderFrontStandardAboutPanel:).', 'surfaces/system-surfaces.json'],
    ['Icon', 'AppIcon.icns, made by sips from Assets/arcana-logo.png: the raster logo with no squircle tile.', 'build.sh:40-43'],
    ['Version', 'CFBundleShortVersionString 1.3, CFBundleVersion 4; macOS formats the line.', 'Info.plist'],
    ['Copyright', 'None: no NSHumanReadableCopyright, no Credits file.', 'Info.plist'],
  ], { w: PW, keyW: 110 }), [L.note({ w: PW, tags: ['open'], title: 'An icon without a tile', body: 'Next to other apps’ icons in the About panel, the Dock and Finder, the bare logo reads differently from a squircle. See Brand & icon.' })]),
  colOf('The Keychain prompt', panel('Keychain', [
    L.text('NOT CAPTURED · macOS’S WORDING, APPROXIMATE', 'kicker', { color: '#8A4B12' }),
    L.rich([['Arcana wants to use your confidential information stored in “', 'body', { family: 'Inter', style: 'Italic', size: 14, lh: 21, alpha: 0.62 }], ['Arcana — OpenAI key', 'body', { family: 'Inter', style: 'Semi Bold', size: 14, lh: 21, color: GOLD }], ['” in your keychain. To allow this, enter the “login” keychain password.', 'body', { family: 'Inter', style: 'Italic', size: 14, lh: 21, alpha: 0.62 }]], 'body', { w: PW - 64 }),
    btns(['Always Allow', 'Deny', 'Allow']),
  ]), L.specs([
    ['When', 'After each update of the downloaded (ad hoc signed) app, the first time it reads the saved OpenAI key.', 'Settings.swift:85-120'],
    ['The item', 'Service local.arcana.reader, account ‘OpenAI API key’, label ‘Arcana — OpenAI key’.', 'Settings.swift:91-93'],
    ['Meanwhile', 'The read is off the main thread, so the room keeps moving while macOS asks.', 'Settings.swift:95'],
    ['The reader', 'Types their login password, then chooses Always Allow.', 'surfaces/system-surfaces.json'],
  ], { w: PW, keyW: 110 }), [L.note({ w: PW, tags: ['open'], title: 'Once per update', body: 'An ad hoc signature changes with every build, so the Keychain asks again after each release. Only a stable signing identity would stop it.' })]),
  colOf('Gatekeeper: Open Anyway', panel('Gatekeeper', [
    L.text('NOT CAPTURED · macOS 15 AND LATER, APPROXIMATE', 'kicker', { color: '#8A4B12' }),
    L.text('1 · The first try', 'smallStrong'), osWords('“Arcana” Not Opened'), osWords('Apple could not verify “Arcana” is free of malware that may harm your Mac or compromise your privacy.'), btns(['Done', 'Move to Trash']),
    L.rule(PW - 64, { color: '#000000', alpha: 0.08 }),
    L.text('2 · System Settings ▸ Privacy & Security', 'smallStrong'), osWords('“Arcana” was blocked to protect your Mac.'), btns(['Open Anyway']),
    L.rule(PW - 64, { color: '#000000', alpha: 0.08 }),
    L.text('3 · Confirm', 'smallStrong'), osWords('Open “Arcana”?'), btns(['Open Anyway']), osWords('then Touch ID or the password'),
  ]), L.col([
    L.text('The release notes’ own words (v1.3)', 'h3'),
    appWords('The first time: Arcana isn’t notarized by Apple, so macOS won’t open it at first. Try once, then go to System Settings ▸ Privacy & Security, scroll down, and click Open Anyway. After that it opens like any other app.', { style: 'Regular', size: 14, lh: 21, w: PW }),
    appWords('To install: download Arcana.zip, open it, and drag Arcana into Applications.', { style: 'Regular', size: 14, lh: 21, w: PW }),
    appWords('For Macs with Apple silicon, on macOS 14 or later.', { style: 'Regular', size: 14, lh: 21, w: PW }),
    L.source('gh release view v1.3 --repo akassh9/arcana · README.md:108-110', { w: PW }),
  ], { gap: 10, name: 'Release notes' })),
], { gap: 68, align: 'MIN', name: 'System surfaces' }))
sec.appendChild(ss)

await K.finish(sec, ORDER)
return await K.snap([mb, ss], 'keys-settings', PX)
