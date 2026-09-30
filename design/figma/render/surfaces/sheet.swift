import AppKit
// sheet <out.png> <cell width px> <columns> <in.png>… : a contact sheet for looking, not an asset
let a = CommandLine.arguments
let cellW = CGFloat(Double(a[2])!), cols = Int(a[3])!
let imgs = a.dropFirst(4).compactMap { p -> CGImage? in
  guard let d = try? Data(contentsOf: URL(fileURLWithPath: p)), let r = NSBitmapImageRep(data: d) else { return nil }
  return r.cgImage }
let rowsN = (imgs.count + cols - 1) / cols
var rowH = [CGFloat](repeating: 0, count: rowsN)
for (i, im) in imgs.enumerated() { rowH[i / cols] = max(rowH[i / cols], cellW * CGFloat(im.height) / CGFloat(im.width)) }
let pad: CGFloat = 8
let W = Int(CGFloat(cols) * (cellW + pad) + pad), H = Int(rowH.reduce(0, +) + CGFloat(rowsN + 1) * pad)
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.setFillColor(CGColor(red: 0.5, green: 0.5, blue: 0.55, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: W, height: H))
ctx.interpolationQuality = .high
var y = CGFloat(H) - pad
for r in 0..<rowsN {
  y -= rowH[r]
  for c in 0..<cols { let i = r * cols + c; guard i < imgs.count else { break }
    let im = imgs[i]; let h = cellW * CGFloat(im.height) / CGFloat(im.width)
    ctx.draw(im, in: CGRect(x: pad + CGFloat(c) * (cellW + pad), y: y + rowH[r] - h, width: cellW, height: h)) }
  y -= pad
}
let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[1]))
print("sheet \(W)×\(H)")
