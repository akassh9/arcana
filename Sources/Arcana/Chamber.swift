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

  static func wheelCenter(_ size: CGSize) -> CGPoint {
    CGPoint(x: size.width / 2, y: size.height * 0.42)
  }

  /// Where the light comes from: just under the foot of the stage.
  static func dawnPoint(_ size: CGSize) -> CGPoint {
    CGPoint(x: size.width / 2, y: size.height * 1.04)
  }

  /// A soft disc of light, drawn once and stamped wherever light blooms.
  static let bloom: Image = {
    let n = 96
    guard
      let ctx = CGContext(
        data: nil, width: n, height: n, bitsPerComponent: 8, bytesPerRow: n * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
      let grad = CGGradient(
        colorsSpace: CGColorSpaceCreateDeviceRGB(),
        colors: [
          CGColor(red: 1, green: 1, blue: 1, alpha: 0.55),
          CGColor(red: 1, green: 1, blue: 1, alpha: 0.35),
          CGColor(red: 1, green: 1, blue: 1, alpha: 0),
        ] as CFArray, locations: [0, 0.5, 1])
    else { return Image(systemName: "circle") }
    let c = CGPoint(x: n / 2, y: n / 2)
    ctx.drawRadialGradient(
      grad, startCenter: c, startRadius: 0, endCenter: c, endRadius: CGFloat(n / 2), options: [])
    guard let cg = ctx.makeImage() else { return Image(systemName: "circle") }
    return Image(nsImage: NSImage(cgImage: cg, size: NSSize(width: n, height: n)))
  }()

  /// The celestial wheel — twelve houses, a star of eight, drawn by the
  /// same unsteady pen as the cards, in the brown-gold of old engraving.
  static let wheel: Image = {
    let n = 1500
    guard
      let ctx = CGContext(
        data: nil, width: n, height: n, bitsPerComponent: 8, bytesPerRow: n * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
    else { return Image(systemName: "circle") }
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
    guard let cg = ctx.makeImage() else { return Image(systemName: "circle") }
    return Image(nsImage: NSImage(cgImage: cg, size: NSSize(width: n, height: n)))
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
    let charge = game.charge

    // The broad fields of the sky are drawn once and left alone; they
    // change only while the question is held. Everything that moves by
    // itself lives in the near sky, one small canvas with its own clock.
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
      .opacity(0.86 + 0.14 * charge)

      Rays(origin: Sky.dawnPoint(full), span: span)
        .opacity(0.8 + 0.2 * charge)

      Sky.wheel
        .resizable()
        .interpolation(.medium)
        .frame(width: span * 1.32, height: span * 1.32)
        .position(Sky.wheelCenter(size) + o)
        .opacity(0.055 + charge * 0.05)

      MoonView(center: Sky.moonCenter(size) + o)

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

/// Tonight's moon, still up in the day sky: a pale disc, lit on the side
/// the sun is on.
private struct MoonView: View {
  let center: CGPoint

  var body: some View {
    let moon = Moon.tonight
    let r = 12.5
    Canvas { ctx, size in
      let c = CGPoint(x: size.width / 2, y: size.height / 2)
      ctx.fill(
        Path(ellipseIn: CGRect(x: 0, y: 0, width: size.width, height: size.height)),
        with: .radialGradient(
          Gradient(colors: [.white.opacity(0.22 + 0.14 * moon.illumination), .white.opacity(0)]),
          center: c, startRadius: r, endRadius: size.width / 2))
      let disc = Path(ellipseIn: CGRect(x: c.x - r, y: c.y - r, width: r * 2, height: r * 2))
      ctx.fill(disc, with: .color(Color(red: 0.70, green: 0.73, blue: 0.88).opacity(0.5)))
      let lit = moon.litPath(center: c, radius: r)
      ctx.fill(lit, with: .color(.white))
      ctx.stroke(lit, with: .color(Color(red: 0.58, green: 0.63, blue: 0.82).opacity(0.45)), lineWidth: 0.6)
    }
    .frame(width: 96, height: 96)
    .position(center)
  }
}

/// Gold dust, soft blooms of light and the odd glint: the only part of the
/// sky that moves on its own, drawn in one small canvas on its own clock.
/// Everything in it breathes with the room — six breaths a minute. The
/// ring the question is held in is drawn here too.
private struct NearSky: View {
  let game: Game
  let pointer: Pointer
  let origin: CGSize  // the stage's origin within this canvas
  let focus: CGPoint
  let ringR: CGFloat
  let reduceMotion: Bool

  var body: some View {
    let recent = game.flashes.last.map { Date().timeIntervalSinceReferenceDate - $0.born < 2.3 }
    // quickens only for the ask: the sky never answers the return
    let lively =
      (game.holding && game.phase == .invocation) || game.charge > 0.001 || recent == true
    let asking = game.phase == .invocation

    TimelineView(
      .animation(minimumInterval: lively ? 1.0 / 30.0 : 1.0 / 20.0, paused: reduceMotion)
    ) { tl in
      let now = tl.date.timeIntervalSinceReferenceDate
      let t = reduceMotion ? 0 : now
      let charge = game.charge
      // whole while asking, fading back in once the table is cleared; after
      // the cut it fades as the gathered light drains
      let ring =
        asking
        ? (reduceMotion ? 1 : max(ramp(now - game.ringFrom, 0, 0.6), min(1, charge * 4)))
        : min(1, charge * 1.5)
      // a written question, given letter by letter while it is held
      let given = !reduceMotion && asking && charge > 0.44 ? game.quill.givenPoints() : []
      let giving = game.quill.giving
      let peak = game.quill.peak
      let flashes = game.flashes
      let tilt = reduceMotion ? .zero : pointer.follow(now: now)
      let breath = reduceMotion ? 0.5 : Sky.breath(t)

      Canvas(rendersAsynchronously: true) { ctx, size in
        drawBlooms(ctx: &ctx, size: size, t: t, tilt: tilt, breath: breath)
        drawGlints(ctx: &ctx, size: size, t: t, charge: charge, tilt: tilt)
        if ring > 0.002 { drawRing(ctx: &ctx, charge: charge, breath: breath, shown: ring) }
        drawMotes(ctx: &ctx, size: size, t: t, charge: charge, breath: breath)
        drawGiven(ctx: &ctx, points: given, of: giving, charge: charge, peak: peak)
        drawFlashes(ctx: &ctx, t: now, flashes: flashes)
      }
    }
  }

  private func drawBlooms(
    ctx: inout GraphicsContext, size: CGSize, t: Double, tilt: CGPoint, breath: Double
  ) {
    let sprite = ctx.resolve(Sky.bloom)
    for b in blooms {
      let x = (b.x + 0.03 * sin(t * b.speed + b.phase)) * size.width - tilt.x * 22
      let y = (b.y + 0.02 * cos(t * b.speed * 0.8 + b.phase)) * size.height - tilt.y * 14
      let a = b.alpha * (0.75 + 0.25 * breath)
      let rect = CGRect(x: x - b.r, y: y - b.r, width: b.r * 2, height: b.r * 2)
      ctx.opacity = a
      ctx.draw(sprite, in: rect)
      ctx.opacity = 1
      ctx.stroke(
        Path(ellipseIn: rect.insetBy(dx: b.r * 0.08, dy: b.r * 0.08)),
        with: .color(Palette.gold.opacity(a * 0.10)), lineWidth: 0.8)
    }
  }

  private func drawGlints(
    ctx: inout GraphicsContext, size: CGSize, t: Double, charge: Double, tilt: CGPoint
  ) {
    for g in glints {
      let tw = max(0, sin(t * g.rate + g.phase))
      let a = pow(tw, 6) * (0.8 + charge * 0.2)
      guard a > 0.01 else { continue }
      let x = g.x * size.width - tilt.x * 16, y = g.y * size.height - tilt.y * 11
      let l = g.size * (0.6 + 0.4 * tw)
      var p = Path()
      p.move(to: CGPoint(x: x - l, y: y))
      p.addLine(to: CGPoint(x: x + l, y: y))
      p.move(to: CGPoint(x: x, y: y - l))
      p.addLine(to: CGPoint(x: x, y: y + l))
      ctx.stroke(p, with: .color(Palette.goldInk.opacity(a * 0.55)), lineWidth: 0.8)
      ctx.fill(
        Path(ellipseIn: CGRect(x: x - 5, y: y - 5, width: 10, height: 10)),
        with: .radialGradient(
          Gradient(colors: [Palette.goldLit.opacity(a * 0.7), Palette.goldLit.opacity(0)]),
          center: CGPoint(x: x, y: y), startRadius: 0, endRadius: 5))
    }
  }

  private func drawRing(ctx: inout GraphicsContext, charge c: Double, breath b: Double, shown: Double) {
    func circle(_ r: Double) -> Path {
      Path(ellipseIn: CGRect(x: focus.x - r, y: focus.y - r, width: r * 2, height: r * 2))
    }
    let r = Double(ringR)
    ctx.stroke(
      circle(r * 1.2 * (1 + 0.035 * b + 0.05 * c)),
      with: .color(Palette.goldInk.opacity((0.10 + 0.08 * b + 0.14 * c) * shown)), lineWidth: 1)
    ctx.stroke(
      circle(r * (1 + 0.02 * b)),
      with: .color(Palette.goldInk.opacity((0.26 + 0.14 * b) * shown)), lineWidth: 1)
    guard c > 0.004 else { return }

    // the charge: an arc from the top, clockwise, glowing
    var arc = Path()
    arc.addArc(
      center: focus, radius: r, startAngle: .degrees(-90), endAngle: .degrees(-90 + 360 * c),
      clockwise: false)
    for (w, color, a) in [
      (14.0, Palette.goldLit, 0.20 + 0.18 * c), (6.0, Palette.goldLit, 0.45),
      (1.8, Palette.goldInk, 0.95),
    ] {
      ctx.stroke(
        arc, with: .color(color.opacity(a * shown)),
        style: StrokeStyle(lineWidth: w, lineCap: .round))
    }
    let head = c * 2 * .pi - .pi / 2
    let p = CGPoint(x: focus.x + cos(head) * r, y: focus.y + sin(head) * r)
    ctx.fill(
      Path(ellipseIn: CGRect(x: p.x - 14, y: p.y - 14, width: 28, height: 28)),
      with: .radialGradient(
        Gradient(colors: [Palette.goldLit.opacity(0.9 * shown), Palette.goldLit.opacity(0)]),
        center: p, startRadius: 0, endRadius: 14))
    ctx.fill(
      Path(ellipseIn: CGRect(x: p.x - 2.5, y: p.y - 2.5, width: 5, height: 5)),
      with: .color(Palette.goldInk.opacity(shown)))
  }

  private func drawMotes(
    ctx: inout GraphicsContext, size: CGSize, t: Double, charge: Double, breath: Double
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
      ctx.fill(
        Path(ellipseIn: CGRect(x: x - r * 3.6, y: y - r * 3.6, width: r * 7.2, height: r * 7.2)),
        with: .color(Palette.goldLit.opacity(a * 0.22)))
      ctx.fill(
        Path(ellipseIn: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)),
        with: .color(Palette.gold.opacity(a)))
    }
  }

  /// Each letter of a held question gives its gold as one mote of the same
  /// dust, drawn round into the deck in the order it was written. It
  /// travels only as far as the charge has ever reached: let go, and each
  /// mote fades where it is while its letter inks again.
  private func drawGiven(
    ctx: inout GraphicsContext, points: [CGPoint], of n: Int, charge c: Double, peak: Double
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
      let p = g + origin
      let dx = p.x - focus.x, dy = p.y - focus.y
      let x = focus.x + (dx * cos(turn) - dy * sin(turn)) * (1 - u)
      let y = focus.y + (dx * sin(turn) + dy * cos(turn)) * (1 - u)
      let rad = size * (1 + 0.5 * c)
      let al = a * light
      ctx.fill(
        Path(ellipseIn: CGRect(x: x - rad * 3.6, y: y - rad * 3.6, width: rad * 7.2, height: rad * 7.2)),
        with: .color(Palette.goldLit.opacity(al * 0.22)))
      ctx.fill(
        Path(ellipseIn: CGRect(x: x - rad, y: y - rad, width: rad * 2, height: rad * 2)),
        with: .color(Palette.gold.opacity(al)))
    }
  }

  private func drawFlashes(ctx: inout GraphicsContext, t: Double, flashes: [Flash]) {
    for f in flashes {
      let age = t - f.born
      guard age >= 0, age < 2.2 else { continue }
      let p = f.point + origin

      if age < 1.3 {
        let k = 1 - age / 1.3
        let ease = k * k
        let r = 70 + (1 - k) * 240 * f.strength
        let s = min(f.strength, 1.4)
        ctx.fill(
          Path(ellipseIn: CGRect(x: p.x - r, y: p.y - r, width: r * 2, height: r * 2)),
          with: .radialGradient(
            Gradient(colors: [
              .white.opacity(0.85 * ease * s), Palette.goldLit.opacity(0.35 * ease * s),
              Palette.goldLit.opacity(0),
            ]),
            center: p, startRadius: 0, endRadius: r))
      }

      // the ripple — a ring of light going out across the sky
      let k = age / 2.2
      let rr = 30 + (1 - pow(1 - k, 3)) * 520 * f.strength
      let fade = pow(1 - k, 2.2) * min(f.strength, 1.3)
      let ring = Path(
        ellipseIn: CGRect(x: p.x - rr, y: p.y - rr, width: rr * 2, height: rr * 2))
      ctx.stroke(ring, with: .color(Palette.goldLit.opacity(fade * 0.35)), lineWidth: 7)
      ctx.stroke(ring, with: .color(Palette.goldInk.opacity(fade * 0.45)), lineWidth: 1)
    }
  }
}
