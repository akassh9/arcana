import AppKit
import SwiftUI

// Offscreen rendering helpers for the type-ink renders. Nothing here puts a
// window on screen, captures the screen, or plays a sound.

nonisolated(unsafe) var outRoot = "."
let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!

/// Every render as an 8-bit sRGB bitmap (alpha kept), whatever SwiftUI drew it with.
@MainActor func bitmap<V: View>(_ view: V, scale: CGFloat) -> CGImage? {
  let r = ImageRenderer(content: view)
  r.scale = scale
  guard let deep = r.cgImage else { return nil }
  guard
    let ctx = CGContext(
      data: nil, width: deep.width, height: deep.height, bitsPerComponent: 8, bytesPerRow: 0,
      space: sRGB, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
  else { return nil }
  ctx.draw(deep, in: CGRect(x: 0, y: 0, width: deep.width, height: deep.height))
  return ctx.makeImage()
}

/// The size, in points, SwiftUI gives this view at its ideal size.
@MainActor func idealSize<V: View>(_ view: V) -> CGSize {
  let r = ImageRenderer(content: view)
  r.scale = 1
  return r.nsImage?.size ?? .zero
}

/// An image with no transparency is written without an alpha channel (a quarter smaller).
func opaqueIfSo(_ img: CGImage) -> CGImage {
  let w = img.width, h = img.height
  guard
    let ctx = CGContext(
      data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: sRGB,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
  else { return img }
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  let p = ctx.data!.bindMemory(to: UInt8.self, capacity: w * h * 4)
  for i in stride(from: 3, to: w * h * 4, by: 4) where p[i] != 255 { return img }
  guard
    let rgb = CGContext(
      data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: sRGB,
      bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
  else { return img }
  rgb.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  return rgb.makeImage() ?? img
}

func writePNG(_ img: CGImage, _ rel: String) {
  let url = URL(fileURLWithPath: "\(outRoot)/\(rel)")
  try? FileManager.default.createDirectory(
    at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  guard img.width <= 4096, img.height <= 4096 else {
    print("× \(rel): \(img.width)x\(img.height) is over 4096")
    return
  }
  let rep = NSBitmapImageRep(cgImage: opaqueIfSo(img))
  guard let png = rep.representation(using: .png, properties: [:]) else {
    print("× \(rel)")
    return
  }
  try? png.write(to: url)
  print("✓ \(rel) \(img.width)x\(img.height)")
}

@MainActor @discardableResult
func save<V: View>(_ rel: String, _ view: V, scale: CGFloat) -> CGImage? {
  guard let img = bitmap(view, scale: scale) else {
    print("× \(rel)")
    return nil
  }
  writePNG(img, rel)
  return img
}

/// A rectangle given in points, cut from a render made at `scale`.
func crop(_ img: CGImage, _ r: CGRect, scale: CGFloat) -> CGImage? {
  let px = CGRect(
    x: (r.minX * scale).rounded(), y: (r.minY * scale).rounded(),
    width: (r.width * scale).rounded(), height: (r.height * scale).rounded())
  return img.cropping(to: px)
}

/// The bounds, in points, of whatever differs from the ground colour `bg`
/// (8-bit RGB) by more than `tol` in any channel.
func inkBounds(_ img: CGImage, scale: CGFloat, bg: (Int, Int, Int), tol: Int = 3) -> CGRect? {
  let w = img.width, h = img.height
  guard
    let ctx = CGContext(
      data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: sRGB,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
  else { return nil }
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  guard let data = ctx.data else { return nil }
  let p = data.bindMemory(to: UInt8.self, capacity: w * h * 4)
  var minX = w, minY = h, maxX = -1, maxY = -1
  for y in 0..<h {
    for x in 0..<w {
      let o = (y * w + x) * 4
      if abs(Int(p[o]) - bg.0) > tol || abs(Int(p[o + 1]) - bg.1) > tol
        || abs(Int(p[o + 2]) - bg.2) > tol
      {
        if x < minX { minX = x }
        if x > maxX { maxX = x }
        if y < minY { minY = y }
        if y > maxY { maxY = y }
      }
    }
  }
  guard maxX >= 0 else { return nil }
  // CGContext rows run bottom-up; the bitmap's first row in memory is the top
  return CGRect(
    x: CGFloat(minX) / scale, y: CGFloat(minY) / scale,
    width: CGFloat(maxX - minX + 1) / scale, height: CGFloat(maxY - minY + 1) / scale)
}

/// sRGB hex of a SwiftUI colour, rounded as an 8-bit render draws it (halves up).
func hex(_ c: Color) -> String {
  let n = NSColor(c).usingColorSpace(.sRGB) ?? .black
  func b(_ v: CGFloat) -> Int { Int((v * 255 + 0.5).rounded(.down)) }
  return String(format: "#%02X%02X%02X", b(n.redComponent), b(n.greenComponent), b(n.blueComponent))
}

func alphaOf(_ c: Color) -> Double {
  Double((NSColor(c).usingColorSpace(.sRGB) ?? .black).alphaComponent)
}

func writeJSON(_ obj: Any, _ rel: String) {
  let url = URL(fileURLWithPath: "\(outRoot)/\(rel)")
  try? FileManager.default.createDirectory(
    at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  if let d = try? JSONSerialization.data(
    withJSONObject: obj, options: [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes])
  {
    try? d.write(to: url)
    print("✓ \(rel)")
  }
}

func r2(_ v: CGFloat) -> Double { (Double(v) * 100).rounded() / 100 }
func r3(_ v: Double) -> Double { (v * 1000).rounded() / 1000 }

/// SwiftUI's named curves as cubic Béziers, and the inverse of each (time for a value).
func bezier(_ x1: Double, _ y1: Double, _ x2: Double, _ y2: Double, _ t: Double) -> Double {
  // solve x(s) = t, return y(s)
  func bx(_ s: Double) -> Double { 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s }
  func by(_ s: Double) -> Double { 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s }
  var lo = 0.0, hi = 1.0
  for _ in 0..<60 {
    let m = (lo + hi) / 2
    if bx(m) < t { lo = m } else { hi = m }
  }
  return by((lo + hi) / 2)
}
func easeInOut(_ t: Double) -> Double { bezier(0.42, 0, 0.58, 1, t) }
func easeOut(_ t: Double) -> Double { bezier(0, 0, 0.58, 1, t) }
/// The time fraction at which `curve` reaches `v`.
func inverse(_ curve: (Double) -> Double, _ v: Double) -> Double {
  var lo = 0.0, hi = 1.0
  for _ in 0..<60 {
    let m = (lo + hi) / 2
    if curve(m) < v { lo = m } else { hi = m }
  }
  return (lo + hi) / 2
}

// --- the stage, posed as the shot tool poses it ----------------------------

/// The default window's stage: 1260x860 with the 32 pt title bar over it.
let stageSize = CGSize(width: 1260, height: 828)
let longAgo = Date().timeIntervalSinceReferenceDate - 60
let asked = "Should I leave the city before winter"
let woven = WeaveResult(
  thread:
    "What was rooted is being lifted into the light. The hand that steadies it is already yours.",
  question: "What would you tend if no one were watching the roots?")

@MainActor func freshGame() -> Game {
  Keeping.file = nil
  return Game()
}

@MainActor func read(_ g: Game, spread: Int, picks: [Int]) {
  g.spreadIndex = spread
  g.phase = .reading
  g.dealt = true
  g.picks = picks
  g.faceUp = Set(picks)
  g.inked = Set(picks)
  g.recited = picks.count
  for s in 0..<picks.count { g.landed[s] = longAgo }
}

/// Lays these cards, in order and orientation, as a spoken spread.
@MainActor func lay(_ g: Game, spread: Int, _ cards: [(String, Bool)]) {
  var order = g.order
  for (k, c) in cards.enumerated() {
    guard let j = order.firstIndex(where: { $0.card.id == c.0 }) else { continue }
    order.swapAt(k, j)
    order[k] = Draw(card: order[k].card, reversed: c.1)
  }
  g.order = order
  read(g, spread: spread, picks: Array(0..<cards.count))
  g.sounded = true
}

@MainActor func stageView(_ g: Game, size: CGSize = stageSize) -> some View {
  RootView(game: g).frame(width: size.width, height: size.height).environment(\.stillSky, true)
}
