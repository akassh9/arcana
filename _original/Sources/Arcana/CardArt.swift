import SwiftUI

// ===================================================================
//  CardArt — twenty-two compositions, one frame, one reverse.
//  Art space is 186 × 248; the frame and back use 226 × 400.
// ===================================================================

enum ArtKind: String {
  case fool, magician, priestess, empress, emperor, hierophant, lovers, chariot
  case strength, hermit, wheel, justice, hanged, death, temperance, devil
  case tower, star, moon, sun, judgement, world
}

enum CardArt {
  static let artW = 186.0
  static let artH = 248.0
  static let cardW = 226.0
  static let cardH = 400.0

  private static let W = artW
  private static let CX = artW / 2
  private static let CY = artH / 2

  static func marks(_ kind: ArtKind) -> [Mark] {
    var pen = Pen(seed: seedHash(kind.rawValue) ^ 0x9E37_79B9)
    switch kind {
    case .fool: fool(&pen)
    case .magician: magician(&pen)
    case .priestess: priestess(&pen)
    case .empress: empress(&pen)
    case .emperor: emperor(&pen)
    case .hierophant: hierophant(&pen)
    case .lovers: lovers(&pen)
    case .chariot: chariot(&pen)
    case .strength: strength(&pen)
    case .hermit: hermit(&pen)
    case .wheel: wheel(&pen)
    case .justice: justice(&pen)
    case .hanged: hanged(&pen)
    case .death: death(&pen)
    case .temperance: temperance(&pen)
    case .devil: devil(&pen)
    case .tower: tower(&pen)
    case .star: star(&pen)
    case .moon: moon(&pen)
    case .sun: sun(&pen)
    case .judgement: judgement(&pen)
    case .world: world(&pen)
    }
    return pen.marks
  }

  // --- 0 · a step off the measured ledge ---------------------------
  private static func fool(_ p: inout Pen) {
    for i in 0..<5 {
      let x = 18 + Double(i) * 16, y = 92 + Double(i) * 22
      p.line(x, y, x + 16, y, w: 1.6)
      p.line(x + 16, y, x + 16, y + 22, w: 1.6)
    }
    p.hatch(18, 114, 80, 112, gap: 6, angle: -1.0, w: 0.6)
    p.ring(126, 74, 30, w: 1.5, amp: 1.4, segs: 24)
    p.rays(126, 74, 34, 46, 12, w: 0.9)
    p.dot(126, 74, 12)
    p.diamond(126, 74, 19, w: 1)
    p.line(100, 196, 168, 150, w: 1.4)
    p.fillDiamond(168, 150, 5)
  }

  // --- I · the radiant eye, compass of will -----------------------
  private static func magician(_ p: inout Pen) {
    p.rays(CX, CY, 6, 108, 18, w: 1.6)
    p.ring(CX, CY, 46, w: 1.6, amp: 1.6, segs: 26)
    p.diamond(CX, CY, 52, w: 1.1)
    p.eye(CX, CY, 25, 11)
  }

  // --- II · the sealed door between pillars -----------------------
  private static func priestess(_ p: inout Pen) {
    for x in [38.0, W - 38] {
      p.line(x, 46, x, 208, w: 2.6)
      p.poly([[x - 12, 38], [x + 12, 38], [x + 12, 48], [x - 12, 48]], w: 1.5, amp: 0.8)
      p.poly([[x - 14, 206], [x + 14, 206], [x + 14, 216], [x - 14, 216]], w: 1.5, amp: 0.8)
    }
    p.poly([[48, 56], [W - 48, 56], [W - 48, 204], [48, 204]], w: 1.4, amp: 1)
    p.hatch(50, 58, W - 100, 144, gap: 5, angle: 1.45, w: 0.7)
    p.line(48, 56, W - 48, 56, w: 1.8)
    for d in [[CX, 84], [CX - 20, 106], [CX + 20, 106], [CX, 128]] {
      p.diamond(d[0], d[1], 6, 8, w: 1)
    }
    p.fillDiamond(CX, 106, 9, 12, .gold)
    let c = p.ringPoints(CX, 176, 19, amp: 0.5, segs: 18)
    p.fillSmoothPts(c, .gold, outline: true)
    p.fillSmoothPts(c.map { CGPoint(x: $0.x + 13, y: $0.y) }, .paper)
  }

