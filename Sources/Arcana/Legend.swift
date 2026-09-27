import SwiftUI

// ===================================================================
//  The keys — the few the room has, one line each, on a page over the
//  sky. Only what the room does not show: the hand finds the rest.
//  Opened by the old key in the corner the bowl leaves free, by ?, or by
//  ⌘/ from the Help menu.
// ===================================================================

extension Notification.Name {
  /// The Help menu's The Keys: opens them, or closes them.
  static let arcanaKeys = Notification.Name("ArcanaKeys")
}

// --- what the page says ----------------------------------------------

/// A key as the page gives it: named in small capitals, or drawn.
enum LegendKey: Hashable {
  case named(String)
  case left, right, up, command, delete

  /// What VoiceOver says for it.
  var spoken: String {
    switch self {
    case .named(let s): return s
    case .left: return "left arrow"
    case .right: return "right arrow"
    case .up: return "up arrow"
    case .command: return "command"
    case .delete: return "delete"
    }
  }
}

/// One line of the page: the keys, or the word for what the hand does, and
/// what they do. A held key does whatever the room's own "hold" says.
struct LegendLine: Hashable {
  let keys: [LegendKey]
  var word: String? = nil
  let does: String

  static let all: [LegendLine] = [
    LegendLine(keys: [.left, .right], does: "choose"),
    LegendLine(keys: [], word: "type", does: "your question"),
    LegendLine(keys: [.named("space")], does: "hold"),
    LegendLine(keys: [.up], does: "past readings"),
    LegendLine(keys: [.command, .delete], does: "forget a reading"),
    LegendLine(keys: [.named("esc")], does: "back"),
  ]

  var spoken: String { (word.map { [$0] } ?? keys.map(\.spoken)).joined(separator: " ") }
}

// --- the page --------------------------------------------------------

/// The keys, over whatever the room is doing: the table steps aside, and
/// they are set in the air over the sky.
struct LegendPage: View {
  let game: Game
  let size: CGSize
  let reduceMotion: Bool

  var body: some View {
    ZStack {
      if game.legend {
        LegendSheet(size: size, reduceMotion: reduceMotion, close: { game.closeLegend() })
          .transition(
            .asymmetric(
              insertion: .opacity.animation(.easeOut(duration: 0.35)),
              removal: .opacity.animation(.easeOut(duration: 0.25))))
      }
    }
    .frame(width: size.width, height: size.height)
    // leaving, it takes no clicks
    .allowsHitTesting(game.legend)
  }
}

private struct LegendSheet: View {
  let size: CGSize
  let reduceMotion: Bool
  let close: () -> Void
  @Environment(\.stillSky) private var still
  @State private var shown = false

  var body: some View {
    // its lines arrive in order, a beat apart; with Reduce Motion, and in
    // the shot tool's stills, they are simply there
    let on = shown || reduceMotion || still

    ZStack {
      // a veil over the sky, as the altar has, so the keys are a place of
      // their own; thin toward the edges, where the sky still shows
      RadialGradient(
        stops: [
          .init(color: Palette.pearl.opacity(0.80), location: 0),
          .init(color: Palette.pearl.opacity(0.60), location: 0.5),
          .init(color: Palette.pearl.opacity(0.32), location: 1),
        ],
        center: .center, startRadius: 0, endRadius: max(size.width, size.height) * 0.72
      )
      .ignoresSafeArea()

      VStack(spacing: 0) {
        VStack(spacing: 18) {
          Rectangle().fill(Palette.goldInk.opacity(0.55)).frame(width: 46, height: 1)
          Text("THE KEYS")
            .font(.display(21))
            .tracking(8)
            .foregroundStyle(Palette.text)
            .shadow(color: Palette.goldLit.opacity(0.45), radius: 14)
            .padding(.leading, 8)  // the tracked final letter
        }
        .arrive(on, 0)

        // the keys to the left of the page's middle, what they do to the right
        VStack(spacing: 15) {
          ForEach(Array(LegendLine.all.enumerated()), id: \.offset) { pair in
            let line = pair.element
            HStack(spacing: 22) {
              HStack(spacing: 5) {
                if let w = line.word {
                  Caps(text: w, size: 9, tracking: 2.6, color: Palette.text.opacity(0.66))
                    .padding(.leading, 2.6)
                } else {
                  ForEach(Array(line.keys.enumerated()), id: \.offset) { k in
                    KeyCap(key: k.element, seed: seedHash(line.does) &+ UInt32(k.offset))
                  }
                }
              }
              .frame(width: 150, alignment: .trailing)

              Text(line.does)
                .font(.italic(17))
                .foregroundStyle(Palette.text.opacity(0.82))
                .frame(width: 150, alignment: .leading)
            }
            .frame(height: 22)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(line.spoken + ": " + line.does)
            .arrive(on, 1 + pair.offset)
          }
        }
        .padding(.top, 38)
      }
    }
    .contentShape(Rectangle())
    .onTapGesture(perform: close)
    .onAppear { shown = true }
    .accessibilityElement(children: .contain)
    .accessibilityLabel("The keys")
  }
}

