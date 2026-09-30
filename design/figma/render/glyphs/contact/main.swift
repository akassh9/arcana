import AppKit
// contact <out.png> <zoom> <cols> <img>...   lays images in a grid on pearl, scaled by zoom (nearest)
let a = CommandLine.arguments
let out = a[1], zoom = Double(a[2])!, cols = Int(a[3])!
let ims: [CGImage] = a.dropFirst(4).map { p in
  let s = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil)!
  return CGImageSourceCreateImageAtIndex(s, 0, nil)!
}
let gap = 12.0
let cw = ims.map { Double($0.width) * zoom }.max()!, ch = ims.map { Double($0.height) * zoom }.max()!
let rows = (ims.count + cols - 1) / cols
let W = Int(Double(cols) * (cw + gap) + gap), H = Int(Double(rows) * (ch + gap) + gap)
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0,
  space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.setFillColor(CGColor(srgbRed: 0.978, green: 0.968, blue: 0.948, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.interpolationQuality = zoom >= 1 ? .none : .high
for (i, im) in ims.enumerated() {
  let c = i % cols, r = i / cols
  let w = Double(im.width) * zoom, h = Double(im.height) * zoom
  let x = gap + Double(c) * (cw + gap), y = Double(H) - (gap + Double(r) * (ch + gap)) - h
  ctx.draw(im, in: CGRect(x: x, y: y, width: w, height: h))
}
let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
print("\(W)x\(H)")