  // --- III · sown ground, one seed waking -------------------------
  private static func empress(_ p: inout Pen) {
    for i in 0..<6 {
      let y = 150 + Double(i) * 14
      var pts: [[Double]] = []
      for k in 0...8 {
        let t = Double(k) / 8
        pts.append([10 + t * (W - 20), y - cos(t * .pi) * (7 - Double(i))])
      }
      p.smooth(pts, closed: false, w: 1.2)
    }
    p.dot(CX, 104, 20)
    p.ring(CX, 104, 30, w: 1.5, amp: 1.5, segs: 24)
    p.rays(CX, 104, 32, 42, 8, w: 1.2, offset: .pi / 8)
    for dir in [-1.0, 1.0] {
      p.smooth([[CX, 104], [CX + dir * 22, 84], [CX + dir * 34, 52]], closed: false, w: 1.5)
      p.smooth(
        [
          [CX + dir * 32, 54], [CX + dir * 44, 38], [CX + dir * 50, 50], [CX + dir * 38, 60],
        ], w: 1.2)
    }
    p.fillDiamond(CX, 52, 7)
  }

  // --- IV · the iron seat, squared and squared again --------------
  private static func emperor(_ p: inout Pen) {
    p.poly([[28, 40], [W - 28, 40], [W - 28, 208], [28, 208]], w: 2, amp: 1.4)
    p.poly([[42, 54], [W - 42, 54], [W - 42, 194], [42, 194]], w: 1.2, amp: 1.2)
    p.line(CX, 54, CX, 194, w: 1.5)
    p.line(42, 124, W - 42, 124, w: 1.5)
    p.fillPoly([[CX - 18, 96], [CX + 18, 96], [CX + 18, 152], [CX - 18, 152]], .gold, amp: 0.9)
    p.diamond(CX, 124, 11, w: 1.1)
    p.hatch(44, 56, 42, 42, gap: 5, angle: -0.7, w: 0.6)
    p.hatch(W - 86, 150, 42, 42, gap: 5, angle: -0.7, w: 0.6)
    p.rays(CX, 124, 78, 92, 4, w: 1.6, offset: .pi / 4)
  }

  // --- V · three arches, two keys ---------------------------------
  private static func hierophant(_ p: inout Pen) {
    for arch in [[44.0, 52.0], [62, 38], [80, 24]] {
      let y = arch[0], rad = arch[1]
      var pts: [[Double]] = []
      for k in 0...10 {
        let a = .pi + Double(k) / 10 * .pi
        pts.append([CX + cos(a) * rad, y + sin(a) * rad * 0.62])
      }
      p.smooth(pts, closed: false, w: 1.6)
    }
    p.line(CX - 52, 44, CX - 52, 200, w: 1.8)
    p.line(CX + 52, 44, CX + 52, 200, w: 1.8)
    p.line(CX - 62, 200, CX + 62, 200, w: 1.8)
    for dir in [-1.0, 1.0] {
      p.line(CX, 120, CX + dir * 34, 186, w: 1.6)
      p.ring(CX + dir * 34, 186, 8, w: 1.4, amp: 0.6, segs: 14)
      p.line(CX + dir * 12, 150, CX + dir * 22, 146, w: 1.2)
    }
    p.fillDiamond(CX, 108, 15, 19, .gold)
    p.diamond(CX, 108, 22, 27, w: 1)
  }

