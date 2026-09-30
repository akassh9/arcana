#!/usr/bin/env python3
"""Writes assets/surfaces/menus.json from the menu probe's dump (work/menus-probe.json):
the menu bar SwiftUI builds from ArcanaApp.swift's scenes and commands, annotated."""
import json, pathlib
here = pathlib.Path(__file__).resolve().parent
probe = json.loads((here / 'work/menus-probe.json').read_text())
out = here.parents[1] / 'assets/surfaces/menus.json'

SRC = {
    ('Arcana', 'Settings…'): ('ArcanaApp.swift:25-29', 'Added by SwiftUI because the app declares a Settings scene; opens the Arcana Settings window (SettingsView).'),
    ('Help', 'The Keys'): ('ArcanaApp.swift:18-22', "Replaces SwiftUI's 'Arcana Help ⌘?'. Posts .arcanaKeys: opens the keys page, or closes it if open (RootView.swift:50-51 → Game.toggleLegend). ⌘/ rather than ⌘? because ⇧⌘/ is macOS's own 'Show Help menu' shortcut."),
}
SYSTEM = {'Writing Tools', 'AutoFill', 'Start Dictation…', 'Emoji & Symbols', 'Services'}

def item(menu, i):
    if i.get('separator'):
        return {'separator': True}
    t = i['title']
    d = {'title': t}
    if 'shortcut' in i:
        d['shortcut'] = i['shortcut']
    if i.get('hidden'):
        d['hidden'] = True
    if i.get('alternate'):
        d['alternate'] = True
    d['action'] = i.get('action')
    if (menu, t) in SRC:
        d['source'], d['note'] = SRC[(menu, t)]
    elif t in SYSTEM:
        d['source'] = 'macOS (AppKit adds it to every app)'
    else:
        d['source'] = 'SwiftUI default'
    if t == 'Emoji & Symbols' and not i.get('hidden'):
        d['note'] = ("macOS draws this item's shortcut itself (fn E / Globe E on Macs with a Globe key); "
                     "the probe read a raw key equivalent of ⌘ Space, which is not what the menu shows.")
        d.pop('shortcut', None)
    if 'submenu' in i:
        d['items'] = [item(t, s) for s in i['submenu']]
    return d

bar = []
for m in probe['menus']:
    entry = {'title': m['title'], 'items': [item(m['title'], s) for s in m.get('submenu', [])]}
    if m['title'] == 'Arcana':
        entry['note'] = 'The application menu (shown in bold with the app name).'
    if m['title'] == 'View':
        entry['note'] = ("Empty as SwiftUI builds it. While the room's window is open, macOS fills it at run time with "
                         "its own window items (Enter Full Screen, and the tab-bar items). Not captured, since no window was shown.")
    if m['title'] == 'Window':
        entry['note'] = ("macOS adds more at run time: its window-tiling items (Fill, Center, Move & Resize ▸, Full Screen Tile ▸ on "
                         "macOS 15 and later), the tab items, and a list of open windows: 'Arcana', plus 'Arcana Settings' while Settings is open. "
                         "Not captured.")
    if m['title'] == 'Help':
        entry['note'] = "macOS puts its Search field at the top of every Help menu. The Keys ⌘/ is the only item."
    bar.append(entry)

doc = {
    'about': ("Arcana's menu bar as it ships (v1.3): what SwiftUI builds from Sources/Arcana/ArcanaApp.swift. It was captured by running the app's own "
              "scene and command declarations, copied into render/surfaces/menu-probe/main.swift, as a background-only process with no window. "
              "The dump is NSApp.mainMenu, read after launch. No window was shown and the menu bar was never taken over."),
    'captured_on': probe.get('os'),
    'app_code': {
        'removed': [
            {'what': 'File ▸ New Window ⌘N', 'how': 'CommandGroup(replacing: .newItem) {}', 'source': 'ArcanaApp.swift:17',
             'effect': "With its only item gone, SwiftUI left out the whole File menu in the probe, including Close ⌘W. The probe had no window open, so it was not checked whether SwiftUI adds Close while one is. The red traffic light closes the window either way."},
            {'what': 'Help ▸ Arcana Help ⌘?', 'how': 'CommandGroup(replacing: .help) { The Keys ⌘/ }', 'source': 'ArcanaApp.swift:19-22'},
        ],
        'added': [
            {'what': 'Arcana ▸ Settings… ⌘,', 'how': 'Settings { SettingsView() }', 'source': 'ArcanaApp.swift:26-29'},
            {'what': 'Help ▸ The Keys ⌘/', 'source': 'ArcanaApp.swift:20-21'},
        ],
    },
    'menu_bar': bar,
    'shortcuts_in_menus': [
        {'menu': m['title'], 'title': i['title'], 'shortcut': i['shortcut']}
        for m in bar for i in m['items'] if i.get('shortcut') and not i.get('hidden')
    ],
    'caveats': ("Item titles, order, separators and shortcuts come from the dump. 'Arcana' is the app's name in every item because the probe "
                "carries the app's CFBundleName. Items macOS adds only while a window is open, or only as a menu opens, are described in notes "
                "but not captured: the Help Search field, the View and Window items, and the window list. The Writing Tools and AutoFill submenus "
                "depend on the Mac: Writing Tools needs Apple Intelligence, and they may be disabled when no text field has focus. "
                "Services ▸ is filled by macOS. Keys the room handles itself (← → space ↑ ⌘⌫ esc ? m) are not menu items. See the keys page."),
}
out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + '\n')
print('✓', out)
