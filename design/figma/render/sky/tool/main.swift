import AppKit
import SwiftUI

// Renders the sky's layers, lights, moon and near-sky elements for the Figma
// handoff, offscreen only. Usage: mksky <assets/sky dir> [name-prefix …]
// Not part of the app; see ../README.md.

_ = NSApplication.shared

let outDir = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "."
let only = Array(CommandLine.arguments.dropFirst(2))
/// Where checks and the render log go: beside this tool, never among the assets.
let renderDir = Bundle.main.executableURL!.deletingLastPathComponent().path
func want(_ name: String) -> Bool { only.isEmpty || only.contains { name.hasPrefix($0) } }

/// A window of the app: the sky fills it, the stage sits under the 32 pt title bar.
struct Win {
  let full: CGSize
  let top: CGFloat
  var stage: CGSize { CGSize(width: full.width, height: full.height - top) }
  var o: CGSize { CGSize(width: 0, height: top) }
  var span: CGFloat { max(full.width, full.height) }
  var tag: String { "\(Int(full.width))x\(Int(full.height))" }
}
let big = Win(full: CGSize(width: 1260, height: 860), top: 32)
let small = Win(full: CGSize(width: 940, height: 660), top: 32)

// --- output ---------------------------------------------------------

var log: [[String: Any]] = []

