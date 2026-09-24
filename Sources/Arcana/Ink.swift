import SwiftUI

// ===================================================================
//  Ink — a pen that draws like a hand, not a plotter.
//
//  Every stroke is bowed and every vertex nudged by a seeded generator,
//  so a card is identical each time it is drawn but never mechanical.
// ===================================================================

struct Rng {
  private var s: UInt32
  init(_ seed: UInt32) { s = seed == 0 ? 1 : seed }

  mutating func next() -> Double {
    s = s &+ 0x6D2B_79F5
    var t = s
    t = (t ^ (t >> 15)) &* (t | 1)
    t ^= t &+ ((t ^ (t >> 7)) &* (t | 61))
    return Double(t ^ (t >> 14)) / 4_294_967_296.0
  }

  /// Signed jitter in ±amp.
  mutating func sym(_ amp: Double) -> Double { (next() * 2 - 1) * amp }
}

func seedHash(_ str: String) -> UInt32 {
  var h: UInt32 = 2_166_136_261
  for b in str.utf8 {
    h ^= UInt32(b)
    h = h &* 16_777_619
  }
  return h
}

enum InkColor { case ink, accent, gold, paper }

struct Mark {
  var path: Path
  var stroke: InkColor?
  var width: CGFloat = 1.5
  var fill: InkColor?
}

@inline(__always) private func p(_ x: Double, _ y: Double) -> CGPoint { CGPoint(x: x, y: y) }

// --- curve helpers -------------------------------------------------

/// Catmull-Rom through the points. Rounded — for circles and organic forms.
private func smoothPath(_ pts: [CGPoint], closed: Bool) -> Path {
  var path = Path()
  guard pts.count > 2 else {
    if let f = pts.first { path.move(to: f) }
    if pts.count == 2 { path.addLine(to: pts[1]) }
    return path
  }
  let n = pts.count
  path.move(to: pts[0])
  let last = closed ? n : n - 1
  for i in 0..<last {
    let p0 = pts[closed ? (i - 1 + n) % n : max(i - 1, 0)]
    let p1 = pts[i]
    let p2 = pts[closed ? (i + 1) % n : min(i + 1, n - 1)]
    let p3 = pts[closed ? (i + 2) % n : min(i + 2, n - 1)]
    path.addCurve(
      to: p2,
      control1: p(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6),
      control2: p(p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6))
  }
  if closed { path.closeSubpath() }
  return path
}

// ===================================================================
//  Pen
// ===================================================================

struct Pen {
  var r: Rng
  var marks: [Mark] = []

  init(seed: UInt32) { r = Rng(seed) }

  // --- single strokes ---------------------------------------------

  private mutating func bowed(
    _ x1: Double, _ y1: Double, _ x2: Double, _ y2: Double, _ amp: Double
  ) -> Path {
    let dx = x2 - x1, dy = y2 - y1
    let len = max(hypot(dx, dy), 0.0001)
    let nx = -dy / len, ny = dx / len
    let o1 = r.sym(amp), o2 = r.sym(amp)
    var path = Path()
    path.move(to: p(x1 + r.sym(amp * 0.4), y1 + r.sym(amp * 0.4)))
    path.addCurve(
      to: p(x2 + r.sym(amp * 0.4), y2 + r.sym(amp * 0.4)),
      control1: p(x1 + dx * 0.33 + nx * o1, y1 + dy * 0.33 + ny * o1),
      control2: p(x1 + dx * 0.66 + nx * o2, y1 + dy * 0.66 + ny * o2))
    return path
  }

  mutating func line(
    _ x1: Double, _ y1: Double, _ x2: Double, _ y2: Double,
    w: CGFloat = 1.5, c: InkColor = .ink, amp: Double = 1.1
  ) {
    marks.append(Mark(path: bowed(x1, y1, x2, y2, amp), stroke: c, width: w))
  }

  // --- closed forms -----------------------------------------------

  mutating func ringPoints(
    _ cx: Double, _ cy: Double, _ rad: Double,
    amp: Double = 1.3, segs: Int = 22, squash: Double = 1
  ) -> [CGPoint] {
    (0..<segs).map { i in
      let a = Double(i) / Double(segs) * .pi * 2
      let rr = rad + r.sym(amp)
      return p(cx + cos(a) * rr, cy + sin(a) * rr * squash)
    }
  }

  mutating func ring(
    _ cx: Double, _ cy: Double, _ rad: Double,
    w: CGFloat = 1.5, c: InkColor = .ink,
    amp: Double = 1.3, segs: Int = 22, squash: Double = 1
  ) {
    let pts = ringPoints(cx, cy, rad, amp: amp, segs: segs, squash: squash)
    marks.append(Mark(path: smoothPath(pts, closed: true), stroke: c, width: w))
  }

