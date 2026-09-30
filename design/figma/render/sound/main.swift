// mksound: the app's own instruments, offline, written to files.
//
// Compiled with Sources/Arcana/*.swift (all but ArcanaApp.swift), so every
// sample comes from the real Synth (Sources/Arcana/Sfx.swift:369-536).
// Sfx.shared is never touched: its init starts the live engine. Instead,
// Room below rebuilds Sfx's graph (Sfx.swift:56-96) in an AVAudioEngine in
// offline manual rendering mode. Nothing is ever played aloud.
//
//   mksound <outdir>      writes <outdir>/dry-*.wav, room-*.wav, seq-*.wav
//                         (44.1 kHz float32, the app's own format),
//                         <outdir>/cues-*.json and <outdir>/facts.json

import AVFoundation
import Foundation

setvbuf(stdout, nil, _IONBF, 0)
let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "native"
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)

let rate = Synth.rate
// Game's timings, read on the main actor (Game.swift:37-39, 291-296)
let (holdSeconds, inkSeconds) = MainActor.assumeIsolated { (Game.holdSeconds, Game.inkSeconds) }
func window(_ k: Int, of n: Int) -> (Double, Double) { MainActor.assumeIsolated { Game.window(k, of: n) } }
let fmt = AVAudioFormat(standardFormatWithSampleRate: rate, channels: 2)!
let wavSettings: [String: Any] = [
  AVFormatIDKey: kAudioFormatLinearPCM, AVSampleRateKey: rate, AVNumberOfChannelsKey: 2,
  AVLinearPCMBitDepthKey: 32, AVLinearPCMIsFloatKey: true, AVLinearPCMIsBigEndianKey: false,
  AVLinearPCMIsNonInterleaved: false,
]

func say(_ s: String) { FileHandle.standardError.write((s + "\n").data(using: .utf8)!) }

/// Sfx.buffer (Sfx.swift:353-362)
func pcm(_ s: Synth.Stereo) -> AVAudioPCMBuffer {
  let b = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: AVAudioFrameCount(s.l.count))!
  b.frameLength = AVAudioFrameCount(s.l.count)
  s.l.withUnsafeBufferPointer { b.floatChannelData![0].update(from: $0.baseAddress!, count: s.l.count) }
  s.r.withUnsafeBufferPointer { b.floatChannelData![1].update(from: $0.baseAddress!, count: s.r.count) }
  return b
}

func writeWav(_ s: Synth.Stereo, _ name: String) throws {
  let f = try AVAudioFile(
    forWriting: URL(fileURLWithPath: "\(out)/\(name).wav"), settings: wavSettings,
    commonFormat: .pcmFormatFloat32, interleaved: false)
  try f.write(from: pcm(s))
}

/// Sfx.chord (Sfx.swift:182-203): every bowl of the spread in one buffer,
/// each part scaled by 1/sqrt(n).
func chord(_ notes: [(Int, Bool)]) -> Synth.Stereo {
  let parts = notes.map { Synth.bowl(midi: $0.0, dark: $0.1) }
  let n = parts.map(\.l.count).max() ?? 0
  var l = [Float](repeating: 0, count: n), r = l
  let k = 1 / Float(parts.count).squareRoot()
  for p in parts {
    for i in 0..<p.l.count {
      l[i] += p.l[i] * k
      r[i] += p.r[i] * k
    }
  }
  return (l, r)
}

let names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
func noteName(_ m: Int) -> String { "\(names[m % 12])\(m / 12 - 1)" }

/// Measured facts about a buffer: its peak and how far down it is when it ends.
func measure(_ s: Synth.Stereo) -> [String: Any] {
  let n = s.l.count
  var peak: Float = 0
  for i in 0..<n { peak = max(peak, abs(s.l[i]), abs(s.r[i])) }
  let w = Int(0.02 * rate)
  func rms(_ a: Int) -> Double {
    var acc = 0.0
    let b = min(n, a + w)
    for i in a..<b { acc += Double(s.l[i] * s.l[i] + s.r[i] * s.r[i]) / 2 }
    return (acc / Double(max(1, b - a))).squareRoot()
  }
  var best = 0.0
  var a = 0
  while a + w <= n { best = max(best, rms(a)); a += w / 2 }
  let end = rms(max(0, n - w))
  return [
    "frames": n, "seconds": Double(n) / rate,
    "peak_dbfs": 20 * log10(Double(max(peak, 1e-9))),
    "end_vs_loudest_20ms_db": 20 * log10(max(end, 1e-12) / max(best, 1e-12)),
  ]
}