  // --- VI · two circles, one shared almond ------------------------
  private static func lovers(_ p: inout Pen) {
    p.ring(CX - 26, CY + 8, 48, w: 1.7, amp: 1.5, segs: 26)
    p.ring(CX + 26, CY + 8, 48, w: 1.7, amp: 1.5, segs: 26)
    p.fillPoly([[CX, CY - 32], [CX + 16, CY + 8], [CX, CY + 48], [CX - 16, CY + 8]], .gold, amp: 0.9)
    p.rays(CX, 34, 22, 40, 7, w: 1.2, offset: .pi * 0.12)
    p.diamond(CX, 34, 12, w: 1.2)
    p.line(14, CY + 66, W - 14, CY + 66, w: 1.3)
    p.hatch(14, CY + 68, W - 28, 24, gap: 5, angle: -0.9, w: 0.6)
  }

  // --- VII · hub, spokes, forward momentum ------------------------
  private static func chariot(_ p: inout Pen) {
    p.ring(CX, CY - 6, 54, w: 2, amp: 1.6, segs: 28)
    p.ring(CX, CY - 6, 44, w: 1, amp: 1.2, segs: 24)
    p.rays(CX, CY - 6, 10, 44, 10, w: 1.4)
    p.dot(CX, CY - 6, 11)
    p.diamond(CX, CY - 6, 16, w: 1)
    for i in 0..<3 {
      let y = CY + 66 + Double(i) * 12
      p.smooth([[26, y - 7], [CX, y + 5], [W - 26, y - 7]], closed: false, w: 1.5 - Double(i) * 0.25)
    }
    p.line(24, 42, 60, 42, w: 1.4)
    p.line(W - 60, 42, W - 24, 42, w: 1.4)
    p.ticks(CX, CY - 6, 58, 6, 20)
  }

  // --- VIII · the lemniscate, held without force ------------------
  private static func strength(_ p: inout Pen) {
    for dir in [-1.0, 1.0] {
      var pts: [[Double]] = []
      for i in 0..<18 {
        let a = Double(i) / 18 * .pi * 2
        pts.append([CX + dir * 30 + cos(a) * 30, CY + sin(a) * 26 + p.r.sym(1.1)])
      }
      p.smooth(pts, w: 2)
    }
    p.dot(CX, CY, 8)
    p.rays(CX, CY, 66, 86, 16, w: 0.9)
    p.ring(CX, CY, 64, w: 1.2, amp: 1.6, segs: 26)
    p.fillDiamond(CX, CY - 92, 8)
    p.fillDiamond(CX, CY + 92, 8)
  }

  // --- IX · one lamp, one road ------------------------------------
  private static func hermit(_ p: inout Pen) {
    p.line(CX + 44, 34, CX + 44, 214, w: 2.4)
    p.poly(
      [[CX - 34, 72], [CX + 8, 72], [CX + 16, 96], [CX + 16, 132], [CX - 42, 132], [CX - 42, 96]],
      w: 1.8, amp: 1.2)
    p.line(CX - 42, 96, CX + 16, 96, w: 1.2)
    p.fillPoly([[CX - 13, 104], [CX - 4, 118], [CX - 13, 128], [CX - 22, 118]], .gold, amp: 0.7)
    p.line(CX - 13, 60, CX - 13, 72, w: 1.4)
    p.rays(CX - 13, 116, 30, 46, 9, w: 0.9, offset: .pi * 0.08)
    p.line(10, 190, W - 10, 190, w: 1.5)
    p.hatch(10, 192, W - 20, 34, gap: 6, angle: -1.1, w: 0.7)
    p.fillDiamond(CX + 44, 34, 7)
  }

