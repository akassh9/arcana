import AppKit
import Metal
import QuartzCore
import SwiftUI

// ===================================================================
//  The near sky, drawn on the GPU at the display's own pace.
//
//  Everything that drifts in the light is a short list of soft shapes —
//  discs, glows, rings, an arc, glints — reckoned from the time for each
//  frame and handed to one small shader. SwiftUI is never asked to redraw
//  the sky, so the dust can move as smoothly as the display allows.
// ===================================================================

/// A colour as the shader takes it: sRGB, straight alpha.
struct Tone {
  var rgba: SIMD4<Float>

  init(_ c: Color) {
    let n = NSColor(c).usingColorSpace(.sRGB) ?? .black
    rgba = SIMD4(
      Float(n.redComponent), Float(n.greenComponent), Float(n.blueComponent),
      Float(n.alphaComponent))
  }

  private init(rgba: SIMD4<Float>) { self.rgba = rgba }

  func opacity(_ a: Double) -> Tone {
    var v = rgba
    v.w = Float(clamp01(Double(v.w) * a))
    return Tone(rgba: v)
  }

  /// The colour premultiplied by its alpha, as gradients are blended.
  var premultiplied: SIMD4<Float> {
    SIMD4(rgba.x * rgba.w, rgba.y * rgba.w, rgba.z * rgba.w, rgba.w)
  }

  static let white = Tone(.white)
  static let gold = Tone(Palette.gold)
  static let goldLit = Tone(Palette.goldLit)
  static let goldInk = Tone(Palette.goldInk)
}

/// One soft shape, laid out as the shader reads it.
struct Sprite {
  enum Kind: Float { case disc = 0, glow, ring, arc, spikes }

  var geo: SIMD4<Float>  // centre x, y; radius; line width — in points
  var c0: SIMD4<Float>  // colours, premultiplied
  var c1: SIMD4<Float>
  var c2: SIMD4<Float>
  var shape: SIMD4<Float>  // kind; how far it reaches from its centre; start angle; sweep
}

/// A frame of the near sky: its shapes, in the order they are laid.
struct SkyPaint {
  private(set) var sprites: [Sprite] = []

  init() { sprites.reserveCapacity(320) }

  /// A filled disc.
  mutating func disc(_ p: CGPoint, _ r: Double, _ c: Tone) {
    add(.disc, p, r, 0, reach: r + 1, c, c, c)
  }

  /// A disc of soft light, from `c0` at its centre through `c1` half way
  /// out to `c2` at its edge.
  mutating func glow(_ p: CGPoint, _ r: Double, _ c0: Tone, _ c1: Tone, _ c2: Tone) {
    add(.glow, p, r, 0, reach: r + 1, c0, c1, c2)
  }

  mutating func glow(_ p: CGPoint, _ r: Double, _ from: Tone, _ to: Tone) {
    add(.glow, p, r, 0, reach: r + 1, from, nil, to)
  }

  /// A circle, stroked.
  mutating func ring(_ p: CGPoint, _ r: Double, width: Double, _ c: Tone) {
    add(.ring, p, r, width, reach: r + width / 2 + 1, c, c, c)
  }

  /// Part of a circle, stroked with round ends: from angle `a`, clockwise
  /// on the screen, through `sweep`.
  mutating func arc(
    _ p: CGPoint, _ r: Double, width: Double, from a: Double, through sweep: Double, _ c: Tone
  ) {
    add(.arc, p, r, width, reach: r + width / 2 + 1, c, c, c, a, sweep)
  }

  /// A glint: an upright arm `l` long each way, thinning from `width` at
  /// the heart to nothing and fading as it goes, and level arms `level` as long.
  mutating func spikes(_ p: CGPoint, _ l: Double, width: Double, level: Double = 0.62, _ c: Tone) {
    add(.spikes, p, l, width, reach: l + width + 1, c, c, c, level)
  }

