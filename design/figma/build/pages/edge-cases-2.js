// Experience & notes · Edge cases & accessibility (2 of 3) — Reduce Motion; contrast.
// Run with the kit: node design/figma/bridge/run.mjs design/figma/build/pages/experience-b-kit.js design/figma/build/pages/edge-cases-2.js
const L = S.lib, K = S.eb
const CH = 'Edge cases & accessibility', PX = CH + ' · '
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Header', 'Small windows', 'Large windows', 'Reduce Motion', 'Contrast', 'VoiceOver', 'Interaction states', 'Language and input'].map(n => PX + n)
K.clearMine(sec, ORDER, ORDER.slice(3, 5))
const CW = 2656
const OPEN = '#8A4B12', BLOOD = '#8C2E25'

// ---------- reduce motion ---------------------------------------------------------------------------
const rm = L.board({ name: PX + 'Reduce Motion', kicker: 'ACCESSIBILITY', title: 'Reduce Motion', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: 'Arcana reads one accessibility setting, Reduce Motion (read at launch and on change). With it on, every hold is a quarter as long, things fade instead of moving, and the sky stands still. No render of any Reduce Motion state exists.',
  tags: [['claude', 'Claude: every Reduce Motion rule'], ['open', 'No render exists']] })
const rmRows = [
  ['Every hold (ask, return, remember)', '3.2 s to full; drains at 2×', '0.8 s to full; drains in 0.4 s', 'Game.swift:37, 201, 232'],
  ['The swell while asking', 'An open chord rising out of wind', 'Not played', 'Game.swift:202; Sfx.swift:283-295'],
  ['The written question, held', 'Given letter by letter as gold dust', 'Fades as a whole (charge 0.35 → 0.9); typed letters appear already dry', 'RootView.swift:830-837; Game.swift:70'],
  ['The invitation', 'Blurs as it goes', 'No blur, opacity only', 'RootView.swift:771, 784-787'],
  ['Each card', 'Writes itself in gold over 2.1 s', 'Appears finished', 'Game.swift:483-487'],
  ['The recital', 'Question after 1.8 s; lines 1.45 s apart', 'After 0.5 s; lines 0.15 s apart; done 0.55 s after the last card', 'Game.swift:501-535'],
  ['ARCANA’s light', 'Passes every 12 s', 'Paused', 'RootView.swift:1040-1053'],
  ['The thread', 'A light runs along it every 13 s', 'Drawn whole and still', 'RootView.swift:509-535'],
  ['The altar', 'Floats, breathes and tilts; words rise one by one', 'Still; words shown at once', 'RootView.swift:1420-1424'],
  ['The epigraph', 'Rises out of a blur (1.1 s)', 'Fades in over 0.6 s', 'RootView.swift:986-997'],
  ['As Above', 'After 2.1 s, over 9 s (reversed Wheel 14 s); the wheel turns', 'After 0.2 s, a 1.2 s fade; the turned wheel cross-fades in; the reversed Wheel shows nothing', 'Answers.swift:59-62, 473-540'],
  ['The near sky', 'Dust, blooms, glints, parallax, flashes and ripples at up to 120 Hz', 'A still picture at t = 0, breath 0.5; redrawn only when its inputs change', 'Chamber.swift:419-426, 444-482'],
  ['The hold ring', 'Its arc fills with the charge', 'Shown whole; cut at once when the door or keys open', 'Chamber.swift:462-466'],
  ['Kept pages', 'Drift 28 pt out of a blur; arrive pressed', 'Fade only; arrive already remembered; no haptic land, no drone on turns', 'Keeping.swift:260, 310-335, 455, 588-589'],
]
const rmT = L.table([{ label: 'What', w: 330 }, { label: 'Normally', w: 430 }, { label: 'With Reduce Motion', w: 520 }, { label: 'Source', w: 300 }],
  rmRows.map(r => [r[0], r[1], r[2], L.source(r[3], { w: 300 })]), { name: 'What changes', zebra: true })