private extension View {
  /// The k-th part of the page arrives a beat after the one before, out of
  /// a little blur, as a line of the verse does — once the table has all
  /// but gone, so no word of the page is laid over one of the room's.
  func arrive(_ on: Bool, _ k: Int) -> some View {
    modifier(Arrive(on: !on))
      .animation(.easeOut(duration: 0.45).delay(0.16 + Double(k) * 0.05), value: on)
  }
}

/// A key, drawn by the pen: a rounded square not quite true, with its name
/// in small capitals, or its sign drawn in the same hand.
private struct KeyCap: View {
  let key: LegendKey
  let seed: UInt32

  var body: some View {
    let tone = Palette.text.opacity(0.74)
    Group {
      switch key {
      case .named(let s):
        Caps(text: s, size: 9, tracking: 1.6, color: tone)
          .padding(.leading, 1.6)  // the tracked final letter
          .padding(.horizontal, s.count > 1 ? 7 : 0)
      default:
        Drawn(marks: KeySigns.marks(key), space: KeySigns.space)
          .stroke(tone, style: StrokeStyle(lineWidth: 0.95, lineCap: .round, lineJoin: .round))
          .frame(width: 10, height: 10)
      }
    }
    .frame(minWidth: 22, minHeight: 22)
    .background(
      CapShape(seed: seed)
        .stroke(
          Palette.text.opacity(0.4),
          style: StrokeStyle(lineWidth: 0.85, lineCap: .round, lineJoin: .round)))
  }
}

/// The outline of a key, laid by the pen around the frame it is given:
/// each side bowed a hair, each corner turned round, none quite true.
private struct CapShape: Shape {
  let seed: UInt32

  func path(in r: CGRect) -> Path {
    var rng = Rng(seed)
    let rc = min(4.0, r.height * 0.24)
    let (x0, y0, x1, y1) = (r.minX, r.minY, r.maxX, r.maxY)
    func nudge(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
      CGPoint(x: x + rng.sym(0.14), y: y + rng.sym(0.14))
    }
    // the corners, each from where it leaves one side to where it meets the next
    let corners: [(from: CGPoint, at: CGPoint, to: CGPoint)] = [
      (nudge(x1 - rc, y0), CGPoint(x: x1, y: y0), nudge(x1, y0 + rc)),
      (nudge(x1, y1 - rc), CGPoint(x: x1, y: y1), nudge(x1 - rc, y1)),
      (nudge(x0 + rc, y1), CGPoint(x: x0, y: y1), nudge(x0, y1 - rc)),
      (nudge(x0, y0 + rc), CGPoint(x: x0, y: y0), nudge(x0 + rc, y0)),
    ]
    var p = Path()
    var last = corners[3].to
    p.move(to: last)
    for c in corners {
      // the side, bowed, and then the corner
      let dx = c.from.x - last.x, dy = c.from.y - last.y
      let len = max(hypot(dx, dy), 0.001)
      let bow = rng.sym(0.3)
      let mid = CGPoint(x: (last.x + c.from.x) / 2, y: (last.y + c.from.y) / 2)
      p.addQuadCurve(
        to: c.from, control: CGPoint(x: mid.x - dy / len * bow, y: mid.y + dx / len * bow))
      p.addQuadCurve(to: c.to, control: c.at)
      last = c.to
    }
    p.closeSubpath()
    return p
  }
}

/// Marks drawn in a space of their own, scaled into whatever frame they
/// are given, and stroked as one.
private struct Drawn: Shape {
  let marks: [Mark]
  let space: CGSize

  func path(in r: CGRect) -> Path {
    let s = min(r.width / space.width, r.height / space.height)
    let t = CGAffineTransform(
      translationX: r.midX - space.width * s / 2, y: r.midY - space.height * s / 2
    )
    .scaledBy(x: s, y: s)
    var out = Path()
    for m in marks { out.addPath(m.path, transform: t) }
    return out
  }
}

/// The signs on the keys that have no name: the arrows, command and delete.
private enum KeySigns {
  static let space = CGSize(width: 10, height: 10)

  static func marks(_ k: LegendKey) -> [Mark] { all[k] ?? [] }

