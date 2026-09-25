import SwiftUI

// ===================================================================
//  Game — five beats: the held question, the draw, the writing of each
//  card, the reading spoken back, and the cards returned.
// ===================================================================

/// The held question's charge, reckoned from the time: where it was, when,
/// and how fast it is moving — rising while held, falling twice as fast when
/// let go. It changes only as a hold begins, ends, completes or comes to
/// rest, so nothing redraws because of it; the small clocks that show the
/// charge read it for themselves.
struct ChargeClock: Equatable {
  var value = 0.0
  var at: TimeInterval = 0
  var rate = 0.0  // per second

  func value(at t: TimeInterval) -> Double { clamp01(value + rate * (t - at)) }
  var moving: Bool { rate != 0 }
}

/// How far one card's ink has sunk into the stock while the cards are
/// returned, 0…1. Each card watches only its own, so a tick redraws only
/// the card that is sinking.
@Observable
@MainActor
final class Sink {
  var v = 0.0
}

@Observable
@MainActor
final class Game {
  enum Phase { case invocation, draw, reading }

  /// One slow inhale.
  static let holdSeconds = 3.2
  /// How long a card takes to write itself once it lands face up.
  static let inkSeconds = 2.1

  var phase: Phase = .invocation
  var spreadIndex = 1
  var order: [Draw] = []
  var picks: [Int] = []
  var faceUp: Set<Int> = []
  var inked: Set<Int> = []
  var dealt = false
  var hovered: Int?
  var reading: Int?  // slot the cursor is resting on
  var inspecting: Int?  // slot opened full size
  var flashes: [Flash] = []
  var flare: Set<Int> = []  // slots whose light is flaring right now
  var threadLive = false  // light is moving along the thread; its clock runs
  var landed: [Int: TimeInterval] = [:]  // slot → when its card came down
  var openedAt: TimeInterval = 0  // when the altar was last opened
  var spark: TimeInterval?  // when light last ran the length of the thread
  var recited = 0  // lines of the reading spoken so far
  var muted = false
  var holding = false
  private(set) var chargeClock = ChargeClock()
  /// 0…1, how long the question has been held, now.
  var charge: Double { chargeClock.value(at: now) }
  var chargeMoving: Bool { chargeClock.moving }
  var weaving = false
  var weave: WeaveResult?
  var weaveError = false
  var quick = false  // reduce motion: shorter rituals, no writing

  // the return — the same held breath, given back
  var letting = 0.0  // 0…1, how long the return has been held
  var hush = 0.0  // 0…1, the room going quiet around the cards
  var sinks: [Int: Sink] = [:]  // order index → how far its ink has sunk
  var returning = false  // a return is being held, or draining back
  var sounded = false  // the recital's chord has rung
  var ringFrom: TimeInterval = 0  // the ring fades back in from here

  private var weaveTask: Task<Void, Never>?
  private var chargeTask: Task<Void, Never>?
  private var round = 0  // bumps whenever the table is cleared; stale tasks stand down
  private var rite = 0  // bumps whenever the cards go home; a return's tail checks it
  private var deckPoint: CGPoint = .zero
  private var buzzedHalf = false
  private var liveUntil: TimeInterval = 0
  private var turning = false  // the return is complete; the cards are going home
  private var rung: Set<Int> = []  // slots whose bowl has sounded in this return
  var homeward = false  // the cards have turned over; what is left on the table goes
  var roomLive = true  // the invocation can be touched; off until it has come back

  // as above — what the sky is answering (Answers.swift)
  var answers: [Answer] = []
  /// The answers still coming or being let go. Core Animation carries
  /// them; only a still sky (Reduce Motion) needs telling when to look again.
  private(set) var stirring: Set<Answer.Kind> = []
  private var stirredUntil: [Answer.Kind: TimeInterval] = [:]

  /// The thread is offered only when there is a key to find it with.
  private(set) var threadable = WeaveService.ready

