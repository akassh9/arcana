import SwiftUI

// ===================================================================
//  Suits — the fifty-six. Each suit has one emblem: the cup, the wand,
//  the sword and the pentacle. A number card lays that many of it, as
//  the old Marseille pips did, and the way they lie tells the card: the
//  five cups with three knocked over, the heart with three swords
//  through it, the ten pentacles on the tree of life. A court card sets
//  one emblem where its rank belongs — the page on the ground, the
//  knight on the road, the queen in the ring, the king on the seat.
//  Each card keeps about one gold, which is what the return leaves.
//  Art space is 186 × 248, as for the twenty-two.
// ===================================================================

enum Suits {
  private static let W = CardArt.artW
  private static let H = CardArt.artH
  private static let CX = W / 2
  private static let CY = H / 2

  static func draw(_ p: inout Pen, _ kind: ArtKind) {
    switch kind {
    case .pip(.cups, let n): cups(&p, n)
    case .pip(.wands, let n): wands(&p, n)
    case .pip(.swords, let n): swords(&p, n)
    case .pip(.pentacles, let n): pentacles(&p, n)
    case .court(let suit, let rank): court(&p, suit, rank)
    default: break
    }
  }

  // ===================================================================
  //  The emblems
  // ===================================================================

  /// Where one emblem is drawn: its centre, its size, its tilt.
  private struct Spot {
    var x: Double
    var y: Double
    var s: Double
    var a: Double = 0

    func at(_ u: Double, _ v: Double) -> [Double] {
      let c = cos(a), n = sin(a)
      return [x + (u * c - v * n) * s, y + (u * n + v * c) * s]
    }
    func path(_ uv: [(Double, Double)]) -> [[Double]] { uv.map { at($0.0, $0.1) } }
  }

  /// A chalice `o.s` tall: bowl, rim, knopped stem, foot. `full` lays its
  /// water in leaf; `lid` closes it with a gilded dome, as the queen's is.
  /// `inside` draws whatever rises out of it, between the bowl and the rim.
  private static func cup(
    _ p: inout Pen, _ o: Spot, full: Bool = false, lid: Bool = false,
    inside: (inout Pen) -> Void = { _ in }
  ) {
    let w = CGFloat(min(2.1, max(1.25, o.s * 0.03)))
    let amp = min(1.0, o.s * 0.012)
    p.smooth(
      o.path([(-0.34, -0.5), (-0.31, -0.29), (-0.2, -0.13), (0, -0.07), (0.2, -0.13), (0.31, -0.29), (0.34, -0.5)]),
      closed: false, w: w)
    if full {
      p.fillChord(
        o.path([
          (-0.315, -0.45), (-0.29, -0.29), (-0.19, -0.145), (0, -0.09), (0.19, -0.145), (0.29, -0.29),
          (0.315, -0.45),
        ]), .gold)
    }
    inside(&p)
    let rim = (0..<18).map { i -> [Double] in
      let t = Double(i) / 18 * .pi * 2
      return o.at(cos(t) * 0.34, -0.5 + sin(t) * 0.06)
    }
    p.smooth(rim, closed: true, w: w * 0.8)
    if lid {
      p.fillChord(
        o.path([(-0.34, -0.5), (-0.3, -0.62), (-0.16, -0.71), (0, -0.735), (0.16, -0.71), (0.3, -0.62), (0.34, -0.5)]),
        .gold)
      let f = o.at(0, -0.8)
      p.fillDiamond(f[0], f[1], max(2.5, o.s * 0.035), max(3.5, o.s * 0.05))
    }
    let top = o.at(0, -0.07), base = o.at(0, 0.37)
    p.line(top[0], top[1], base[0], base[1], w: w * 0.9, amp: amp * 0.4)
    p.fillPoly(o.path([(0, 0.1), (0.038, 0.15), (0, 0.2), (-0.038, 0.15)]), .ink, amp: 0.2)
    p.smooth(o.path([(-0.25, 0.5), (-0.11, 0.405), (0, 0.37), (0.11, 0.405), (0.25, 0.5)]), closed: false, w: w)
    let l = o.at(-0.27, 0.5), r = o.at(0.27, 0.5)
    p.line(l[0], l[1], r[0], r[1], w: w, amp: amp * 0.4)
  }

  /// What a knocked-over cup lets go of, falling from its rim.
  private static func spill(_ p: inout Pen, _ o: Spot) {
    let lip = o.at(0, -0.54), c = o.at(0, 0)
    let out = lip[0] > c[0] ? 1.0 : -1.0
    for k in 0..<3 {
      let d = Double(k)
      p.fillDiamond(lip[0] + out * (1.5 + d * 1.8), lip[1] + 6 + d * 6, 2.5 - d * 0.35, 3.3 - d * 0.4)
    }
  }

  /// A living staff from its foot to its head: the foot turned, a leaf or
  /// two under the head, and a bud.
  private static func wand(
    _ p: inout Pen, _ x1: Double, _ y1: Double, _ x2: Double, _ y2: Double,
    w: CGFloat = 1.8, leaves: Int = 1, bud: InkColor = .ink, leaf: Double = 1
  ) {
    let dx = x2 - x1, dy = y2 - y1
    let len = max(hypot(dx, dy), 0.001)
    let ux = dx / len, uy = dy / len  // toward the head
    let nx = -uy, ny = ux  // across
    p.line(x1, y1, x2, y2, w: w, amp: 0.9)
    p.line(x1 - nx * 4.5, y1 - ny * 4.5, x1 + nx * 4.5, y1 + ny * 4.5, w: w * 0.85, amp: 0.3)
    for k in 0..<leaves {
      let t = 0.15 + Double(k) * 0.11
      let bx = x2 - ux * len * t, by = y2 - uy * len * t
      let side = k % 2 == 0 ? 1.0 : -1.0
      let tx = bx + (nx * side * 8 + ux * 6) * leaf, ty = by + (ny * side * 8 + uy * 6) * leaf
      let mx = (bx + tx) / 2, my = (by + ty) / 2
      let lx = tx - bx, ly = ty - by
      let ll = max(hypot(lx, ly), 0.001)
      let px = -ly / ll * 2.4 * leaf, py = lx / ll * 2.4 * leaf
      p.smooth([[bx, by], [mx + px, my + py], [tx, ty], [mx - px, my - py]], w: 0.9)
    }
    p.fillDiamond(x2 + ux * 3, y2 + uy * 3, 3.2, 4.4, bud)
  }

  /// A sword from its hilt along `blade` to its point: guard, grip, pommel.
  private static func sword(_ p: inout Pen, _ blade: [[Double]], w: CGFloat = 1.6, guardW: Double = 7) {
    p.smooth(blade, closed: false, w: w)
    let h = blade[0], n1 = blade[1]
    let dx = n1[0] - h[0], dy = n1[1] - h[1]
    let len = max(hypot(dx, dy), 0.001)
    let ux = dx / len, uy = dy / len  // toward the point
    let nx = -uy, ny = ux
    p.line(
      h[0] - nx * guardW, h[1] - ny * guardW, h[0] + nx * guardW, h[1] + ny * guardW,
      w: w * 1.1, amp: 0.4)
    let g = [h[0] - ux * 10, h[1] - uy * 10]
    p.line(h[0], h[1], g[0], g[1], w: w * 1.35, amp: 0.3)
    p.ring(g[0] - ux * 2.6, g[1] - uy * 2.6, 2.6, w: 1.0, amp: 0.2, segs: 10)
  }

  /// A small almond leaf from `b` toward `t`.
  private static func leaf(_ p: inout Pen, _ b: [Double], _ t: [Double], width: Double = 2.4) {
    let mx = (b[0] + t[0]) / 2, my = (b[1] + t[1]) / 2
    let lx = t[0] - b[0], ly = t[1] - b[1]
    let ll = max(hypot(lx, ly), 0.001)
    let px = -ly / ll * width, py = lx / ll * width
    p.smooth([b, [mx + px, my + py], t, [mx - px, my - py]], w: 0.9)
  }

