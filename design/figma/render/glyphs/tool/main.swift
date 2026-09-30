import AppKit
import SwiftUI
@testable import ArcanaKit

// glyphs <assets/glyphs> <render/glyphs/ref>
// Writes every small drawn thing of Arcana as SVG, with @3x previews of the
// sheets, a manifest, and reference stills of the app's own views.

_ = NSApplication.shared

MainActor.assumeIsolated {
  Keeping.file = nil  // never the user's readings (the copy in ./src has it nil already)

  buildUI()
  buildPen()
  buildSuits()

  // --- the sheets of the room's glyphs ----------------------------------------
  let small = [
    "bowl-sound-on", "bowl-muted", "key-glyph-rest", "key-glyph-lit", "chevron-left-rest", "chevron-left-hover",
    "chevron-right-rest", "chevron-right-hover", "spent-dot",
    "key-sign-left", "key-sign-right", "key-sign-up", "key-sign-command", "key-sign-delete", "key-sign-comma",
    "thread-glyph-8", "thread-glyph-7", "diamond-folio",
    "diamond-prompt-pip-taken", "diamond-prompt-pip-open", "diamond-spread-pip-chosen", "diamond-spread-pip",
    "diamond-keyword", "diamond-reversed", "thread-node-empty", "thread-node-growing", "thread-node", "thread-node-lit",
  ].map { registry[$0]! }
  let ui = sheet("ui-glyphs-sheet", small, cols: 9, cell: CGSize(width: 64, height: 64), gap: 8, ground: P.pearl)
  emit(
    ui, "ui",
    Meta(
      title: "The room's glyphs", description: "The small drawn things of the room at their real size on the pearl ground, left to right, top to bottom: " + small.map(\.name).joined(separator: ", ") + ".",
      group: "UI glyphs", source: "see each glyph", states: "each in the state its name gives",
      hint: "sheet frame (ground hideable)", caveats: "Glows that are SwiftUI shadows (lit key, hovered chevrons, chosen spread pips, folio) are not in the SVG; the thread nodes' glows are gradients and are."),
    preview: true)

  let threads = [1, 3, 5].flatMap { n in
    (n == 1 ? ["draw", "reading", "reading-lit", "woven", "kept"] : ["draw", "reading", "reading-lit", "woven", "running", "kept"]).map {
      registry["thread-\(n)-\($0)"]!
    }
  }
  let ts = sheet("thread-sheet", threads, cols: 1, cell: CGSize(width: 1260, height: 72), gap: 0, margin: 0, ground: P.pearl)
  emit(
    ts, "ui/thread",
    Meta(
      title: "The thread, every state", description: "The thread for one, three and five cards, top to bottom: " + threads.map(\.name).joined(separator: ", ") + ". Each row is a 1260×72 band centred on the thread.",
      group: "Thread", source: "Sources/Arcana/RootView.swift:506-633", states: "see rows", hint: "sheet frame (ground hideable)", caveats: ""),
    preview: true)

  let halos = ["halo-1-rest", "halo-3-draw", "halo-3-rest", "halo-3-read", "halo-3-flare", "halo-5-rest"].map { registry[$0]! }
  var hs = sheet("halo-sheet", halos, cols: 3, cell: CGSize(width: 540, height: 620), gap: 0, margin: 0, ground: RGBA(Palette.skyBlue))
  hs.name = "halo-sheet"
  emit(
    hs, "ui/halo",
    Meta(
      title: "Halos over the sky", description: "The six halos on the sky's blue (Palette.skyBlue #CCDBF5): " + halos.map(\.name).joined(separator: ", ") + ". In the preview each is screened onto the blue as in the app.",
      group: "Halos", source: "Sources/Arcana/RootView.swift:467-500", states: "see cells", hint: "sheet frame; set each halo to SCREEN",
      caveats: "The SVG cannot say 'screen'; in the SVG the halos are normal-blended, so they read darker there than in the @3x preview."),
    preview: true)

  writeManifest(
    notes: """
      Every glyph here is drawn from the app's own code paths: the Pen marks are the static [Mark] arrays and helpers of \
      the sources (seeds as the app uses them), converted path element by element (Path.forEach) into SVG; gold fills \
      carry Palette.leaf as a userSpaceOnUse linearGradient from the shape's own box's top-left to bottom-right corner, \
      as MarksCanvas does. Shapes that are not the pen's (the Brackets, the rotated-square diamonds, the thread and \
      halos) are rebuilt from the same formulas and checked against the app's views rendered by ImageRenderer \
      (ref/diffs.txt in the tool folder: pen glyphs, caps, brackets, the thread and a whole Queen of Cups art match \
      to the pixel). 25 SVGs covering every kind (pen strokes at opacity, leaf gradients, CapShape quads, rotated-rect \
      diamonds, gradient strokes, radial glows, halos, sheets with grounds) were imported into Figma with \
      createNodeFromSvg, exported @3x and compared with the SwiftUI drawing: mean channel difference 0.001-1.4 of 255, \
      edge anti-aliasing only. Colours are sRGB hex \
      with opacity on the paint. SVG frames import with a white fill and clipping on: clear the frame fill. Frames \
      of stroked outlines that touch their box (keycaps, brackets, tiles) are inset 1 pt so the stroke is not clipped. \
      Glows that the app draws as SwiftUI shadows are not in the SVGs (no filters); each item's figma_hint gives the \
      effect to add. Layout numbers are for the default 1260×828 stage (1260×860 window under a 32 pt title bar). \
      Not in this family: the hold ring and charge arc (Metal, sky), the card frame and reverse marks (cards), the \
      fallback icon's marks (brand).
      """,
    tool:
      "cd design/figma/render/glyphs && ./run.sh   (prepares ./src from Sources/Arcana, builds ArcanaKit + the tool, writes assets/glyphs and ref/)"
  )
  try! diffs.joined(separator: "\n").write(to: refDir.appendingPathComponent("diffs.txt"), atomically: true, encoding: .utf8)
  print("✓ \(manifest.count) items")
}
