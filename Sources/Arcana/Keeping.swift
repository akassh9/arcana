import AppKit
import SwiftUI

// ===================================================================
//  What the moon keeps — every reading that is returned. As the cards
//  go home the reading is kept: the spread, each card and which way up
//  it lay, the question if one was written, the thread if it was found,
//  and when it was asked. The moon brightens for one breath as it takes
//  it. A reading let go with esc is not kept.
//
//  The moon is the door. Press it, and the room clears, and the last
//  reading lies on the table as the return left it: the question in ink,
//  the cards pressed blank, keeping their gold. The moon turns back to
//  how it was that night. Hold, and the return runs backwards: the ink
//  rises out of the stock, first card first, each bowl ringing back up,
//  and the reading is spoken again, and its thread if it had one.
//
//  One moon after a reading, when the moon is back where it was that
//  night, its question comes back under it.
//
//  Kept only on this Mac, in one small file — kept.json, in Arcana's
//  folder in Application Support — and sent nowhere. Nothing is counted:
//  no totals, no streaks, no reminders.
// ===================================================================

/// A reading as the moon keeps it.
struct Kept: Codable, Identifiable, Equatable {
  struct Laid: Codable, Equatable {
    let card: String
    let reversed: Bool
  }

  var id = UUID()
  /// When the question was asked.
  let at: Date
  let spread: String
  let cards: [Laid]
  let question: String?
  let thread: WeaveResult?
  /// When the moon brought its question back, if it has.
  var broughtBack: Date?

  init(at: Date, spread: Spread, draws: [Draw], question: String, thread: WeaveResult?) {
    self.at = at
    self.spread = spread.id
    cards = draws.map { Laid(card: $0.card.id, reversed: $0.reversed) }
    self.question = question.isEmpty ? nil : question
    self.thread = thread
  }

  /// Its spread and cards, if this deck still knows them all.
  var laid: (spread: Spread, draws: [Draw])? {
    guard let s = Spread.all.first(where: { $0.id == spread }) else { return nil }
    let draws = cards.compactMap { c in
      deck.first { $0.id == c.card }.map { Draw(card: $0, reversed: c.reversed) }
    }
    guard draws.count == s.count else { return nil }
    return (s, draws)
  }
}

/// One reading on the table while the moon's door is open. When the page is
/// turned a new leaf is laid, and the old one leaves as it was.
@Observable
@MainActor
final class Leaf {
  let kept: Kept
  let spread: Spread
  let draws: [Draw]
  /// How far each card's ink is sunk into its stock: 1 as the return left
  /// it, 0 risen. Each card watches only its own.
  let sinks: [Sink]
  /// The thread's question and the invitation to hold, going out as the
  /// first ink rises: 0…1.
  var stir = 0.0
  /// The room coming back about the cards as the last ink rises: 0…1.
  var wake = 0.0
  /// The ink has risen; the reading is spoken again.
  var risen = false
  var recited = 0
  var sounded = false
  /// The thread, if it was found, has taken the verse's place.
  var threaded = false
  /// The slot the cursor rests on, once the reading is remembered.
  var reading: Int?
  /// Cards whose light is flaring as their line is spoken.
  var flare: Set<Int> = []

  init?(_ kept: Kept) {
    guard let laid = kept.laid else { return nil }
    self.kept = kept
    spread = laid.spread
    draws = laid.draws
    sinks = laid.draws.map { _ in
      let s = Sink()
      s.v = 1
      return s
    }
  }
}

@Observable
@MainActor
final class Keeping {
  /// Where the readings are kept: kept.json in Arcana's folder in
  /// Application Support, or the file ARCANA_KEPT names. nil keeps them in
  /// memory only, as the shot tool does, so no reading of yours is drawn.
  static var file: URL? = {
    if let p = ProcessInfo.processInfo.environment["ARCANA_KEPT"], !p.isEmpty {
      return URL(fileURLWithPath: (p as NSString).expandingTildeInPath)
    }
    return FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first?
      .appendingPathComponent("Arcana", isDirectory: true)
      .appendingPathComponent("kept.json")
  }()

  /// Every reading kept, oldest first.
  private(set) var readings: [Kept] = []
  /// Readings whose cards this deck does not know: never laid on the table,
  /// never lost — written back with the rest.
  @ObservationIgnored private var aside: [Kept] = []
  /// False when the file is there but could not be read, nor set aside:
  /// then nothing is written over it.
  @ObservationIgnored private var writable = true

  // --- the door --------------------------------------------------------

  private(set) var open = false
  /// The reading on the table, as its place in `readings`.
  private(set) var page = 0
  private(set) var leaf: Leaf?
  /// Which way the last turn went: -1 back in time, 1 toward tonight, 0
  /// for none — the door opening, or a reading let go.
  private(set) var heading = 0
  var moonHover = false
  /// When the moon last took a reading; it brightens for one breath.
  private(set) var tookAt: TimeInterval?
  private(set) var holding = false
  /// The slot of the reading on the table whose card is open on the altar.
  private(set) var inspecting: Int?
  private(set) var altarAt: TimeInterval = 0

  /// When the door last opened and closed; polled by the near sky, whose
  /// ring goes out and comes back with the room. Never observed.
  @ObservationIgnored private(set) var openedAt: TimeInterval = 0
  @ObservationIgnored private(set) var closedAt: TimeInterval = -.infinity

