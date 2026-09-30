import AppKit
import SwiftUI

// ARCANA_SHOT_MEASURE=1: the real window, measured offscreen (never ordered
// on screen). A titled, closable, miniaturizable, resizable window with full
// size content, a transparent title bar and a hidden title: what SwiftUI's
// .windowStyle(.hiddenTitleBar) makes. It hosts the (patched) RootView, so the
// room's own GeometryReader reports what it sees in a real window.

@MainActor func measureWindows(_ outDir: String) {
  func r(_ v: CGFloat) -> String { String(format: "%.2f", v) }
  let long = Date().timeIntervalSinceReferenceDate - 60
  let poses: [(String, CGSize, (Game) -> Void)] = [
    ("rest", CGSize(width: 1260, height: 860), { _ in }),
    ("rest", CGSize(width: 940, height: 660), { _ in }),
    ("reading", CGSize(width: 1260, height: 860), { g in
      // as the shot tool's read(g, spread: 1, picks: [4, 9, 15]), with the chord rung
      g.spreadIndex = 1; g.phase = .reading; g.dealt = true
      g.picks = [4, 9, 15]; g.faceUp = [4, 9, 15]; g.inked = [4, 9, 15]; g.recited = 3
      for s in 0..<3 { g.landed[s] = long }
      g.sounded = true
    }),
    ("draw", CGSize(width: 1260, height: 860), { g in g.phase = .draw; g.dealt = true }),
    ("keys", CGSize(width: 1260, height: 860), { g in g.legend = true }),
  ]
  for (pose, size, setUp) in poses {
    let w = NSWindow(
      contentRect: NSRect(origin: .zero, size: size),
      styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
      backing: .buffered, defer: true)
    w.isReleasedWhenClosed = false
    w.titlebarAppearsTransparent = true
    w.titleVisibility = .hidden
    shotRNG = SplitMix(seed: 9)
    shotSeen = nil
    let g = Game()
    setUp(g)
    let host = NSHostingView(rootView: RootView(game: g).environment(\.stillSky, true))
    w.contentView = host
    w.setContentSize(size)
    host.layoutSubtreeIfNeeded()
    RunLoop.main.run(until: Date().addingTimeInterval(0.8))
    // the room's WindowSetup enlarges a window smaller than it wants on first
    // showing (as the app does on a first launch); the minimum is measured as set
    w.setContentSize(size)
    host.layoutSubtreeIfNeeded()
    RunLoop.main.run(until: Date().addingTimeInterval(0.3))
    host.layoutSubtreeIfNeeded()
    let tag = "\(pose)-\(Int(size.width))x\(Int(size.height))"
    print("window \(tag): frame \(r(w.frame.width))x\(r(w.frame.height))",
      "contentView \(r(host.frame.width))x\(r(host.frame.height))",
      "contentLayoutRect y \(r(w.contentLayoutRect.minY)) h \(r(w.contentLayoutRect.height))",
      "titlebar \(r(w.frame.height - w.contentLayoutRect.height))",
      "host.safeAreaInsets top \(r(host.safeAreaInsets.top))",
      "backingScale \(r(w.backingScaleFactor))",
      "visible \(w.isVisible)")
    if let s = shotSeen {
      print("  RootView GeometryReader: size \(r(s.size.width))x\(r(s.size.height)) insets top \(r(s.insets.top)) leading \(r(s.insets.leading)) bottom \(r(s.insets.bottom)) trailing \(r(s.insets.trailing))")
    } else {
      print("  RootView GeometryReader: never laid out")
    }
    let kinds: [(String, NSWindow.ButtonType)] = [
      ("close", .closeButton), ("minimize", .miniaturizeButton), ("zoom", .zoomButton),
    ]
    for (name, kind) in kinds {
      guard let b = w.standardWindowButton(kind) else { continue }
      let f = b.convert(b.bounds, to: nil)
      // from the window's top-left corner, in points
      print("  \(name): x \(r(f.minX)) y \(r(w.frame.height - f.maxY)) w \(r(f.width)) h \(r(f.height)) centre (\(r(f.midX)), \(r(w.frame.height - f.midY))) hidden \(b.isHidden)")
    }
    if let bar = w.standardWindowButton(.closeButton)?.superview {
      let f = bar.convert(bar.bounds, to: nil)
      print("  titlebar view: y \(r(w.frame.height - f.maxY)) h \(r(f.height)) w \(r(f.width))")
    }
    // what AppKit itself draws of the hosted room (for comparison only)
    if let rep = host.bitmapImageRepForCachingDisplay(in: host.bounds) {
      host.cacheDisplay(in: host.bounds, to: rep)
      if let png = rep.representation(using: .png, properties: [:]) {
        try? png.write(to: URL(fileURLWithPath: "\(outDir)/appkit-\(tag).png"))
        print("  appkit cacheDisplay: \(rep.pixelsWide)x\(rep.pixelsHigh) px")
      }
    }
    // the whole frame view, title bar buttons included (a window that is not
    // key draws them as the system does for an inactive window)
    if let frame = host.superview, let rep = frame.bitmapImageRepForCachingDisplay(in: frame.bounds) {
      frame.cacheDisplay(in: frame.bounds, to: rep)
      if let png = rep.representation(using: .png, properties: [:]) {
        try? png.write(to: URL(fileURLWithPath: "\(outDir)/appkit-frame-\(tag).png"))
        print("  appkit frame view (\(type(of: frame))): \(rep.pixelsWide)x\(rep.pixelsHigh) px")
      }
    }
    w.contentView = nil
    w.close()
  }
}
