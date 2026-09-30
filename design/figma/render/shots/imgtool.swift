import AppKit
import CoreGraphics

// Small image helpers for checking the renders (never part of the app).
//   imgtool sheet <out.png> <cols> <cellW> <files...>   contact sheet, labelled
//   imgtool info <files...>                             pixel size, colour space, bits
//   imgtool shift <a.png> <b.png> x y w h [maxdy]       find the vertical shift (px)
//        that best maps the box (x,y,w,h, top-left px) of a onto b; prints the error per dy

func load(_ p: String) -> CGImage {
  guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil),
    let img = CGImageSourceCreateImageAtIndex(src, 0, nil)
  else { fatalError("cannot read \(p)") }
  return img
}

/// RGBA8 sRGB pixels, top row first.
func pixels(_ img: CGImage) -> [UInt8] {
  let w = img.width, h = img.height
  var buf = [UInt8](repeating: 0, count: w * h * 4)
  let ctx = CGContext(
    data: &buf, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  return buf
}

let args = Array(CommandLine.arguments.dropFirst())
switch args.first {
case "sheet":
  let out = args[1]
  let cols = Int(args[2])!
  let cellW = CGFloat(Double(args[3])!)
  let files = Array(args.dropFirst(4))
  let imgs = files.map(load)
  let cellH = imgs.map { cellW * CGFloat($0.height) / CGFloat($0.width) }.max()! + 22
  let rows = (imgs.count + cols - 1) / cols
  let W = Int(CGFloat(cols) * (cellW + 8) + 8), H = Int(CGFloat(rows) * (cellH + 8) + 8)
  let ctx = CGContext(
    data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.setFillColor(CGColor(gray: 0.35, alpha: 1))
  ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
  ctx.interpolationQuality = .high
  NSGraphicsContext.current = NSGraphicsContext(cgContext: ctx, flipped: false)
  for (i, img) in imgs.enumerated() {
    let c = i % cols, r = i / cols
    let x = 8 + CGFloat(c) * (cellW + 8)
    let top = CGFloat(H) - 8 - CGFloat(r) * (cellH + 8)
    let h = cellW * CGFloat(img.height) / CGFloat(img.width)
    ctx.draw(img, in: CGRect(x: x, y: top - 22 - h, width: cellW, height: h))
    let name = (files[i] as NSString).lastPathComponent
    (name as NSString).draw(
      at: CGPoint(x: x + 2, y: top - 17),
      withAttributes: [.font: NSFont.systemFont(ofSize: 13, weight: .medium), .foregroundColor: NSColor.white])
  }
  let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
  try! rep.representation(using: .jpeg, properties: [.compressionFactor: 0.82])!.write(
    to: URL(fileURLWithPath: out))
  print("sheet \(W)x\(H) -> \(out)")
case "srgb":
  // imgtool srgb <in> <out> [x y w h]: an 8-bit sRGB PNG (colour-converted), optionally cropped (top-left px)
  let a = load(args[1])
  let r = args.count > 6
    ? CGRect(x: Int(args[3])!, y: Int(args[4])!, width: Int(args[5])!, height: Int(args[6])!)
    : CGRect(x: 0, y: 0, width: a.width, height: a.height)
  let src = a.cropping(to: r)!
  let ctx = CGContext(
    data: nil, width: src.width, height: src.height, bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.draw(src, in: CGRect(x: 0, y: 0, width: src.width, height: src.height))
  let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[2]))
  print("srgb \(src.width)x\(src.height) -> \(args[2])")
case "info":
  for f in args.dropFirst() {
    let i = load(f)
    print((f as NSString).lastPathComponent, i.width, i.height, i.bitsPerComponent, i.colorSpace?.name as String? ?? "-", i.alphaInfo.rawValue)
  }
case "shift":
  let a = load(args[1]), b = load(args[2])
  let pa = pixels(a), pb = pixels(b)
  let bx = Int(args[3])!, by = Int(args[4])!, bw = Int(args[5])!, bh = Int(args[6])!
  let maxdy = args.count > 7 ? Int(args[7])! : 100
  var best = (dy: 0, err: Double.infinity)
  var line: [String] = []
  for dy in -maxdy...maxdy {
    var sum = 0.0, n = 0
    for y in stride(from: by, to: by + bh, by: 2) {
      let yb = y + dy
      guard yb >= 0, yb < b.height, y < a.height else { continue }
      for x in stride(from: bx, to: bx + bw, by: 2) {
        guard x < a.width, x < b.width else { continue }
        let ia = (y * a.width + x) * 4, ib = (yb * b.width + x) * 4
        for k in 0..<3 { sum += abs(Double(pa[ia + k]) - Double(pb[ib + k])) }
        n += 3
      }
    }
    guard n > 0 else { continue }
    let e = sum / Double(n)
    if e < best.err { best = (dy, e) }
    if dy % 8 == 0 { line.append("\(dy):\(String(format: "%.1f", e))") }
  }
  print("best dy \(best.dy) px, mean abs error \(String(format: "%.3f", best.err)) /255")
  print("  " + line.joined(separator: " "))
case "bright":
  // centroid of the pixels brighter than thr (0-255 luminance) in a box
  let a = load(args[1]); let pa = pixels(a)
  let bx = Int(args[2])!, by = Int(args[3])!, bw = Int(args[4])!, bh = Int(args[5])!
  let thr = Double(args[6])!
  var sx = 0.0, sy = 0.0, n = 0.0
  for y in by..<(by + bh) { for x in bx..<(bx + bw) {
    let i = (y * a.width + x) * 4
    let l = 0.2126 * Double(pa[i]) + 0.7152 * Double(pa[i + 1]) + 0.0722 * Double(pa[i + 2])
    if l > thr { sx += Double(x) + 0.5; sy += Double(y) + 0.5; n += 1 }
  } }
  print(String(format: "bright centroid px (%.1f, %.1f) from %.0f px", sx / n, sy / n, n))
case "gold":
  // the row, down a column, where the pixel leans most toward gold ((R+G)/2 - B)
  let a = load(args[1]); let pa = pixels(a)
  let x = Int(args[2])!, y0 = Int(args[3])!, y1 = Int(args[4])!
  var best = (y: 0, v: -999.0)
  for y in y0..<y1 {
    let i = (y * a.width + x) * 4
    let v = (Double(pa[i]) + Double(pa[i + 1])) / 2 - Double(pa[i + 2])
    if v > best.v { best = (y, v) }
  }
  print("gold-most row px \(best.y) (value \(best.v))")
default:
  print("imgtool sheet|info|shift|bright|gold …")
}
