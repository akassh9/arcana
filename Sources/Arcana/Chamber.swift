import SwiftUI

// ===================================================================
//  The chamber — the sky at first light over the table.
//
//  Pale blue overhead, lilac and rose in the air, dawn rising from below
//  the table in a few soft rays; the celestial wheel faintly engraved on
//  the sky like a chart on vellum; tonight's moon, still up in the day;
//  gold dust drifting in the light, gathering to the deck while the
//  question is held; and the bloom and ripple when a card lands.
// ===================================================================

struct Flash: Identifiable, Equatable {
  let id = UUID()
  let point: CGPoint
  let born: TimeInterval
  var strength: Double = 1
}

/// Where the pointer rests, -1…1 from the centre of the stage. Polled by
/// the views that tick anyway, never observed — moving the mouse should
/// not cost a redraw of the sky.
final class Pointer {
  var at: CGPoint = .zero
  private var eased: CGPoint = .zero
  private var last: TimeInterval = 0

  /// The pointer, followed slowly — parallax should drift, not track.
  func follow(now: TimeInterval) -> CGPoint {
    let dt = min(0.1, max(0, now - last))
    last = now
    let k = 1 - exp(-dt * 2.2)
    eased.x += (at.x - eased.x) * k
    eased.y += (at.y - eased.y) * k
    return eased
  }
}

enum Sky {
  /// 0…1…0 over ten seconds — six breaths a minute, the pace of calm breath.
  static func breath(_ t: Double) -> Double { 0.5 - 0.5 * cos(t * 2 * .pi / 10) }

  static func moonCenter(_ size: CGSize) -> CGPoint {
    CGPoint(x: size.width * 0.86, y: max(70, size.height * 0.12))
  }

  static let moonRadius = 16.0

  static func wheelCenter(_ size: CGSize) -> CGPoint {
    CGPoint(x: size.width / 2, y: size.height * 0.42)
  }

  /// Where the light comes from: just under the foot of the stage.
  static func dawnPoint(_ size: CGSize) -> CGPoint {
    CGPoint(x: size.width / 2, y: size.height * 1.04)
  }

  /// The celestial wheel — twelve houses, a star of eight, drawn by the
  /// same unsteady pen as the cards, in the brown-gold of old engraving.
  static let wheel: Image = {
    guard let cg = wheelImage else { return Image(systemName: "circle") }
    return Image(nsImage: NSImage(cgImage: cg, size: NSSize(width: cg.width, height: cg.height)))
  }()

  static let wheelImage: CGImage? = {
    let n = 1500
    guard
      let ctx = CGContext(
        data: nil, width: n, height: n, bitsPerComponent: 8, bytesPerRow: n * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
    else { return nil }
    ctx.translateBy(x: 0, y: CGFloat(n))
    ctx.scaleBy(x: 1, y: -1)
    ctx.setLineCap(.round)
    ctx.setLineJoin(.round)
    let ink = CGColor(red: 0.52, green: 0.40, blue: 0.14, alpha: 1)
    for m in CardArt.wheelMarks(size: Double(n)) {
      ctx.addPath(m.path.cgPath)
      if m.fill != nil {
        ctx.setFillColor(ink)
        ctx.fillPath()
      } else {
        ctx.setStrokeColor(ink)
        ctx.setLineWidth(m.width)
        ctx.strokePath()
      }
    }
    return ctx.makeImage()
  }()
}

// --- what drifts in the light --------------------------------------

/// A mote of gold dust, rising slowly on warm air.
private struct Mote {
  let x: Double  // 0...1 across the stage
  let speed: Double  // screens per second
  let phase: Double
  let drift: Double
  let size: Double
  let alpha: Double
  let flicker: Double
  let pull: Double  // how eagerly it answers the held question
}

private let motes: [Mote] = {
  var r = Rng(4_231)
  return (0..<46).map { _ in
    Mote(
      x: r.next(),
      speed: 0.010 + r.next() * 0.026,
      phase: r.next() * 6.283,
      drift: 0.008 + r.next() * 0.03,
      size: 0.6 + r.next() * 1.4,
      alpha: 0.30 + r.next() * 0.45,
      flicker: 0.5 + r.next() * 2.2,
      pull: 0.45 + r.next() * 0.55)
  }
}()

/// Soft discs of light, like sun through a lens, wandering very slowly.
private struct Bloom {
  let x, y, r, speed, phase, alpha: Double
}

private let blooms: [Bloom] = {
  var r = Rng(7_707)
  return (0..<13).map { _ in
    Bloom(
      x: r.next(), y: 0.08 + r.next() * 0.8, r: 9 + pow(r.next(), 1.5) * 30,
      speed: 0.02 + r.next() * 0.05, phase: r.next() * 6.283, alpha: 0.35 + r.next() * 0.4)
  }
}()

/// Points where the light catches gold and glints for a moment.
private struct Glint {
  let x, y, rate, phase, size: Double
}

private let glints: [Glint] = {
  var r = Rng(3_301)
  var out: [Glint] = []
  while out.count < 11 {
    let g = Glint(
      x: 0.05 + r.next() * 0.9, y: 0.05 + r.next() * 0.85, rate: 0.35 + r.next() * 0.5,
      phase: r.next() * 6.283, size: 3 + r.next() * 4)
    // keep clear of the words in the middle of the stage
    if g.x > 0.28 && g.x < 0.72 && g.y > 0.1 && g.y < 0.8 { continue }
    out.append(g)
  }
  return out
}()

// --- the sky --------------------------------------------------------

struct Chamber: View {
  let game: Game
  let pointer: Pointer
  let layout: Layout
  /// The window's safe-area insets. The stage is laid out inside them, but
  /// the sky must reach every edge of the window — under the title bar too.
  let insets: EdgeInsets
  let reduceMotion: Bool

