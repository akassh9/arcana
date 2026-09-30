import AppKit
import UniformTypeIdentifiers

// compare a.png b.png out.png [bg #RRGGBB]
// Composites both over bg, writes a | b | diff×4 strip, prints diff stats.
let a = CommandLine.arguments
let bgHex = a.count > 4 ? a[4] : "#F3EDE0"
func load(_ p: String) -> CGImage {
  let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil)!
  return CGImageSourceCreateImageAtIndex(src, 0, nil)!
}
let A = load(a[1]), B = load(a[2])
let w = max(A.width, B.width), h = max(A.height, B.height)
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
func flat(_ img: CGImage) -> [UInt8] {
  var buf = [UInt8](repeating: 0, count: w * h * 4)
  let ctx = CGContext(data: &buf, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  let v = Int(bgHex.dropFirst(), radix: 16)!
  ctx.setFillColor(CGColor(srgbRed: CGFloat((v >> 16) & 255) / 255, green: CGFloat((v >> 8) & 255) / 255, blue: CGFloat(v & 255) / 255, alpha: 1))
  ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  ctx.interpolationQuality = .high
  ctx.draw(img, in: CGRect(x: 0, y: h - img.height, width: img.width, height: img.height))
  return buf
}
let pa = flat(A), pb = flat(B)
var out = [UInt8](repeating: 255, count: w * 3 * h * 4)
var sum = 0.0, big = 0, maxd = 0
for y in 0..<h {
  for x in 0..<w {
    let i = (y * w + x) * 4
    var d = 0
    for k in 0..<3 {
      let dd = abs(Int(pa[i + k]) - Int(pb[i + k])); d = max(d, dd)
      out[(y * w * 3 + x) * 4 + k] = pa[i + k]
      out[(y * w * 3 + w + x) * 4 + k] = pb[i + k]
    }
    sum += Double(d); if d > 24 { big += 1 }; maxd = max(maxd, d)
    let v = UInt8(max(0, 255 - min(255, d * 4)))
    for k in 0..<3 { out[(y * w * 3 + 2 * w + x) * 4 + k] = v }
  }
}
var outImg: CGImage
let ctx0 = CGContext(data: &out, width: w * 3, height: h, bitsPerComponent: 8, bytesPerRow: w * 12, space: cs,
  bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
outImg = ctx0.makeImage()!
// CROP="x,y,w,h" in px of one image: the strip shows only that region of each panel
if let c = ProcessInfo.processInfo.environment["CROP"] {
  let v = c.split(separator: ",").map { Int($0)! }
  let cc = CGContext(data: nil, width: v[2] * 3, height: v[3], bitsPerComponent: 8, bytesPerRow: v[2] * 12, space: cs, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  for k in 0..<3 { cc.draw(outImg.cropping(to: CGRect(x: k * w + v[0], y: v[1], width: v[2], height: v[3]))!, in: CGRect(x: k * v[2], y: 0, width: v[2], height: v[3])) }
  outImg = cc.makeImage()!
}
let dst = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[3]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dst, outImg, nil); CGImageDestinationFinalize(dst)
print(String(format: "%@ vs %@: %dx%d / %dx%d  mean %.2f  >24: %.3f%%  max %d", (a[1] as NSString).lastPathComponent, (a[2] as NSString).lastPathComponent, A.width, A.height, B.width, B.height, sum / Double(w * h), 100 * Double(big) / Double(w * h), maxd))
// BANDS="y0-y1,..." (pt, scale S) prints each image's ink bbox (≠ bg) inside each band
if let bands = ProcessInfo.processInfo.environment["BANDS"] {
  let S = Double(ProcessInfo.processInfo.environment["S"] ?? "3")!
  for band in bands.split(separator: ",") {
    let yy = band.split(separator: "-").map { Double($0)! }
    for (label, px) in [("A", pa), ("B", pb)] {
      var x0 = w, x1 = -1, y0 = h, y1 = -1
      for y in Int(yy[0] * S)..<min(Int(yy[1] * S), h) {
        for x in 0..<w {
          let i = (y * w + x) * 4
          let bgv = Int(bgHex.dropFirst(), radix: 16)!
          let d = abs(Int(px[i]) - ((bgv >> 16) & 255)) + abs(Int(px[i + 1]) - ((bgv >> 8) & 255)) + abs(Int(px[i + 2]) - (bgv & 255))
          if d > 60 { x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y) }
        }
      }
      print(String(format: "  band %@ %@: x %.2f–%.2f  y %.2f–%.2f  (cx %.2f)", String(band), label, Double(x0) / S, Double(x1 + 1) / S, Double(y0) / S, Double(y1 + 1) / S, Double(x0 + x1 + 1) / 2 / S))
    }
  }
}
// MEAN="x,y,w,h;..." (pt) prints each image's mean RGB in each rect
if let rs = ProcessInfo.processInfo.environment["MEAN"] {
  let S = Double(ProcessInfo.processInfo.environment["S"] ?? "3")!
  for r in rs.split(separator: ";") {
    let v = r.split(separator: ",").map { Double($0)! }
    for (label, px) in [("A", pa), ("B", pb)] {
      var s = [0.0, 0.0, 0.0], n = 0.0, sq = 0.0
      for y in Int(v[1] * S)..<Int((v[1] + v[3]) * S) {
        for x in Int(v[0] * S)..<Int((v[0] + v[2]) * S) {
          let i = (y * w + x) * 4
          for k in 0..<3 { s[k] += Double(px[i + k]) }
          sq += Double(px[i]) * Double(px[i]); n += 1
        }
      }
      let m = s.map { $0 / n }
      print(String(format: "  mean %@ %@: %.1f %.1f %.1f  (sd R %.2f)", String(r), label, m[0], m[1], m[2], sqrt(max(0, sq / n - m[0] * m[0]))))
    }
  }
}