// =====================================================================
//  The dry voices, exactly as Synth makes them
// =====================================================================

var facts: [String: Any] = [:]
var dry: [[String: Any]] = []

func keep(_ s: Synth.Stereo, _ name: String, _ info: [String: Any]) throws {
  try writeWav(s, name)
  var m = measure(s)
  for (k, v) in info { m[k] = v }
  m["name"] = name
  dry.append(m)
  say("  \(name)")
}

// the notes the app actually synthesises (Sfx.swift:112, 118)
let spreadNotes = Set(Spread.all.flatMap(\.notes)).sorted()
say("dry voices")
for m in spreadNotes {
  try keep(
    Synth.bowl(midi: m, dark: false), "dry-bowl-bright-\(noteName(m).lowercased())",
    ["voice": "bowl-bright", "midi": m, "note": noteName(m), "hz": Synth.hz(m)])
}
for m in spreadNotes.map({ $0 - 12 }).sorted() {
  try keep(
    Synth.bowl(midi: m, dark: true), "dry-bowl-dark-\(noteName(m).lowercased())",
    ["voice": "bowl-dark", "midi": m, "note": noteName(m), "hz": Synth.hz(m)])
}
// the moon's door bell, asked for (Keeping.swift:227) but never made, so never heard
try keep(
  Synth.bowl(midi: 79, dark: false), "dry-bowl-bright-g5-unheard",
  ["voice": "bowl-bright", "midi": 79, "note": "G5", "hz": Synth.hz(79), "unheard": true])
for (i, m) in Synth.chimeScale.enumerated() {
  try keep(
    Synth.chime(midi: m), String(format: "dry-chime-%02d-%@", i + 1, noteName(m).lowercased()),
    ["voice": "chime", "midi": m, "note": noteName(m), "hz": Synth.hz(m), "index": i])
}
try keep(Synth.drone(), "dry-drone-loop", ["voice": "drone"])
try keep(Synth.swell(), "dry-swell", ["voice": "swell"])
try keep(Synth.noise(dur: 0.06, decay: 62, cutoff: 0.32, bite: 0.5), "dry-tick", ["voice": "tick"])
try keep(Synth.noise(dur: 0.30, decay: 14, cutoff: 0.10, bite: 0.18), "dry-slide", ["voice": "slide"])
try keep(Synth.thud(), "dry-thud", ["voice": "thud"])
try keep(Synth.riffle(), "dry-riffle", ["voice": "riffle"])

let three = Spread.all.first { $0.id == "three" }!.notes
let road = Spread.all.first { $0.id == "road" }!.notes
let chords: [(String, [(Int, Bool)])] = [
  ("dry-chord-three-fates-upright", three.map { ($0, false) }),
  ("dry-chord-three-fates-reversed", three.map { ($0 - 12, true) }),
  ("dry-chord-long-road-upright", road.map { ($0, false) }),
  ("dry-chord-long-road-reversed", road.map { ($0 - 12, true) }),
]
for (name, notes) in chords {
  try keep(
    chord(notes), name,
    ["voice": "chord", "notes": notes.map { "\(noteName($0.0))\($0.1 ? " dark" : "")" }])
}
facts["dry"] = dry

// --- computed tables, from the app's own functions ---------------------

func bowlTable(_ m: Int, dark: Bool) -> [String: Any] {
  let ratios: [Double] = [1, 2.0, 2.71, 4.13, 5.40]  // Sfx.swift:392-395
  let amps: [Double] = dark ? [1, 0.10, 0.20, 0.05, 0.025] : [1, 0.12, 0.40, 0.15, 0.10]
  let decays: [Double] = dark ? [0.40, 1.0, 0.9, 1.7, 2.3] : [0.55, 1.4, 1.1, 2.1, 2.9]
  let beats: [Double] = dark ? [0.6, 1.0, 1.7, 2.3, 2.9] : [1.0, 1.6, 2.3, 3.2, 3.9]
  var rng = Rng(UInt32(m * 7 + (dark ? 3 : 1)))
  let ph = ratios.map { _ in rng.next() * 2 * .pi }
  let f0 = Synth.hz(m)
  return [
    "midi": m, "note": noteName(m), "voice": dark ? "dark" : "bright", "f0_hz": f0,
    "seed": m * 7 + (dark ? 3 : 1),
    "partials": (0..<5).map { k -> [String: Any] in
      let f = f0 * ratios[k]
      return [
        "ratio": ratios[k], "hz": f, "lower_twin_hz": f - beats[k] / 2,
        "upper_twin_hz": f + beats[k] / 2, "beat_hz": beats[k], "amp": amps[k],
        "decay_per_s": decays[k], "half_life_s": log(2) / decays[k],
        "phase_lower_rad": ph[k], "phase_upper_rad": ph[k] * 1.7, "dropped": f >= 14_000,
      ]
    },
  ]
}
facts["bowls"] =
  spreadNotes.map { bowlTable($0, dark: false) } + spreadNotes.map { bowlTable($0 - 12, dark: true) }
  + [bowlTable(79, dark: false)]