  var body: some View {
    let size = layout.size
    let full = CGSize(
      width: size.width + insets.leading + insets.trailing,
      height: size.height + insets.top + insets.bottom)
    // where the stage's origin sits inside the sky: anything that answers to
    // the cards — the ring, the wheel, the moon, the blooms — is moved by it
    let o = CGSize(width: insets.leading, height: insets.top)
    let span = max(full.width, full.height)
    let moon = Sky.moonCenter(size) + o

    // The broad fields of the sky are drawn once and left alone. While the
    // question is held, three of them brighten, each through a small clock
    // of its own that only fades it. When one of the sky's own cards is
    // drawn, what answers it is laid over them, or turned, by Core
    // Animation (Answers.swift). Everything that moves by itself lives in
    // the near sky, drawn on the GPU on a clock of its own.
    ZStack {
      Palette.pearl

      // the high sky, cool and pale, clearing toward the table
      LinearGradient(
        stops: [
          .init(color: Palette.skyBlue, location: 0),
          .init(color: Palette.skyBlue.opacity(0.55), location: 0.34),
          .init(color: Palette.skyBlue.opacity(0), location: 0.7),
        ],
        startPoint: .top, endPoint: .bottom)

      // colour in the air: lilac high on the right, rose low on the left
      RadialGradient(
        colors: [Palette.lilac.opacity(0.8), Palette.lilac.opacity(0)],
        center: UnitPoint(x: 0.86, y: 0.14), startRadius: 0, endRadius: span * 0.44)
      RadialGradient(
        colors: [Palette.rose.opacity(0.7), Palette.rose.opacity(0)],
        center: UnitPoint(x: 0.08, y: 0.82), startRadius: 0, endRadius: span * 0.42)

      // first light, rising from below the table
      RadialGradient(
        stops: [
          .init(color: Palette.dawn.opacity(0.95), location: 0),
          .init(color: Palette.dawn.opacity(0.42), location: 0.36),
          .init(color: Palette.dawn.opacity(0), location: 1),
        ],
        center: UnitPoint(x: 0.5, y: 1.04), startRadius: 0, endRadius: span * 0.74
      )
      .chargeOpacity(game) { 0.86 + 0.14 * $0 }

      Rays(origin: Sky.dawnPoint(full), span: span)
        .chargeOpacity(game) { 0.8 + 0.2 * $0 }

      // the Moon's lights and the Sun's, laid over the sky when they are drawn
      SkyAnswers(game: game, lights: Lights(full: full, moon: moon))

      Wheel(game: game, side: span * 1.32, reduceMotion: reduceMotion)
        .position(Sky.wheelCenter(size) + o)
        .chargeOpacity(game) { 0.055 + $0 * 0.05 }

      MoonView(center: moon)

      NearSky(
        game: game, pointer: pointer, origin: o, focus: layout.deck + o, ringR: layout.ringR,
        reduceMotion: reduceMotion)

      // the edge of the page — a breath of warm shade
      RadialGradient(
        colors: [.clear, Palette.shade.opacity(0.09)],
        center: .center, startRadius: span * 0.38, endRadius: span * 0.8)
    }
    .frame(width: full.width, height: full.height)
    // placed in the stage's space so that its corner lands on the window's
    .position(x: full.width / 2 - o.width, y: full.height / 2 - o.height)
    .allowsHitTesting(false)
  }
}

extension CGPoint {
  static func + (p: CGPoint, o: CGSize) -> CGPoint { CGPoint(x: p.x + o.width, y: p.y + o.height) }
}

/// The engraved wheel. Live, it is a layer of its own, so that when the
/// Wheel is drawn Core Animation turns it (Answers.swift). The shot tool,
/// which cannot see such a layer, draws it in SwiftUI — pixel for pixel the
/// same.
private struct Wheel: View {
  let game: Game
  let side: CGFloat
  let reduceMotion: Bool
  @Environment(\.stillSky) private var still

