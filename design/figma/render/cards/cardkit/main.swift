import AppKit
import SwiftUI
import UniformTypeIdentifiers

// ===================================================================
//  cardkit — renders every Arcana card as Figma handoff assets.
//  Compiled together with Sources/Arcana/*.swift (minus ArcanaApp.swift),
//  so every mark, colour and layout below is the app's own.
//    cardkit <assets/cards dir> [faces] [svg] [shared] [deck] [check ...]
// ===================================================================

_ = NSApplication.shared
let argv = CommandLine.arguments
let out = argv.count > 1 ? argv[1] : "."
let modes = Set(argv.dropFirst(2))
let check = ProcessInfo.processInfo.environment["CHECK"] ?? "\(out)/_check"
func want(_ m: String) -> Bool { modes.isEmpty || modes.contains(m) }
let fm = FileManager.default
func mkdir(_ p: String) { try? fm.createDirectory(atPath: p, withIntermediateDirectories: true) }

// --- PNG: 8-bit sRGB -------------------------------------------------

let srgb = CGColorSpace(name: CGColorSpace.sRGB)!

func srgbCopy(_ cg: CGImage, alpha: Bool) -> CGImage {
  let w = cg.width, h = cg.height
  let info = alpha ? CGImageAlphaInfo.premultipliedLast.rawValue : CGImageAlphaInfo.noneSkipLast.rawValue
  let ctx = CGContext(
    data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: srgb,
    bitmapInfo: info)!
  ctx.interpolationQuality = .none
  ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
  return ctx.makeImage()!
}

@discardableResult
func writePNG(_ cg: CGImage, _ path: String, alpha: Bool) -> [Int] {
  let img = srgbCopy(cg, alpha: alpha)
  let url = URL(fileURLWithPath: path) as CFURL
  let dst = CGImageDestinationCreateWithURL(url, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dst, img, nil)
  CGImageDestinationFinalize(dst)
  return [img.width, img.height]
}

@MainActor func render<V: View>(_ v: V, scale: CGFloat) -> CGImage? {
  let r = ImageRenderer(content: v.environment(\.stillSky, true))
  r.scale = scale
  return r.cgImage
}

// --- colours as the renderer writes them (Float32, halves up) ---------

func hex(_ c: Color) -> String {
  let ns = NSColor(c).usingColorSpace(.sRGB)!
  func b(_ v: CGFloat) -> Int { Int((Float(v) * 255).rounded()) }
  return String(format: "#%02X%02X%02X", b(ns.redComponent), b(ns.greenComponent), b(ns.blueComponent))
}

let leafStops: [(Double, String)] = Palette.leaf.stops.map { (Double($0.location), hex($0.color)) }

// --- SVG -------------------------------------------------------------

func num(_ v: CGFloat) -> String {
  var s = String(format: "%.3f", Double(v))
  while s.hasSuffix("0") { s.removeLast() }
  if s.hasSuffix(".") { s.removeLast() }
  if s == "-0" { s = "0" }
  return s
}

func pathData(_ path: Path, dx: CGFloat = 0, dy: CGFloat = 0) -> String {
  var d: [String] = []
  func P(_ p: CGPoint) -> String { "\(num(p.x + dx)) \(num(p.y + dy))" }
  path.cgPath.applyWithBlock { e in
    let el = e.pointee
    switch el.type {
    case .moveToPoint: d.append("M\(P(el.points[0]))")
    case .addLineToPoint: d.append("L\(P(el.points[0]))")
    case .addQuadCurveToPoint: d.append("Q\(P(el.points[0])) \(P(el.points[1]))")
    case .addCurveToPoint: d.append("C\(P(el.points[0])) \(P(el.points[1])) \(P(el.points[2]))")
    case .closeSubpath: d.append("Z")
    @unknown default: break
    }
  }
  return d.joined(separator: " ")
}

/// How one layer of marks is inked: the app's Tint, as hex + opacity.
struct Ink {
  var ink = hex(Palette.ink)
  var accent = hex(Palette.blood)
  var gold = hex(Palette.gold)
  var paper = hex(Palette.paper)
  var gilded = true
  var opacity = 1.0
  func of(_ c: InkColor) -> String {
    switch c {
    case .ink: return ink
    case .accent: return accent
    case .gold: return gold
    case .paper: return paper
    }
  }
  static let card = Ink()
  static func only(_ h: String, _ a: Double) -> Ink {
    Ink(ink: h, accent: h, gold: h, paper: h, gilded: false, opacity: a)
  }
}

