#!/usr/bin/env python3
"""Writes assets/surfaces/manifest.json, geometry.json and system-surfaces.json
from what bin/surfaces rendered (work/geometry-all.json) and the menu probe."""
import json, pathlib, struct

here = pathlib.Path(__file__).resolve().parent
assets = here.parents[1] / 'assets'
out = assets / 'surfaces'
geo = json.loads((here / 'work/geometry-all.json').read_text())

def png_px(p):
    with open(p, 'rb') as f:
        head = f.read(24)
    return list(struct.unpack('>II', head[16:24]))

items = []
def add(file, title, description, group, source, states='', figma_hint='', caveats='', scale=None, kind=None, vector=False):
    p = out / file
    assert p.exists(), p
    kind = kind or p.suffix[1:]
    it = {'file': f'surfaces/{file}', 'title': title, 'description': description, 'kind': kind}
    if kind == 'png':
        px = png_px(p)
        it['px'] = px
        it['scale'] = scale
        it['pt'] = [round(px[0] / scale, 1), round(px[1] / scale, 1)]
    it.update({'vector': vector, 'group': group, 'order': len([i for i in items if i['group'] == group]) + 1,
               'source': source, 'states': states, 'figma_hint': figma_hint, 'caveats': caveats})
    items.append(it)

STILL = ("Rendered offscreen with the near sky drawn as a still (.environment(\\.stillSky, true)), so the drifting dust, ripples and "
         "twinkle are frozen at one moment. The sky's slow gradient and ring are live code, so their exact phase differs "
         "from any other shot.")
ROOM_FRAME = ("The stage without the window's title bar, as the shot tool renders it (no safe area). In the real window "
              "the stage is the content under a 32 pt hidden title bar (1260×828 in a 1260×860 window). See window/ for the real framing.")

# ---------------------------------------------------------------- Settings
S = 'Settings.swift:12-83; ArcanaApp.swift:25-29'
st = geo['settings']
settings_common = ("The Settings window (Arcana ▸ Settings…, ⌘,). It is titled 'Arcana Settings', is 402×151 pt, and is not resizable. "
                   "Its 32 pt title bar is white with a hairline at its foot. Only close is lit: minimise and zoom are greyed, because the window "
                   "is neither miniaturizable nor resizable (styleMask titled | closable | fullSizeContentView, read from SwiftUI's own Settings window). "
                   "The content is pearl #F9F7F2, 402×119 pt, padded 28 pt at the sides and 24 pt top and bottom. 'OpenAI key' is set in Didot 15 ink #26201C. "
                   "Beside it, 14 pt away, is the real AppKit secure field: rounded border, 250×24 pt, placeholder 'sk-…'. "
                   "Under them, 12 pt down, are two Didot Italic 13 lines 3 pt apart. The second always reads 'Kept in your Keychain.' in ink at 55%. ")
cav_s = ("A real NSSecureTextField, drawn by AppKit (cacheDisplay) in a window that is never shown, made to draw as the front window. "
         "The field has focus with the caret after the last letter. The blue keyboard focus ring does not draw offscreen, "
         "so add the system focus ring in Figma if a focused frame is wanted. The key is invented and only its length shows as dots. "
         "The title bar and traffic lights are macOS 26.6.1 (Tahoe). The corners are clipped at the 16 pt radius AppKit reports. "
         "The window shadow is not included.")
for n, (name, line, col, when) in enumerate([
    ('empty', 'For find the thread.', 'ink 55%', 'No key kept: the field is empty and shows its placeholder.'),
    ('typing', 'For find the thread.', 'ink 55%', 'A key pasted or being typed, before the reader pauses. Nothing is asked until the field has not changed for 0.7 s.'),
    ('checking', 'Asking OpenAI…', 'ink 55%', 'After the 0.7 s pause, and whenever the window opens with a key, while GET /v1/models/<model> is in flight.'),
    ('ready', 'The thread is ready.', 'gold ink #8F6C21', 'OpenAI answered 200: the key will open the thread.'),
    ('refused', "This key won't open the thread.", 'oxblood #8C2E25', 'OpenAI answered 401, or 404 model_not_found. The refusal is remembered across launches as a digest of the key.'),
    ('out-of-credit', 'This key is out of credit.', 'oxblood #8C2E25', "A thread request with this key got 429 insufficient_quota earlier in this launch. This outranks every other verdict until the app relaunches."),
    ('unreachable', "OpenAI couldn't be reached.", 'ink 55%', 'The check failed with a network error.'),
], 1):
    add(f'settings/settings-window-{name}@2x.png', f"Settings — {name.replace('-', ' ')}",
        settings_common + f"First line: '{line}' in {col}. When: {when}",
        'Settings window', S + (':58-70' if False else ''),
        states=f"one of 7 verdict states; this is '{name}'. The first line cross-fades 0.2 s ease-out (Settings.swift:39). A 403 on the check gives no verdict, and the line stays 'For find the thread.'",
        figma_hint='screen frame (a small window); make the first line a text layer with a variant per state',
        caveats=cav_s, scale=2)