  mutating func dot(_ cx: Double, _ cy: Double, _ rad: Double, c: InkColor = .gold) {
    let pts = ringPoints(cx, cy, rad, amp: 0.25, segs: 14)
    marks.append(
      Mark(
        path: smoothPath(pts, closed: true),
        stroke: c == .gold ? .ink : nil, width: 0.8, fill: c))
  }

  /// Straight-edged shape: vertices stay sharp, edges bow a hair.
  private mutating func sharpPath(_ pts: [[Double]], _ amp: Double, _ closed: Bool) -> Path {
    let v = pts.map { p($0[0] + r.sym(amp), $0[1] + r.sym(amp)) }
    var path = Path()
    guard let first = v.first else { return path }
    path.move(to: first)
    let last = closed ? v.count : v.count - 1
    for i in 0..<last {
      let a = v[i], b = v[(i + 1) % v.count]
      let dx = b.x - a.x, dy = b.y - a.y
      let len = max(hypot(dx, dy), 0.0001)
      let nx = -dy / len, ny = dx / len
      let o1 = r.sym(amp * 0.7), o2 = r.sym(amp * 0.7)
      path.addCurve(
        to: b,
        control1: p(a.x + dx * 0.33 + nx * o1, a.y + dy * 0.33 + ny * o1),
        control2: p(a.x + dx * 0.66 + nx * o2, a.y + dy * 0.66 + ny * o2))
    }
    if closed { path.closeSubpath() }
    return path
  }

  mutating func poly(
    _ pts: [[Double]], w: CGFloat = 1.5, c: InkColor = .ink,
    amp: Double = 1.1, closed: Bool = true
  ) {
    marks.append(Mark(path: sharpPath(pts, amp, closed), stroke: c, width: w))
  }

  mutating func fillPoly(_ pts: [[Double]], _ c: InkColor = .gold, amp: Double = 0.8) {
    marks.append(
      Mark(
        path: sharpPath(pts, amp, true),
        stroke: c == .gold ? .ink : nil, width: 0.8, fill: c))
  }

  mutating func smooth(
    _ pts: [[Double]], closed: Bool = true, w: CGFloat = 1.5, c: InkColor = .ink
  ) {
    marks.append(
      Mark(path: smoothPath(pts.map { p($0[0], $0[1]) }, closed: closed), stroke: c, width: w))
  }

  mutating func fillSmooth(_ pts: [[Double]], _ c: InkColor = .gold, outline: Bool = true) {
    marks.append(
      Mark(
        path: smoothPath(pts.map { p($0[0], $0[1]) }, closed: true),
        stroke: outline && c == .gold ? .ink : nil, width: 0.8, fill: c))
  }

  /// A curved edge closed with one straight chord — a half disc.
  mutating func fillChord(_ pts: [[Double]], _ c: InkColor) {
    var path = smoothPath(pts.map { p($0[0], $0[1]) }, closed: false)
    path.closeSubpath()
    marks.append(Mark(path: path, stroke: c == .gold ? .ink : nil, width: 0.8, fill: c))
  }

  mutating func fillSmoothPts(_ pts: [CGPoint], _ c: InkColor, outline: Bool = false) {
    marks.append(
      Mark(
        path: smoothPath(pts, closed: true),
        stroke: outline ? .ink : nil, width: 0.8, fill: c))
  }