  /// With no middle colour, the middle stop is halfway between the two.
  private mutating func add(
    _ kind: Sprite.Kind, _ p: CGPoint, _ r: Double, _ w: Double, reach: Double,
    _ c0: Tone, _ c1: Tone?, _ c2: Tone, _ a: Double = 0, _ sweep: Double = 0
  ) {
    let p0 = c0.premultiplied, p2 = c2.premultiplied
    let p1 = c1?.premultiplied ?? (p0 + p2) * 0.5
    // what could not be seen is not drawn
    guard max(p0.w, p1.w, p2.w) > 0 else { return }
    sprites.append(
      Sprite(
        geo: SIMD4(Float(p.x), Float(p.y), Float(r), Float(w)), c0: p0, c1: p1, c2: p2,
        shape: SIMD4(kind.rawValue, Float(reach), Float(a), Float(sweep))))
  }
}

// --- the shader -----------------------------------------------------

/// Each shape is a square just large enough to hold it; the fragment
/// shader measures how much of each pixel the shape covers, so every edge
/// is antialiased the way a vector renderer would. Colours arrive
/// premultiplied, and a glow's stops are blended premultiplied, as
/// SwiftUI blends a gradient.
private let skyShader = """
  #include <metal_stdlib>
  using namespace metal;

  struct Sprite { float4 geo; float4 c0; float4 c1; float4 c2; float4 shape; };
  struct Frame { float2 size; float px; float unused; };

  struct Out {
    float4 position [[position]];
    float2 p;
    uint id [[flat]];
  };

  vertex Out skyVertex(uint v [[vertex_id]], uint i [[instance_id]],
                       const device Sprite *sprites [[buffer(0)]],
                       constant Frame &f [[buffer(1)]]) {
    Sprite s = sprites[i];
    float2 p = float2((v & 1) ? 1.0 : -1.0, (v & 2) ? 1.0 : -1.0) * s.shape.y;
    float2 at = s.geo.xy + p;
    Out o;
    o.position = float4(at.x / f.size.x * 2 - 1, 1 - at.y / f.size.y * 2, 0, 1);
    o.p = p;
    o.id = i;
    return o;
  }

  // how much of a pixel a line of width w covers, d from its middle
  static float band(float d, float w, float px) {
    float x = abs(d) / px, h = 0.5 * w / px;
    return saturate(min(x + h, 0.5) - max(x - h, -0.5));
  }

  // how much of a pixel lies inside an edge, d from it (inside < 0)
  static float inside(float d, float px) { return saturate(0.5 - d / px); }

  // one arm of a glint, `along` its length from the heart and `across` it:
  // as wide as w at the heart, thinning to nothing at len, and fading
  static float arm(float along, float across, float len, float w, float px) {
    if (len <= 0 || along >= len) return 0;
    float t = along / len;
    return band(across, w * (1 - t), px) * (1 - t) * (1 - t);
  }

  fragment float4 skyFragment(Out in [[stage_in]],
                              const device Sprite *sprites [[buffer(0)]],
                              constant Frame &f [[buffer(1)]]) {
    Sprite s = sprites[in.id];
    float2 p = in.p;
    float d = length(p);
    float r = s.geo.z, w = s.geo.w;
    float4 c = s.c0;
    float k = 0;
    switch (int(s.shape.x)) {
    case 0:
      k = inside(d - r, f.px);
      break;
    case 1: {
      float t = saturate(d / r) * 2;
      c = t < 1 ? mix(s.c0, s.c1, t) : mix(s.c1, s.c2, t - 1);
      k = inside(d - r, f.px);
      break;
    }
    case 2:
      k = band(d - r, w, f.px);
      break;
    case 3: {
      float a = s.shape.z, sweep = s.shape.w;
      float phi = atan2(p.y, p.x) - a;
      phi -= 2 * M_PI_F * floor(phi / (2 * M_PI_F));
      float e = d - r;
      if (phi > sweep) {
        float2 e0 = r * float2(cos(a), sin(a));
        float2 e1 = r * float2(cos(a + sweep), sin(a + sweep));
        e = min(distance(p, e0), distance(p, e1));
      }
      k = band(e, w, f.px);
      break;
    }
    case 4: {
      // arms of light that thin to nothing: upright, and level
      float2 q = abs(p);
      k = max(arm(q.y, q.x, r, w, f.px), arm(q.x, q.y, r * s.shape.z, w, f.px));
      break;
    }
    }
    c *= k;
    if (c.a <= 0) discard_fragment();
    return c;
  }
  """