add('settings/settings-window-real-swiftui-inactive@2x.png', "Settings — SwiftUI's own window (reference)",
    "The app's real Settings scene, opened through Arcana ▸ Settings… in a background probe (settings-probe) whose window ordering "
    "was blocked, so it never reached the screen. It is drawn from its backing store. Because it never became key it shows the inactive look: "
    "grey lights, grey title, no caret. It confirms the posed frames: title 'Arcana Settings', 402×151 pt, content 402×119 pt, lights at "
    "x 9/32/55, y 9, only close enabled.", 'Settings window', S + '; render/surfaces/settings-probe/main.swift',
    states="empty, inactive window (another app in front)", figma_hint='reference beside the posed frames; also the inactive-window variant',
    caveats="Inactive appearance only. Corners clipped at 16 pt as the window server does.", scale=2)

# ---------------------------------------------------------------- Window
W = 'ArcanaApp.swift:6-15; RootView.swift:1647-1677 (WindowSetup)'
ch = geo['chrome']
win_common = ("The room's only window (styleMask titled | closable | miniaturizable | resizable | fullSizeContentView, as SwiftUI's .hiddenTitleBar "
              "makes it, confirmed by window-probe). It has a hidden, transparent title bar and forced light appearance, and "
              "its background is pearl. The sky fills the whole window, under the title bar too. The stage the room lays out in "
              "starts 32 pt down. The traffic lights float over the sky: 14×14 pt at x 9, 32 and 55, y 9, in window points. "
              "The old key (26×26 pt) sits at window (18, 50), 27 pt under them, and the singing bowl mirrors it at the top right. "
              "The window corners are rounded at 16 pt. ")
cav_w = ("Drawn by AppKit and SwiftUI into the window's backing store (cacheDisplay of the theme frame), never on screen, with the near sky as a still. "
         "Made to draw as the front window, so the lights are coloured. The lights' hover glyphs (× − +) are not shown. "
         "Measured on macOS 26.6.1: other macOS versions draw their own title-bar metrics and corner radius. No window shadow.")
add('window/window-default-1260x860@2x.png', 'Main window — default size, the room at rest',
    win_common + "Default size 1260×860 (stage 1260×828): ARCANA, the question prompt, the three spreads and the deck, with the moon at top right.",
    'Main window chrome', W, states='room at rest (invocation)', figma_hint='screen frame; use as the base window for every room frame',
    caveats=cav_w, scale=2)
add('window/window-minimum-940x660@2x.png', 'Main window — minimum size, the room at rest',
    win_common + "Minimum size 940×660 (stage 940×628). As it opens the room grows a window smaller than 1260×860, or than the screen allows. "
    "The reader can then drag it down to this size (WindowSetup).",
    'Main window chrome', W, states='room at rest, smallest window', figma_hint='screen frame', caveats=cav_w, scale=2)
add('window/window-default-keys-open-1260x860@2x.png', 'Main window — the keys open',
    win_common + "The keys page open over the sky, in the real window, with the old key lit gold.", 'Main window chrome',
    W + '; Legend.swift:81-160', states='legend open, lines settled', figma_hint='screen frame', caveats=cav_w, scale=2)
add('window/window-minimum-keys-open-940x660@2x.png', 'Main window (minimum) — the keys open',
    win_common + "The keys page in the smallest window: all seven lines still fit.", 'Main window chrome',
    W + '; Legend.swift:81-160', states='legend open, smallest window', figma_hint='screen frame', caveats=cav_w, scale=2)
add('window/window-default-kept-three-cards-1260x860@2x.png', "Main window — the moon's door open",
    win_common + "A kept three-card reading on the table, as the door opens on it: pressed blanks keeping their gold, the question above, "
    "the date under the moon, and chevrons both ways.", 'Main window chrome', W + '; Keeping.swift:580-620',
    states='kept page 2 of 3, not yet remembered', figma_hint='screen frame',
    caveats=cav_w + ' The readings are invented and held in memory only.', scale=2)