func roleName(_ m: Mark, _ t: Ink) -> String {
  if !t.gilded { return "pass" }
  if let f = m.fill {
    switch f {
    case .gold: return "gold-leaf"
    case .ink: return "ink"
    case .accent: return "oxblood"
    case .paper: return "paper"
    }
  }
  switch m.stroke! {
  case .gold: return "gold"
  case .ink: return "ink"
  case .accent: return "oxblood"
  case .paper: return "paper"
  }
}

func inkBox(_ m: Mark) -> CGRect {
  let r = m.path.boundingRect
  return m.stroke != nil ? r.insetBy(dx: -m.width / 2 - 0.5, dy: -m.width / 2 - 0.5) : r.insetBy(dx: -0.5, dy: -0.5)
}

final class SVG {
  let w: Double, h: Double
  var grads: [String] = []
  var body: [String] = []
  var nGrad = 0
  let prefix: String
  var used: [String: Int] = [:]
  init(_ w: Double, _ h: Double, prefix: String) { self.w = w; self.h = h; self.prefix = prefix }

  func uniq(_ id: String) -> String {
    let n = (used[id] ?? 0) + 1
    used[id] = n
    return n == 1 ? id : "\(id)-\(n)"
  }

  func leafGradient(_ r: CGRect, dx: CGFloat, dy: CGFloat) -> String {
    nGrad += 1
    let id = "\(prefix)leaf-\(nGrad)"
    var s =
      "<linearGradient id=\"\(id)\" gradientUnits=\"userSpaceOnUse\" x1=\"\(num(r.minX + dx))\" y1=\"\(num(r.minY + dy))\" x2=\"\(num(r.maxX + dx))\" y2=\"\(num(r.maxY + dy))\">"
    for (o, c) in leafStops { s += "<stop offset=\"\(num(CGFloat(o)))\" stop-color=\"\(c)\"/>" }
    s += "</linearGradient>"
    grads.append(s)
    return id
  }

  func element(_ m: Mark, _ t: Ink, dx: CGFloat, dy: CGFloat) -> String {
    var a = "<path d=\"\(pathData(m.path, dx: dx, dy: dy))\""
    if let f = m.fill {
      if f == .gold && t.gilded {
        a += " fill=\"url(#\(leafGradient(m.path.boundingRect, dx: dx, dy: dy)))\""
      } else {
        a += " fill=\"\(t.of(f))\""
      }
      if t.opacity < 1 { a += " fill-opacity=\"\(num(CGFloat(t.opacity)))\"" }
    } else {
      a += " fill=\"none\""
    }
    if let s = m.stroke {
      a +=
        " stroke=\"\(t.of(s))\" stroke-width=\"\(num(m.width))\" stroke-linecap=\"round\" stroke-linejoin=\"round\""
      if t.opacity < 1 { a += " stroke-opacity=\"\(num(CGFloat(t.opacity)))\"" }
    }
    return a + "/>"
  }

  /// Marks in draw order, gathered into groups by role. A mark joins the
  /// last group of its role only if nothing drawn since overlaps it, so the
  /// stacking of every visible pixel is the app's.
  func layer(_ marks: [Mark], _ t: Ink, name: String? = nil, dx: CGFloat = 0, dy: CGFloat = 0, flat: Bool = false) {
    if flat {
      for m in marks { body.append(element(m, t, dx: dx, dy: dy)) }
      return
    }
    var groups: [(role: String, els: [String], boxes: [CGRect])] = []
    for m in marks {
      let role = name ?? roleName(m, t)
      let b = inkBox(m)
      var target: Int? = nil
      if let last = groups.lastIndex(where: { $0.role == role }) {
        let later = groups[(last + 1)...].flatMap { $0.boxes }
        if !later.contains(where: { $0.intersects(b) }) { target = last }
      }
      let el = element(m, t, dx: dx, dy: dy)
      if let i = target {
        groups[i].els.append(el)
        groups[i].boxes.append(b)
      } else {
        groups.append((role, [el], [b]))
      }
    }
    for g in groups {
      body.append("<g id=\"\(uniq(g.role))\">" + g.els.joined() + "</g>")
    }
  }