  var body: some View {
    if let image = Sky.wheelImage, !still {
      let a = game.answers.first { $0.kind == .wheel }
      WheelTurn(image: image, answer: a, sunk: a.map { game.sunk($0) } ?? 0, still: reduceMotion)
        .frame(width: side, height: side)
    } else {
      Sky.wheel
        .resizable()
        .interpolation(.medium)
        .frame(width: side, height: side)
        .rotationEffect(.degrees(Heavens.turn(game, Date().timeIntervalSinceReferenceDate)))
    }
  }
}

/// The lights the Moon and the Sun are answered with. Live they are layers
/// of Core Animation's; the shot tool draws the same glows in SwiftUI, at
/// the strength they have now.
private struct SkyAnswers: View {
  let game: Game
  let lights: Lights
  @Environment(\.stillSky) private var still

  var body: some View {
    if still {
      let t = Date().timeIntervalSinceReferenceDate
      ZStack {
        ForEach(Light.allCases, id: \.self) { l in
          let a = Heavens.light(l, game, t)
          if a > 0.001 {
            if let g = lights.glow(l) {
              RadialGradient(
                stops: g.stops.map { .init(color: $0.color, location: $0.at) },
                center: UnitPoint(
                  x: g.center.x / lights.full.width, y: g.center.y / lights.full.height),
                startRadius: 0, endRadius: g.radius
              )
              .opacity(a)
            } else if l == .glare {
              Color.white.opacity(a)
            } else if let image = lights.rays() {
              Image(decorative: image, scale: 0.5).resizable().opacity(a)
            }
          }
        }
      }
      .frame(width: lights.full.width, height: lights.full.height)
    } else {
      SkyLights(
        lights: lights, answers: game.answers, sunk: game.answers.map { game.sunk($0) },
        quick: game.quick
      )
      .frame(width: lights.full.width, height: lights.full.height)
    }
  }
}

/// A few soft shafts of light fanning up from below the table. Drawn once.
private struct Rays: View {
  let origin: CGPoint
  let span: CGFloat

  var body: some View {
    Canvas { ctx, _ in
      var r = Rng(1_919)
      for i in 0..<9 {
        let k = Double(i) / 8 * 2 - 1  // -1 … 1
        let a = -Double.pi / 2 + k * 0.95 + r.sym(0.06)
        let w = 0.035 + r.next() * 0.05
        let len = span * (0.85 + r.next() * 0.35)
        var p = Path()
        p.move(to: origin)
        p.addLine(to: CGPoint(x: origin.x + cos(a - w) * len, y: origin.y + sin(a - w) * len))
        p.addLine(to: CGPoint(x: origin.x + cos(a + w) * len, y: origin.y + sin(a + w) * len))
        p.closeSubpath()
        ctx.fill(
          p,
          with: .radialGradient(
            Gradient(colors: [
              .white.opacity(0.17 + r.next() * 0.10), .white.opacity(0.06), .white.opacity(0),
            ]),
            center: origin, startRadius: 0, endRadius: len))
      }
    }
  }
}

/// Tonight's moon, still up in the day sky: pearl on the side the sun is
/// on, the rest a ghost of the disc (Moon.swift).
private struct MoonView: View {
  let center: CGPoint
  @Environment(\.displayScale) private var scale

