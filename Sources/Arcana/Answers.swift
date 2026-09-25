import AppKit
import SwiftUI

// ===================================================================
//  As above — four of the cards are already in the sky: the wheel
//  engraved on it, the glints where the light catches, tonight's moon,
//  and first light itself. When one of them is drawn, what is in the sky
//  answers it once the card has written itself: slowly, over a breath,
//  and it stays so while the card lies on the table. When the cards are
//  returned, each answer is given back as its card's ink sinks.
//  Reversed, each answers the way its line reads.
//
//    The Wheel  the wheel turns a house, and stays turned. Reversed, it
//               turns a house and comes back: the same loop.
//    The Star   the stars come out one by one, and stay. Reversed, one
//               comes out at a time, and goes in again before it holds.
//    The Moon   its half-light spreads over the room, as far as tonight's
//               moon is lit. Reversed, the lilac clears off the sky.
//    The Sun    first light rises into morning, and the rays reach
//               further. Reversed, the light comes up white, and the
//               colour drains out of the sky.
//
//  The sky's own fields are never touched: each answer is a light laid
//  over them, or the wheel turning, or the glints held. Each is carried
//  by Core Animation, so an answer that takes a breath costs the main
//  thread nothing while it comes — here a single SwiftUI pass costs more
//  than a whole frame of the near sky. The stars are the near sky's own.
//  The sky has no voice of its own: nothing here sounds.
// ===================================================================

struct Answer: Equatable {
  enum Kind { case wheel, star, moon, sun }

  let kind: Kind
  let reversed: Bool
  /// The card's place in the deck's order; its sinking ink gives the answer back.
  let card: Int
  /// When the sky began to answer.
  let from: TimeInterval
  /// When it was let go, if the table was cleared at once.
  var until = TimeInterval.infinity

  /// The sky answers only the cards that are already in it.
  init?(_ d: Draw, card: Int, from: TimeInterval) {
    switch d.card.art {
    case .wheel: kind = .wheel
    case .star: kind = .star
    case .moon: kind = .moon
    case .sun: kind = .sun
    default: return nil
    }
    reversed = d.reversed
    self.card = card
    self.from = from
  }

  /// How long it takes to come: about a breath, or longer for a wheel that
  /// turns and comes back; with Reduce Motion, a moment.
  func length(quick: Bool) -> Double {
    if quick { return 1.2 }
    return kind == .wheel && reversed ? 14 : 9
  }

  /// Let go at once, with the table, it fades as the table clears.
  static let fade = 0.6

  /// An answer at a moment: how far it has come, 0…1 over its length; how
  /// much of it is still here, 1 until it is given back; and how long since
  /// it began.
  struct State {
    let p: Double
    let here: Double
    let reversed: Bool
    let age: Double
  }
}

extension Game {
  /// The sky's answer of this kind at `t`, if it is giving one.
  func answer(_ kind: Answer.Kind, at t: TimeInterval) -> Answer.State? {
    guard let a = answers.first(where: { $0.kind == kind }) else { return nil }
    let p = clamp01((t - a.from) / a.length(quick: quick))
    let left = a.until == .infinity ? 0 : ramp(t - a.until, 0, Answer.fade)
    return Answer.State(
      p: p, here: (1 - left) * (1 - sunk(a)), reversed: a.reversed, age: t - a.from)
  }

  /// How far the card an answer came from has sunk into its stock.
  func sunk(_ a: Answer) -> Double { sinks[a.card]?.v ?? 0 }
}

// --- what answers, and how far -------------------------------------

/// The lights the sky lays over itself to answer the Moon and the Sun.
enum Light: CaseIterable {
  /// The Moon reversed: the lilac haze about it clears to plain sky.
  case clearing
  /// The Moon: its half-light, over the whole room.
  case moonlight
  /// The Moon: the light it calls out close about itself.
  case halo
  /// The Sun: first light, risen into morning.
  case morning
  /// The Sun, either way: the rays reaching further.
  case rays
  /// The Sun reversed: the light come up white, the colour washed out.
  case glare

  var kind: Answer.Kind { self == .clearing || self == .moonlight || self == .halo ? .moon : .sun }

