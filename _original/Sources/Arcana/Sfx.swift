import AVFoundation

// ===================================================================
//  Sfx — everything is synthesised at launch: no asset files, and the
//  whole app stays a single binary. Quiet by design.
// ===================================================================

@MainActor
final class Sfx {
  static let shared = Sfx()

  enum Cue { case cut, slide, land, reveal, chord, tick }

  var enabled = true {
    didSet { engine.mainMixerNode.outputVolume = enabled ? master : 0 }
  }

  private let master: Float = 0.42
  private let engine = AVAudioEngine()
  private var players: [AVAudioPlayerNode] = []
  private var buffers: [Cue: AVAudioPCMBuffer] = [:]
  private var cursor = 0
  private var live = false

  private init() {
    guard let fmt = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 2) else { return }

    for _ in 0..<7 {
      let node = AVAudioPlayerNode()
      engine.attach(node)
      engine.connect(node, to: engine.mainMixerNode, format: fmt)
      players.append(node)
    }

    buffers[.reveal] = bell(fmt, [196.0, 293.66, 392.0, 587.33], dur: 2.0, decay: 2.4)
    buffers[.chord] = bell(fmt, [130.81, 196.0, 261.63], dur: 2.6, decay: 1.5)
    buffers[.tick] = noise(fmt, dur: 0.06, decay: 62, cutoff: 0.32, bite: 0.5)
    buffers[.slide] = noise(fmt, dur: 0.30, decay: 14, cutoff: 0.10, bite: 0.18)
    buffers[.land] = thud(fmt)
    buffers[.cut] = riffle(fmt)

    engine.mainMixerNode.outputVolume = master
    do {
      try engine.start()
      players.forEach { $0.play() }
      live = true
    } catch {
      live = false
    }
  }

  func play(_ cue: Cue, gain: Float = 1, after delay: Double = 0) {
    guard live, enabled, buffers[cue] != nil else { return }
    if delay > 0 {
      Task { @MainActor [weak self] in
        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        self?.fire(cue, gain)
      }
    } else {
      fire(cue, gain)
    }
  }

  private func fire(_ cue: Cue, _ gain: Float) {
    guard live, enabled, let buf = buffers[cue] else { return }
    let node = players[cursor % players.count]
    cursor += 1
    node.volume = min(1, max(0, gain))
    node.scheduleBuffer(buf, at: nil, options: .interrupts, completionHandler: nil)
  }

  // --- synthesis ----------------------------------------------------

  private func make(
    _ fmt: AVAudioFormat, _ dur: Double, _ sample: (Double, Int) -> Float
  ) -> AVAudioPCMBuffer? {
    let rate = fmt.sampleRate
    let frames = AVAudioFrameCount(dur * rate)
    guard let buf = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: frames) else { return nil }
    buf.frameLength = frames
    guard let chans = buf.floatChannelData else { return nil }
    for i in 0..<Int(frames) {
      let t = Double(i) / rate
      let v = sample(t, i)
      chans[0][i] = v
      if fmt.channelCount > 1 { chans[1][i] = v }
    }
    return buf
  }

  /// Struck metal: a few partials under an exponential decay.
  private func bell(
    _ fmt: AVAudioFormat, _ freqs: [Double], dur: Double, decay: Double
  ) -> AVAudioPCMBuffer? {
    make(fmt, dur) { t, _ in
      var v = 0.0
      for (k, f) in freqs.enumerated() {
        let amp = 1.0 / Double(k + 1) / 1.4
        v += sin(2 * .pi * f * t) * amp * exp(-t * decay * (1 + Double(k) * 0.4))
      }
      let attack = 1 - exp(-t / 0.006)
      return Float(v * attack * 0.32)
    }
  }

  /// Card stock moving: filtered noise.
  private func noise(
    _ fmt: AVAudioFormat, dur: Double, decay: Double, cutoff: Double, bite: Double
  ) -> AVAudioPCMBuffer? {
    var r = Rng(77)
    var lp = 0.0
    return make(fmt, dur) { t, _ in
      let white = r.next() * 2 - 1
      lp += (white - lp) * cutoff
      let env = exp(-t * decay) * (1 - exp(-t / 0.002))
      return Float((lp * (1 - bite) + white * bite) * env * 0.5)
    }
  }

  /// A card meeting the table.
  private func thud(_ fmt: AVAudioFormat) -> AVAudioPCMBuffer? {
    var r = Rng(1_031)
    var lp = 0.0
    return make(fmt, 0.26) { t, _ in
      let white = r.next() * 2 - 1
      lp += (white - lp) * 0.06
      let body = sin(2 * .pi * 92 * t) * exp(-t * 26) * 0.35
      return Float((lp * exp(-t * 18) * 0.7 + body) * 0.8)
    }
  }

  /// The cut: a handful of ticks, unevenly spaced.
  private func riffle(_ fmt: AVAudioFormat) -> AVAudioPCMBuffer? {
    var r = Rng(515)
    var offsets: [Double] = []
    var at = 0.0
    for _ in 0..<11 {
      at += 0.028 + r.next() * 0.042
      offsets.append(at)
    }
    var n = Rng(909)
    var lp = 0.0
    return make(fmt, at + 0.2) { t, _ in
      var env = 0.0
      for o in offsets where t >= o {
        env = max(env, exp(-(t - o) * 70))
      }
      let white = n.next() * 2 - 1
      lp += (white - lp) * 0.4
      return Float(lp * env * 0.34)
    }
  }
}