  var body: some View {
    let moon = Moon.tonight
    let r = Sky.moonRadius
    ZStack {
      Canvas { ctx, size in
        ctx.fill(
          Path(ellipseIn: CGRect(x: 0, y: 0, width: size.width, height: size.height)),
          with: .radialGradient(
            Gradient(colors: [.white.opacity(0.22 + 0.14 * moon.illumination), .white.opacity(0)]),
            center: CGPoint(x: size.width / 2, y: size.height / 2), startRadius: r,
            endRadius: size.width / 2))
      }
      if let face = moon.face(radius: r, scale: scale) {
        Image(decorative: face, scale: scale)
      }
    }
    .frame(width: 96, height: 96)
    .position(center)
  }
}

/// Gold dust, soft blooms of light and the odd glint: the only part of the
/// sky that moves on its own. Everything in it breathes with the room — six
/// breaths a minute. The ring the question is held in is drawn here too.
/// It is laid as a list of soft shapes and drawn on the GPU, on a clock of
/// its own (SkyRenderer.swift); nothing here is redrawn by SwiftUI.
private struct NearSky: View {
  let game: Game
  let pointer: Pointer
  let origin: CGSize  // the stage's origin within this canvas
  let focus: CGPoint
  let ringR: CGFloat
  let reduceMotion: Bool
  @Environment(\.stillSky) private var still
  @Environment(\.displayScale) private var scale

  var body: some View {
    // quickens only for the ask: the sky never answers the return
    let lively =
      (game.holding && game.phase == .invocation) || game.chargeMoving || game.skyQuick
    // a still sky (Reduce Motion) is drawn again as a star comes out or is given back
    let _ = reduceMotion ? (game.stirring.contains(.star), game.answers.map(game.sunk)) : (false, [])

    if still {
      GeometryReader { geo in
        let frame = paint(size: geo.size, now: Date().timeIntervalSinceReferenceDate)
        if let r = SkyRenderer.shared, let cg = r.still(frame, size: geo.size, scale: scale) {
          Image(decorative: cg, scale: scale)
        }
      }
    } else {
      // a still sky is drawn again whenever what it shows has changed
      SkyLayer(lively: lively, moving: !reduceMotion, seen: game.visible) {
        paint(size: $0, now: $1)
      }
    }
  }

  private func paint(size: CGSize, now: TimeInterval) -> SkyPaint {
    let t = reduceMotion ? 0 : now
    let asking = game.phase == .invocation
    let charge = game.chargeClock.value(at: now)
    // whole while asking, fading back in once the table is cleared; after
    // the cut it fades as the gathered light drains
    let ring =
      asking
      ? (reduceMotion ? 1 : max(ramp(now - game.ringFrom, 0, 0.6), min(1, charge * 4)))
      : min(1, charge * 1.5)
    // a written question, given letter by letter while it is held
    let given = !reduceMotion && asking && charge > 0.44 ? game.quill.givenPoints() : []
    let tilt = reduceMotion ? .zero : pointer.follow(now: now)
    let breath = reduceMotion ? 0.5 : Sky.breath(t)

    var p = SkyPaint()
    paintBlooms(&p, size: size, t: t, tilt: tilt, breath: breath)
    paintGlints(
      &p, size: size, t: t, charge: charge, tilt: tilt, breath: breath,
      star: game.answer(.star, at: now))
    if ring > 0.002 { paintRing(&p, charge: charge, breath: breath, shown: ring) }
    paintMotes(&p, size: size, t: t, charge: charge, breath: breath)
    paintGiven(&p, points: given, of: game.quill.giving, charge: charge, peak: game.quill.peak)
    // with Reduce Motion the sky is still: no light goes out across it
    if !reduceMotion { paintFlashes(&p, t: now, flashes: game.flashes) }
    return p
  }