  /// Whether this light answers a card lying this way up.
  func answers(_ a: Answer) -> Bool {
    guard a.kind == kind else { return false }
    switch self {
    case .clearing, .glare: return a.reversed
    case .moonlight, .halo, .morning: return !a.reversed
    case .rays: return true
    }
  }

  /// How strong it comes: the Moon's lights only as far as tonight's moon is lit.
  func peak(_ illumination: Double) -> Double {
    switch self {
    case .clearing, .moonlight, .halo: return illumination
    case .morning: return 1
    case .rays: return 0.8
    case .glare: return 0.42
    }
  }
}

/// The curve an answer takes as it comes: values at key times, each span
/// eased by `ramp`'s own S. What it has reached at the end, it keeps.
struct Curve {
  let values: [Double]
  let times: [Double]

  static func rise(to v: Double) -> Curve { Curve(values: [0, v], times: [0, 1]) }

  func at(_ p: Double) -> Double {
    guard let i = times.lastIndex(where: { $0 <= p }), i + 1 < times.count else {
      return p <= 0 ? values[0] : values[values.count - 1]
    }
    return values[i] + (values[i + 1] - values[i]) * ramp(p, times[i], times[i + 1])
  }
}

@MainActor
enum Heavens {
  /// A house of the wheel: twelve to the turn.
  static let house = 30.0

  /// The Wheel's turn, in degrees, clockwise. Upright it turns a house and
  /// stays; reversed it turns a house and comes back.
  static func turn(_ a: Answer) -> Curve {
    a.reversed
      ? Curve(values: [0, house, house, 0], times: [0, 0.46, 0.54, 1]) : .rise(to: house)
  }

  /// The Wheel, as the shot tool draws it at `t`.
  static func turn(_ g: Game, _ t: TimeInterval) -> Double {
    guard let a = g.answers.first(where: { $0.kind == .wheel }),
      let s = g.answer(.wheel, at: t)
    else { return 0 }
    return turn(a).at(s.p) * s.here
  }

  /// A light, as the shot tool draws it at `t`.
  static func light(_ l: Light, _ g: Game, _ t: TimeInterval) -> Double {
    guard let a = g.answers.first(where: { l.answers($0) }), let s = g.answer(a.kind, at: t)
    else { return 0 }
    return Curve.rise(to: l.peak(Moon.tonight.illumination)).at(s.p) * s.here
  }

  /// The Star: how lit glint `k` of `n` is held. Upright they come out one
  /// by one across the breath, as stars do at dusk, and stay. Reversed, one
  /// at a time comes out and goes in again before it holds, and then the
  /// next: the sky never keeps more than one.
  static func star(_ k: Int, of n: Int, _ s: Answer.State) -> Double {
    guard n > 0 else { return 0 }
    if !s.reversed {
      let at = Double(k) / Double(n) * 0.72
      return ramp(s.p, at, at + 0.28) * s.here
    }
    let u = max(0, s.age) / 6.5
    guard Int(u) % n == k else { return 0 }
    let f = u - floor(u)
    return 0.85 * ramp(f, 0, 0.42) * (1 - ramp(f, 0.55, 0.95)) * s.here
  }
}

// --- the lights, laid out --------------------------------------------

/// A soft light laid over the sky: colour fading out from a centre, the
/// same whether Core Animation or SwiftUI draws it.
struct Glow {
  let center: CGPoint  // in the sky's points
  let radius: CGFloat
  let stops: [(color: Color, at: Double)]
}

/// Where the lights fall, for a sky of this size.
struct Lights: Equatable {
  let full: CGSize
  let moon: CGPoint
  var span: CGFloat { max(full.width, full.height) }