const same = L.col([
  L.text('What doesn’t change', 'h3'),
  L.bullets([
    'The flip still turns (0.5 s); only the writing is skipped. Game.swift:472 isn’t gated.',
    'The moon’s 5 s breath of light and its hover halo. Opacity only, so arguably fine. Keeping.swift:1153-1169; Chamber.swift:366-367.',
    'Fades keep their lengths: the door, the keys page, the table clearing.',
    'Sound, apart from the swell and the drone on page turns.',
  ], { w: 900, style: 'small' }),
], { gap: 12, name: 'What stays' })
const freeze = (title, body, src) => L.note({ w: 900, tags: [['open', 'Suspected, not observed']], title, body, source: src })
L.add(rm, L.row([
  L.col([L.text('What changes', 'h3'), rmT], { gap: 12, name: 'Changes block' }),
  L.col([
    same,
    L.text('Suspected freezes', 'h3'),
    L.text('Found by reading the code; none has been seen on screen. Each needs a Reduce Motion render to confirm.', 'small', { w: 900 }),
    freeze('ARCANA’s gold band caught mid-word', 'When paused, the light’s schedule yields its start time once and the band is drawn from it. If the room appears inside the ~2.2 s the light is on the word, the band could stay painted across ARCANA.', 'RootView.swift:1041-1050, 1071-1075'),
    freeze('The charge arc may not fill', 'The Metal sky’s clock is paused and the still sky redraws only at press, release, the cut and rest. The arc would jump from empty to full.', 'Chamber.swift:419-426; SkyRenderer.swift:416-421'),
    freeze('Five glints frozen part-lit', 'At t = 0, glints 2, 5, 6, 7 and 10 (of 11, in seed order) sit half-lit and every mote sits at its first place: a fixed composition nobody chose.', 'Chamber.swift:444, 509-511'),
    freeze('The reversed Star stops mid-breath', 'Stirring ends 1.25 s after the answer begins, leaving star 0 at about 37 %. A later redraw can jump it to another star, or none.', 'Chamber.swift:423-426'),
  ], { gap: 16, name: 'Stays and freezes' }),
], { gap: 64, align: 'MIN', name: 'Reduce Motion' }))
L.add(rm, L.row([
  L.note({ w: 1300, tags: ['open'], title: 'The other settings are ignored', body: 'Only accessibilityReduceMotion is read. Increase Contrast, Reduce Transparency, Differentiate Without Colour and larger text change nothing, so the faint labels have no high-contrast variant.', source: 'RootView.swift:12' }),
  L.note({ w: 1300, tags: ['open'], title: 'How to render it', body: 'Reduce Motion can’t be posed in a still: the environment value is read-only. Turn it on in System Settings ▸ Accessibility ▸ Display, or force reduceMotion and game.quick in a scratch copy of the sources.' }),
], { gap: 56, align: 'MIN', name: 'Reduce Motion notes' }))
sec.appendChild(rm)