  // --- X · the turning rim ----------------------------------------
  private static func wheel(_ p: inout Pen) {
    p.ring(CX, CY, 74, w: 2, amp: 1.8, segs: 32)
    p.ring(CX, CY, 62, w: 1, amp: 1.4, segs: 28)
    p.ring(CX, CY, 26, w: 1.5, amp: 1.2, segs: 20)
    p.rays(CX, CY, 26, 62, 8, w: 1.6, offset: .pi / 8)
    p.ticks(CX, CY, 76, 7, 32)
    p.dot(CX, CY, 13)
    for i in 0..<4 {
      let a = Double(i) / 4 * .pi * 2
      p.fillDiamond(CX + cos(a) * 88, CY + sin(a) * 100, 8)
    }
    p.poly([[CX, CY - 44], [CX + 44, CY], [CX, CY + 44], [CX - 44, CY]], w: 1, amp: 1.2)
  }

  // --- XI · the level beam ----------------------------------------
  private static func justice(_ p: inout Pen) {
    p.line(CX, 44, CX, 206, w: 2.2)
    p.line(CX - 66, 84, CX + 66, 84, w: 2)
    for dir in [-1.0, 1.0] {
      p.line(CX + dir * 66, 84, CX + dir * 66, 118, w: 1.2)
      p.smooth(
        [[CX + dir * 88, 118], [CX + dir * 66, 142], [CX + dir * 44, 118]], closed: false, w: 1.6)
      p.line(CX + dir * 88, 118, CX + dir * 44, 118, w: 1.2)
    }
    p.fillDiamond(CX, 84, 13, 15, .gold)
    p.diamond(CX, 44, 10, w: 1.2)
    p.line(CX - 40, 206, CX + 40, 206, w: 2)
    p.hatch(CX - 40, 208, 80, 22, gap: 5, angle: -0.8, w: 0.7)
  }

  // --- XII · sight, inverted --------------------------------------
  private static func hanged(_ p: inout Pen) {
    p.line(22, 46, W - 22, 46, w: 2.2)
    p.line(22, 46, 22, 76, w: 1.6)
    p.line(W - 22, 46, W - 22, 76, w: 1.6)
    p.line(CX, 46, CX, 108, w: 1.4)
    p.poly([[CX - 40, 108], [CX + 40, 108], [CX, 182]], w: 2, amp: 1.4)
    p.hatch(CX - 26, 114, 52, 44, gap: 6, angle: 1.1, w: 0.6)
    p.dot(CX, 196, 12)
    p.ring(CX, 196, 20, w: 1.2, amp: 1.2, segs: 20)
    p.diamond(CX, 138, 12, w: 1.1)
  }

  // --- XIII · the clean horizon -----------------------------------
  private static func death(_ p: inout Pen) {
    p.line(8, 148, W - 8, 148, w: 2.2)
    var arc: [[Double]] = []
    for k in 0...12 {
      let a = .pi + Double(k) / 12 * .pi
      arc.append([CX + cos(a) * 40, 148 + sin(a) * 40])
    }
    p.fillChord(arc, .gold)
    p.rays(CX, 148, 44, 62, 9, w: 1.2, offset: .pi)
    for i in 0..<7 {
      let x = 22 + Double(i) * 24
      p.line(x, 152, x, 152 + 26 + Double(i % 3) * 8, w: 1.4)
    }
    p.smooth([[26, 96], [CX, 58], [W - 26, 96]], closed: false, w: 1.8)
    p.fillDiamond(CX, 58, 8)
    p.hatch(8, 196, W - 16, 32, gap: 7, angle: -1.2, w: 0.6)
  }

  // --- XIV · the measured pour ------------------------------------
  private static func temperance(_ p: inout Pen) {
    p.poly([[CX - 42, 52], [CX + 42, 52], [CX, 120]], w: 1.9, amp: 1.3)
    p.poly([[CX - 42, 200], [CX + 42, 200], [CX, 132]], w: 1.9, amp: 1.3)
    p.fillPoly([[CX - 15, 118], [CX + 15, 118], [CX + 15, 134], [CX - 15, 134]], .gold, amp: 0.7)
    for i in 0..<5 {
      p.fillDiamond(CX + (i % 2 == 1 ? 5 : -5), 140 + Double(i) * 12, 3.2)
    }
    p.line(CX - 42, 52, CX + 42, 52, w: 1.2)
    p.line(CX - 42, 200, CX + 42, 200, w: 1.2)
    p.hatch(CX - 26, 58, 52, 32, gap: 6, angle: 0.9, w: 0.55)
    p.ring(CX, 126, 60, w: 0.9, amp: 1.6, segs: 26)
  }