  func glow(_ l: Light) -> Glow? {
    switch l {
    case .clearing:
      // the clear sky there, laid over the lilac where it hangs thickest
      return Glow(
        center: CGPoint(x: full.width * 0.86, y: full.height * 0.14), radius: span * 0.44,
        stops: [
          (Color(red: 0.846, green: 0.886, blue: 0.960).opacity(0.78), 0),
          (Color(red: 0.846, green: 0.886, blue: 0.960).opacity(0.36), 0.5),
          (Color(red: 0.846, green: 0.886, blue: 0.960).opacity(0), 1),
        ])
    case .moonlight:
      return Glow(
        center: moon, radius: span * 1.25,
        stops: [
          (Palette.lilac.opacity(0.9), 0), (Palette.lilac.opacity(0.5), 0.42),
          (Palette.lilac.opacity(0), 1),
        ])
    case .halo:
      // lilac close to the limb, so the face keeps its seas; then a ring
      // of pale light; then the half-light
      let r = Sky.moonRadius * 1.02, R = 130.0
      func at(_ k: Double) -> Double { (r + k * (R - r)) / R }
      return Glow(
        center: moon, radius: R,
        stops: [
          (Palette.lilac.opacity(0.55), 0), (Palette.lilac.opacity(0.55), at(0)),
          (Color.white.opacity(0.5), at(0.16)), (Palette.lilac.opacity(0.28), at(0.5)),
          (Palette.lilac.opacity(0), 1),
        ])
    case .morning:
      return Glow(
        center: CGPoint(x: full.width * 0.5, y: full.height * 1.04), radius: span * 1.2,
        stops: [
          (Palette.dawn.opacity(0.9), 0), (Palette.dawn.opacity(0.55), 0.38),
          (Palette.dawn.opacity(0), 1),
        ])
    case .rays, .glare:
      return nil
    }
  }

  /// First light's own rays, reaching further. They are laid over the
  /// morning, which all but hides the rays beneath, so the light is never
  /// doubled. Soft enough to be drawn at half the sky's points.
  func rays() -> CGImage? {
    let k = 0.5
    let w = Int((full.width * k).rounded()), h = Int((full.height * k).rounded())
    guard w > 0, h > 0,
      let ctx = CGContext(
        data: nil, width: w, height: h, bitsPerComponent: 16, bytesPerRow: 0,
        space: CGColorSpace(name: CGColorSpace.sRGB)!,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
          | CGBitmapInfo.byteOrder16Little.rawValue)
    else { return nil }
    ctx.translateBy(x: 0, y: CGFloat(h))
    ctx.scaleBy(x: k, y: -k)
    let origin = Sky.dawnPoint(full)
    let space = CGColorSpace(name: CGColorSpace.sRGB)!
    // the same shafts, from the same hand, as the sky's own (Chamber.swift)
    var r = Rng(1_919)
    for i in 0..<9 {
      let t = Double(i) / 8 * 2 - 1
      let a = -Double.pi / 2 + t * 0.95 + r.sym(0.06)
      let wedge = 0.035 + r.next() * 0.05
      let len = span * (0.85 + r.next() * 0.35) * 1.4
      let bright = 0.17 + r.next() * 0.10
      ctx.saveGState()
      ctx.move(to: origin)
      ctx.addLine(to: CGPoint(x: origin.x + cos(a - wedge) * len, y: origin.y + sin(a - wedge) * len))
      ctx.addLine(to: CGPoint(x: origin.x + cos(a + wedge) * len, y: origin.y + sin(a + wedge) * len))
      ctx.closePath()
      ctx.clip()
      let alphas: [(Double, Double)] = [(0, bright * 1.1), (0.5, 0.066), (1, 0)]
      let colors = alphas.map { CGColor(srgbRed: 1, green: 1, blue: 1, alpha: $0.1) }
      if let g = CGGradient(
        colorsSpace: space, colors: colors as CFArray, locations: alphas.map { CGFloat($0.0) })
      {
        ctx.drawRadialGradient(
          g, startCenter: origin, startRadius: 0, endCenter: origin, endRadius: len, options: [])
      }
      ctx.restoreGState()
    }
    return ctx.makeImage()
  }
}

// ===================================================================
//  Carried by Core Animation. SwiftUI hands each part of the sky only
//  what changes — the answer, and how far its card's ink has sunk — and
//  the render server takes it the rest of the way.
// ===================================================================

/// One value of one layer — a light's strength, the wheel's turn — carried
/// to where an answer has it.
@MainActor
final class Carrier {
  private let layer: CALayer
  private let key: String
  /// Our value as the layer's: a light's strength as its opacity, a turn
  /// in degrees as a rotation (a layer's y runs up, so clockwise is negative).
  private let unit: (Double) -> Double
  private var carrying: (from: TimeInterval, until: TimeInterval)?

  init(_ layer: CALayer, _ key: String, unit: @escaping (Double) -> Double = { $0 }) {
    self.layer = layer
    self.key = key
    self.unit = unit
  }

