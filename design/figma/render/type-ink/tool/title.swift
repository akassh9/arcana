import AppKit
import SwiftUI

// ARCANA as the room sets it, and the light that passes across it. The
// title is the app's own Title view (made internal in the copy); its light
// is posed at a chosen k through the typeInkTitleK hook.

@MainActor func titleView(k: Double?) -> some View {
  typeInkTitleK = k ?? -10  // -10: the band lies far past the word, so no light shows
  return Title(reduceMotion: false, resting: true)
}

/// The largest difference, 0…255, between two same-sized 8-bit images.
func maxDiff(_ a: CGImage, _ b: CGImage) -> Int {
  func px(_ i: CGImage) -> [UInt8] {
    let ctx = CGContext(
      data: nil, width: i.width, height: i.height, bitsPerComponent: 8, bytesPerRow: i.width * 4,
      space: sRGB, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.draw(i, in: CGRect(x: 0, y: 0, width: i.width, height: i.height))
    return Array(UnsafeBufferPointer(start: ctx.data!.bindMemory(to: UInt8.self, capacity: i.width * i.height * 4), count: i.width * i.height * 4))
  }
  let x = px(a), y = px(b)
  guard x.count == y.count else { return 255 }
  var m = 0
  for i in 0..<x.count { m = max(m, abs(Int(x[i]) - Int(y[i]))) }
  return m
}

@MainActor func renderTitle() {
  let pad: CGFloat = 60
  // the word's own frame (the overlay's box), without the 10 pt leading pad
  let wordFrame = idealSize(Text("ARCANA").font(.display(62)).tracking(20))
  let titleFrame = idealSize(titleView(k: nil))

  // at rest, on pearl and on nothing
  save("type-ink/title/wordmark@2x.png", titleView(k: nil).padding(pad).background(Palette.pearl), scale: 2)
  save("type-ink/title/wordmark-alpha@2x.png", titleView(k: nil).padding(pad), scale: 2)

  // where the light is on the word: every k from 0 to 1.05 by 0.01
  let rest = bitmap(titleView(k: nil).padding(pad).background(Palette.pearl), scale: 1)!
  var seen: [(Double, Int)] = []
  for i in 0...105 {
    let k = Double(i) / 100
    let img = bitmap(titleView(k: k).padding(pad).background(Palette.pearl), scale: 1)!
    seen.append((k, maxDiff(rest, img)))
  }
  let lit = seen.filter { $0.1 > 2 }
  let k0 = lit.first?.0 ?? 0.05, k1 = lit.last?.0 ?? 0.75
  print("title light visible for k \(k0)…\(k1)")

  // eight frames evenly across the visible pass
  var frames: [[String: Any]] = []
  var shots: [CGImage] = []
  for f in 0..<8 {
    let k = k0 + (k1 - k0) * Double(f) / 7
    let name = "type-ink/title/light-\(f + 1)-of-8@2x.png"
    if let img = save(name, titleView(k: k).padding(pad).background(Palette.pearl), scale: 2) {
      shots.append(img)
    }
    let sx = -0.5 + 2 * k, ex = -0.1 + 2 * k
    frames.append([
      "frame": f + 1, "png": name, "k": r3(k), "t_seconds_into_cycle": r3(k * 3.2),
      "start_unit": [r3(sx), 0.1], "end_unit": [r3(ex), 0.9],
      "start_pt": [r2(CGFloat(sx) * wordFrame.width), r2(0.1 * wordFrame.height)],
      "end_pt": [r2(CGFloat(ex) * wordFrame.width), r2(0.9 * wordFrame.height)],
      "band_centre_unit_x": r3((sx + ex) / 2),
    ])
  }
  // the eight together, top to bottom (each keeps its 60 pt margin)
  save(
    "type-ink/title/light-strip@2x.png",
    VStack(spacing: -60) {
      ForEach(0..<shots.count, id: \.self) { i in Image(decorative: shots[i], scale: 2) }
    }
    .background(Palette.pearl), scale: 2)

  // how SwiftUI blends `.clear` into the gold: premultiplied (no dark fringe) or not
  let probe = bitmap(
    LinearGradient(
      stops: [
        .init(color: .clear, location: 0), .init(color: Palette.gold.opacity(0.95), location: 0.5),
        .init(color: .clear, location: 1),
      ], startPoint: .leading, endPoint: .trailing
    ).frame(width: 400, height: 4).background(Color.white), scale: 1)!
  var quarter = "?"
  do {
    let ctx = CGContext(
      data: nil, width: probe.width, height: probe.height, bitsPerComponent: 8, bytesPerRow: probe.width * 4,
      space: sRGB, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.draw(probe, in: CGRect(x: 0, y: 0, width: probe.width, height: probe.height))
    let p = ctx.data!.bindMemory(to: UInt8.self, capacity: probe.width * 4 * probe.height)
    let o = (1 * probe.width + 100) * 4
    quarter = String(format: "#%02X%02X%02X", p[o], p[o + 1], p[o + 2])
  }
  print("gradient at 25% over white: \(quarter)")

  writeJSON(
    [
      "about":
        "The light that passes across ARCANA (RootView.swift:1029-1057). A LinearGradient masked by the word's glyphs, over the word's own ink and glow.",
      "word_frame_pt": [r2(wordFrame.width), r2(wordFrame.height)],
      "title_frame_pt_incl_leading_pad": [r2(titleFrame.width), r2(titleFrame.height)],
      "leading_pad_pt": 10,
      "stops": [
        ["location": 0, "color": "clear"],
        ["location": 0.5, "color_token": "gold", "color_hex": hex(Palette.gold), "opacity": 0.95],
        ["location": 1, "color": "clear"],
      ],
      "clear_stops_blend":
        "Measured at 25% of the band over white: \(quarter); premultiplied blending predicts #E5D69C and straight blending #B5AE91, so SwiftUI blends the clear stops premultiplied (no dark fringe): in Figma use \(hex(Palette.gold)) at 0% for both clear stops.",
      "geometry":
        "In the word's frame (unit space, x across, y down): start (-0.5 + 2k, 0.1), end (-0.1 + 2k, 0.9). SwiftUI maps the unit points to points first, so the colour bands are perpendicular to the start→end line in points (it runs \(r2(0.4 * wordFrame.width)) pt across and \(r2(0.8 * wordFrame.height)) pt down, about \(r2(CGFloat(atan2(0.8 * wordFrame.height, 0.4 * wordFrame.width) * 180 / .pi)))° below horizontal).",
      "clock":
        "k = (t mod 12) / 3.2, t the wall clock in seconds. The clock (Bursts: period 12 s, length 3.3 s, 60 fps) runs only 3.3 s of every 12 s. The band moves two unit widths per unit of k.",
      "visible_pass":
        "Measured on the rendered word: light shows for k \(k0)…\(k1), i.e. t ≈ \(r3(k0 * 3.2))…\(r3(k1 * 3.2)) s of each 12 s cycle (≈ \(r3((k1 - k0) * 3.2)) s), linear in time.",
      "rests_when":
        "Reduce Motion is on, the window can't be seen, a reading is on the table, or something covers the room (then the word shows without light).",
      "frames": frames,
    ], "type-ink/title/title-light.json")

  // the word in the room itself, at rest and at the light's brightest
  for (name, k) in [("wordmark-in-room@2x.png", Double?.none), ("light-in-room@2x.png", (k0 + k1) / 2)] {
    let g = freshGame()
    typeInkTitleK = k ?? -10
    if let img = bitmap(stageView(g), scale: 2),
      let c = crop(img, CGRect(x: 330, y: 112, width: 600, height: 168), scale: 2)
    {
      writePNG(c, "type-ink/title/\(name)")
    }
  }
  typeInkTitleK = nil
}