  // --- XV · the chain one chose -----------------------------------
  private static func devil(_ p: inout Pen) {
    p.poly([[CX - 44, 76], [CX + 44, 76], [CX + 30, 176], [CX - 30, 176]], w: 2, amp: 1.4)
    p.smooth([[CX - 44, 76], [CX - 58, 44], [CX - 30, 58]], closed: false, w: 1.8)
    p.smooth([[CX + 44, 76], [CX + 58, 44], [CX + 30, 58]], closed: false, w: 1.8)
    p.eye(CX, 112, 22, 10)
    p.hatch(CX - 30, 132, 60, 38, gap: 5, angle: -0.9, w: 0.6)
    for i in 0..<4 {
      let y = 150 + Double(i) * 20
      p.ring(26, y, 8, w: 1.3, amp: 0.7, segs: 14, squash: 0.7)
      p.ring(W - 26, y, 8, w: 1.3, amp: 0.7, segs: 14, squash: 0.7)
    }
    p.diamond(CX, 196, 9, w: 1.2)
  }

  // --- XVI · the bolt, and after ----------------------------------
  private static func tower(_ p: inout Pen) {
    p.poly([[CX - 32, 74], [CX + 32, 74], [CX + 38, 212], [CX - 38, 212]], w: 2.1, amp: 1.4)
    p.poly([[CX - 40, 58], [CX + 40, 58], [CX + 32, 74], [CX - 32, 74]], w: 1.6, amp: 1.2)
    for i in 1..<4 {
      let d = Double(i)
      p.line(CX - 34 - d, 74 + d * 34, CX + 34 + d, 74 + d * 34, w: 1)
    }
    p.fillSmooth(
      [
        [CX + 4, 26], [CX + 22, 62], [CX + 6, 60], [CX + 16, 104],
        [CX - 10, 66], [CX + 4, 64], [CX - 14, 30],
      ], .gold)
    p.rays(CX, 40, 26, 40, 5, w: 1.1, offset: -.pi * 0.85)
    for f in [[30.0, 120.0], [W - 30, 150], [36, 186], [W - 34, 196]] {
      p.fillDiamond(f[0], f[1], 6)
      p.line(f[0], f[1] - 16, f[0], f[1] - 7, w: 0.9)
    }
  }

  // --- XVII · water under starlight -------------------------------
  private static func star(_ p: inout Pen) {
    for i in 0..<8 {
      let a = Double(i) / 8 * .pi * 2 - .pi / 2
      let len = i % 2 == 1 ? 40.0 : 74.0
      p.line(
        CX, 96, CX + cos(a) * len, 96 + sin(a) * len,
        w: i % 2 == 1 ? 1.1 : 1.7, amp: 0.8)
    }
    p.dot(CX, 96, 15)
    p.ring(CX, 96, 24, w: 1.2, amp: 1.3, segs: 20)
    p.diamond(CX, 96, 32, w: 0.9)
    p.ripples(W, 180, count: 5, gap: 11)
    for c in [[34.0, 52.0], [W - 34, 62], [28, 130], [W - 30, 126]] {
      p.line(c[0] - 6, c[1], c[0] + 6, c[1], w: 0.9, amp: 0.4)
      p.line(c[0], c[1] - 6, c[0], c[1] + 6, w: 0.9, amp: 0.4)
    }
  }

