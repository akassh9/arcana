import AppKit
import SwiftUI
@testable import ArcanaKit

// ===================================================================
//  The glyph tool's core: a drawn thing as a list of painted paths, the
//  same list written as SVG and drawn by SwiftUI, and a pixel diff.
// ===================================================================

struct RGBA {
  var r, g, b: Double
  var a: Double = 1
  func o(_ x: Double) -> RGBA { RGBA(r: r, g: g, b: b, a: a * x) }
  var hex: String {
    func q(_ v: Double) -> Int { Int((v * 255).rounded()) }
    return String(format: "#%02X%02X%02X", q(r), q(g), q(b))
  }
  var color: Color { Color(red: r, green: g, blue: b).opacity(a) }

  /// A Palette colour read back from SwiftUI, in sRGB.
  init(_ c: Color) {
    let n = NSColor(c).usingColorSpace(.sRGB)!
    r = Double(n.redComponent); g = Double(n.greenComponent); b = Double(n.blueComponent)
    a = Double(n.alphaComponent)
  }
  init(r: Double, g: Double, b: Double, a: Double = 1) { self.r = r; self.g = g; self.b = b; self.a = a }
}

enum P {
  static let ink = RGBA(Palette.ink)
  static let text = RGBA(Palette.text)
  static let goldInk = RGBA(Palette.goldInk)
  static let gold = RGBA(Palette.gold)
  static let goldLit = RGBA(Palette.goldLit)
  static let blood = RGBA(Palette.blood)
  static let paper = RGBA(Palette.paper)
  static let pearl = RGBA(Palette.pearl)
  static let leaf: [(RGBA, Double)] = Palette.leaf.stops.map { (RGBA($0.color), Double($0.location)) }
}

enum Paint {
  case solid(RGBA)
  /// Palette.leaf from one corner of the shape's box to the other.
  case leaf(CGPoint, CGPoint)
  case linear([(RGBA, Double)], CGPoint, CGPoint)
  case radial([(RGBA, Double)], CGPoint, Double)
}

/// How an item is written into SVG, when it is more than a path.
enum Form {
  case path
  case rect(CGRect, rotate: Double)  // rotated about its centre, as rotationEffect does
  case ellipse(CGRect)
}

struct Item {
  var path: Path
  var fill: Paint? = nil
  var stroke: Paint? = nil
  var width: CGFloat = 1
  var cap: CGLineCap = .round
  var join: CGLineJoin = .round
  var opacity: Double = 1
  var group: String = "ink"
  var id: String? = nil
  var form: Form = .path
  var screen = false
}

struct Glyph {
  var name: String
  var size: CGSize
  var items: [Item]
  var ground: RGBA? = nil
}

// --- from the pen's marks --------------------------------------------

struct Inks {
  var ink = P.ink, accent = P.blood, gold = P.gold, paper = P.paper
  var gilded = true
  static let card = Inks()
  static func only(_ c: RGBA) -> Inks { Inks(ink: c, accent: c, gold: c, paper: c, gilded: false) }
  func of(_ c: InkColor) -> RGBA {
    switch c {
    case .ink: return ink
    case .accent: return accent
    case .gold: return gold
    case .paper: return paper
    }
  }
}

func role(_ c: InkColor, fill: Bool) -> String {
  switch c {
  case .ink: return fill ? "ink-fill" : "ink"
  case .accent: return "oxblood"
  case .gold: return "gold-leaf"
  case .paper: return "paper"
  }
}

/// The marks as MarksCanvas paints them: each fill (gold as leaf across its
/// own box), then its stroke, round at the caps and joins — scaled by `s`
/// from their space and moved by `at`.
func items(
  _ marks: [Mark], _ inks: Inks, s: CGFloat = 1, at: CGPoint = .zero,
  group: String? = nil, ids: [String]? = nil
) -> [Item] {
  let t = CGAffineTransform(a: s, b: 0, c: 0, d: s, tx: at.x, ty: at.y)
  return marks.enumerated().map { (i, m) in
    var it = Item(path: m.path.applying(t))
    if let f = m.fill {
      if f == .gold && inks.gilded {
        let r = m.path.boundingRect
        it.fill = .leaf(CGPoint(x: r.minX, y: r.minY).applying(t), CGPoint(x: r.maxX, y: r.maxY).applying(t))
      } else {
        it.fill = .solid(inks.of(f))
      }
      it.group = group ?? role(f, fill: true)
    } else if let st = m.stroke {
      it.group = group ?? role(st, fill: false)
    }
    if let st = m.stroke { it.stroke = .solid(inks.of(st)) }
    it.width = m.width * s
    if let ids, i < ids.count { it.id = ids[i] }
    return it
  }
}

// --- SVG ------------------------------------------------------------

func num(_ v: CGFloat) -> String {
  var s = String(format: "%.3f", Double(v))
  while s.hasSuffix("0") { s.removeLast() }
  if s.hasSuffix(".") { s.removeLast() }
  return s == "-0" ? "0" : s
}