  @ObservationIgnored private var holders: Set<Game.Holder> = []
  @ObservationIgnored private var rising = 0.0  // 0…1, how long the ink has been held up
  @ObservationIgnored private var rung: Set<Int> = []
  @ObservationIgnored private var buzzedHalf = false
  @ObservationIgnored private var task: Task<Void, Never>?
  @ObservationIgnored private var rite = 0  // bumps with each leaf; a stale task stands down
  @ObservationIgnored private var quick = false

  init() {
    let (found, writable) = Keeping.load()
    let all = found.sorted { $0.at < $1.at }
    readings = all.filter { $0.laid != nil }
    aside = all.filter { $0.laid == nil }
    self.writable = writable
  }

  private var now: TimeInterval { Date().timeIntervalSinceReferenceDate }

  // --- keeping ---------------------------------------------------------

  /// The cards are going home: the moon keeps the reading.
  func keep(_ k: Kept, glowing at: TimeInterval) {
    readings.append(k)
    save()
    tookAt = at
  }

  /// The reading on the table is let go, for good.
  func letGo() {
    guard open, !holding, inspecting == nil, readings.indices.contains(page) else { return }
    readings.remove(at: page)
    save()
    Sfx.shared.tone(midi: 48, dark: true, gain: 0.22)
    guard !readings.isEmpty else {
      closeDoor()
      return
    }
    // the one before it, or, if it was the first, the one after
    page = max(0, page - 1)
    heading = 0
    lay()
  }

  /// The reading whose question the moon brings back tonight: one asked a
  /// moon ago, now the moon is where it was then. Only the latest, and only
  /// until its door has been opened.
  func comingBack(at date: Date = Date()) -> Kept? {
    readings.last { k in
      guard k.question != nil, k.broughtBack == nil else { return false }
      let age = date.timeIntervalSince(k.at)
      return age >= Moon.synodic - 12 * 3600 && age < Moon.synodic + 36 * 3600
    }
  }

  // --- the door, opened --------------------------------------------------

  /// Open at the reading the moon has brought back, if there is one, or at
  /// the last one kept.
  func openDoor(quick: Bool) {
    guard !open, !readings.isEmpty else { return }
    self.quick = quick
    if let back = comingBack(), let i = readings.firstIndex(where: { $0.id == back.id }) {
      // the others asked that night have come back with it
      let night = back.at.timeIntervalSince1970
      for j in readings.indices
      where abs(readings[j].at.timeIntervalSince1970 - night) < 36 * 3600
        && readings[j].broughtBack == nil
      {
        readings[j].broughtBack = Date()
      }
      save()
      page = i
    } else {
      page = readings.count - 1
    }
    heading = 0
    openedAt = now
    open = true
    Sfx.shared.play(.slide, gain: 0.22)
    Sfx.shared.tone(midi: 79, dark: false, gain: 0.12, after: 0.1)
    lay()
  }

  func closeDoor() {
    guard open else { return }
    if inspecting != nil { withAnimation(.easeOut(duration: 0.3)) { inspecting = nil } }
    rite += 1
    task?.cancel()
    task = nil
    holding = false
    holders = []
    open = false
    closedAt = now
    Sfx.shared.play(.slide, gain: 0.25)
    Sfx.shared.mood(0.42)
    Task { @MainActor [weak self] in
      // once the page has gone, its images are let go
      try? await Task.sleep(nanoseconds: 700_000_000)
      guard let self, !self.open else { return }
      self.leaf = nil
      CardImages.shared.forgetBlanks()
      CardImages.shared.forgetFaces()
    }
  }

  /// Turn to the reading before (-1) or after (1) this one.
  func turn(_ d: Int) {
    guard open, !holding, inspecting == nil, readings.indices.contains(page + d) else { return }
    heading = d
    page += d
    lay()
    Sfx.shared.play(.slide, gain: 0.18)
    if !quick { Sfx.shared.mood(0.42) }
  }

  var hasBefore: Bool { page > 0 }
  var hasAfter: Bool { page < readings.count - 1 }

  /// A night's moon takes a moment to paint; the ones the door may open on
  /// or turn to are painted, off the main thread, before they are needed —
  /// as the hand comes to the moon, and once a reading is on the table.
  func prepare(scale: CGFloat) {
    if !open {
      if let k = comingBack() ?? readings.last { paint(k, scale) }
    } else {
      for i in [page - 1, page + 1] where readings.indices.contains(i) { paint(readings[i], scale) }
    }
  }

  private func paint(_ k: Kept, _ scale: CGFloat) {
    Moon(date: k.at).prepare(radius: Sky.moonRadius, scale: scale)
  }

  // --- the altar ---------------------------------------------------------

  /// The card on the altar and the name of its place, if one is open.
  var altar: (draw: Draw, label: String)? {
    guard let s = inspecting, let leaf, s < leaf.draws.count else { return nil }
    return (leaf.draws[s], leaf.spread.slots[s])
  }

  /// Once a reading is remembered, a card of it opens on the altar, as a
  /// card on the table does.
  func inspect(_ slot: Int) {
    guard open, let leaf, leaf.risen, !holding, inspecting == nil, slot < leaf.draws.count
    else { return }
    let d = leaf.draws[slot]
    Sfx.shared.play(.tick, gain: 0.35)
    Sfx.shared.tone(
      midi: leaf.spread.notes[slot] - (d.reversed ? 12 : 0), dark: d.reversed, gain: 0.3,
      pan: Keeping.pan(slot, of: leaf.draws.count))
    Sfx.shared.mood(0.6)
    altarAt = now
    withAnimation(.easeOut(duration: 0.45)) { inspecting = slot }
  }