facts["chimes"] = Synth.chimeScale.enumerated().map { i, m -> [String: Any] in
  let f = Synth.hz(m)
  let tame = 1 / max(1, (f / 400).squareRoot())
  let t = Double(i) / 14
  return [
    "index": i, "midi": m, "note": noteName(m), "hz": f, "tame": tame, "peak_gain": 0.22 * tame,
    "ribbon_cards": (0..<78).filter { Int((Double($0) / 77 * 14).rounded()) == i }.count,
    "pan_at_note_centre": (t * 2 - 1) * 0.7,
  ]
}
do {
  func q(_ f: Double) -> Double { (f * 20).rounded() / 20 }
  facts["drone"] = [36, 43, 48, 55].enumerated().map { vi, m -> [String: Any] in
    [
      "midi": m, "note": noteName(m), "exact_hz": Synth.hz(m), "loop_hz": q(Synth.hz(m)),
      "amp": [0.30, 0.16, 0.12, 0.05][vi],
      "harmonics_hz": (1...4).map { Double($0) * q(Synth.hz(m)) },
      "right_channel_offset_hz": 0.15, "breathes": vi != 0,
    ]
  }
}
do {
  var r = Rng(515)
  var at = 0.0
  var on: [Double] = []
  for _ in 0..<11 {
    at += 0.028 + r.next() * 0.042
    on.append(at)
  }
  facts["riffle_onsets_s"] = on
  facts["riffle_seconds"] = at + 0.2
}
facts["spreads"] = Spread.all.map { s -> [String: Any] in
  [
    "id": s.id, "name": s.name,
    "slots": s.slots.enumerated().map { i, slot -> [String: Any] in
      let n = s.notes[i]
      let pan = s.count <= 1 ? 0 : (Double(i) / Double(s.count - 1) * 2 - 1) * 0.55
      return [
        "slot": slot, "upright": noteName(n), "upright_hz": Synth.hz(n), "reversed": noteName(n - 12),
        "reversed_hz": Synth.hz(n - 12), "pan": pan,
      ]
    },
    "chord_part_scale": 1 / Double(s.count).squareRoot(),
  ]
}

// =====================================================================
//  The room: Sfx's graph, rebuilt offline
// =====================================================================
//
// Two ways to play a sound through it:
//  - as the app does (Sfx.fire, Sfx.swift:324-338): 12 air and 6 hand
//    players used round robin, each new sound interrupting whatever its
//    player still plays, its gain set as the player's volume just before it
//    is scheduled. The mixer eases a volume change over ~1024 frames
//    (~23 ms, measured offline), so a sound's first moments start from
//    whatever gain its player last had. `State` carries the players'
//    volumes and cursors from one sequence to the next, as one session.
//  - intended: every sound on a player of its own, its gain set before
//    anything renders, scheduled at its exact sample. No stealing, no
//    easing. The score as written.
//
// Offline, a buffer scheduled "now" (at: nil) starts 3 blocks later with
// 64-frame blocks (measured: 192 frames); sounds are sent that much early,
// so they land within half a block (0.7 ms) of their time.

final class Room {
  enum Bus: String { case air, hand }
  struct State {
    var airCursor = 0, handCursor = 0
    var air = [(Float, Float)](repeating: (1, 0), count: 12)  // volume, pan (AVAudioPlayerNode defaults)
    var hand = [(Float, Float)](repeating: (1, 0), count: 6)
  }
  static let block = 64
  static let latency = 0
  let intended: Bool
  let engine = AVAudioEngine()
  let hall = AVAudioUnitReverb(), room = AVAudioUnitReverb()
  let airBus = AVAudioMixerNode(), handBus = AVAudioMixerNode()
  let drone = AVAudioPlayerNode(), swell = AVAudioPlayerNode()
  var air: [AVAudioPlayerNode] = [], hand: [AVAudioPlayerNode] = []
  var airCursor = 0, handCursor = 0
  var droneLevel: Float = 0, droneTarget: Float = 0
  let droneBuf = pcm(Synth.drone())
  let swellBuf = pcm(Synth.swell())
  private var events: [(s: Int, seq: Int, act: () -> Void)] = []
  private var own: [(AVAudioPlayerNode, AVAudioPCMBuffer, Int)] = []
  var cues: [[String: Any]] = []
  let master: Float = 0.5
  private var fading = 0, fades = 0  // the swell fade in progress (Sfx.swellFade)