add('window/window-default-corner-lights-and-key@2x.png', 'Title-bar corner — lights and the old key',
    "The top-left 300×90 pt of the default window: the three lights over the sky and the old key under them, at rest (ink 50%).",
    'Main window chrome', W + '; Legend.swift:312-376', states='rest', figma_hint='detail crop for redlines', caveats=cav_w, scale=2)
add('window/window-minimum-corner-lights-and-key@2x.png', 'Title-bar corner (minimum window)',
    "The same corner in the 940×660 window. The chrome is identical at every size.", 'Main window chrome', W, states='rest',
    figma_hint='detail crop', caveats=cav_w, scale=2)
add('window/window-titlebar-overlay-1260@2x.png', 'Title-bar overlay (transparent)',
    "The window frame's own drawing across a 1260×32 pt title bar with nothing behind it: the three lit lights, and any edge "
    "the frame draws, on transparency. Lay it over any stage frame to make a window.", 'Main window chrome', W,
    states='active window', figma_hint='component: place at the top of every window frame', caveats=cav_w, scale=2)
for n, (b, c) in enumerate([('close', 'red, centre #FF5C5F, rim #FF2025'), ('minimize', 'yellow, centre #FAC800, rim #F8B300'),
                            ('zoom', 'green, centre #34C759, rim #00B21C')]):
    add(f'window/traffic-light-{b}@2x.png', f'Traffic light — {b}',
        f"The {b} button as AppKit draws it in the room's window: 14×14 pt, {c} (sampled). Zoom is enabled in the room's window "
        "and greyed in Settings.", 'Main window chrome', W, states='active, no hover',
        figma_hint='component (a native macOS kit may already have these)', caveats=cav_w, scale=2)

# ---------------------------------------------------------------- Menus
add('menus.json', 'The menu bar',
    "The full menu tree as the app ships it: Arcana (About, Settings… ⌘,, Services, Hide/Hide Others/Show All, Quit ⌘Q), Edit "
    "(Undo, Redo, Cut, Copy, Paste, Delete, Select All, then macOS's Writing Tools, AutoFill, Dictation, Emoji & Symbols), an empty View "
    "menu that macOS fills at run time, Window (Minimize ⌘M, Zoom, Bring All to Front), and Help with only 'The Keys ⌘/'. "
    "There is no File menu, because New Window was removed. Every item has its shortcut, its action and where it comes from.",
    'Menus', 'ArcanaApp.swift:16-29; probe render/surfaces/menu-probe/main.swift',
    states='as built at launch', figma_hint='draw as native macOS menus (text layers); mark the two app items',
    caveats="Captured by running the app's own scene and command declarations as a background-only process with no window, "
    "then dumping NSApp.mainMenu. Items macOS adds only while a window is open (View, the Window extras, the window list, Help's search field) "
    "are described in notes but were not captured.")

# ---------------------------------------------------------------- Keys page
K = 'Legend.swift:60-160 (LegendPage, LegendSheet); LegendLine.all Legend.swift:43-51'
kg = geo['keys']
keys_common = ("THE KEYS: the page the old key (or ?, or ⌘/) opens over the sky, while the table fades away. A pearl veil is dense in the "
               "centre and thin at the edges (radial pearl 80% → 60% → 32% at 0/0.5/1, reaching 0.72 × the stage's longer side). "
               "It holds a gold hairline 46×1 pt (gold ink 55%), then 18 pt below it 'THE KEYS' in Didot-Bold 21, tracking 8, ink, with a "
               "gold-light glow at 45%, r 14. Then 38 pt lower come seven lines, each 22 pt tall and 15 pt apart. The keys sit in a 150 pt "
               "column, right-aligned, then a 22 pt gap, then the label in a 150 pt column: Didot Italic 17, ink 82%. "
               "The whole page is 322 pt wide, centred. A click anywhere closes it. ")
cav_k = STILL + ' The lines are shown settled (the shot tool\'s still), not mid-arrival.'
add('keys/keys-page-1260x860@2x.png', 'The keys — default stage',
    keys_common + f"Default stage 1260×860. The title block's top is at y {kg['keys-page-1260x860']['title']['y']} and line 1 at y {kg['keys-page-1260x860']['rows'][0]['y']}.",
    'The keys page', K, states='open, every line arrived; the old key lit gold (top left)',
    figma_hint='screen frame (stage); the rows are best rebuilt as components', caveats=cav_k + ' ' + ROOM_FRAME, scale=2)