  func closeAltar() {
    guard inspecting != nil else { return }
    Sfx.shared.mood(0.78)
    withAnimation(.easeOut(duration: 0.3)) { inspecting = nil }
  }

  /// Lay the reading at `page` on the table, as the return left it — or,
  /// with Reduce Motion, already risen.
  private func lay() {
    rite += 1
    task?.cancel()
    task = nil
    holding = false
    holders = []
    rising = 0
    rung = []
    buzzedHalf = false
    guard readings.indices.contains(page), let l = Leaf(readings[page]) else {
      leaf = nil
      return
    }
    // made before the page arrives, so nothing hitches as it comes
    for d in l.draws { _ = CardImages.shared.blank(d) }
    leaf = l
    // the nights either side, made ready for a turn
    prepare(scale: NSScreen.main?.backingScaleFactor ?? 2)
    if quick {
      for d in l.draws { _ = CardImages.shared.face(d) }
      rising = 1
      settle(sounding: false)
      remember()
    }
  }

  // --- remembering: the return, run backwards ----------------------------

  /// Pressing and holding, while a reading lies pressed on the table,
  /// brings its ink back. Letting go early lets it sink again.
  func press(by holder: Game.Holder) {
    guard open, let leaf, !leaf.risen, inspecting == nil else { return }
    if holding {
      holders.insert(holder)
      return
    }
    holding = true
    holders = [holder]
    buzzedHalf = false
    // the faces the ink rises into, made before the first of it moves
    for d in leaf.draws { _ = CardImages.shared.face(d) }
    run()
  }

  /// Let go by one holder, or by all of them.
  func release(by holder: Game.Holder?) {
    if let holder {
      holders.remove(holder)
      guard holders.isEmpty else { return }
    } else {
      holders = []
    }
    guard holding else { return }
    holding = false
  }

  private func run() {
    guard task == nil else { return }
    let rite = self.rite
    task = Task { @MainActor [weak self] in
      var last = Date().timeIntervalSinceReferenceDate
      while let self, !Task.isCancelled, self.rite == rite {
        try? await Task.sleep(nanoseconds: 16_000_000)
        guard !Task.isCancelled, self.rite == rite else { return }
        let t = Date().timeIntervalSinceReferenceDate
        let dt = min(0.05, t - last)
        last = t
        let full = Game.holdSeconds
        self.rising =
          self.holding
          ? min(1, self.rising + dt / full) : max(0, self.rising - dt / (full * 0.5))
        self.settle()
        if self.rising >= 1 {
          self.holding = false
          self.holders = []
          self.task = nil
          self.remember()
          return
        }
        if !self.holding && self.rising <= 0 {
          self.task = nil
          return
        }
      }
    }
  }

  /// The span of the hold across which card `k` of `n` rises: the return's
  /// own, run backwards, so the first card drawn is the first to come back.
  static func window(_ k: Int, of n: Int) -> (Double, Double) {
    let (a, b) = Game.window(k, of: n)
    return (1 - b, 1 - a)
  }

  static func pan(_ slot: Int, of n: Int) -> Float {
    n <= 1 ? 0 : Float(Double(slot) / Double(n - 1) * 2 - 1) * 0.55
  }

  /// Everything the page shows follows from how long it has been held.
  /// Only what has changed is written, so a tick redraws only what moves.
  private func settle(sounding: Bool = true) {
    guard let leaf else { return }
    let R = rising
    let n = leaf.draws.count
    let stir = ramp(R, 0, 0.16)
    if leaf.stir != stir { leaf.stir = stir }
    // the return's quiet, given back: the room comes back after the ink
    let wake = ramp(R, 0.70, 0.92)
    if leaf.wake != wake { leaf.wake = wake }
    for s in 0..<n {
      let (a, b) = Keeping.window(s, of: n)
      let v = pow(1 - clamp01((R - a) / (b - a)), 1.8)
      if leaf.sinks[s].v != v { leaf.sinks[s].v = v }
      guard sounding else { continue }
      // each bowl rings as its ink begins to rise, so the chord comes back
      // up from the root; let go before, and it waits to ring again
      if holding && R >= a && !rung.contains(s) {
        rung.insert(s)
        let d = leaf.draws[s]
        Sfx.shared.tone(
          midi: leaf.spread.notes[s] - (d.reversed ? 12 : 0), dark: d.reversed, gain: 0.20,
          pan: Keeping.pan(s, of: n))
      } else if R < a && rung.contains(s) {
        rung.remove(s)
      }
    }
    guard sounding else { return }
    Sfx.shared.mood(0.42 + 0.36 * Float(ramp(R, 0.05, 1)))
    if holding && !buzzedHalf && R > 0.5 {
      buzzedHalf = true
      Haptics.pulse()
    }
  }