  func group(_ id: String, _ inner: () -> Void) {
    let start = body.count
    inner()
    let els = body[start...].joined()
    body.removeSubrange(start...)
    body.append("<g id=\"\(uniq(id))\">" + els + "</g>")
  }

  func raw(_ s: String) { body.append(s) }

  func write(_ path: String) {
    var s =
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"\(num(CGFloat(w)))\" height=\"\(num(CGFloat(h)))\" viewBox=\"0 0 \(num(CGFloat(w))) \(num(CGFloat(h)))\">\n"
    for g in grads { s += g + "\n" }
    for b in body { s += b + "\n" }
    s += "</svg>\n"
    try! s.write(toFile: path, atomically: true, encoding: .utf8)
  }
}

/// The three passes of a blind emboss (Pressed, CardImages.swift:161).
func pressedLayers(_ svg: SVG, _ marks: [Mark], strength: Double, dx: CGFloat = 0, dy: CGFloat = 0) {
  let shade = hex(Palette.shade)
  svg.group("emboss-light") {
    svg.layer(marks, .only("#FFFFFF", 0.95 * strength), dx: dx + 0.7, dy: dy + 0.8, flat: true)
  }
  svg.group("emboss-shade") {
    svg.layer(marks, .only(shade, 0.24 * strength), dx: dx - 0.5, dy: dy - 0.6, flat: true)
  }
  svg.group("emboss-floor") {
    svg.layer(marks, .only(shade, 0.08 * strength), dx: dx, dy: dy, flat: true)
  }
}

// --- text layout probes -------------------------------------------------

enum Rec { nonisolated(unsafe) static var f: [String: CGRect] = [:] }

extension View {
  func rec(_ k: String) -> some View {
    background(
      GeometryReader { g in
        let _ = (Rec.f[k] = g.frame(in: .named("card")))
        Color.clear
      })
  }
}

/// CardFace's type, verbatim (CardImages.swift:75-105), with its frames recorded.
struct TypeLayer: View {
  let draw: Draw
  var show: Set<String> = ["numeral", "name", "essence", "diamond"]
  var body: some View {
    ZStack {
      Color.clear
      Text(draw.card.roman)
        .font(.display(15))
        .tracking(3.2)
        .foregroundStyle(Palette.ink)
        .rec("numeral")
        .position(x: 114, y: 33)
        .opacity(show.contains("numeral") ? 1 : 0)
      VStack(spacing: 4) {
        Text(draw.card.name.uppercased())
          .font(.display(17))
          .tracking(1.4)
          .foregroundStyle(Palette.ink)
          .lineLimit(2)
          .minimumScaleFactor(0.7)
          .multilineTextAlignment(.center)
          .rec("name")
          .opacity(show.contains("name") ? 1 : 0)
        Text(draw.card.essence)
          .font(.italic(12.5))
          .foregroundStyle(Palette.blood)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
          .rec("essence")
          .opacity(show.contains("essence") ? 1 : 0)
        if draw.reversed {
          Rectangle()
            .fill(Palette.blood)
            .frame(width: 5, height: 5)
            .rec("diamond")
            .rotationEffect(.degrees(45))
            .padding(.top, 4)
            .opacity(show.contains("diamond") ? 1 : 0)
        }
      }
      .frame(width: 182)
      .rec("stack")
      .position(x: 113, y: 345)
    }
    .frame(width: CardArt.cardW, height: CardArt.cardH)
    .coordinateSpace(name: "card")
  }
}

func pixels(_ cg: CGImage) -> [UInt8] {
  let w = cg.width, h = cg.height
  var buf = [UInt8](repeating: 0, count: w * h * 4)
  let ctx = CGContext(
    data: &buf, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: srgb,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
  return buf
}

/// Ink bbox (alpha > 8) of a transparent render, in points.
func inkBBox(_ cg: CGImage, scale: CGFloat) -> CGRect? {
  let px = pixels(cg), w = cg.width, h = cg.height
  var x0 = w, y0 = h, x1 = -1, y1 = -1
  for y in 0..<h {
    for x in 0..<w where px[(y * w + x) * 4 + 3] > 8 {
      x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y)
    }
  }
  guard x1 >= 0 else { return nil }
  return CGRect(
    x: CGFloat(x0) / scale, y: CGFloat(y0) / scale, width: CGFloat(x1 - x0 + 1) / scale,
    height: CGFloat(y1 - y0 + 1) / scale)
}