  init(intended: Bool = false, state: State = State()) throws {
    self.intended = intended
    try engine.enableManualRenderingMode(.offline, format: fmt, maximumFrameCount: 512)
    for n in [hall, room, airBus, handBus, drone, swell] as [AVAudioNode] { engine.attach(n) }
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
    for k in 0..<12 {
      let n = AVAudioPlayerNode()
      engine.attach(n)
      engine.connect(n, to: airBus, format: fmt)
      (n.volume, n.pan) = state.air[k]
      air.append(n)
    }
    for k in 0..<6 {
      let n = AVAudioPlayerNode()
      engine.attach(n)
      engine.connect(n, to: handBus, format: fmt)
      (n.volume, n.pan) = state.hand[k]
      hand.append(n)
    }
    airCursor = state.airCursor
    handCursor = state.handCursor
    drone.volume = 0
    engine.mainMixerNode.outputVolume = master
  }

  var state: State {
    State(
      airCursor: airCursor, handCursor: handCursor, air: air.map { ($0.volume, $0.pan) },
      hand: hand.map { ($0.volume, $0.pan) })
  }

  /// The player the next sound on `bus` will use gets its gain now, before
  /// anything renders, so a lone voice is heard at its gain from the start.
  func prime(_ bus: Bus, gain: Float, pan: Float = 0) {
    let n = bus == .air ? air[airCursor % 12] : hand[handCursor % 6]
    n.volume = gain
    n.pan = pan
  }

  func sample(_ t: Double) -> Int { Int((t * rate).rounded()) }

  func at(_ t: Double, early: Bool = false, _ act: @escaping () -> Void) {
    events.append((max(0, sample(t) - (early ? Room.latency : 0)), events.count, act))
  }

  func note(_ t: Double, _ what: String, _ info: [String: Any] = [:]) {
    var c = info
    c["t"] = (t * 1000).rounded() / 1000
    c["what"] = what
    cues.append(c)
  }

  func fire(_ buf: AVAudioPCMBuffer, _ bus: Bus, gain: Float, pan: Float = 0, at t: Double, _ voice: String) {
    var info: [String: Any] = [
      "voice": voice, "bus": bus.rawValue, "gain": gain, "pan": (pan * 1000).rounded() / 1000,
    ]
    if intended {
      let node = AVAudioPlayerNode()
      engine.attach(node)
      engine.connect(node, to: bus == .air ? airBus : handBus, format: fmt)
      node.volume = gain
      node.pan = pan
      own.append((node, buf, sample(t)))
      note(t, "sound", info)
      return
    }
    let k = bus == .air ? airCursor % 12 : handCursor % 6
    info["player"] = "\(bus.rawValue) \(k + 1)"
    switch bus {
    case .air: airCursor += 1
    case .hand: handCursor += 1
    }
    note(t, "sound", info)
    at(t, early: true) { [unowned self] in
      let node = bus == .air ? air[k] : hand[k]
      node.volume = min(1, max(0, gain))
      node.pan = pan
      node.scheduleBuffer(buf, at: nil, options: .interrupts, completionHandler: nil)
    }
  }

  func mood(_ x: Float, at t: Double, log: Bool = true) {
    if log { note(t, "mood", ["level": x]) }
    at(t) { [unowned self] in droneTarget = min(1, max(0, x)) }
  }

