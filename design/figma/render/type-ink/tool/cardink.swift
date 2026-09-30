import AppKit
import SwiftUI

// Gold cooling to ink on a card: the app's own CardFace / InkFace / InkCanvas
// / FlipCard, posed at chosen moments.

let cardNative = CGSize(width: CardArt.cardW, height: CardArt.cardH)
/// A card in its slot at the default window (3 or 5 cards: slotH capped at 262).
let slotCard = CGSize(width: 262 * 0.565, height: 262)

@MainActor func stripOf(_ imgs: [CGImage], scale: CGFloat, gap: CGFloat = 18) -> some View {
  HStack(spacing: gap) {
    ForEach(0..<imgs.count, id: \.self) { i in Image(decorative: imgs[i], scale: scale) }
  }
  .padding(30)
  .background(Palette.pearl)
}

/// A path as SVG path data, in the coordinates it is drawn in.
func svgPath(_ p: Path) -> String {
  var d = ""
  func f(_ v: CGFloat) -> String {
    let s = String(format: "%.2f", Double(v))
    return s.hasSuffix(".00") ? String(s.dropLast(3)) : s
  }
  p.forEach { e in
    switch e {
    case .move(let a): d += "M\(f(a.x)) \(f(a.y))"
    case .line(let a): d += "L\(f(a.x)) \(f(a.y))"
    case .quadCurve(let a, let c): d += "Q\(f(c.x)) \(f(c.y)) \(f(a.x)) \(f(a.y))"
    case .curve(let a, let c1, let c2): d += "C\(f(c1.x)) \(f(c1.y)) \(f(c2.x)) \(f(c2.y)) \(f(a.x)) \(f(a.y))"
    case .closeSubpath: d += "Z"
    }
  }
  return d
}