  /// The window can be seen and the screens are awake. When it can't, every
  /// clock rests and the room falls silent; all of it is reckoned from the
  /// time, so it resumes in step.
  var visible = true {
    didSet { if visible != oldValue { Sfx.shared.present = visible } }
  }
  /// A flash has just gone out across the sky; the near sky's clock runs
  /// quick until its ripple is gone, then slows by itself.
  var skyQuick = false
  private var quickUntil: TimeInterval = 0

  /// What is holding the breath. A key and a finger can hold it together;
  /// it is let go only when the last of them lets go.
  enum Holder { case key, pointer }
  private var holders: Set<Holder> = []

  /// The question, if it is written. Views read it directly; the game
  /// never looks at what it says.
  let quill = Quill()

  var spread: Spread { Spread.all[spreadIndex] }
  var need: Int { spread.count }
  var complete: Bool { picks.count >= need }
  var recitalDone: Bool { recited >= need }

  /// The cards can be returned once the reading has been spoken and the
  /// chord has rung, the altar is closed and the thread is not being found.
  var canReturn: Bool {
    phase == .reading && sounded && inspecting == nil && !weaving && !turning
  }

  init() { reshuffle() }

  func slotIndex(ofOrder i: Int) -> Int? { picks.firstIndex(of: i) }
  func draw(atSlot s: Int) -> Draw? {
    guard s >= 0, s < picks.count else { return nil }
    return order[picks[s]]
  }

  private func reshuffle() {
    order = deck.map { Draw(card: $0, reversed: Double.random(in: 0..<1) < 0.42) }.shuffled()
  }

  private var now: TimeInterval { Date().timeIntervalSinceReferenceDate }

  /// The charge, from here on, moving at `rate` a second.
  private func setCharge(_ value: Double, rate: Double) {
    chargeClock = ChargeClock(value: value, at: now, rate: rate)
  }

  /// A still charge, for the shot tool.
  func poseCharge(_ c: Double) { chargeClock = ChargeClock(value: c, at: now, rate: 0) }

  // --- the held question ---------------------------------------------

  func chooseSpread(_ i: Int) {
    guard phase == .invocation, !holding, i >= 0, i < Spread.all.count, i != spreadIndex
    else { return }
    spreadIndex = i
    Sfx.shared.play(.tick, gain: 0.45)
  }

  /// Pressing and holding is how the question is asked, and, once the
  /// reading has been spoken, how the cards are given back. Letting go
  /// early lets the gathered light drain back out; nothing is lost.
  /// Called once, as the press begins — never again while it is held.
  func pressHold(_ layout: Layout, by holder: Holder) {
    if holding {
      holders.insert(holder)
      return
    }
    if phase == .invocation {
      quill.beginGiving()
      deckPoint = layout.deck
      holding = true
      holders = [holder]
      buzzedHalf = false
      let c = charge
      setCharge(c, rate: 1 / (quick ? 0.8 : Game.holdSeconds))
      if !quick { Sfx.shared.swellStart(from: c) }
      runCharge()
    } else if canReturn {
      holding = true
      holders = [holder]
      buzzedHalf = false
      if !returning {
        returning = true
        rung = []
        sinks = Dictionary(uniqueKeysWithValues: picks.map { ($0, Sink()) })
      }
      runCharge()
    }
  }

  /// Let go by one holder, or — with none named, as when the window is
  /// left — by all of them.
  func releaseHold(by holder: Holder? = nil) {
    if let holder {
      holders.remove(holder)
      guard holders.isEmpty else { return }
    } else {
      holders = []
    }
    guard holding else { return }
    holding = false
    if phase == .invocation, chargeClock.rate > 0 {
      let c = charge
      if c < 1 { Sfx.shared.swellStop() }
      setCharge(c, rate: -2 / (quick ? 0.8 : Game.holdSeconds))
    }
  }

