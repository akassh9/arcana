#!/usr/bin/env python3
"""Copies Sources/Arcana/*.swift (minus ArcanaApp.swift) into ./src and patches
the COPIES only (never the repo):
- silence: the audio engine never starts, so nothing can ever sound;
- no key from anywhere (env, .env.local, Keychain) and no request to OpenAI;
  the thread is offered only when a render says so (Game.threadable is settable);
- a few file-private views become internal so they can be drawn alone;
- two hooks: the title's light is posed at a chosen k, and a verse line can be
  posed part-way through its arrival.
Every patch must apply exactly as often as expected, or this stops."""
import pathlib, shutil, sys
here = pathlib.Path(__file__).resolve().parent
repo = here.parents[3]
src = here / 'src'
if src.exists():
    shutil.rmtree(src)
src.mkdir()
for f in (repo / 'Sources/Arcana').glob('*.swift'):
    if f.name != 'ArcanaApp.swift':
        shutil.copy(f, src / f.name)

def patch(name, old, new, count=1):
    p = src / name
    t = p.read_text()
    n = t.count(old)
    if n != count:
        sys.exit(f'prepare.py: {name}: expected {count} of {old[:70]!r}, found {n}')
    p.write_text(t.replace(old, new))

patch('Sfx.swift', 'try engine.start()', 'try typeInkNeverStart()', 3)
patch('Weave.swift', '  static func value() -> String? {\n    if let key = local() { return key }',
      '  static func value() -> String? {\n    if typeInkNoKeys { return nil }\n    if let key = local() { return key }')
patch('Weave.swift', '  static func check(_ key: String) async -> OpenAIKey.Verdict? {\n',
      '  static func check(_ key: String) async -> OpenAIKey.Verdict? {\n    if typeInkNoKeys { return nil }\n')
patch('Settings.swift', '  private static func copy() -> String? {\n',
      '  private static func copy() -> String? {\n    if typeInkNoKeys { return nil }\n')
patch('Settings.swift', '  private static func write(_ key: String) {\n',
      '  private static func write(_ key: String) {\n    if typeInkNoKeys { return }\n')
patch('Settings.swift', '  private static func delete() {\n',
      '  private static func delete() {\n    if typeInkNoKeys { return }\n')
patch('Game.swift', 'private(set) var threadable = WeaveService.ready', 'var threadable = false')
for s in ['Title: View', 'Stanza: View', 'ThreadPanel: View', 'Inspector: View', 'AltarCard: View',
          'Epigraph: View', 'ThreadGlyph: View', 'Bursts: TimelineSchedule']:
    patch('RootView.swift', f'private struct {s}', f'struct {s}')
# the title's light, posed
patch('RootView.swift',
      '          let k =\n            tl.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 12) / 3.2',
      '          let k = typeInkTitleK ??\n            tl.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 12) / 3.2')
# a verse line part-way through its arrival (the easeOut 1.1 s lerps these three)
patch('RootView.swift',
      '          .opacity(spoken ? 1 : 0)\n          .offset(y: spoken ? 0 : 7)\n          .blur(radius: spoken ? 0 : 5)',
      '          .opacity(typeInkArrive(i, spoken))\n          .offset(y: 7 * (1 - typeInkArrive(i, spoken)))\n          .blur(radius: 5 * (1 - typeInkArrive(i, spoken)))')
print('prepared', len(list(src.glob('*.swift'))), 'files')