@MainActor func renderInk() {
  var meta: [String: Any] = [:]
  let star = Draw(card: deck.first { $0.id == "star" }!, reversed: false)
  let cups6 = Draw(card: deck.first { $0.id == "cups-6" }!, reversed: false)

  // --- a card writing itself: 9 frames, ink 0 → 1 --------------------------------
  let inks = (0...8).map { Double($0) / 8 }
  for (tag, d) in [("the-star", star), ("six-of-cups", cups6)] {
    var small: [CGImage] = []
    for (i, k) in inks.enumerated() {
      save(
        "type-ink/ink/writing-\(tag)-\(i + 1)-of-9-ink-\(String(format: "%.3f", k))@2x.png",
        InkFace(ink: k, draw: d, size: cardNative), scale: 2)
      if let s = bitmap(InkFace(ink: k, draw: d, size: slotCard), scale: 2) { small.append(s) }
    }
    save("type-ink/ink/writing-\(tag)-strip@2x.png", stripOf(small, scale: 2), scale: 2)
  }
  meta["writing"] = [
    "ink_values": inks,
    "time_after_take_s": inks.map { r3(0.46 + 2.1 * inverse(easeInOut, $0)) },
    "note":
      "ink runs 0 → 1 over 2.1 s easeInOut, starting 0.46 s after the card is taken (the flip has turned it 0.16-0.66 s). Within it: the frame is laid over ink 0-0.22 (starts spread over half of it), the art over 0.05-0.92 (starts spread over 62%), the numeral fades in over 0.46-0.74, the name 0.62-0.90, the essence 0.72-1.0, the reversed diamond 0.80-1.0. Each stroke is laid from its start by the nib curve 1 - (1 - t)^2.2, lit at the tip, and cools gold → ink (see stroke-ramp). At ink 1 the live drawing is swapped for the cached raster of the finished face. Individual frames at the card's native 226x400; strips at the slot size of the default window (148x262).",
  ]

  // --- one stroke's cooling ramp -------------------------------------------------------
  let art = CardArt.art(star.card.art)
  func length(_ p: Path) -> CGFloat {
    // a coarse length: the sum of chords over 200 trims
    var total: CGFloat = 0
    var last: CGPoint? = nil
    for i in 0...200 {
      let q = p.trimmedPath(from: 0, to: CGFloat(i) / 200).currentPoint ?? .zero
      if let l = last { total += hypot(q.x - l.x, q.y - l.y) }
      last = q
    }
    return total
  }
  // the longest open stroke in ink, and the largest leaf in gold
  let strokes = art.enumerated().filter { $0.element.stroke == .ink && $0.element.fill == nil }
  let lineIdx = strokes.max { length($0.element.path) < length($1.element.path) }!.offset
  let leaves = art.enumerated().filter { $0.element.fill == .gold }
  let leafIdx = leaves.max {
    $0.element.path.boundingRect.width * $0.element.path.boundingRect.height
      < $1.element.path.boundingRect.width * $1.element.path.boundingRect.height
  }?.offset
  print("stroke ramp: line mark \(lineIdx) of \(art.count), leaf mark \(leafIdx ?? -1)")

  let locals = (0...10).map { Double($0) / 10 }
  var ramps: [[String: Any]] = []
  var svgGroups: [(String, String, CGSize)] = []
  for (tag, idx) in [("line", lineIdx), ("leaf", leafIdx)] {
    guard let idx else { continue }
    let m = art[idx]
    let margin: CGFloat = 8
    let b = m.path.boundingRect.insetBy(dx: -margin, dy: -margin)
    var moved = m
    moved.path = m.path.applying(CGAffineTransform(translationX: -b.minX, y: -b.minY))
    let space = CGSize(width: b.width, height: b.height)
    var frames: [CGImage] = []
    for l in locals {
      // spread 0: this one mark's own progress runs 0 → 1
      let v = InkCanvas(marks: [moved], space: space, progress: l, spread: 0)
        .frame(width: space.width, height: space.height)
        .background(Palette.paper)
      if let img = bitmap(v, scale: 2) { frames.append(img) }
    }
    save("type-ink/ink/stroke-ramp-\(tag)@2x.png", stripOf(frames, scale: 2, gap: 10), scale: 2)
    // the nib close up, at a third, two thirds and nine tenths of the stroke
    var nibs: [CGImage] = []
    for l in [0.3, 0.6, 0.9] {
      let v = InkCanvas(marks: [moved], space: space, progress: l, spread: 0)
        .frame(width: space.width, height: space.height)
        .background(Palette.paper)
      if let img = bitmap(v, scale: 6) { nibs.append(img) }
    }
    save("type-ink/ink/stroke-ramp-\(tag)-detail@6x.png", stripOf(nibs, scale: 6, gap: 10), scale: 6)

    // the same frames as vectors (SVG), exactly the app's geometry and colours
    var svg = ""
    var defs = ""
    let W = space.width
    for (i, l) in locals.enumerated() {
      let x0 = CGFloat(i) * (W + 10)
      let e = 1 - pow(1 - l, 2.2)
      let cool = ramp(l, 0.25, 1)
      let drawn = e >= 0.999 ? moved.path : moved.path.trimmedPath(from: 0, to: e)
      var g = "<g id=\"\(tag)-progress-\(String(format: "%.1f", l))\" transform=\"translate(\(r2(x0)) 0)\">"
      g += "<rect id=\"paper\" x=\"0\" y=\"0\" width=\"\(r2(W))\" height=\"\(r2(space.height))\" fill=\"\(hex(Palette.paper))\"/>"
      if let f = m.fill, l > 0 {
        let a = ramp(l, 0.35, 1)
        if a > 0 {
          if f == .gold {
            let r = moved.path.boundingRect
            let gid = "leaf-\(tag)-\(i)"
            defs += "<linearGradient id=\"\(gid)\" gradientUnits=\"userSpaceOnUse\" x1=\"\(r2(r.minX))\" y1=\"\(r2(r.minY))\" x2=\"\(r2(r.maxX))\" y2=\"\(r2(r.maxY))\">"
            defs += "<stop offset=\"0\" stop-color=\"#F6E08F\"/><stop offset=\"0.42\" stop-color=\"#C9A333\"/><stop offset=\"0.66\" stop-color=\"#E7C761\"/><stop offset=\"1\" stop-color=\"#94701F\"/></linearGradient>"
            g += "<path id=\"gold-leaf\" d=\"\(svgPath(moved.path))\" fill=\"url(#\(gid))\" fill-opacity=\"\(r3(a))\"/>"
          } else {
            g += "<path id=\"fill\" d=\"\(svgPath(moved.path))\" fill=\"\(hex(Palette.of(f)))\" fill-opacity=\"\(r3(a))\"/>"
          }
        }
      }
      if let st = m.stroke, l > 0 {
        let sw = r2(m.width)
        let common = "fill=\"none\" stroke-width=\"\(sw)\" stroke-linecap=\"round\" stroke-linejoin=\"round\""
        if cool < 1 {
          g += "<path id=\"wet-gold\" d=\"\(svgPath(drawn))\" \(common) stroke=\"\(hex(Palette.gold))\" stroke-opacity=\"\(r3(1 - cool))\"/>"
        }
        if cool > 0 {
          g += "<path id=\"ink\" d=\"\(svgPath(drawn))\" \(common) stroke=\"\(hex(Palette.of(st)))\" stroke-opacity=\"\(r3(cool))\"/>"
        }
        if l < 1 {
          let tip = moved.path.trimmedPath(from: max(0, e - 0.06), to: e)
          g += "<path id=\"nib\" d=\"\(svgPath(tip))\" fill=\"none\" stroke-width=\"\(r2(m.width * 2.4))\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"\(hex(Palette.goldLit))\" stroke-opacity=\"\(r3(0.9 * (1 - l)))\"/>"
        }
      }
      g += "</g>"
      svg += g
    }
    let total = CGSize(width: CGFloat(locals.count) * (W + 10) - 10, height: space.height)
    svgGroups.append((tag, svg, total))
    let body =
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"\(r2(total.width))\" height=\"\(r2(total.height))\" viewBox=\"0 0 \(r2(total.width)) \(r2(total.height))\">\(defs.isEmpty ? "" : "<defs>\(defs)</defs>")<g id=\"stroke-ramp-\(tag)\">\(svg)</g></svg>"
    let url = URL(fileURLWithPath: "\(outRoot)/type-ink/ink/stroke-ramp-\(tag).svg")
    try? body.write(to: url, atomically: true, encoding: .utf8)
    print("✓ type-ink/ink/stroke-ramp-\(tag).svg \(r2(total.width))x\(r2(total.height)) pt")
    ramps.append([
      "tag": tag, "mark_index": idx, "stroke": m.stroke.map { "\($0)" } ?? "none",
      "fill": m.fill.map { "\($0)" } ?? "none", "width_pt": r2(m.width),
      "frame_pt": [r2(space.width), r2(space.height)],
      "frames": locals.map { l -> [String: Any] in
        let e = 1 - pow(1 - l, 2.2)
        return [
          "progress": l, "laid": r3(e), "wet_gold_opacity": r3(1 - ramp(l, 0.25, 1)),
          "ink_opacity": r3(ramp(l, 0.25, 1)), "nib_opacity": l < 1 ? r3(0.9 * (1 - l)) : 0,
          "fill_opacity": m.fill == nil ? 0 : r3(ramp(l, 0.35, 1)),
        ]
      },
    ])
  }
  meta["stroke_ramp"] = [
    "card": "The Star (art space 186x248; drawn on the face at 1:1)",
    "rule":
      "One mark's own progress p 0 → 1: the stroke is laid to e = 1 - (1 - p)^2.2 of its length; it is drawn twice, in gold \(hex(Palette.gold)) at 1 - c and in its ink at c, c = smoothstep(0.25, 1, p); the nib is the last 6% of the laid length stroked 2.4x as wide in goldLit \(hex(Palette.goldLit)) at 0.9 (1 - p). A filled mark fades in at smoothstep(0.35, 1, p); gold fills are leaf (the four-stop gradient across the shape's box).",
    "marks": ramps,
  ]

  // --- given back: the face sinking into the stock ------------------------------------------
  let sinks = (0...5).map { Double($0) / 5 }
  var small: [CGImage] = []
  for (i, k) in sinks.enumerated() {
    let s = pow(k, 1.8)
    save(
      "type-ink/ink/sink-the-star-\(i + 1)-of-6@2x.png", InkFace(ink: 1, draw: star, size: cardNative, sink: s),
      scale: 2)
    if let img = bitmap(InkFace(ink: 1, draw: star, size: slotCard, sink: s), scale: 2) { small.append(img) }
  }
  save("type-ink/ink/sink-the-star-strip@2x.png", stripOf(small, scale: 2), scale: 2)
  meta["sink"] = [
    "window_progress": sinks, "sink": sinks.map { r3(pow($0, 1.8)) },
    "note":
      "While the cards are held to be returned, each face's raster fades (opacity 1 - sink) off the pressed blank beneath it: the heavy lines left as grooves, the leaf left where it was laid, the type gone. sink = (progress through the card's own window)^1.8. Windows: one card 0.30-0.84 of the 3.2 s hold; for n cards each is two staggers long (stagger 0.54/(n+1)), the last drawn going first. Remembering a kept reading runs it backwards.",
  ]

  // --- the flip: taken (back → face) and returned (face → back) ------------------------------
  func flipFrames(_ tag: String, forward: Bool) {
    var imgs: [CGImage] = []
    var rows: [[String: Any]] = []
    for i in 0..<5 {
      // quarter steps in time, but the middle one a hair before the edge (at 0.25 s the card is
      // exactly edge-on and nothing shows)
      let t = [0, 0.125, 0.24, 0.375, 0.5][i]
      let a = 180 * easeInOut(t / 0.5)
      let angle = forward ? a : 180 - a
      // taken: the ink begins 0.30 s into the flip (0.46 s after the take)
      let ink = forward ? easeInOut(clamp01((t - 0.30) / 2.1)) : 1
      let v = FlipCard(angle: angle, draw: star, size: slotCard, ink: ink, sink: forward ? 0 : 1)
        .shadow(color: Palette.shade.opacity(0.35), radius: 18, x: 0, y: 11)
        .padding(.horizontal, 20).padding(.top, 20).padding(.bottom, 44)
      let name = "type-ink/ink/flip-\(tag)-\(i + 1)-of-5@2x.png"
      if let img = save(name, v.background(Palette.pearl), scale: 2) { imgs.append(img) }
      rows.append(["png": name, "t_s": r3(t), "angle_deg": r3(angle), "ink": r3(ink)])
    }
    save("type-ink/ink/flip-\(tag)-strip@2x.png", stripOf(imgs, scale: 2, gap: 0), scale: 2)
    meta["flip_\(tag)"] = rows
  }
  flipFrames("taken", forward: true)
  flipFrames("returned", forward: false)
  meta["flip_note"] =
    "A 3D turn about the vertical axis (rotation3DEffect, perspective 0.4), 0.5 s easeInOut; the back is shown below 90° and the face from 90° (turned 180° so it reads). Taken: it starts 0.16 s after the click; returned: once every face has sunk. Frames at 0, 0.125, 0.24, 0.375, 0.5 s: the middle one sits 0.01 s before the edge (at 0.25 s the card is exactly edge-on and nothing shows). In the room the card also carries its slot's ±0.7° tilt and the placed-card shadow (shade@35%, blur 18, y 11), drawn here."
  writeJSON(meta, "type-ink/ink/ink.json")
}