  private func runCharge() {
    guard chargeTask == nil else { return }
    chargeTask = Task { @MainActor [weak self] in
      var last = Date().timeIntervalSinceReferenceDate
      while let self, !Task.isCancelled {
        try? await Task.sleep(nanoseconds: 16_000_000)
        let t = Date().timeIntervalSinceReferenceDate
        let dt = min(0.05, t - last)
        last = t
        let full = self.quick ? 0.8 : Game.holdSeconds
        // the charge is reckoned from the time; this loop only marks its
        // turns — half way, the cut, and coming to rest
        let c = self.charge
        if self.holding && self.phase == .invocation {
          if !self.buzzedHalf && c > 0.5 {
            self.buzzedHalf = true
            Haptics.pulse()
          }
          if c >= 1 {
            self.holding = false
            self.holders = []
            self.begin()
            self.setCharge(1, rate: -2 / full)
          }
        } else if self.chargeClock.rate > 0 {
          // a hold that ended without being let go drains like one that was
          self.setCharge(c, rate: -2 / full)
        } else if self.chargeClock.rate < 0 && c <= 0 {
          self.setCharge(0, rate: 0)
        }
        if self.phase == .invocation {
          Sfx.shared.mood(0.42 + 0.5 * Float(c))
          self.quill.peak = c > 0 ? max(self.quill.peak, c) : 0
        }
        if self.phase == .reading && self.returning && !self.turning {
          self.letting =
            self.holding
            ? min(1, self.letting + dt / full) : max(0, self.letting - dt / (full * 0.5))
          self.settleReturn()
          if self.letting >= 1 {
            self.holding = false
            self.holders = []
            self.returnCards()
          } else if !self.holding && self.letting <= 0 {
            self.returning = false
            self.sinks = [:]
          }
        }
        let returnLive = self.returning && !self.turning
        if !self.holding && !self.chargeMoving && !returnLive {
          self.chargeTask = nil
          return
        }
      }
    }
  }

  // --- the return -----------------------------------------------------

  /// The span of the return across which card `k` of `n` sinks. The last
  /// drawn goes first; each window is two staggers long, so the eye can
  /// follow one card at a time.
  static func window(_ k: Int, of n: Int) -> (Double, Double) {
    guard n > 1 else { return (0.30, 0.84) }
    let s = 0.54 / Double(n + 1)
    let a = 0.30 + Double(n - 1 - k) * s
    return (a, a + 2 * s)
  }

  /// Everything the return shows follows from how long it has been held:
  /// first the room goes quiet, then each card's ink sinks into its stock.
  /// Only what has changed is written, so a tick redraws only what moves.
  func settleReturn(sounding: Bool = true) {
    let L = letting
    let h = ramp(L, 0.08, 0.30)
    if h != hush { hush = h }
    // the lit line fades with the rest; the highlight is let go only once
    // the verse is gone, so no dimmed line brightens on the way out
    if h >= 1, reading != nil { reading = nil }
    for s in 0..<min(picks.count, need) {
      guard let sink = sinks[picks[s]] else { continue }
      let (a, b) = Game.window(s, of: need)
      let v = pow(clamp01((L - a) / (b - a)), 1.8)
      if sink.v != v { sink.v = v }
      guard sounding else { continue }
      // each card's bowl sounds as it begins to sink, so the card goes
      // quiet as its note fades; let go before, and it waits to sound again
      if holding && L >= a && !rung.contains(s) {
        rung.insert(s)
        if let d = draw(atSlot: s) {
          Sfx.shared.tone(
            midi: spread.notes[s] - (d.reversed ? 12 : 0), dark: d.reversed,
            gain: 0.20, pan: pan(s))
        }
      } else if L < a && rung.contains(s) {
        rung.remove(s)
      }
    }
    guard sounding else { return }
    Sfx.shared.mood(0.78 - 0.48 * Float(ramp(L, 0.08, 1)))
    if holding && !buzzedHalf && L > 0.5 {
      buzzedHalf = true
      Haptics.pulse()
    }
  }

