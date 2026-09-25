import AVFoundation

// ===================================================================
//  Sfx — everything is synthesised at launch: no asset files, and the
//  whole app stays a single binary.
//
//  Two rooms: the hand (card stock, the table) in a small room, and the
//  air (bowls, chimes, the swell) in a cathedral. Under both, a drone
//  that breathes in step with the light of the sky.
// ===================================================================

@MainActor
final class Sfx {
  static let shared = Sfx()

  enum Cue { case cut, slide, land, tick }

  /// Sound on or off: the bowl, top right, and `m`.
  var enabled = true { didSet { hear() } }
  /// Someone is there to hear it: the window can be seen and the screens
  /// are awake.
  var present = true { didSet { hear() } }
  private var audible: Bool { enabled && present }

  private let master: Float = 0.5
  private let engine = AVAudioEngine()
  private let fmt = AVAudioFormat(standardFormatWithSampleRate: Synth.rate, channels: 2)!
  private let hall = AVAudioUnitReverb()
  private let room = AVAudioUnitReverb()
  private let airBus = AVAudioMixerNode()
  private let handBus = AVAudioMixerNode()
  private var air: [AVAudioPlayerNode] = []
  private var hand: [AVAudioPlayerNode] = []
  private let drone = AVAudioPlayerNode()
  private let swell = AVAudioPlayerNode()
  private var airCursor = 0
  private var handCursor = 0

  // every sound is kept once, as the buffer that plays it
  private var cues: [Cue: AVAudioPCMBuffer] = [:]
  private var toneBuffers: [Int: AVAudioPCMBuffer] = [:]  // midi * 2 + (dark ? 1 : 0)
  private var chimes: [AVAudioPCMBuffer] = []
  private var droneBuffer: AVAudioPCMBuffer?
  private var swellBuffer: AVAudioPCMBuffer?

  private var lastChime: TimeInterval = 0
  private var droneLevel: Float = 0
  private var droneTarget: Float = 0.42
  private var swellFade: Task<Void, Never>?
  private var easing: Task<Void, Never>?
  private var fading: Task<Void, Never>?
  private var hearing = true  // the engine is meant to be running
  private var live = false

  private init() {
    engine.attach(hall)
    engine.attach(room)
    engine.attach(airBus)
    engine.attach(handBus)
    engine.attach(drone)
    engine.attach(swell)

    hall.loadFactoryPreset(.cathedral)
    hall.wetDryMix = 42
    room.loadFactoryPreset(.mediumRoom)
    room.wetDryMix = 12

    engine.connect(airBus, to: hall, format: fmt)
    engine.connect(hall, to: engine.mainMixerNode, format: fmt)
    engine.connect(handBus, to: room, format: fmt)
    engine.connect(room, to: engine.mainMixerNode, format: fmt)
    engine.connect(drone, to: engine.mainMixerNode, format: fmt)
    engine.connect(swell, to: airBus, format: fmt)

    for _ in 0..<12 {
      let node = AVAudioPlayerNode()
      engine.attach(node)
      engine.connect(node, to: airBus, format: fmt)
      air.append(node)
    }
    for _ in 0..<6 {
      let node = AVAudioPlayerNode()
      engine.attach(node)
      engine.connect(node, to: handBus, format: fmt)
      hand.append(node)
    }

    // the small sounds are cheap; make them now
    cues[.tick] = buffer(Synth.noise(dur: 0.06, decay: 62, cutoff: 0.32, bite: 0.5))
    cues[.slide] = buffer(Synth.noise(dur: 0.30, decay: 14, cutoff: 0.10, bite: 0.18))
    cues[.land] = buffer(Synth.thud())
    cues[.cut] = buffer(Synth.riffle())

    drone.volume = 0
    engine.mainMixerNode.outputVolume = master
    do {
      try engine.start()
      (air + hand + [drone, swell]).forEach { $0.play() }
      live = true
    } catch {
      live = false
    }

    NotificationCenter.default.addObserver(
      forName: .AVAudioEngineConfigurationChange, object: engine, queue: .main
    ) { [weak self] _ in
      MainActor.assumeIsolated { self?.restart() }
    }

    // the long sounds take a moment; make them off the main thread
    let notes = Set(Spread.all.flatMap { s in s.notes.flatMap { [$0 * 2, ($0 - 12) * 2 + 1] } })
    Task.detached(priority: .userInitiated) {
      let drone = Synth.drone()
      let swell = Synth.swell()
      let chimes = Synth.chimeScale.map { Synth.chime(midi: $0) }
      var made: [Int: Synth.Stereo] = [:]
      for key in notes.union([48 * 2 + 1]) {
        made[key] = Synth.bowl(midi: key / 2, dark: key % 2 == 1)
      }
      let tones = made
      await MainActor.run {
        Sfx.shared.install(drone: drone, swell: swell, chimes: chimes, tones: tones)
      }
    }

    ease()
  }