/// Writes 8-bit sRGB PNG, premultiplied as CoreGraphics keeps it.
func png(_ img: CGImage, _ rel: String, scale: Double, note: String = "") {
  let w = img.width, h = img.height
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  guard
    let ctx = CGContext(
      data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: space,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
  else { return print("× \(rel)") }
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
  guard let flat = ctx.makeImage(),
    let data = NSBitmapImageRep(cgImage: flat).representation(using: .png, properties: [:])
  else { return print("× \(rel)") }
  let check = rel.hasPrefix("_check/")
  let url = URL(fileURLWithPath: check ? "\(renderDir)/\(rel)" : "\(outDir)/\(rel)")
  try? FileManager.default.createDirectory(
    at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  try? data.write(to: url)
  if check { return print("✓ \(rel) \(w)x\(h)") }
  log.append([
    "file": "sky/\(rel)", "px": [w, h], "scale": scale,
    "pt": [Double(w) / scale, Double(h) / scale], "note": note,
  ])
  print("✓ \(rel) \(w)x\(h)")
}

func text(_ s: String, _ rel: String) {
  let url = URL(fileURLWithPath: "\(outDir)/\(rel)")
  try? FileManager.default.createDirectory(
    at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  try? s.write(to: url, atomically: true, encoding: .utf8)
  log.append(["file": "sky/\(rel)"])
  print("✓ \(rel)")
}

func json(_ o: Any, _ rel: String) {
  let d = try! JSONSerialization.data(withJSONObject: o, options: [.prettyPrinted, .sortedKeys])
  text(String(data: d, encoding: .utf8)!, rel)
}

@MainActor func render<V: View>(_ v: V, scale: CGFloat) -> CGImage? {
  let r = ImageRenderer(
    content: v.environment(\.stillSky, true).environment(\.displayScale, scale))
  r.scale = scale
  r.isOpaque = false
  return r.cgImage
}

@MainActor func still(_ p: SkyPaint, _ size: CGSize, _ scale: CGFloat) -> CGImage? {
  SkyRenderer.shared?.still(p, size: size, scale: scale)
}

func r4(_ v: Double) -> Double { (v * 10000).rounded() / 10000 }
func r2(_ v: Double) -> Double { (v * 100).rounded() / 100 }

MainActor.assumeIsolated {
  // what the moon keeps is never read or written
  Keeping.file = nil
  // tonight, as the handoff is made: 2026-09-30, 21:00 in Chicago
  var cal = Calendar(identifier: .gregorian)
  cal.timeZone = TimeZone(identifier: "America/Chicago")!
  SkyClock.tonightDate = cal.date(
    from: DateComponents(year: 2026, month: 9, day: 30, hour: 21, minute: 0))!

  // a fixed moment for every still: chosen (deterministically) as one where
  // several glints are lit and the room is breathing in
  let T: TimeInterval = {
    let base = 812_000_000.0
    var best = base, score = -1.0
    for i in 0..<8000 {
      let t = base + Double(i) * 0.125
      let b = Sky.breath(t)
      guard b > 0.6 else { continue }
      let lit = glints.map { g in pow(max(0, sin(t * g.rate + g.phase)), 6) }
      let n = lit.filter { $0 > 0.35 }.count
      guard n >= 3 else { continue }
      let s = lit.reduce(0, +) + Double(n)
      if s > score { score = s; best = t }
    }
    return best
  }()
  SkyClock.fixed = T
  let breathT = Sky.breath(T)
  print("T = \(T), breath \(breathT)")

  @MainActor func game() -> Game {
    let g = Game()
    return g
  }

  @MainActor func layout(_ w: Win, _ g: Game) -> Layout { Layout(size: w.stage, slots: g.need, phase: g.phase) }

  @MainActor func chamber(_ g: Game, _ w: Win) -> some View {
    Chamber(
      game: g, pointer: Pointer(), layout: layout(w, g),
      insets: EdgeInsets(top: w.top, leading: 0, bottom: 0, trailing: 0), reduceMotion: false
    )
    .frame(width: w.stage.width, height: w.stage.height)
    .padding(.top, w.top)
    .frame(width: w.full.width, height: w.full.height)
  }

  // ================= the backdrop, layer by layer ====================

  /// Each field of the sky alone, exactly as Chamber.swift:183-234 lays it,
  /// at the opacity it has at charge `c`.
  @MainActor func layer(_ name: String, _ w: Win, _ c: Double, export: Bool = false) -> AnyView {
    let full = w.full, span = w.span
    let v: AnyView
    switch name {
    case "pearl": v = AnyView(Palette.pearl)
    case "high-sky":
      v = AnyView(
        LinearGradient(
          stops: [
            .init(color: Palette.skyBlue, location: 0),
            .init(color: Palette.skyBlue.opacity(0.55), location: 0.34),
            .init(color: Palette.skyBlue.opacity(0), location: 0.7),
          ],
          startPoint: .top, endPoint: .bottom))
    case "lilac":
      v = AnyView(
        RadialGradient(
          colors: [Palette.lilac.opacity(0.8), Palette.lilac.opacity(0)],
          center: UnitPoint(x: 0.86, y: 0.14), startRadius: 0, endRadius: span * 0.44))
    case "rose":
      v = AnyView(
        RadialGradient(
          colors: [Palette.rose.opacity(0.7), Palette.rose.opacity(0)],
          center: UnitPoint(x: 0.08, y: 0.82), startRadius: 0, endRadius: span * 0.42))
    case "dawn":
      v = AnyView(
        RadialGradient(
          stops: [
            .init(color: Palette.dawn.opacity(0.95), location: 0),
            .init(color: Palette.dawn.opacity(0.42), location: 0.36),
            .init(color: Palette.dawn.opacity(0), location: 1),
          ],
          center: UnitPoint(x: 0.5, y: 1.04), startRadius: 0, endRadius: span * 0.74
        ).opacity(export ? 1 : 0.86 + 0.14 * c))
    case "rays":
      v = AnyView(Rays(origin: Sky.dawnPoint(full), span: span).opacity(export ? 1 : 0.8 + 0.2 * c))
    case "wheel":
      v = AnyView(
        ZStack {
          Sky.wheel.resizable().interpolation(.medium)
            .frame(width: span * 1.32, height: span * 1.32)
            .position(Sky.wheelCenter(w.stage) + w.o)
            .opacity(export ? 1 : 0.055 + c * 0.05)
        })
    case "vignette":
      v = AnyView(
        RadialGradient(
          colors: [.clear, Palette.shade.opacity(export ? 1 : 0.09)], center: .center,
          startRadius: span * 0.38, endRadius: span * 0.8))
    default: fatalError(name)
    }
    return AnyView(v.frame(width: full.width, height: full.height))
  }
  let layerNames = ["pearl", "high-sky", "lilac", "rose", "dawn", "rays", "wheel", "vignette"]

  if want("backdrop") {
    for (i, n) in layerNames.enumerated() {
      if let img = render(layer(n, big, 0, export: true), scale: 1) {
        png(img, "backdrop/sky-layer-\(i + 1)-\(n)-1260x860.png", scale: 1, note: "layer opacity 1")
      }
    }
    // the stack, as a check against the chamber's own composite
    let stacked = ZStack { ForEach(layerNames, id: \.self) { layer($0, big, 0) } }
    if let img = render(stacked, scale: 1) {
      png(img, "_check/stacked-layers-1260x860.png", scale: 1)
    }
    SkyClock.moon = false
    SkyClock.near = false
    for w in [big, small] {
      for c in [0.0, 1.0] {
        let g = game()
        if c > 0 {
          g.holding = true
          g.poseCharge(c)
        }
        if let img = render(chamber(g, w), scale: 1) {
          png(
            img, "backdrop/backdrop-composite-charge-\(Int(c))-\(w.tag).png", scale: 1,
            note: "backdrop only: no moon, no near sky")
        }
      }
    }
    SkyClock.moon = true
    SkyClock.near = true
  }

  // ================= the whole sky, as seen ============================

  if want("composite") {
    for w in [big, small] {
      for c in [0.0, 1.0] {
        let g = game()
        if c > 0 {
          g.holding = true
          g.poseCharge(c)
        }
        if let img = render(chamber(g, w), scale: 2) {
          png(img, "composite/sky-full-charge-\(Int(c))-\(w.tag)@2x.png", scale: 2)
        }
      }
    }
  }

  // ================= the engraved wheel, as vector =====================

  @MainActor func svgPath(_ p: Path) -> String {
    var d = ""
    @MainActor func f(_ v: CGFloat) -> String { String(format: "%.2f", Double(v)) }
    p.forEach { e in
      switch e {
      case .move(let a): d += "M\(f(a.x)) \(f(a.y))"
      case .line(let a): d += "L\(f(a.x)) \(f(a.y))"
      case .quadCurve(let a, let c): d += "Q\(f(c.x)) \(f(c.y)) \(f(a.x)) \(f(a.y))"
      case .curve(let a, let c1, let c2):
        d += "C\(f(c1.x)) \(f(c1.y)) \(f(c2.x)) \(f(c2.y)) \(f(a.x)) \(f(a.y))"
      case .closeSubpath: d += "Z"
      }
    }
    return d
  }

  if want("wheel") {
    let side = Double(big.span * 1.32)  // 1663.2 pt at the default window
    for (tag, deg) in [("", 0.0), ("-turned-30", 30.0)] {
      let c = side / 2
      let t = CGAffineTransform(translationX: c, y: c).rotated(by: deg * .pi / 180)
        .translatedBy(x: -c, y: -c)
      var strokes = "", fills = ""
      var nS = 0, nF = 0
      for m in CardArt.wheelMarks(size: side) {
        let d = svgPath(m.path.applying(t))
        if m.fill != nil {
          fills += "<path d=\"\(d)\"/>\n"
          nF += 1
        } else {
          strokes += "<path d=\"\(d)\" stroke-width=\"\(String(format: "%.3f", Double(m.width)))\"/>\n"
          nS += 1
        }
      }
      let s = String(format: "%.1f", side)
      var svg =
        "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"\(s)\" height=\"\(s)\" viewBox=\"0 0 \(s) \(s)\">\n"
      svg += "<g id=\"engraved-wheel\(tag)\">\n"
      svg +=
        "<g id=\"wheel-ink-strokes\" fill=\"none\" stroke=\"#97782F\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n\(strokes)</g>\n"
      if nF > 0 { svg += "<g id=\"wheel-ink-fills\" fill=\"#97782F\">\n\(fills)</g>\n" }
      svg += "</g>\n</svg>\n"
      text(svg, "wheel/engraved-wheel\(tag).svg")
      print("  wheel\(tag): \(nS) strokes, \(nF) fills")
    }
    // a reference of the app's own bitmap, at full ink (not the 5.5% it shows at)
    if let cg = Sky.wheelImage { png(cg, "wheel/engraved-wheel-bitmap-1500px.png", scale: 1500 / (big.span * 1.32)) }
    // and the vector marks drawn by CoreGraphics at the SVG's size, to compare the import against
    let n = Int(side.rounded(.up))
    let ctx = CGContext(
      data: nil, width: n, height: n, bitsPerComponent: 8, bytesPerRow: 0,
      space: CGColorSpace(name: CGColorSpace.sRGB)!,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.translateBy(x: 0, y: CGFloat(n))
    ctx.scaleBy(x: 1, y: -1)
    ctx.setLineCap(.round)
    ctx.setLineJoin(.round)
    let ink = CGColor(srgbRed: 0x97 / 255.0, green: 0x78 / 255.0, blue: 0x2F / 255.0, alpha: 1)
    for m in CardArt.wheelMarks(size: side) {
      ctx.addPath(m.path.cgPath)
      if m.fill != nil { ctx.setFillColor(ink); ctx.fillPath() } else {
        ctx.setStrokeColor(ink); ctx.setLineWidth(m.width); ctx.strokePath()
      }
    }
    png(ctx.makeImage()!, "_check/wheel-vector-cg-1x.png", scale: 1)
  }

  // ================= the moon ==========================================

  @MainActor func moonAt(_ age: Double) -> Moon {
    Moon(date: Date(timeIntervalSince1970: 947_182_440 + age * Moon.synodic))
  }

  if want("moon") {
    var phases: [[String: Any]] = []
    for k in 0..<16 {
      let age = Double(k) / 16
      let m = moonAt(age)
      if let f = m.face(radius: Sky.moonRadius, scale: 8) {
        png(
          f, String(format: "moon/moon-phase-%02d-age-%.4f.png", k, age), scale: 8,
          note: m.name)
      }
      phases.append([
        "index": k, "age": r4(age), "days": r2(age * 29.530588853), "name": m.name,
        "illumination": r4(m.illumination),
        "file": String(format: "sky/moon/moon-phase-%02d-age-%.4f.png", k, age),
      ])
    }
    let tonight = Moon.tonight
    if let f = tonight.face(radius: Sky.moonRadius, scale: 8) {
      png(f, "moon/moon-tonight-2026-09-30.png", scale: 8, note: tonight.name)
    }
    json(
      [
        "phases": phases,
        "tonight": [
          "date": "2026-09-30 21:00 America/Chicago", "age": r4(tonight.age),
          "days": r2(tonight.age * 29.530588853), "name": tonight.name,
          "illumination": r4(tonight.illumination),
        ],
        "radius_pt": 16, "face_px_at_8x": 258,
        "names": [
          "new moon": "age < 0.03 or >= 0.97", "waxing crescent": "< 0.22",
          "first quarter": "< 0.28", "waxing gibbous": "< 0.47", "full moon": "< 0.53",
          "waning gibbous": "< 0.72", "last quarter": "< 0.78", "waning crescent": "otherwise",
        ],
      ], "moon/moon-phases.json")

    // the moon as it hangs: aureole and face (MoonView), on a 192 pt square
    // so the 5 s glow (192 pt) fits
    @MainActor func moonView(_ g: Game) -> some View {
      MoonView(game: g, center: CGPoint(x: 96, y: 96)).frame(width: 192, height: 192)
    }
    let g = game()
    if let img = render(moonView(g), scale: 8) {
      png(img, "moon/moon-composite-tonight@8x.png", scale: 8, note: "aureole + face")
    }
    g.keeping.moonHover = true
    if let img = render(moonView(g), scale: 8) {
      png(img, "moon/moon-composite-hover@8x.png", scale: 8, note: "aureole + face + hover halo")
    }
    g.keeping.moonHover = false
    g.keeping.poseGlow(at: T - 1.7)
    if let img = render(moonView(g), scale: 8) {
      png(img, "moon/moon-composite-took-glow-peak@8x.png", scale: 8, note: "glow at strength 1")
    }
    // each light alone
    let aureole = Canvas { ctx, size in
      ctx.fill(
        Path(ellipseIn: CGRect(x: 0, y: 0, width: size.width, height: size.height)),
        with: .radialGradient(
          Gradient(colors: [
            .white.opacity(0.22 + 0.14 * tonight.illumination), .white.opacity(0),
          ]),
          center: CGPoint(x: size.width / 2, y: size.height / 2), startRadius: Sky.moonRadius,
          endRadius: size.width / 2))
    }.frame(width: 96, height: 96)
    if let img = render(aureole, scale: 8) {
      png(img, "moon/moon-aureole-tonight@8x.png", scale: 8)
    }
    let halo = Circle()
      .fill(
        RadialGradient(
          colors: [.white.opacity(0.5), .white.opacity(0)], center: .center,
          startRadius: Sky.moonRadius, endRadius: 46)
      )
      .frame(width: 96, height: 96)
    if let img = render(halo, scale: 8) { png(img, "moon/moon-hover-halo@8x.png", scale: 8) }
    let glow = RadialGradient(
      stops: MoonGlow.stops.map { .init(color: $0.0, location: $0.1) }, center: .center,
      startRadius: 0, endRadius: 96
    ).frame(width: 192, height: 192)
    if let img = render(glow, scale: 4) {
      png(img, "moon/moon-took-glow-peak@4x.png", scale: 4)
    }
    // the glow's one breath, as a curve
    json(
      [
        "length_s": MoonGlow.length, "keyTimes": MoonGlow.keyTimes, "values": MoonGlow.values,
        "timing": "each span eased by ramp's S = cubic-bezier(1/3, 0, 2/3, 1)",
        "samples": stride(from: 0.0, through: 5.0, by: 0.25).map {
          ["t": $0, "strength": r4(MoonGlow.strength($0))]
        },
      ], "moon/moon-took-glow-curve.json")

    // the label under the moon
    let label = Caps(text: tonight.name, size: 8, tracking: 3.6, color: Palette.text.opacity(0.4))
      .fixedSize().padding(4)
    if let img = render(label, scale: 8) {
      png(img, "moon/moon-label-tonight@8x.png", scale: 8, note: tonight.name.uppercased())
    }
    let kept = Caps(text: "September 18", size: 8, tracking: 3.6, color: Palette.text.opacity(0.55))
      .fixedSize().padding(4)
    if let img = render(kept, scale: 8) {
      png(img, "moon/moon-label-kept-night-example@8x.png", scale: 8, note: "SEPTEMBER 18")
    }
    // the moon in its corner of the real window, at 2x, as a crop reference
    let gg = game()
    if let img = render(chamber(gg, big), scale: 2),
      let crop = img.cropping(
        to: CGRect(x: 964 * 2, y: 41 * 2, width: 240 * 2, height: 180 * 2))
    {
      png(crop, "moon/moon-in-sky-crop@2x.png", scale: 2, note: "crop x 964-1204, y 41-221 window pt; moon at (1083.6, 131.36)")
    }
  }

  // ================= the near sky ======================================

  let g0 = game()
  let L0 = layout(big, g0)
  let focus = L0.deck + big.o
  let nsBig = NearSky.probe(game: g0, origin: big.o, focus: focus, ringR: L0.ringR)

  if want("near") {
    // --- the glint, one at a time: size 3, 5, 7, at its height -------------
    let gs = CGSize(width: 32, height: 32), gc = CGPoint(x: 16, y: 16)
    @MainActor func glint(_ size: Double, tw: Double, charge: Double = 0) -> SkyPaint {
      // Chamber.swift:509-516
      var p = SkyPaint()
      let a = pow(tw, 6) * (0.8 + charge * 0.2)
      if a > 0.01 {
        p.spikes(gc, 1.6 * size * (0.6 + 0.4 * tw), width: 1, Tone.goldInk.opacity(a * 0.55))
        p.glow(gc, 5, Tone.goldLit.opacity(a * 0.7), Tone.goldLit.opacity(0))
      }
      return p
    }
    for s in [3.0, 5.0, 7.0] {
      if let img = still(glint(s, tw: 1), gs, 16) {
        png(img, "near/glint-size-\(Int(s))-peak@16x.png", scale: 16, note: "tw 1, charge 0")
      }
    }
    // one twinkle of a size-5 glint: sin(θ) from 0.30π to 0.70π
    var curve: [[String: Double]] = []
    for (i, th) in stride(from: 0.30, through: 0.7001, by: 0.05).enumerated() {
      let tw = sin(th * .pi)
      if let img = still(glint(5, tw: tw), gs, 16) {
        png(
          img, String(format: "near/glint-twinkle-%02d@16x.png", i), scale: 16,
          note: String(format: "θ %.2fπ, tw %.3f, a %.3f", th, tw, pow(tw, 6) * 0.8))
      }
    }
    for th in stride(from: 0.0, through: 1.0001, by: 0.025) {
      let tw = max(0, sin(th * .pi))
      curve.append([
        "theta_over_pi": r4(th), "tw": r4(tw), "brightness": r4(pow(tw, 6) * 0.8),
        "arm_pt_size5": r4(1.6 * 5 * (0.6 + 0.4 * tw)),
      ])
    }
    json(
      [
        "formula":
          "tw = max(0, sin(t * rate + phase)); a = tw^6 * (0.8 + 0.2 * charge); arm = 1.6 * size * (0.6 + 0.4 * tw), level arms 0.62 of it; arm ink goldInk at 0.55a, 1 pt at the heart thinning linearly to 0 and fading (1 - s)^2 along it; glow r 5 goldLit 0.7a to 0",
        "rate_rad_per_s": "0.35 … 0.85 per glint (period 7.4 … 18 s), dark for half of every period",
        "visible_when": "a > 0.01, i.e. tw > 0.48 (about 0.16π … 0.84π)",
        "samples_over_half_period": curve,
      ], "near/glint-brightness-curve.json")

    // --- the held star (As Above: the Star), one at a time -------------------
    @MainActor func star(_ size: Double, held: Double = 1, breath: Double = 0.5) -> SkyPaint {
      // Chamber.swift:518-526
      var p = SkyPaint()
      p.glow(gc, 14, Tone.white.opacity(0.5 * held), Tone.white.opacity(0))
      p.spikes(gc, 2.2 * size * (0.94 + 0.06 * breath), width: 1.1, Tone.goldInk.opacity(0.5 * held))
      p.glow(gc, 4, Tone.goldLit.opacity(0.8 * held), Tone.goldLit.opacity(0))
      p.disc(gc, 0.9, Tone.white.opacity(0.9 * held))
      return p
    }
    for s in [3.0, 5.0, 7.0] {
      if let img = still(star(s), gs, 16) {
        png(img, "near/star-held-size-\(Int(s))@16x.png", scale: 16, note: "held 1, breath 0.5")
      }
    }
    for (i, h) in [0.25, 0.5, 0.75].enumerated() {
      if let img = still(star(5, held: h), gs, 16) {
        png(img, "near/star-coming-out-\(i + 1)-held-\(h)@16x.png", scale: 16)
      }
    }

    // --- a mote of dust: size 0.6, 1.3, 2.0, at charge 0 and 1 ----------------
    let ms = CGSize(width: 24, height: 24), mc = CGPoint(x: 12, y: 12)
    for s in [0.6, 1.3, 2.0] {
      for c in [0.0, 1.0] {
        // Chamber.swift:570-575, alpha 0.6 at rest (the mean of its range)
        var p = SkyPaint()
        let a = min(1, 0.6 * (1 + c * 0.8))
        let r = s * (1 + c * 0.5)
        p.disc(mc, r * 3.6, Tone.goldLit.opacity(a * 0.22))
        p.disc(mc, r, Tone.gold.opacity(a))
        if let img = still(p, ms, 16) {
          png(img, "near/mote-size-\(s)-charge-\(Int(c))@16x.png", scale: 16)
        }
      }
    }
    // --- a bloom of lens light: r 9, 24, 39 ---------------------------------
    for r in [9.0, 24.0, 39.0] {
      let side = (r + 4) * 2
      let bs = CGSize(width: side, height: side), bc = CGPoint(x: side / 2, y: side / 2)
      // Chamber.swift:492-496, alpha 0.55 (mid range), breath 0.5
      var p = SkyPaint()
      let a = 0.55 * (0.75 + 0.25 * 0.5)
      p.glow(bc, r, Tone.white.opacity(0.55 * a), Tone.white.opacity(0.35 * a), Tone.white.opacity(0))
      p.ring(bc, r * 0.92, width: 0.8, Tone.gold.opacity(a * 0.10))
      if let img = still(p, bs, 8) { png(img, "near/bloom-r-\(Int(r))@8x.png", scale: 8) }
    }

    // --- the fields, across the whole window, at T ---------------------------
    let full = big.full
    if let img = still(nsBig.probeBlooms(size: full, t: T, breath: breathT), full, 2) {
      png(img, "near/field-blooms-1260x860@2x.png", scale: 2, note: "13 blooms at T")
    }
    if let img = still(
      nsBig.probeGlints(size: full, t: T, charge: 0, breath: breathT, star: nil), full, 2)
    {
      png(img, "near/field-glints-1260x860@2x.png", scale: 2, note: "the glints lit at T")
    }
    for c in [0.0, 1.0] {
      if let img = still(nsBig.probeMotes(size: full, t: T, charge: c, breath: breathT), full, 2) {
        png(img, "near/field-motes-charge-\(Int(c))-1260x860@2x.png", scale: 2)
      }
    }
    if let img = still(nsBig.probeAll(size: full, now: T), full, 2) {
      png(img, "near/near-sky-rest-1260x860@2x.png", scale: 2, note: "all of it at rest, at T")
    }
    let gh = game()
    gh.holding = true
    gh.poseCharge(1)
    let nsHeld = NearSky.probe(game: gh, origin: big.o, focus: focus, ringR: L0.ringR)
    if let img = still(nsHeld.probeAll(size: full, now: T), full, 2) {
      png(img, "near/near-sky-charge-1-1260x860@2x.png", scale: 2, note: "held to the full charge")
    }

    // --- the given dust: a written question's letters, into the deck ----------
    let gq = game()
    let asked = "Should I leave the city before winter"
    gq.quill.pose(asked)
    gq.quill.beginGiving()
    let Lq = layout(big, gq)
    let ringTop = Lq.deck.y - Lq.ringR * 1.25 - 16
    let lineY = max(170, (40 + ringTop) / 2) - 7.3  // the line sits 7.3 pt above its column's centre
    gq.quill.poseGiving(center: CGPoint(x: big.stage.width / 2, y: lineY))
    var given: [[String: Any]] = []
    for c in [0.5, 0.6, 0.7, 0.8, 0.9] {
      gq.quill.peak = c
      let nsq = NearSky.probe(game: gq, origin: big.o, focus: focus, ringR: Lq.ringR)
      let p = nsq.probeGiven(
        points: gq.quill.givenPoints(), of: gq.quill.giving, charge: c, peak: c)
      if let img = still(p, full, 2) {
        png(
          img, "near/given-dust-charge-\(c)-1260x860@2x.png", scale: 2,
          note: "only the letters' own motes")
      }
      given.append(["charge": c, "motes": p.sprites.count / 2])
    }
    gq.holding = true
    gq.poseCharge(0.7)
    gq.quill.peak = 0.7
    let nsq = NearSky.probe(game: gq, origin: big.o, focus: focus, ringR: Lq.ringR)
    if let img = still(nsq.probeAll(size: full, now: T), full, 2) {
      png(img, "near/near-sky-giving-charge-0.7-1260x860@2x.png", scale: 2)
    }
    json(
      [
        "question": asked, "line_centre_stage_pt": [r2(big.stage.width / 2), r2(lineY)],
        "letters": gq.quill.giving,
        "points_window_pt": gq.quill.givenPoints().map { [r2($0.x), r2($0.y + big.top)] },
        "deck_window_pt": [r2(focus.x), r2(focus.y)], "frames": given,
      ], "near/given-dust.json")

    // --- the flashes: a card landing (strength 1) and the cut (1.5) ----------
    let Ld = Layout(size: big.stage, slots: 3, phase: .draw)
    let landing = Ld.slot(1)
    let ages = [0.0, 0.15, 0.35, 0.65, 1.0, 1.6]
    for (kind, point, strength) in [("landing", landing, 1.0), ("cut", L0.deck, 1.5)] {
      for (i, age) in ages.enumerated() {
        let f = Flash(point: point, born: T - age, strength: strength)
        if let img = still(nsBig.probeFlashes(t: T, flashes: [f]), full, 1) {
          png(
            img, String(format: "near/flash-%@-%d-age-%.2fs-1260x860.png", kind, i + 1, age),
            scale: 1, note: "centre (\(point.x), \(point.y + big.top)) window pt")
        }
      }
    }

    // --- the hold ring, cropped about the deck ------------------------------
    let rs = CGSize(width: 360, height: 360), rc = CGPoint(x: 180, y: 180)
    let nsR = NearSky.probe(game: g0, origin: .zero, focus: rc, ringR: L0.ringR)
    for c in [0.0, 0.25, 0.5, 0.75, 1.0] {
      if let img = still(nsR.probeRing(charge: c, breath: 0.5, shown: 1), rs, 4) {
        png(img, "near/ring-charge-\(c)@4x.png", scale: 4, note: "breath 0.5")
      }
    }
    for b in [0.0, 1.0] {
      if let img = still(nsR.probeRing(charge: 0, breath: b, shown: 1), rs, 4) {
        png(img, "near/ring-rest-breath-\(Int(b))@4x.png", scale: 4)
      }
    }
    // after the cut the charge drains at 2/3.2 a second and the ring goes with it
    for (i, t) in [0.4, 0.8, 1.2, 1.44].enumerated() {
      let c = max(0, 1 - 2 / 3.2 * t)
      let shown = min(1, c * 1.5)
      if let img = still(nsR.probeRing(charge: c, breath: 0.5, shown: shown), rs, 4) {
        png(
          img, String(format: "near/ring-draining-%d-%.2fs@4x.png", i + 1, t), scale: 4,
          note: String(format: "charge %.3f, shown %.3f", c, shown))
      }
    }
    json(
      [
        "deck_window_pt": [r2(focus.x), r2(focus.y)], "ringR": r4(L0.ringR),
        "deck_window_pt_940x660": [r2(470), r2(Layout(size: small.stage, slots: 3, phase: .invocation).deck.y + 32)],
        "ringR_940x660": r4(Layout(size: small.stage, slots: 3, phase: .invocation).ringR),
      ], "near/ring-geometry.json")
  }

  // ================= As Above: the sky's answers ========================

  let moonPt = Sky.moonCenter(big.stage) + big.o
  let lights = Lights(full: big.full, moon: moonPt)
  let lit = Moon.tonight.illumination

  if want("answers") {
    for l in Light.allCases {
      let a = l.peak(lit)
      let name: String
      let v: AnyView
      switch l {
      case .clearing, .moonlight, .halo, .morning:
        let g = lights.glow(l)!
        name = "\(l)"
        v = AnyView(
          RadialGradient(
            stops: g.stops.map { .init(color: $0.color, location: $0.at) },
            center: UnitPoint(x: g.center.x / big.full.width, y: g.center.y / big.full.height),
            startRadius: 0, endRadius: g.radius
          ).opacity(a))
      case .glare:
        name = "glare"
        v = AnyView(Color.white.opacity(a))
      case .rays:
        name = "rays"
        v = AnyView(Image(decorative: lights.rays()!, scale: 0.5).resizable().opacity(a))
      }
      if let img = render(v.frame(width: big.full.width, height: big.full.height), scale: 1) {
        png(
          img, "answers/as-above-\(name)-1260x860.png", scale: 1,
          note: String(format: "at its peak tonight: %.3f", a))
      }
    }
    // the stars field: every glint held as a star
    let full = big.full
    let s = Answer.State(p: 1, here: 1, reversed: false, age: 60)
    if let img = still(
      nsBig.probeGlints(size: full, t: T, charge: 0, breath: breathT, star: s), full, 2)
    {
      png(img, "answers/as-above-stars-held-1260x860@2x.png", scale: 2, note: "all eleven out")
    }
    // the Star upright as it comes out, star by star
    for (i, p) in [0.2, 0.45, 0.7].enumerated() {
      let st = Answer.State(p: p, here: 1, reversed: false, age: p * 9)
      if let img = still(
        nsBig.probeGlints(size: full, t: T, charge: 0, breath: breathT, star: st), full, 1)
      {
        png(img, "answers/as-above-stars-coming-\(i + 1)-p-\(p)-1260x860.png", scale: 1)
      }
    }

    // the sky with each answer given (no cards; phase .reading so no ring)
    @MainActor func answered(_ id: String, _ reversed: Bool, age: Double = 60) -> Game {
      let g = game()
      g.phase = .reading
      let card = deck.first { $0.id == id }!
      g.answers = [Answer(Draw(card: card, reversed: reversed), card: 0, from: T - age)!]
      return g
    }
    for (id, rev, age, tag) in [
      ("moon", false, 60.0, "moon"), ("moon", true, 60, "moon-reversed"),
      ("sun", false, 60, "sun"), ("sun", true, 60, "sun-reversed"),
      ("star", false, 60, "star"), ("star", true, 16.1, "star-reversed"),
      ("wheel", false, 60, "wheel"), ("wheel", true, 7, "wheel-reversed-mid-turn"),
    ] {
      let g = answered(id, rev, age: age)
      if let img = render(chamber(g, big), scale: 1) {
        png(img, "answers/as-above-sky-\(tag)-1260x860.png", scale: 1, note: "age \(age) s")
      }
    }
    SkyClock.moon = true
    SkyClock.near = true
  }

  // ================= seeded positions ===================================

  if want("positions") {
    @MainActor func rays(_ w: Win) -> [[String: Any]] {
      var r = Rng(1_919)
      let o = Sky.dawnPoint(w.full)
      return (0..<9).map { i in
        let k = Double(i) / 8 * 2 - 1
        let a = -Double.pi / 2 + k * 0.95 + r.sym(0.06)
        let wd = 0.035 + r.next() * 0.05
        let lenK = 0.85 + r.next() * 0.35
        let bright = 0.17 + r.next() * 0.10
        let len = Double(w.span) * lenK
        @MainActor func pt(_ ang: Double, _ l: Double) -> [Double] {
          [r2(o.x + cos(ang) * l), r2(o.y + sin(ang) * l)]
        }
        return [
          "index": i + 1, "angle_rad": r4(a), "angle_deg_from_up": r2((a + .pi / 2) * 180 / .pi),
          "half_width_rad": r4(wd), "half_width_deg": r2(wd * 180 / .pi),
          "length_x_span": r4(lenK), "length_pt": r2(len), "center_white_opacity": r4(bright),
          "triangle_pt": [[r2(o.x), r2(o.y)], pt(a - wd, len), pt(a + wd, len)],
          "as_above_length_pt": r2(len * 1.4), "as_above_center_opacity": r4(bright * 1.1),
          "as_above_triangle_pt": [[r2(o.x), r2(o.y)], pt(a - wd, len * 1.4), pt(a + wd, len * 1.4)],
        ]
      }
    }
    @MainActor func place(_ w: Win) -> [String: Any] {
      [
        "window_pt": [w.full.width, w.full.height], "stage_pt": [w.stage.width, w.stage.height],
        "title_bar_pt": w.top, "span": w.span,
        "dawn_point": [r2(Sky.dawnPoint(w.full).x), r2(Sky.dawnPoint(w.full).y)],
        "moon_center": [r2((Sky.moonCenter(w.stage) + w.o).x), r2((Sky.moonCenter(w.stage) + w.o).y)],
        "wheel_center": [r2((Sky.wheelCenter(w.stage) + w.o).x), r2((Sky.wheelCenter(w.stage) + w.o).y)],
        "wheel_side": r2(w.span * 1.32),
        "deck_ring_center": [r2(Layout(size: w.stage, slots: 3, phase: .invocation).deck.x),
                             r2(Layout(size: w.stage, slots: 3, phase: .invocation).deck.y + w.top)],
        "ringR": r4(Layout(size: w.stage, slots: 3, phase: .invocation).ringR),
        "blooms_pt_at_t0": blooms.map {
          ["x": r2($0.x * w.full.width), "y": r2($0.y * w.full.height), "r": r2($0.r)]
        },
        "glints_pt": glints.map { ["x": r2($0.x * w.full.width), "y": r2($0.y * w.full.height)] },
        "rays": rays(w),
      ]
    }
    let seeds: [String: Any] = [
      "units":
        "x, y are fractions of the FULL window (the sky's frame, title bar included); r, size in pt; speed/rate rad/s unless noted; phase rad. Motes: x fraction, speed in window-heights per second, y cycles from 1.08 to -0.08 of the height. Positions are the seeds' rest places: blooms wander 0.03 W / 0.02 H about them, glints drift a few points with the pointer.",
      "seeds": ["motes": 4231, "blooms": 7707, "glints": 3301, "rays": 1919, "wheel_pen": 1212],
      "blooms": blooms.map {
        ["x": r4($0.x), "y": r4($0.y), "r": r4($0.r), "speed": r4($0.speed), "phase": r4($0.phase), "alpha": r4($0.alpha)]
      },
      "glints": glints.enumerated().map { k, g in
        [
          "index": k + 1, "x": r4(g.x), "y": r4(g.y), "rate": r4(g.rate), "phase": r4(g.phase),
          "size": r4(g.size), "arm_peak_pt": r4(1.6 * g.size), "star_arm_pt": r4(2.2 * g.size),
          "star_comes_out_p": [r4(Double(k) / 11 * 0.72), r4(Double(k) / 11 * 0.72 + 0.28)],
        ] as [String: Any]
      },
      "motes": motes.map {
        ["x": r4($0.x), "speed": r4($0.speed), "phase": r4($0.phase), "drift": r4($0.drift), "size": r4($0.size), "alpha": r4($0.alpha), "flicker": r4($0.flicker), "pull": r4($0.pull)]
      },
      "at_1260x860": place(big), "at_940x660": place(small),
      "T_of_the_stills": T, "breath_at_T": r4(breathT),
      "motes_at_T_1260x860": motes.enumerated().map { i, m in
        let cycle = (T * m.speed + Double(i) * 0.137).truncatingRemainder(dividingBy: 1)
        return [
          "x": r2((m.x + sin(T * 0.22 + m.phase) * m.drift) * 1260), "y": r2((1.08 - cycle * 1.16) * 860),
        ]
      },
      "glints_lit_at_T": glints.map { r4(pow(max(0, sin(T * $0.rate + $0.phase)), 6) * 0.8) },
    ]
    json(seeds, "positions/seeded-positions.json")
  }

  // the render log, for the manifest
  let d = try! JSONSerialization.data(withJSONObject: log, options: [.prettyPrinted])
  let logURL = URL(fileURLWithPath: "\(renderDir)/_log-\(only.joined(separator: "_").isEmpty ? "all" : only.joined(separator: "_")).json")
  try? d.write(to: logURL)
}