/// Ink bbox per text line of a two-line render: rows above/below `split` (pt).
func inkBBoxRows(_ cg: CGImage, scale: CGFloat, y0: CGFloat, y1: CGFloat) -> CGRect? {
  let px = pixels(cg), w = cg.width
  var x0 = w, ya = cg.height, x1 = -1, yb = -1
  for y in Int(y0 * scale)..<min(Int(y1 * scale), cg.height) {
    for x in 0..<w where px[(y * w + x) * 4 + 3] > 8 {
      x0 = min(x0, x); x1 = max(x1, x); ya = min(ya, y); yb = max(yb, y)
    }
  }
  guard x1 >= 0 else { return nil }
  return CGRect(x: CGFloat(x0) / scale, y: CGFloat(ya) / scale, width: CGFloat(x1 - x0 + 1) / scale, height: CGFloat(yb - ya + 1) / scale)
}

@MainActor func nameView(_ s: String) -> some View {
  Text(s).font(.display(17)).tracking(1.4).lineLimit(2).minimumScaleFactor(0.7)
    .multilineTextAlignment(.center).foregroundStyle(Color.black)
    .frame(width: 182, height: 60)
}

/// Where SwiftUI breaks a name in the 182 pt column: the manual break
/// whose render is pixel-identical to the automatic one. Also whether a
/// one-line name was shrunk by minimumScaleFactor to fit.
@MainActor func nameLines(_ name: String) -> (lines: [String], exact: Bool, shrink: Double) {
  let autoImg = render(nameView(name), scale: 3)!
  let auto = pixels(autoImg)
  Rec.f = [:]
  _ = render(
    Text(name).font(.display(17)).tracking(1.4).lineLimit(2).minimumScaleFactor(0.7)
      .multilineTextAlignment(.center).rec("n").frame(width: 182).coordinateSpace(name: "card"), scale: 3)
  let h = Rec.f["n"]?.height ?? 0
  let words = name.split(separator: " ").map(String.init)
  if h < 30 || words.count < 2 {
    // one line: shrunk if its ink is narrower than the same line set free
    let free = render(
      Text(name).font(.display(17)).tracking(1.4).fixedSize().foregroundStyle(Color.black), scale: 3)!
    let a = inkBBox(autoImg, scale: 3)?.width ?? 0, b = inkBBox(free, scale: 3)?.width ?? 1
    return ([name], true, a / b > 0.995 ? 1 : Double(a / b))
  }
  var best: ([String], Int) = ([name], Int.max)
  for i in 1..<words.count {
    let c = [words[..<i].joined(separator: " "), words[i...].joined(separator: " ")]
    let v = pixels(render(nameView(c.joined(separator: "\n")), scale: 3)!)
    var d = 0
    for k in 0..<min(v.count, auto.count) where v[k] != auto[k] { d += 1 }
    if d == 0 { return (c, true, 1) }
    if d < best.1 { best = (c, d) }
  }
  // report how the automatic break differs from the manual one, line by line
  // the same break can differ only by the frame's sub-pixel rounding: accept
  // it when every line's ink lies within 1/3 pt of the manual break's
  let man = render(nameView(best.0.joined(separator: "\n")), scale: 3)!
  var ok = true
  for (a, b) in [(0.0, 30.0), (30.0, 60.0)] {
    let ra = inkBBoxRows(autoImg, scale: 3, y0: a, y1: b), rb = inkBBoxRows(man, scale: 3, y0: a, y1: b)
    if let ra, let rb {
      if abs(ra.minX - rb.minX) > 0.34 || abs(ra.minY - rb.minY) > 0.34 || abs(ra.width - rb.width) > 0.67 { ok = false }
    } else { ok = false }
  }
  print("  \(name): break \(best.0) matches within 1/3 pt: \(ok)")
  return (best.0, ok, 1)
}

// ===================================================================