  /// `ramp`'s own S: a cubic Bézier with these handles is exactly 3t² − 2t³.
  private static let smooth = CAMediaTimingFunction(controlPoints: 1 / 3, 0, 2 / 3, 1)

  private func rest(_ v: Double) { layer.setValue(unit(v), forKeyPath: key) }

  private var shown: Double {
    ((layer.presentation() ?? layer).value(forKeyPath: key) as? NSNumber)?.doubleValue ?? 0
  }

  /// Shows `curve` as answer `a` has it now, and leaves the render server
  /// to carry it on: coming, let go with the table, or given back with its
  /// card's ink — which moves a tick at a time, and so is set directly.
  func show(_ a: Answer?, _ curve: Curve, sunk: Double, quick: Bool) {
    let now = Date().timeIntervalSinceReferenceDate
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    defer { CATransaction.commit() }
    guard let a else {
      layer.removeAnimation(forKey: "answer")
      rest(0)
      carrying = nil
      return
    }
    let length = a.length(quick: quick)
    if a.until != .infinity {
      guard carrying?.until != a.until else { return }
      let from = shown
      layer.removeAnimation(forKey: "answer")
      rest(0)
      let back = CABasicAnimation(keyPath: key)
      back.fromValue = from
      back.toValue = unit(0)
      back.duration = Answer.fade
      back.timingFunction = Self.smooth
      back.beginTime = CACurrentMediaTime() - max(0, now - a.until)
      back.fillMode = .backwards
      layer.add(back, forKey: "answer")
      carrying = (a.from, a.until)
      return
    }
    if sunk > 0 {
      layer.removeAnimation(forKey: "answer")
      rest(curve.at(clamp01((now - a.from) / length)) * (1 - sunk))
      carrying = nil
      return
    }
    rest(curve.values[curve.values.count - 1])
    guard carrying?.from != a.from else { return }
    carrying = (a.from, a.until)
    guard now - a.from < length else { return }
    let come = CAKeyframeAnimation(keyPath: key)
    come.values = curve.values.map { unit($0) }
    come.keyTimes = curve.times.map { NSNumber(value: $0) }
    come.timingFunctions = Array(repeating: Self.smooth, count: curve.values.count - 1)
    come.duration = length
    come.beginTime = CACurrentMediaTime() - (now - a.from)
    come.fillMode = .backwards
    layer.add(come, forKey: "answer")
  }
}

/// The lights the Moon and the Sun are answered with.
struct SkyLights: NSViewRepresentable {
  let lights: Lights
  let answers: [Answer]
  let sunk: [Double]
  let quick: Bool

  func makeNSView(context: Context) -> SkyLightsView { SkyLightsView() }

  func updateNSView(_ v: SkyLightsView, context: Context) {
    v.lay(lights, sun: answers.contains { $0.kind == .sun })
    v.show(answers, sunk: sunk, quick: quick)
  }
}

final class SkyLightsView: NSView {
  private var layers: [Light: CALayer] = [:]
  private var carriers: [Light: Carrier] = [:]
  private var laid: Lights?

  init() {
    super.init(frame: .zero)
    wantsLayer = true
    layerContentsRedrawPolicy = .never
    setAccessibilityElement(false)
    for l in Light.allCases {
      let layer: CALayer
      switch l {
      case .rays:
        layer = CALayer()
        layer.contentsGravity = .resize
      case .glare:
        layer = CALayer()
        layer.backgroundColor = CGColor(srgbRed: 1, green: 1, blue: 1, alpha: 1)
      default:
        let g = CAGradientLayer()
        g.type = .radial
        layer = g
      }
      layer.opacity = 0
      layer.actions = ["opacity": NSNull(), "bounds": NSNull(), "position": NSNull(), "contents": NSNull()]
      self.layer?.addSublayer(layer)
      layers[l] = layer
      carriers[l] = Carrier(layer, "opacity")
    }
  }

  required init?(coder: NSCoder) { fatalError("not used") }

  override var isFlipped: Bool { true }
  override var isOpaque: Bool { false }
  override func hitTest(_ point: NSPoint) -> NSView? { nil }

  override func layout() {
    super.layout()
    if let laid { lay(laid, sun: layers[.rays]?.contents != nil, force: true) }
  }