add('keys/keys-page-940x628@2x.png', 'The keys — smallest stage',
    keys_common + "The smallest window's stage, 940×628 (a 940×660 window under its title bar): all seven lines still fit.",
    'The keys page', K, states='open, smallest stage', figma_hint='screen frame (stage)', caveats=cav_k, scale=2)
add('keys/keys-title@3x.png', 'The keys — title',
    "The page's head: the 46×1 pt gold hairline, then 'THE KEYS' in Didot-Bold 21, tracking 8, with its faint gold glow. The final "
    "letter's tracking is balanced with 8 pt of leading padding.", 'The keys page', 'Legend.swift:103-114',
    states='open', figma_hint='type specimen', caveats=cav_k, scale=3)
rows = [
    ('left-right-choose', '← →', 'choose', 'two drawn keycaps, the pen-drawn arrows ← and →'),
    ('type-your-question', 'TYPE', 'your question', "no keycap: the word 'TYPE' in small capitals (Caps 9, tracking 2.6, ink 66%)"),
    ('space-hold', 'SPACE', 'hold', "a wide keycap named 'SPACE' (Caps 9, tracking 1.6, ink 74%, 7 pt side padding)"),
    ('up-past-readings', '↑', 'past readings', 'one keycap, the drawn ↑'),
    ('command-delete-forget-a-reading', '⌘ ⌫', 'forget a reading', 'two keycaps, the drawn ⌘ and ⌫'),
    ('esc-back', 'ESC', 'back', "a keycap named 'ESC'"),
    ('command-comma-settings', '⌘ ,', 'settings', 'two keycaps, ⌘ and the drawn comma (a filled drop with a short tail; added in 1.3)'),
]
for i, (slug, keys, label, what) in enumerate(rows):
    r = kg['keys-page-1260x860']['rows'][i]
    add(f'keys/keys-row-{i + 1}-{slug}@3x.png', f'Keys line {i + 1} — {keys} {label}',
        f"Line {i + 1} of THE KEYS: {what}, then the italic label '{label}'. Keycaps are pen-drawn rounded squares, never quite true, "
        f"at least 22×22 pt, outlined 0.85 pt in ink 40%. Drawn signs are 10×10 pt at 0.95 pt, ink 74%. The keys column is right-aligned "
        f"at 150 pt. The line's frame on the default stage is {r['w']:.0f}×{r['h']:.0f} pt at ({r['x']:.0f}, {r['y']:.1f}), and the crop adds "
        f"18 pt left and right and 7 pt above and below.",
        'The keys page', 'Legend.swift:43-51, 117-146 (line), 169-196 (KeyCap), 198-234 (CapShape), 254-310 (KeySigns)',
        states=f"arrives {0.16 + 0.05 * (i + 1):.2f} s after the page opens, 0.45 s ease-out, out of a slight blur",
        figma_hint='component row (keycaps + label); rebuild the keycap outlines as vectors from the glyphs family if available',
        caveats=cav_k + ' Each outline wobble is seeded by the label text, so each cap is its own drawing.', scale=3)

# ---------------------------------------------------------------- Moon door
M = 'Keeping.swift'
kp = geo['kept']
lay = kp['layouts']
door_common = ("What the moon keeps: opened from the day moon at the top right, or with ↑, while the room is at rest. The room fades away. "
               "The kept reading lies on the table as the return left it: cream blanks with the ink sunk into the stock, each "
               "keeping only its gold leaf. The question is set above in italic ink, the moon turns to its phase on that night, and "
               "the date sits under it. 'HOLD · REMEMBER' is at the foot. ")
cav_d = (STILL + ' ' + ROOM_FRAME + ' The readings are invented (the shot tool\'s shelf: a one-card reading 40 days ago, three cards 12 days ago '
         'with a thread, five cards 3 days ago), posed in memory with Keeping.file = nil. No reading of the user\'s was read. '
         'The dates under the moon are relative to the render day, 2026-09-30.')
def door(file, title, desc, states, source, hint='screen frame (stage)', extra=''):
    add(f'moon-door/{file}', title, desc, "What the moon keeps", source, states=states, figma_hint=hint,
        caveats=cav_d + extra, scale=2)
door('kept-page-one-card@2x.png', 'Kept page — one card',
     door_common + f"One card (The Hermit), with the question 'Is it time to call her'. It is the oldest reading, so only the right "
     f"chevron shows. The card is {lay['1']['slotW']:.1f}×{lay['1']['slotH']:.0f} pt, centred at y {lay['1']['rowY']:.1f}.",
     'page 1 of 3, pressed (not yet remembered)', f'{M}:580-620 (KeptPage), 632-672 (KeptSpread)')