// --- the GPU --------------------------------------------------------

/// One device, one pipeline, and a way to draw a frame of the near sky
/// into any texture: the layer's next drawable, or a still for the shot
/// tool. Everything it holds is immutable and safe to use from any thread.
final class SkyRenderer: @unchecked Sendable {
  static let shared = SkyRenderer()
  static let format = MTLPixelFormat.bgra8Unorm
  /// Room for every shape a frame can hold, with some to spare.
  static let capacity = 1024

  let device: MTLDevice
  let queue: MTLCommandQueue
  private let pipeline: MTLRenderPipelineState

  private init?() {
    guard let device = MTLCreateSystemDefaultDevice(), let queue = device.makeCommandQueue(),
      let library = try? device.makeLibrary(source: skyShader, options: nil)
    else { return nil }
    let d = MTLRenderPipelineDescriptor()
    d.vertexFunction = library.makeFunction(name: "skyVertex")
    d.fragmentFunction = library.makeFunction(name: "skyFragment")
    let c = d.colorAttachments[0]!
    c.pixelFormat = Self.format
    c.isBlendingEnabled = true
    c.sourceRGBBlendFactor = .one
    c.sourceAlphaBlendFactor = .one
    c.destinationRGBBlendFactor = .oneMinusSourceAlpha
    c.destinationAlphaBlendFactor = .oneMinusSourceAlpha
    guard let pipeline = try? device.makeRenderPipelineState(descriptor: d) else { return nil }
    self.device = device
    self.queue = queue
    self.pipeline = pipeline
  }

  func makeBuffer() -> MTLBuffer? {
    device.makeBuffer(
      length: Self.capacity * MemoryLayout<Sprite>.stride, options: .storageModeShared)
  }

  /// Encodes one frame: the texture is cleared, and the shapes laid on it.
  func encode(
    _ paint: SkyPaint, size: CGSize, scale: CGFloat, into target: MTLTexture,
    buffer: MTLBuffer, _ commands: MTLCommandBuffer
  ) {
    let pass = MTLRenderPassDescriptor()
    pass.colorAttachments[0].texture = target
    pass.colorAttachments[0].loadAction = .clear
    pass.colorAttachments[0].clearColor = MTLClearColor(red: 0, green: 0, blue: 0, alpha: 0)
    pass.colorAttachments[0].storeAction = .store
    guard let encoder = commands.makeRenderCommandEncoder(descriptor: pass) else { return }
    let n = min(paint.sprites.count, buffer.length / MemoryLayout<Sprite>.stride)
    if n > 0 {
      paint.sprites.withUnsafeBytes { raw in
        buffer.contents().copyMemory(
          from: raw.baseAddress!, byteCount: n * MemoryLayout<Sprite>.stride)
      }
      var frame = SIMD4<Float>(Float(size.width), Float(size.height), Float(1 / scale), 0)
      encoder.setRenderPipelineState(pipeline)
      encoder.setVertexBuffer(buffer, offset: 0, index: 0)
      encoder.setFragmentBuffer(buffer, offset: 0, index: 0)
      encoder.setVertexBytes(&frame, length: MemoryLayout.size(ofValue: frame), index: 1)
      encoder.setFragmentBytes(&frame, length: MemoryLayout.size(ofValue: frame), index: 1)
      encoder.drawPrimitives(type: .triangleStrip, vertexStart: 0, vertexCount: 4, instanceCount: n)
    }
    encoder.endEncoding()
  }

