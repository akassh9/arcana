// img — small offline image tool for the brand assets (no display, no network).
// Everything is written as 8-bit sRGB (tagged). Untagged inputs are read as sRGB
// (their bytes are reinterpreted, never converted), which is what Figma and a
// browser do with them.
//
//   img ground  IN OUT HEX [PAD]                 composite on a solid ground (PAD px round it)
//   img tag     IN OUT                            re-save as tagged 8-bit sRGB PNG
//   img crop    IN OUT X Y W H [ZOOM] [nearest|high] [BGHEX]   crop (top-left origin), zoom
//   img resize  IN OUT W H                        high-quality resample (alpha kept)
//   img reveal  IN OUT                            fringe diagnostic: semi-transparent px shown opaque
//   img jpg     IN OUT QUALITY [MAXDIM]           JPEG, sRGB
//   img sheet   OUT COLS CELLW CELLH GAP BGHEX LABEL=PATH ...   contact sheet with captions
//   img fringe  IN                                prints fringe statistics
//   img icons   IN512 OUT HEXLIGHT HEXDARK        the 512 rep at 16..1024 on light and dark grounds

import AppKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let srgb = CGColorSpace(name: CGColorSpace.sRGB)!

func fail(_ s: String) -> Never {
  FileHandle.standardError.write((s + "\n").data(using: .utf8)!)
  exit(1)
}

func hex(_ s: String) -> CGColor {
  var h = s.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
  if h.count == 6 { h += "FF" }
  let v = UInt64(h, radix: 16) ?? 0
  let r = Double((v >> 24) & 0xFF) / 255, g = Double((v >> 16) & 0xFF) / 255
  let b = Double((v >> 8) & 0xFF) / 255, a = Double(v & 0xFF) / 255
  return CGColor(colorSpace: srgb, components: [r, g, b, a])!
}

/// Loads an image as sRGB. Untagged (or device) RGB bytes are reinterpreted as sRGB.
func load(_ path: String) -> CGImage {
  guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
    let img = CGImageSourceCreateImageAtIndex(src, 0, nil)
  else { fail("cannot read \(path)") }
  let props = CGImageSourceCopyPropertiesAtIndex(src, 0, nil) as? [CFString: Any] ?? [:]
  let tagged = props[kCGImagePropertyProfileName] != nil
  if tagged { return img }
  guard let prov = img.dataProvider,
    let re = CGImage(
      width: img.width, height: img.height, bitsPerComponent: img.bitsPerComponent,
      bitsPerPixel: img.bitsPerPixel, bytesPerRow: img.bytesPerRow, space: srgb,
      bitmapInfo: img.bitmapInfo, provider: prov, decode: nil, shouldInterpolate: true,
      intent: .defaultIntent)
  else { return img }
  return re
}