  private func install(
    drone d: Synth.Stereo, swell s: Synth.Stereo, chimes c: [Synth.Stereo],
    tones t: [Int: Synth.Stereo]
  ) {
    droneBuffer = buffer(d)
    swellBuffer = buffer(s)
    chimes = c.compactMap { buffer($0) }
    for (k, v) in t { toneBuffers[k] = buffer(v) }
    startDrone()
  }

  /// Start the loop at the point in its breath that matches the sky's: the
  /// rest of this pass from there, then the whole loop, seamlessly, forever.
  /// The first part is a short-lived copy, let go once it has played.
  private func startDrone() {
    guard live, let buf = droneBuffer else { return }
    let phase = Date().timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 10)
    let offset = Int(phase * Synth.rate) % Int(buf.frameLength)
    drone.stop()
    if offset > 0, let rest = tail(of: buf, from: offset) {
      drone.scheduleBuffer(rest, at: nil, options: [])
    }
    drone.scheduleBuffer(buf, at: nil, options: .loops)
    drone.play()
  }

  private func restart() {
    guard hearing, !engine.isRunning else { return }
    do {
      try engine.start()
      (air + hand + [swell]).forEach { $0.play() }
      startDrone()
      live = true
    } catch {
      live = false
    }
  }

  // --- playing -------------------------------------------------------

  func play(_ cue: Cue, gain: Float = 1, after delay: Double = 0) {
    guard let buf = cues[cue] else { return }
    later(delay) { $0.fire(buf, on: .hand, gain: gain) }
  }

  /// A bowl for one card: the position's note, darker and an octave down
  /// when the card lies reversed.
  func tone(midi: Int, dark: Bool, gain: Float, pan: Float = 0, after delay: Double = 0) {
    guard let buf = toneBuffers[midi * 2 + (dark ? 1 : 0)] else { return }
    later(delay) { $0.fire(buf, on: .air, gain: gain, pan: pan) }
  }

  /// Every card of the spread at once — the reading as a single chord.
  func chord(_ notes: [(Int, Bool)], gain: Float) {
    guard live, audible else { return }
    let parts = notes.compactMap { toneBuffers[$0.0 * 2 + ($0.1 ? 1 : 0)] }
    guard !parts.isEmpty else { return }
    let n = parts.map { Int($0.frameLength) }.max() ?? 0
    guard n > 0, let buf = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: AVAudioFrameCount(n)),
      let out = buf.floatChannelData
    else { return }
    buf.frameLength = AVAudioFrameCount(n)
    out[0].update(repeating: 0, count: n)
    out[1].update(repeating: 0, count: n)
    let k = 1 / Float(parts.count).squareRoot()
    for p in parts {
      guard let ch = p.floatChannelData else { continue }
      for i in 0..<Int(p.frameLength) {
        out[0][i] += ch[0][i] * k
        out[1][i] += ch[1][i] * k
      }
    }
    fire(buf, on: .air, gain: gain)
  }

  /// The fan is an instrument: low on the left, high on the right.
  func chime(position i: Int, of n: Int) {
    guard !chimes.isEmpty else { return }
    let now = Date().timeIntervalSinceReferenceDate
    guard now - lastChime > 0.035 else { return }
    lastChime = now
    let t = n <= 1 ? 0.5 : Double(i) / Double(n - 1)
    let idx = Int((t * Double(chimes.count - 1)).rounded())
    fire(chimes[idx], on: .air, gain: 0.11, pan: Float(t * 2 - 1) * 0.7)
  }

  /// The drone's level, 0…1. It eases there.
  func mood(_ level: Float) {
    droneTarget = min(1, max(0, level))
    ease()
  }

  /// Ease the drone toward its level; the loop stops once it is there, so
  /// a room at rest wakes nothing.
  private func ease() {
    guard easing == nil else { return }
    easing = Task { @MainActor [weak self] in
      while let self, abs(self.droneTarget - self.droneLevel) > 0.001 {
        self.droneLevel += (self.droneTarget - self.droneLevel) * 0.035
        self.drone.volume = self.droneLevel
        try? await Task.sleep(for: .milliseconds(33), tolerance: .milliseconds(8))
      }
      guard let self else { return }
      self.droneLevel = self.droneTarget
      self.drone.volume = self.droneLevel
      self.easing = nil
    }
  }

  /// When the room can't be heard — muted, or no one there — the engine is
  /// let go altogether, not just turned down: its clock, its reverbs and its
  /// players stop, and the Mac may sleep. When it can be heard again, the
  /// drone rises back in step with the sky's breath.
  private func hear() {
    let want = audible
    guard want != hearing else { return }
    hearing = want
    fading?.cancel()
    if want {
      if !engine.isRunning {
        do {
          try engine.start()
          (air + hand + [swell]).forEach { $0.play() }
          live = true
        } catch {
          live = false
        }
      }
      droneLevel = 0
      drone.volume = 0
      startDrone()
      engine.mainMixerNode.outputVolume = master
      ease()
    } else {
      let from = engine.mainMixerNode.outputVolume
      fading = Task { @MainActor [weak self] in
        for i in 1...12 {
          try? await Task.sleep(nanoseconds: 20_000_000)
          guard let self, !Task.isCancelled else { return }
          self.engine.mainMixerNode.outputVolume = from * (1 - Float(i) / 12)
        }
        guard let self, !Task.isCancelled, !self.hearing else { return }
        (self.air + self.hand + [self.swell, self.drone]).forEach { $0.stop() }
        self.engine.pause()
      }
    }
  }

  /// The rising sound of the held question, picked up where the charge is.
  func swellStart(from charge: Double) {
    guard live, audible, let buf = swellBuffer else { return }
    swellFade?.cancel()
    let start = min(Int(buf.frameLength) - 1, Int(charge * Game.holdSeconds * Synth.rate))
    guard let rest = tail(of: buf, from: start) else { return }
    swell.stop()
    swell.volume = 0.55
    swell.scheduleBuffer(rest, at: nil, options: .interrupts)
    swell.play()
  }

  func swellStop(fade: Double = 0.35) {
    swellFade?.cancel()
    let from = swell.volume
    swellFade = Task { @MainActor [weak self] in
      let steps = max(1, Int(fade / 0.02))
      for i in 1...steps {
        try? await Task.sleep(nanoseconds: 20_000_000)
        if Task.isCancelled { return }
        self?.swell.volume = from * (1 - Float(i) / Float(steps))
      }
      self?.swell.stop()
      self?.swell.play()
    }
  }

  private enum Room { case hand, air }

  private func later(_ delay: Double, _ body: @escaping @MainActor (Sfx) -> Void) {
    guard live, audible else { return }
    if delay > 0 {
      Task { @MainActor [weak self] in
        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        if let self { body(self) }
      }
    } else {
      body(self)
    }
  }

  private func fire(_ buf: AVAudioPCMBuffer, on room: Room, gain: Float, pan: Float = 0) {
    guard live, audible else { return }
    let node: AVAudioPlayerNode
    switch room {
    case .hand:
      node = hand[handCursor % hand.count]
      handCursor += 1
    case .air:
      node = air[airCursor % air.count]
      airCursor += 1
    }
    node.volume = min(1, max(0, gain))
    node.pan = pan
    node.scheduleBuffer(buf, at: nil, options: .interrupts, completionHandler: nil)
  }

  /// The end of a buffer, from `start`, as a buffer of its own.
  private func tail(of buf: AVAudioPCMBuffer, from start: Int) -> AVAudioPCMBuffer? {
    let n = Int(buf.frameLength) - start
    guard n > 0, let src = buf.floatChannelData,
      let out = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: AVAudioFrameCount(n)),
      let dst = out.floatChannelData
    else { return nil }
    out.frameLength = AVAudioFrameCount(n)
    dst[0].update(from: src[0] + start, count: n)
    dst[1].update(from: src[1] + start, count: n)
    return out
  }

  private func buffer(_ s: Synth.Stereo) -> AVAudioPCMBuffer? {
    let frames = AVAudioFrameCount(s.l.count)
    guard frames > 0, let buf = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: frames),
      let ch = buf.floatChannelData
    else { return nil }
    buf.frameLength = frames
    s.l.withUnsafeBufferPointer { ch[0].update(from: $0.baseAddress!, count: s.l.count) }
    s.r.withUnsafeBufferPointer { ch[1].update(from: $0.baseAddress!, count: s.r.count) }
    return buf
  }
}