  /// The ink has risen: the reading is spoken again, a line at a time, each
  /// card sounding as its line appears; then the whole spread rings, and
  /// the thread, if it was found, is set where the verse was.
  private func remember() {
    guard let leaf else { return }
    leaf.risen = true
    let rite = self.rite
    let quick = self.quick
    let n = leaf.draws.count
    if !quick { Haptics.land() }
    Sfx.shared.mood(0.78)
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: quick ? 100_000_000 : 700_000_000)
      for s in 0..<n {
        guard let self, self.rite == rite else { return }
        withAnimation(.easeOut(duration: 1.1)) { leaf.recited = s + 1 }
        self.glow(leaf, s)
        let d = leaf.draws[s]
        Sfx.shared.tone(
          midi: leaf.spread.notes[s] - (d.reversed ? 12 : 0), dark: d.reversed, gain: 0.26,
          pan: Keeping.pan(s, of: n))
        try? await Task.sleep(nanoseconds: quick ? 150_000_000 : 1_450_000_000)
      }
      guard let self, self.rite == rite else { return }
      Sfx.shared.chord(
        leaf.draws.indices.map { s in
          (leaf.spread.notes[s] - (leaf.draws[s].reversed ? 12 : 0), leaf.draws[s].reversed)
        }, gain: 0.34)
      leaf.sounded = true
      guard leaf.kept.thread != nil else { return }
      try? await Task.sleep(nanoseconds: quick ? 200_000_000 : 2_600_000_000)
      guard self.rite == rite else { return }
      withAnimation(.easeOut(duration: 0.9)) { leaf.threaded = true }
    }
  }

  /// A card's light flares as its line is spoken, then settles — at once,
  /// if its page has gone, so nothing is left animating on a page leaving.
  private func glow(_ leaf: Leaf, _ s: Int) {
    withAnimation(.easeOut(duration: 0.3)) { _ = leaf.flare.insert(s) }
    let rite = self.rite
    Task { @MainActor [weak self] in
      try? await Task.sleep(nanoseconds: 350_000_000)
      guard let self, self.rite == rite else {
        leaf.flare.remove(s)
        return
      }
      withAnimation(.easeInOut(duration: 1.6)) { _ = leaf.flare.remove(s) }
    }
  }

  // --- the file ----------------------------------------------------------

  private struct Shelf: Codable {
    var readings: [Kept]
  }

  private static let encoder: JSONEncoder = {
    let e = JSONEncoder()
    e.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
    e.dateEncodingStrategy = .iso8601
    return e
  }()

  private static let decoder: JSONDecoder = {
    let d = JSONDecoder()
    d.dateDecodingStrategy = .iso8601
    return d
  }()

  /// The readings in the file, and whether it may be written. No file yet
  /// is an empty shelf; a file that cannot be read is set aside, never
  /// written over, and if it cannot even be set aside it is left alone.
  private static func load() -> (readings: [Kept], writable: Bool) {
    guard let url = file else { return ([], true) }
    guard FileManager.default.fileExists(atPath: url.path) else { return ([], true) }
    guard let data = try? Data(contentsOf: url) else { return ([], false) }
    do {
      return (try decoder.decode(Shelf.self, from: data).readings, true)
    } catch {
      let aside = url.deletingPathExtension()
        .appendingPathExtension("unreadable-\(Int(Date().timeIntervalSince1970)).json")
      do {
        try FileManager.default.moveItem(at: url, to: aside)
        return ([], true)
      } catch {
        return ([], false)
      }
    }
  }

  private func save() {
    guard writable, let url = Keeping.file else { return }
    do {
      try FileManager.default.createDirectory(
        at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
      let all = (aside + readings).sorted { $0.at < $1.at }
      try Keeping.encoder.encode(Shelf(readings: all)).write(to: url, options: .atomic)
    } catch {
      // the room loses nothing; the reading is only not kept
    }
  }

  // --- posing, for the shot tool ------------------------------------------

  /// Keep these, in memory only, as if kept long ago.
  func pose(_ ks: [Kept]) { readings = ks }

  /// Open at `page`, held to `r` (1: risen, with `lines` of its verse spoken).
  func poseOpen(page: Int, rising r: Double = 0, lines: Int = 0, threaded: Bool = false) {
    self.page = page
    open = true
    lay()
    rising = r
    settle(sounding: false)
    guard r >= 1, let leaf else { return }
    leaf.risen = true
    leaf.recited = lines
    leaf.sounded = lines >= leaf.draws.count
    leaf.threaded = threaded
  }

  func poseGlow(at t: TimeInterval) { tookAt = t }

  func poseAltar(_ slot: Int, at t: TimeInterval) {
    inspecting = slot
    altarAt = t
  }
}

// ===================================================================
//  On the table — the reading the door is open on.
// ===================================================================

struct KeptPage: View {
  let game: Game
  let size: CGSize
  let reduceMotion: Bool

  var body: some View {
    let k = game.keeping
    // with Reduce Motion a reading comes and goes only by fading
    let drift: CGFloat = reduceMotion ? 0 : CGFloat(k.heading) * 28
    let blur: CGFloat = reduceMotion ? 0 : 4
    ZStack {
      if k.open, let leaf = k.leaf {
        KeptSpread(
          leaf: leaf, keeping: k,
          layout: Layout(size: size, slots: leaf.draws.count, phase: .reading)
        )
        .id(ObjectIdentifier(leaf))
        .transition(
          .asymmetric(
            insertion: .modifier(
              active: Turned(x: drift, blur: blur, on: true),
              identity: Turned(x: 0, blur: blur, on: false)
            )
            .animation(.easeOut(duration: 0.8).delay(k.heading == 0 ? 0.3 : 0.1)),
            removal: .modifier(
              active: Turned(x: 0, blur: blur, on: true), identity: Turned(x: 0, blur: blur, on: false)
            )
            .animation(.easeOut(duration: 0.35))))
      }

      if k.open {
        PageTurns(keeping: k, size: size)
          .opacity(k.inspecting == nil ? 1 : 0)
          .animation(.easeOut(duration: 0.3), value: k.inspecting == nil)
          .transition(.opacity.animation(.easeOut(duration: 0.5)))
      }
    }
    .frame(width: size.width, height: size.height)
  }
}

