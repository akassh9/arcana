import AVFoundation
let fmt = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 2)!
func ones(_ n: Int) -> AVAudioPCMBuffer {
  let b = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: AVAudioFrameCount(n))!; b.frameLength = AVAudioFrameCount(n)
  for i in 0..<n { b.floatChannelData![0][i] = 1; b.floatChannelData![1][i] = 1 }
  return b
}
func run(first: Int, chunk: Int, from: Float, to: Float, viaMain: Bool) throws {
  let e = AVAudioEngine()
  try e.enableManualRenderingMode(.offline, format: fmt, maximumFrameCount: 4096)
  let bus = AVAudioMixerNode(), p = AVAudioPlayerNode()
  [bus, p].forEach { e.attach($0) }
  if viaMain { e.connect(p, to: e.mainMixerNode, format: fmt) } else {
  e.connect(bus, to: e.mainMixerNode, format: fmt); e.connect(p, to: bus, format: fmt) }
  p.volume = from
  try e.start(); p.play()
  let out = AVAudioPCMBuffer(pcmFormat: e.manualRenderingFormat, frameCapacity: 4096)!
  if first > 0 { _ = try e.renderOffline(AVAudioFrameCount(first), to: out) }
  p.volume = to
  p.scheduleBuffer(ones(44100), at: nil, options: .interrupts)
  var vals: [Float] = []
  var n = 0
  while n < 8192 { _ = try e.renderOffline(AVAudioFrameCount(chunk), to: out); for i in 0..<Int(out.frameLength) { vals.append(out.floatChannelData![0][i]) }; n += chunk }
  let idx = [0, 1, 16, 64, 128, 256, 511, 512, 700, 1023, 1024, 1500, 2048, 3000, 4096, 6000, 8000]
  print("first \(first) chunk \(chunk) \(from)->\(to) main \(viaMain):", idx.map { String(format: "%d:%.3f", $0, vals[$0]) }.joined(separator: " "))
}
try run(first: 100, chunk: 512, from: 1, to: 0.1, viaMain: false)
try run(first: 100, chunk: 64, from: 1, to: 0.1, viaMain: false)
try run(first: 100, chunk: 512, from: 0.1, to: 1, viaMain: false)
try run(first: 0, chunk: 512, from: 1, to: 0.1, viaMain: false)
try run(first: 100, chunk: 512, from: 1, to: 0.1, viaMain: true)
