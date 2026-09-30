import AppKit
// diff <a.png> <b.png> ... pairs: mean/max channel difference over pearl
func px(_ p: String) -> (Int, Int, [UInt8]) {
  let s = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil)!, im = CGImageSourceCreateImageAtIndex(s, 0, nil)!
  let w = im.width, h = im.height
  var b = [UInt8](repeating: 0, count: w * h * 4)
  b.withUnsafeMutableBytes { m in
    let c = CGContext(data: m.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
      space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    c.setFillColor(CGColor(srgbRed: 0.978, green: 0.968, blue: 0.948, alpha: 1)); c.fill(CGRect(x: 0, y: 0, width: w, height: h))
    c.draw(im, in: CGRect(x: 0, y: 0, width: w, height: h))
  }
  return (w, h, b)
}
let a = Array(CommandLine.arguments.dropFirst())
for i in stride(from: 0, to: a.count, by: 2) {
  let x = px(a[i]), y = px(a[i + 1])
  let name = URL(fileURLWithPath: a[i + 1]).lastPathComponent
  guard x.0 == y.0, x.1 == y.1 else { print("\(name): size \(x.0)x\(x.1) vs \(y.0)x\(y.1)"); continue }
  var sum = 0, mx = 0, off = 0
  for k in 0..<(x.0 * x.1) {
    var m = 0
    for c in 0..<3 { let d = abs(Int(x.2[k * 4 + c]) - Int(y.2[k * 4 + c])); sum += d; m = max(m, d) }
    mx = max(mx, m); if m > 24 { off += 1 }
  }
  print(String(format: "%@: mean %.3f max %d >24: %.3f%%", name, Double(sum) / Double(x.0 * x.1 * 3), mx, 100 * Double(off) / Double(x.0 * x.1)))
}