func pathData(_ p: Path) -> String {
  var d: [String] = []
  p.forEach { el in
    switch el {
    case .move(let a): d.append("M\(num(a.x)) \(num(a.y))")
    case .line(let a): d.append("L\(num(a.x)) \(num(a.y))")
    case .quadCurve(let a, let c): d.append("Q\(num(c.x)) \(num(c.y)) \(num(a.x)) \(num(a.y))")
    case .curve(let a, let c1, let c2):
      d.append("C\(num(c1.x)) \(num(c1.y)) \(num(c2.x)) \(num(c2.y)) \(num(a.x)) \(num(a.y))")
    case .closeSubpath: d.append("Z")
    }
  }
  return d.joined(separator: " ")
}

func svg(_ g: Glyph) -> String {
  var defs: [String] = []
  var n = 0
  func stops(_ s: [(RGBA, Double)]) -> String {
    s.map { c, o in
      "<stop offset=\"\(num(o))\" stop-color=\"\(c.hex)\"\(c.a < 0.9995 ? " stop-opacity=\"\(num(c.a))\"" : "")/>"
    }.joined()
  }
  func paint(_ p: Paint, _ kind: String) -> String {
    switch p {
    case .solid(let c):
      return "\(kind)=\"\(c.hex)\"" + (c.a < 0.9995 ? " \(kind)-opacity=\"\(num(c.a))\"" : "")
    case .leaf(let a, let b):
      n += 1
      let id = "leaf-\(n)"
      defs.append(
        "<linearGradient id=\"\(id)\" gradientUnits=\"userSpaceOnUse\" x1=\"\(num(a.x))\" y1=\"\(num(a.y))\" x2=\"\(num(b.x))\" y2=\"\(num(b.y))\">\(stops(P.leaf))</linearGradient>"
      )
      return "\(kind)=\"url(#\(id))\""
    case .linear(let s, let a, let b):
      n += 1
      let id = "grad-\(n)"
      defs.append(
        "<linearGradient id=\"\(id)\" gradientUnits=\"userSpaceOnUse\" x1=\"\(num(a.x))\" y1=\"\(num(a.y))\" x2=\"\(num(b.x))\" y2=\"\(num(b.y))\">\(stops(s))</linearGradient>"
      )
      return "\(kind)=\"url(#\(id))\""
    case .radial(let s, let c, let r):
      n += 1
      let id = "glow-\(n)"
      defs.append(
        "<radialGradient id=\"\(id)\" gradientUnits=\"userSpaceOnUse\" cx=\"\(num(c.x))\" cy=\"\(num(c.y))\" r=\"\(num(r))\">\(stops(s))</radialGradient>"
      )
      return "\(kind)=\"url(#\(id))\""
    }
  }
  var body: [String] = []
  if let gr = g.ground {
    body.append("<rect id=\"ground\" width=\"\(num(g.size.width))\" height=\"\(num(g.size.height))\" fill=\"\(gr.hex)\"/>")
  }
  // a group is "inner" or "outer.inner": consecutive items share a <g>
  var outer: String? = nil, inner: String? = nil
  var used: [String: Int] = [:]
  func unique(_ s: String) -> String {
    let k = (used[s] ?? 0) + 1
    used[s] = k
    return k == 1 ? s : "\(s)-\(k)"
  }
  for it in g.items {
    let parts = it.group.split(separator: ".", maxSplits: 1).map(String.init)
    let o = parts.count == 2 ? parts[0] : nil, i = parts.last!
    if o != outer {
      if inner != nil { body.append("</g>") }
      if outer != nil { body.append("</g>") }
      if let o { body.append("<g id=\"\(unique(o))\">") }
      outer = o
      inner = nil
    }
    if i != inner {
      if inner != nil { body.append("</g>") }
      body.append("<g id=\"\(unique((o.map { $0 + "-" } ?? "") + i))\">")
      inner = i
    }
    var a: [String] = []
    if let id = it.id { a.append("id=\"\(id)\"") }
    switch it.form {
    case .path: a.append("d=\"\(pathData(it.path))\"")
    case .rect(let r, let rot):
      a.append("x=\"\(num(r.minX))\" y=\"\(num(r.minY))\" width=\"\(num(r.width))\" height=\"\(num(r.height))\"")
      if rot != 0 { a.append("transform=\"rotate(\(num(rot)) \(num(r.midX)) \(num(r.midY)))\"") }
    case .ellipse(let r):
      a.append("cx=\"\(num(r.midX))\" cy=\"\(num(r.midY))\" rx=\"\(num(r.width / 2))\" ry=\"\(num(r.height / 2))\"")
    }
    a.append(it.fill.map { paint($0, "fill") } ?? "fill=\"none\"")
    if let s = it.stroke {
      a.append(paint(s, "stroke"))
      a.append("stroke-width=\"\(num(it.width))\"")
      a.append("stroke-linecap=\"\(it.cap == .round ? "round" : it.cap == .square ? "square" : "butt")\"")
      a.append("stroke-linejoin=\"\(it.join == .round ? "round" : it.join == .bevel ? "bevel" : "miter")\"")
      if it.join == .miter { a.append("stroke-miterlimit=\"10\"") }
    }
    if it.opacity < 0.9995 { a.append("opacity=\"\(num(it.opacity))\"") }
    let tag: String
    switch it.form {
    case .path: tag = "path"
    case .rect: tag = "rect"
    case .ellipse: tag = "ellipse"
    }
    body.append("<\(tag) " + a.joined(separator: " ") + "/>")
  }
  if inner != nil { body.append("</g>") }
  if outer != nil { body.append("</g>") }
  let w = num(g.size.width), h = num(g.size.height)
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"\(w)\" height=\"\(h)\" viewBox=\"0 0 \(w) \(h)\" fill=\"none\">\n"
    + (defs + body).joined(separator: "\n") + "\n</svg>\n"
}