  private func diamondPts(_ cx: Double, _ cy: Double, _ rx: Double, _ ry: Double) -> [[Double]] {
    [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]]
  }

  mutating func diamond(
    _ cx: Double, _ cy: Double, _ rx: Double, _ ry: Double? = nil,
    w: CGFloat = 1.1, c: InkColor = .accent, amp: Double = 1
  ) {
    poly(diamondPts(cx, cy, rx, ry ?? rx), w: w, c: c, amp: amp)
  }

  mutating func fillDiamond(
    _ cx: Double, _ cy: Double, _ rx: Double, _ ry: Double? = nil, _ c: InkColor = .accent
  ) {
    fillPoly(diamondPts(cx, cy, rx, ry ?? rx), c, amp: 0.6)
  }

  // --- textures ----------------------------------------------------

  mutating func rays(
    _ cx: Double, _ cy: Double, _ r0: Double, _ r1: Double, _ n: Int,
    w: CGFloat = 1.5, offset: Double = 0, c: InkColor = .ink
  ) {
    for i in 0..<n {
      let a = offset + Double(i) / Double(n) * .pi * 2
      let wob = 1 + r.sym(0.04)
      line(
        cx + cos(a) * r0, cy + sin(a) * r0,
        cx + cos(a) * r1 * wob, cy + sin(a) * r1 * wob,
        w: w, c: c, amp: 0.9)
    }
  }

  mutating func hatch(
    _ x: Double, _ y: Double, _ wd: Double, _ ht: Double,
    gap: Double = 5, angle: Double = -0.6, w: CGFloat = 0.75
  ) {
    let span = (abs(wd) + abs(ht)) * 1.4
    let dx = cos(angle), dy = sin(angle)
    let cx = x + wd / 2, cy = y + ht / 2
    let count = Int(ceil(span / gap))
    for i in (-count / 2)..<(count / 2) {
      let ox = cx - dy * Double(i) * gap
      let oy = cy + dx * Double(i) * gap
      var t0 = -span, t1 = span
      var dead = false
      func clip(_ pos: Double, _ d: Double, _ lo: Double, _ hi: Double) {
        if abs(d) < 1e-6 {
          if pos < lo || pos > hi { dead = true }
          return
        }
        var a = (lo - pos) / d, b = (hi - pos) / d
        if a > b { swap(&a, &b) }
        t0 = max(t0, a)
        t1 = min(t1, b)
      }
      clip(ox, dx, x, x + wd)
      clip(oy, dy, y, y + ht)
      if dead || t1 - t0 < 2 { continue }
      let j = r.sym(1.2)
      line(
        ox + dx * (t0 + 1), oy + dy * (t0 + 1),
        ox + dx * (t1 - 1) + j, oy + dy * (t1 - 1),
        w: w, c: .ink, amp: 0.5)
    }
  }

  mutating func ticks(
    _ cx: Double, _ cy: Double, _ rad: Double, _ len: Double, _ n: Int, w: CGFloat = 0.8
  ) {
    for i in 0..<n {
      let a = Double(i) / Double(n) * .pi * 2
      line(
        cx + cos(a) * rad, cy + sin(a) * rad,
        cx + cos(a) * (rad + len), cy + sin(a) * (rad + len),
        w: w, c: .ink, amp: 0.4)
    }
  }

  mutating func ripples(_ width: Double, _ y0: Double, count: Int = 4, gap: Double = 9) {
    for i in 0..<count {
      let y = y0 + Double(i) * gap
      let inset = 14 + Double(i) * 5
      var pts: [[Double]] = []
      for k in 0...8 {
        let x = inset + (width - inset * 2) * Double(k) / 8
        pts.append([x, y + sin(Double(k) * 1.6 + Double(i)) * 1.8 + r.sym(0.8)])
      }
      smooth(pts, closed: false, w: 1.1)
    }
  }

  /// A crescent: the disc of radius `r` less the same disc moved `bite`
  /// along x. Positive bite leaves the lit limb on the left.
  mutating func crescent(_ cx: Double, _ cy: Double, _ r: Double, bite: Double, c: InkColor = .gold) {
    let d = abs(bite), s = bite >= 0 ? 1.0 : -1.0
    guard d > 0.01, d < 2 * r else { return }
    let h = (r * r - d * d / 4).squareRoot()
    let a0 = atan2(-h, d / 2), a1 = atan2(h, d / 2)
    var pts: [[Double]] = []
    let n = 18
    // the outer limb, through the far side of the first disc
    for i in 0...n {
      let a = a0 - Double(i) / Double(n) * (2 * .pi - (a1 - a0))
      pts.append([cx + s * cos(a) * r, cy + sin(a) * r])
    }
    // the inner edge, along the near side of the bitten disc
    let b0 = atan2(h, -d / 2), b1 = atan2(-h, -d / 2) + 2 * .pi
    for i in 1..<n {
      let a = b0 + Double(i) / Double(n) * (b1 - b0)
      pts.append([cx + s * (d + cos(a) * r), cy + sin(a) * r])
    }
    fillPoly(pts, c, amp: 0.15)
  }

  mutating func eye(_ cx: Double, _ cy: Double, _ rx: Double, _ ry: Double) {
    fillPoly(
      [
        [cx - rx, cy], [cx - rx * 0.45, cy - ry], [cx + rx * 0.45, cy - ry],
        [cx + rx, cy], [cx + rx * 0.45, cy + ry], [cx - rx * 0.45, cy + ry],
      ], .gold, amp: 0.8)
    dot(cx, cy, ry * 0.52, c: .ink)
  }
}