  /// Sfx.startDrone (Sfx.swift:144-154): picked up at the sky's breath.
  /// Sequence time 0 stands for a wall-clock moment at the start of a breath.
  func startDrone(at t: Double, level: Float? = nil) {
    at(t, early: t > 0) { [unowned self] in
      if let level {
        droneLevel = level
        droneTarget = level
      }
      drone.volume = droneLevel
      let offset = Int(t.truncatingRemainder(dividingBy: 10) * rate) % Int(droneBuf.frameLength)
      drone.stop()
      if offset > 0 {
        let n = Int(droneBuf.frameLength) - offset
        let rest = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: AVAudioFrameCount(n))!
        rest.frameLength = AVAudioFrameCount(n)
        rest.floatChannelData![0].update(from: droneBuf.floatChannelData![0] + offset, count: n)
        rest.floatChannelData![1].update(from: droneBuf.floatChannelData![1] + offset, count: n)
        drone.scheduleBuffer(rest, at: nil, options: [])
      }
      drone.scheduleBuffer(droneBuf, at: nil, options: .loops)
      drone.play()
    }
  }

  /// Sfx.swellStart (Sfx.swift:284-293)
  func swellStart(from charge: Double, at t: Double) {
    note(t, "swell start", ["from_charge": charge, "volume": 0.55])
    at(t, early: true) { [unowned self] in
      let start = min(Int(swellBuf.frameLength) - 1, Int(charge * holdSeconds * rate))
      let n = Int(swellBuf.frameLength) - start
      let rest = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: AVAudioFrameCount(n))!
      rest.frameLength = AVAudioFrameCount(n)
      rest.floatChannelData![0].update(from: swellBuf.floatChannelData![0] + start, count: n)
      rest.floatChannelData![1].update(from: swellBuf.floatChannelData![1] + start, count: n)
      fading = 0  // swellFade?.cancel()
      swell.stop()
      swell.volume = 0.55
      swell.scheduleBuffer(rest, at: nil, options: .interrupts)
      swell.play()
    }
  }

  /// Sfx.swellStop (Sfx.swift:295-308): linear, in 20 ms steps.
  func swellStop(fade: Double, at t: Double) {
    note(t, "swell fade", ["seconds": fade])
    let steps = max(1, Int(fade / 0.02))
    fades += 1
    let id = fades
    var from: Float = 0.55
    at(t) { [unowned self] in
      fading = id
      from = swell.volume
    }
    for i in 1...steps {
      at(t + Double(i) * 0.02) { [unowned self] in
        guard fading == id else { return }
        swell.volume = from * (1 - Float(i) / Float(steps))
        if i == steps {
          swell.stop()
          swell.play()
        }
      }
    }
  }

  /// Sfx.hear (Sfx.swift:248-281), going quiet: master down in 12 x 20 ms,
  /// then every player stops (the engine pauses).
  func mute(at t: Double) {
    note(t, "mute", ["fade_ms": 240])
    for i in 1...12 {
      at(t + Double(i) * 0.02) { [unowned self] in
        engine.mainMixerNode.outputVolume = master * (1 - Float(i) / 12)
        if i == 12 { (air + hand + [swell, drone]).forEach { $0.stop() } }
      }
    }
  }

  /// ...and coming back: players again, the drone from 0 in step with the
  /// breath, master at once; then Game's unmute tick (Game.swift:806-810).
  func unmute(at t: Double, tick: AVAudioPCMBuffer) {
    note(t, "unmute")
    at(t, early: true) { [unowned self] in
      (air + hand + [swell]).forEach { $0.play() }
      droneLevel = 0
      drone.volume = 0
    }
    startDrone(at: t)
    at(t) { [unowned self] in engine.mainMixerNode.outputVolume = master }
    fire(tick, .hand, gain: 0.4, at: t, "tick")
  }

  /// Render `seconds` in 64-frame blocks.
  func render(_ seconds: Double, _ name: String, drone useDrone: Bool) throws {
    // Sfx.ease (Sfx.swift:229-242): 3.5% of the way every 33 ms
    if useDrone {
      var t = 0.033
      while t < seconds {
        at(t) { [unowned self] in
          if abs(droneTarget - droneLevel) > 0.001 {
            droneLevel += (droneTarget - droneLevel) * 0.035
          } else {
            droneLevel = droneTarget
          }
          drone.volume = droneLevel
        }
        t += 0.033
      }
    }
    try engine.start()
    (air + hand + [drone, swell]).forEach { $0.play() }
    for (node, buf, s) in own {
      node.scheduleBuffer(buf, at: AVAudioTime(sampleTime: AVAudioFramePosition(s), atRate: rate), options: [])
      node.play()
    }
    events.sort { ($0.s, $0.seq) < ($1.s, $1.seq) }
    let total = Int(seconds * rate)
    let buf = AVAudioPCMBuffer(pcmFormat: engine.manualRenderingFormat, frameCapacity: 512)!
    let file = try AVAudioFile(
      forWriting: URL(fileURLWithPath: "\(out)/\(name).wav"), settings: wavSettings,
      commonFormat: .pcmFormatFloat32, interleaved: false)
    var ei = 0
    var pos = 0
    while pos < total {
      while ei < events.count && events[ei].s < pos + Room.block / 2 {
        events[ei].act()
        ei += 1
      }
      let n = min(Room.block, total - pos)
      let st = try engine.renderOffline(AVAudioFrameCount(n), to: buf)
      guard st == .success else { throw NSError(domain: "render", code: Int(st.rawValue)) }
      try file.write(from: buf)
      pos += n
    }
    engine.stop()
    let data = try JSONSerialization.data(
      withJSONObject: [
        "name": name, "seconds": seconds, "mode": intended ? "intended" : "as the app plays it", "cues": cues,
      ], options: [.prettyPrinted, .sortedKeys])
    try data.write(to: URL(fileURLWithPath: "\(out)/cues-\(name).json"))
    say("  \(name)")
  }
}