  /// A curved stem through `pts`, with leaves along it on alternate sides.
  private static func sprig(_ p: inout Pen, _ pts: [[Double]], leaves: Int, size: Double = 7) {
    p.smooth(pts, closed: false, w: 1.1)
    let n = pts.count
    for k in 0..<leaves {
      let t = (Double(k) + 0.6) / Double(leaves) * Double(n - 1)
      let i = min(n - 2, Int(t)), f = t - Double(i)
      let a = pts[i], b = pts[i + 1]
      let x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f
      let dx = b[0] - a[0], dy = b[1] - a[1]
      let dl = max(hypot(dx, dy), 0.001)
      let side = k % 2 == 0 ? 1.0 : -1.0
      let ux = dx / dl, uy = dy / dl
      leaf(&p, [x, y], [x + (-uy * side + ux * 0.7) * size, y + (ux * side + uy * 0.7) * size], width: size * 0.3)
    }
  }

  /// Five petals round a heart; a given flower's heart is leaf.
  private static func flower(_ p: inout Pen, _ x: Double, _ y: Double, _ r: Double, gilt: Bool = false) {
    for i in 0..<5 {
      let a = -Double.pi / 2 + Double(i) / 5 * .pi * 2
      leaf(&p, [x + cos(a) * r * 0.3, y + sin(a) * r * 0.3], [x + cos(a) * r, y + sin(a) * r], width: r * 0.24)
    }
    if gilt {
      p.dot(x, y, r * 0.36)
    } else {
      p.ring(x, y, r * 0.22, w: 0.8, amp: 0.2, segs: 8)
    }
  }

  /// A great sword from its guard at `h` to its point at `t`: two edges and
  /// the fuller between, a broad guard with red ends, the grip, the pommel.
  private static func bigSword(_ p: inout Pen, _ h: [Double], _ t: [Double], half: Double = 7, guardW: Double = 34) {
    let dx = t[0] - h[0], dy = t[1] - h[1]
    let len = max(hypot(dx, dy), 0.001)
    let ux = dx / len, uy = dy / len, nx = -uy, ny = ux
    p.line(h[0] - nx * half, h[1] - ny * half, t[0], t[1], w: 1.6, amp: 0.6)
    p.line(h[0] + nx * half, h[1] + ny * half, t[0], t[1], w: 1.6, amp: 0.6)
    p.line(h[0] + ux * 6, h[1] + uy * 6, h[0] + ux * len * 0.8, h[1] + uy * len * 0.8, w: 0.8, amp: 0.4)
    p.line(h[0] - nx * guardW, h[1] - ny * guardW, h[0] + nx * guardW, h[1] + ny * guardW, w: 2.2, amp: 0.6)
    p.fillDiamond(h[0] - nx * (guardW + 4), h[1] - ny * (guardW + 4), 4, 5)
    p.fillDiamond(h[0] + nx * (guardW + 4), h[1] + ny * (guardW + 4), 4, 5)
    let g = [h[0] - ux * len * 0.17, h[1] - uy * len * 0.17]
    p.line(h[0], h[1], g[0], g[1], w: 3.2, amp: 0.4)
    p.ring(g[0] - ux * 6, g[1] - uy * 6, 6, w: 1.4, amp: 0.4, segs: 12)
  }

  /// A plain sword from its hilt to its point.
  private static func straight(_ p: inout Pen, _ h: [Double], _ t: [Double], w: CGFloat = 1.5, guardW: Double = 6) {
    sword(&p, [h, t], w: w, guardW: guardW)
  }

  /// Points along the curve from `a` to `b` that passes through `mid`.
  private static func bow(_ a: [Double], _ mid: [Double], _ b: [Double], steps: Int = 8) -> [[Double]] {
    let c = [2 * mid[0] - (a[0] + b[0]) / 2, 2 * mid[1] - (a[1] + b[1]) / 2]
    return (0...steps).map { i in
      let t = Double(i) / Double(steps), u = 1 - t
      return [
        u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
        u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
      ]
    }
  }

  /// A pentacle of radius `r`: a rimmed disc with the five-pointed star
  /// drawn in it; gilded, the disc is leaf.
  private static func pentacle(_ p: inout Pen, _ x: Double, _ y: Double, _ r: Double, gilt: Bool = false) {
    let w = CGFloat(min(2.0, max(1.25, r * 0.065)))
    let amp = max(0.4, r * 0.025)
    if gilt { p.dot(x, y, r * 0.8) }
    p.ring(x, y, r, w: w, amp: amp, segs: 24)
    p.ring(x, y, r * 0.8, w: 0.8, amp: amp * 0.7, segs: 22)
    let v = (0..<5).map { i -> [Double] in
      let a = -Double.pi / 2 + Double(i) / 5 * .pi * 2
      return [x + cos(a) * r * 0.74, y + sin(a) * r * 0.74]
    }
    for i in 0..<5 {
      let a = v[i], b = v[(i + 2) % 5]
      p.line(a[0], a[1], b[0], b[1], w: CGFloat(max(0.9, Double(w) * 0.62)), amp: amp * 0.5)
    }
  }

  // ===================================================================
  //  Cups — each number told by how its cups stand
  // ===================================================================

