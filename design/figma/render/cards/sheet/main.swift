import AppKit
import UniformTypeIdentifiers
// sheet out.png cols cellWidth file...  — a contact sheet on pearl, each cell scaled to cellWidth
let a = CommandLine.arguments
let cols = Int(a[2])!, cw = Int(a[3])!
let files = Array(a[4...])
func load(_ p: String) -> CGImage {
  let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil)!
  return CGImageSourceCreateImageAtIndex(src, 0, nil)!
}
let imgs = files.map(load)
let ch = Int(Double(cw) * Double(imgs[0].height) / Double(imgs[0].width))
let gap = 8, rows = (imgs.count + cols - 1) / cols
let W = cols * (cw + gap) + gap, H = rows * (ch + gap) + gap
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4, space: cs, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
ctx.setFillColor(CGColor(srgbRed: 0.978, green: 0.968, blue: 0.948, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.interpolationQuality = .high
for (i, img) in imgs.enumerated() {
  let c = i % cols, r = i / cols
  ctx.draw(img, in: CGRect(x: gap + c * (cw + gap), y: H - (r + 1) * (ch + gap), width: cw, height: ch))
}
let dst = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dst, ctx.makeImage()!, nil); CGImageDestinationFinalize(dst)
print("sheet \(W)x\(H)")
