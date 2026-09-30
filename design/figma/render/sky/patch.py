#!/usr/bin/env python3
"""Patches the scratch copy of the app's sources in ./src (never the repo's):
opens up the sky's file-private views, puts the sky's clock and tonight's
date in the render tool's hands, adds switches to leave the moon or the near
sky out of the chamber, and keeps the copy away from the Keychain and any key
file. Drawing code is not changed. Every patch must land, or this fails."""
import pathlib, sys
src = pathlib.Path(__file__).parent / "src"

def patch(name, pairs):
    f = src / name
    s = f.read_text()
    for old, new in pairs:
        if old not in s:
            sys.exit(f"patch did not land in {name}: {old!r}")
        s = s.replace(old, new)
    f.write_text(s)

patch("Chamber.swift", [
    ("private struct Mote {", "struct Mote {"),
    ("private let motes:", "let motes:"),
    ("private struct Bloom {", "struct Bloom {"),
    ("private let blooms:", "let blooms:"),
    ("private struct Glint {", "struct Glint {"),
    ("private let glints:", "let glints:"),
    ("private struct Wheel: View {", "struct Wheel: View {"),
    ("private struct SkyAnswers: View {", "struct SkyAnswers: View {"),
    ("private struct Rays: View {", "struct Rays: View {"),
    ("private struct MoonView: View {", "struct MoonView: View {"),
    ("private struct MoonDisc: View {", "struct MoonDisc: View {"),
    ("private struct NearSky: View {", "struct NearSky: View {"),
    # a fixed clock for stills
    ("Heavens.turn(game, Date().timeIntervalSinceReferenceDate)", "Heavens.turn(game, SkyClock.now)"),
    ("      let t = Date().timeIntervalSinceReferenceDate\n", "      let t = SkyClock.now\n"),
    ("let frame = paint(size: geo.size, now: Date().timeIntervalSinceReferenceDate)",
     "let frame = paint(size: geo.size, now: SkyClock.now)"),
    # switches for backdrop-only composites
    ("      MoonView(game: game, center: moon)\n", "      if SkyClock.moon { MoonView(game: game, center: moon) }\n"),
    ("      NearSky(\n        game: game, pointer: pointer, origin: o, focus: layout.deck + o, ringR: layout.ringR,\n        reduceMotion: reduceMotion)\n",
     "      if SkyClock.near { NearSky(\n        game: game, pointer: pointer, origin: o, focus: layout.deck + o, ringR: layout.ringR,\n        reduceMotion: reduceMotion) }\n"),
])
patch("Keeping.swift", [
    ("MoonGlow.strength(Date().timeIntervalSinceReferenceDate - $0)", "MoonGlow.strength(SkyClock.now - $0)"),
])
patch("Moon.swift", [
    ("static var tonight: Moon { Moon(date: Date()) }", "static var tonight: Moon { Moon(date: SkyClock.tonight) }"),
])
# no key is looked for: not in the environment, not in a file, never in the Keychain
patch("Weave.swift", [
    ("  static func value() -> String? {\n    if let key = local() { return key }",
     "  static func value() -> String? {\n    if true { return nil }\n    if let key = local() { return key }"),
])
patch("Settings.swift", [
    ("  @MainActor static func warm() {\n    guard !warmed else { return }",
     "  @MainActor static func warm() {\n    if true { return }\n    guard !warmed else { return }"),
])
# the probe: reads the near sky's own painters, in the file they are private to
probe = (pathlib.Path(__file__).parent / "tool" / "ChamberProbe.swift.part").read_text()
with open(src / "Chamber.swift", "a") as f:
    f.write("\n" + probe)
print("sources patched")
