import SwiftUI

// ===================================================================
//  Palette — near-black, cream, one gold, one oxblood. Didot throughout.
// ===================================================================

enum Palette {
  static let void = Color(red: 0.039, green: 0.035, blue: 0.031)
  static let paper = Color(red: 0.953, green: 0.929, blue: 0.878)
  static let backStock = Color(red: 0.851, green: 0.816, blue: 0.741)
  static let ink = Color(red: 0.082, green: 0.067, blue: 0.055)
  static let gold = Color(red: 0.788, green: 0.659, blue: 0.184)
  static let goldLit = Color(red: 0.902, green: 0.780, blue: 0.376)
  static let blood = Color(red: 0.549, green: 0.180, blue: 0.145)

  static func of(_ c: InkColor) -> Color {
    switch c {
    case .ink: return ink
    case .accent: return blood
    case .gold: return gold
    case .paper: return paper
    }
  }
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
  var color: Color = Palette.paper.opacity(0.42)
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