// --- drawn by SwiftUI -------------------------------------------------

func shading(_ p: Paint) -> GraphicsContext.Shading {
  func grad(_ s: [(RGBA, Double)]) -> Gradient {
    Gradient(stops: s.map { .init(color: $0.0.color, location: $0.1) })
  }
  switch p {
  case .solid(let c): return .color(c.color)
  case .leaf(let a, let b): return .linearGradient(Palette.leaf, startPoint: a, endPoint: b)
  case .linear(let s, let a, let b): return .linearGradient(grad(s), startPoint: a, endPoint: b)
  case .radial(let s, let c, let r):
    return .radialGradient(grad(s), center: c, startRadius: 0, endRadius: r)
  }
}

func paint(_ ctx: GraphicsContext, _ items: [Item]) {
  for it in items {
    var c = ctx
    c.opacity = it.opacity
    if it.screen { c.blendMode = .screen }
    var path = it.path
    switch it.form {
    case .path: break
    case .ellipse(let r): path = Path(ellipseIn: r)
    case .rect(let r, let rot):
      let t = CGAffineTransform(translationX: r.midX, y: r.midY).rotated(by: rot * .pi / 180)
        .translatedBy(x: -r.midX, y: -r.midY)
      path = Path(r).applying(t)
    }
    if let f = it.fill { c.fill(path, with: shading(f)) }
    if let s = it.stroke {
      c.stroke(path, with: shading(s), style: StrokeStyle(lineWidth: it.width, lineCap: it.cap, lineJoin: it.join))
    }
  }
}

struct GlyphView: View {
  let g: Glyph
  var body: some View {
    Canvas(rendersAsynchronously: false) { ctx, _ in
      if let gr = g.ground { ctx.fill(Path(CGRect(origin: .zero, size: g.size)), with: .color(gr.color)) }
      paint(ctx, g.items)
    }
    .frame(width: g.size.width, height: g.size.height)
  }
}

// --- PNG ------------------------------------------------------------

/// An ImageRenderer still, flattened to eight bits a channel in sRGB.
@MainActor func png<V: View>(_ view: V, scale: CGFloat, to url: URL) {
  let r = ImageRenderer(content: view)
  r.scale = scale
  guard let cg = r.cgImage else { fatalError("no image for \(url.lastPathComponent)") }
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  let ctx = CGContext(
    data: nil, width: cg.width, height: cg.height, bitsPerComponent: 8, bytesPerRow: 0, space: space,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.draw(cg, in: CGRect(x: 0, y: 0, width: cg.width, height: cg.height))
  let still = ctx.makeImage()!
  let rep = NSBitmapImageRep(cgImage: still)
  try! FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  try! rep.representation(using: .png, properties: [:])!.write(to: url)
}

/// RGBA8 pixels of a PNG, composited over `ground` (nil: kept premultiplied on clear).
func pixels(_ url: URL, ground: RGBA? = nil) -> (w: Int, h: Int, px: [UInt8])? {
  guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
    let im = CGImageSourceCreateImageAtIndex(src, 0, nil)
  else { return nil }
  let w = im.width, h = im.height
  var px = [UInt8](repeating: 0, count: w * h * 4)
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  px.withUnsafeMutableBytes { buf in
    let ctx = CGContext(
      data: buf.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: space,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    if let g = ground {
      ctx.setFillColor(CGColor(srgbRed: g.r, green: g.g, blue: g.b, alpha: 1))
      ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    }
    ctx.draw(im, in: CGRect(x: 0, y: 0, width: w, height: h))
  }
  return (w, h, px)
}

/// Mean and max channel difference, and the share of pixels off by more than 24.
func diff(_ a: URL, _ b: URL, ground: RGBA? = P.pearl) -> String {
  guard let x = pixels(a, ground: ground), let y = pixels(b, ground: ground) else { return "unreadable" }
  guard x.w == y.w, x.h == y.h else { return "size \(x.w)x\(x.h) vs \(y.w)x\(y.h)" }
  var sum = 0, mx = 0, off = 0
  for i in 0..<(x.w * x.h) {
    var m = 0
    for k in 0..<4 {
      let d = abs(Int(x.px[i * 4 + k]) - Int(y.px[i * 4 + k]))
      sum += d
      m = max(m, d)
    }
    mx = max(mx, m)
    if m > 24 { off += 1 }
  }
  let mean = Double(sum) / Double(x.w * x.h * 4)
  return String(format: "mean %.3f  max %d  >24: %.3f%%", mean, mx, 100 * Double(off) / Double(x.w * x.h))
}