/// A reading coming or going: out of a little blur, drifting from the way
/// time was turned — the past lies to the left.
private struct Turned: ViewModifier {
  let x: CGFloat
  let blur: CGFloat
  let on: Bool
  func body(content: Content) -> some View {
    content.opacity(on ? 0 : 1).blur(radius: on ? blur : 0).offset(x: on ? x : 0)
  }
}

private struct KeptSpread: View {
  let leaf: Leaf
  let keeping: Keeping
  let layout: Layout

  var body: some View {
    let n = leaf.draws.count
    // while a card is on the altar the rest of the page all but goes, and
    // the question stays faintly above it
    let altar = keeping.inspecting != nil
    ZStack {
      Group {
        ForEach(0..<n, id: \.self) { s in KeptHalo(leaf: leaf, slot: s, layout: layout) }
        KeptThread(leaf: leaf, layout: layout)
        ForEach(0..<n, id: \.self) { s in
          KeptCard(leaf: leaf, keeping: keeping, slot: s, layout: layout)
        }
        KeptNames(leaf: leaf, layout: layout)
      }
      .opacity(altar ? 0.06 : 1)

      if let q = leaf.kept.question {
        EpigraphLine(text: q)
          .position(x: layout.size.width / 2, y: layout.epigraphY)
          .opacity(altar ? 0.4 : 1)
          .allowsHitTesting(false)
      }

      Group {
        KeptVerse(leaf: leaf, layout: layout)
        if let t = leaf.kept.thread { KeptFolio(leaf: leaf, thread: t, layout: layout) }
        KeptInvitation(leaf: leaf, layout: layout)
      }
      .opacity(altar ? 0 : 1)
    }
    .animation(.easeOut(duration: 0.4), value: altar)
  }
}

/// A card as the return left it: a blank that keeps its gold, and, as it is
/// held, the ink coming back up into it — its raster fading in over the
/// pressed blank, as the return faded it out.
private struct KeptCard: View {
  let leaf: Leaf
  let keeping: Keeping
  let slot: Int
  let layout: Layout

  var body: some View {
    let d = leaf.draws[slot]
    let size = CGSize(width: layout.slotW, height: layout.slotH)
    let lit = leaf.risen && leaf.reading == slot && keeping.inspecting == nil

    // on the table, not leaving it: a page turned from or closed takes no hand
    let here = keeping.open && keeping.leaf === leaf
    ZStack {
      InkFace(ink: 1, draw: d, size: size, sink: leaf.sinks[slot].v)
        .shadow(color: Palette.shade.opacity(0.35), radius: 18, x: 0, y: 11)
        .shadow(color: Palette.goldLit.opacity(lit ? 0.55 : 0), radius: 26)
        .offset(y: lit ? -12 : 0)
        // until it is remembered a press on a card, as on the sky, is a hold
        .allowsHitTesting(false)

      // the hand's target stays where the card rests, as on the table
      Rectangle()
        .fill(.clear)
        .frame(width: size.width, height: size.height)
        .contentShape(Rectangle())
        .onHover { inside in
          withAnimation(.easeOut(duration: 0.22)) {
            if inside {
              leaf.reading = slot
            } else if leaf.reading == slot {
              leaf.reading = nil
            }
          }
          (inside ? NSCursor.pointingHand : NSCursor.arrow).set()
        }
        .onTapGesture { keeping.inspect(slot) }
        .allowsHitTesting(here && leaf.risen && keeping.inspecting == nil)
    }
    .rotationEffect(.degrees(Double(slot % 2 == 0 ? -1 : 1) * 0.7))
    .position(layout.slot(slot))
    .animation(.spring(response: 0.3, dampingFraction: 0.7), value: lit)
  }
}

/// The light a card gives off, back with the room once its ink has risen.
private struct KeptHalo: View {
  let leaf: Leaf
  let slot: Int
  let layout: Layout

  var body: some View {
    let flare = leaf.flare.contains(slot) ? 0.45 : 0
    let rest = leaf.reading == slot ? 0.22 : 0
    Ellipse()
      .fill(
        RadialGradient(
          colors: [Palette.goldLit, Palette.goldLit.opacity(0.45 / 1.4), Palette.goldLit.opacity(0)],
          center: .center, startRadius: 0, endRadius: layout.slotH * 0.78)
      )
      .frame(width: layout.slotW * 2.6, height: layout.slotH * 1.7)
      .opacity(min(1, (0.24 + rest + flare) * 1.4) * leaf.wake)
      .blendMode(.screen)
      .position(layout.slot(slot))
      .allowsHitTesting(false)
  }
}

/// The thread under the spread, laid whole: no light runs it.
private struct KeptThread: View {
  let leaf: Leaf
  let layout: Layout

