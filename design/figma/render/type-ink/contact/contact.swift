import AppKit
// contact <out.png> <maxWidth> <cols> <files...>: a grid of the images, scaled to fit, on grey.
let a = CommandLine.arguments
let out = a[1], maxW = CGFloat(Double(a[2])!), cols = Int(a[3])!
let imgs = a.dropFirst(4).compactMap { p -> CGImage? in
  guard let d = try? Data(contentsOf: URL(fileURLWithPath: p)), let r = NSBitmapImageRep(data: d) else { return nil }
  return r.cgImage }
let gap: CGFloat = 10
let rows = (imgs.count + cols - 1) / cols
var colW = [CGFloat](repeating: 0, count: cols), rowH = [CGFloat](repeating: 0, count: rows)
for (i, im) in imgs.enumerated() { colW[i % cols] = max(colW[i % cols], CGFloat(im.width)); rowH[i / cols] = max(rowH[i / cols], CGFloat(im.height)) }
let W = colW.reduce(0, +) + gap * CGFloat(cols + 1), H = rowH.reduce(0, +) + gap * CGFloat(rows + 1)
let s = min(1, maxW / W)
let ctx = CGContext(data: nil, width: Int(W * s), height: Int(H * s), bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.setFillColor(CGColor(gray: 0.55, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: W * s, height: H * s))
ctx.interpolationQuality = .high
var y = gap
for r in 0..<rows {
  var x = gap
  for c in 0..<cols { let i = r * cols + c; if i < imgs.count { let im = imgs[i]
    ctx.draw(im, in: CGRect(x: x * s, y: (H - y - CGFloat(im.height)) * s, width: CGFloat(im.width) * s, height: CGFloat(im.height) * s)) }
    x += colW[c] + gap }
  y += rowH[r] + gap
}
let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
print("contact \(Int(W*s))x\(Int(H*s))")
