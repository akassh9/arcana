// brand — offline renders of Arcana's brand pieces for the Figma handoff.
// Compiled with every file in Sources/Arcana except ArcanaApp.swift (see ../make.sh).
// Nothing goes on screen: ImageRenderer and Core Graphics only. No sound is
// ever let out: the main thread never yields, so the drone's fade-in task never
// runs, and the Sfx engine is switched off before anything is drawn.
//
//   brand icon      OUT.png             the fallback code-drawn icon (Tools/icon's IconView), 1144 px
//   brand iconsvg   OUT.svg             the same icon as SVG: tile, glow, and CardArt.iconMarks() as paths
//   brand wordmark  OUT.svg OUTCHECK.png  ARCANA (Didot-Bold 62, tracking 20) as glyph outlines,
//                                         checked against SwiftUI's own Text at 4x
//   brand stage     OUT.png SCALE PHASE  the opening screen (shot pose 1-invocation) at SCALE,
//                                         rendered when (seconds mod 12) = PHASE, i.e. the
//                                         title light at k = PHASE / 3.2 (PHASE < 0: render now)

import AppKit
import CoreText
import SwiftUI

_ = NSApplication.shared
let args = CommandLine.arguments
func fail(_ s: String) -> Never {
  FileHandle.standardError.write((s + "\n").data(using: .utf8)!)
  exit(1)
}
guard args.count > 2 else { fail("usage: brand icon|iconsvg|wordmark|stage OUT ...") }

// --- the fallback icon, as Tools/icon/main.swift draws it (copied verbatim) ---
struct IconView: View {
  var body: some View {
    ZStack {
      Palette.void
      RadialGradient(
        colors: [Color(red: 0.22, green: 0.17, blue: 0.08), .clear],
        center: .center, startRadius: 40, endRadius: 560)
      MarksCanvas(marks: CardArt.iconMarks(), space: CGSize(width: 1024, height: 1024))
      if let g = Grain.image {
        g.resizable(resizingMode: .tile).blendMode(.overlay).opacity(0.10)
      }
    }
    .frame(width: 1024, height: 1024)
    .clipShape(RoundedRectangle(cornerRadius: 180, style: .continuous))
    .padding(60)
    .frame(width: 1144, height: 1144)
  }
}