let tick = pcm(Synth.noise(dur: 0.06, decay: 62, cutoff: 0.32, bite: 0.5))
let slide = pcm(Synth.noise(dur: 0.30, decay: 14, cutoff: 0.10, bite: 0.18))
let land = pcm(Synth.thud())
let riffle = pcm(Synth.riffle())
var bowls: [Int: AVAudioPCMBuffer] = [:]
func bowl(_ m: Int, _ dark: Bool) -> AVAudioPCMBuffer {
  let k = m * 2 + (dark ? 1 : 0)
  if let b = bowls[k] { return b }
  let b = pcm(Synth.bowl(midi: m, dark: dark))
  bowls[k] = b
  return b
}
let chimeBufs = Synth.chimeScale.map { pcm(Synth.chime(midi: $0)) }
func bowlName(_ m: Int, _ dark: Bool) -> String { "bowl \(dark ? "dark" : "bright") \(noteName(m))" }
/// Game.pan (Game.swift:656-658)
func slotPan(_ s: Int, of n: Int) -> Float { n <= 1 ? 0 : Float(Double(s) / Double(n - 1) * 2 - 1) * 0.55 }

// --- single voices through their rooms (no drone), each at its usual gain

say("voices in their rooms")
func single(_ name: String, _ buf: AVAudioPCMBuffer, _ bus: Room.Bus, gain: Float, pan: Float = 0, voice: String, tail: Double)
  throws
{
  let r = try Room()
  r.prime(bus, gain: gain, pan: pan)
  r.fire(buf, bus, gain: gain, pan: pan, at: 0.05, voice)
  try r.render(0.05 + Double(buf.frameLength) / rate + tail, name, drone: false)
}
try single("room-bowl-bright-g4", bowl(67, false), .air, gain: 0.5, voice: bowlName(67, false), tail: 6)
try single("room-bowl-dark-g3", bowl(55, true), .air, gain: 0.5, voice: bowlName(55, true), tail: 6)
try single("room-bowl-dark-c3-cut", bowl(48, true), .air, gain: 0.55, voice: bowlName(48, true), tail: 6)
try single(
  "room-chime-06-c5", chimeBufs[5], .air, gain: 0.11, pan: Float(5.0 / 14 * 2 - 1) * 0.7, voice: "chime C5", tail: 5)
try single(
  "room-chord-three-fates", pcm(chord(three.map { ($0, false) })), .air, gain: 0.34,
  voice: "chord Three Fates upright", tail: 6.5)
try single(
  "room-chord-long-road", pcm(chord(road.map { ($0, false) })), .air, gain: 0.34, voice: "chord Long Road upright",
  tail: 6.5)
do {
  let r = try Room()
  r.swellStart(from: 0, at: 0.05)
  try r.render(0.05 + 3.7 + 5, "room-swell", drone: false)
}
try single("room-tick", tick, .hand, gain: 0.45, voice: "tick", tail: 1.2)
try single("room-slide", slide, .hand, gain: 0.45, voice: "slide", tail: 1.2)
try single("room-thud", land, .hand, gain: 0.4, voice: "thud", tail: 1.2)
try single("room-riffle", riffle, .hand, gain: 0.8, voice: "riffle", tail: 1.2)

// --- the event sequences, timed as Game times them ----------------------
//
// One session, in order: launch, the ask and the cut, a sweep across the
// ribbon, three cards and the chord, the return, mute and unmute. Each is
// rendered as the app plays it (players carried over from the one before)
// and as intended.

say("sequences")