  private func paintBlooms(
    _ p: inout SkyPaint, size: CGSize, t: Double, tilt: CGPoint, breath: Double
  ) {
    for b in blooms {
      let x = (b.x + 0.03 * sin(t * b.speed + b.phase)) * size.width - tilt.x * 22
      let y = (b.y + 0.02 * cos(t * b.speed * 0.8 + b.phase)) * size.height - tilt.y * 14
      let a = b.alpha * (0.75 + 0.25 * breath)
      let c = CGPoint(x: x, y: y)
      p.glow(
        c, b.r, Tone.white.opacity(0.55 * a), Tone.white.opacity(0.35 * a), Tone.white.opacity(0))
      p.ring(c, b.r * 0.92, width: 0.8, Tone.gold.opacity(a * 0.10))
    }
  }

  /// Each glint catches the light for a moment and lets it go: four fine
  /// arms of light that thin to nothing, the upright one longest. When the
  /// Star is drawn, stars come out where they are, and stay.
  private func paintGlints(
    _ p: inout SkyPaint, size: CGSize, t: Double, charge: Double, tilt: CGPoint,
    breath: Double, star: Answer.State?
  ) {
    for (k, g) in glints.enumerated() {
      let held = star.map { Heavens.star(k, of: glints.count, $0) } ?? 0
      let tw = max(0, sin(t * g.rate + g.phase))
      // a glint's moment of light, as ever — unless a star is out there
      let a = pow(tw, 6) * (0.8 + charge * 0.2) * (1 - held)
      guard a > 0.01 || held > 0.004 else { continue }
      let c = CGPoint(x: g.x * size.width - tilt.x * 16, y: g.y * size.height - tilt.y * 11)
      if a > 0.01 {
        p.spikes(c, 1.6 * g.size * (0.6 + 0.4 * tw), width: 1, Tone.goldInk.opacity(a * 0.55))
        p.glow(c, 5, Tone.goldLit.opacity(a * 0.7), Tone.goldLit.opacity(0))
      }
      if held > 0.004 {
        // a star: the same light, held, in a soft light of its own, with a
        // pearl heart; it breathes with the room
        p.glow(c, 14, Tone.white.opacity(0.5 * held), Tone.white.opacity(0))
        p.spikes(
          c, 2.2 * g.size * (0.94 + 0.06 * breath), width: 1.1, Tone.goldInk.opacity(0.5 * held))
        p.glow(c, 4, Tone.goldLit.opacity(0.8 * held), Tone.goldLit.opacity(0))
        p.disc(c, 0.9, Tone.white.opacity(0.9 * held))
      }
    }
  }

  private func paintRing(_ p: inout SkyPaint, charge c: Double, breath b: Double, shown: Double) {
    let r = Double(ringR)
    p.ring(
      focus, r * 1.2 * (1 + 0.035 * b + 0.05 * c), width: 1,
      Tone.goldInk.opacity((0.10 + 0.08 * b + 0.14 * c) * shown))
    p.ring(focus, r * (1 + 0.02 * b), width: 1, Tone.goldInk.opacity((0.26 + 0.14 * b) * shown))
    guard c > 0.004 else { return }

    // the charge: an arc from the top, clockwise, glowing
    for (w, tone, a) in [
      (14.0, Tone.goldLit, 0.20 + 0.18 * c), (6.0, Tone.goldLit, 0.45), (1.8, Tone.goldInk, 0.95),
    ] {
      p.arc(focus, r, width: w, from: -.pi / 2, through: 2 * .pi * c, tone.opacity(a * shown))
    }
    let head = c * 2 * .pi - .pi / 2
    let h = CGPoint(x: focus.x + cos(head) * r, y: focus.y + sin(head) * r)
    p.glow(h, 14, Tone.goldLit.opacity(0.9 * shown), Tone.goldLit.opacity(0))
    p.disc(h, 2.5, Tone.goldInk.opacity(shown))
  }

