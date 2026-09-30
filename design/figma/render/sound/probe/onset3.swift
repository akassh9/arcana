import AVFoundation
let fmt = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 2)!
func ones(_ n: Int) -> AVAudioPCMBuffer {
  let b = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: AVAudioFrameCount(n))!; b.frameLength = AVAudioFrameCount(n)
  for i in 0..<n { b.floatChannelData![0][i] = 1; b.floatChannelData![1][i] = 1 }
  return b
}
func test(_ label: String, at: Int?, opts: AVAudioPlayerNodeBufferOptions, chunk: Int = 512) {
  let e = AVAudioEngine()
  try! e.enableManualRenderingMode(.offline, format: fmt, maximumFrameCount: 512)
  let p = AVAudioPlayerNode()
  e.attach(p); e.connect(p, to: e.mainMixerNode, format: fmt)
  try! e.start(); p.play()
  let out = AVAudioPCMBuffer(pcmFormat: e.manualRenderingFormat, frameCapacity: 512)!
  var vals: [Float] = []
  func r(_ n: Int) { _ = try! e.renderOffline(AVAudioFrameCount(n), to: out); for i in 0..<Int(out.frameLength) { vals.append(out.floatChannelData![0][i]) } }
  r(500); r(500)
  p.scheduleBuffer(ones(300), at: at.map { AVAudioTime(sampleTime: AVAudioFramePosition($0), atRate: 44100) }, options: opts)
  for _ in 0..<(3000 / chunk) { r(chunk) }
  print(label, "starts", vals.firstIndex { $0 > 0 } ?? -1, "ends", vals.lastIndex { $0 > 0 } ?? -1)
}
test("at 1100 none", at: 1100, opts: [])
test("at 1100 interrupts", at: 1100, opts: .interrupts)
test("at 1000 none", at: 1000, opts: [])
test("nil none", at: nil, opts: [])
test("nil interrupts", at: nil, opts: .interrupts)
test("nil interrupts chunk64", at: nil, opts: .interrupts, chunk: 64)
test("nil none chunk 100", at: nil, opts: [], chunk: 100)