door('kept-page-three-cards@2x.png', 'Kept page — three cards',
     door_common + "Three cards (The Sun, The High Priestess, Death reversed) with the question 'Should I leave the city before winter'. "
     "Chevrons show both ways. The thread found then shows its question in gold where the verse will be. "
     f"The cards are {lay['3']['slotW']:.1f}×{lay['3']['slotH']:.0f} pt at x {', '.join(str(round(s['x'], 1)) for s in lay['3']['slots'])}, y {lay['3']['rowY']:.1f}. "
     "Each is tilted ±0.7°.", 'page 2 of 3, pressed', f'{M}:580-720, 849-890 (KeptFolio)')
door('kept-page-five-cards@2x.png', 'Kept page — five cards',
     door_common + "Five cards (The Fool, The Tower reversed, The Empress, The Star, The World), with no question written. It is the latest "
     f"reading, so only the left chevron shows. The cards are {lay['5']['slotW']:.1f}×{lay['5']['slotH']:.0f} pt.",
     'page 3 of 3, pressed', f'{M}:580-720')
door('kept-page-rising@2x.png', 'Kept page — remembering (ink rising)',
     "The three-card page held at 45%. Holding runs the return backwards: the ink rises out of the stock card by card, first card "
     "first, as each card's bowl rings and the drone swells. 'HOLD · REMEMBER' and the thread's question fade as it begins.",
     'held, rising 0.45', f'{M}:399-444 (remember), 674-718 (KeptCard)')
door('kept-page-remembered@2x.png', 'Kept page — remembered',
     "The three-card page after the hold: faces whole, halos and the gold thread back, position names, and the verse spoken again "
     "(all three lines).", 'risen, 3 lines recited', f'{M}:720-847 (KeptHalo, KeptThread, KeptNames, KeptVerse)')
door('kept-page-threaded@2x.png', 'Kept page — remembered, with its thread',
     "As 'remembered', but the thread that was found takes the verse's place: its line in Didot 19, a gold diamond, then its question in "
     "gold italic 18 with a gold-light glow.", 'risen, threaded', f'{M}:849-890 (KeptFolio)',
     extra=' The kept thread hairline stays at 0.40 opacity even when a thread was found (it never shows the live 0.62 "woven" state).')
door('kept-page-one-card-remembered@2x.png', 'Kept page — one card, remembered', "The one-card page after the hold, with its single verse line.",
     'risen, 1 line', f'{M}:720-847')
door('kept-page-altar@2x.png', 'Kept page — a card on the altar',
     "A remembered kept card opened on the altar (the inspector), as on the live table. The rest of the page drops to 6%, and "
     "the question stays at 40% above.", 'risen, threaded, card 3 inspected', f'{M}:632-672; RootView (Inspector)')
door('kept-page-five-cards-940x660@2x.png', 'Kept page — five cards, smallest stage',
     "The five-card page remembered, with its five verse lines, in the smallest stage (940×660 shot stage).", 'risen, 5 lines, small',
     f'{M}:580-847', extra=' Shot stage 940×660 as the shot tool uses; the real smallest stage is 940×628.')
TurnHover = geo['kept']['chevron_pts']
door('kept-page-three-cards-chevrons-hover@2x.png', 'Kept page — chevrons lit (hover state)',
     "The three-card page with both chevrons in their hover look: gold ink with a gold-light glow at 80%, r 6. On a real Mac only the one under "
     "the pointer lights, and the cursor becomes a pointing hand.", 'hover (both posed lit)', f'{M}:928-975 (TurnMark)',
     extra=' Both chevrons are posed lit at once for the still. The hover state is private, so it was set in a render copy.')
door('moon-at-rest@2x.png', 'The moon as a door — at rest',
     "The room at rest with readings kept. The day moon at the top right (r 16 pt at 0.86 W, max(70, 0.12 H)) is the door. Nothing marks it until hovered.",
     'rest', f'{M}:979-1026 (MoonDoor); Chamber.swift:43-47')
door('moon-hover@2x.png', 'The moon as a door — hovered',
     "The pointer over the moon: a white halo (radial 50% → 0 from r 16 to r 46, in a 96 pt square) eases in over 0.3 s, and the "
     "cursor becomes a pointing hand. It lights only while the door can open (room at rest, a reading kept, keys closed).",
     'hover', 'Chamber.swift:360-367; Keeping.swift:990-1003')