  /// A still of one frame, read back from the GPU — for the shot tool,
  /// which cannot see a Metal layer.
  func still(_ paint: SkyPaint, size: CGSize, scale: CGFloat) -> CGImage? {
    let w = Int((size.width * scale).rounded()), h = Int((size.height * scale).rounded())
    guard w > 0, h > 0, let buffer = makeBuffer(), let commands = queue.makeCommandBuffer()
    else { return nil }
    let desc = MTLTextureDescriptor.texture2DDescriptor(
      pixelFormat: Self.format, width: w, height: h, mipmapped: false)
    desc.usage = .renderTarget
    desc.storageMode = device.hasUnifiedMemory ? .shared : .managed
    guard let texture = device.makeTexture(descriptor: desc) else { return nil }
    encode(paint, size: size, scale: scale, into: texture, buffer: buffer, commands)
    if texture.storageMode == .managed, let blit = commands.makeBlitCommandEncoder() {
      blit.synchronize(resource: texture)
      blit.endEncoding()
    }
    commands.commit()
    commands.waitUntilCompleted()
    var bytes = [UInt8](repeating: 0, count: w * h * 4)
    texture.getBytes(
      &bytes, bytesPerRow: w * 4, from: MTLRegionMake2D(0, 0, w, h), mipmapLevel: 0)
    guard let space = CGColorSpace(name: CGColorSpace.sRGB),
      let ctx = CGContext(
        data: &bytes, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: space,
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
          | CGBitmapInfo.byteOrder32Little.rawValue)
    else { return nil }
    return ctx.makeImage()
  }
}

// --- the layer and its clock ----------------------------------------

/// The near sky's own view: a Metal layer, and a display link that runs at
/// the display's pace — quick while the question is held or light ripples
/// out, gentler while the room only breathes — and rests whenever no one
/// can see it. It never takes a click.
///
/// Each frame's shapes are reckoned on the main thread, which is quick;
/// handing them to the GPU and the display is done on a queue of its own,
/// so the main thread never waits on the display.
final class SkyView: NSView {
  /// One frame of shapes, for a canvas of this size at this time.
  var paint: ((CGSize, TimeInterval) -> SkyPaint)?
  var lively = false {
    didSet { if lively != oldValue { pace() } }
  }
  /// The sky moves by itself — not with Reduce Motion, when it is still.
  var moving = false {
    didSet { link?.isPaused = !running }
  }
  /// Someone can see it.
  var seen = false {
    didSet { link?.isPaused = !running }
  }
  private var running: Bool { moving && seen }

  private var link: CADisplayLink?
  private var buffers: [MTLBuffer] = []
  private var turn = 0
  /// The drawable's size in pixels, and its scale, as last set.
  private var sized = CGSize.zero
  private let hand = DispatchQueue(label: "arcana.sky", qos: .userInteractive)
  /// One frame at a time is on its way to the display; while it is, the
  /// clock lets its ticks go rather than queue them up.
  private let gate = DispatchSemaphore(value: 1)

  private var metal: CAMetalLayer? { layer as? CAMetalLayer }

  override init(frame: NSRect) {
    super.init(frame: frame)
    wantsLayer = true
    layerContentsRedrawPolicy = .never
    // one more than the layer has drawables: a buffer is written only once
    // a drawable is free, which is once the frame that last used it is done
    let n = (metal?.maximumDrawableCount ?? 3) + 1
    buffers = (0..<n).compactMap { _ in SkyRenderer.shared?.makeBuffer() }
    setAccessibilityElement(false)
  }

  required init?(coder: NSCoder) { fatalError("not used") }

  deinit { link?.invalidate() }

  override func makeBackingLayer() -> CALayer {
    let l = CAMetalLayer()
    l.device = SkyRenderer.shared?.device
    l.pixelFormat = SkyRenderer.format
    l.colorspace = CGColorSpace(name: CGColorSpace.sRGB)
    l.framebufferOnly = true
    l.isOpaque = false
    return l
  }

  override var isOpaque: Bool { false }
  override func hitTest(_ point: NSPoint) -> NSView? { nil }

