import AppKit
import SwiftUI

// ===================================================================
//  Quill — the question, if you write it. Each letter is laid in gold
//  and cools to ink; when the question is held, the deck reads it, and
//  its gold goes in with the dust; it is read back above the spread.
//
//  It is held in memory only: kept nowhere, sent nowhere, and it never
//  touches the shuffle.
// ===================================================================

@Observable
@MainActor
final class Quill {
  /// What has been laid, and an input method's composition not yet laid.
  private(set) var text = ""
  private(set) var marked = ""
  /// When each Character of `text` was laid.
  private(set) var born: [TimeInterval] = []
  /// Something is written. Stored, so the line redraws only when it flips.
  private(set) var writing = false
  /// Some ink is still cooling; the line's clock runs only while it is.
  private(set) var wet = false
  /// When the pen last ran dry — a key that found no room on the line.
  private(set) var spentAt: TimeInterval = 0
  /// The width of the written line, at its own size.
  private(set) var inkWidth: CGFloat = 0
  /// Given to the deck at the cut, and read back in the reading.
  private(set) var asked = ""
  private(set) var readBackAt: TimeInterval?

  // Polled by the sky while the question is held; never observed.
  /// The centre of the line, in the stage's space.
  @ObservationIgnored var lineCenter: CGPoint = .zero
  /// The centre of each inked glyph, from the ink's leading edge.
  @ObservationIgnored private(set) var centres: [CGFloat] = []
  /// How many glyphs this hold is giving, fixed as it begins, so a letter
  /// written while the light drains back never disturbs the others.
  @ObservationIgnored private(set) var giving = 0
  /// The furthest the charge has reached since it last came to rest. Dust
  /// only ever moves forward along its way: let go, and it stays where it
  /// is; press again, and it waits there until the charge passes it.
  @ObservationIgnored var peak = 0.0
  /// How far the line last moved as it grew, so a paste glides, not lurches.
  @ObservationIgnored private(set) var lastStep: CGFloat = 0
  /// Ends an input method's composition, so what was seen is what is given.
  @ObservationIgnored var endComposition: (() -> Void)?
  /// Clears the page the question was typed on.
  @ObservationIgnored var clearPage: (() -> Void)?
  /// An input method is composing on the page.
  @ObservationIgnored var composing: () -> Bool = { false }
  /// Keys the pen took down, so it is the pen that lets them go.
  @ObservationIgnored var held: Set<UInt16> = []

  @ObservationIgnored private var wetUntil: TimeInterval = 0
  @ObservationIgnored private var emptyTask: Task<Void, Never>?

  /// The written line's size, and how much of the sky it may take.
  static let size: CGFloat = 19
  static let room: CGFloat = 560

  /// Nothing is on the line, not even a composition.
  var isEmpty: Bool { text.isEmpty && marked.isEmpty }

  private var now: TimeInterval { Date().timeIntervalSinceReferenceDate }

  // --- writing ---------------------------------------------------------

  /// The page has changed: lay what is new, keep what was already laid.
  /// A paste lands whole and cools as one.
  func take(committed: String, marked newMarked: String) {
    let old = Array(text), new = Array(committed)
    var p = 0
    while p < old.count, p < new.count, old[p] == new[p] { p += 1 }
    let fresh = new.count - p
    // what arrives together is laid together, a breath after the last;
    // the first letter waits for the invitation to breathe out
    let first = max(now, (born.last ?? 0) + 0.03) + (writing ? 0 : 0.22)
    born = Array(born.prefix(p)) + Array(repeating: first, count: fresh)
    let grew = fresh > 0 || newMarked != marked
    text = committed
    marked = newMarked
    measure()
    if grew { wetten(first - now + 0.95) }
    settleWriting()
  }

  /// A key that found no room: the pen touches the paper and lays nothing.
  func spend() {
    spentAt = now
    wetten(0.75)
  }

  /// Everything written is let go at once.
  func erase() {
    text = ""
    marked = ""
    born = []
    measure()
    clearPage?()
    settleWriting(now: true)
  }