  private static let all: [LegendKey: [Mark]] = {
    var out: [LegendKey: [Mark]] = [:]
    // an arrow along x, from the tail to the head, turned `deg`
    func arrow(_ seed: UInt32, _ deg: Double) -> [Mark] {
      var p = Pen(seed: seed)
      let a = deg * .pi / 180
      func at(_ x: Double, _ y: Double) -> (Double, Double) {
        let dx = x - 5, dy = y - 5
        return (5 + dx * cos(a) - dy * sin(a), 5 + dx * sin(a) + dy * cos(a))
      }
      let (t, h) = (at(1.2, 5), at(8.8, 5))
      p.line(t.0, t.1, h.0, h.1, w: 1, amp: 0.12)
      let (u, v) = (at(5.6, 1.8), at(5.6, 8.2))
      p.line(u.0, u.1, h.0, h.1, w: 1, amp: 0.1)
      p.line(h.0, h.1, v.0, v.1, w: 1, amp: 0.1)
      return p.marks
    }
    out[.right] = arrow(701, 0)
    out[.left] = arrow(703, 180)
    out[.up] = arrow(704, 270)

    // ⌘: a square whose sides run on and curl into four loops
    var c = Pen(seed: 705)
    for (x, y) in [(2.4, 2.4), (7.6, 2.4), (2.4, 7.6), (7.6, 7.6)] {
      c.ring(x, y, 1.25, w: 1, amp: 0.05, segs: 10)
    }
    c.line(3.65, 2.4, 3.65, 7.6, w: 1, amp: 0.08)
    c.line(6.35, 2.4, 6.35, 7.6, w: 1, amp: 0.08)
    c.line(2.4, 3.65, 7.6, 3.65, w: 1, amp: 0.08)
    c.line(2.4, 6.35, 7.6, 6.35, w: 1, amp: 0.08)
    out[.command] = c.marks

    // ⌫: a tag pointing back, crossed out
    var d = Pen(seed: 706)
    d.poly([[0.8, 5], [3.6, 1.9], [9.2, 1.9], [9.2, 8.1], [3.6, 8.1]], w: 1, amp: 0.1)
    d.line(5.0, 3.6, 7.6, 6.4, w: 1, amp: 0.06)
    d.line(7.6, 3.6, 5.0, 6.4, w: 1, amp: 0.06)
    out[.delete] = d.marks
    return out
  }()
}

// --- the key in the corner -------------------------------------------

/// Top left, where the bowl is top right: the old key that opens the keys,
/// and closes them.
struct LegendToggle: View {
  let game: Game

  var body: some View {
    VStack {
      HStack {
        Button(action: { game.toggleLegend() }) {
          KeyGlyph(lit: game.legend)
            .frame(width: 26, height: 26)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("The keys")
        .accessibilityValue(game.legend ? "Open" : "Closed")
        .accessibilityAddTraits(.isToggle)
        Spacer()
      }
      Spacer()
    }
    .padding(18)
  }
}

/// The keys, drawn by the same pen as the cards: an old key, turned as it
/// would be in a lock. While they are open it is gold.
private struct KeyGlyph: View {
  let lit: Bool

  private static let space = CGSize(width: 24, height: 24)

  private static let key: [Mark] = {
    var p = Pen(seed: 421)
    // laid level through the middle of its space, then turned an eighth of
    // a circle, the bow low and the bit high
    func at(_ x: Double, _ y: Double) -> (Double, Double) {
      let a = -Double.pi / 4, dx = x - 12, dy = y - 12
      return (12 + dx * cos(a) - dy * sin(a), 12 + dx * sin(a) + dy * cos(a))
    }
    func line(_ x1: Double, _ y1: Double, _ x2: Double, _ y2: Double, _ w: CGFloat) {
      let a = at(x1, y1), b = at(x2, y2)
      p.line(a.0, a.1, b.0, b.1, w: w, amp: 0.15)
    }
    let bow = at(5.6, 12)
    p.ring(bow.0, bow.1, 3.2, w: 1.05, amp: 0.22, segs: 16)
    line(8.8, 12, 22.2, 12, 1.05)  // the shank
    line(10.4, 10.6, 10.4, 13.4, 0.95)  // the collar
    // the bit, cut in two steps
    line(18.6, 12, 18.6, 15.6, 1.0)
    line(18.6, 15.6, 20.3, 15.6, 0.95)
    line(20.3, 15.6, 20.3, 14.0, 0.95)
    line(20.3, 14.0, 22.2, 14.0, 0.95)
    line(22.2, 14.0, 22.2, 12, 0.95)
    return p.marks
  }()

  var body: some View {
    ZStack {
      MarksCanvas(marks: Self.key, space: Self.space, tint: .only(Palette.text.opacity(0.5)))
        .opacity(lit ? 0 : 1)
      MarksCanvas(marks: Self.key, space: Self.space, tint: .only(Palette.goldInk))
        .shadow(color: Palette.goldLit.opacity(0.8), radius: 6)
        .opacity(lit ? 1 : 0)
    }
    .animation(.easeOut(duration: 0.35), value: lit)
  }
}
