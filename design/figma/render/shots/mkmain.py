#!/usr/bin/env python3
"""Makes work/main.swift from the repo's Tools/shot/main.swift (read, never written).

Changes, each checked to apply exactly once:
  1. shoot() seeds the shuffle (every stage shot deals the same deck order, so
     5-reading, 6-reading-hover, 7-inspect, 10-woven ... show the same cards),
     resets the posed hooks, takes an optional scale, and, with
     ARCANA_SHOT_INSET=<pt>, renders the WINDOW: the room under a top safe
     area of that many points (the hidden title bar), the sky filling it all.
     It prints what the room's GeometryReader saw.
  2. New poses (64- ...) for states no numbered shot shows.
  3. ARCANA_SHOT_MEASURE=1 measures a real offscreen titled window instead.
"""
import pathlib
import sys

repo_main, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
text = repo_main.read_text()

def once(old, new):
    global text
    n = text.count(old)
    if n != 1:
        sys.exit(f"mkmain.py: expected 1 of {old!r}, found {n}")
    text = text.replace(old, new)

SEED = 9

once("""  @MainActor func shoot(_ name: String, size: CGSize = stage, pose: (Game) -> Void) {
    let g = Game()
    pose(g)
    // an ImageRenderer cannot see the near sky's Metal layer; it is drawn as a still
    save(
      name,
      RootView(game: g).frame(width: size.width, height: size.height).environment(\\.stillSky, true),
      scale: stageScale)
  }""",
f"""  @MainActor func shoot(
    _ name: String, size: CGSize = stage, scale: CGFloat? = nil, pose: (Game) -> Void
  ) {{
    guard only.isEmpty || only.contains(where: {{ name.hasPrefix($0) }}) else {{ return }}
    shotRNG = SplitMix(seed: {SEED})
    shotWeaveRun = nil
    shotTitleT = 6.0
    shotThreadable = true
    shotSeen = nil
    let g = Game()
    pose(g)
    // an ImageRenderer cannot see the near sky's Metal layer; it is drawn as a still
    let root = RootView(game: g).environment(\\.stillSky, true)
    if windowInset > 0 {{
      // the window: the stage below the hidden title bar, the sky under it too
      save(
        name,
        root.safeAreaPadding(.top, windowInset).frame(width: size.width, height: size.height),
        scale: scale ?? stageScale)
    }} else {{
      save(name, root.frame(width: size.width, height: size.height), scale: scale ?? stageScale)
    }}
    if let s = shotSeen {{
      print("  seen \\(name): size \\(s.size.width)x\\(s.size.height) insets top \\(s.insets.top) leading \\(s.insets.leading) bottom \\(s.insets.bottom) trailing \\(s.insets.trailing) scale \\(scale ?? stageScale)")
    }}
  }}""")

once("""let stage = CGSize(width: 1260, height: 860)
""", """let stage = CGSize(width: 1260, height: 860)
/// With ARCANA_SHOT_INSET=<pt>, stage shots render the whole window under a hidden title bar that tall.
let windowInset = CGFloat(Double(ProcessInfo.processInfo.environment["ARCANA_SHOT_INSET"] ?? "") ?? 0)
""")

# the measuring mode runs before anything is rendered, and then stops
once("""MainActor.assumeIsolated {
  // what the moon keeps is posed here, never read: no reading of yours is drawn
  Keeping.file = nil
""", """MainActor.assumeIsolated {
  // what the moon keeps is posed here, never read: no reading of yours is drawn
  Keeping.file = nil
  if ProcessInfo.processInfo.environment["ARCANA_SHOT_MEASURE"] == "1" {
    measureWindows(outDir)
    exit(0)
  }
  if ProcessInfo.processInfo.environment["ARCANA_SHOT_SEEDS"] == "1" {
    for seed in UInt64(1)...40 {
      shotRNG = SplitMix(seed: seed)
      let g = Game()
      @MainActor func d(_ i: Int) -> String { g.order[i].card.id + (g.order[i].reversed ? "(R)" : "") }
      print(seed, "three:", [4, 9, 15].map(d).joined(separator: " "), "| one:", d(6), "| five:", [1, 5, 8, 13, 19].map(d).joined(separator: " "))
    }
    exit(0)
  }
""")