  private func paintMotes(
    _ p: inout SkyPaint, size: CGSize, t: Double, charge: Double, breath: Double
  ) {
    let gather = pow(charge, 1.4)
    for (i, m) in motes.enumerated() {
      let cycle = (t * m.speed + Double(i) * 0.137).truncatingRemainder(dividingBy: 1)
      var y = (1.08 - cycle * 1.16) * size.height
      var x = (m.x + sin(t * 0.22 + m.phase) * m.drift) * size.width
      // the held question draws them in, spiralling
      if gather > 0.001 {
        let k = gather * m.pull * 0.82
        let dx = x - focus.x, dy = y - focus.y
        let swirl = gather * 0.9 * m.pull
        let rx = dx * cos(swirl) - dy * sin(swirl)
        let ry = dx * sin(swirl) + dy * cos(swirl)
        x = focus.x + rx * (1 - k)
        y = focus.y + ry * (1 - k)
      }
      let edge = min(cycle * 4, (1 - cycle) * 3, 1)
      let flick = 0.72 + 0.28 * sin(t * m.flicker + m.phase)
      let a = min(1, m.alpha * max(0, edge) * flick * (0.8 + 0.2 * breath) * (1 + charge * 0.8))
      guard a > 0.004 else { continue }
      let r = m.size * (1 + charge * 0.5)
      let c = CGPoint(x: x, y: y)
      p.disc(c, r * 3.6, Tone.goldLit.opacity(a * 0.22))
      p.disc(c, r, Tone.gold.opacity(a))
    }
  }

  /// Each letter of a held question gives its gold as one mote of the same
  /// dust, drawn round into the deck in the order it was written. It
  /// travels only as far as the charge has ever reached: let go, and each
  /// mote fades where it is while its letter inks again.
  private func paintGiven(
    _ p: inout SkyPaint, points: [CGPoint], of n: Int, charge c: Double, peak: Double
  ) {
    guard !points.isEmpty, n > 0 else { return }
    for (k, g) in points.enumerated() {
      let given = Quill.loosen(k, of: n, c)
      let u = Quill.flight(k, of: n, peak)
      // the gold shows as its letter lets go, and is taken under the deck as
      // it arrives rather than piling at its heart
      let a = 0.9 * ramp(given, 0.3, 0.7) * (1 - ramp(u, 0.9, 1))
      guard a > 0.004 else { continue }
      // each letter's mote is one of the room's own: its own size, its own
      // light, its own way down
      var r = Rng(911 &+ UInt32(k))
      // it falls from its letter first, then turns in toward the deck
      let turn = (0.6 + r.next() * 0.9) * u * u
      let size = 0.8 + r.next() * 1.3
      let light = 0.55 + r.next() * 0.45
      let q = g + origin
      let dx = q.x - focus.x, dy = q.y - focus.y
      let x = focus.x + (dx * cos(turn) - dy * sin(turn)) * (1 - u)
      let y = focus.y + (dx * sin(turn) + dy * cos(turn)) * (1 - u)
      let rad = size * (1 + 0.5 * c)
      let al = a * light
      let at = CGPoint(x: x, y: y)
      p.disc(at, rad * 3.6, Tone.goldLit.opacity(al * 0.22))
      p.disc(at, rad, Tone.gold.opacity(al))
    }
  }

  private func paintFlashes(_ p: inout SkyPaint, t: Double, flashes: [Flash]) {
    for f in flashes {
      let age = t - f.born
      guard age >= 0, age < 2.2 else { continue }
      let c = f.point + origin

      if age < 1.3 {
        let k = 1 - age / 1.3
        let ease = k * k
        let r = 70 + (1 - k) * 240 * f.strength
        let s = min(f.strength, 1.4)
        p.glow(
          c, r, Tone.white.opacity(0.85 * ease * s), Tone.goldLit.opacity(0.35 * ease * s),
          Tone.goldLit.opacity(0))
      }

      // the ripple — a ring of light going out across the sky
      let k = age / 2.2
      let rr = 30 + (1 - pow(1 - k, 3)) * 520 * f.strength
      let fade = pow(1 - k, 2.2) * min(f.strength, 1.3)
      p.ring(c, rr, width: 7, Tone.goldLit.opacity(fade * 0.35))
      p.ring(c, rr, width: 1, Tone.goldInk.opacity(fade * 0.45))
    }
  }
}