  /// The breath is complete: the pressed faces turn over into backs, and
  /// the cards go home to the deck.
  private func returnCards() {
    turning = true
    rite += 1
    let rite = self.rite
    Haptics.land()
    Sfx.shared.play(.slide, gain: 0.22)
    withAnimation(.easeInOut(duration: 0.5)) { faceUp = [] }
    withAnimation(.easeOut(duration: 0.45)) { homeward = true }
    // the rest of the deck is folded away while it cannot be seen, so only
    // the spread travels home, and it travels together
    var still = Transaction()
    still.disablesAnimations = true
    withTransaction(still) { dealt = false }
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: 450_000_000)
      guard let self, self.rite == rite else { return }
      self.round += 1
      withAnimation(.spring(response: 0.8, dampingFraction: 0.86)) { self.clearTable() }
      self.ringFrom = self.now + 0.6
      Sfx.shared.mood(0.42)
      try? await Task.sleep(nanoseconds: 600_000_000)
      guard self.rite == rite else { return }
      Sfx.shared.play(.land, gain: 0.25)
      self.forgetReturn()
    }
  }

  // --- beats --------------------------------------------------------

  func begin() {
    guard phase == .invocation else { return }
    round += 1
    reshuffle()
    picks = []
    faceUp = []
    inked = []
    flashes = []
    flare = []
    landed = [:]
    spark = nil
    recited = 0
    inspecting = nil
    reading = nil
    weaving = false
    weave = nil
    weaveError = false
    sounded = false
    letting = 0
    hush = 0
    sinks = [:]
    returning = false
    turning = false
    homeward = false
    answers = []
    threadable = WeaveService.ready
    phase = .draw
    // the deck has taken the question; the line is empty
    quill.give()
    Haptics.land()
    Sfx.shared.swellStop(fade: 0.5)
    Sfx.shared.play(.cut, gain: 0.8)
    Sfx.shared.tone(midi: 48, dark: true, gain: 0.55)
    Sfx.shared.mood(0.62)
    flash(at: deckPoint, strength: 1.5)
    withAnimation(.spring(response: 0.95, dampingFraction: 0.8)) { dealt = true }
  }

  /// The hand moves across the fan; each card it passes sounds.
  func hover(_ i: Int?) {
    guard hovered != i else { return }
    hovered = i
    if let i, phase == .draw, !complete {
      Sfx.shared.chime(position: i, of: order.count)
    }
  }

  func take(_ i: Int, landing: CGPoint) {
    guard phase == .draw, !complete, !picks.contains(i) else { return }
    CardImages.shared.prewarm(order[i])
    hovered = nil
    let slot = picks.count
    let round = self.round
    let d = order[i]
    Haptics.tap()
    Sfx.shared.play(.slide, gain: 0.45)
    withAnimation(.spring(response: 0.64, dampingFraction: 0.76)) { picks.append(i) }

    Task { @MainActor in
      try? await Task.sleep(nanoseconds: 160_000_000)
      guard self.round == round else { return }
      withAnimation(.easeInOut(duration: 0.5)) { _ = faceUp.insert(i) }
      Sfx.shared.play(.land, gain: 0.4, after: 0.16)
      Sfx.shared.tone(
        midi: spread.notes[slot] - (d.reversed ? 12 : 0), dark: d.reversed,
        gain: 0.5, pan: pan(slot), after: 0.26)
      try? await Task.sleep(nanoseconds: 300_000_000)
      guard self.round == round else { return }
      flash(at: landing)
      glow(slot)
      landed[slot] = now
      liven(for: 1.0)
      if quick {
        inked.insert(i)
      } else {
        withAnimation(.easeInOut(duration: Game.inkSeconds)) { _ = inked.insert(i) }
      }
      answerLater(d, card: i, round: round)
      guard complete else { return }
      try? await Task.sleep(nanoseconds: UInt64(((quick ? 0.2 : Game.inkSeconds) + 0.35) * 1e9))
      guard self.round == round, phase == .draw else { return }
      Sfx.shared.mood(0.78)
      withAnimation(.spring(response: 1.1, dampingFraction: 0.86)) { phase = .reading }
      recite(round: round)
    }
  }

  /// The reading is spoken back, one line at a time, each card sounding
  /// again as its line appears; then light runs the thread and the whole
  /// spread rings as one chord.
  private func recite(round: Int) {
    recited = 0
    sounded = false
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: 900_000_000)
      guard let self else { return }
      // a written question is read back first, on the bowl the deck took
      // it on; then the verse answers beneath it
      if !self.quill.asked.isEmpty {
        guard self.round == round, self.phase == .reading else { return }
        self.quill.readBack()
        Sfx.shared.tone(midi: 48, dark: true, gain: 0.3)
        try? await Task.sleep(nanoseconds: self.quick ? 500_000_000 : 1_800_000_000)
      }
      for s in 0..<self.need {
        guard self.round == round, self.phase == .reading else { return }
        // the face this card will leave in the stock when it is returned,
        // made now, before its line begins, so no motion is interrupted
        if let d = self.draw(atSlot: s) { _ = CardImages.shared.blank(d) }
        withAnimation(.easeOut(duration: 1.1)) { self.recited = s + 1 }
        self.glow(s)
        if let d = self.draw(atSlot: s) {
          Sfx.shared.tone(
            midi: self.spread.notes[s] - (d.reversed ? 12 : 0), dark: d.reversed,
            gain: 0.26, pan: self.pan(s))
        }
        try? await Task.sleep(nanoseconds: self.quick ? 150_000_000 : 1_450_000_000)
      }
      guard self.round == round, self.phase == .reading else { return }
      self.runSpark()
      Sfx.shared.chord(
        (0..<self.need).compactMap { s in
          self.draw(atSlot: s).map { (self.spread.notes[s] - ($0.reversed ? 12 : 0), $0.reversed) }
        }, gain: 0.34)
      self.sounded = true
      // and now and then, while the reading lies open, light runs the
      // thread again
      while true {
        try? await Task.sleep(nanoseconds: 13_000_000_000)
        guard self.round == round, self.phase == .reading else { return }
        if self.inspecting == nil && !self.weaving && !self.returning && self.visible {
          self.runSpark()
        }
      }
    }
  }

  /// A card's light flares, then settles.
  private func glow(_ slot: Int) {
    withAnimation(.easeOut(duration: 0.3)) { _ = flare.insert(slot) }
    let round = self.round
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: 350_000_000)
      guard let self, self.round == round else { return }
      withAnimation(.easeInOut(duration: 1.6)) { _ = self.flare.remove(slot) }
    }
  }

  private func runSpark() {
    spark = now
    liven(for: 1.9)
  }

  /// Keep the thread's clock running for a while; it stops by itself.
  private func liven(for seconds: Double) {
    liveUntil = max(liveUntil, now + seconds)
    threadLive = true
    let round = self.round
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: UInt64((seconds + 0.05) * 1e9))
      guard let self, self.round == round else { return }
      if self.now >= self.liveUntil && !self.weaving { self.threadLive = false }
    }
  }

  // --- as above -------------------------------------------------------

  /// A card has landed face up and is writing itself. If it is one of the
  /// four already in the sky, the sky answers it once it is written.
  private func answerLater(_ d: Draw, card i: Int, round: Int) {
    guard Answer(d, card: i, from: 0) != nil else { return }
    let wait = quick ? 0.2 : Game.inkSeconds
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: UInt64(wait * 1e9))
      guard let self, self.round == round, self.phase != .invocation,
        let a = Answer(d, card: i, from: self.now)
      else { return }
      self.answers.append(a)
      self.stir(a.kind, for: a.length(quick: self.quick))
    }
  }

  /// Mark one answer as moving for a while; it comes to rest by itself.
  private func stir(_ kind: Answer.Kind, for seconds: Double) {
    stirredUntil[kind] = max(stirredUntil[kind] ?? 0, now + seconds)
    if !stirring.contains(kind) { stirring.insert(kind) }
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: UInt64((seconds + 0.05) * 1e9))
      guard let self, self.now >= self.stirredUntil[kind] ?? 0 else { return }
      self.stirring.remove(kind)
    }
  }

  /// The sky's answers to the cards on the table, posed as begun at `t`:
  /// long ago for the shot tool's stills, or just now.
  func poseAnswers(from t: TimeInterval) {
    answers = picks.compactMap { Answer(order[$0], card: $0, from: t) }
    for a in answers where a.from + a.length(quick: quick) > now {
      stir(a.kind, for: a.from + a.length(quick: quick) - now)
    }
  }

  private func pan(_ slot: Int) -> Float {
    need <= 1 ? 0 : Float(Double(slot) / Double(need - 1) * 2 - 1) * 0.55
  }

  func inspect(slot: Int) {
    guard phase == .reading, !returning, slot < picks.count, let d = draw(atSlot: slot)
    else { return }
    Sfx.shared.play(.tick, gain: 0.35)
    Sfx.shared.tone(
      midi: spread.notes[slot] - (d.reversed ? 12 : 0), dark: d.reversed, gain: 0.3, pan: pan(slot))
    Sfx.shared.mood(0.6)
    openedAt = now
    withAnimation(.easeOut(duration: 0.45)) { inspecting = slot }
  }

  func closeInspector() {
    guard inspecting != nil else { return }
    Sfx.shared.mood(0.78)
    withAnimation(.easeOut(duration: 0.3)) { inspecting = nil }
  }

  func findThread() {
    guard threadable, phase == .reading, complete, !weaving, !returning, weave == nil else {
      return
    }

    weaving = true
    threadLive = true
    weaveError = false
    let spreadSnapshot = spread
    let drawsSnapshot = picks.map { order[$0] }

    weaveTask?.cancel()
    weaveTask = Task { @MainActor [weak self] in
      do {
        let result = try await WeaveService.shared.make(
          spread: spreadSnapshot, draws: drawsSnapshot)
        guard let self, self.phase == .reading else { return }
        Sfx.shared.chord(
          (0..<self.need).compactMap { s in
            self.draw(atSlot: s).map {
              (self.spread.notes[s] - ($0.reversed ? 12 : 0), $0.reversed)
            }
          }, gain: 0.22)
        withAnimation(.easeOut(duration: 0.9)) {
          self.weave = result
          self.weaving = false
        }
        self.runSpark()
        self.weaveTask = nil
      } catch is CancellationError {
        return
      } catch {
        guard let self, self.phase == .reading else { return }
        withAnimation(.easeOut(duration: 0.25)) {
          self.weaving = false
          self.weaveError = true
        }
        self.liven(for: 0.1)
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

  /// The plain door: the table is cleared at once, whatever state it is
  /// in. Each face keeps what it shows until it has turned away.
  func again() {
    round += 1
    rite += 1
    weaveTask?.cancel()
    weaveTask = nil
    Sfx.shared.play(.slide, gain: 0.35)
    Sfx.shared.mood(0.42)
    // whatever the sky was answering goes with the table
    let t = now
    for k in answers.indices where answers[k].until == .infinity {
      answers[k].until = t
      stir(answers[k].kind, for: Answer.fade)
    }
    withAnimation(.easeInOut(duration: 0.6)) { clearTable() }
    ringFrom = now + 0.3
    let round = self.round
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: 600_000_000)
      guard let self, self.round == round else { return }
      self.forgetReturn()
    }
  }

  /// Everything a reading laid on the table, taken off it. The sinking
  /// faces and the quiet room are left for `forgetReturn`, once the cards
  /// have turned away — clearing them here would flash the ink back.
  private func clearTable() {
    inspecting = nil
    reading = nil
    weaving = false
    weave = nil
    weaveError = false
    dealt = false
    faceUp = []
    picks = []
    phase = .invocation
    quill.forget()
    recited = 0
    flare = []
    landed = [:]
    spark = nil
    flashes = []
    threadLive = false
    holding = false
    holders = []
    returning = false
    turning = false
    sounded = false
    letting = 0
    rung = []
    // the room is not there to be touched until it has come back
    roomLive = false
    let round = self.round
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: 450_000_000)
      guard let self, self.round == round else { return }
      self.roomLive = true
    }
  }

  private func forgetReturn() {
    // each answer went with its card's ink, or with the table; the sky is its own again
    answers = []
    stirredUntil = [:]
    stirring = []
    sinks = [:]
    hush = 0
    homeward = false
    if phase == .invocation { inked = [] }
    CardImages.shared.forgetBlanks()
    CardImages.shared.forgetFaces()
  }

  func toggleMute() {
    muted.toggle()
    Sfx.shared.enabled = !muted
    if !muted { Sfx.shared.play(.tick, gain: 0.4) }
  }

  func flash(at p: CGPoint, strength: Double = 1) {
    flashes.append(Flash(point: p, born: now, strength: strength))
    if flashes.count > 10 { flashes.removeFirst(flashes.count - 10) }
    quickUntil = max(quickUntil, now + 2.3)
    if !skyQuick { skyQuick = true }
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: 2_350_000_000)
      guard let self, self.now >= self.quickUntil else { return }
      self.skyQuick = false
    }
  }
}

