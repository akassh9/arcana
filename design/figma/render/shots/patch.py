#!/usr/bin/env python3
"""Patches the scratch copy of Sources/Arcana (in src/) for offscreen rendering.

Each patch must apply exactly as often as expected, or the build stops: if the
app's code moves, the patch is re-checked instead of silently not applying.
Nothing here ever touches the repo's own files.
"""
import pathlib
import sys

src = pathlib.Path(sys.argv[1])

PATCHES = [
    # Sound: the engine is never started, so nothing can ever be heard.
    ("Sfx.swift", "try engine.start()", "throw ShotSilence.quiet", 3),
    # No key is ever looked for: not in the environment, not in a .env.local,
    # never in the Keychain. Whether the thread is offered is posed per shot
    # (shotThreadable, true by default: the room as it is with a key).
    ("Weave.swift",
     "static var ready: Bool { APIKeyStore.value().map(OpenAIKey.usable) ?? false }",
     "static var ready: Bool { shotThreadable }", 1),
    ("Weave.swift",
     "  static func value() -> String? {\n    if let key = local() { return key }",
     "  static func value() -> String? {\n    if shotNoKeys { return nil }\n    if let key = local() { return key }", 1),
    ("Game.swift", "private(set) var threadable = WeaveService.ready", "var threadable = WeaveService.ready", 1),
    # The shuffle is seeded per shot, so a re-run lays the same cards.
    ("Game.swift",
     "order = deck.map { Draw(card: $0, reversed: Double.random(in: 0..<1) < 0.42) }.shuffled()",
     "order = deck.map { Draw(card: $0, reversed: Double.random(in: 0..<1, using: &shotRNG) < 0.42) }.shuffled(using: &shotRNG)", 1),
    # The bead that swings along the thread while it is being found is pinned
    # (it is otherwise wherever the wall clock puts it).
    ("RootView.swift", "run = 0.5 - 0.5 * cos(now * 1.9)", "run = shotWeaveRun ?? (0.5 - 0.5 * cos(now * 1.9))", 1),
    # What the room's GeometryReader sees (size and safe-area insets), recorded
    # so the real window and the renders can be compared numerically.
    ("RootView.swift", "stage(L, insets: geo.safeAreaInsets)", "stage(L, insets: shotSee(geo.size, geo.safeAreaInsets))", 1),
    # The light that crosses ARCANA for about 2.2 s of every 12 s is held off
    # the word (t = 6 s into its period) unless a shot poses it, so whether
    # the title is lit no longer depends on the second the shot was taken.
    ("RootView.swift",
     "tl.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 12) / 3.2",
     "(shotTitleT ?? tl.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 12)) / 3.2", 1),
    # The pen's composition and its spent touch can be posed.
    ("Quill.swift", "private(set) var marked = \"\"", "var marked = \"\"", 1),
    ("Quill.swift", "private(set) var spentAt: TimeInterval = 0", "var spentAt: TimeInterval = 0", 1),
]

for name, old, new, count in PATCHES:
    p = src / name
    text = p.read_text()
    n = text.count(old)
    if n != count:
        sys.exit(f"patch.py: {name}: expected {count} of {old!r}, found {n}")
    p.write_text(text.replace(old, new))

print(f"patched {len(PATCHES)} places")