MainActor.assumeIsolated {
  Keeping.file = nil
  let cardSize = CGSize(width: CardArt.cardW, height: CardArt.cardH)
  let artSize = CGSize(width: CardArt.artW, height: CardArt.artH)

  // ---------- faces, reversed faces, blanks: PNG @3x ----------
  if want("faces") {
    for d in ["faces", "faces-reversed", "blanks", "blanks-reversed"] { mkdir("\(out)/\(d)") }
    for c in deck {
      if !modes.isEmpty, let only = modes.first(where: { $0.hasPrefix("only=") }),
        !only.dropFirst(5).split(separator: ",").contains(Substring(c.id))
      { continue }
      let up = Draw(card: c, reversed: false), rv = Draw(card: c, reversed: true)
      writePNG(render(CardFace(draw: up), scale: 3)!, "\(out)/faces/\(c.id).png", alpha: false)
      writePNG(render(CardFace(draw: rv), scale: 3)!, "\(out)/faces-reversed/\(c.id)-reversed.png", alpha: false)
      writePNG(render(CardBlank(draw: up), scale: 3)!, "\(out)/blanks/\(c.id)-blank.png", alpha: false)
      writePNG(render(CardBlank(draw: rv), scale: 3)!, "\(out)/blanks-reversed/\(c.id)-blank-reversed.png", alpha: false)
    }
    print("faces done")
  }

  // ---------- per-card SVG: art, blank art, leaf ----------
  if want("svg") {
    for d in ["art", "blank-art", "leaf"] { mkdir("\(out)/\(d)") }
    for c in deck {
      let a = SVG(artSize.width, artSize.height, prefix: "")
      a.layer(CardArt.art(c.art), .card)
      a.write("\(out)/art/\(c.id).svg")

      let b = SVG(artSize.width, artSize.height, prefix: "")
      pressedLayers(b, CardArt.pressedArt(c.art), strength: CardBlank.strength)
      b.group("kept-leaf") { b.layer(CardArt.leafArt(c.art), .card) }
      b.write("\(out)/blank-art/\(c.id)-blank.svg")

      let l = SVG(artSize.width, artSize.height, prefix: "")
      l.layer(CardArt.leafArt(c.art), .card)
      l.write("\(out)/leaf/\(c.id)-leaf.svg")
    }
    print("svg done")
  }

  mkdir(check)
  // ---------- shared: frame, back, grain, vignette ----------
  if want("shared") {
    mkdir("\(out)/shared")
    let f = SVG(cardSize.width, cardSize.height, prefix: "")
    f.layer(CardArt.frame, .card)
    f.write("\(out)/shared/face-frame.svg")

    let fp = SVG(cardSize.width, cardSize.height, prefix: "")
    pressedLayers(fp, CardArt.pressedFrame, strength: CardBlank.strength)
    fp.write("\(out)/shared/blank-frame.svg")

    // the back, exploded (CardImages.swift:232-258)
    let bk = SVG(cardSize.width, cardSize.height, prefix: "")
    let stock = hex(Palette.backStock)
    bk.raw("<g id=\"stock\"><rect x=\"0\" y=\"0\" width=\"226\" height=\"400\" fill=\"\(stock)\"/></g>")
    bk.group("blind-emboss") { pressedLayers(bk, CardArt.backEmbossMarks(), strength: 1) }
    let backTint = Ink(
      ink: hex(Palette.goldDeep), accent: hex(Palette.gold), gold: hex(Palette.gold), paper: stock)
    let gm = CardArt.backGoldMarks()
    bk.group("gold-hairline") { bk.layer([gm[0]], backTint, flat: true) }
    bk.group("gold-leaf-sun") { bk.layer(Array(gm[1...]), backTint, flat: true) }
    bk.raw(
      "<g id=\"stock-edge\"><rect x=\"0.6\" y=\"0.6\" width=\"224.8\" height=\"398.8\" fill=\"none\" stroke=\"\(hex(Palette.shade))\" stroke-width=\"1.2\" stroke-opacity=\"0.13\"/></g>"
    )
    bk.write("\(out)/shared/card-back.svg")

    writePNG(render(CardBackStatic(), scale: 3)!, "\(out)/shared/card-back.png", alpha: false)

    // the back without grain, for layering the grain in Figma
    let backNoGrain = ZStack {
      Palette.backStock
      Pressed(marks: CardArt.backEmbossMarks(), space: cardSize)
      MarksCanvas(
        marks: CardArt.backGoldMarks(), space: cardSize,
        tint: Tint(ink: Palette.goldDeep, accent: Palette.gold, gold: Palette.gold, paper: Palette.backStock))
      Rectangle().strokeBorder(Palette.shade.opacity(0.13), lineWidth: 1.2)
    }.frame(width: 226, height: 400)
    writePNG(render(backNoGrain, scale: 3)!, "\(check)/back-nograin.png", alpha: false)

    // the grain tile, regenerated exactly as Grain.image (Palette.swift:104-127)
    let n = 96
    let gctx = CGContext(
      data: nil, width: n, height: n, bitsPerComponent: 8, bytesPerRow: n * 4, space: srgb,
      bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
    let gbuf = gctx.data!.bindMemory(to: UInt8.self, capacity: n * n * 4)
    var rng = Rng(9_121)
    for i in 0..<(n * n) {
      let v = UInt8(200 + Int(rng.next() * 55))
      gbuf[i * 4] = v; gbuf[i * 4 + 1] = v; gbuf[i * 4 + 2] = v; gbuf[i * 4 + 3] = 255
    }
    writePNG(gctx.makeImage()!, "\(out)/shared/grain-tile.png", alpha: false)
    // cross-check against the app's own Grain.image drawn 1:1
    if let g = Grain.image, let cg = render(g.frame(width: 96, height: 96), scale: 1) {
      let a = pixels(cg), b = pixels(gctx.makeImage()!)
      var d = 0
      for i in stride(from: 0, to: a.count, by: 4) where a[i] != b[i] { d += 1 }
      print("grain tile vs Grain.image: \(d) differing pixels")
    }

    // the vignette alone (normal blend, transparent), to be laid as Multiply
    let vig = RadialGradient(
      colors: [.clear, Palette.candle.opacity(0.16)], center: .center, startRadius: 110, endRadius: 250
    ).frame(width: 226, height: 400)
    writePNG(render(vig, scale: 3)!, "\(out)/shared/face-vignette.png", alpha: true)

    // grain and vignette laid over plain stock, as the face's finish
    let finish = ZStack {
      Palette.paper
      RadialGradient(
        colors: [.clear, Palette.candle.opacity(0.16)], center: .center, startRadius: 110, endRadius: 250
      ).blendMode(.multiply)
      if let g = Grain.image {
        g.resizable(resizingMode: .tile).blendMode(.multiply).opacity(0.5)
      }
    }.frame(width: 226, height: 400).clipped()
    writePNG(render(finish, scale: 3)!, "\(out)/shared/face-stock.png", alpha: false)
    let blankStock = ZStack {
      Palette.paper
      Pressed(marks: CardArt.pressedFrame, space: cardSize, strength: CardBlank.strength)
      RadialGradient(
        colors: [.clear, Palette.candle.opacity(0.16)], center: .center, startRadius: 110, endRadius: 250
      ).blendMode(.multiply)
      if let g = Grain.image {
        g.resizable(resizingMode: .tile).blendMode(.multiply).opacity(0.5)
      }
    }.frame(width: 226, height: 400).clipped()
    writePNG(render(blankStock, scale: 3)!, "\(out)/shared/blank-stock.png", alpha: false)

    // the empty face: stock + frame, no art or type
    let empty = ZStack {
      Palette.paper
      MarksCanvas(marks: CardArt.frame, space: cardSize)
      RadialGradient(
        colors: [.clear, Palette.candle.opacity(0.16)], center: .center, startRadius: 110, endRadius: 250
      ).blendMode(.multiply)
      if let g = Grain.image {
        g.resizable(resizingMode: .tile).blendMode(.multiply).opacity(0.5)
      }
    }.frame(width: 226, height: 400).clipped()
    writePNG(render(empty, scale: 3)!, "\(out)/shared/face-template.png", alpha: false)

    // vignette profile on the stock: multiply result along the diagonal
    var prof: [String] = []
    let noGrain = ZStack {
      Palette.paper
      RadialGradient(
        colors: [.clear, Palette.candle.opacity(0.16)], center: .center, startRadius: 110, endRadius: 250
      ).blendMode(.multiply)
    }.frame(width: 226, height: 400)
    if let cg = render(noGrain, scale: 1) {
      let px = pixels(cg)
      for (x, y) in [(113, 200), (113, 100), (113, 60), (113, 30), (113, 5), (113, 0), (0, 200), (0, 0), (20, 30), (200, 380)] {
        let i = (y * 226 + x) * 4
        let d = hypot(Double(x) + 0.5 - 113, Double(y) + 0.5 - 200)
        prof.append(String(format: "{\"x\":%d,\"y\":%d,\"r\":%.1f,\"rgb\":\"#%02X%02X%02X\"}", x, y, d, px[i], px[i + 1], px[i + 2]))
      }
    }
    try! ("[" + prof.joined(separator: ",") + "]").write(
      toFile: "\(check)/vignette-profile.json", atomically: true, encoding: .utf8)
    print("shared done")
  }

  // ---------- deck.json ----------
  if want("deck") {
    func r2(_ v: CGFloat) -> Double { (Double(v) * 100).rounded() / 100 }
    func rect(_ r: CGRect?) -> Any {
      guard let r else { return NSNull() }
      return ["x": r2(r.minX), "y": r2(r.minY), "w": r2(r.width), "h": r2(r.height), "cx": r2(r.midX), "cy": r2(r.midY)]
    }
    func colorName(_ c: InkColor?) -> String {
      guard let c else { return "none" }
      switch c { case .ink: return "ink"; case .accent: return "oxblood"; case .gold: return "gold"; case .paper: return "paper" }
    }
    var cards: [[String: Any]] = []
    var names: [String: [String]] = [:]
    for (i, c) in deck.enumerated() {
      let name = c.name.uppercased()
      let (lines, exact, shrink) = nameLines(name)
      names[c.id] = lines
      var layout: [String: Any] = [:]
      for rev in [false, true] {
        Rec.f = [:]
        _ = render(TypeLayer(draw: Draw(card: c, reversed: rev)), scale: 3)
        let fr = Rec.f
        // ideal (unconstrained) widths, to know whether anything was shrunk
        Rec.f = [:]
        _ = render(
          VStack {
            Text(c.essence).font(.italic(12.5)).fixedSize().rec("essIdeal")
            ForEach(Array(lines.enumerated()), id: \.offset) { k, l in
              Text(l).font(.display(17)).tracking(1.4).fixedSize().rec("line\(k)")
            }
            Text(c.roman).font(.display(15)).tracking(3.2).fixedSize().rec("numIdeal")
          }.coordinateSpace(name: "card"), scale: 3)
        let ideal = Rec.f
        // ink boxes of each element at 4x
        var inkB: [String: Any] = [:]
        for el in ["numeral", "name", "essence", "diamond"] where el != "diamond" || rev {
          if el == "numeral" && c.roman.isEmpty { inkB[el] = NSNull(); continue }
          let cg = render(TypeLayer(draw: Draw(card: c, reversed: rev), show: [el]), scale: 4)!
          inkB[el] = rect(inkBBox(cg, scale: 4))
        }
        layout[rev ? "reversed" : "upright"] = [
          "numeral_frame": c.roman.isEmpty ? NSNull() : rect(fr["numeral"]),
          "name_frame": rect(fr["name"]),
          "essence_frame": rect(fr["essence"]),
          "diamond_frame": rev ? rect(fr["diamond"]) : NSNull(),
          "stack_frame": rect(fr["stack"]),
          "ink_bbox": inkB,
          "name_line_widths": lines.indices.map { r2(ideal["line\($0)"]?.width ?? 0) },
          "essence_ideal_width": r2(ideal["essIdeal"]?.width ?? 0),
          "numeral_ideal_width": c.roman.isEmpty ? NSNull() : r2(ideal["numIdeal"]?.width ?? 0),
          "essence_shrunk": (ideal["essIdeal"]?.width ?? 0) > 182.01,
        ] as [String: Any]
      }
      let marks = CardArt.art(c.art)
      let golds = marks.enumerated().filter { $0.element.fill == .gold }.map { k, m -> [String: Any] in
        let b = m.path.boundingRect
        return ["mark": k, "art_bbox": rect(b), "card_bbox": rect(b.offsetBy(dx: 20, dy: 52)),
                "outline": m.stroke != nil ? "ink 0.8" : "none"]
      }
      let blood = marks.enumerated().filter { $0.element.fill == .accent || $0.element.stroke == .accent }.map { k, m -> [String: Any] in
        ["mark": k, "art_bbox": rect(m.path.boundingRect), "as": m.fill == .accent ? "fill" : "stroke \(num(m.width))"]
      }
      let paper = marks.enumerated().filter { $0.element.fill == .paper || $0.element.stroke == .paper }.map { k, m -> [String: Any] in
        ["mark": k, "art_bbox": rect(m.path.boundingRect), "as": m.fill == .paper ? "fill" : "stroke \(num(m.width))"]
      }
      let widths = Set(marks.compactMap { $0.stroke != nil ? Double($0.width) : nil }).sorted()
      var suit: Any = NSNull(), rank: Any = NSNull()
      switch c.art {
      case .pip(let s, let n): suit = s.rawValue; rank = n == 1 ? "ace" : String(n)
      case .court(let s, let k): suit = s.rawValue; rank = k.rawValue
      default: break
      }
      cards.append([
        "index": i, "id": c.id, "arcana": i < 22 ? "major" : "minor", "suit": suit, "rank": rank,
        "art_kind": c.art.name, "numeral": c.roman, "name": c.name, "name_drawn": name,
        "name_lines": lines, "name_lines_verified_by_pixels": exact, "name_shrink": shrink,
        "essence": c.essence, "upright": c.upright, "reversed": c.reversed,
        "keys": c.keys, "keys_reversed": c.keysRev,
        "marks": marks.count, "pressed_marks": CardArt.pressedArt(c.art).count,
        "leaf_marks": CardArt.leafArt(c.art).count,
        "stroke_widths": widths, "gold": golds, "oxblood": blood, "paper_cuts": paper,
        "layout": layout,
      ])
    }
    let spreads = Spread.all.map { s -> [String: Any] in
      ["id": s.id, "name": s.name, "sub": s.sub, "positions": s.slots, "notes_midi": s.notes]
    }
    let deckJSON: [String: Any] = ["cards": cards, "spreads": spreads]
    let data = try! JSONSerialization.data(withJSONObject: deckJSON, options: [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes])
    try! data.write(to: URL(fileURLWithPath: "\(check)/deck-measured.json"))
    // mark combos, to name SVG groups honestly
    var combos: [String: Int] = [:]
    for c in deck {
      for m in CardArt.art(c.art) { combos["fill \(colorName(m.fill)) / stroke \(colorName(m.stroke))", default: 0] += 1 }
    }
    print("combos", combos)
    print("deck done")
  }

  // ---------- check: render comparison helpers ----------
  if modes.contains("typecheck") {
    // type alone (transparent), upright and reversed, @3x, for the Figma calibration
    mkdir(check)
    for id in ["fool", "hierophant", "cups-7", "swords-queen", "star", "pentacles-knight"] {
      let c = deck.first { $0.id == id }!
      for rev in [false, true] {
        let cg = render(TypeLayer(draw: Draw(card: c, reversed: rev)), scale: 3)!
        writePNG(cg, "\(check)/type-\(id)\(rev ? "-reversed" : "").png", alpha: true)
      }
    }
    // art alone via MarksCanvas, @3x, for SVG comparison
    for id in ["priestess", "sun", "moon", "cups-7", "swords-queen", "wands-3", "world", "magician"] {
      let c = deck.first { $0.id == id }!
      let cg = render(MarksCanvas(marks: CardArt.art(c.art), space: artSize).frame(width: 186, height: 248), scale: 3)!
      writePNG(cg, "\(check)/art-\(id).png", alpha: true)
      let cb = render(
        ZStack {
          Pressed(marks: CardArt.pressedArt(c.art), space: artSize, strength: CardBlank.strength)
          MarksCanvas(marks: CardArt.leafArt(c.art), space: artSize)
        }.frame(width: 186, height: 248), scale: 3)!
      writePNG(cb, "\(check)/blank-art-\(id).png", alpha: true)
    }
    let cg = render(MarksCanvas(marks: CardArt.frame, space: cardSize).frame(width: 226, height: 400), scale: 3)!
    writePNG(cg, "\(check)/frame.png", alpha: true)
    for id in ["priestess", "sun", "moon", "cups-7"] {
      let c = deck.first { $0.id == id }!
      let cl = render(MarksCanvas(marks: CardArt.leafArt(c.art), space: artSize).frame(width: 186, height: 248), scale: 3)!
      writePNG(cl, "\(check)/leaf-\(id).png", alpha: true)
    }
    let bf = render(Pressed(marks: CardArt.pressedFrame, space: cardSize, strength: CardBlank.strength).frame(width: 226, height: 400), scale: 3)!
    writePNG(bf, "\(check)/blank-frame.png", alpha: true)
    print("typecheck done")
  }
}