door('moon-breath-glow@2x.png', 'The moon takes a reading — breath glow',
     "As the moon takes a returned reading it brightens for one breath: a pale white light (radial to r 96: 70% to 0.17, 28% at 0.42, 0 at 1). "
     "It rises over 1.4 s, holds to 2.0 s and fades by 5.0 s. Shown at full strength.", 'glow at 1.7 s (full)',
     f'{M}:1083-1170 (MoonGlow)')
door('moon-one-moon-ago@2x.png', 'One moon ago — the question comes back',
     "A lunar month (29.53 days, from −12 h to +36 h) after a question was asked, it comes back faintly under the moon until the door is opened. "
     "Under tonight's phase name come 'ONE MOON AGO' (Caps 7, tracking 3.2, ink 36%) and, 8 pt below, the question in Didot Italic 13.5 at ink 55%. "
     "The question is centred, at most 3 lines, and min(300, (W − moon.x) × 2 − 40) pt wide.", 'brought back (29.6 days after asking)',
     f'{M}:1049-1081 (MoonReturn), 194-200 (comingBack)')
door('moon-one-moon-ago-940x660@2x.png', 'One moon ago — longest question, smallest stage',
     "The same, with the longest question the pen allows, in the 940×660 shot stage: the text wraps under the moon.",
     'brought back, longest question', f'{M}:1049-1081')
det = [
    ('detail-date-label@2x.png', 'Detail — the date under the moon',
     "While the door is open the moon shows its phase on the night of the reading. Under it, 36 pt below its centre, is the date in tracked "
     "capitals (Caps 8, tracking 3.6, ink 55%): 'SEPTEMBER 18', and 'SEPTEMBER 18, 2025' for another year. It cross-fades 0.6 s as pages turn.",
     'door open', f'{M}:1015-1045 (night, KeptMoonLabel)'),
    ('detail-one-moon-ago@2x.png', "Detail — 'ONE MOON AGO' and the returned question", "The moon corner of 'moon-one-moon-ago', at 2×.",
     'brought back', f'{M}:1049-1081'),
    ('detail-moon-breath-glow@2x.png', 'Detail — the breath glow', 'The moon corner of the breath-glow frame.', 'glow full', f'{M}:1083-1112'),
    ('detail-moon-hover@2x.png', 'Detail — moon hovered', 'The moon with its hover halo, 140 pt square.', 'hover', 'Chamber.swift:360-367'),
    ('detail-moon-rest@2x.png', 'Detail — moon at rest', 'The same 140 pt square with no hover, to compare.', 'rest', 'Chamber.swift:331-393'),
    ('detail-hold-remember@2x.png', "Detail — 'HOLD · REMEMBER'",
     "The kept page's only instruction, centred at the stage's foot (y = H − 32): Caps 8.5, tracking 4, gold ink at 60%. It fades as the hold "
     "begins and is gone once the reading is remembered.", 'pressed page', f'{M}:892-906'),
    ('detail-kept-question@2x.png', 'Detail — the kept question',
     "The written question above a kept spread, set as the live epigraph (EpigraphLine: a short gold hairline above italic ink), at "
     f"y {lay['3']['epigraphY']:.1f} for three cards.", 'door open', f'{M}:655-660; RootView.swift:970'),
    ('detail-chevron-left-rest@2x.png', 'Detail — chevron left, at rest',
     f"The way to an earlier reading: an open angle drawn by the pen, 12×24 pt, stroked 1.0 pt round, ink 36%, in a 44×64 pt hit area. "
     f"It sits beside the spread at x = max(30, first card x − (card width/2 + 58)): x {TurnHover['left']['x']:.1f}, y {TurnHover['left']['y']:.1f} for three cards.",
     'rest', f'{M}:908-975'),
    ('detail-chevron-right-rest@2x.png', 'Detail — chevron right, at rest',
     f"The way to a later reading, mirrored: x {TurnHover['right']['x']:.1f}. It shows only when there is a reading that way, fading 0.4 s.",
     'rest', f'{M}:908-975'),
    ('detail-chevron-left-hover@2x.png', 'Detail — chevron left, hovered', 'Gold ink with a gold-light glow (80%, r 6), easing in over 0.2 s.', 'hover', f'{M}:955-963'),
    ('detail-chevron-right-hover@2x.png', 'Detail — chevron right, hovered', 'As left, mirrored.', 'hover', f'{M}:955-963'),
    ('detail-chevron-left-in-context@2x.png', 'Detail — chevron beside the first card',
     'The left chevron with the three-card spread\'s first kept card, to show the spacing (card width/2 + 58 pt from the card\'s centre).',
     'rest', f'{M}:908-926'),
]
for f, t, d, s, src in det:
    door(f, t, d, s, src, hint='detail crop for redlines')

