import AppKit
// px <file> x y [x y ...]: the 3x3-average sRGB colour at each pixel (top-left origin)
let a = CommandLine.arguments
let r = NSBitmapImageRep(data: try! Data(contentsOf: URL(fileURLWithPath: a[1])))!.cgImage!
let w = r.width, h = r.height
let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.draw(r, in: CGRect(x: 0, y: 0, width: w, height: h))
let d = ctx.data!.bindMemory(to: UInt8.self, capacity: w * h * 4)
var i = 2
while i + 1 < a.count {
  let x = Int(a[i])!, y = Int(a[i + 1])!
  var s = [0, 0, 0, 0], n = 0
  for dy in -1...1 { for dx in -1...1 { let o = ((y + dy) * w + x + dx) * 4; for c in 0..<4 { s[c] += Int(d[o + c]) }; n += 1 } }
  print(String(format: "(%d,%d) #%02X%02X%02X a%d", x, y, s[0] / n, s[1] / n, s[2] / n, s[3] / n))
  i += 2
}