  var body: some View {
    let xs = (0..<leaf.draws.count).map { layout.slot($0).x }
    let lit = leaf.reading
    Canvas { ctx, size in
      let y = size.height / 2
      let base = 0.40
      if xs.count == 1, let x = xs.first {
        let w = layout.slotW * 0.55
        for dir in [-1.0, 1.0] {
          var p = Path()
          p.move(to: CGPoint(x: x + dir * 10, y: y))
          p.addLine(to: CGPoint(x: x + dir * (10 + w), y: y))
          ctx.stroke(
            p,
            with: .linearGradient(
              Gradient(colors: [Palette.goldInk.opacity(base), Palette.goldInk.opacity(0)]),
              startPoint: CGPoint(x: x, y: y), endPoint: CGPoint(x: x + dir * (10 + w), y: y)),
            lineWidth: 1)
        }
      }
      for k in 0..<max(0, xs.count - 1) {
        var p = Path()
        p.move(to: CGPoint(x: xs[k] + 9, y: y))
        p.addLine(to: CGPoint(x: xs[k + 1] - 9, y: y))
        ctx.stroke(p, with: .color(Palette.goldLit.opacity(base * 0.45)), lineWidth: 5)
        ctx.stroke(p, with: .color(Palette.goldInk.opacity(base)), lineWidth: 1)
      }
      for (i, x) in xs.enumerated() {
        let s: CGFloat = lit == i ? 5.5 : 4.2
        var d = Path()
        d.move(to: CGPoint(x: x, y: y - s))
        d.addLine(to: CGPoint(x: x + s, y: y))
        d.addLine(to: CGPoint(x: x, y: y + s))
        d.addLine(to: CGPoint(x: x - s, y: y))
        d.closeSubpath()
        ctx.fill(d, with: .color(Palette.goldInk.opacity(0.95)))
        let glow: CGFloat = lit == i ? 26 : 14
        ctx.fill(
          Path(ellipseIn: CGRect(x: x - glow, y: y - glow, width: glow * 2, height: glow * 2)),
          with: .radialGradient(
            Gradient(colors: [Palette.goldLit.opacity(0.6), Palette.goldLit.opacity(0)]),
            center: CGPoint(x: x, y: y), startRadius: 0, endRadius: glow))
      }
    }
    .frame(width: layout.size.width, height: 40)
    .position(x: layout.size.width / 2, y: layout.threadY)
    .opacity(leaf.wake)
    .allowsHitTesting(false)
  }
}

/// The names of the positions, back with the room.
private struct KeptNames: View {
  let leaf: Leaf
  let layout: Layout

  var body: some View {
    ZStack {
      ForEach(0..<leaf.draws.count, id: \.self) { i in
        Caps(
          text: leaf.spread.slots[i], size: 9, tracking: 3.2,
          color: leaf.reading == i ? Palette.goldInk : Palette.goldInk.opacity(0.8))
          .position(x: layout.slot(i).x, y: layout.labelY)
      }
    }
    .opacity(leaf.wake)
    .allowsHitTesting(false)
  }
}

/// The reading spoken again, a line for each card.
private struct KeptVerse: View {
  let leaf: Leaf
  let layout: Layout

  var body: some View {
    let n = leaf.draws.count
    let v = layout.verse(n)
    VStack(spacing: v.gap) {
      ForEach(0..<n, id: \.self) { i in
        let spoken = i < leaf.recited
        let lit = leaf.reading == nil || leaf.reading == i
        Text(leaf.draws[i].line)
          .font(.roman(v.size))
          .foregroundStyle(Palette.text.opacity(lit ? 0.92 : 0.30))
          .shadow(color: Palette.goldLit.opacity(leaf.reading == i ? 0.9 : 0), radius: 12)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
          .frame(height: v.size * 1.34)
          .modifier(Arrive(on: !spoken))
      }
    }
    .animation(.easeOut(duration: 0.35), value: leaf.reading)
    .frame(width: layout.size.width * 0.86)
    .position(x: layout.size.width / 2, y: layout.stanzaTop + v.height / 2)
    .opacity(leaf.threaded ? 0 : 1)
    .allowsHitTesting(false)
  }
}

/// The thread, as it was found: its question on the table from the first,
/// going out as the ink rises, and coming back whole after the verse.
private struct KeptFolio: View {
  let leaf: Leaf
  let thread: WeaveResult
  let layout: Layout

  var body: some View {
    let question = leaf.risen ? (leaf.threaded ? 1 : 0) : 1 - leaf.stir
    VStack(spacing: 18) {
      Group {
        Text(thread.thread)
          .font(.roman(19))
          .foregroundStyle(Palette.text.opacity(0.92))
          .lineSpacing(5)
          .multilineTextAlignment(.center)
          .fixedSize(horizontal: false, vertical: true)

        Rectangle()
          .fill(Palette.goldInk)
          .frame(width: 5, height: 5)
          .rotationEffect(.degrees(45))
          .shadow(color: Palette.goldLit, radius: 5)
      }
      .opacity(leaf.threaded ? 1 : 0)

      Text(thread.question)
        .font(.italic(18))
        .foregroundStyle(Palette.goldInk)
        .shadow(color: Palette.goldLit.opacity(0.6), radius: 12)
        .lineSpacing(3)
        .multilineTextAlignment(.center)
        .fixedSize(horizontal: false, vertical: true)
        .opacity(question)
    }
    .frame(
      width: min(660, layout.size.width * 0.62),
      height: max(120, layout.inviteY + 20 - layout.stanzaTop), alignment: .top
    )
    .position(x: layout.size.width / 2, y: (layout.stanzaTop + layout.inviteY + 20) / 2)
    .allowsHitTesting(false)
  }
}

