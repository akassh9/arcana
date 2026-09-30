import AppKit
import SwiftUI
@testable import ArcanaKit

// ===================================================================
//  The room's small drawn things, from the app's own marks and shapes.
// ===================================================================

let stage = CGSize(width: 1260, height: 828)  // the default window's stage, under its 32 pt title bar
let long = Date().timeIntervalSinceReferenceDate - 60

/// A square turned 45°, as Rectangle().rotationEffect(.degrees(45)) lays it.
func turned(_ c: CGPoint, _ side: CGFloat, _ color: RGBA, id: String? = nil, group: String = "diamond") -> Item {
  let r = CGRect(x: c.x - side / 2, y: c.y - side / 2, width: side, height: side)
  return Item(path: Path(r), fill: .solid(color), group: group, id: id, form: .rect(r, rotate: 45))
}

func glowStops(_ a: Double) -> [(RGBA, Double)] { [(P.goldLit.o(a), 0), (P.goldLit.o(0), 1)] }

/// A thread node as the Canvas lays it: a diamond of half-diagonal `s`,
/// filled and then lit over by its glow, or, before its card lands, outlined.
func node(_ x: CGFloat, _ y: CGFloat, lit: Bool, grown g: Double, kept: Bool = false, group: String = "node")
  -> [Item]
{
  let s: CGFloat = lit ? 5.5 : 4.2
  var d = Path()
  d.move(to: CGPoint(x: x, y: y - s))
  d.addLine(to: CGPoint(x: x + s, y: y))
  d.addLine(to: CGPoint(x: x, y: y + s))
  d.addLine(to: CGPoint(x: x - s, y: y))
  d.closeSubpath()
  if g > 0 || kept {
    let gg = kept ? 1 : g
    let glow = CGFloat(lit ? 26.0 : 14.0) * gg
    let c = CGPoint(x: x, y: y)
    return [
      Item(path: d, fill: .solid(P.goldInk.o(kept ? 0.95 : 0.35 + 0.6 * g)), group: group, id: "diamond"),
      Item(
        path: Path(ellipseIn: CGRect(x: x - glow, y: y - glow, width: glow * 2, height: glow * 2)),
        fill: .radial(glowStops(0.6 * gg), c, glow), group: group, id: "glow",
        form: .ellipse(CGRect(x: x - glow, y: y - glow, width: glow * 2, height: glow * 2))),
    ]
  }
  return [
    Item(path: d, stroke: .solid(P.goldInk.o(0.4)), width: 0.8, cap: .butt, join: .miter, group: group, id: "outline")
  ]
}

/// The thread under the spread, as RootView's Thread (and KeptThread) lays
/// it on its 40 pt canvas: wings or segments, a node under every position,
/// and the light that runs it.
func threadItems(
  xs: [CGFloat], y: CGFloat, slotW: CGFloat, base: Double, grown: [Double], lit: Int?, run: Double? = nil,
  kept: Bool = false
) -> [Item] {
  var out: [Item] = []
  if xs.count == 1, let x = xs.first {
    let w = slotW * 0.55 * grown[0]
    for dir in [-1.0, 1.0] {
      var p = Path()
      p.move(to: CGPoint(x: x + dir * 10, y: y))
      p.addLine(to: CGPoint(x: x + dir * (10 + w), y: y))
      out.append(
        Item(
          path: p,
          stroke: .linear(
            [(P.goldInk.o(base), 0), (P.goldInk.o(0), 1)], CGPoint(x: x, y: y), CGPoint(x: x + dir * (10 + w), y: y)),
          width: 1, cap: .butt, join: .miter, group: "line", id: dir < 0 ? "wing-left" : "wing-right"))
    }
  }
  for k in 0..<max(0, xs.count - 1) {
    let g = grown[k + 1]
    guard g > 0 else { continue }
    let a = xs[k] + 9, b = xs[k + 1] - 9
    var p = Path()
    p.move(to: CGPoint(x: a, y: y))
    p.addLine(to: CGPoint(x: a + (b - a) * g, y: y))
    out.append(
      Item(path: p, stroke: .solid(P.goldLit.o(base * 0.45)), width: 5, cap: .butt, join: .miter, group: "line",
        id: "segment-\(k + 1)-light"))
    out.append(
      Item(path: p, stroke: .solid(P.goldInk.o(base)), width: 1, cap: .butt, join: .miter, group: "line",
        id: "segment-\(k + 1)-ink"))
  }
  for (i, x) in xs.enumerated() {
    out += node(x, y, lit: lit == i, grown: grown[i], kept: kept, group: "node-\(i + 1)")
  }
  if let r = run, let first = xs.first, let last = xs.last, xs.count > 1 {
    let e = r * r * (3 - 2 * r)
    let x = first + (last - first) * e
    let fade = min(1, min(r, 1 - r) * 6)
    for (rad, a) in [(34.0, 0.30), (12.0, 0.55), (2.6, 1.0)] {
      let rc = CGRect(x: x - rad, y: y - rad, width: rad * 2, height: rad * 2)
      out.append(
        Item(path: Path(ellipseIn: rc), fill: .radial(glowStops(a * fade), CGPoint(x: x, y: y), rad), group: "bead",
          id: "bead-\(num(rad))", form: .ellipse(rc)))
    }
    var trail = Path()
    trail.move(to: CGPoint(x: max(first, x - 90), y: y))
    trail.addLine(to: CGPoint(x: x, y: y))
    out.append(
      Item(
        path: trail,
        stroke: .linear(
          [(P.goldInk.o(0), 0), (P.goldInk.o(0.8 * fade), 1)], CGPoint(x: max(first, x - 90), y: y),
          CGPoint(x: x, y: y)),
        width: 1.4, cap: .butt, join: .miter, group: "bead", id: "trail"))
  }
  return out
}