  override func viewDidMoveToWindow() {
    super.viewDidMoveToWindow()
    link?.invalidate()
    link = nil
    guard window != nil else { return }
    let l = displayLink(target: Tick(self), selector: #selector(Tick.fire(_:)))
    l.isPaused = !running
    l.add(to: .main, forMode: .common)
    link = l
    pace()
    fit()
  }

  override func setFrameSize(_ newSize: NSSize) {
    super.setFrameSize(newSize)
    fit()
  }

  override func viewDidChangeBackingProperties() {
    super.viewDidChangeBackingProperties()
    fit()
  }

  /// A still sky is drawn again as soon as what it shows has changed; a
  /// running clock shows it on its next tick, and an unseen sky waits.
  func refresh() {
    guard seen, !moving else { return }
    guard gate.wait(timeout: .now()) == .success else {
      // the last frame is still on its way; look again in a moment
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) { [weak self] in self?.refresh() }
      return
    }
    draw(at: Date().timeIntervalSinceReferenceDate)
  }

  fileprivate func fire(_ l: CADisplayLink) {
    guard gate.wait(timeout: .now()) == .success else { return }
    // drawn for the moment it will be seen
    draw(at: Date().timeIntervalSinceReferenceDate + (l.targetTimestamp - CACurrentMediaTime()))
  }

  private func pace() {
    link?.preferredFrameRateRange =
      lively
      ? CAFrameRateRange(minimum: 60, maximum: 120, preferred: 120)
      : CAFrameRateRange(minimum: 30, maximum: 60, preferred: 60)
  }

  private func fit() {
    guard let metal else { return }
    let s = window?.backingScaleFactor ?? 2
    let px = CGSize(width: (bounds.width * s).rounded(), height: (bounds.height * s).rounded())
    guard px.width > 0, px.height > 0, px != sized || metal.contentsScale != s else { return }
    // the drawable is resized only between frames, never while one is on its way
    guard gate.wait(timeout: .now()) == .success else {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.01) { [weak self] in self?.fit() }
      return
    }
    metal.contentsScale = s
    metal.drawableSize = px
    sized = px
    gate.signal()
    refresh()
  }

  /// Called holding the gate; lets it go once the frame is handed over.
  private func draw(at now: TimeInterval) {
    guard let paint, let metal, let r = SkyRenderer.shared, window != nil,
      bounds.width > 0, bounds.height > 0, !buffers.isEmpty
    else {
      gate.signal()
      return
    }
    let p = paint(bounds.size, now)
    let size = bounds.size, scale = metal.contentsScale
    let buffer = buffers[turn]
    turn = (turn + 1) % buffers.count
    let gate = self.gate
    hand.async {
      defer { gate.signal() }
      guard let drawable = metal.nextDrawable(), let commands = r.queue.makeCommandBuffer()
      else { return }
      r.encode(p, size: size, scale: scale, into: drawable.texture, buffer: buffer, commands)
      commands.present(drawable)
      commands.commit()
    }
  }
}

/// Holds the view weakly, so its display link never keeps it alive.
private final class Tick: NSObject {
  weak var view: SkyView?
  init(_ view: SkyView) { self.view = view }

  @objc func fire(_ l: CADisplayLink) {
    MainActor.assumeIsolated { view?.fire(l) }
  }
}

/// The near sky in SwiftUI. What it shows is read from the game for every
/// frame by `paint`; the view itself changes only when the pace does, or
/// when a still sky must show something new.
struct SkyLayer: NSViewRepresentable {
  let lively: Bool
  let moving: Bool
  let seen: Bool
  let paint: (CGSize, TimeInterval) -> SkyPaint

  func makeNSView(context: Context) -> SkyView { SkyView(frame: .zero) }

  func updateNSView(_ v: SkyView, context: Context) {
    v.paint = paint
    v.lively = lively
    v.moving = moving
    v.seen = seen
    v.refresh()
  }
}

private struct StillSkyKey: EnvironmentKey {
  static let defaultValue = false
}

extension EnvironmentValues {
  /// Set by the shot tool: the near sky is drawn as a picture, since an
  /// `ImageRenderer` cannot see a Metal layer.
  var stillSky: Bool {
    get { self[StillSkyKey.self] }
    set { self[StillSkyKey.self] = newValue }
  }
}
