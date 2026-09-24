import SwiftUI

// ===================================================================
//  Game — three beats: invocation, draw, reading.
// ===================================================================

@Observable
@MainActor
final class Game {
  enum Phase { case invocation, draw, reading }

  var phase: Phase = .invocation
  var spreadIndex = 1
  var order: [Draw] = []
  var picks: [Int] = []
  var faceUp: Set<Int> = []
  var dealt = false
  var hovered: Int?
  var reading: Int?      // slot the cursor is resting on
  var inspecting: Int?   // slot opened full size
  var flashes: [Flash] = []
  var muted = false
  var weaving = false
  var weave: WeaveResult?
  var weaveError = false

  private var weaveTask: Task<Void, Never>?

  var spread: Spread { Spread.all[spreadIndex] }
  var need: Int { spread.count }
  var complete: Bool { picks.count >= need }

  init() { reshuffle() }

  func slotIndex(ofOrder i: Int) -> Int? { picks.firstIndex(of: i) }
  func draw(atSlot s: Int) -> Draw? {
    guard s >= 0, s < picks.count else { return nil }
    return order[picks[s]]
  }

  private func reshuffle() {
    order = deck.map { Draw(card: $0, reversed: Double.random(in: 0..<1) < 0.42) }.shuffled()
  }

  // --- beats --------------------------------------------------------

  func chooseSpread(_ i: Int) {
    guard phase == .invocation, i >= 0, i < Spread.all.count, i != spreadIndex else { return }
    spreadIndex = i
    Sfx.shared.play(.tick, gain: 0.45)
  }

  func begin() {
    guard phase == .invocation else { return }
    reshuffle()
    picks = []
    faceUp = []
    flashes = []
    inspecting = nil
    reading = nil
    weaving = false
    weave = nil
    weaveError = false
    phase = .draw
    Sfx.shared.play(.cut, gain: 0.8)
    withAnimation(.spring(response: 0.95, dampingFraction: 0.8)) { dealt = true }
  }

  func take(_ i: Int, landing: CGPoint) {
    guard phase == .draw, !complete, !picks.contains(i) else { return }
    CardImages.shared.prewarm(order[i])
    hovered = nil
    Sfx.shared.play(.slide, gain: 0.45)
    withAnimation(.spring(response: 0.64, dampingFraction: 0.76)) { picks.append(i) }

    Task { @MainActor in
      try? await Task.sleep(nanoseconds: 160_000_000)
      withAnimation(.easeInOut(duration: 0.5)) { _ = faceUp.insert(i) }
      Sfx.shared.play(.land, gain: 0.45, after: 0.16)
      Sfx.shared.play(.reveal, gain: 0.3, after: 0.2)
      try? await Task.sleep(nanoseconds: 300_000_000)
      flash(at: landing)
      guard complete else { return }
      try? await Task.sleep(nanoseconds: 620_000_000)
      Sfx.shared.play(.chord, gain: 0.26)
      withAnimation(.spring(response: 0.85, dampingFraction: 0.85)) { phase = .reading }
    }
  }

  func inspect(slot: Int) {
    guard phase == .reading, slot < picks.count else { return }
    Sfx.shared.play(.tick, gain: 0.4)
    withAnimation(.easeOut(duration: 0.3)) { inspecting = slot }
  }

  func closeInspector() {
    guard inspecting != nil else { return }
    withAnimation(.easeOut(duration: 0.25)) { inspecting = nil }
  }

  func findThread() {
    guard phase == .reading, complete, !weaving, weave == nil else { return }

    weaving = true
    weaveError = false
    let spreadSnapshot = spread
    let drawsSnapshot = picks.map { order[$0] }

    weaveTask?.cancel()
    weaveTask = Task { @MainActor [weak self] in
      do {
        let result = try await WeaveService.shared.make(
          spread: spreadSnapshot, draws: drawsSnapshot)
        guard let self, self.phase == .reading else { return }
        withAnimation(.easeOut(duration: 0.45)) {
          self.weave = result
          self.weaving = false
        }
        self.weaveTask = nil
      } catch is CancellationError {
        return
      } catch {
        guard let self, self.phase == .reading else { return }
        withAnimation(.easeOut(duration: 0.25)) {
          self.weaving = false
          self.weaveError = true
        }
        self.weaveTask = nil
      }
    }
  }

  func dismissWeave() {
    withAnimation(.easeOut(duration: 0.25)) {
      weave = nil
      weaveError = false
    }
  }

  func again() {
    weaveTask?.cancel()
    weaveTask = nil
    Sfx.shared.play(.slide, gain: 0.35)
    withAnimation(.easeInOut(duration: 0.45)) {
      inspecting = nil
      reading = nil
      weaving = false
      weave = nil
      weaveError = false
      dealt = false
      faceUp = []
      picks = []
      phase = .invocation
    }
    flashes = []
  }

  func toggleMute() {
    muted.toggle()
    Sfx.shared.enabled = !muted
    if !muted { Sfx.shared.play(.tick, gain: 0.4) }
  }

  func flash(at p: CGPoint, strength: Double = 1) {
    flashes.append(
      Flash(point: p, born: Date().timeIntervalSinceReferenceDate, strength: strength))
    if flashes.count > 10 { flashes.removeFirst(flashes.count - 10) }
  }
}

// ===================================================================
//  Layout — where every card sits, for a given window.
// ===================================================================

struct Layout {
  let size: CGSize
  let slots: Int
  let phase: Game.Phase

  private let ratio: CGFloat = 0.565  // 226 / 400

  var slotH: CGFloat {
    let n = CGFloat(slots)
    let solo = slots == 1
    let byHeight = size.height * (solo ? 0.46 : 0.325)
    let byWidth = (size.width * 0.84) / (n * ratio + (n - 1) * ratio * 0.2)
    return max(110, min(min(solo ? 380 : 268, byHeight), byWidth))
  }
  var slotW: CGFloat { slotH * ratio }

  var fanH: CGFloat { max(96, min(178, size.height * 0.215)) }
  var fanW: CGFloat { fanH * ratio }

  var rowY: CGFloat { size.height * (phase == .reading ? 0.46 : 0.33) }
  var promptY: CGFloat { size.height * (phase == .reading ? 0.79 : 0.60) }

  func slot(_ i: Int) -> CGPoint {
    let gap = slotW * 0.2
    let total = CGFloat(slots) * slotW + CGFloat(max(0, slots - 1)) * gap
    let x0 = (size.width - total) / 2 + slotW / 2
    return CGPoint(x: x0 + CGFloat(i) * (slotW + gap), y: rowY)
  }

  private var handY: CGFloat { size.height * 0.775 }

  /// A held hand: cards spaced along a shallow parabola, tilting outward.
  func fan(_ i: Int, of n: Int, lift: CGFloat) -> (point: CGPoint, angle: Double) {
    let t = n <= 1 ? 0.5 : Double(i) / Double(n - 1)
    let k = (t - 0.5) * 2  // -1 … 1
    let span = size.width * 0.74
    let sag = size.height * 0.055
    return (
      CGPoint(
        x: size.width / 2 + CGFloat(k) * span / 2,
        y: handY + CGFloat(k * k) * sag - lift),
      12.0 * k
    )
  }

  /// Before the cut: a squared-up stack, waiting.
  func stack(_ i: Int, of n: Int) -> (point: CGPoint, angle: Double) {
    let depth = CGFloat(n - i)
    return (
      CGPoint(x: size.width / 2 + CGFloat((i % 3) - 1) * 1.3, y: handY - depth * 0.95),
      Double((i % 5) - 2) * 0.3
    )
  }
}
