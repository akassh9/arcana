import AppKit

// Small image utility for checking the sky renders (no PIL on this Mac).
//   px diff A B                 mean/max channel difference (premultiplied RGBA 8-bit)
//   px stat A                   size, alpha range, a few pixels
//   px at A x y [x y …]         RGBA at pixels (straight alpha)
//   px sheet OUT cols W BG A…   tile images into cells W px wide over BG (#RRGGBB)
//   px over OUT BG A…           stack images (same size) over BG, save
//   px scale OUT maxSide A      downscale
let args = CommandLine.arguments

func load(_ p: String) -> CGImage {
  guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil),
    let img = CGImageSourceCreateImageAtIndex(src, 0, nil)
  else { fatalError("cannot read \(p)") }
  return img
}
func bitmap(_ img: CGImage, _ w: Int? = nil, _ h: Int? = nil) -> (CGContext, [UInt8]) {
  let W = w ?? img.width, H = h ?? img.height
  let ctx = CGContext(
    data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.interpolationQuality = .high
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: W, height: H))
  let p = ctx.data!.bindMemory(to: UInt8.self, capacity: W * H * 4)
  return (ctx, Array(UnsafeBufferPointer(start: p, count: W * H * 4)))
}
func save(_ ctx: CGContext, _ p: String) {
  let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: p))
}
func hex(_ s: String) -> (CGFloat, CGFloat, CGFloat) {
  let v = Int(s.dropFirst(), radix: 16)!
  return (CGFloat((v >> 16) & 255) / 255, CGFloat((v >> 8) & 255) / 255, CGFloat(v & 255) / 255)
}
func canvas(_ w: Int, _ h: Int, _ bg: String) -> CGContext {
  let ctx = CGContext(
    data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.interpolationQuality = .high
  if bg != "none" {
    let c = hex(bg)
    ctx.setFillColor(CGColor(srgbRed: c.0, green: c.1, blue: c.2, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  }
  return ctx
}

switch args[1] {
case "diff":
  let a = load(args[2]), b = load(args[3])
  let (_, x) = bitmap(a), (_, y) = bitmap(b, a.width, a.height)
  var sum = 0.0, mx = 0
  for i in 0..<x.count {
    let d = abs(Int(x[i]) - Int(y[i]))
    sum += Double(d)
    mx = max(mx, d)
  }
  print(String(format: "mean %.4f  max %d  (%dx%d vs %dx%d)", sum / Double(x.count), mx, a.width, a.height, b.width, b.height))
case "stat":
  let a = load(args[2])
  let (_, x) = bitmap(a)
  var amin = 255, amax = 0
  for i in stride(from: 3, to: x.count, by: 4) { amin = min(amin, Int(x[i])); amax = max(amax, Int(x[i])) }
  print("\(a.width)x\(a.height) bpc \(a.bitsPerComponent) alpha \(amin)…\(amax) space \(a.colorSpace?.name as String? ?? "?")")
case "at":
  let a = load(args[2])
  let (_, x) = bitmap(a)
  var i = 3
  while i + 1 < args.count {
    let px = Int(args[i])!, py = Int(args[i + 1])!
    let o = (py * a.width + px) * 4
    let al = Double(x[o + 3])
    func un(_ v: UInt8) -> Int { al == 0 ? 0 : Int((Double(v) * 255 / al).rounded()) }
    print(String(format: "(%d,%d) #%02X%02X%02X a %d", px, py, un(x[o]), un(x[o + 1]), un(x[o + 2]), Int(al)))
    i += 2
  }
case "sheet":
  let out = args[2], cols = Int(args[3])!, cw = Int(args[4])!, bg = args[5]
  let imgs = args[6...].map(load)
  let ch = imgs.map { Int(Double($0.height) * Double(cw) / Double($0.width)) }.max()!
  let rows = (imgs.count + cols - 1) / cols
  let pad = 6
  let ctx = canvas(cols * (cw + pad) + pad, rows * (ch + pad) + pad, bg)
  for (k, img) in imgs.enumerated() {
    let h = Int(Double(img.height) * Double(cw) / Double(img.width))
    let x = pad + (k % cols) * (cw + pad)
    let y = pad + (rows - 1 - k / cols) * (ch + pad) + (ch - h)
    ctx.draw(img, in: CGRect(x: x, y: y, width: cw, height: h))
  }
  save(ctx, out)
case "over":
  let out = args[2], bg = args[3]
  let specs = args[4...].map { a -> (CGImage, CGFloat) in
    let parts = a.split(separator: "@").map(String.init)
    if parts.count > 1, let o = Double(parts.last!) { return (load(parts.dropLast().joined(separator: "@")), CGFloat(o)) }
    return (load(a), 1)
  }
  let ctx = canvas(specs[0].0.width, specs[0].0.height, bg)
  for (img, o) in specs {
    ctx.setAlpha(o)
    ctx.draw(img, in: CGRect(x: 0, y: 0, width: specs[0].0.width, height: specs[0].0.height))
  }
  save(ctx, out)
case "scale":
  let out = args[2], m = Double(args[3])!
  let a = load(args[4])
  let k = min(1, m / Double(max(a.width, a.height)))
  let w = Int(Double(a.width) * k), h = Int(Double(a.height) * k)
  let ctx = canvas(w, h, "none")
  ctx.draw(a, in: CGRect(x: 0, y: 0, width: w, height: h))
  save(ctx, out)
default: print("?")
}