# ---------------------------------------------------------------- data + specs
add('kept-sample.json', 'kept.json — an invented example',
    "What the moon keeps is one small file on the Mac, ~/Library/Application Support/Arcana/kept.json, sent nowhere. This is an INVENTED example "
    "in the app's own encoding: {readings: [{id, at (ISO 8601), spread ('one'|'three'|'road'), cards [{card, reversed}], question?, thread? {thread, question}, "
    "broughtBack?}]}, oldest first. It holds four readings: one card brought back a moon later; three cards with a thread; five cards with no question; "
    "and three Minors.", 'Data', 'Keeping.swift:26-60 (Kept), 499-514 (Shelf, encoder)',
    states='n/a', figma_hint='reference for a data/annotation frame; not a visual',
    caveats="Invented and marked with an '_invented' key, which the real file does not have. The app's decoder ignores it; the file was decoded back to check. "
            "Nothing was read from the user's own kept.json.")

spread_ids = {}
geometry = {
    'about': "Measured geometry for the surfaces, in points (top-left origin), from the renders in this folder (render/surfaces/bin/surfaces).",
    'settings_window': st | {
        'layout_pt': {
            'padding': {'h': 28, 'v': 24}, 'label': {'text': 'OpenAI key', 'font': 'Didot 15', 'x': 28, 'color': '#26201C'},
            'field': {'x': 124, 'y_in_content': 24, 'w': 250, 'h': 24, 'style': 'NSSecureTextField, rounded border', 'placeholder': 'sk-…'},
            'hstack_spacing': 14, 'vstack_spacing': 12,
            'lines': {'font': 'Didot-Italic 13', 'spacing': 3, 'first_y_in_content': 60, 'line_h': 16},
            'colors': {'background': '#F9F7F2', 'titlebar': '#FFFFFF', 'titlebar_hairline': '#E6E6E6', 'quiet': '#26201C @ 55%',
                       'ready': '#8F6C21', 'refused_or_out_of_credit': '#8C2E25'},
        },
    },
    'real_swiftui_windows_probe': json.loads((here / 'work/wp/window-probe.json').read_text())['windows'],
    'main_window': ch | {
        'key_glyph_frame_window_pt': {'x': 18, 'y': 50, 'w': 26, 'h': 26},
        'bowl_frame_window_pt': {'x': 'W − 44', 'y': 50, 'w': 26, 'h': 26},
        'stage': 'content below the 32 pt title bar: 1260×828 default, 940×628 minimum; the sky fills the whole window',
        'traffic_light_colors_sampled': {'close': ['#FF5C5F', '#FF2025'], 'minimize': ['#FAC800', '#F8B300'], 'zoom': ['#34C759', '#00B21C']},
        'measured_on': 'macOS 26.6.1 (25G76)',
    },
    'keys_page': kg,
    'kept': kp,
}
(out / 'geometry.json').write_text(json.dumps(geometry, indent=2, ensure_ascii=False) + '\n')
add('geometry.json', 'Surfaces — measured geometry',
    "Numbers for building the surfaces natively in Figma: the Settings window, the main window's title bar, lights and corner radius, "
    "where each keys line lands on both stages, and the kept-page layouts for 1, 3 and 5 cards (card size and centres, question and "
    "instruction baselines, chevron and moon positions).", 'Specs', 'render/surfaces/main.swift (measured from the renders)',
    figma_hint='redline annotations', caveats='Stage figures are for the shot stage (no title bar) unless marked window.')