// ---------- contrast ---------------------------------------------------------------------------------
const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16) / 255)
const lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const lum = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
const comp = (fg, a, bg) => hex(fg).map((f, i) => a * f + (1 - a) * hex(bg)[i])
const ratio = (c, bg) => { const a = lum(c), b = lum(hex(bg)); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
const toHex = c => '#' + c.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
const TXT = '#26201C', GI = '#8F6C21', PEARL = '#F9F7F2', PAPER = '#F3EDE0', INK = '#15110E'
// [label, type, colour name, fg, alpha, bg, large (3:1 text), graphic (3:1), source]
const ROWS = [
  ['ARCANA', 'Didot Bold 62', 'text', TXT, 1, PEARL, true, false, 'RootView.swift:1035-1055'],
  ['Card name on the altar', 'Didot Bold 32', 'text', TXT, 1, PEARL, true, false, 'RootView.swift:1466-1471'],
  ['THE KEYS', 'Didot Bold 21', 'text', TXT, 1, PEARL, true, false, 'Legend.swift:109-114'],
  ['Verse, one card', 'Didot 27', 'text 92 %', TXT, 0.92, PEARL, true, false, 'RootView.swift:1199-1227'],
  ['Verse, three / five', 'Didot 22 / 19', 'text 92 %', TXT, 0.92, PEARL, false, false, 'RootView.swift:1199-1227'],
  ['Verse, dimmed (another card hovered)', 'Didot 22 / 19', 'text 30 %', TXT, 0.30, PEARL, false, false, 'RootView.swift:1223'],
  ['The altar’s line', 'Didot 25', 'text 92 %', TXT, 0.92, PEARL, true, false, 'RootView.swift:1494-1497'],
  ['The thread’s sentences', 'Didot 19', 'text 92 %', TXT, 0.92, PEARL, false, false, 'RootView.swift:1337-1342'],
  ['Card name on a face', 'Didot Bold 17', 'card ink on paper', INK, 1, PAPER, false, false, 'CardImages.swift:81-88'],
  ['Card essence on a face', 'Didot Italic 13', 'oxblood on paper', BLOOD, 1, PAPER, false, false, 'CardImages.swift:89-94'],
  ['‘OpenAI key’ (Settings)', 'Didot 15', 'text', TXT, 1, PEARL, false, false, 'Settings.swift:27-29'],
  ['Invitation and written question', 'Didot Italic 19', 'text 62 %', TXT, 0.62, PEARL, false, false, 'RootView.swift:830, 949'],
  ['The epigraph', 'Didot Italic 16', 'text 62 %', TXT, 0.62, PEARL, false, false, 'RootView.swift:1003-1016'],
  ['Keys page words', 'Didot Italic 17', 'text 82 %', TXT, 0.82, PEARL, false, false, 'Legend.swift:135-137'],
  ['Altar essence', 'Didot Italic 20', 'gold ink', GI, 1, PEARL, false, false, 'RootView.swift:1486-1488'],
  ['The thread’s question', 'Didot Italic 18', 'gold ink', GI, 1, PEARL, false, false, 'RootView.swift:1353-1359'],
  ['‘try again’', 'Didot Italic 13', 'gold ink', GI, 1, PEARL, false, false, 'RootView.swift:1324-1327'],
  ['Settings: quiet lines, ‘Kept in your Keychain.’', 'Didot Italic 13', 'text 55 %', TXT, 0.55, PEARL, false, false, 'Settings.swift:36, 58-69'],
  ['Settings: ‘The thread is ready.’', 'Didot Italic 13', 'gold ink', GI, 1, PEARL, false, false, 'Settings.swift:65'],
  ['Settings: refused, out of credit', 'Didot Italic 13', 'oxblood', BLOOD, 1, PEARL, false, false, 'Settings.swift:62, 66'],
  ['The question one moon on', 'Didot Italic 14', 'text 55 %', TXT, 0.55, PEARL, false, false, 'Keeping.swift:1063-1069'],
  ['Spread gloss, chosen', 'Didot Italic 12', 'gold ink', GI, 1, PEARL, false, false, 'RootView.swift:1114-1119'],
  ['Spread gloss, not chosen', 'Didot Italic 12', 'text 40 %', TXT, 0.40, PEARL, false, false, 'RootView.swift:1116'],
  ['Spread name, chosen', 'Caps 11 Bold', 'text', TXT, 1, PEARL, false, false, 'RootView.swift:1107-1112'],
  ['Spread name, not chosen', 'Caps 11', 'text 48 %', TXT, 0.48, PEARL, false, false, 'RootView.swift:1109'],
  ['Altar position label', 'Caps 10', 'gold ink', GI, 1, PEARL, false, false, 'RootView.swift:1462'],
  ['‘FIND THE THREAD’', 'Caps 10', 'gold ink', GI, 1, PEARL, false, false, 'RootView.swift:1296-1302'],
  ['‘DRAW THREE’ and the like', 'Caps 10', 'text 52 %', TXT, 0.52, PEARL, false, false, 'RootView.swift:1161-1172'],
  ['‘LETTING THE CARDS SETTLE’, ‘THE THREAD STAYED QUIET’', 'Caps 10', 'text 52 %', TXT, 0.52, PEARL, false, false, 'RootView.swift:1311-1321'],
  ['Altar keywords', 'Caps 10', 'text 50 %', TXT, 0.50, PEARL, false, false, 'RootView.swift:1500-1511'],
  ['Altar numeral', 'Caps 10', 'text 42 %', TXT, 0.42, PEARL, false, false, 'RootView.swift:1475'],
  ['‘· REVERSED’ on the altar', 'Caps 10', 'oxblood', BLOOD, 1, PEARL, false, false, 'RootView.swift:1480'],
  ['‘PRESS AND HOLD’', 'Caps 9', 'gold ink 75 %', GI, 0.75, PEARL, false, false, 'RootView.swift:448-450'],
  ['‘HOLD · RETURN THE CARDS’, ‘HOLD · REMEMBER’', 'Caps 9', 'gold ink 60 %', GI, 0.60, PEARL, false, false, 'RootView.swift:1179-1181; Keeping.swift:897'],
  ['Position names, empty place', 'Caps 9', 'text 32 %', TXT, 0.32, PEARL, false, false, 'RootView.swift:674-680'],
  ['Position names, face up', 'Caps 9', 'gold ink 80 %', GI, 0.80, PEARL, false, false, 'RootView.swift:674-680'],
  ['Position names, read or hovered', 'Caps 9', 'gold ink', GI, 1, PEARL, false, false, 'RootView.swift:674-680'],
  ['‘TYPE’ (keys page)', 'Caps 9', 'text 66 %', TXT, 0.66, PEARL, false, false, 'Legend.swift:125-126'],
  ['‘SPACE’, ‘ESC’ in their keycaps', 'Caps 9', 'text 74 %', TXT, 0.74, PEARL, false, false, 'Legend.swift:176-192'],
  ['Moon phase name', 'Caps 8', 'text 40 %', TXT, 0.40, PEARL, false, false, 'RootView.swift:737-740'],
  ['Kept date under the moon', 'Caps 8', 'text 55 %', TXT, 0.55, PEARL, false, false, 'Keeping.swift:1036'],
  ['‘ONE MOON AGO’', 'Caps 7', 'text 36 %', TXT, 0.36, PEARL, false, false, 'Keeping.swift:1062'],
  ['Old key and bowl, at rest', 'glyph 26 pt', 'text 50 %', TXT, 0.50, PEARL, false, true, 'Legend.swift:312-376; RootView.swift:1633'],
  ['Bowl, muted', 'glyph 26 pt', 'text 30 %', TXT, 0.30, PEARL, false, true, 'RootView.swift:1633'],
  ['Chevrons, at rest', 'glyph 12 × 24', 'text 36 %', TXT, 0.36, PEARL, false, true, 'Keeping.swift:908-975'],
  ['Chevrons, hovered; key, lit', 'glyph', 'gold ink', GI, 1, PEARL, false, true, 'Keeping.swift:955-963'],
  ['Unchosen spread diamonds', 'mark 6 pt', 'text 28 %', TXT, 0.28, PEARL, false, true, 'RootView.swift:1097'],
  ['Draw-prompt pips, unfilled', 'mark 6 pt', 'text 20 %', TXT, 0.20, PEARL, false, true, 'RootView.swift:1147'],
]
let under = 0
const crow = r => {
  const [label, type, cname, fg, a, bg, large, graphic, src] = r
  const c = comp(fg, a, bg), q = ratio(c, bg), need = graphic || large ? 3 : 4.5, ok = q >= need
  if (!ok) under++
  const chip = figma.createRectangle(); chip.name = 'Composite ' + toHex(c); chip.resize(22, 16); chip.cornerRadius = 4; chip.fills = [L.solid(toHex(c))]; chip.strokes = [L.solid('#000000', 0.08)]; chip.strokeWeight = 1
  return [
    L.col([L.text(label, ok ? 'small' : 'smallStrong', { w: 380 }), L.source(src, { w: 380 })], { gap: 2 }),
    L.text(type, 'small', { w: 140 }),
    L.text(cname + (bg === PAPER ? '' : ''), 'small', { w: 150 }),
    L.row([chip, L.text(toHex(c), 'code', { size: 11, lh: 16 })], { gap: 8, align: 'CENTER', w: 110 }),
    L.text(q.toFixed(2) + ' : 1', 'codeStrong', { w: 80, color: ok ? L.C.ink : BLOOD }),
    L.text(ok ? 'passes ' + need + ':1' : 'under ' + need + ':1', 'smallStrong', { w: 110, color: ok ? '#2F6140' : BLOOD, alpha: 1 }),
  ]
}
const cols = [{ label: 'Label', w: 380 }, { label: 'Type', w: 140 }, { label: 'Colour', w: 150 }, { label: 'Composite', w: 110 }, { label: 'Ratio', w: 80 }, { label: 'AA', w: 110 }]
const half = Math.ceil(ROWS.length / 2)
const t1 = L.table(cols, ROWS.slice(0, half).map(crow), { name: 'Contrast · 1', zebra: true, gap: 16 })
const t2 = L.table(cols, ROWS.slice(half).map(crow), { name: 'Contrast · 2', zebra: true, gap: 16 })
const ct = L.board({ name: PX + 'Contrast', kicker: 'ACCESSIBILITY', title: 'Contrast', titleStyle: 'h1', w: 2800, leadW: 1300,
  lead: `Every label’s colour composited on pearl #F9F7F2 (card type on paper #F3EDE0), with its WCAG 2 contrast ratio. AA needs 4.5:1 for text, 3:1 for large text (24 pt, or 19 pt bold) and for graphics. ${under} of ${ROWS.length} fall short.`,
  tags: [['akash', 'Akash: as minimal as possible'], ['open', 'Legibility vs quiet']] })
L.add(ct, L.row([t1, t2], { gap: 56, align: 'MIN', name: 'Contrast tables' }))
L.add(ct, L.row([
  L.note({ w: 860, tags: ['measured'], title: 'On the sky it is lower', body: 'The moon’s labels sit over the blue-lilac top of the sky. On sky blue #CCDBF5: the phase name 2.29:1, the kept date 3.34:1, ‘ONE MOON AGO’ 2.08:1. Plain text is 11.5:1 and gold ink 3.45:1 there.', source: 'Palette.swift:13-31' }),
  L.note({ w: 860, tags: ['open'], title: 'A hair short', body: 'The invitation, the written question and the epigraph are at 62 %: 4.47:1. At 63 % they would pass (4.61:1), with no visible change.', source: 'RootView.swift:830, 949, 1009' }),
  L.note({ w: 860, tags: ['akash', 'open'], title: 'Quiet on purpose', body: 'The faint 7–10 pt labels follow Akash’s “as minimal as possible”. The exact opacities are Claude’s. A high-contrast variant (Increase Contrast is ignored today) could keep the quiet for most readers.' }),
], { gap: 38, align: 'MIN', name: 'Contrast notes' }))
L.add(ct, L.source('Colours: Palette.swift:13-31 · composite = a × colour + (1 − a) × ground in sRGB · ratio = (L1 + 0.05) / (L2 + 0.05), WCAG 2.2 relative luminance', { w: CW }))
sec.appendChild(ct)

await K.finish(sec, ORDER)
return await K.snap([rm, ct], 'edge-cases', PX)