  // --- XVIII · the long tide, two towers --------------------------
  private static func moon(_ p: inout Pen) {
    p.ring(CX, 88, 44, w: 1.6, amp: 1.6, segs: 26)
    let cres = p.ringPoints(CX + 6, 88, 32, amp: 0.6, segs: 20)
    p.fillSmoothPts(cres, .gold, outline: true)
    p.fillSmoothPts(
      cres.map { CGPoint(x: $0.x + 16 + ($0.x - CX - 6) * 0.1, y: $0.y) }, .paper)
    p.ticks(CX, 88, 48, 7, 24)
    for x in [36.0, W - 36] {
      p.poly([[x - 12, 150], [x + 12, 150], [x + 12, 206], [x - 12, 206]], w: 1.6, amp: 1)
      p.poly([[x - 12, 150], [x, 134], [x + 12, 150]], w: 1.4, amp: 0.8)
      p.fillDiamond(x, 168, 5)
    }
    for i in 0..<7 {
      let y = 152 + Double(i) * 11
      p.line(CX, y, CX, y + 6, w: 1.6, amp: 0.3)
    }
    p.ripples(W, 224, count: 2, gap: 9)
  }

  // --- XIX · unshaded noon ----------------------------------------
  private static func sun(_ p: inout Pen) {
    p.rays(CX, 104, 56, 92, 12, w: 1.8)
    p.rays(CX, 104, 56, 76, 12, w: 1, offset: .pi / 12)
    p.ring(CX, 104, 52, w: 2, amp: 1.6, segs: 28)
    p.dot(CX, 104, 40)
    p.ring(CX, 104, 40, w: 1.2, amp: 0.8, segs: 22)
    p.eye(CX, 104, 22, 10)
    p.line(10, 214, W - 10, 214, w: 1.6)
    p.hatch(10, 216, W - 20, 22, gap: 6, angle: -1.2, w: 0.7)
    p.fillDiamond(22, 34, 7)
    p.fillDiamond(W - 22, 34, 7)
  }

  // --- XX · the sounding call -------------------------------------
  private static func judgement(_ p: inout Pen) {
    p.poly([[CX - 30, 26], [CX + 30, 26], [CX + 11, 92], [CX - 11, 92]], w: 2, amp: 1.2)
    p.line(CX - 34, 26, CX + 34, 26, w: 1.6)
    p.line(CX - 18, 58, CX + 18, 58, w: 1)
    p.fillDiamond(CX, 104, 13, 17, .gold)
    p.rays(CX, 104, 20, 34, 8, w: 1, offset: .pi / 8)
    for i in 0..<3 {
      let y = 152 + Double(i) * 26
      p.line(20 + Double(i) * 8, y, W - 20 - Double(i) * 8, y, w: 1.8 - Double(i) * 0.3)
    }
    for dir in [-1.0, 1.0] {
      p.smooth(
        [[CX + dir * 58, 206], [CX + dir * 40, 168], [CX + dir * 34, 136]], closed: false, w: 1.5)
      p.fillDiamond(CX + dir * 34, 130, 6)
    }
    p.hatch(20, 208, W - 40, 24, gap: 6, angle: -1.1, w: 0.7)
  }

  // --- XXI · the circle closed ------------------------------------
  private static func world(_ p: inout Pen) {
    p.ring(CX, CY, 74, w: 2.2, amp: 2, segs: 30, squash: 1.06)
    p.ring(CX, CY, 66, w: 0.9, amp: 1.4, segs: 28, squash: 1.06)
    for i in 0..<26 {
      let a = Double(i) / 26 * .pi * 2
      p.line(
        CX + cos(a) * 66, CY + sin(a) * 70,
        CX + cos(a + 0.2) * 74, CY + sin(a + 0.2) * 78, w: 1.1, amp: 0.4)
    }
    p.dot(CX, CY, 24)
    p.line(CX - 34, CY, CX + 34, CY, w: 1.4)
    p.line(CX, CY - 34, CX, CY + 34, w: 1.4)
    p.diamond(CX, CY, 34, w: 1.1)
    for s in [[-1.0, -1.0], [1, -1], [-1, 1], [1, 1]] {
      let x = CX + s[0] * 76, y = CY + s[1] * 104
      p.fillDiamond(x, y, 9)
      p.rays(x, y, 12, 22, 4, w: 1, offset: .pi / 4)
    }
  }