system = {
    'about': "System surfaces a reader meets that macOS draws, not Arcana. None was captured: showing them would put windows on screen. "
             "Strings marked 'app' are exact from the code, Info.plist or release notes. Strings marked 'macOS' are the system's wording, "
             "which changes between macOS versions.",
    'surfaces': [
        {'name': 'About Arcana', 'opened_by': 'Arcana ▸ About Arcana (orderFrontStandardAboutPanel:)',
         'shows': [
             {'what': 'icon', 'value': "AppIcon.icns, made by sips from Assets/arcana-logo.png: the raster logo with no squircle tile", 'from': 'app (build.sh:40-43)'},
             {'what': 'name', 'value': 'Arcana', 'from': 'app (CFBundleName)'},
             {'what': 'version line', 'value': 'Version 1.3 (4)', 'from': 'app (CFBundleShortVersionString 1.3, CFBundleVersion 4; macOS formats the line)'},
             {'what': 'copyright', 'value': None, 'from': 'app: none (no NSHumanReadableCopyright, no Credits file)'},
         ], 'layout': "macOS's standard About panel: a small centred window with the icon above the name and version."},
        {'name': 'Keychain access prompt', 'when': "After each update of the downloaded (ad hoc signed) app, the first time it reads the saved OpenAI key. "
                                                   "The read is off the main thread, so the room keeps moving while it asks.",
         'item': {'service': 'local.arcana.reader', 'account': 'OpenAI API key', 'label': 'Arcana — OpenAI key', 'from': 'app (Settings.swift:91-93)'},
         'text_macos': "Arcana wants to use your confidential information stored in \"Arcana — OpenAI key\" in your keychain. "
                       "To allow this, enter the \"login\" keychain password.",
         'buttons_macos': ['Always Allow', 'Deny', 'Allow'],
         'caveat': 'The wording is macOS\'s own and approximate. The reader types their login password, then chooses Always Allow.'},
        {'name': "Gatekeeper — first open (not notarized)",
         'release_notes_app': "**The first time:** Arcana isn't notarized by Apple, so macOS won't open it at first. Try once, then go to "
                              "**System Settings ▸ Privacy & Security**, scroll down, and click **Open Anyway**. After that it opens like any other app.",
         'install_app': "**To install:** download **Arcana.zip**, open it, and drag **Arcana** into Applications.",
         'thread_app': "**To find the thread:** paste an OpenAI key into **Arcana ▸ Settings…** (⌘,). It's kept in your Keychain, and Settings checks with OpenAI that the key works.",
         'requirements_app': 'For Macs with Apple silicon, on macOS 14 or later.',
         'steps_macos': [
             "Alert on the first try: '\"Arcana\" Not Opened' — 'Apple could not verify \"Arcana\" is free of malware that may harm your Mac or compromise your privacy.' — Done / Move to Trash",
             "System Settings ▸ Privacy & Security, Security section: '\"Arcana\" was blocked to protect your Mac.' — Open Anyway",
             "Confirmation: 'Open \"Arcana\"?' — Open Anyway (then Touch ID or password)",
         ],
         'source': 'gh release view v1.3 --repo akassh9/arcana (body); README.md:108-110',
         'caveat': 'The macOS steps are the system\'s wording on macOS 15 and later, approximate. Only the release-note lines are the app\'s own words.'},
    ],
}
(out / 'system-surfaces.json').write_text(json.dumps(system, indent=2, ensure_ascii=False) + '\n')
add('system-surfaces.json', 'System surfaces (not captured)',
    "Notes for the three surfaces macOS draws: the About panel (icon, 'Arcana', 'Version 1.3 (4)', no copyright), the Keychain prompt after an update "
    "(item 'Arcana — OpenAI key'), and Gatekeeper's Open Anyway flow, with the release notes' exact words.", 'Specs',
    'build.sh:19-43; Settings.swift:85-93; release v1.3 notes', figma_hint='text notes beside the Settings and window frames',
    caveats='Not captured, since that would show windows. macOS wording is approximate and marked as such.')

manifest = {
    'category': 'surfaces',
    'tool': ("cd design/figma/render/surfaces && ./build.sh && bin/surfaces ../../assets/surfaces work [settings chrome keys kept sample] "
             "&& python3 make_menus.py && python3 make_manifest.py. For the menu tree, first build and run menu-probe (see README.md) to refresh work/menus-probe.json."),
    'notes': ("The surfaces around the room: Settings (7 states, the real AppKit field), the real main window frame (lights, 32 pt title bar, 16 pt corners), "
              "the menu bar, the keys page and its seven lines, and the moon's door (1, 3 and 5 cards, remembering, thread, altar, chevrons, date, "
              "one moon ago, breath glow, hover). Plus an invented kept.json, measured geometry, and notes on the About panel, the Keychain prompt and Gatekeeper. "
              "Stage frames (keys/, moon-door/) are the shot tool's framing with no title bar; window/ has the real window. Everything was rendered offscreen from "
              "patched copies of the sources (no sound, no Keychain, no network, no kept.json), and nothing was put on screen. There are no SVGs in this family: "
              "the pen-drawn vector glyphs (old key, keycaps, key signs, chevrons) belong to the glyphs family. "
              "Colours in the PNGs are exact sRGB: pearl #F9F7F2, ink #26201C, gold ink #8F6C21, oxblood #8C2E25, checked in the raw bytes."),
    'items': items,
}
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
print('✓ manifest', len(items), 'items')