/// The one line of instruction a pressed reading has.
private struct KeptInvitation: View {
  let leaf: Leaf
  let layout: Layout

  var body: some View {
    Caps(text: "hold · remember", size: 8.5, tracking: 4, color: Palette.goldInk.opacity(0.6))
      .position(x: layout.size.width / 2, y: layout.askY)
      .opacity(leaf.risen ? 0 : 1 - leaf.stir)
      .animation(.easeOut(duration: 0.6), value: leaf.risen)
      .allowsHitTesting(false)
  }
}

/// The way to the readings before and after this one: a mark in the pen's
/// hand either side of the spread, there only when there is a reading that
/// way.
private struct PageTurns: View {
  let keeping: Keeping
  let size: CGSize

  var body: some View {
    let n = keeping.leaf?.draws.count ?? 3
    let L = Layout(size: size, slots: n, phase: .reading)
    let reach = L.slotW / 2 + 58
    let left = max(30, L.slot(0).x - reach)
    let right = min(size.width - 30, L.slot(n - 1).x + reach)
    ZStack {
      TurnMark(dir: -1, shown: keeping.open && keeping.hasBefore) { keeping.turn(-1) }
        .position(x: left, y: L.rowY)
      TurnMark(dir: 1, shown: keeping.open && keeping.hasAfter) { keeping.turn(1) }
        .position(x: right, y: L.rowY)
    }
    .animation(.spring(response: 0.6, dampingFraction: 0.9), value: n)
  }
}

private struct TurnMark: View {
  let dir: Int
  let shown: Bool
  let action: () -> Void
  @State private var hover = false

  private static let space = CGSize(width: 12, height: 24)

  /// An open angle, drawn by the same unsteady pen as everything else.
  private static let marks: [Int: [Mark]] = {
    var out: [Int: [Mark]] = [:]
    for d in [-1, 1] {
      var p = Pen(seed: d < 0 ? 611 : 612)
      let tip = d < 0 ? 2.5 : 9.5
      let tail = d < 0 ? 9.5 : 2.5
      p.line(tail, 3, tip, 12, w: 1.0, amp: 0.35)
      p.line(tip, 12, tail, 21, w: 1.0, amp: 0.35)
      out[d] = p.marks
    }
    return out
  }()

  var body: some View {
    Button(action: action) {
      MarksCanvas(
        marks: Self.marks[dir] ?? [], space: Self.space,
        tint: .only(hover ? Palette.goldInk : Palette.text.opacity(0.36)))
        .frame(width: 12, height: 24)
        .shadow(color: Palette.goldLit.opacity(hover ? 0.8 : 0), radius: 6)
        .frame(width: 44, height: 64)
        .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .onHover { h in
      withAnimation(.easeOut(duration: 0.2)) { hover = h }
      (h ? NSCursor.pointingHand : NSCursor.arrow).set()
    }
    .opacity(shown ? 1 : 0)
    .animation(.easeOut(duration: 0.4), value: shown)
    .allowsHitTesting(shown)
    .accessibilityLabel(dir < 0 ? "An earlier reading" : "A later reading")
  }
}

// ===================================================================
//  The moon, as the door.
// ===================================================================

/// The moon takes a press only while it has something to open: at rest in
/// the room, with a reading kept, or with its door open, to close it — and
/// never while the keys are open over it.
struct MoonDoor: View {
  let game: Game
  let layout: Layout

  var body: some View {
    let k = game.keeping
    // under the keys a click on it only closes them
    let can =
      !game.legend
      && (k.open
        || (game.phase == .invocation && !game.holding && !game.chargeMoving && game.roomLive
          && !k.readings.isEmpty))
    Button(action: {
      if k.open { game.closeKept() } else { game.openKept() }
    }) {
      Circle().fill(.clear).frame(width: 60, height: 60).contentShape(Circle())
    }
    .buttonStyle(.plain)
    .onHover { inside in
      k.moonHover = inside && can
      (inside && can ? NSCursor.pointingHand : NSCursor.arrow).set()
      if inside && can { k.prepare(scale: NSScreen.main?.backingScaleFactor ?? 2) }
    }
    .onChange(of: can) { _, c in if !c { k.moonHover = false } }
    // the night it will open on is made ready as the room appears, and
    // again whenever a reading is kept or the door is closed
    .onAppear { k.prepare(scale: NSScreen.main?.backingScaleFactor ?? 2) }
    .onChange(of: k.readings.count) { _, _ in
      k.prepare(scale: NSScreen.main?.backingScaleFactor ?? 2)
    }
    .position(Sky.moonCenter(layout.size))
    .allowsHitTesting(can)
    .accessibilityLabel(k.open ? "Back to tonight" : "What the moon keeps")
  }
}

extension Kept {
  /// The night it was asked, as the moon's label gives it.
  var night: String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US")
    let thisYear = Calendar.current.isDate(at, equalTo: Date(), toGranularity: .year)
    f.setLocalizedDateFormatFromTemplate(thisYear ? "MMMM d" : "MMMM d yyyy")
    return f.string(from: at)
  }
}

/// Under the moon, while its door is open, where tonight's phase is named:
/// the night the reading was asked. The moon itself shows how it was.
struct KeptMoonLabel: View {
  let game: Game
  let layout: Layout