// ===================================================================
//  Haptics — on a Force Touch trackpad the table answers the finger.
// ===================================================================

@MainActor
enum Haptics {
  static func tap() {
    NSHapticFeedbackManager.defaultPerformer.perform(.alignment, performanceTime: .now)
  }
  static func pulse() {
    NSHapticFeedbackManager.defaultPerformer.perform(.generic, performanceTime: .now)
  }
  static func land() {
    NSHapticFeedbackManager.defaultPerformer.perform(.levelChange, performanceTime: .now)
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
    let byHeight = size.height * (solo ? (phase == .reading ? 0.44 : 0.36) : 0.31)
    let byWidth = (size.width * 0.84) / (n * ratio + (n - 1) * ratio * 0.2)
    return max(110, min(min(solo ? 360 : 262, byHeight), byWidth))
  }
  var slotW: CGFloat { slotH * ratio }

  var fanH: CGFloat { max(96, min(178, size.height * 0.215)) }
  var fanW: CGFloat { fanH * ratio }

  var rowY: CGFloat {
    size.height * (phase == .reading ? (slots == 1 ? 0.38 : 0.36) : 0.33)
  }
  var promptY: CGFloat { size.height * 0.60 }

  /// The thread runs just under the row; the names of the positions hang from it.
  var threadY: CGFloat { rowY + slotH / 2 + 26 }
  var labelY: CGFloat { threadY + 20 }