// ===================================================================
//  Synth — pure functions from parameters to samples.
// ===================================================================

enum Synth {
  typealias Stereo = (l: [Float], r: [Float])
  static let rate = 44_100.0

  static func hz(_ midi: Int) -> Double { 440 * pow(2, Double(midi - 69) / 12) }

  private static func render(_ dur: Double, _ f: (Double) -> (Double, Double)) -> Stereo {
    let n = Int(dur * rate)
    var l = [Float](repeating: 0, count: n)
    var r = [Float](repeating: 0, count: n)
    for i in 0..<n {
      let (a, b) = f(Double(i) / rate)
      l[i] = Float(a)
      r[i] = Float(b)
    }
    return (l, r)
  }

  /// A struck singing bowl. One pure partial and a few inharmonic ones,
  /// each split in two so it beats — the slow "wah" of real metal — and
  /// the two halves lean to opposite ears, so the beating moves.
  static func bowl(midi: Int, dark: Bool) -> Stereo {
    let f0 = hz(midi)
    let ratios: [Double] = [1, 2.0, 2.71, 4.13, 5.40]
    let amps: [Double] = dark ? [1, 0.10, 0.20, 0.05, 0.025] : [1, 0.12, 0.40, 0.15, 0.10]
    let decays: [Double] = dark ? [0.40, 1.0, 0.9, 1.7, 2.3] : [0.55, 1.4, 1.1, 2.1, 2.9]
    let beats: [Double] = dark ? [0.6, 1.0, 1.7, 2.3, 2.9] : [1.0, 1.6, 2.3, 3.2, 3.9]
    var rng = Rng(UInt32(midi * 7 + (dark ? 3 : 1)))
    let ph = ratios.map { _ in rng.next() * 2 * .pi }
    let attack = dark ? 0.014 : 0.003
    return render(dark ? 6.5 : 5.5) { t in
      var l = 0.0, r = 0.0
      for k in 0..<ratios.count {
        let f = f0 * ratios[k]
        guard f < 14_000 else { continue }
        let env = amps[k] * exp(-t * decays[k])
        let a = sin(2 * .pi * (f - beats[k] / 2) * t + ph[k])
        let b = sin(2 * .pi * (f + beats[k] / 2) * t + ph[k] * 1.7)
        l += env * (a * 0.64 + b * 0.36)
        r += env * (a * 0.36 + b * 0.64)
      }
      let strike = 1 - exp(-t / attack)
      return (l * strike * 0.24, r * strike * 0.24)
    }
  }