  private static func cups(_ p: inout Pen, _ n: Int) {
    switch n {
    case 1:
      // the brimming cup: full, its light rising, its water running over
      // the rim into the pool beneath
      for i in 0..<7 {
        let a = -.pi * 5 / 6 + Double(i) / 6 * (.pi * 2 / 3)
        let r1 = i % 2 == 0 ? 52.0 : 44
        p.line(CX + cos(a) * 30, 64 + sin(a) * 30, CX + cos(a) * r1, 64 + sin(a) * r1, w: 1.0, amp: 0.6)
      }
      cup(&p, Spot(x: CX, y: 136, s: 140), full: true)
      for side in [-1.0, 1.0] {
        for (k, dx) in [0.0, 5].enumerated() {
          p.smooth(
            [
              [CX + side * (46 - dx), 67], [CX + side * (55 - dx), 80], [CX + side * (58 - dx), 120],
              [CX + side * (57 - dx * 1.4), 170], [CX + side * (56 - dx * 1.8), 211],
            ], closed: false, w: k == 0 ? 1.0 : 0.8)
        }
      }
      p.ripples(W, 214, count: 3, gap: 9)

    case 2:
      // two cups raised to each other; where they meet, the spark
      cup(&p, Spot(x: CX - 43, y: 146, s: 100, a: 0.16))
      cup(&p, Spot(x: CX + 43, y: 146, s: 100, a: -0.16))
      p.rays(CX, 62, 11, 25, 8, w: 0.9, offset: .pi / 8)
      p.fillDiamond(CX, 62, 6.5, 8.5, .gold)
      p.line(18, 206, W - 18, 206, w: 1.3)
      p.hatch(18, 208, W - 36, 22, gap: 5, angle: -0.9, w: 0.6)

    case 3:
      // three raised together
      cup(&p, Spot(x: CX - 58, y: 158, s: 78, a: 0.25))
      cup(&p, Spot(x: CX + 58, y: 158, s: 78, a: -0.25))
      cup(&p, Spot(x: CX, y: 140, s: 78))
      p.rays(CX, 58, 9, 20, 8, w: 0.9, offset: .pi / 8)
      p.fillDiamond(CX, 58, 5.5, 7.5, .gold)
      p.line(18, 206, W - 18, 206, w: 1.3)
      p.hatch(18, 208, W - 36, 22, gap: 5, angle: -0.9, w: 0.6)

    case 4:
      // three on the ground, and the one offered, overlooked
      p.ring(CX, 74, 40, w: 0.9, amp: 1.5, segs: 24)
      p.rays(CX, 74, 44, 54, 12, w: 0.8, offset: .pi / 12)
      cup(&p, Spot(x: CX, y: 76, s: 54), full: true)
      for x in [CX - 52, CX, CX + 52] { cup(&p, Spot(x: x, y: 176, s: 56)) }
      p.line(14, 204, W - 14, 204, w: 1.4)
      p.hatch(14, 206, W - 28, 24, gap: 5, angle: -0.9, w: 0.6)

    case 5:
      // two still standing, full; three knocked over, spilling
      cup(&p, Spot(x: CX - 32, y: 82, s: 66), full: true)
      cup(&p, Spot(x: CX + 32, y: 82, s: 66), full: true)
      let lying = [
        Spot(x: CX - 46, y: 190, s: 48, a: -.pi / 2 - 0.08), Spot(x: CX + 46, y: 190, s: 48, a: .pi / 2 + 0.08),
      ]
      for o in lying {
        cup(&p, o)
        spill(&p, o)
      }
      cup(&p, Spot(x: CX, y: 182, s: 48, a: .pi))
      p.line(12, 207, W - 12, 207, w: 1.4)
      p.hatch(12, 209, W - 24, 18, gap: 5, angle: -0.9, w: 0.6)

    case 6:
      // cups from an old garden, a flower in each; one of them given
      for (row, y) in [100.0, 192].enumerated() {
        for (k, x) in [CX - 50, CX, CX + 50].enumerated() {
          let o = Spot(x: x, y: y, s: 50)
          cup(&p, o)
          let top = o.at(0, -0.54), f = [top[0], top[1] - 18]
          p.line(top[0], top[1], f[0], f[1] + 4, w: 0.9, amp: 0.3)
          flower(&p, f[0], f[1], 9, gilt: row == 1 && k == 1)
        }
      }

    case 7:
      // cups rising out of the clouds: one of them real
      let spots =
        [-1.5, -0.5, 0.5, 1.5].map { Spot(x: CX + $0 * 40, y: 74, s: 48) }
        + [-1.0, 0.0, 1.0].map { Spot(x: CX + $0 * 46, y: 170, s: 48) }
      for (k, o) in spots.enumerated() where k < 4 { cup(&p, o) }
      cloud(&p, CX, 100, 84)
      for (k, o) in spots.enumerated() where k >= 4 { cup(&p, o, full: k == 5) }
      cloud(&p, CX, 196, 74)

    case 8:
      // eight stacked, a gap among them, left under a waning moon
      p.poly(
        [[16, 116], [40, 92], [58, 106], [84, 76], [112, 102], [134, 88], [W - 16, 116]],
        w: 1.0, amp: 0.8, closed: false)
      p.crescent(CX + 40, 46, 15, bite: 9)
      let h = 40.0
      for k in -2...2 { cup(&p, Spot(x: CX + Double(k) * 28, y: 202 - h / 2, s: h)) }
      for k in [-1.5, -0.5, 1.5] { cup(&p, Spot(x: CX + k * 28, y: 202 - h * 1.5 - 1, s: h)) }
      p.line(12, 203, W - 12, 203, w: 1.4)
      p.hatch(12, 205, W - 24, 22, gap: 5, angle: -0.9, w: 0.6)

    case 9:
      // a full shelf
      for (row, y) in [90.0, 152, 214].enumerated() {
        for (k, x) in [CX - 44, CX, CX + 44].enumerated() {
          cup(&p, Spot(x: x, y: y - 25, s: 48), full: row == 1 && k == 1)
        }
        p.line(22, y + 1, W - 22, y + 1, w: 1.5)
        p.line(26, y + 1, 26, y + 7, w: 1.1, amp: 0.3)
        p.line(W - 26, y + 1, W - 26, y + 7, w: 1.1, amp: 0.3)
      }

    case 10:
      // ten in an arc over a small house, one window lit
      let c = [CX, 164.0]
      for rad in [48.0, 88] {
        let arc = (0...14).map { i -> [Double] in
          let a = .pi + Double(i) / 14 * .pi
          return [c[0] + cos(a) * rad, c[1] + sin(a) * rad]
        }
        p.smooth(arc, closed: false, w: 1.0)
      }
      for k in 0..<10 {
        let a = .pi + 0.3 + Double(k) / 9 * (.pi - 0.6)
        cup(&p, Spot(x: c[0] + cos(a) * 68, y: c[1] + sin(a) * 68, s: 28))
      }
      p.poly([[CX - 17, 212], [CX + 17, 212], [CX + 17, 189], [CX - 17, 189]], w: 1.5, amp: 0.7)
      p.poly([[CX - 23, 190], [CX, 170], [CX + 23, 190]], w: 1.5, amp: 0.7, closed: false)
      p.fillPoly([[CX - 5, 195], [CX + 5, 195], [CX + 5, 204], [CX - 5, 204]], .gold, amp: 0.4)
      p.line(12, 212, W - 12, 212, w: 1.4)
      p.hatch(12, 214, W - 24, 20, gap: 5, angle: -0.9, w: 0.6)

    default: break
    }
  }

  /// A bank of cloud `r` either side of `x`, its top at `y`: a run of
  /// round scallops above, a softer edge below, filled with the stock so
  /// what stands in it rises out of it.
  private static func cloud(_ p: inout Pen, _ x: Double, _ y: Double, _ r: Double) {
    let widths: [Double] = [0.8, 1.15, 0.9, 1.25, 0.85, 1.05]
    let bumps = max(3, Int((r * 2 / 26).rounded()))
    let ws = (0..<bumps).map { widths[$0 % widths.count] }
    let unit = r * 2 / ws.reduce(0, +)
    var edge: [[Double]] = [[x - r - 2, y + 9]]
    var x0 = x - r
    for w in ws {
      let b = w * unit, h = b * 0.42
      for i in 0...5 {
        let a = Double.pi - Double(i) / 5 * .pi
        edge.append([x0 + b / 2 + cos(a) * b / 2, y + 4 - sin(a) * h])
      }
      x0 += b
    }
    edge += [
      [x + r + 2, y + 9], [x + r * 0.7, y + 14], [x + r * 0.2, y + 15.5], [x - r * 0.3, y + 15],
      [x - r * 0.75, y + 13.5],
    ]
    p.fillSmooth(edge, .paper, outline: false)
    p.smooth(edge, w: 1.2)
  }

  // ===================================================================
  //  Small things the numbers are told with
  // ===================================================================

  /// A bird in flight, seen far off: two bowed strokes.
  private static func bird(_ p: inout Pen, _ x: Double, _ y: Double, _ s: Double) {
    p.smooth([[x - s, y - s * 0.2], [x - s * 0.5, y - s * 0.55], [x, y]], closed: false, w: 1.0)
    p.smooth([[x, y], [x + s * 0.5, y - s * 0.55], [x + s, y - s * 0.2]], closed: false, w: 1.0)
  }

  /// A small ship under sail; its sail gilded, if it is the one coming in.
  private static func ship(_ p: inout Pen, _ x: Double, _ y: Double, _ s: Double, gilt: Bool = false) {
    p.smooth([[x - s, y], [x - s * 0.5, y + s * 0.38], [x + s * 0.5, y + s * 0.38], [x + s, y]], closed: false, w: 1.1)
    p.line(x - s, y, x + s, y, w: 1.0, amp: 0.2)
    p.line(x, y, x, y - s * 1.3, w: 0.9, amp: 0.2)
    let sail: [[Double]] = [[x + 0.8, y - s * 1.25], [x + s * 0.8, y - s * 0.2], [x + 0.8, y - s * 0.2]]
    if gilt { p.fillPoly(sail, .gold, amp: 0.2) } else { p.poly(sail, w: 0.9, amp: 0.2) }
  }

  /// A laurel wreath of radius `r`, open at the top.
  private static func wreath(_ p: inout Pen, _ x: Double, _ y: Double, _ r: Double) {
    for side in [-1.0, 1.0] {
      for k in 0..<5 {
        let a = .pi / 2 + side * (0.35 + Double(k) * 0.52)
        let b = [x + cos(a) * r, y + sin(a) * r]
        let t = a + side * 0.55
        leaf(&p, b, [x + cos(t) * (r + 3), y + sin(t) * (r + 3)], width: 2.2)
      }
    }
  }

  /// A sunflower: many petals round a heart of leaf.
  private static func sunflower(_ p: inout Pen, _ x: Double, _ y: Double, _ r: Double) {
    for i in 0..<12 {
      let a = Double(i) / 12 * .pi * 2
      leaf(&p, [x + cos(a) * r * 0.45, y + sin(a) * r * 0.45], [x + cos(a) * r, y + sin(a) * r], width: r * 0.14)
    }
    p.dot(x, y, r * 0.42)
  }