// --- helpers --------------------------------------------------------------------
func hex(_ c: Color) -> String {
  let n = NSColor(c).usingColorSpace(.sRGB)!
  func b(_ v: CGFloat) -> Int { Int((max(0, min(1, v)) * 255).rounded()) }
  return String(format: "#%02X%02X%02X", b(n.redComponent), b(n.greenComponent), b(n.blueComponent))
}
func f(_ v: CGFloat) -> String {
  var s = String(format: "%.3f", Double(v))
  while s.contains(".") && (s.hasSuffix("0") || s.hasSuffix(".")) { s.removeLast() }
  return s == "-0" ? "0" : s
}
func svgD(_ path: CGPath, _ t: CGAffineTransform = .identity) -> String {
  var d: [String] = []
  path.applyWithBlock { el in
    let e = el.pointee
    let p = e.points
    func q(_ i: Int) -> String {
      let a = p[i].applying(t)
      return "\(f(a.x)) \(f(a.y))"
    }
    switch e.type {
    case .moveToPoint: d.append("M\(q(0))")
    case .addLineToPoint: d.append("L\(q(0))")
    case .addQuadCurveToPoint: d.append("Q\(q(0)) \(q(1))")
    case .addCurveToPoint: d.append("C\(q(0)) \(q(1)) \(q(2))")
    case .closeSubpath: d.append("Z")
    @unknown default: break
    }
  }
  return d.joined(separator: " ")
}
func writeImage(_ cg: CGImage, _ path: String) {
  // 8-bit sRGB, as the shot tool writes
  let srgb = CGColorSpace(name: CGColorSpace.sRGB)!
  let ctx = CGContext(
    data: nil, width: cg.width, height: cg.height, bitsPerComponent: 8, bytesPerRow: 0,
    space: srgb, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.draw(cg, in: CGRect(x: 0, y: 0, width: cg.width, height: cg.height))
  guard let still = ctx.makeImage(),
    let png = NSBitmapImageRep(cgImage: still).representation(using: .png, properties: [:])
  else { fail("× \(path)") }
  try! png.write(to: URL(fileURLWithPath: path))
}
@MainActor func render<V: View>(_ v: V, scale: CGFloat) -> CGImage {
  let r = ImageRenderer(content: v)
  r.scale = scale
  guard let ns = r.nsImage, let tiff = ns.tiffRepresentation,
    let cg = NSBitmapImageRep(data: tiff)?.cgImage
  else { fail("render failed") }
  return cg
}
let leafStops: String = {
  Palette.leaf.stops.map { s in
    "<stop offset=\"\(f(s.location))\" stop-color=\"\(hex(s.color))\"/>"
  }.joined()
}()

MainActor.assumeIsolated {
  Keeping.file = nil  // never the reader's kept readings
  Sfx.shared.enabled = false  // and never a sound

  switch args[1] {
  case "icon":
    writeImage(render(IconView(), scale: 1), args[2])
    print("✓ icon → \(args[2])")

  case "iconsvg":
    // canvas 1144, the body 1024 at (60, 60), as IconView pads it
    let o = CGAffineTransform(translationX: 60, y: 60)
    let tile = RoundedRectangle(cornerRadius: 180, style: .continuous)
      .path(in: CGRect(x: 0, y: 0, width: 1024, height: 1024)).cgPath
    let tint = Tint.card
    var groups: [String: [String]] = [:]
    var order: [String] = []
    var defs: [String] = []
    var gid = 0
    func put(_ g: String, _ s: String) {
      if groups[g] == nil { order.append(g) }
      groups[g, default: []].append(s)
    }
    func name(_ c: InkColor, fill: Bool) -> String {
      switch c {
      case .ink: return "ink"
      case .accent: return "oxblood"
      case .gold: return fill ? "gold-leaf" : "gold"
      case .paper: return "paper"
      }
    }
    for m in CardArt.iconMarks() {
      let cg = m.path.cgPath
      let d = svgD(cg, o)
      if let fc = m.fill {
        if fc == .gold && tint.gilded {
          let r = m.path.boundingRect.applying(o)
          gid += 1
          defs.append(
            "<linearGradient id=\"leaf-\(gid)\" gradientUnits=\"userSpaceOnUse\" x1=\"\(f(r.minX))\" y1=\"\(f(r.minY))\" x2=\"\(f(r.maxX))\" y2=\"\(f(r.maxY))\">\(leafStops)</linearGradient>"
          )
          put("gold-leaf", "<path d=\"\(d)\" fill=\"url(#leaf-\(gid))\"/>")
        } else {
          put(name(fc, fill: true), "<path d=\"\(d)\" fill=\"\(hex(tint.of(fc)))\"/>")
        }
      }
      if let sc = m.stroke {
        put(
          name(sc, fill: false),
          "<path d=\"\(d)\" fill=\"none\" stroke=\"\(hex(tint.of(sc)))\" stroke-width=\"\(f(m.width))\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
        )
      }
    }
    // glow: SwiftUI RadialGradient(startRadius 40, endRadius 560) from #382B14 to clear,
    // centred on the body; as SVG stops: offset 40/560 opaque, 1 transparent
    let glowHex = hex(Color(red: 0.22, green: 0.17, blue: 0.08))
    defs.append(
      "<radialGradient id=\"glow\" gradientUnits=\"userSpaceOnUse\" cx=\"572\" cy=\"572\" r=\"560\"><stop offset=\"\(f(40.0 / 560))\" stop-color=\"\(glowHex)\"/><stop offset=\"1\" stop-color=\"\(glowHex)\" stop-opacity=\"0\"/></radialGradient>"
    )
    let tileD = svgD(tile, o)
    var s =
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1144\" height=\"1144\" viewBox=\"0 0 1144 1144\">"
    s += "<defs>\(defs.joined())</defs>"
    s += "<g id=\"tile\"><path id=\"void\" d=\"\(tileD)\" fill=\"\(hex(Palette.void))\"/>"
    // the glow is clipped by the tile in the app; it fades out at r 560 so only the
    // corners (beyond r 512 from the centre) could spill: clip it to the tile shape
    s += "<clipPath id=\"tile-clip\"><path d=\"\(tileD)\"/></clipPath>"
    s += "<rect id=\"glow\" x=\"60\" y=\"60\" width=\"1024\" height=\"1024\" fill=\"url(#glow)\" clip-path=\"url(#tile-clip)\"/></g>"
    s += "<g id=\"marks\">"
    for g in order { s += "<g id=\"\(g)\">\(groups[g]!.joined())</g>" }
    s += "</g></svg>\n"
    try! s.write(toFile: args[2], atomically: true, encoding: .utf8)
    print("✓ iconsvg → \(args[2]) groups \(order.map { "\($0):\(groups[$0]!.count)" })")

  case "wordmark":
    // ARCANA as SwiftUI sets it: Text("ARCANA").font(.display(62)).tracking(20)
    let size: CGFloat = 62, track: CGFloat = 20
    let font = CTFontCreateWithName("Didot-Bold" as CFString, size, nil)
    let asc = CTFontGetAscent(font), desc = CTFontGetDescent(font)
    let lineH = (asc + desc).rounded(), base = asc.rounded()
    let str = "ARCANA"
    var chars = Array(str.utf16)
    var glyphs = [CGGlyph](repeating: 0, count: chars.count)
    CTFontGetGlyphsForCharacters(font, &chars, &glyphs, chars.count)
    var adv = [CGSize](repeating: .zero, count: glyphs.count)
    CTFontGetAdvancesForGlyphs(font, .horizontal, &glyphs, &adv, glyphs.count)
    // pair kerning from a plain CTLine (tracking added by hand after each glyph)
    let line = CTLineCreateWithAttributedString(
      NSAttributedString(string: str, attributes: [.font: font as NSFont]))
    var pos: [CGPoint] = []
    for run in CTLineGetGlyphRuns(line) as! [CTRun] {
      let n = CTRunGetGlyphCount(run)
      var p = [CGPoint](repeating: .zero, count: n)
      CTRunGetPositions(run, CFRange(location: 0, length: n), &p)
      pos += p
    }
    let plainW = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
    let totalW = plainW + track * CGFloat(glyphs.count)  // free-standing Text keeps the last tracking
    // SwiftUI's own render, to check against
    let swiftText = Text(str).font(.display(size)).tracking(track).foregroundStyle(Palette.text)
      .fixedSize()
    let check = 4.0
    let ref = render(swiftText, scale: check)
    let refW = CGFloat(ref.width) / check, refH = CGFloat(ref.height) / check
    // outlines, y down, baseline at round(ascent)
    let letters = CGMutablePath()
    var parts: [(String, String)] = []
    for (i, g) in glyphs.enumerated() {
      guard let gp = CTFontCreatePathForGlyph(font, g, nil) else { continue }
      let x = pos[i].x + track * CGFloat(i)
      let t = CGAffineTransform(a: 1, b: 0, c: 0, d: -1, tx: x, ty: base)
      letters.addPath(gp, transform: t)
      parts.append((String(str[str.index(str.startIndex, offsetBy: i)]), svgD(gp, t)))
    }
    // compare: draw the outlines at the check scale into the SwiftUI render's size
    let W = ref.width, H = ref.height
    let srgb = CGColorSpace(name: CGColorSpace.sRGB)!
    func alpha(_ draw: (CGContext) -> Void) -> [UInt8] {
      var px = [UInt8](repeating: 0, count: W * H * 4)
      px.withUnsafeMutableBytes { b in
        let c = CGContext(
          data: b.baseAddress, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4,
          space: srgb, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        draw(c)
      }
      return stride(from: 3, to: px.count, by: 4).map { px[$0] }
    }
    let a1 = alpha { c in c.draw(ref, in: CGRect(x: 0, y: 0, width: W, height: H)) }
    let a2 = alpha { c in
      c.translateBy(x: 0, y: CGFloat(H))
      c.scaleBy(x: check, y: -check)
      c.addPath(letters)
      c.setFillColor(NSColor(Palette.text).cgColor)
      c.fillPath()
    }
    var diff = 0.0, big = 0
    for i in 0..<a1.count {
      let d = abs(Int(a1[i]) - Int(a2[i]))
      diff += Double(d)
      if d > 64 { big += 1 }
    }
    let covered = a1.filter { $0 > 0 }.count
    print(
      "wordmark: SwiftUI frame \(f(refW)) x \(f(refH)) pt; mine \(f(totalW)) x \(f(lineH)) pt; ascent \(f(asc)) descent \(f(desc)); mean |Δalpha| \(String(format: "%.3f", diff / Double(a1.count))) /255, px off by >64: \(big) of \(covered) inked"
    )
    // the check image: SwiftUI in ink, outlines in red on top at 50%
    let chk = CGContext(
      data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0, space: srgb,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    chk.setFillColor(CGColor(srgbRed: 1, green: 1, blue: 1, alpha: 1))
    chk.fill(CGRect(x: 0, y: 0, width: W, height: H))
    chk.draw(ref, in: CGRect(x: 0, y: 0, width: W, height: H))
    chk.translateBy(x: 0, y: CGFloat(H))
    chk.scaleBy(x: check, y: -check)
    chk.addPath(letters)
    chk.setFillColor(CGColor(srgbRed: 1, green: 0, blue: 0, alpha: 0.5))
    chk.fillPath()
    writeImage(chk.makeImage()!, args[3])

    let ink = hex(Palette.text)
    // the frame is SwiftUI's text box widened on the left just enough for the first A's
    // serif, which overhangs its advance (Figma clips an imported SVG's frame)
    let inkBox = letters.boundingBoxOfPath
    let pad = max(0, ceil(-inkBox.minX))
    print("wordmark ink box \(f(inkBox.minX)),\(f(inkBox.minY)) .. \(f(inkBox.maxX)),\(f(inkBox.maxY)); left pad \(f(pad))")
    var s =
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"\(f(refW + pad))\" height=\"\(f(refH))\" viewBox=\"\(f(-pad)) 0 \(f(refW + pad)) \(f(refH))\">"
    s += "<g id=\"arcana-wordmark\" fill=\"\(ink)\">"
    for (i, p) in parts.enumerated() { s += "<path id=\"\(p.0)-\(i + 1)\" d=\"\(p.1)\"/>" }
    s += "</g></svg>\n"
    try! s.write(toFile: args[2], atomically: true, encoding: .utf8)
    print("✓ wordmark → \(args[2])")

  case "stage":
    let scale = CGFloat(Double(args[3]) ?? 2)
    let phase = Double(args[4]) ?? -1
    let g = Game()  // shot pose 1-invocation: the room as it opens
    if phase >= 0 {
      // wait (blocking; the main thread never yields) for that moment of the 12 s cycle
      var spins = 0
      while true {
        let t = Date().timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 12)
        let gap = (phase - t + 12).truncatingRemainder(dividingBy: 12)
        if gap < 0.004 || gap > 11.996 { break }
        usleep(useconds_t(max(500, min(gap - 0.002, 0.2) * 1_000_000)))
        spins += 1
        if spins > 400 { break }
      }
    }
    let t0 = Date().timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 12)
    let img = render(
      RootView(game: g).frame(width: 1260, height: 860).environment(\.stillSky, true),
      scale: scale)
    writeImage(img, args[2])
    print(
      "✓ stage → \(args[2]) \(img.width)x\(img.height) at t mod 12 = \(String(format: "%.3f", t0)) (k = \(String(format: "%.3f", t0 / 3.2)))"
    )

  default:
    fail("unknown mode \(args[1])")
  }
}
exit(0)