  var body: some View {
    let moon = Sky.moonCenter(layout.size)
    ZStack {
      if game.keeping.open, let kept = game.keeping.leaf?.kept {
        Caps(text: kept.night, size: 8, tracking: 3.6, color: Palette.text.opacity(0.55))
          .fixedSize()
          .id(kept.id)
          .transition(.opacity.animation(.easeInOut(duration: 0.6)))
      }
    }
    .position(x: moon.x, y: moon.y + Sky.moonRadius + 20)
    .allowsHitTesting(false)
  }
}

/// A question the moon has brought back: asked one moon ago, written
/// faintly under it until its door is opened.
struct MoonReturn: View {
  let game: Game
  let layout: Layout

  var body: some View {
    // looked for again whenever the room comes back after a reading, or can
    // be seen once more — never on a clock of its own, which here costs more
    // than a point of a core at idle
    let _ = (game.visible, game.phase)
    let moon = Sky.moonCenter(layout.size)
    ZStack {
      if let back = game.keeping.comingBack(), let q = back.question {
        VStack(spacing: 8) {
          Caps(text: "one moon ago", size: 7, tracking: 3.2, color: Palette.text.opacity(0.36))
          Text(q)
            .font(.italic(13.5))
            .foregroundStyle(Palette.text.opacity(0.55))
            .multilineTextAlignment(.center)
            .lineLimit(3)
            .frame(width: min(300, (layout.size.width - moon.x) * 2 - 40))
            .fixedSize(horizontal: false, vertical: true)
        }
        .transition(.opacity)
      }
    }
    .frame(width: 320, alignment: .top)
    .position(x: moon.x, y: moon.y + Sky.moonRadius + 64)
    .allowsHitTesting(false)
  }
}

/// The moon brightening for one breath as it takes a reading: a pale light
/// about it, carried by Core Animation. The shot tool, which cannot see a
/// layer, draws the same light in SwiftUI at the strength it has now.
struct MoonGlow: View {
  let tookAt: TimeInterval?
  @Environment(\.stillSky) private var still

  /// One breath: in, a moment held, and out.
  static let length = 5.0
  static let keyTimes = [0, 0.28, 0.40, 1.0]
  static let values = [0.0, 1.0, 1.0, 0.0]

  static func strength(_ age: Double) -> Double {
    ramp(age, 0, 1.4) * (1 - ramp(age, 2.0, length))
  }

  static let stops: [(Color, Double)] = [
    (Color.white.opacity(0.7), 0), (Color.white.opacity(0.7), 0.17),
    (Color.white.opacity(0.28), 0.42), (Color.white.opacity(0), 1),
  ]

  var body: some View {
    if still {
      let a = tookAt.map { MoonGlow.strength(Date().timeIntervalSinceReferenceDate - $0) } ?? 0
      RadialGradient(
        stops: MoonGlow.stops.map { .init(color: $0.0, location: $0.1) }, center: .center,
        startRadius: 0, endRadius: 96
      )
      .opacity(a)
    } else {
      MoonGlowLayer(tookAt: tookAt)
    }
  }
}

private struct MoonGlowLayer: NSViewRepresentable {
  let tookAt: TimeInterval?
  func makeNSView(context: Context) -> MoonGlowView { MoonGlowView() }
  func updateNSView(_ v: MoonGlowView, context: Context) { v.show(tookAt) }
}

final class MoonGlowView: NSView {
  private let glow = CAGradientLayer()
  private var shown: TimeInterval?

  init() {
    super.init(frame: .zero)
    wantsLayer = true
    layerContentsRedrawPolicy = .never
    glow.type = .radial
    glow.colors = MoonGlow.stops.map { NSColor($0.0).cgColor }
    glow.locations = MoonGlow.stops.map { NSNumber(value: $0.1) }
    glow.startPoint = CGPoint(x: 0.5, y: 0.5)
    glow.endPoint = CGPoint(x: 1, y: 1)
    glow.opacity = 0
    glow.actions = ["opacity": NSNull(), "bounds": NSNull(), "position": NSNull()]
    layer?.addSublayer(glow)
    setAccessibilityElement(false)
  }

  required init?(coder: NSCoder) { fatalError("not used") }

  override var isOpaque: Bool { false }
  override func hitTest(_ point: NSPoint) -> NSView? { nil }

  override func layout() {
    super.layout()
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    glow.frame = bounds
    CATransaction.commit()
  }

  func show(_ tookAt: TimeInterval?) {
    guard let tookAt, tookAt != shown else { return }
    shown = tookAt
    let now = Date().timeIntervalSinceReferenceDate
    guard now - tookAt < MoonGlow.length else { return }
    let breath = CAKeyframeAnimation(keyPath: "opacity")
    breath.values = MoonGlow.values
    breath.keyTimes = MoonGlow.keyTimes.map { NSNumber(value: $0) }
    // `ramp`'s own S, span by span
    breath.timingFunctions = Array(
      repeating: CAMediaTimingFunction(controlPoints: 1 / 3, 0, 2 / 3, 1),
      count: MoonGlow.values.count - 1)
    breath.duration = MoonGlow.length
    breath.beginTime = CACurrentMediaTime() + (tookAt - now)
    breath.fillMode = .backwards
    glow.add(breath, forKey: "breath")
  }
}