  // ===================================================================
  //  The frame and the reverse — 226 × 400
  // ===================================================================

  static func frameMarks() -> [Mark] {
    var p = Pen(seed: 7)
    p.poly([[5, 5], [221, 5], [221, 395], [5, 395]], w: 1.1, amp: 0.9)
    p.poly([[11, 11], [215, 11], [215, 389], [11, 389]], w: 2.4, amp: 1.1)
    p.poly([[20, 52], [206, 52], [206, 300], [20, 300]], w: 1.3, amp: 1)
    p.line(11, 300, 215, 300, w: 2.2)
    let br = 13.0
    for c in [[20.0, 52.0, 1, 1], [206, 52, -1, 1], [20, 300, 1, -1], [206, 300, -1, -1]] {
      let x = c[0], y = c[1], sx = c[2], sy = c[3]
      p.line(x + sx * 4, y + sy * 4, x + sx * br, y + sy * 4, w: 1.1, c: .accent, amp: 0.5)
      p.line(x + sx * 4, y + sy * 4, x + sx * 4, y + sy * br, w: 1.1, c: .accent, amp: 0.5)
    }
    return p.marks
  }

  /// The app icon: the Magician's eye, drawn in cream on the void.
  static func iconMarks() -> [Mark] {
    var p = Pen(seed: 31)
    let c = 512.0
    p.rays(c, c, 44, 436, 16, w: 7, c: .paper)
    p.ring(c, c, 196, w: 8.5, c: .paper, amp: 2.5, segs: 34)
    p.diamond(c, c, 226, w: 5.5, c: .accent, amp: 1.5)
    p.eye(c, c, 112, 50)
    return p.marks
  }

  static func backMarks() -> [Mark] {
    var p = Pen(seed: 21)
    let cx = 113.0, cy = 200.0
    p.poly([[5, 5], [221, 5], [221, 395], [5, 395]], w: 1.1, amp: 0.9)
    p.poly([[12, 12], [214, 12], [214, 388], [12, 388]], w: 2.6, amp: 1.1)
    p.poly([[20, 20], [206, 20], [206, 380], [20, 380]], w: 0.9, amp: 1)
    for rad in [88.0, 70, 52, 30] {
      p.ring(cx, cy, rad, w: rad == 70 ? 1.8 : 1, amp: 1.5, segs: 28)
    }
    p.rays(cx, cy, 30, 88, 24, w: 1)
    p.ticks(cx, cy, 92, 8, 36)
    p.dot(cx, cy, 14)
    p.diamond(cx, cy, 22, w: 1.1)
    for sy in [-1.0, 1.0] {
      p.line(30, cy + sy * 128, 196, cy + sy * 128, w: 1.4)
      p.fillDiamond(cx, cy + sy * 146, 9)
      p.fillPoly([[cx - 30, cy + sy * 146 - 5], [cx - 25, cy + sy * 146],
                  [cx - 30, cy + sy * 146 + 5], [cx - 35, cy + sy * 146]], .ink, amp: 0.4)
      p.fillPoly([[cx + 30, cy + sy * 146 - 5], [cx + 35, cy + sy * 146],
                  [cx + 30, cy + sy * 146 + 5], [cx + 25, cy + sy * 146]], .ink, amp: 0.4)
    }
    p.hatch(26, 26, 40, 40, gap: 6, angle: -0.8, w: 0.6)
    p.hatch(160, 334, 40, 40, gap: 6, angle: -0.8, w: 0.6)
    return p.marks
  }
}