  /// Lays each light for a sky of this size. The rays are drawn only while
  /// the Sun is on the table.
  func lay(_ l: Lights, sun: Bool, force: Bool = false) {
    let fresh = force || laid != l
    laid = l
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    defer { CATransaction.commit() }
    for (light, layer) in layers where fresh {
      layer.frame = bounds
      guard let g = l.glow(light), let grad = layer as? CAGradientLayer else { continue }
      let w = max(bounds.width, 1), h = max(bounds.height, 1)
      grad.colors = g.stops.map { NSColor($0.color).cgColor }
      grad.locations = g.stops.map { NSNumber(value: $0.at) }
      grad.startPoint = CGPoint(x: g.center.x / w, y: g.center.y / h)
      grad.endPoint = CGPoint(x: (g.center.x + g.radius) / w, y: (g.center.y + g.radius) / h)
    }
    if let rays = layers[.rays] {
      if sun, fresh || rays.contents == nil {
        rays.contents = l.rays()
      } else if !sun, rays.contents != nil {
        rays.contents = nil
      }
    }
  }

  func show(_ answers: [Answer], sunk: [Double], quick: Bool) {
    let lit = Moon.tonight.illumination
    for l in Light.allCases {
      let i = answers.firstIndex { l.answers($0) }
      carriers[l]?.show(
        i.map { answers[$0] }, .rise(to: l.peak(lit)), sunk: i.map { sunk[$0] } ?? 0, quick: quick)
    }
  }
}

/// The engraved wheel, turned by the Wheel. With Reduce Motion it does not
/// turn: the turned wheel fades in over it instead.
struct WheelTurn: NSViewRepresentable {
  let image: CGImage
  let answer: Answer?
  let sunk: Double
  let still: Bool

  func makeNSView(context: Context) -> WheelView { WheelView(image: image) }
  func updateNSView(_ v: WheelView, context: Context) { v.show(answer, sunk: sunk, still: still) }
}

final class WheelView: NSView {
  private let wheel = CALayer()
  private let turned = CALayer()
  private lazy var turning = Carrier(wheel, "transform.rotation.z") { -$0 * .pi / 180 }
  /// With Reduce Motion: the turned wheel fades in as the wheel fades out.
  private lazy var fadingIn = Carrier(turned, "opacity")
  private lazy var fadingOut = Carrier(wheel, "opacity") { 1 - $0 }

  init(image: CGImage) {
    super.init(frame: .zero)
    wantsLayer = true
    layerContentsRedrawPolicy = .never
    for l in [wheel, turned] {
      l.contents = image
      l.contentsGravity = .resize
      l.magnificationFilter = .linear
      l.minificationFilter = .trilinear
      l.actions = ["transform": NSNull(), "bounds": NSNull(), "position": NSNull(), "opacity": NSNull()]
      layer?.addSublayer(l)
    }
    turned.opacity = 0
    turned.setAffineTransform(CGAffineTransform(rotationAngle: -Heavens.house * .pi / 180))
    setAccessibilityElement(false)
  }

  required init?(coder: NSCoder) { fatalError("not used") }

  override var isOpaque: Bool { false }
  override func hitTest(_ point: NSPoint) -> NSView? { nil }

  // never their frames: a turned layer's frame is not its size
  override func layout() {
    super.layout()
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    for l in [wheel, turned] {
      l.bounds = CGRect(origin: .zero, size: bounds.size)
      l.position = CGPoint(x: bounds.midX, y: bounds.midY)
    }
    CATransaction.commit()
  }

  override func viewDidChangeBackingProperties() {
    super.viewDidChangeBackingProperties()
    for l in [wheel, turned] { l.contentsScale = window?.backingScaleFactor ?? 2 }
  }

  func show(_ a: Answer?, sunk: Double, still: Bool) {
    // reversed, the wheel would only come back to where it was: with Reduce
    // Motion nothing shows
    let fade = still ? a.flatMap { $0.reversed ? nil : $0 } : nil
    fadingIn.show(fade, .rise(to: 1), sunk: sunk, quick: true)
    fadingOut.show(fade, .rise(to: 1), sunk: sunk, quick: true)
    turning.show(still ? nil : a, a.map(Heavens.turn) ?? .rise(to: 0), sunk: sunk, quick: false)
  }
}