/// The app's own view with the glow an SVG cannot carry, on pearl, as a PNG asset.
@MainActor func glowRef<V: View>(_ name: String, _ dir: String, _ view: V, pt: CGSize, _ m: Meta) {
  let url = assets.appendingPathComponent(dir).appendingPathComponent(name + "@3x.png")
  let size = CGSize(width: pt.width + 28, height: pt.height + 28)
  png(view.frame(width: pt.width, height: pt.height).frame(width: size.width, height: size.height).background(Palette.pearl), scale: 3, to: url)
  manifest.append(
    item(url, kind: "png", px: [Int(size.width * 3), Int(size.height * 3)], scale: 3, pt: size, vector: false, m))
}

@MainActor func buildUI() {
  let text = P.text, gi = P.goldInk
  let G = "UI glyphs"

  // --- the bowl --------------------------------------------------------
  let bs: CGFloat = 26.0 / 24.0  // MarksCanvas scales the 24 pt space into its 26 pt frame
  func bowl(_ on: Bool) -> Glyph {
    let ink = text.o(on ? 0.5 : 0.3)
    var its = items(BowlGlyph.bowl, .only(ink), s: bs, group: "bowl", ids: ["rim", "bowl", "foot"])
    if on { its += items(BowlGlyph.note, .only(ink), s: bs, group: "note", ids: ["note-low", "note-high"]) }
    return Glyph(name: on ? "bowl-sound-on" : "bowl-muted", size: CGSize(width: 26, height: 26), items: its)
  }
  for on in [true, false] {
    let g = bowl(on)
    emit(
      g, "ui",
      Meta(
        title: on ? "Bowl · sound on" : "Bowl · muted",
        description: on
          ? "The sound toggle, top right of the room (18 pt in from the corner): a singing bowl drawn by the pen, with two arcs of its note rising off it while the room is heard. Text ink at 50%."
          : "The sound toggle when the room is muted: the bowl alone, its note gone, at 30% text ink.",
        group: G, source: "Sources/Arcana/RootView.swift:1612-1644 (marks 1617-1630; seeds 404, 405)",
        states: on
          ? "sound on (rest). Muting fades the note out and the bowl from 50% to 30% over 0.35 s ease-out. There is no hover look: a plain SwiftUI button, arrow cursor, only the system's pressed dim."
          : "muted (rest). No hover look.",
        hint: "component (variant of 'bowl'); 26×26 hit frame",
        caveats:
          "Stroke widths are the marks' own (1.05/1.0/0.9 pt) times 26/24, because MarksCanvas scales its 24 pt space into the 26 pt frame. Each stroke is its own layer at the ink's opacity, so where two strokes cross the ink doubles, as in the app."))
    check(g.name, BowlGlyph(ringing: on), against: g)
  }

  // --- the old key ---------------------------------------------------------
  let keyIds = ["bow", "shank", "collar", "bit-1", "bit-2", "bit-3", "bit-4", "bit-5"]
  for lit in [false, true] {
    let g = Glyph(
      name: lit ? "key-glyph-lit" : "key-glyph-rest", size: CGSize(width: 26, height: 26),
      items: items(KeyGlyph.key, .only(lit ? gi : text.o(0.5)), s: bs, group: "key", ids: keyIds))
    emit(
      g, "ui",
      Meta(
        title: lit ? "Old key · lit (keys open)" : "Old key · rest",
        description: lit
          ? "The same key in gold ink while the keys page is open, with a gold light around it."
          : "Top left of the room (18 pt in), where the bowl is top right: an old key turned 45° as in a lock, bow low and bit high. It opens the keys page (also ? or ⌘/) and closes it.",
        group: G, source: "Sources/Arcana/Legend.swift:337-377 (marks 342-365; seed 421)",
        states: lit
          ? "lit: goldInk #8F6C21 at 100% plus glow goldLit #ECCE6E 80%, SwiftUI shadow radius 6. Cross-fades with the rest state over 0.35 s ease-out."
          : "rest: text #26201C at 50%. No hover look (plain button, arrow cursor).",
        hint: lit
          ? "component variant; add effect Drop shadow #ECCE6E 80%, x 0 y 0, blur ≈ 12 (SwiftUI radius 6; check against key-glyph-lit reference)"
          : "component; 26×26 hit frame",
        caveats: "Strokes are the marks' widths (0.95-1.05 pt) × 26/24. The SVG has no glow; SVG filters are not used."))
    check(g.name, MarksCanvas(marks: KeyGlyph.key, space: KeyGlyph.space, tint: .only(lit ? Palette.goldInk : Palette.text.opacity(0.5))), against: g)
  }
  glowRef(
    "key-glyph-lit-app", "ui", KeyGlyph(lit: true).frame(width: 26, height: 26), pt: CGSize(width: 26, height: 26),
    Meta(
      title: "Old key · lit (app render @3x, with its glow)",
      description: "The app's own KeyGlyph(lit: true) on pearl, glow included — the picture to match the Figma effect to.",
      group: G, source: "Sources/Arcana/Legend.swift:367-376", states: "lit", hint: "image; place beside key-glyph-lit",
      caveats: "The frame is the 26×26 glyph with 14 pt of pearl round it so the glow shows."))

  // --- the signs on the keys ---------------------------------------------
  let signs: [(LegendKey, String, String)] = [
    (.left, "left", "left arrow (seed 703)"), (.right, "right", "right arrow (seed 701)"),
    (.up, "up", "up arrow (seed 704)"), (.command, "command", "⌘: four loops on a square (seed 705)"),
    (.delete, "delete", "⌫: a tag pointing back, crossed out (seed 706)"),
    (.comma, "comma", "the comma as a drop of ink, ring within ring, with a tail (seed 707)"),
  ]
  func signItems(_ k: LegendKey, at o: CGPoint = .zero) -> [Item] {
    // Drawn strokes every mark as one path, 0.95 pt, round, text at 74%
    var one = Path()
    for m in KeySigns.marks(k) { one.addPath(m.path) }
    return [
      Item(
        path: one.applying(CGAffineTransform(translationX: o.x, y: o.y)), stroke: .solid(text.o(0.74)), width: 0.95,
        group: "sign", id: "sign")
    ]
  }
  for (k, n, what) in signs {
    let g = Glyph(name: "key-sign-\(n)", size: CGSize(width: 10, height: 10), items: signItems(k))
    emit(
      g, "ui/keys",
      Meta(
        title: "Key sign · \(n)",
        description: "A sign on the keys page, drawn by the pen in place of a typeset symbol: \(what). Sits centred in its 22×22 keycap.",
        group: "Keys page", source: "Sources/Arcana/Legend.swift:254-308 (KeySigns), 236-249 (Drawn), drawn by KeyCap at 181-184",
        states: "one state: text #26201C at 74%, 0.95 pt round",
        hint: "component (nested in the keycap)",
        caveats:
          "All of a sign's strokes are one path stroked once (the Drawn shape), so crossings do not darken; keep it one vector with one stroke. The 10 pt frame is the sign's own space; the app scales it 1:1."))
  }

  // --- the keycaps and the column of keys -----------------------------------
  func capSize(_ k: LegendKey, _ seed: UInt32) -> CGSize {
    let r = ImageRenderer(content: KeyCap(key: k, seed: seed))
    r.scale = 1
    let s = r.nsImage!.size
    return CGSize(width: s.width, height: s.height)
  }
  func capItems(_ k: LegendKey, _ seed: UInt32, _ size: CGSize, at o: CGPoint) -> [Item] {
    var its = [
      Item(
        path: CapShape(seed: seed).path(in: CGRect(origin: o, size: size)), stroke: .solid(text.o(0.4)), width: 0.85,
        group: "cap", id: "outline")
    ]
    if case .named = k {} else {
      its += signItems(k, at: CGPoint(x: o.x + size.width / 2 - 5, y: o.y + size.height / 2 - 5))
    }
    return its
  }
  var column: [Item] = []
  var capList: [String] = []
  for (row, line) in LegendLine.all.enumerated() {
    let y = CGFloat(row) * (22 + 15)
    let caps = line.keys.enumerated().map { (i, k) in (k, seedHash(line.does) &+ UInt32(i)) }
    let sizes = caps.map { capSize($0.0, $0.1) }
    let total = sizes.map(\.width).reduce(0, +) + CGFloat(max(0, caps.count - 1)) * 5
    var x = 150 - total
    for (i, (k, seed)) in caps.enumerated() {
      let sz = sizes[i]
      let label: String
      switch k {
      case .named(let s): label = s
      default: label = k.spoken.replacingOccurrences(of: " arrow", with: "")
      }
      let name = "keycap-\(label.replacingOccurrences(of: " ", with: "-"))-\(line.does.replacingOccurrences(of: " ", with: "-"))"
      let g = Glyph(
        name: name, size: CGSize(width: sz.width + 2, height: sz.height + 2),
        items: capItems(k, seed, sz, at: CGPoint(x: 1, y: 1)))
      var desc = "A key on the keys page, for '\(line.does)': a rounded square the pen has not quite made true, each side bowed a hair, each corner turned round (CapShape, seed seedHash(\"\(line.does)\") + \(i) = \(seed))."
      var type = ""
      if case .named(let s) = k {
        desc += " Its name is set in type inside it: \(s.uppercased())."
        type = " Type (set natively in Figma): '\(s.uppercased())' Didot Regular 9 pt, tracking 1.6, text #26201C at 74%, centred; the cap is the text's width + 1.6 pt (the tracked last letter) + 7 pt either side."
      } else {
        desc += " Its sign is drawn in the middle."
      }
      emit(
        g, "ui/keys",
        Meta(
          title: "Keycap · \(label) (\(line.does))", description: desc, group: "Keys page",
          source: "Sources/Arcana/Legend.swift:169-231 (KeyCap, CapShape); seeds from Legend.swift:129",
          states: "one state: outline text #26201C at 40%, 0.85 pt round; sign text at 74%. The page has no hover or press look.",
          hint: "component; frame = the cap's \(num(sz.width))×\(num(sz.height)) layout box inset 1 pt on every side so the stroke is not clipped",
          caveats: "Each cap has its own seed, so the two ⌘ caps are not the same drawing." + type))
      check(name, KeyCap(key: k, seed: seed).padding(1), against: g)
      column += moved(capItems(k, seed, sz, at: CGPoint(x: 1 + x, y: 1 + y)), 0, 0, cell: line.does.replacingOccurrences(of: " ", with: "-"))
      capList.append("\(label) \(num(sz.width))×\(num(sz.height))")
      x += sz.width + 5
    }
  }
  let col = Glyph(name: "keys-column", size: CGSize(width: 152, height: 7 * 22 + 6 * 15 + 2), items: column)
  emit(
    col, "ui/keys",
    Meta(
      title: "Keys page · the column of keys",
      description:
        "The left column of THE KEYS page as laid out: seven rows 22 pt tall, 15 pt apart, each row's caps right-aligned in a 150 pt column with 5 pt between caps. Rows: ← → choose · (type) your question · SPACE hold · ↑ past readings · ⌘ ⌫ forget a reading · ESC back · ⌘ , settings. The second row has no cap: the word 'type' stands there.",
      group: "Keys page", source: "Sources/Arcana/Legend.swift:43-51 (lines), 119-146 (layout)",
      states: "static; on opening, each row arrives out of a little blur 0.45 s ease-out after 0.16 + 0.05·(row+1) s",
      hint: "frame; the right column (what each does, Didot Italic 17 text 82%, 150 pt wide) sits 22 pt to its right",
      caveats:
        "The frame is the 150 pt column inset 1 pt. Row 2 'TYPE' is type only: Caps Didot Regular 9 pt tracking 2.6, text at 66%, right-aligned (2.6 pt leading pad). SPACE/ESC names are type too. Cap sizes: " + capList.joined(separator: ", ") + "."),
    preview: true)

  // --- page turns -------------------------------------------------------------
  for (d, n) in [(-1, "left"), (1, "right")] {
    for hover in [false, true] {
      let g = Glyph(
        name: "chevron-\(n)-\(hover ? "hover" : "rest")", size: CGSize(width: 12, height: 24),
        items: items(TurnMark.marks[d]!, .only(hover ? gi : text.o(0.36)), group: "chevron", ids: ["upper", "lower"]))
      emit(
        g, "ui",
        Meta(
          title: "Page turn · \(n) · \(hover ? "hover" : "rest")",
          description:
            "On a kept reading, the way to the reading \(d < 0 ? "before" : "after") this one: an open angle in the pen's hand beside the spread (the card row's centre line, half a slot + 58 pt out, at least 30 pt from the edge). Shown only when there is a reading that way.",
          group: G, source: "Sources/Arcana/Keeping.swift:928-975 (marks 937-948; seed \(d < 0 ? 611 : 612))",
          states: hover
            ? "hover: goldInk #8F6C21 plus glow goldLit 80% radius 6, pointing-hand cursor; 0.2 s ease-out"
            : "rest: text #26201C at 36%. Appears/disappears with a 0.4 s fade.",
          hint: hover
            ? "component variant; add effect Drop shadow #ECCE6E 80%, x 0 y 0, blur ≈ 12"
            : "component; hit area 44×64 centred on the 12×24 mark",
          caveats: "1.0 pt round strokes, one layer each."))
      if hover {
        glowRef(
          g.name + "-app", "ui",
          MarksCanvas(marks: TurnMark.marks[d]!, space: TurnMark.space, tint: .only(Palette.goldInk))
            .frame(width: 12, height: 24).shadow(color: Palette.goldLit.opacity(0.8), radius: 6),
          pt: CGSize(width: 12, height: 24),
          Meta(
            title: "Page turn · \(n) · hover (app render @3x, with its glow)",
            description: "TurnMark's hovered drawing as the app lays it (MarksCanvas in goldInk with its goldLit shadow), on pearl.",
            group: G, source: "Sources/Arcana/Keeping.swift:951-957", states: "hover", hint: "image; place beside the hover component",
            caveats: "Rendered from TurnMark's body with hover = true (its @State cannot be set from outside); 14 pt of pearl round it."))
      }
      if !hover {
        check(g.name, MarksCanvas(marks: TurnMark.marks[d]!, space: TurnMark.space, tint: .only(Palette.text.opacity(0.36))), against: g)
      }
    }
  }

  // --- corner brackets -----------------------------------------------------------
  func brackets(_ name: String, _ w: CGFloat, _ h: CGFloat, _ c: RGBA) -> Glyph {
    let p = Brackets().path(in: CGRect(x: 1, y: 1, width: w, height: h))
    return Glyph(
      name: name, size: CGSize(width: w + 2, height: h + 2),
      items: [Item(path: p, stroke: .solid(c), width: 1, cap: .butt, join: .miter, group: "brackets", id: "corners")])
  }
  do {
    let g = brackets("brackets-chooser", 150, 86, gi.o(0.6))
    emit(
      g, "ui",
      Meta(
        title: "Corner brackets · spread chooser",
        description: "Four corner marks round the chosen spread (150×86), each arm 13% of the shorter side (11.2 pt).",
        group: G, source: "Sources/Arcana/RootView.swift:639-652 (Brackets), 1122-1126",
        states: "shown only on the chosen spread: goldInk at 60%, 1 pt",
        hint: "component; frame = 150×86 box inset 1 pt",
        caveats: "Shape.stroke(lineWidth:) uses butt caps and mitred corners, not the pen's round ones."))
    check(g.name, Brackets().stroke(Palette.goldInk.opacity(0.6), lineWidth: 1).padding(1), against: g)
  }
  for n in [1, 3, 5] {
    let L = ArcanaKit.Layout(size: stage, slots: n, phase: .draw)
    let w = L.slotW * 1.1, h = L.slotH * 1.1
    let g = brackets("brackets-slot-\(n)", w, h, gi.o(0.42))
    emit(
      g, "ui",
      Meta(
        title: "Corner brackets · empty slot (\(n == 1 ? "one card" : "\(n) cards"))",
        description:
          "Where a card is still to be laid, while drawing: corner marks round the empty slot, 110% of the slot (\(num(w))×\(num(h)) at the default 1260×828 stage), arms 13% of the shorter side.",
        group: G, source: "Sources/Arcana/RootView.swift:639-652, 666-671; Layout Game.swift:853-885",
        states: "empty slot during the draw: goldInk at 42%, 1 pt. Gone once the card lands.",
        hint: "component; frame = the bracket box inset 1 pt; centre it on the slot",
        caveats: "Sizes follow the window (Layout.slotH); these are for 1260×828."))
  }

  // --- diamonds, rules and the spent dot ----------------------------------------
  func single(_ name: String, _ side: CGFloat, _ c: RGBA) -> Glyph {
    let f = ceil(side * 2.squareRoot())
    return Glyph(name: name, size: CGSize(width: f, height: f), items: [turned(CGPoint(x: f / 2, y: f / 2), side, c)])
  }
  let diamonds: [(Glyph, String, String, String, String)] = [
    (single("diamond-prompt-pip-taken", 6, gi), "Draw prompt pip · taken", "One of the pips over the draw prompt: a card taken.", "RootView.swift:1143-1151", "goldInk 100%"),
    (single("diamond-prompt-pip-open", 6, text.o(0.2)), "Draw prompt pip · to take", "A pip for a card still to take.", "RootView.swift:1143-1151", "text at 20%"),
    (single("diamond-spread-pip-chosen", 5, gi), "Spread pip · chosen", "The pips above a spread's name, one per card, when it is the chosen spread.", "RootView.swift:1094-1101", "goldInk 100% + glow goldLit 90% radius 4 (add Drop shadow blur ≈ 8)"),
    (single("diamond-spread-pip", 5, text.o(0.28)), "Spread pip · not chosen", "The pips above a spread's name when another spread is chosen.", "RootView.swift:1094-1101", "text at 28%, no glow"),
    (single("diamond-folio", 5, gi), "Folio diamond", "Between the thread's two sentences and its question, once the thread is found (and on a kept reading's folio).", "RootView.swift:1343-1348; Keeping.swift:864-869", "goldInk 100% + glow goldLit 100% radius 5 (add Drop shadow blur ≈ 10)"),
    (single("diamond-keyword", 4, gi.o(0.55)), "Keyword separator", "Between the keywords under a card's line on the altar.", "RootView.swift:1501-1508", "goldInk at 55%"),
    (single("diamond-reversed", 5, P.blood), "Reversed mark", "Under the essence on a reversed card's face: the card is read upside down.", "CardImages.swift:95-101", "oxblood #8C2E25, fades in with the ink at 0.8-1"),
  ]
  for (g, t, d, s, st) in diamonds {
    emit(
      g, "ui/diamonds",
      Meta(
        title: t, description: d + " A square turned 45°, the app's one ornament.", group: "Diamonds", source: "Sources/Arcana/" + s,
        states: st, hint: "component; a Rectangle of the given side rotated 45° (the SVG keeps it as a rotated rect)",
        caveats: "Frame is the square's diagonal rounded up; the diamond is centred."))
  }
  glowRef(
    "diamond-folio-app", "ui/diamonds",
    Rectangle().fill(Palette.goldInk).frame(width: 5, height: 5).rotationEffect(.degrees(45)).shadow(color: Palette.goldLit, radius: 5),
    pt: CGSize(width: 8, height: 8),
    Meta(
      title: "Folio diamond (app render @3x, with its glow)", description: "The folio diamond exactly as RootView lays it, goldLit shadow radius 5 included, on pearl.",
      group: "Diamonds", source: "Sources/Arcana/RootView.swift:1343-1348", states: "static", hint: "image; place beside diamond-folio",
      caveats: "14 pt of pearl round the 8×8 frame."))
  for size in [8.0, 7.0] {
    let items: [Item] = [
      turned(CGPoint(x: 9, y: 9), size, gi.o(0.9)),
      Item(path: Path(CGRect(x: 8.5, y: 0, width: 1, height: 18)), fill: .solid(gi.o(0.4)), group: "stem", id: "stem",
        form: .rect(CGRect(x: 8.5, y: 0, width: 1, height: 18), rotate: 0)),
    ]
    let g = Glyph(name: "thread-glyph-\(Int(size))", size: CGSize(width: 18, height: 18), items: items)
    emit(
      g, "ui/diamonds",
      Meta(
        title: "Thread glyph · \(Int(size)) pt", description: size == 8
          ? "Left of FIND THE THREAD, the invitation under the verse: a diamond on a vertical hairline."
          : "Left of 'letting the cards settle' while the thread is being found (a little smaller).",
        group: "Diamonds", source: "Sources/Arcana/RootView.swift:1365-1379 (used 1297, 1310)",
        states: "diamond goldInk 90%, stem 1×18 goldInk 40%", hint: "component; 18×18 frame, 11 pt (8) or 12 pt (7) before the caps",
        caveats: "The stem is drawn over the diamond (it is the second layer)."))
    check(g.name, ThreadGlyph(size: size), against: g)
  }
  for (lit, g, kept, n, t, st) in [
    (false, 0.0, false, "thread-node-empty", "Thread node · empty", "before its card lands: outline 0.8 pt goldInk 40% (mitred)"),
    (false, 0.5, false, "thread-node-growing", "Thread node · landing", "half-way through its 0.9 s growth: diamond goldInk 65%, glow r 7 at 30%"),
    (false, 1.0, false, "thread-node", "Thread node · laid", "card landed: diamond goldInk 95%, glow goldLit 60%→0 r 14"),
    (true, 1.0, false, "thread-node-lit", "Thread node · lit", "the cursor rests on its card: half-diagonal 5.5, glow r 26"),
  ] as [(Bool, Double, Bool, String, String, String)] {
    let its = node(30, 30, lit: lit, grown: g, kept: kept)
    let gl = Glyph(name: n, size: CGSize(width: 60, height: 60), items: its)
    emit(
      gl, "ui/diamonds",
      Meta(
        title: t, description: "A node on the thread under each card position: a diamond of half-diagonal 4.2 pt (5.5 when lit), with its own gold glow laid over it.",
        group: "Diamonds", source: "Sources/Arcana/RootView.swift:568-590; kept: Keeping.swift:774-788",
        states: st + ". A kept reading's nodes are always laid (goldInk 95%).",
        hint: "component; 60×60 frame centred on the node; glow is a radial gradient ellipse, normal blend",
        caveats: "The glow is painted over the diamond, as the Canvas does."))
  }

  let rules: [(String, CGFloat, RGBA, String, String, String)] = [
    ("rule-title", 46, gi.o(0.55), "Rule · the room's and the keys page's hairline", "A 46×1 hairline: in the room it sits between ARCANA and the question (the question line 14 pt under it); on the keys page 18 pt over THE KEYS.", "RootView.swift:709; Legend.swift:108"),
    ("rule-epigraph", 30, gi.o(0.45), "Rule · over the epigraph", "A 30×1 hairline 21 pt above the question read back over the spread.", "RootView.swift:1013"),
    ("rule-altar", 54, text.o(0.2), "Rule · altar", "A 54×1 hairline between a card's essence and its line on the altar.", "RootView.swift:1491"),
  ]
  for (n, w, c, t, d, s) in rules {
    let r = CGRect(x: 0, y: 0, width: w, height: 1)
    let g = Glyph(name: n, size: r.size, items: [Item(path: Path(r), fill: .solid(c), group: "rule", id: "rule", form: .rect(r, rotate: 0))])
    emit(g, "ui", Meta(title: t, description: d, group: "Rules and dots", source: "Sources/Arcana/" + s, states: "static", hint: "component (a rectangle)", caveats: ""))
  }
  do {
    let r = CGRect(x: 0, y: 0, width: 2.4, height: 2.4)
    let g = Glyph(name: "spent-dot", size: CGSize(width: 2.4, height: 2.4), items: [Item(path: Path(ellipseIn: r), fill: .solid(gi), opacity: 0.45, group: "dot", id: "dot", form: .ellipse(r))])
    emit(
      g, "ui",
      Meta(
        title: "Spent pen dot", description: "When a key finds no room at the end of the 560 pt question line, the pen touches the paper just past the last letter and lays nothing: a 2.4 pt gold dot on the line, 0.5 pt after the text, its centre 1.2 pt above the baseline.",
        group: "Rules and dots", source: "Sources/Arcana/RootView.swift:895-911",
        states: "appears at 45% and fades to 0 over 0.7 s (smoothstep); not shown once the line is dry",
        hint: "component (an ellipse at layer opacity 45%)", caveats: ""))
  }

  // --- the spread chooser ------------------------------------------------------------
  func tile(_ s: Spread, _ chosen: Bool, at o: CGPoint = .zero) -> [Item] {
    // VStack(spacing 9) of pips (10 tall), name (15) and sub (15), centred in 150×86: the pips' row is at y 19
    var its: [Item] = []
    let n = CGFloat(s.count)
    let row = 5 * n + 5 * (n - 1)
    for i in 0..<s.count {
      let c = CGPoint(x: o.x + 75 - row / 2 + 2.5 + CGFloat(i) * 10, y: o.y + 19)
      its.append(turned(c, 5, chosen ? gi : text.o(0.28), id: "pip-\(i + 1)", group: "pips"))
    }
    if chosen {
      its.append(
        Item(
          path: Brackets().path(in: CGRect(x: o.x, y: o.y, width: 150, height: 86)), stroke: .solid(gi.o(0.6)), width: 1,
          cap: .butt, join: .miter, group: "brackets", id: "corners"))
    }
    return its
  }
  for (i, s) in Spread.all.enumerated() {
    for chosen in [true, false] {
      let g = Glyph(
        name: "spread-tile-\(s.id)-\(chosen ? "chosen" : "rest")", size: CGSize(width: 152, height: 88),
        items: moved(tile(s, chosen), 1, 1))
      emit(
        g, "ui/spread",
        Meta(
          title: "Spread choice · \(s.name) · \(chosen ? "chosen" : "not chosen")",
          description:
            "One of the three spreads offered under the question in the room (150×86): a pip for each card, the spread's name in small capitals and a line in italic under it\(chosen ? ", held in corner brackets" : "").",
          group: "Spread chooser", source: "Sources/Arcana/RootView.swift:1085-1132; data Deck.swift:38-50",
          states: chosen
            ? "chosen: pips goldInk + glow goldLit 90% r 4; name Didot Bold; sub goldInk; brackets goldInk 60%. Choosing is instant (no animation); plain button, no hover look."
            : "not chosen: pips text 28%; name Didot Regular text 48%; sub text 40%",
          hint:
            "component with a 'chosen' variant; frame = the 150×86 tile inset 1 pt. Set the type natively: name '\(s.name.uppercased())' \(chosen ? "Didot Bold" : "Didot Regular") 11 pt tracking 3, \(chosen ? "text 100%" : "text 48%"), centred on y = 40.5 (15 pt line box, one line, may shrink to 82%); sub '\(s.sub)' Didot Italic 11.5 pt (drawn 12, Font.custom rounds), \(chosen ? "goldInk" : "text 40%"), centred on y = 64.5 (may shrink to 85%). y is from the tile's top.",
          caveats: "Pip centres are 10 pt apart on y = 19. The preview PNG is the app's own view, type included."))
      check(g.name, SpreadChoice(spread: s, chosen: chosen, tap: {}).padding(1), against: g, note: "(type only in app)")
      let refPNG = assets.appendingPathComponent("ui/spread/\(g.name)@3x.png")
      png(SpreadChoice(spread: s, chosen: chosen, tap: {}).padding(1).background(Palette.pearl), scale: 3, to: refPNG)
      manifest.append(
        item(
          refPNG, kind: "png", px: [456, 264], scale: 3, pt: g.size, vector: false,
          Meta(
            title: "Spread choice · \(s.name) · \(chosen ? "chosen" : "not chosen") (app render @3x)",
            description: "The app's own SpreadChoice view, type included, on pearl — the picture to match the component to.",
            group: "Spread chooser", source: "Sources/Arcana/RootView.swift:1085-1132", states: chosen ? "chosen" : "not chosen",
            hint: "image, place beside the component", caveats: "Rendered by ImageRenderer; glow on the chosen pips is included here but not in the SVG.")))
      _ = i
    }
  }
  for (ci, s) in Spread.all.enumerated() {
    var its: [Item] = []
    for (k, t) in Spread.all.enumerated() {
      its += moved(tile(t, k == ci, at: CGPoint(x: 1 + CGFloat(k) * (150 + 34), y: 1)), 0, 0, cell: t.id)
    }
    let g = Glyph(name: "spread-row-\(s.id)-chosen", size: CGSize(width: 3 * 150 + 2 * 34 + 2, height: 88), items: its)
    emit(
      g, "ui/spread",
      Meta(
        title: "Spread chooser row · \(s.name) chosen",
        description: "The three spreads side by side as the room shows them (34 pt apart), 42 pt under the question, with \(s.name) chosen.",
        group: "Spread chooser", source: "Sources/Arcana/RootView.swift:724-732",
        states: "\(s.name) chosen; ← → move the choice", hint: "frame of three tile instances (518×86 inset 1 pt)",
        caveats: "Type as in the tile components."))
  }

  // --- the draw prompt's pips ------------------------------------------------------------
  for n in [1, 3, 5] {
    for taken in 0...n {
      let w = 6 * CGFloat(n) + 7 * CGFloat(n - 1) + 4
      var its: [Item] = []
      for i in 0..<n {
        its.append(turned(CGPoint(x: 2 + 3 + CGFloat(i) * 13, y: 5), 6, i < taken ? gi : text.o(0.2), id: "pip-\(i + 1)", group: "pips"))
      }
      let g = Glyph(name: "prompt-pips-\(n)-\(taken)", size: CGSize(width: w, height: 10), items: its)
      let word = n == 1 ? "DRAW ONE CARD" : n == 3 ? "DRAW THREE" : "DRAW FIVE"
      emit(
        g, "ui/prompt",
        Meta(
          title: "Draw prompt pips · \(taken) of \(n)",
          description: "Over the one line of instruction while drawing: a pip for each card of the spread, gold once taken. \(taken) of \(n) taken.",
          group: "Draw prompt", source: "Sources/Arcana/RootView.swift:1139-1193",
          states: taken == n
            ? "all taken: the prompt fades out (0.8 s) as the reading begins"
            : "\(taken) taken (goldInk), \(n - taken) to take (text 20%)",
          hint:
            "component; frame = the pips' row (6 pt squares 7 pt apart) padded 2 pt so the turned corners fit. Under it, 13 pt lower, type '\(word)' Didot Regular 10 pt tracking 4, text 52%, centred; the pair is centred on the stage at y = max(0.60·H, labelY + 46).",
          caveats: "The row's centre is the frame's centre."))
    }
  }

  // --- the thread -----------------------------------------------------------------
  // the canvas is the stage's width and 40 pt tall, but it does not clip: the frame is 72 tall
  for n in [1, 3, 5] {
    let L = ArcanaKit.Layout(size: stage, slots: n, phase: .reading)
    let xs = (0..<n).map { L.slot($0).x }
    let full = [Double](repeating: 1, count: n)
    var states: [(String, String, Double, [Double], Int?, Double?)] = [
      ("reading", "the reading laid: every card down, base 40%", 0.40, full, nil, nil),
      ("reading-lit", "the cursor on the \(n == 1 ? "card" : "second card"): its node grows to 5.5 with a 26 pt glow", 0.40, full, n == 1 ? 0 : 1, nil),
      ("woven", "the thread found: base 62%", 0.62, full, nil, nil),
    ]
    if n > 1 {
      var mid = [Double](repeating: 0, count: n)
      mid[0] = 1
      mid[1] = 0.5
      states.insert(("draw", "drawing: first card down, the second landing (its segment half grown), the rest still outlined; base 30%", 0.30, mid, nil, nil), at: 0)
      states.append(("running", "the light running the thread, 40% of the way (it crosses in 1.8 s after the reading is spoken, then every 13 s)", 0.40, full, nil, 0.4))
    } else {
      states.insert(("draw", "drawing: the card landing, its wings half grown; base 30%", 0.30, [0.5], nil, nil), at: 0)
    }
    states.append(("kept", "a kept reading, opened from the moon: laid whole, every node at 95%, no light running (KeptThread)", 0.40, full, nil, nil))
    for (sn, sd, base, grown, lit, run) in states {
      // while drawing, the stage is laid out for the draw (a lone card is smaller then)
      let L = sn == "draw" ? ArcanaKit.Layout(size: stage, slots: n, phase: .draw) : L
      let xs = (0..<n).map { L.slot($0).x }
      let its = threadItems(xs: xs, y: 36, slotW: L.slotW, base: base, grown: grown, lit: lit, run: run, kept: sn == "kept")
      let g = Glyph(name: "thread-\(n)-\(sn)", size: CGSize(width: stage.width, height: 72), items: its)
      emit(
        g, "ui/thread",
        Meta(
          title: "Thread · \(n == 1 ? "one card" : "\(n) cards") · \(sn)",
          description: "The line of light under the spread, laid card by card: a 1 pt goldInk line over a 5 pt goldLit underlay between the cards (wings fading out either side of a lone card), and a diamond node under each position. " + sd + ".",
          group: "Thread", source: sn == "kept" ? "Sources/Arcana/Keeping.swift:743-796 (KeptThread)" : "Sources/Arcana/RootView.swift:506-633",
          states: sd,
          hint: "frame 1260×72 centred on the thread: the thread's own canvas is the stage's width × 40 pt, and its glows (up to 26 pt, the running light 34 pt) spill past it, since a Canvas does not clip. Place the frame's centre line at threadY = rowY + slotH/2 + 26 (\(num(L.threadY)) here). Normal blend.",
          caveats: "Card x positions follow Layout at 1260×828; they move with the window. Lines use butt caps, as Canvas strokes do. A kept reading's thread is the 'reading' state with every node at 95% and no light running."))
    }
  }
  // the app's own Thread, posed, for the check
  do {
    let g0 = Game()
    g0.spreadIndex = 1
    g0.phase = .reading
    g0.dealt = true
    g0.picks = [4, 9, 15]
    g0.faceUp = Set([4, 9, 15])
    g0.recited = 3
    for s in 0..<3 { g0.landed[s] = long }
    g0.reading = 1
    let L = ArcanaKit.Layout(size: stage, slots: 3, phase: .reading)
    let g = registry["thread-3-reading-lit"]!
    check(
      "thread-3-reading-lit",
      ArcanaKit.Thread(game: g0, layout: L, reduceMotion: true).frame(width: stage.width, height: stage.height)
        .offset(y: 36 - L.threadY).frame(width: stage.width, height: 72, alignment: .top).clipped(),
      against: g)
    // is anything drawn past the canvas? the same, with room around it
    png(
      ArcanaKit.Thread(game: g0, layout: L, reduceMotion: true).frame(width: stage.width, height: stage.height)
        .offset(y: 60 - L.threadY).frame(width: stage.width, height: 120, alignment: .top).clipped(),
      scale: 1, to: refDir.appendingPathComponent("app/thread-3-reading-lit-roomy.png"))
  }

  // --- halos ---------------------------------------------------------------------
  for n in [1, 3, 5] {
    let L = ArcanaKit.Layout(size: stage, slots: n, phase: .reading)
    let w = L.slotW * 2.6, h = L.slotH * 1.7
    let list: [(String, Double, String)] =
      n == 3
      ? [("draw", 0.08, "empty slot while drawing (0.08)"), ("rest", 0.24, "card laid (0.24)"),
        ("read", 0.46, "cursor on the card (0.24 + 0.22)"), ("flare", 0.69, "flaring as it is spoken (0.24 + 0.45)")]
      : [("rest", 0.24, "card laid (0.24)")]
    for (sn, a, sd) in list {
      let r = CGRect(x: 0, y: 0, width: ceil(w), height: ceil(h))
      let c = CGPoint(x: r.midX, y: r.midY)
      let e = CGRect(x: c.x - w / 2, y: c.y - h / 2, width: w, height: h)
      let it = Item(
        path: Path(ellipseIn: e),
        fill: .radial([(P.goldLit, 0), (P.goldLit.o(0.45 / 1.4), 0.5), (P.goldLit.o(0), 1)], c, L.slotH * 0.78),
        opacity: min(1, a * 1.4), group: "halo", id: "halo", form: .ellipse(e), screen: true)
      let g = Glyph(name: "halo-\(n)-\(sn)", size: r.size, items: [it])
      emit(
        g, "ui/halo",
        Meta(
          title: "Halo · \(n == 1 ? "one card" : "\(n) cards") · \(sn)",
          description: "The warm light behind each card on the table: an ellipse 2.6 slot widths by 1.7 slot heights, filled with a round goldLit gradient that ends at 0.78 slot heights (so the ellipse's sides cut it). " + sd + ".",
          group: "Halos", source: "Sources/Arcana/RootView.swift:467-500 (kept: Keeping.swift:720-740)",
          states: "layer opacity = min(1, 1.4 × strength): \(num(CGFloat(min(1, a * 1.4)))) here. States: draw 0.112, rest 0.336, read 0.644, flare 0.966; × (1 − hush) as the room goes quiet",
          hint: "component; set the layer's blend mode to SCREEN (SVG cannot carry it); centre on the slot centre",
          caveats: "Size is for the default 1260×828 stage (slotH \(num(L.slotH))). The gradient is circular, not elliptical."))
    }
  }
}