  /// A bunch of grapes hanging from `(x, y)`.
  private static func grapes(_ p: inout Pen, _ x: Double, _ y: Double, _ s: Double = 3.2) {
    let rows: [[Double]] = [[-1.5, 0], [-0.5, 0], [0.5, 0], [1.5, 0], [-1, 1], [0, 1], [1, 1], [-0.5, 2], [0.5, 2], [0, 3]]
    for g in rows { p.ring(x + g[0] * s * 1.9, y + s + g[1] * s * 1.7, s, w: 0.8, amp: 0.15, segs: 9) }
  }

  /// A butterfly at rest, its wings open.
  private static func butterfly(_ p: inout Pen, _ x: Double, _ y: Double, _ s: Double) {
    for side in [-1.0, 1.0] {
      p.smooth([[x, y], [x + side * s * 0.8, y - s * 0.9], [x + side * s * 1.2, y - s * 0.3], [x + side * s * 0.4, y]], w: 0.9)
      p.smooth([[x, y], [x + side * s * 0.9, y + s * 0.3], [x + side * s * 0.7, y + s * 0.85], [x + side * s * 0.2, y + s * 0.4]], w: 0.9)
    }
    p.line(x, y - s * 0.5, x, y + s * 0.6, w: 1.0, amp: 0.1)
  }

  /// A pyramid on the horizon, its shaded face hatched.
  private static func pyramid(_ p: inout Pen, _ x: Double, _ y: Double, _ s: Double) {
    p.poly([[x - s, y], [x, y - s * 0.95], [x + s, y]], w: 1.1, amp: 0.4, closed: false)
    p.line(x, y - s * 0.95, x + s * 0.28, y, w: 0.8, amp: 0.3)
    for k in 1..<4 {
      let t = Double(k) / 4
      p.line(x + s * 0.28 * t + s * 0.72 * t * 0.1, y - s * 0.95 * (1 - t), x + s * t, y - 0.3, w: 0.6, amp: 0.2)
    }
  }

  /// A wavy stroke of wind from `x0` to `x1`.
  private static func wind(_ p: inout Pen, _ x0: Double, _ x1: Double, _ y: Double, w: CGFloat = 1.0) {
    let n = 6
    let pts = (0...n).map { i -> [Double] in
      let t = Double(i) / Double(n)
      return [x0 + (x1 - x0) * t, y + sin(t * .pi * 2.2) * 3]
    }
    p.smooth(pts, closed: false, w: w)
  }

  /// Short strokes of rain across a band.
  private static func rain(_ p: inout Pen, _ x0: Double, _ x1: Double, _ y0: Double, _ rows: Int) {
    for r in 0..<rows {
      let y = y0 + Double(r) * 15
      var x = x0 + (r % 2 == 0 ? 0 : 7)
      while x < x1 {
        p.line(x, y, x - 3, y + 8, w: 0.8, amp: 0.2)
        x += 14
      }
    }
  }