// 1. The ask and the cut (Game.swift:189-203, 236-268, 379-416)
func askAndCut(_ r: Room) {
  let H = 1.5, full = holdSeconds
  r.note(0, "rest", ["phase": "invocation"])
  r.startDrone(at: 0, level: 0.42)
  r.note(H, "press and hold")
  r.swellStart(from: 0, at: H)
  // the charge loop marks its turns every 16 ms; the drone follows the charge
  var t = H + 0.016
  while t < H + full {
    r.mood(Float(0.42 + 0.5 * (t - H) / full), at: t, log: false)
    t += 0.016
  }
  r.note(H, "mood ramp", ["from": 0.42, "to": 0.92, "over_s": full, "rule": "0.42 + 0.5 x charge"])
  let cut = H + full
  r.note(cut, "the cut (charge = 1)")
  r.swellStop(fade: 0.5, at: cut)
  r.fire(riffle, .hand, gain: 0.8, at: cut, "riffle")
  r.fire(bowl(48, true), .air, gain: 0.55, at: cut, bowlName(48, true))
  r.mood(0.62, at: cut)
}
let askLength = 1.5 + holdSeconds + 9.5

// 2. The ribbon as a harp (Sfx.swift:205-219, Game.swift:418-455)
func ribbonSweep(_ r: Room) {
  r.note(0, "the draw", ["cards": 78])
  r.startDrone(at: 0, level: 0.62)
  var lastChime = -1e9, lastNote = -1
  func hover(_ i: Int, at t: Double, again: Bool = false) {
    guard t - lastChime > 0.035 else { return }
    let x = Double(i) / 77
    let idx = Int((x * Double(chimeBufs.count - 1)).rounded())
    guard again || idx != lastNote || t - lastChime > 0.5 else { return }
    lastChime = t
    lastNote = idx
    r.fire(
      chimeBufs[idx], .air, gain: 0.11, pan: Float(x * 2 - 1) * 0.7, at: t,
      "chime \(noteName(Synth.chimeScale[idx])) (card \(i + 1))")
  }
  r.note(0.5, "fast sweep, left to right", ["seconds": 1.4])
  for i in 0..<78 { hover(i, at: 0.5 + Double(i) * 1.4 / 77) }
  r.note(3.0, "slow sweep, right to left", ["seconds": 5.0])
  for i in stride(from: 77, through: 0, by: -1) { hover(i, at: 3.0 + Double(77 - i) * 5.0 / 77) }
  r.note(9.0, "arrow-key steps, one card each", ["steps": 8, "every_s": 0.3])
  for k in 0..<8 { hover(30 + k, at: 9.0 + Double(k) * 0.3, again: true) }
}
let sweepLength = 9.0 + 7 * 0.3 + 5.5

// 3. Three cards landing, the recital and the chord (Game.swift:457-535)
var chordAt = 0.0
func threeCards(_ r: Room) {
  r.note(0, "the draw", ["spread": "Three Fates, all upright, no written question"])
  r.startDrone(at: 0, level: 0.62)
  let takes = [1.0, 3.2, 5.4]
  for (s, T) in takes.enumerated() {
    let m = three[s]
    r.note(T, "take card", ["slot": s])
    r.fire(slide, .hand, gain: 0.45, at: T, "slide")
    r.note(T + 0.16, "flip", ["slot": s, "seconds": 0.5])
    r.fire(land, .hand, gain: 0.4, at: T + 0.32, "thud")
    r.fire(bowl(m, false), .air, gain: 0.5, pan: slotPan(s, of: 3), at: T + 0.42, bowlName(m, false))
    r.note(T + 0.46, "ink begins", ["slot": s, "seconds": inkSeconds])
  }
  let reading = takes[2] + 0.46 + inkSeconds + 0.35
  r.note(reading, "reading begins")
  r.mood(0.78, at: reading)
  var t = reading + 0.9
  for s in 0..<3 {
    r.note(t, "line spoken", ["slot": s])
    r.fire(bowl(three[s], false), .air, gain: 0.26, pan: slotPan(s, of: 3), at: t, bowlName(three[s], false))
    t += 1.45
  }
  r.note(t, "light runs the thread; the spread rings as one chord")
  r.fire(pcm(chord(three.map { ($0, false) })), .air, gain: 0.34, at: t, "chord Three Fates upright")
  chordAt = t
}

