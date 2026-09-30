import AppKit
import SwiftUI
@testable import ArcanaKit

// ===================================================================
//  The pen's vocabulary: every primitive at its defaults, the weights,
//  and one line under six seeds.
// ===================================================================

@MainActor func buildPen() {
  let cell = CGSize(width: 80, height: 80)
  // each primitive on a pen of its own, seeded by its name
  let prims: [(String, String, (inout Pen) -> Void)] = [
    ("line", "line(12, 40, 68, 40): one bowed stroke, 1.5 pt ink, amp 1.1", { $0.line(12, 40, 68, 40) }),
    ("ring", "ring(40, 40, 26): a closed round of 22 nudged points through Catmull-Rom, 1.5 pt, amp 1.3", { $0.ring(40, 40, 26) }),
    ("ring-squashed", "ring(40, 40, 26, squash: 0.45): the same, flattened (an ellipse seen edge-on)", { $0.ring(40, 40, 26, squash: 0.45) }),
    ("dot", "dot(40, 40, 12): a small disc of gold leaf with a 0.8 pt ink keyline (default colour gold)", { $0.dot(40, 40, 12) }),
    ("dot-ink", "dot(40, 40, 6, c: .ink): an ink dot, no keyline", { $0.dot(40, 40, 6, c: .ink) }),
    ("poly", "poly([[14,62],[40,16],[66,62]]): straight edges bowed a hair, sharp vertices, 1.5 pt", { $0.poly([[14, 62], [40, 16], [66, 62]]) }),
    ("poly-open", "poly(…, closed: false): an open zigzag", { $0.poly([[12, 56], [28, 26], [44, 56], [60, 26], [70, 44]], closed: false) }),
    ("fillPoly", "fillPoly([…]): a leaf-gilded polygon with its ink keyline (default gold)", { $0.fillPoly([[16, 60], [22, 22], [58, 18], [64, 58]]) }),
    ("fillPoly-accent", "fillPoly([…], .accent): an oxblood polygon, no outline", { $0.fillPoly([[18, 58], [40, 18], [62, 58]], .accent) }),
    ("smooth", "smooth([…]): a closed Catmull-Rom curve through the points, no jitter, 1.5 pt", { $0.smooth([[40, 12], [66, 30], [58, 64], [22, 64], [14, 30]]) }),
    ("smooth-open", "smooth([…], closed: false): an open curve", { $0.smooth([[10, 52], [26, 26], [44, 50], [60, 28], [72, 40]], closed: false) }),
    ("fillSmooth", "fillSmooth([…]): a gilded rounded shape with keyline (default gold, outline on)", { $0.fillSmooth([[40, 12], [60, 40], [40, 68], [20, 40]]) }),
    ("fillChord", "fillChord([…], .gold): a curve closed by one straight chord (a half disc)", { p in
      p.fillChord((0...8).map { i in let a = Double(i) / 8 * .pi; return [40 + cos(a) * 28, 30 + sin(a) * 28] }, .gold)
    }),
    ("fillSmoothPts", "fillSmoothPts([…], .paper, outline: true): a filled round shape from points, here paper with an ink outline", { p in
      let pts = p.ringPoints(40, 40, 24)
      p.fillSmoothPts(pts, .paper, outline: true)
    }),
    ("diamond", "diamond(40, 40, 18): an outlined lozenge, 1.1 pt oxblood (default accent), amp 1", { $0.diamond(40, 40, 18) }),
    ("fillDiamond", "fillDiamond(40, 40, 10, 14): a solid oxblood lozenge (default accent)", { $0.fillDiamond(40, 40, 10, 14) }),
    ("fillDiamond-gold", "fillDiamond(40, 40, 10, 14, .gold): the same in leaf with keyline", { $0.fillDiamond(40, 40, 10, 14, .gold) }),
    ("rays", "rays(40, 40, 10, 32, 12): twelve strokes out from a centre, 1.5 pt", { $0.rays(40, 40, 10, 32, 12) }),
    ("hatch", "hatch(12, 12, 56, 56): parallel strokes clipped to a box, gap 5, angle -0.6, 0.75 pt", { $0.hatch(12, 12, 56, 56) }),
    ("ticks", "ticks(40, 40, 22, 8, 24): short strokes round a circle, 0.8 pt", { $0.ticks(40, 40, 22, 8, 24) }),
    ("ripples", "ripples(80, 24): four wavy lines, each inset 5 pt more, 9 pt apart, 1.1 pt", { $0.ripples(80, 24) }),
    ("crescent", "crescent(40, 40, 24, bite: 14): a disc less the same disc moved along x, in leaf (default gold)", { $0.crescent(40, 40, 24, bite: 14) }),
    ("eye", "eye(40, 40, 26, 12): a gilded almond with an ink pupil", { $0.eye(40, 40, 26, 12) }),
  ]
  var cells: [Glyph] = []
  var legend: [String] = []
  for (name, what, draw) in prims {
    let seed = seedHash("pen-" + name)
    var p = Pen(seed: seed)
    draw(&p)
    let g = Glyph(name: "pen-" + name, size: cell, items: items(p.marks, .card))
    cells.append(g)
    legend.append(name)
    emit(
      g, "pen",
      Meta(
        title: "Pen · \(name)", description: "Pen." + what + ". Drawn on its own pen, seed seedHash(\"pen-\(name)\") = \(seed).",
        group: "Pen vocabulary", source: "Sources/Arcana/Ink.swift:77-325",
        states: "card inks: ink #15110E, oxblood #8C2E25, gold as leaf (4-stop Palette.leaf across the shape's box, top-left → bottom-right) with a 0.8 pt ink keyline, paper #F3EDE0",
        hint: "component in an 80×80 cell", caveats: "The wobble is this seed's; any other seed draws the same call a little differently."))
  }
  // check the conversion against MarksCanvas itself on a gilded one
  do {
    var p = Pen(seed: seedHash("pen-eye"))
    p.eye(40, 40, 26, 12)
    check("pen-eye", MarksCanvas(marks: p.marks, space: cell), against: registry["pen-eye"]!)
  }
  let sh = sheet("pen-primitives-sheet", cells, cols: 6, cell: cell, gap: 8, margin: 16, ground: P.paper)
  emit(
    sh, "pen",
    Meta(
      title: "The pen's primitives",
      description: "Every Pen primitive at its default settings, on card paper, in 80 pt cells, left to right and top to bottom: " + legend.joined(separator: ", ") + ". The pen bows every stroke and nudges every vertex with a seeded generator, so a drawing is identical each time and never mechanical.",
      group: "Pen vocabulary", source: "Sources/Arcana/Ink.swift:77-325",
      states: "static", hint: "sheet frame; the 'ground' rect is the card paper and can be hidden",
      caveats: "Cell labels are not in the SVG (no text); the order above names them. Each group is named after its primitive."),
    preview: true)

  // --- weights --------------------------------------------------------------
  let weights: [CGFloat] = [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6]
  var its: [Item] = []
  for (k, w) in weights.enumerated() {
    var p = Pen(seed: 7)
    let y = 24 + Double(k) * 22
    p.line(24, y, 296, y, w: w)
    its += moved(items(p.marks, .card, group: "stroke"), 0, 0, cell: "w-" + num(w).replacingOccurrences(of: ".", with: "_"))
  }
  let ladder = Glyph(name: "pen-stroke-ladder", size: CGSize(width: 320, height: 24 * 2 + 9 * 22), items: its, ground: P.paper)
  emit(
    ladder, "pen",
    Meta(
      title: "Stroke weights 0.8 – 2.6 pt",
      description: "The same 272 pt pen line (seed 7, so every rung bows alike) at 0.8, 1.0 … 2.6 pt, round caps, card ink on paper. On a card the frame's hairlines are 0.8-1.1, most drawing 1.1-1.6, heavy staves and swords 1.8-3.2; the 0.8 pt keyline sits round every leaf.",
      group: "Pen vocabulary", source: "Sources/Arcana/Ink.swift:101-107 (line), 37-42 (Mark.width)",
      states: "static", hint: "sheet frame (ground hideable)",
      caveats: "Card art is drawn in the 226×400 card space and shown scaled (a three-card slot is about 145 pt wide, so 0.64×), so on screen these weights read thinner."),
    preview: true)

  // --- seeds -----------------------------------------------------------------
  var sits: [Item] = []
  for s in 1...6 {
    let y = 34 + Double(s - 1) * 52
    var p = Pen(seed: UInt32(s))
    p.line(20, y, 140, y)
    sits += moved(items(p.marks, .card, group: "line"), 0, 0, cell: "seed-\(s)")
    var q = Pen(seed: UInt32(s))
    q.ring(196, y, 20)
    sits += moved(items(q.marks, .card, group: "ring"), 0, 0, cell: "ring-seed-\(s)")
  }
  let wob = Glyph(name: "pen-seed-wobble", size: CGSize(width: 240, height: 34 * 2 + 5 * 52), items: sits, ground: P.paper)
  emit(
    wob, "pen",
    Meta(
      title: "One line, six seeds",
      description: "Six rows, seeds 1 to 6: on the left Pen(seed).line over 120 pt at the defaults (1.5 pt, amp 1.1) — each seed bows the stroke and moves its ends a little differently; on the right a fresh pen of the same seed draws ring(r 20). A card's seed is seedHash(its name) ^ 0x9E3779B9, so each card is always drawn the same way.",
      group: "Pen vocabulary", source: "Sources/Arcana/Ink.swift:10-33 (Rng, seedHash), 85-107",
      states: "static", hint: "sheet frame (ground hideable)", caveats: ""),
    preview: true)
}