func context(_ w: Int, _ h: Int) -> CGContext {
  CGContext(
    data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: srgb,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
}

func writePNG(_ img: CGImage, _ path: String) {
  let url = URL(fileURLWithPath: path) as CFURL
  guard let dst = CGImageDestinationCreateWithURL(url, UTType.png.identifier as CFString, 1, nil)
  else { fail("cannot write \(path)") }
  CGImageDestinationAddImage(dst, img, nil)
  if !CGImageDestinationFinalize(dst) { fail("cannot finalize \(path)") }
}

func writeJPG(_ img: CGImage, _ path: String, _ q: Double) {
  // flatten on white first (JPEG has no alpha)
  let c = context(img.width, img.height)
  c.setFillColor(hex("FFFFFF"))
  c.fill(CGRect(x: 0, y: 0, width: img.width, height: img.height))
  c.draw(img, in: CGRect(x: 0, y: 0, width: img.width, height: img.height))
  let url = URL(fileURLWithPath: path) as CFURL
  guard let dst = CGImageDestinationCreateWithURL(url, UTType.jpeg.identifier as CFString, 1, nil)
  else { fail("cannot write \(path)") }
  CGImageDestinationAddImage(
    dst, c.makeImage()!, [kCGImageDestinationLossyCompressionQuality: q] as CFDictionary)
  if !CGImageDestinationFinalize(dst) { fail("cannot finalize \(path)") }
}

/// Raw RGBA (un-premultiplied) bytes of an image, top row first.
func rgba(_ img: CGImage) -> (w: Int, h: Int, px: [UInt8]) {
  let w = img.width, h = img.height
  var px = [UInt8](repeating: 0, count: w * h * 4)
  px.withUnsafeMutableBytes { buf in
    let c = CGContext(
      data: buf.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
      space: srgb, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    c.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  }
  return (w, h, px)  // premultiplied; callers un-premultiply as needed
}

func fromRGBA(_ w: Int, _ h: Int, _ px: [UInt8]) -> CGImage {
  var copy = px
  return copy.withUnsafeMutableBytes { buf in
    let c = CGContext(
      data: buf.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
      space: srgb, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    return c.makeImage()!
  }
}

func caption(_ c: CGContext, _ s: String, x: CGFloat, y: CGFloat, size: CGFloat, color: CGColor) {
  let font = CTFontCreateWithName("Helvetica" as CFString, size, nil)
  let attr = NSAttributedString(
    string: s,
    attributes: [
      NSAttributedString.Key(kCTFontAttributeName as String): font,
      NSAttributedString.Key(kCTForegroundColorAttributeName as String): color,
    ])
  let line = CTLineCreateWithAttributedString(attr)
  c.textPosition = CGPoint(x: x, y: y)
  CTLineDraw(line, c)
}

let a = CommandLine.arguments
guard a.count > 1 else { fail("usage: see header") }

switch a[1] {
case "ground":
  let img = load(a[2])
  let pad = a.count > 5 ? Int(a[5])! : 0
  let w = img.width + pad * 2, h = img.height + pad * 2
  let c = context(w, h)
  c.setFillColor(hex(a[4]))
  c.fill(CGRect(x: 0, y: 0, width: w, height: h))
  c.draw(img, in: CGRect(x: pad, y: pad, width: img.width, height: img.height))
  writePNG(c.makeImage()!, a[3])

case "tag":
  let img = load(a[2])
  let c = context(img.width, img.height)
  c.draw(img, in: CGRect(x: 0, y: 0, width: img.width, height: img.height))
  writePNG(c.makeImage()!, a[3])

case "crop":
  let img = load(a[2])
  let x = Int(a[4])!, y = Int(a[5])!, w = Int(a[6])!, h = Int(a[7])!
  let zoom = a.count > 8 ? Double(a[8])! : 1
  let nearest = a.count > 9 ? a[9] == "nearest" : false
  let sub = img.cropping(to: CGRect(x: x, y: y, width: w, height: h))!
  let ow = Int((Double(w) * zoom).rounded()), oh = Int((Double(h) * zoom).rounded())
  let c = context(ow, oh)
  if a.count > 10 {
    c.setFillColor(hex(a[10]))
    c.fill(CGRect(x: 0, y: 0, width: ow, height: oh))
  }
  c.interpolationQuality = nearest ? .none : .high
  c.draw(sub, in: CGRect(x: 0, y: 0, width: ow, height: oh))
  writePNG(c.makeImage()!, a[3])

case "resize":
  let img = load(a[2])
  let w = Int(a[4])!, h = Int(a[5])!
  let c = context(w, h)
  c.interpolationQuality = .high
  c.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  writePNG(c.makeImage()!, a[3])

case "reveal":
  // Every partly transparent pixel is shown at full opacity in its own
  // (un-premultiplied) colour; opaque pixels are shown at 35%, empty ones grey.
  let img = load(a[2])
  var (w, h, px) = rgba(img)
  let bg: [Double] = [0.5, 0.5, 0.5]
  for i in 0..<(w * h) {
    let al = Double(px[i * 4 + 3]) / 255
    if al <= 0 {
      for k in 0..<3 { px[i * 4 + k] = UInt8(bg[k] * 255) }
    } else if al < 0.94 {
      for k in 0..<3 { px[i * 4 + k] = UInt8(min(255, Double(px[i * 4 + k]) / al)) }
    } else {
      for k in 0..<3 {
        let v = Double(px[i * 4 + k]) / al / 255
        px[i * 4 + k] = UInt8((v * 0.35 + bg[k] * 0.65) * 255)
      }
    }
    px[i * 4 + 3] = 255
  }
  writePNG(fromRGBA(w, h, px), a[3])

case "rgbonly":
  // What a tool that ignores alpha shows: the stored (straight) RGB of every pixel, opaque.
  let img = load(a[2])
  guard img.bitsPerComponent == 8, img.bitsPerPixel == 32, img.alphaInfo == .last,
    let data = img.dataProvider?.data as Data?
  else { fail("rgbonly needs 8-bit straight RGBA") }
  let w = img.width, h = img.height, bpr = img.bytesPerRow
  var px = [UInt8](repeating: 255, count: w * h * 4)
  data.withUnsafeBytes { (p: UnsafeRawBufferPointer) in
    for y in 0..<h {
      for x in 0..<w {
        for k in 0..<3 { px[(y * w + x) * 4 + k] = p[y * bpr + x * 4 + k] }
      }
    }
  }
  writePNG(fromRGBA(w, h, px), a[3])

case "fringe":
  let img = load(a[2])
  let (w, h, px) = rgba(img)
  var n = 0, semi = 0, sr = 0.0, sg = 0.0, sb = 0.0
  var minx = w, miny = h, maxx = 0, maxy = 0
  for y in 0..<h {
    for x in 0..<w {
      let i = (y * w + x) * 4
      let al = Int(px[i + 3])
      guard al > 0, al < 240 else { continue }
      semi += 1
      let r = Double(px[i]) * 255 / Double(al), g = Double(px[i + 1]) * 255 / Double(al)
      let b = Double(px[i + 2]) * 255 / Double(al)
      if r > g + 60 {
        n += 1
        sr += r
        sg += g
        sb += b
        minx = min(minx, x)
        miny = min(miny, y)
        maxx = max(maxx, x)
        maxy = max(maxy, y)
      }
    }
  }
  print("semi-transparent px \(semi); red-fringe px \(n)")
  if n > 0 {
    print(
      String(
        format: "fringe mean #%02X%02X%02X; bbox %d,%d..%d,%d", Int(sr / Double(n)),
        Int(sg / Double(n)), Int(sb / Double(n)), minx, miny, maxx, maxy))
  }

case "jpg":
  var img = load(a[2])
  let q = Double(a[4])!
  if a.count > 5 {
    let m = Double(a[5])!
    let s = min(1, m / Double(max(img.width, img.height)))
    if s < 1 {
      let w = Int((Double(img.width) * s).rounded()), h = Int((Double(img.height) * s).rounded())
      let c = context(w, h)
      c.interpolationQuality = .high
      c.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
      img = c.makeImage()!
    }
  }
  writeJPG(img, a[3], q)

case "sheet":
  let out = a[2]
  let cols = Int(a[3])!, cw = Int(a[4])!, ch = Int(a[5])!, gap = Int(a[6])!
  let bg = hex(a[7])
  let items = a.dropFirst(8).map { s -> (String, String) in
    let parts = s.split(separator: "=", maxSplits: 1).map(String.init)
    return (parts[0], parts[1])
  }
  let capH = 30
  let rows = (items.count + cols - 1) / cols
  let W = gap + cols * (cw + gap), H = gap + rows * (ch + capH + gap)
  let c = context(W, H)
  c.setFillColor(bg)
  c.fill(CGRect(x: 0, y: 0, width: W, height: H))
  c.interpolationQuality = .high
  for (k, it) in items.enumerated() {
    let img = load(it.1)
    let col = k % cols, row = k / cols
    let x0 = gap + col * (cw + gap)
    let yTop = gap + row * (ch + capH + gap)
    // fit inside the cell
    let s = min(Double(cw) / Double(img.width), Double(ch) / Double(img.height))
    let dw = Double(img.width) * s, dh = Double(img.height) * s
    let dx = Double(x0) + (Double(cw) - dw) / 2
    let dyTop = Double(yTop) + (Double(ch) - dh) / 2
    c.draw(img, in: CGRect(x: dx, y: Double(H) - dyTop - dh, width: dw, height: dh))
    caption(
      c, it.0, x: CGFloat(x0), y: CGFloat(H - yTop - ch - 21), size: 17,
      color: hex("26201CFF"))
  }
  writePNG(c.makeImage()!, out)

case "icons":
  // The icns holds one 512 px image; macOS scales it to whatever it draws.
  let img = load(a[2])
  let sizes = [16, 32, 64, 128, 256, 512, 1024]
  let gap = 40
  let W = gap + sizes.reduce(0) { $0 + $1 + gap }
  let rowH = 1024 + gap * 2
  let H = rowH * 2
  let c = context(W, H)
  for (r, g) in [a[4], a[5]].enumerated() {
    c.setFillColor(hex(g))
    c.fill(CGRect(x: 0, y: H - (r + 1) * rowH, width: W, height: rowH))
    var x = gap
    for s in sizes {
      // scale the 512 rep to s, then draw it at 1:1 (as the Dock would at that pixel size)
      let t = context(s, s)
      t.interpolationQuality = .high
      t.draw(img, in: CGRect(x: 0, y: 0, width: s, height: s))
      let y = H - (r + 1) * rowH + gap + (1024 - s) / 2
      c.draw(t.makeImage()!, in: CGRect(x: x, y: y, width: s, height: s))
      x += s + gap
    }
  }
  writePNG(c.makeImage()!, a[3])

default:
  fail("unknown command \(a[1])")
}