  /// At the cut: the deck takes the question.
  func give() {
    asked = text.trimmingCharacters(in: .whitespaces)
    readBackAt = nil
    erase()
  }

  func readBack() { readBackAt = now }

  func forget() {
    asked = ""
    readBackAt = nil
  }

  /// A hold begins: what is being composed is laid, and the letters it
  /// will give are counted.
  func beginGiving() {
    endComposition?()
    giving = centres.count
  }

  /// Would this line still fit in the sky?
  static func fits(_ s: String) -> Bool { measure(s).width <= room }

  // --- the line's geometry ----------------------------------------------

  private func measure() {
    let m = Quill.measure(text + marked)
    lastStep = abs(m.width - inkWidth)
    inkWidth = m.width
    centres = Quill.measure(text).centres
  }

  /// The pen's italic, without ligatures: a colour change between two letters
  /// would break an fi apart and fuse it again, and laid ink would shift.
  static let font: NSFont = {
    let base = NSFont(name: "Didot-Italic", size: size) ?? .systemFont(ofSize: size)
    let plain = base.fontDescriptor.addingAttributes([
      .featureSettings: [
        [
          NSFontDescriptor.FeatureKey.typeIdentifier: kLigaturesType,
          NSFontDescriptor.FeatureKey.selectorIdentifier: kCommonLigaturesOffSelector,
        ]
      ]
    ])
    return NSFont(descriptor: plain, size: size) ?? base
  }()

  /// The width of a line set in the pen's italic, and the centre of each of
  /// its glyphs that is not a space.
  static func measure(_ s: String) -> (width: CGFloat, centres: [CGFloat]) {
    guard !s.isEmpty else { return (0, []) }
    let line = CTLineCreateWithAttributedString(
      NSAttributedString(string: s, attributes: [.font: font]))
    let width = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
    var centres: [CGFloat] = []
    var u = 0
    for ch in s {
      let n = ch.utf16.count
      if !ch.isWhitespace {
        let a = CTLineGetOffsetForStringIndex(line, u, nil)
        let b = CTLineGetOffsetForStringIndex(line, u + n, nil)
        centres.append((a + b) / 2)
      }
      u += n
    }
    return (width, centres)
  }

  /// Where each letter being given sits in the stage, and how far through
  /// the line it is.
  func givenPoints() -> [CGPoint] {
    let n = min(giving, centres.count)
    return (0..<n).map {
      CGPoint(x: lineCenter.x - inkWidth / 2 + centres[$0], y: lineCenter.y + 2)
    }
  }

  // --- the clock ----------------------------------------------------------