  /// C major pentatonic, C4 to A6 — the fan's fifteen voices.
  static let chimeScale = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93]

  static func chime(midi: Int) -> Stereo {
    let f = hz(midi)
    let tame = 1 / max(1, (f / 400).squareRoot())  // high notes softer
    return render(1.7) { t in
      let env = exp(-t * 2.8) * (1 - exp(-t / 0.0025))
      let v =
        sin(2 * .pi * f * t) + 0.16 * sin(2 * .pi * 2 * f * t) * exp(-t * 3)
        + 0.06 * sin(2 * .pi * 2.76 * f * t) * exp(-t * 7)
      let s = v * env * 0.22 * tame
      return (s, s)
    }
  }

  /// Twenty seconds that loop without a seam: every frequency completes a
  /// whole number of cycles, and the swell has a period of ten seconds —
  /// the same breath the sky takes.
  static func drone() -> Stereo {
    let loop = 20.0
    func q(_ f: Double) -> Double { (f * loop).rounded() / loop }
    let twin = 3 / loop  // 0.15 Hz beating between the ears
    let voices: [(f: Double, a: Double)] = [
      (q(hz(36)), 0.30),  // C2
      (q(hz(43)), 0.16),  // G2
      (q(hz(48)), 0.12),  // C3
      (q(hz(55)), 0.05),  // G3
    ]
    let harmonics: [Double] = [1, 0.5, 0.28, 0.14]
    return render(loop) { t in
      let breath = 0.5 - 0.5 * cos(t * 2 * .pi / 10)
      let swell = 0.72 + 0.28 * breath
      var l = 0.0, r = 0.0
      for (vi, v) in voices.enumerated() {
        // upper voices lean into the breath more than the root
        let s = vi == 0 ? 1 : swell
        for (h, amp) in harmonics.enumerated() {
          let fh = v.f * Double(h + 1)
          l += v.a * amp * s * sin(2 * .pi * fh * t)
          r += v.a * amp * s * sin(2 * .pi * (fh + twin) * t)
        }
      }
      return (l * 0.36, r * 0.36)
    }
  }

  /// The held question: an open chord rising out of wind, quickening.
  static func swell() -> Stereo {
    let hold = 3.2
    let partials: [(Double, Double)] = [
      (hz(60), 0.30), (hz(67), 0.22), (hz(72), 0.18), (hz(76), 0.12), (hz(79), 0.10),
      (hz(84), 0.07),
    ]
    var nl = Rng(301), nr = Rng(302)
    var lpl = 0.0, lpr = 0.0
    return render(hold + 0.5) { t in
      let rise = t < hold ? pow(t / hold, 2.2) : exp(-(t - hold) * 7)
      let trem = 1 + 0.22 * sin(2 * .pi * (3 + 4 * min(t, hold) / hold) * t)
      var l = 0.0, r = 0.0
      for (i, p) in partials.enumerated() {
        let d = 0.8 + Double(i) * 0.35
        l += p.1 * sin(2 * .pi * (p.0 - d / 2) * t)
        r += p.1 * sin(2 * .pi * (p.0 + d / 2) * t)
      }
      let cut = 0.015 + 0.10 * min(t, hold) / hold
      lpl += ((nl.next() * 2 - 1) - lpl) * cut
      lpr += ((nr.next() * 2 - 1) - lpr) * cut
      let e = rise * trem
      return ((l * 0.34 + lpl * 0.5) * e * 0.5, (r * 0.34 + lpr * 0.5) * e * 0.5)
    }
  }

  /// Card stock moving: filtered noise.
  static func noise(dur: Double, decay: Double, cutoff: Double, bite: Double) -> Stereo {
    var r = Rng(77)
    var lp = 0.0
    return render(dur) { t in
      let white = r.next() * 2 - 1
      lp += (white - lp) * cutoff
      let env = exp(-t * decay) * (1 - exp(-t / 0.002))
      let v = (lp * (1 - bite) + white * bite) * env * 0.5
      return (v, v)
    }
  }

  /// A card meeting the table.
  static func thud() -> Stereo {
    var r = Rng(1_031)
    var lp = 0.0
    return render(0.26) { t in
      let white = r.next() * 2 - 1
      lp += (white - lp) * 0.06
      let body = sin(2 * .pi * 92 * t) * exp(-t * 26) * 0.35
      let v = (lp * exp(-t * 18) * 0.7 + body) * 0.8
      return (v, v)
    }
  }

  /// The cut: a handful of ticks, unevenly spaced.
  static func riffle() -> Stereo {
    var r = Rng(515)
    var offsets: [Double] = []
    var at = 0.0
    for _ in 0..<11 {
      at += 0.028 + r.next() * 0.042
      offsets.append(at)
    }
    var n = Rng(909)
    var lp = 0.0
    return render(at + 0.2) { t in
      var env = 0.0
      for o in offsets where t >= o {
        env = max(env, exp(-(t - o) * 70))
      }
      let white = n.next() * 2 - 1
      lp += (white - lp) * 0.4
      let v = lp * env * 0.34
      return (v, v)
    }
  }
}