// 4. The return (Game.swift:291-375)
func theReturn(_ r: Room) {
  let H = 1.5, full = holdSeconds, n = 3
  r.note(0, "the reading lies open", ["spread": "Three Fates, all upright"])
  r.startDrone(at: 0, level: 0.78)
  r.note(H, "press and hold to return")
  var t = H + 0.016
  var rung = Set<Int>()
  while t < H + full {
    let L = (t - H) / full
    for s in (0..<n).reversed() where !rung.contains(s) {
      let (a, _) = window(s, of: n)
      if L >= a {
        rung.insert(s)
        r.fire(bowl(three[s], false), .air, gain: 0.20, pan: slotPan(s, of: n), at: t, bowlName(three[s], false))
      }
    }
    r.mood(Float(0.78 - 0.48 * ramp(L, 0.08, 1)), at: t, log: false)
    t += 0.016
  }
  r.note(H, "mood ramp", ["from": 0.78, "to": 0.30, "over_s": full, "rule": "0.78 - 0.48 x ramp(L, 0.08, 1)"])
  let home = H + full
  r.mood(0.30, at: home - 0.001, log: false)
  r.note(home, "the cards go home")
  r.fire(slide, .hand, gain: 0.22, at: home, "slide")
  r.note(home + 0.45, "the table clears")
  r.mood(0.42, at: home + 0.45)
  r.fire(land, .hand, gain: 0.25, at: home + 1.05, "thud")
}
let returnLength = 1.5 + holdSeconds + 9

// 5. Mute and unmute (Sfx.swift:244-281, Game.swift:806-810)
func muteUnmute(_ r: Room) {
  r.note(0, "rest", ["phase": "invocation"])
  r.startDrone(at: 0, level: 0.42)
  r.mood(0.42, at: 0, log: false)
  r.mute(at: 4.0)
  r.unmute(at: 7.0, tick: tick)
}

// 1b. Let go early, then hold again (Game.swift:219-233, 284-293)
func letGoEarly(_ r: Room) {
  let full = holdSeconds
  let P1 = 1.0, R1 = 2.6, P2 = 3.0
  let c1 = (R1 - P1) / full  // 0.5 when let go
  let c2 = c1 - (P2 - R1) * 2 / full  // drained at 2x until pressed again
  let cut = P2 + (1 - c2) * full
  func charge(_ t: Double) -> Double {
    if t < P1 { return 0 }
    if t < R1 { return (t - P1) / full }
    if t < P2 { return max(0, c1 - (t - R1) * 2 / full) }
    return min(1, c2 + (t - P2) / full)
  }
  r.note(0, "rest", ["phase": "invocation"])
  r.startDrone(at: 0, level: 0.42)
  r.note(P1, "press and hold")
  r.swellStart(from: 0, at: P1)
  r.note(R1, "let go early", ["charge": c1])
  r.swellStop(fade: 0.35, at: R1)
  r.note(P2, "press again", ["charge": (c2 * 1000).rounded() / 1000])
  r.swellStart(from: c2, at: P2)
  var t = P1 + 0.016
  while t < cut {
    r.mood(Float(0.42 + 0.5 * charge(t)), at: t, log: false)
    t += 0.016
  }
  r.note(P1, "mood follows the charge", ["rule": "0.42 + 0.5 x charge"])
  r.note(cut, "the cut (charge = 1)")
  r.swellStop(fade: 0.5, at: cut)
  r.fire(riffle, .hand, gain: 0.8, at: cut, "riffle")
  r.fire(bowl(48, true), .air, gain: 0.55, at: cut, bowlName(48, true))
  r.mood(0.62, at: cut)
}

var session = Room.State()
func both(_ name: String, _ length: Double, mute: Bool = false, _ build: (Room) -> Void) throws {
  let r = try Room(state: session)
  build(r)
  try r.render(length, name, drone: true)
  session = r.state
  if mute { return }
  let i = try Room(intended: true)
  build(i)
  try i.render(length, name + "-intended", drone: true)
}
try both("seq-1-ask-and-cut", askLength, askAndCut)
do {
  // not part of the session: its own fresh launch
  let saved = session
  session = Room.State()
  try both("seq-1b-let-go-and-hold-again", 3.0 + 2.4 + 9.5, letGoEarly)
  session = saved
}
try both("seq-2-ribbon-sweep", sweepLength, ribbonSweep)
try both("seq-3-three-cards-and-chord", 5.4 + 0.46 + inkSeconds + 0.35 + 0.9 + 3 * 1.45 + 10, threeCards)
try both("seq-4-the-return", returnLength, theReturn)
try both("seq-5-mute-unmute", 13.0, mute: true, muteUnmute)

let data = try JSONSerialization.data(withJSONObject: facts, options: [.prettyPrinted, .sortedKeys])
try data.write(to: URL(fileURLWithPath: "\(out)/facts.json"))
say("done")