EXTRA = r'''
  // ================================================================
  //  Design handoff: states no numbered shot shows (render/shots only)
  // ================================================================

  // the chooser with each of the other two spreads chosen
  shoot("64-chooser-one") { g in g.spreadIndex = 0 }
  shoot("65-chooser-long-road") { g in g.spreadIndex = 2 }
  // the bowl, struck silent
  shoot("66-muted") { g in g.muted = true }
  // the reading after its chord: the closing prompt at the foot
  shoot("67-closing-prompt") { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.sounded = true
  }
  shoot("68-closing-prompt-one") { g in
    read(g, spread: 0, picks: [6])
    g.sounded = true
  }
  shoot("69-closing-prompt-five") { g in
    read(g, spread: 2, picks: [1, 5, 8, 13, 19])
    g.sounded = true
  }
  // the thread being found: 'letting the cards settle', the bead pinned
  // at 0.62 of its swing along the thread
  shoot("70-settling") { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.sounded = true
    g.weaving = true
    shotWeaveRun = 0.62
  }
  // the thread stayed quiet: with 'try again' (the key is still good)…
  shoot("71-thread-quiet-retry") { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.sounded = true
    g.weaveError = true
  }
  // …and without it (OpenAI refused the key, or it ran out of credit)
  shoot("72-thread-quiet") { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.sounded = true
    g.weaveError = true
    g.threadable = false
  }
  // the room with no key at all: the thread is never offered
  shoot("73-reading-no-key") { g in
    shotThreadable = false
    g.threadable = false
    read(g, spread: 1, picks: [4, 9, 15])
    g.sounded = true
  }
  // the line full: a key that found no room, the pen's spent touch at its
  // brightest (0.45) just past the last letter
  shoot("74-spent") { g in
    g.quill.pose(longest, wet: true)
    g.quill.spentAt = Date().timeIntervalSinceReferenceDate + 30
  }
  // an input method composing: the committed part in ink, the composition in gold 75%
  shoot("75-ime-composition") { g in
    g.quill.pose("冬の前に")
    g.quill.marked = "まちをでるべきか"
  }
  // the true minimum stage: a 940 x 660 window under its 32 pt title bar
  let minimum = CGSize(width: 940, height: 628)
  shoot("76-min-stage", size: minimum) { _ in }
  shoot("77-min-stage-draw", size: minimum) { g in
    g.phase = .draw
    g.dealt = true
  }
  shoot("78-min-stage-reading", size: minimum) { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.sounded = true
  }
  shoot("79-min-stage-five", size: minimum) { g in
    read(g, spread: 2, picks: [1, 5, 8, 13, 19])
    g.sounded = true
  }
  // large windows: a MacBook Pro 16 screen (1728 x 1117) at @2x, and a
  // 2560 x 1440 display at @1.5x (so it stays within 4096 px)
  let mbp = CGSize(width: 1728, height: 1117)
  let qhd = CGSize(width: 2560, height: 1440)
  shoot("80-large-1728", size: mbp, scale: 2) { _ in }
  shoot("81-large-1728-reading", size: mbp, scale: 2) { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.sounded = true
  }
  shoot("82-large-1728-draw", size: mbp, scale: 2) { g in
    g.phase = .draw
    g.dealt = true
  }
  shoot("83-large-2560", size: qhd, scale: 1.5) { _ in }
  shoot("84-large-2560-reading", size: qhd, scale: 1.5) { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.sounded = true
  }
  // the light crossing ARCANA, caught mid-word (1.3 s into its 12 s period: k 0.41)
  shoot("86-title-light") { _ in shotTitleT = 1.3 }
  shoot("85-large-2560-altar", size: qhd, scale: 1.5) { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.inspecting = 1
    g.openedAt = long
  }
}
'''
assert text.rstrip().endswith("}")
text = text.rstrip()[:-1] + EXTRA
out.write_text(text)
print("wrote", out)
