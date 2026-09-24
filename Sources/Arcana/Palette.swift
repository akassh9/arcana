import SwiftUI

// ===================================================================
//  Palette — first light, cream, ink, gold, oxblood. Didot throughout.
//
//  The sky at the moment before sunrise: pale blue overhead, lilac and
//  rose in the air, warm light rising from below. On it, type in ink and
//  gold, as on vellum; the cards on heavy cotton stock.
// ===================================================================

enum Palette {
  // the sky
  static let pearl = Color(red: 0.978, green: 0.968, blue: 0.948)
  static let skyBlue = Color(red: 0.800, green: 0.858, blue: 0.960)
  static let lilac = Color(red: 0.880, green: 0.845, blue: 0.970)
  static let rose = Color(red: 0.992, green: 0.868, blue: 0.862)
  static let dawn = Color(red: 1.000, green: 0.878, blue: 0.690)
  static let shade = Color(red: 0.300, green: 0.220, blue: 0.120)  // warm shadow

  // type on the sky
  static let text = Color(red: 0.150, green: 0.125, blue: 0.108)
  /// Gold dark enough to read as type and hairlines on a light ground.
  static let goldInk = Color(red: 0.560, green: 0.425, blue: 0.130)

  // the cards
  static let paper = Color(red: 0.953, green: 0.929, blue: 0.878)
  static let ink = Color(red: 0.082, green: 0.067, blue: 0.055)
  static let gold = Color(red: 0.788, green: 0.659, blue: 0.184)
  static let goldLit = Color(red: 0.925, green: 0.808, blue: 0.431)
  static let goldDeep = Color(red: 0.541, green: 0.408, blue: 0.098)
  static let blood = Color(red: 0.549, green: 0.180, blue: 0.145)
  static let candle = Color(red: 0.450, green: 0.300, blue: 0.125)
  /// The reverse's stock: the same heavy cotton as the face, a breath
  /// warmer, so a squared deck reads as one material.
  static let backStock = Color(red: 0.948, green: 0.921, blue: 0.866)

  /// The app icon's ground, from the night the mark was drawn in.
  static let void = Color(red: 0.012, green: 0.016, blue: 0.035)

  /// Gold leaf: light, shadow, light, shadow — the banding of beaten metal.
  static let leaf = Gradient(stops: [
    .init(color: Color(red: 0.965, green: 0.878, blue: 0.560), location: 0),
    .init(color: Color(red: 0.788, green: 0.639, blue: 0.200), location: 0.42),
    .init(color: Color(red: 0.905, green: 0.780, blue: 0.380), location: 0.66),
    .init(color: Color(red: 0.580, green: 0.440, blue: 0.120), location: 1),
  ])

  static func of(_ c: InkColor) -> Color {
    switch c {
    case .ink: return ink
    case .accent: return blood
    case .gold: return gold
    case .paper: return paper
    }
  }
}

/// How a set of marks is inked. Paper cards take black ink and leaf.
struct Tint {
  var ink = Palette.ink
  var accent = Palette.blood
  var gold = Palette.gold
  var paper = Palette.paper
  var gilded = true

  func of(_ c: InkColor) -> Color {
    switch c {
    case .ink: return ink
    case .accent: return accent
    case .gold: return gold
    case .paper: return paper
    }
  }

  static let card = Tint()

  /// Every mark in one colour — for the passes of a blind emboss.
  static func only(_ c: Color) -> Tint { Tint(ink: c, accent: c, gold: c, paper: c, gilded: false) }
}

extension Font {
  static func display(_ size: CGFloat) -> Font { .custom("Didot-Bold", size: size) }
  static func roman(_ size: CGFloat) -> Font { .custom("Didot", size: size) }
  static func italic(_ size: CGFloat) -> Font { .custom("Didot-Italic", size: size) }
}

/// Small tracked capitals — every label in the app is one of these.
struct Caps: View {
  let text: String
  var size: CGFloat = 10
  var tracking: CGFloat = 3.4
  var color: Color = Palette.text.opacity(0.5)
  var bold: Bool = false
  var body: some View {
    Text(text.uppercased())
      .font(bold ? .display(size) : .roman(size))
      .tracking(tracking)
      .foregroundStyle(color)
  }
}

/// A tiled grain, generated once, multiplied over the card stock.
enum Grain {
  static let image: Image? = {
    let n = 96
    guard
      let ctx = CGContext(
        data: nil, width: n, height: n, bitsPerComponent: 8, bytesPerRow: n * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
      let data = ctx.data
    else { return nil }
    let buf = data.bindMemory(to: UInt8.self, capacity: n * n * 4)
    var rng = Rng(9_121)
    for i in 0..<(n * n) {
      let v = UInt8(200 + Int(rng.next() * 55))
      buf[i * 4] = v
      buf[i * 4 + 1] = v
      buf[i * 4 + 2] = v
      buf[i * 4 + 3] = 255
    }
    guard let cg = ctx.makeImage() else { return nil }
    return Image(nsImage: NSImage(cgImage: cg, size: NSSize(width: n, height: n)))
  }()
}

@inline(__always) func clamp01(_ x: Double) -> Double { min(1, max(0, x)) }

/// 0 before `a`, 1 after `b`, a smooth S between.
@inline(__always) func ramp(_ x: Double, _ a: Double, _ b: Double) -> Double {
  let t = clamp01((x - a) / max(b - a, 0.0001))
  return t * t * (3 - 2 * t)
}