  /// The reading is spoken beneath the names, and the quiet controls
  /// sit at the foot of the stage.
  var stanzaTop: CGFloat { labelY + 38 }
  var askY: CGFloat { size.height - 32 }
  var inviteY: CGFloat { askY - 44 }

  func slot(_ i: Int) -> CGPoint {
    let gap = slotW * 0.2
    let total = CGFloat(slots) * slotW + CGFloat(max(0, slots - 1)) * gap
    let x0 = (size.width - total) / 2 + slotW / 2
    return CGPoint(x: x0 + CGFloat(i) * (slotW + gap), y: rowY)
  }

  private var handY: CGFloat { size.height * 0.775 }

  /// The squared deck's centre, and the ring the question is held in.
  var deck: CGPoint { CGPoint(x: size.width / 2, y: handY - 11) }
  var ringR: CGFloat { fanH * 0.66 }

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

  /// Before the cut: a squared deck lying on the table. The top card is
  /// highest; the edges of the rest show beneath it, as a deck's front
  /// face does when you look down at it.
  func stack(_ i: Int, of n: Int) -> (point: CGPoint, angle: Double) {
    let depth = CGFloat(n - 1 - i)
    return (CGPoint(x: size.width / 2, y: handY - 16 + depth * 0.5), 0)
  }
}
