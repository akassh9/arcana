import SwiftUI

// ===================================================================
//  Moon — tonight's, not a picture of one. The phase is reckoned from
//  a known new moon and the length of the synodic month; the sky over
//  the table is the sky over the reader.
// ===================================================================

struct Moon {
  /// 0 new · 0.25 first quarter · 0.5 full · 0.75 last quarter
  let age: Double

  static var tonight: Moon { Moon(date: Date()) }

  init(date: Date) {
    // 2000-01-06 18:14 UTC, a new moon
    let epoch = 947_182_440.0
    let synodic = 29.530_588_853 * 86_400
    let a = (date.timeIntervalSince1970 - epoch) / synodic
    age = a - floor(a)
  }

  /// Fraction of the disc that is lit.
  var illumination: Double { (1 - cos(age * 2 * .pi)) / 2 }

  var name: String {
    switch age {
    case ..<0.03, 0.97...: return "new moon"
    case ..<0.22: return "waxing crescent"
    case ..<0.28: return "first quarter"
    case ..<0.47: return "waxing gibbous"
    case ..<0.53: return "full moon"
    case ..<0.72: return "waning gibbous"
    case ..<0.78: return "last quarter"
    default: return "waning crescent"
    }
  }

  /// The lit shape: one limb is a half circle, the terminator a half ellipse.
  func litPath(center c: CGPoint, radius r: Double) -> Path {
    let waxing = age < 0.5
    let side: Double = waxing ? 1 : -1  // lit limb on the right while waxing
    let k = cos(age * 2 * .pi)  // 1 new … -1 full … 1 new
    var p = Path()
    let steps = 40
    // the limb, top to bottom, on the lit side
    for i in 0...steps {
      let a = -Double.pi / 2 + Double(i) / Double(steps) * .pi
      let pt = CGPoint(x: c.x + side * cos(a) * r, y: c.y + sin(a) * r)
      i == 0 ? p.move(to: pt) : p.addLine(to: pt)
    }
    // the terminator, bottom back to top
    for i in 0...steps {
      let a = Double.pi / 2 - Double(i) / Double(steps) * .pi
      let pt = CGPoint(x: c.x + side * k * cos(a) * r, y: c.y + sin(a) * r)
      p.addLine(to: pt)
    }
    p.closeSubpath()
    return p
  }
}
