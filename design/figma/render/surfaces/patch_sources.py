#!/usr/bin/env python3
"""Copies Sources/Arcana/*.swift into ./src and patches the COPIES (never the repo):
- silence: the audio engine never starts (no sound can play);
- no Keychain, no network, no .env.local: the OpenAI key store always answers nil;
- SettingsView takes its state from a pose (no Keychain read, no check with OpenAI);
- a few file-private views and the kept-file coder become internal so they can be drawn alone.
Re-run after the app's sources change."""
import pathlib, re, shutil, sys
here = pathlib.Path(__file__).resolve().parent
repo = here.parents[3]
src = here / 'src'
src.mkdir(exist_ok=True)
for f in (repo / 'Sources/Arcana').glob('*.swift'):
    shutil.copy(f, src / f.name)

def patch(name, pairs):
    p = src / name
    t = p.read_text()
    for old, new in pairs:
        if old not in t:
            sys.exit(f'patch failed in {name}: {old[:60]!r}')
        t = t.replace(old, new)
    p.write_text(t)

# 1. silence
t = (src / 'Sfx.swift').read_text()
n = t.count('try engine.start()')
assert n == 3, n
t = t.replace('try engine.start()', 'try Sfx.neverStart()')
t = t.replace('  static let shared = Sfx()', '  static let shared = Sfx()\n  /// render copy: the engine never starts, so nothing can sound\n  nonisolated static func neverStart() throws { throw CocoaError(.featureUnsupported) }')
(src / 'Sfx.swift').write_text(t)

# 2. no key from anywhere: no env, no .env.local, no Keychain
patch('Weave.swift', [
    ('  static func value() -> String? {\n    if let key = local() { return key }',
     '  static func value() -> String? {\n    return nil  // render copy: never a key\n    if let key = local() { return key }'),
    ('  static func check(_ key: String) async -> OpenAIKey.Verdict? {\n',
     '  static func check(_ key: String) async -> OpenAIKey.Verdict? {\n    return nil  // render copy: never asks OpenAI\n'),
])
patch('Settings.swift', [
    # Keychain primitives become no-ops in the copy
    ('  private static func copy() -> String? {\n', '  private static func copy() -> String? {\n    return nil  // render copy: never reads the Keychain\n'),
    ('  private static func write(_ key: String) {\n', '  private static func write(_ key: String) {\n    return  // render copy\n'),
    ('  private static func delete() {\n', '  private static func delete() {\n    if true { return }  // render copy\n'),
    # the view: state from a pose, no .task / .onChange (no Keychain, no network)
    ('  @State private var key = ""', '  @State var key = SettingsPose.key'),
    ('  @State private var read = false', '  @State var read = true'),
    ('  @State private var heard: Heard?', '  @State var heard: Heard? = SettingsPose.heard'),
    ('  private enum Heard: Equatable {', '  enum Heard: Equatable {'),
    ('''    .task {
      key = await OpenAIKey.read() ?? ""
      read = true
    }
    .onChange(of: key) { _, k in
      if read { OpenAIKey.keep(k) }
    }
    // asked once the reader pauses, not at every letter
    .task(id: key) { await ask() }
''', '''    // render copy: no Keychain read, no keep, no check with OpenAI
'''),
    ('  @MainActor private static var dry: Set<String> = []', '  @MainActor static var dry: Set<String> = []'),
    ('  private static func digest(_ key: String) -> String {', '  static func digest(_ key: String) -> String {'),
])
# 3. private views made internal for drawing alone
patch('Legend.swift', [
    ('private struct LegendSheet', 'struct LegendSheet'),
    ('private struct KeyCap', 'struct KeyCap'),
    ('private struct CapShape', 'struct CapShape'),
    ('private struct Drawn', 'struct Drawn'),
    ('private enum KeySigns', 'enum KeySigns'),
    ('  private static let all: [LegendKey: [Mark]]', '  static let all: [LegendKey: [Mark]]'),
    ('private struct KeyGlyph', 'struct KeyGlyph'),
    ('  private static let key: [Mark]', '  static let key: [Mark]'),
    ('  private static let space = CGSize(width: 24, height: 24)', '  static let space = CGSize(width: 24, height: 24)'),
])
patch('Keeping.swift', [
    ('private struct TurnMark', 'struct TurnMark'),
    ('  private static let marks: [Int: [Mark]]', '  static let marks: [Int: [Mark]]'),
    ('  private static let space = CGSize(width: 12, height: 24)', '  static let space = CGSize(width: 12, height: 24)'),
    ('  private struct Shelf: Codable {', '  struct Shelf: Codable {'),
    ('  private static let encoder: JSONEncoder', '  static let encoder: JSONEncoder'),
    ('  private static let decoder: JSONDecoder', '  static let decoder: JSONDecoder'),
])
(src / 'SettingsPose.swift').write_text('''import SwiftUI
// render copy only: the state a posed SettingsView opens with
@MainActor enum SettingsPose {
  static var key = ""
  static var heard: SettingsView.Heard? = nil
}
''')
# 4. probes for crops: where the keys' title and lines land; a chevron posed lit
patch('Legend.swift', [
    ("        .arrive(on, 0)\n",
     "        .background(GeometryReader { g in let _ = (LegendProbe.title = g.frame(in: .global)); Color.clear })\n"
     "        .arrive(on, 0)\n"),
    ("            .frame(height: 22)\n            .accessibilityElement(children: .ignore)",
     "            .frame(height: 22)\n"
     "            .background(GeometryReader { g in let _ = (LegendProbe.rows[pair.offset] = g.frame(in: .global)); Color.clear })\n"
     "            .accessibilityElement(children: .ignore)"),
])
patch('Keeping.swift', [
    ("  @State private var hover = false\n\n  static let space = CGSize(width: 12, height: 24)",
     "  @State private var hover = TurnPose.hover\n\n  static let space = CGSize(width: 12, height: 24)"),
])
(src / 'Probes.swift').write_text('''import SwiftUI
// render copy only: frames the keys page reports as it is laid out, and a lit chevron
enum LegendProbe {
  nonisolated(unsafe) static var title: CGRect = .zero
  nonisolated(unsafe) static var rows: [Int: CGRect] = [:]
}
enum TurnPose {
  nonisolated(unsafe) static var hover = false
}
''')
(src / 'ArcanaApp.swift').unlink()  # the tools bring their own entry point
print('patched', len(list(src.glob('*.swift'))), 'files in', src)