  /// Keep the line's clock running while ink cools; it stops by itself.
  private func wetten(_ seconds: Double) {
    wetUntil = max(wetUntil, now + seconds)
    if !wet { wet = true }
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: UInt64((seconds + 0.05) * 1e9))
      guard let self else { return }
      if self.now >= self.wetUntil && self.wet { self.wet = false }
    }
  }

  /// A line emptied by deleting waits a moment before the invitation
  /// returns, so correcting a first letter never flickers it.
  private func settleWriting(now at: Bool = false) {
    let w = !text.isEmpty || !marked.isEmpty
    emptyTask?.cancel()
    if w || at {
      if w != writing { writing = w }
      return
    }
    guard writing else { return }
    emptyTask = Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: 600_000_000)
      guard let self, !Task.isCancelled, self.text.isEmpty, self.marked.isEmpty else { return }
      self.writing = false
    }
  }

  // --- the ink ----------------------------------------------------------

  /// How far a glyph has cooled, 0 wet gold … 1 dry ink.
  static func cool(_ age: Double) -> Double { ramp(age, 0.08, 0.9) }

  /// When, in the hold, glyph `k` of `n` begins to be given. Each gives
  /// its gold over the same span, in the order it was written.
  static func start(_ k: Int, of n: Int) -> Double {
    n <= 1 ? 0.70 : 0.45 + 0.25 * Double(k) / Double(n - 1)
  }

  /// How far glyph `k` has been given at charge `c`, 0…1.
  static func loosen(_ k: Int, of n: Int, _ c: Double) -> Double {
    let a = start(k, of: n)
    return ramp(c, a, a + 0.10)
  }

  /// How far glyph `k`'s gold has travelled toward the deck, 0…1. Every
  /// mote takes the same time, so the last word does not rush.
  static func flight(_ k: Int, of n: Int, _ c: Double) -> Double {
    pow(clamp01((c - start(k, of: n) - 0.02) / 0.28), 1.35)
  }

  private struct RGBA { let r, g, b: Double }
  private static func rgba(_ c: Color) -> RGBA {
    let n = NSColor(c).usingColorSpace(.sRGB) ?? .black
    return RGBA(r: n.redComponent, g: n.greenComponent, b: n.blueComponent)
  }
  private static let lit = rgba(Palette.goldLit)
  private static let gold = rgba(Palette.gold)
  private static let ink = rgba(Palette.text)

  /// A glyph by its age: laid lit, as the nib leaves it, then wet gold
  /// cooling to the line's ink.
  static func tone(age: Double, rest: Double) -> Color {
    let l = 1 - ramp(age, 0, 0.15)  // the nib's light, on the stroke itself
    let t = cool(age)
    let g = RGBA(
      r: gold.r + (lit.r - gold.r) * l, g: gold.g + (lit.g - gold.g) * l,
      b: gold.b + (lit.b - gold.b) * l)
    return Color(
      red: g.r + (ink.r - g.r) * t, green: g.g + (ink.g - g.g) * t, blue: g.b + (ink.b - g.b) * t,
      opacity: 1 + (rest - 1) * t)
  }

  // --- what may be written ----------------------------------------------

  /// A question is one line of words: breaks become spaces, and pictures,
  /// controls and stray formatting are left out. Quotes are set as type.
  static func clean(_ raw: String, after before: String) -> String {
    var out = ""
    var last: Character? = before.last
    for ch in raw {
      var c = ch
      if c.isNewline || c == "\t" || c == "\u{3000}" || c == "\u{00A0}" { c = " " }
      let scalars = c.unicodeScalars
      if scalars.contains(where: { s in
        s.properties.isEmojiPresentation || s == "\u{FE0F}" || s == "\u{20E3}"
          || s.properties.generalCategory == .control
          || s.properties.generalCategory == .privateUse
          || (s.properties.generalCategory == .format && s != "\u{200C}" && s != "\u{200D}")
      }) { continue }
      if c == " " && (last == nil || last == " ") { continue }
      if c == "'" { c = "\u{2019}" }
      if c == "\"" { c = (last == nil || last == " " || last == "(" || last == "\u{201C}") ? "\u{201C}" : "\u{201D}" }
      out.append(c)
      last = c
    }
    return out
  }

  /// As much of `s` as still fits after `before`; a long paste is cut back
  /// to the last whole word.
  static func room(for s: String, after before: String, pasted: Bool) -> String {
    if fits(before + s) { return s }
    let chars = Array(s)
    var lo = 0, hi = chars.count
    while lo < hi {
      let mid = (lo + hi + 1) / 2
      if fits(before + String(chars[0..<mid])) { lo = mid } else { hi = mid - 1 }
    }
    var cut = String(chars[0..<lo])
    if pasted, lo < chars.count, let space = cut.lastIndex(of: " ") { cut = String(cut[..<space]) }
    return cut
  }

  // --- posing, for the shot tool -----------------------------------------

  /// Lay `s` as if written, each glyph `ages[i]` seconds ago (dry if absent).
  func pose(_ s: String, ages: [Double] = [], wet: Bool = false) {
    text = s
    marked = ""
    let t = now
    born = (0..<s.count).map { i in i < ages.count ? t - ages[i] : t - 60 }
    measure()
    writing = !s.isEmpty
    self.wet = wet
  }

  func poseAsked(_ s: String, at t: TimeInterval) {
    asked = s
    readBackAt = t
  }

  func poseGiving(center: CGPoint) {
    lineCenter = center
    giving = centres.count
  }
}