  /// A heart, `s` wide, centred on `(x, y)`.
  private static func heart(_ x: Double, _ y: Double, _ s: Double) -> [[Double]] {
    (0..<40).map { i -> [Double] in
      let t = Double(i) / 40 * .pi * 2
      let hx = 16 * pow(sin(t), 3)
      let hy = 13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t)
      return [x + hx * s / 32, y - (hy + 2.5) * s / 32]
    }
  }

  /// The ground: a line, and under it a band of hatching.
  private static func ground(_ p: inout Pen, _ y: Double, depth: Double = 20) {
    p.line(12, y, W - 12, y, w: 1.4)
    if depth > 0 { p.hatch(12, y + 2, W - 24, depth, gap: 6, angle: -1.1, w: 0.65) }
  }

  // ===================================================================
  //  Wands — staves planted, carried, raised and crossed
  // ===================================================================

  private static func wands(_ p: inout Pen, _ n: Int) {
    switch n {
    case 1:
      // one staff, in leaf, budding into light, planted in the ground
      ground(&p, 214)
      wand(&p, CX, 214, CX, 58, w: 3.0, leaves: 6, leaf: 1.8)
      let bud: [[Double]] = [[CX, 22], [CX + 9, 40], [CX, 56], [CX - 9, 40]]
      p.fillSmooth(bud, .gold)
      p.rays(CX, 40, 16, 30, 9, w: 0.9, offset: .pi * 1.06)

    case 2:
      // the world in hand, between two staves on the wall, the sea beyond
      p.ripples(W, 146, count: 3, gap: 8)
      var wall: [[Double]] = [[12, 184]]
      var x = 12.0
      while x < W - 20 {
        wall += [[x, 172], [x + 14, 172], [x + 14, 184], [x + 24, 184]]
        x += 24
      }
      wall.append([W - 12, 184])
      p.poly(wall, w: 1.4, amp: 0.4, closed: false)
      p.hatch(12, 186, W - 24, 28, gap: 7, angle: 0, w: 0.6)
      p.line(12, 214, W - 12, 214, w: 1.4)
      wand(&p, 34, 172, 34, 36, w: 2.0, leaves: 2)
      wand(&p, 152, 172, 152, 36, w: 2.0, leaves: 2)
      p.dot(CX, 104, 25)
      p.ring(CX, 104, 25, w: 1.5, amp: 0.8, segs: 24)
      p.smooth((0..<16).map { i in
        let a = Double(i) / 16 * .pi * 2
        return [CX + cos(a) * 10, 104 + sin(a) * 25]
      }, w: 0.9)
      p.line(CX - 25, 104, CX + 25, 104, w: 0.9, amp: 0.3)
      p.line(CX - 21, 91, CX + 21, 91, w: 0.8, amp: 0.3)
      p.line(CX - 21, 117, CX + 21, 117, w: 0.8, amp: 0.3)
      p.line(CX, 79, CX, 66, w: 1.3, amp: 0.2)
      p.line(CX - 5, 71, CX + 5, 71, w: 1.3, amp: 0.2)

    case 3:
      // three staves planted on the cliff; ships far out, one coming in
      p.line(12, 126, W - 12, 126, w: 0.9, amp: 0.6)
      ship(&p, 132, 122, 8)
      ship(&p, 160, 124, 6.5, gilt: true)
      for (i, y) in [146.0, 162, 178, 194].enumerated() {
        let x0 = 124 + Double(i) * 3
        p.smooth((0...5).map { k in [x0 + Double(k) * (W - 14 - x0) / 5, y + (k % 2 == 0 ? 0 : 2.2)] }, closed: false, w: 1.0)
      }
      p.poly([[12, 172], [108, 172], [118, 190], [114, 214]], w: 1.5, amp: 0.8, closed: false)
      p.hatch(12, 174, 96, 40, gap: 6, angle: -1.1, w: 0.65)
      for (x, top) in [(28.0, 40.0), (58, 50), (90, 34)] { wand(&p, x, 172, x, top, w: 2.0, leaves: 2) }

    case 4:
      // four staves hung with a garland; the gate of home beyond
      let xs = [30.0, 70, 116, 156]
      p.poly([[CX - 24, 206], [CX - 24, 168], [CX - 12, 168], [CX - 12, 206]], w: 1.3, amp: 0.5)
      p.poly([[CX + 12, 206], [CX + 12, 168], [CX + 24, 168], [CX + 24, 206]], w: 1.3, amp: 0.5)
      p.smooth([[CX - 12, 206], [CX - 11, 188], [CX, 180], [CX + 11, 188], [CX + 12, 206]], closed: false, w: 1.3)
      for cx in [CX - 18, CX + 18] {
        p.poly([[cx - 6, 168], [cx - 6, 163], [cx - 2, 163], [cx - 2, 168]], w: 0.9, amp: 0.2, closed: false)
        p.poly([[cx + 2, 168], [cx + 2, 163], [cx + 6, 163], [cx + 6, 168]], w: 0.9, amp: 0.2, closed: false)
      }
      for x in xs { wand(&p, x, 206, x, 48, w: 1.9, leaves: 1) }
      for k in 0..<3 {
        let a = xs[k], b = xs[k + 1]
        sprig(&p, bow([a, 64], [(a + b) / 2, k == 1 ? 94 : 84], [b, 64], steps: 6), leaves: 5, size: 6)
      }
      flower(&p, CX, 104, 8, gilt: true)
      ground(&p, 206)

    case 5:
      // five staves clashing in a mock fight
      let clash: [[Double]] = [
        [24, 204, 150, 56], [164, 212, 36, 70], [60, 226, 118, 32], [16, 134, 172, 104], [136, 224, 78, 30],
      ]
      for c in clash { wand(&p, c[0], c[1], c[2], c[3], w: 1.9) }
      p.fillDiamond(97, 124, 6, 8, .gold)

    case 6:
      // six staves; one raised above the rest, wreathed in laurel
      let xs = [22.0, 50, 78, 108, 136, 164]
      for (k, x) in xs.enumerated() where k != 3 {
        wand(&p, x, 208, x, 104 + (k % 2 == 0 ? 0 : 8), w: 1.8)
      }
      wand(&p, 108, 208, 108, 42, w: 2.3, leaves: 2, bud: .gold)
      wreath(&p, 108, 66, 13)
      ground(&p, 208)

    case 7:
      // one staff held on the high ground against six rising from below
      p.smooth([[10, 128], [48, 110], [100, 104], [150, 112], [176, 128]], closed: false, w: 1.6)
      p.hatch(12, 112, W - 24, 14, gap: 6, angle: -1.1, w: 0.55)
      for x in [22.0, 48, 74, 112, 138, 164] {
        let hx = x + (CX - x) * 0.16
        wand(&p, x, 240, hx, 142 + abs(x - CX) * 0.1, w: 1.7)
      }
      wand(&p, 36, 96, 152, 40, w: 2.3, leaves: 2, bud: .gold)

    case 8:
      // eight staves in flight, falling toward the fields
      let d = [cos(0.52), sin(0.52)], across = [-sin(0.52), cos(0.52)]
      for k in 0..<8 {
        let o = (Double(k) - 3.5) * 13
        let c = [CX + across[0] * o, 106 + across[1] * o]
        wand(
          &p, c[0] - d[0] * 60, c[1] - d[1] * 60, c[0] + d[0] * 60, c[1] + d[1] * 60, w: 1.7,
          bud: k == 7 ? .gold : .ink)
      }
      p.smooth([[10, 208], [48, 198], [96, 206], [140, 194], [176, 202]], closed: false, w: 1.3)
      p.smooth([[70, 236], [84, 222], [96, 212], [104, 206]], closed: false, w: 1.0)
      p.smooth([[100, 236], [104, 222], [108, 212], [110, 205]], closed: false, w: 1.0)

    case 9:
      // eight staves stood like a fence; the ninth held, leant on
      for k in 0..<8 {
        let x = 20 + Double(k) * 20.8
        wand(&p, x, 194, x, 50 + Double(k % 3) * 6, w: 1.6)
      }
      ground(&p, 194, depth: 0)
      p.hatch(12, 196, W - 24, 12, gap: 6, angle: -1.1, w: 0.55)
      wand(&p, 70, 228, 118, 64, w: 2.7, leaves: 2, bud: .gold)
      p.line(12, 228, W - 12, 228, w: 1.4)

    case 10:
      // ten staves bundled and carried, bowed under their weight
      let foot = [58.0, 222.0]
      for k in 0..<10 {
        let a = -1.42 + Double(k) / 9 * 0.62
        let f = [foot[0] + Double(k - 5) * 1.4, foot[1] + Double(k - 5) * 0.8]
        wand(&p, f[0], f[1], f[0] + cos(a) * 160, f[1] + sin(a) * 160, w: 1.6)
      }
      let m = -1.11, t = 44.0
      let c = [foot[0] + cos(m) * t, foot[1] + sin(m) * t]
      let u = [cos(m), sin(m)], v = [-sin(m), cos(m)]
      p.fillPoly(
        [
          [c[0] - v[0] * 17 - u[0] * 4, c[1] - v[1] * 17 - u[1] * 4], [c[0] + v[0] * 17 - u[0] * 4, c[1] + v[1] * 17 - u[1] * 4],
          [c[0] + v[0] * 17 + u[0] * 4, c[1] + v[1] * 17 + u[1] * 4], [c[0] - v[0] * 17 + u[0] * 4, c[1] - v[1] * 17 + u[1] * 4],
        ], .gold, amp: 0.4)
      p.poly([[150, 222], [150, 204], [158, 196], [166, 204], [166, 222]], w: 1.1, amp: 0.3, closed: false)
      ground(&p, 222, depth: 16)

    default: break
    }
  }

  // ===================================================================
  //  Swords — held, hung, laid down, and stood in the ground
  // ===================================================================

  private static func swords(_ p: inout Pen, _ n: Int) {
    switch n {
    case 1:
      // one sword upright through a crown, a sprig hung from either side
      bigSword(&p, [CX, 176], [CX, 24])
      p.fillPoly(
        [[CX - 20, 76], [CX - 21, 60], [CX - 10, 68], [CX, 54], [CX + 10, 68], [CX + 21, 60], [CX + 20, 76]],
        .gold, amp: 0.5)
      for side in [-1.0, 1.0] {
        sprig(&p, [[CX + side * 20, 72], [CX + side * 34, 86], [CX + side * 40, 108], [CX + side * 36, 132]], leaves: 5)
      }
      p.line(12, 224, W - 12, 224, w: 1.5)
      p.hatch(12, 226, W - 24, 16, gap: 6, angle: -1.1, w: 0.7)

    case 2:
      // eyes closed between two crossed swords; the moon over the sea
      p.crescent(152, 34, 12, bite: 8)
      straight(&p, [52, 186], [146, 46], w: 1.7, guardW: 8)
      straight(&p, [134, 186], [40, 46], w: 1.7, guardW: 8)
      p.smooth([[76, 88], [84, 94], [93, 96], [102, 94], [110, 88]], closed: false, w: 1.6)
      for k in 0..<5 {
        let x = 80 + Double(k) * 6.5
        let y = 88 + 8 - abs(Double(k) - 2) * 2.2
        p.line(x, y, x - 1 + Double(k - 2) * 0.8, y + 5, w: 0.9, amp: 0.1)
      }
      p.ripples(W, 210, count: 3, gap: 9)

    case 3:
      // a heart, pierced three times, under the rain
      rain(&p, 20, W - 20, 64, 3)
      p.fillSmooth(heart(CX, 130, 84), .gold)
      straight(&p, [CX, 222], [CX, 46], w: 1.7, guardW: 9)
      straight(&p, [40, 208], [136, 60], w: 1.7, guardW: 9)
      straight(&p, [146, 208], [50, 60], w: 1.7, guardW: 9)
      cloud(&p, CX, 40, 82)

    case 4:
      // at rest: three swords hung over the tomb, the fourth laid along it
      for x in [52.0, CX, 134] { straight(&p, [x, 34], [x, 126], w: 1.6, guardW: 7) }
      straight(&p, [30, 160], [158, 160], w: 1.6, guardW: 6)
      p.line(18, 170, W - 18, 170, w: 1.9)
      p.poly([[24, 170], [W - 24, 170], [W - 24, 208], [24, 208]], w: 1.5, amp: 0.6)
      p.poly([[42, 179], [W - 42, 179], [W - 42, 199], [42, 199]], w: 0.9, amp: 0.4)
      p.fillDiamond(CX, 189, 5, 6.5, .gold)
      ground(&p, 208, depth: 16)

    case 5:
      // the field emptied: three swords taken up, two left lying
      for k in 0..<3 {
        let wy = 40.0 + Double(k) * 10
        wind(&p, 16 + Double(k) * 6, 84 - Double(k) * 4, wy)
      }
      let tips: [[Double]] = [[104, 44], [126, 36], [148, 48]]
      for (k, t) in tips.enumerated() {
        straight(&p, [122 + Double(k) * 6, 176 - Double(k % 2) * 4], t, w: 1.6, guardW: 7)
      }
      p.fillDiamond(128, 196, 4.5, 6, .gold)
      straight(&p, [18, 206], [92, 200], w: 1.5, guardW: 6)
      straight(&p, [88, 216], [22, 220], w: 1.5, guardW: 6)
      p.line(12, 226, W - 12, 226, w: 1.4)

    case 6:
      // six swords stood in the boat, crossing to calmer water
      p.line(104, 58, W - 12, 58, w: 1.0)
      p.smooth([[104, 58], [118, 50], [132, 58]], closed: false, w: 0.9)
      p.fillChord((0...8).map { i in
        let a = .pi + Double(i) / 8 * .pi
        return [154 + cos(a) * 9, 58 + sin(a) * 9]
      }, .gold)
      for (k, x) in [56.0, 70, 84, 100, 114, 128].enumerated() {
        straight(&p, [x, 94 + Double(k % 2) * 6], [x, 176], w: 1.4, guardW: 5)
      }
      let hull: [[Double]] = [[30, 164], [W - 30, 164], [148, 180], [126, 192], [93, 196], [60, 192], [38, 180]]
      p.fillSmooth(hull, .paper, outline: false)
      p.smooth(hull, w: 1.6)
      p.line(152, 222, 140, 70, w: 1.4, amp: 0.4)
      for i in 0..<3 {
        let y = 204 + Double(i) * 9
        var zig: [[Double]] = []
        var x = 14.0
        while x <= 76 {
          zig.append([x, y + (Int(x) / 8 % 2 == 0 ? 0 : -3.5)])
          x += 8
        }
        p.poly(zig, w: 0.9, amp: 0.3, closed: false)
        p.smooth([[104, y], [128, y + 1.5], [150, y], [172, y + 1]], closed: false, w: 0.9)
      }

    case 7:
      // five swords carried off at a run; two left standing behind
      straight(&p, [30, 124], [30, 204], w: 1.5, guardW: 6)
      straight(&p, [54, 132], [54, 204], w: 1.5, guardW: 6)
      let tips: [[Double]] = [[64, 44], [82, 34], [102, 30], [120, 36], [74, 64]]
      for (k, t) in tips.enumerated() {
        straight(&p, [134 + Double(k) * 3.5, 154 - Double(k) * 2], t, w: 1.4, guardW: 6)
      }
      p.fillDiamond(146, 166, 4.5, 6, .gold)
      p.line(12, 204, W - 12, 204, w: 1.4)
      for k in 0..<6 {
        p.dot(84 + Double(k) * 15, 214 + Double(k % 2) * 5, 1.7, c: .ink)
      }

    case 8:
      // eight swords fenced round an empty place, the way out open in front
      var ring: [[Double]] = []
      for k in 1..<9 {
        let a = .pi / 2 + Double(k) / 9 * .pi * 2
        ring.append([CX + cos(a) * 68, 192 + sin(a) * 24])
      }
      for q in ring.sorted(by: { $0[1] < $1[1] }) {
        straight(&p, [q[0], q[1] - 96], [q[0], q[1]], w: 1.5, guardW: 6)
      }
      p.fillDiamond(CX, 176, 6, 8, .gold)
      p.line(CX - 10, 214, CX - 18, 240, w: 0.9, amp: 0.3)
      p.line(CX + 10, 214, CX + 18, 240, w: 0.9, amp: 0.3)

    case 9:
      // nine swords laid along the dark; the bed beneath
      for k in 0..<9 {
        let y = 32 + Double(k) * 14.5
        if k % 2 == 0 {
          straight(&p, [30, y], [164, y], w: 1.4, guardW: 5)
        } else {
          straight(&p, [156, y], [22, y], w: 1.4, guardW: 5)
        }
      }
      p.poly([[18, 214], [18, 166], [30, 166], [30, 214]], w: 1.4, amp: 0.4)
      p.poly([[30, 184], [168, 184], [168, 204], [30, 204]], w: 1.3, amp: 0.5)
      for k in 0..<6 {
        p.diamond(46 + Double(k) * 22, 194, 4, 5, w: 0.8, c: .ink)
      }
      flower(&p, 101, 194, 6, gilt: true)
      p.line(166, 204, 166, 214, w: 1.3, amp: 0.2)
      p.line(12, 214, W - 12, 214, w: 1.4)

    case 10:
      // ten swords in the fallen; behind them, the dawn
      p.hatch(12, 16, W - 24, 92, gap: 5.5, angle: -0.8, w: 0.5)
      p.fillPoly([[12, 146], [W - 12, 146], [W - 12, 154], [12, 154]], .gold, amp: 0.4)
      p.line(12, 154, W - 12, 154, w: 1.2)
      p.ripples(W, 164, count: 2, gap: 8)
      for k in 0..<10 {
        let x = 24 + Double(k) * 15.3
        straight(&p, [x, 104 + Double(k % 2) * 6], [x, 198], w: 1.4, guardW: 5)
      }
      p.smooth([[14, 208], [38, 196], [80, 194], [124, 196], [160, 198], [172, 208]], closed: false, w: 1.9)
      ground(&p, 214, depth: 16)

    default: break
    }
  }

  // ===================================================================
  //  Pentacles — kept, carved, weighed, grown and handed down
  // ===================================================================

  private static func pentacles(_ p: inout Pen, _ n: Int) {
    switch n {
    case 1:
      // one pentacle in leaf, over the hedged gate of a garden
      pentacle(&p, CX, 84, 48, gilt: true)
      p.ticks(CX, 84, 52, 5, 36)
      let c = [CX, 178.0]
      for rad in [34.0, 46] {
        var arch: [[Double]] = [[c[0] - rad, 228]]
        for i in 0...10 {
          let a = .pi + Double(i) / 10 * .pi
          arch.append([c[0] + cos(a) * rad, c[1] + sin(a) * rad])
        }
        arch.append([c[0] + rad, 228])
        p.smooth(arch, closed: false, w: rad > 40 ? 1.6 : 1.1)
      }
      for i in 0..<13 {
        let a = .pi + (Double(i) + 0.5) / 13 * .pi
        p.line(
          c[0] + cos(a) * 36, c[1] + sin(a) * 36, c[0] + cos(a + 0.1) * 44, c[1] + sin(a + 0.1) * 44,
          w: 0.8, amp: 0.3)
      }
      for side in [-1.0, 1.0] {
        for k in 0..<4 {
          let y = 186 + Double(k) * 11
          p.line(c[0] + side * 36, y, c[0] + side * 44, y - 6, w: 0.8, amp: 0.3)
        }
      }
      p.line(CX - 13, 228, CX - 3, 190, w: 0.9, amp: 0.4)
      p.line(CX + 13, 228, CX + 3, 190, w: 0.9, amp: 0.4)
      p.line(10, 228, W - 10, 228, w: 1.4)

    case 2:
      // two pentacles kept moving in an endless loop, over high seas
      for a in [88.0, 80] {
        p.smooth((0..<36).map { i in
          let t = Double(i) / 36 * .pi * 2
          let d = 1 + sin(t) * sin(t)
          return [CX + a * sin(t) * cos(t) / d, 108 + a * cos(t) / d]
        }, w: a > 84 ? 1.5 : 0.9)
      }
      pentacle(&p, CX, 68, 21, gilt: true)
      pentacle(&p, CX, 148, 21, gilt: true)
      for (i, y) in [212.0, 224].enumerated() {
        let crest = 8 - Double(i) * 3
        let wave: [[Double]] = (0...8).map { k -> [Double] in
          let lift: Double = k % 2 == 0 ? 0 : crest
          return [12 + Double(k) * 20.25, y - lift]
        }
        p.smooth(wave, closed: false, w: CGFloat(1.2 - Double(i) * 0.2))
      }
      ship(&p, 52, 202, 6)
      ship(&p, 140, 204, 5)

    case 3:
      // three pentacles carved in a pointed arch; the mason's bench below
      for inset in [0.0, 9] {
        let l: [[Double]] = [
          [30 + inset, 228], [30 + inset, 150], [33 + inset, 112], [46 + inset * 0.8, 74], [66 + inset * 0.5, 44],
          [CX, 24 + inset * 1.4],
        ]
        p.smooth(l, closed: false, w: inset == 0 ? 1.7 : 1.0)
        p.smooth(l.map { [W - $0[0], $0[1]] }, closed: false, w: inset == 0 ? 1.7 : 1.0)
      }
      pentacle(&p, CX, 70, 17, gilt: true)
      pentacle(&p, 67, 116, 17)
      pentacle(&p, 119, 116, 17)
      p.line(46, 186, 140, 186, w: 1.8)
      for x in [56.0, 130] {
        p.line(x - 7, 214, x, 186, w: 1.2, amp: 0.3)
        p.line(x + 7, 214, x, 186, w: 1.2, amp: 0.3)
      }
      p.line(12, 228, W - 12, 228, w: 1.4)

    case 4:
      // four pentacles held tight: one worn, one clutched, two stood on
      var city: [[Double]] = [[12, 158]]
      let blocks: [[Double]] = [[12, 136], [28, 124], [40, 140], [52, 118], [66, 132], [120, 128], [134, 114], [148, 134], [162, 122], [W - 12, 138]]
      for (k, b) in blocks.enumerated() {
        let x1 = k + 1 < blocks.count ? blocks[k + 1][0] : W - 12
        city += [[b[0], b[1]], [x1, b[1]]]
      }
      city.append([W - 12, 158])
      p.poly(city, w: 1.0, amp: 0.3, closed: false)
      p.line(12, 158, W - 12, 158, w: 1.0, amp: 0.3)
      pentacle(&p, CX, 38, 17)
      pentacle(&p, CX, 108, 25, gilt: true)
      for side in [-1.0, 1.0] {
        p.smooth([[CX + side * 30, 78], [CX + side * 38, 104], [CX + side * 30, 128], [CX + side * 8, 140]], closed: false, w: 1.6)
      }
      pentacle(&p, 60, 194, 17)
      pentacle(&p, 126, 194, 17)
      p.line(12, 214, W - 12, 214, w: 1.4)

    case 5:
      // five pentacles in a lit window; outside, the snow
      for inset in [0.0, 7] {
        var win: [[Double]] = [[46 + inset, 172]]
        for i in 0...10 {
          let a = .pi + Double(i) / 10 * .pi
          win.append([CX + cos(a) * (47 - inset), 70 + sin(a) * (44 - inset)])
        }
        win.append([W - 46 - inset, 172])
        p.smooth(win, closed: false, w: inset == 0 ? 1.7 : 1.0)
      }
      p.line(38, 172, W - 38, 172, w: 1.8)
      p.line(CX, 34, CX, 165, w: 0.7, amp: 0.3)
      p.line(53, 118, W - 53, 118, w: 0.7, amp: 0.3)
      pentacle(&p, 72, 88, 13)
      pentacle(&p, 114, 88, 13)
      pentacle(&p, CX, 118, 14, gilt: true)
      pentacle(&p, 72, 148, 13)
      pentacle(&p, 114, 148, 13)
      let snow: [[Double]] = [
        [20, 40], [30, 74], [18, 112], [34, 142], [22, 184], [164, 36], [172, 78], [158, 110], [170, 150], [160, 188],
        [60, 190], [120, 196], [90, 188], [40, 30], [150, 60],
      ]
      for q in snow { p.dot(q[0], q[1], 1.5, c: .ink) }
      p.line(12, 206, W - 12, 206, w: 1.3)
      for k in 0..<7 { p.dot(28 + Double(k) * 21, 216 + Double(k % 2) * 5, 1.6, c: .ink) }

    case 6:
      // six pentacles, and the scale they are given out by
      for y in [48.0, 92] {
        for x in [50.0, CX, 136] { pentacle(&p, x, y, 16) }
      }
      p.line(CX, 132, CX, 204, w: 1.9)
      p.line(CX - 16, 204, CX + 16, 204, w: 1.9)
      p.line(44, 132, 142, 132, w: 1.8)
      for side in [-1.0, 1.0] {
        let x = CX + side * 49
        p.line(x, 132, x - 11, 160, w: 0.9, amp: 0.2)
        p.line(x, 132, x + 11, 160, w: 0.9, amp: 0.2)
        p.smooth([[x - 15, 160], [x, 170], [x + 15, 160]], closed: false, w: 1.5)
        p.line(x - 15, 160, x + 15, 160, w: 1.0, amp: 0.2)
      }
      p.fillDiamond(CX, 132, 6.5, 8.5, .gold)
      ground(&p, 208, depth: 16)

    case 7:
      // seven pentacles ripening on the vine; the hoe leant beside it
      let fruit: [[Double]] = [[56, 56], [104, 46], [60, 108], [112, 98], [140, 142], [82, 156], [44, 168]]
      p.smooth([[80, 214], [76, 180], [86, 140], [80, 100], [84, 60], [78, 30]], closed: false, w: 1.7)
      for (k, f) in fruit.enumerated() {
        let stem = [82.0, f[1] + 12]
        p.smooth([stem, [(stem[0] + f[0]) / 2, stem[1] - 4], [f[0], f[1] + 15]], closed: false, w: 1.0)
        pentacle(&p, f[0], f[1], 15, gilt: k == 5)
      }
      for q in [[70.0, 130.0], [92, 76], [96, 186], [70, 40]] {
        leaf(&p, [80, q[1] + 6], [q[0] + (q[0] < 80 ? -4 : 8), q[1]], width: 2.8)
      }
      p.line(164, 214, 150, 44, w: 1.8)
      p.poly([[154, 208], [172, 204], [173, 212], [155, 216]], w: 1.2, amp: 0.3)
      ground(&p, 214, depth: 16)

    case 8:
      // six pentacles finished on the post; one on the bench, being made
      p.line(40, 222, 40, 24, w: 2.3)
      for k in 0..<6 { pentacle(&p, 40, 40 + Double(k) * 30, 13) }
      p.line(80, 168, 172, 168, w: 2.0)
      p.line(88, 168, 88, 214, w: 1.4)
      p.line(164, 168, 164, 214, w: 1.4)
      pentacle(&p, 124, 150, 16, gilt: true)
      p.line(148, 128, 138, 138, w: 1.6, amp: 0.2)
      p.line(150, 124, 162, 110, w: 1.2, amp: 0.2)
      p.poly([[156, 104], [168, 104], [168, 114], [156, 114]], w: 1.2, amp: 0.2)
      pentacle(&p, 116, 203, 10)
      ground(&p, 214, depth: 14)

    case 9:
      // nine pentacles in a walled garden, on the vines
      for side in [-1.0, 1.0] {
        let vine: [[Double]] = [[CX + side * 70, 206], [CX + side * 76, 150], [CX + side * 66, 90], [CX + side * 40, 44], [CX, 30]]
        sprig(&p, vine, leaves: 7, size: 7)
        grapes(&p, CX + side * 74, 104)
        grapes(&p, CX + side * 54, 52)
      }
      for (r, y) in [70.0, 118, 166].enumerated() {
        for (k, x) in [58.0, CX, 128].enumerated() { pentacle(&p, x, y, 14, gilt: r == 1 && k == 1) }
      }
      p.line(12, 206, W - 12, 206, w: 1.5)
      p.hatch(12, 208, W - 24, 18, gap: 7, angle: 0, w: 0.6)
      for x in stride(from: 24.0, to: W - 12, by: 22) { p.line(x, 208, x, 226, w: 0.6, amp: 0.2) }

    case 10:
      // ten pentacles on the tree of life, the paths drawn between them
      let tree: [[Double]] = [
        [CX, 30], [138, 60], [48, 60], [138, 112], [48, 112], [CX, 136], [138, 168], [48, 168], [CX, 190], [CX, 226],
      ]
      let paths = [
        (0, 1), (0, 2), (0, 5), (1, 2), (1, 5), (2, 5), (1, 3), (2, 4), (3, 4), (3, 5), (4, 5),
        (3, 6), (4, 7), (5, 6), (5, 7), (5, 8), (6, 7), (6, 8), (7, 8), (6, 9), (7, 9), (8, 9),
      ]
      let r = 13.0
      for (i, j) in paths {
        let a = tree[i], b = tree[j]
        let dx = b[0] - a[0], dy = b[1] - a[1], l = max(hypot(dx, dy), 0.001)
        p.line(a[0] + dx / l * r, a[1] + dy / l * r, b[0] - dx / l * r, b[1] - dy / l * r, w: 0.8, amp: 0.3)
      }
      for (k, q) in tree.enumerated() { pentacle(&p, q[0], q[1], r, gilt: k == 9) }

    default: break
    }
  }

  // ===================================================================
  //  The courts
  // ===================================================================

  private static func emblem(_ p: inout Pen, _ suit: Suit, _ o: Spot, gilt: Bool = false) {
    switch suit {
    case .cups: cup(&p, o, full: gilt)
    case .wands:
      wand(&p, o.x, o.y + o.s * 0.6, o.x, o.y - o.s * 0.5, w: 2.6, leaves: 5, bud: gilt ? .gold : .ink, leaf: 1.5)
    case .swords:
      bigSword(&p, [o.x, o.y + o.s * 0.3], [o.x, o.y - o.s * 0.62], half: 6, guardW: o.s * 0.24)
      if gilt { p.fillDiamond(o.x, o.y + o.s * 0.3, 4.5, 6, .gold) }
    case .pentacles: pentacle(&p, o.x, o.y, o.s * 0.36, gilt: gilt)
    }
  }

  private static func court(_ p: inout Pen, _ suit: Suit, _ rank: Court) {
    switch rank {
    case .page:
      // on the ground, looking at the thing it was given
      p.fillDiamond(CX, 30, 4, 5.5)
      switch suit {
      case .cups:
        cup(&p, Spot(x: CX, y: 150, s: 100)) { p in
          p.fillSmooth([[CX, 46], [CX + 10, 70], [CX + 7, 94], [CX, 104], [CX - 7, 94], [CX - 10, 70]], .gold)
          p.line(CX, 102, CX - 9, 114, w: 1.2, amp: 0.3)
          p.line(CX, 102, CX + 9, 114, w: 1.2, amp: 0.3)
          p.dot(CX - 3, 62, 1.6, c: .ink)
        }
        ground(&p, 210, depth: 22)
      case .wands:
        pyramid(&p, 36, 210, 22)
        pyramid(&p, 62, 210, 14)
        pyramid(&p, 150, 210, 19)
        emblem(&p, .wands, Spot(x: CX, y: 124, s: 116), gilt: true)
        ground(&p, 210, depth: 22)
      case .swords:
        wind(&p, 18, 62, 58)
        wind(&p, 26, 70, 70)
        wind(&p, 120, 166, 64)
        bird(&p, 40, 40, 7)
        bird(&p, 148, 42, 6)
        bird(&p, 134, 30, 4.5)
        emblem(&p, .swords, Spot(x: CX, y: 136, s: 118), gilt: true)
        ground(&p, 210, depth: 22)
      case .pentacles:
        emblem(&p, .pentacles, Spot(x: CX, y: 110, s: 100), gilt: true)
        p.line(34, 186, 32, 148, w: 1.4, amp: 0.3)
        for q in [[20.0, 150.0], [44, 146], [24, 166], [44, 164], [32, 136]] {
          leaf(&p, [32, q[1] + 8], q, width: 2.6)
        }
        for i in 0..<5 {
          let y = 184 + Double(i) * 10
          var pts: [[Double]] = []
          for k in 0...8 {
            let t = Double(k) / 8
            pts.append([12 + t * (W - 24), y - cos(t * .pi) * (6 - Double(i))])
          }
          p.smooth(pts, closed: false, w: 1.2)
        }
      }

    case .knight:
      // carried along the road
      switch suit {
      case .cups:
        for side in [-1.0, 1.0] {
          for k in 0..<3 {
            let d = Double(k)
            p.smooth(
              [
                [CX + side * 34, 72 + d * 9], [CX + side * (54 + d * 4), 60 + d * 7],
                [CX + side * (74 - d * 6), 52 + d * 10],
              ], closed: false, w: 1.3 - d * 0.2)
          }
        }
        emblem(&p, .cups, Spot(x: CX, y: 108, s: 96), gilt: true)
      case .wands:
        for k in 0..<4 {
          let y = 96 + Double(k) * 16
          p.line(14 + Double(k % 2) * 8, y + 10, 44 + Double(k % 2) * 6, y, w: 1.1 - Double(k) * 0.1, amp: 0.4)
        }
        wand(&p, 44, 170, 146, 42, w: 2.6, leaves: 4, bud: .gold, leaf: 1.4)
      case .swords:
        for k in 0..<4 {
          wind(&p, 14, 70 - Double(k) * 6, 78 + Double(k) * 14, w: 1.1 - Double(k) * 0.1)
        }
        bigSword(&p, [62, 164], [148, 38], half: 6, guardW: 20)
        p.fillDiamond(62, 164, 4.5, 6, .gold)
      case .pentacles:
        emblem(&p, .pentacles, Spot(x: CX, y: 104, s: 112), gilt: true)
      }
      if suit == .pentacles {
        // the knight who does not hurry: straight furrows, not the road
        for i in 0..<4 {
          let y = 178 + Double(i) * 12
          p.line(18 + Double(i) * 3, y, W - 18 - Double(i) * 3, y, w: 1.5 - Double(i) * 0.2, amp: 0.5)
        }
      } else {
        for i in 0..<3 {
          let y = 180 + Double(i) * 12
          p.smooth([[22, y - 7], [CX, y + 5], [W - 22, y - 7]], closed: false, w: 1.5 - Double(i) * 0.25)
        }
      }

    case .queen:
      // held in the ring
      p.ring(CX, 112, 66, w: 1.4, amp: 1.5, segs: 28)
      p.fillDiamond(CX - 78, 112, 4, 5.5)
      p.fillDiamond(CX + 78, 112, 4, 5.5)
      switch suit {
      case .cups:
        cup(&p, Spot(x: CX, y: 124, s: 86), lid: true)
        p.ripples(W, 196, count: 3, gap: 9)
      case .wands:
        emblem(&p, .wands, Spot(x: CX + 14, y: 112, s: 96))
        sunflower(&p, CX - 26, 96, 15)
        ground(&p, 204, depth: 22)
      case .swords:
        bird(&p, CX, 32, 8)
        emblem(&p, .swords, Spot(x: CX, y: 118, s: 100), gilt: true)
        cloud(&p, CX, 196, 72)
      case .pentacles:
        for k in 0..<5 {
          let a = -.pi / 2 + (Double(k) - 2) * 0.42
          flower(&p, CX + cos(a) * 66, 112 + sin(a) * 66, 7)
        }
        emblem(&p, .pentacles, Spot(x: CX, y: 116, s: 92), gilt: true)
        ground(&p, 204, depth: 22)
      }

    case .king:
      // on the squared seat, crowned
      p.poly([[CX - 58, 58], [CX + 58, 58], [CX + 58, 172], [CX - 58, 172]], w: 1.8, amp: 1.2)
      p.poly([[CX - 48, 68], [CX + 48, 68], [CX + 48, 162], [CX - 48, 162]], w: 1.0, amp: 1.0)
      p.fillPoly(
        [[CX - 17, 48], [CX - 18, 30], [CX - 8, 39], [CX, 24], [CX + 8, 39], [CX + 18, 30], [CX + 17, 48]],
        .gold, amp: 0.5)
      switch suit {
      case .cups:
        emblem(&p, .cups, Spot(x: CX, y: 116, s: 80))
        p.ripples(W, 190, count: 4, gap: 9)
      case .wands:
        emblem(&p, .wands, Spot(x: CX, y: 118, s: 92))
        ground(&p, 190, depth: 30)
      case .swords:
        butterfly(&p, CX - 58, 56, 7)
        butterfly(&p, CX + 58, 56, 7)
        emblem(&p, .swords, Spot(x: CX, y: 124, s: 96))
        ground(&p, 190, depth: 30)
      case .pentacles:
        for side in [-1.0, 1.0] {
          p.smooth([[CX + side * 58, 58], [CX + side * 70, 50], [CX + side * 72, 36]], closed: false, w: 1.5)
          grapes(&p, CX + side * 44, 74, 2.8)
        }
        emblem(&p, .pentacles, Spot(x: CX, y: 124, s: 88))
        ground(&p, 190, depth: 30)
      }
    }
  }
}
