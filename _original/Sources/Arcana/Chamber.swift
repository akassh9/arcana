import SwiftUI

// ===================================================================
//  The chamber — candle pool, drifting embers, and the bloom that
//  fires when a card lands.
// ===================================================================

struct Flash: Identifiable, Equatable {
  let id = UUID()
  let point: CGPoint
  let born: TimeInterval
  var strength: Double = 1
}

private struct Mote {
  let x: Double        // 0...1 across the stage
  let speed: Double    // screens per second
  let phase: Double
  let drift: Double
  let size: Double
  let alpha: Double
  let flicker: Double
}

private let motes: [Mote] = {
  var r = Rng(4_231)
  return (0..<54).map { _ in
    Mote(
      x: r.next(),
      speed: 0.018 + r.next() * 0.05,
      phase: r.next() * 6.283,
      drift: 0.008 + r.next() * 0.03,
      size: 0.7 + r.next() * 1.9,
      alpha: 0.10 + r.next() * 0.34,
      flicker: 0.5 + r.next() * 2.2)
  }
}()

struct Chamber: View {
  let flashes: [Flash]
  let reduceMotion: Bool

  var body: some View {
    ZStack {
      Palette.void

      // the light the cards are read by
      RadialGradient(
        colors: [
          Color(red: 0.32, green: 0.24, blue: 0.12).opacity(0.50),
          Color(red: 0.16, green: 0.12, blue: 0.07).opacity(0.16),
          .clear,
        ],
        center: UnitPoint(x: 0.5, y: 0.36), startRadius: 6, endRadius: 660)

      RadialGradient(
        colors: [Color.black.opacity(0.0), Color.black.opacity(0.62)],
        center: .center, startRadius: 240, endRadius: 900)

      TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: reduceMotion)) { tl in
        let t = tl.date.timeIntervalSinceReferenceDate
        Canvas(rendersAsynchronously: true) { ctx, size in
          drawEmbers(ctx: &ctx, size: size, t: reduceMotion ? 0 : t)
          drawFlashes(ctx: &ctx, t: t)
        }
      }
      .blendMode(.screen)
      .allowsHitTesting(false)
    }
    .ignoresSafeArea()
  }

  private func drawEmbers(ctx: inout GraphicsContext, size: CGSize, t: Double) {
    for (i, m) in motes.enumerated() {
      let cycle = (t * m.speed + Double(i) * 0.137).truncatingRemainder(dividingBy: 1)
      let y = (1.08 - cycle * 1.16) * size.height
      let x = (m.x + sin(t * 0.22 + m.phase) * m.drift) * size.width
      // fade in at the bottom, out at the top
      let edge = min(cycle * 4, (1 - cycle) * 3, 1)
      let flick = 0.72 + 0.28 * sin(t * m.flicker + m.phase)
      let a = m.alpha * max(0, edge) * flick
      guard a > 0.004 else { continue }
      let r = m.size
      ctx.fill(
        Path(ellipseIn: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)),
        with: .color(Palette.goldLit.opacity(a)))
      ctx.fill(
        Path(ellipseIn: CGRect(x: x - r * 3.4, y: y - r * 3.4, width: r * 6.8, height: r * 6.8)),
        with: .color(Palette.gold.opacity(a * 0.16)))
    }
  }

  private func drawFlashes(ctx: inout GraphicsContext, t: Double) {
    for f in flashes {
      let age = t - f.born
      guard age >= 0, age < 1.1 else { continue }
      let k = 1 - age / 1.1
      let ease = k * k
      let r = 60 + (1 - k) * 210
      ctx.fill(
        Path(ellipseIn: CGRect(x: f.point.x - r, y: f.point.y - r, width: r * 2, height: r * 2)),
        with: .radialGradient(
          Gradient(colors: [
            Palette.goldLit.opacity(0.52 * ease * f.strength),
            Palette.gold.opacity(0.16 * ease * f.strength),
            .clear,
          ]),
          center: f.point, startRadius: 0, endRadius: r))
    }
  }
}
