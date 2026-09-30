import AppKit
import ObjectiveC
import SwiftUI

// Opens the app's real Settings scene (SwiftUI's own window for it) in a
// background-only process, with every way of ordering a window in turned into
// a no-op first, and every new window made fully transparent as a second
// guard. So the window SwiftUI makes is never on screen. Its title, style,
// size and buttons are written out, and its backing store is drawn (cacheDisplay).
// The SettingsView is the render copy's: no Keychain, no network.

let outDir = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "."
#if MAINWINDOW
let probeName = "window-probe"
#else
let probeName = "settings-probe"
#endif

nonisolated(unsafe) var blocked: [String] = []

func neuter(_ name: String) {
  let sel = NSSelectorFromString(name)
  guard let m = class_getInstanceMethod(NSWindow.self, sel) else { print("no \(name)"); return }
  let types = method_getTypeEncoding(m)
  let block: @convention(block) (NSWindow, AnyObject?) -> Void = { w, _ in blocked.append(name + " " + w.title) }
  let block0: @convention(block) (NSWindow) -> Void = { w in blocked.append(name + " " + w.title) }
  let imp = name.hasSuffix(":") ? imp_implementationWithBlock(block) : imp_implementationWithBlock(block0)
  method_setImplementation(m, imp)
  _ = types
}

func installGuards() {
// orderWindow:relativeTo: takes (NSInteger, NSInteger)
  do {
    let sel = NSSelectorFromString("orderWindow:relativeTo:")
    let m = class_getInstanceMethod(NSWindow.self, sel)!
    let block: @convention(block) (NSWindow, Int, Int) -> Void = { w, _, _ in blocked.append("orderWindow:relativeTo: " + w.title) }
    method_setImplementation(m, imp_implementationWithBlock(block))
  }
  for n in ["makeKeyAndOrderFront:", "orderFront:", "orderFrontRegardless", "orderBack:", "makeKeyWindow", "makeMainWindow", "deminiaturize:", "toggleFullScreen:"] {
    neuter(n)
  }
  do {
    // setIsVisible: takes a BOOL
    let sel = NSSelectorFromString("setIsVisible:")
    if let m = class_getInstanceMethod(NSWindow.self, sel) {
      let block: @convention(block) (NSWindow, Bool) -> Void = { w, v in if v { blocked.append("setIsVisible: " + w.title) } }
      method_setImplementation(m, imp_implementationWithBlock(block))
    }
  }
  // every window starts fully transparent
  do {
    let sel = #selector(NSWindow.init(contentRect:styleMask:backing:defer:))
    let m = class_getInstanceMethod(NSWindow.self, sel)!
    typealias Init = @convention(c) (NSWindow, Selector, NSRect, UInt, UInt, Bool) -> NSWindow
    let orig = unsafeBitCast(method_getImplementation(m), to: Init.self)
    let block: @convention(block) (NSWindow, NSRect, UInt, UInt, Bool) -> NSWindow = { w, r, s, b, d in
      let made = orig(w, sel, r, s, b, d)
      made.alphaValue = 0
      return made
    }
    method_setImplementation(m, imp_implementationWithBlock(block))
  }
}

@MainActor func onScreen() -> Int {
  let pid = ProcessInfo.processInfo.processIdentifier
  return (CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID) as? [[String: Any]] ?? [])
    .filter { ($0[kCGWindowOwnerPID as String] as? Int32) == pid }.count
}

/// Opens the room's window from inside Settings (its ordering is blocked).
struct Opener: View {
  @Environment(\.openWindow) private var openWindow
  var body: some View { Color.clear.frame(width: 0, height: 0).onAppear { openWindow(id: "room") } }
}

@main
struct SettingsProbe: App {
  init() {
    installGuards()
    NSApplication.shared.setActivationPolicy(.prohibited)
    Keeping.file = nil
    Timer.scheduledTimer(withTimeInterval: 0.01, repeats: true) { _ in
      MainActor.assumeIsolated {
        if onScreen() > 0 { print("× a window reached the screen"); exit(3) }
      }
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
      MainActor.assumeIsolated {
        // as the reader does: Arcana ▸ Settings…
        let app = NSApp.mainMenu?.items.first?.submenu
        guard let item = app?.items.first(where: { $0.title.hasPrefix("Settings") }), let a = item.action else {
          print("× no Settings item"); exit(5)
        }
        NSApp.sendAction(a, to: item.target, from: item)
      }
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
      MainActor.assumeIsolated {
        var d: [String: Any] = ["blocked": blocked, "on_screen": onScreen()]
        var wins: [[String: Any]] = []
        for w in NSApp.windows {
          var o: [String: Any] = [
            "class": String(describing: type(of: w)), "title": w.title,
            "frame": ["w": w.frame.width, "h": w.frame.height],
            "content": ["w": w.contentLayoutRect.width, "h": w.contentLayoutRect.height],
            "styleMask": w.styleMask.rawValue,
            "titled": w.styleMask.contains(.titled), "closable": w.styleMask.contains(.closable),
            "miniaturizable": w.styleMask.contains(.miniaturizable), "resizable": w.styleMask.contains(.resizable),
            "fullSizeContentView": w.styleMask.contains(.fullSizeContentView),
            "toolbar": w.toolbar != nil, "toolbarStyle": w.toolbarStyle.rawValue,
            "titlebarAppearsTransparent": w.titlebarAppearsTransparent, "titleVisibility": w.titleVisibility.rawValue,
            "visible": w.isVisible,
          ]
          var b: [String: Any] = [:]
          for (n, t) in [("close", NSWindow.ButtonType.closeButton), ("minimize", .miniaturizeButton), ("zoom", .zoomButton)] {
            if let btn = w.standardWindowButton(t) {
              let r = btn.convert(btn.bounds, to: nil)
              b[n] = ["enabled": btn.isEnabled, "hidden": btn.isHidden, "x": r.minX, "y": w.frame.height - r.maxY, "w": r.width]
            }
          }
          o["buttons"] = b
          wins.append(o)
          o["contentLayoutRect"] = ["x": w.contentLayoutRect.minX, "y": w.contentLayoutRect.minY, "w": w.contentLayoutRect.width, "h": w.contentLayoutRect.height]
          o["cornerRadius"] = { () -> Double in
            let sel = NSSelectorFromString("_cornerRadius")
            guard let m = class_getInstanceMethod(type(of: w), sel) else { return -1 }
            typealias F = @convention(c) (AnyObject, Selector) -> Double
            return unsafeBitCast(method_getImplementation(m), to: F.self)(w, sel)
          }()
          o["appearance"] = w.effectiveAppearance.name.rawValue
          o["tabbingMode"] = w.tabbingMode.rawValue
          o["collectionBehavior"] = w.collectionBehavior.rawValue
          o["minSize"] = ["w": w.minSize.width, "h": w.minSize.height]
          o["contentMinSize"] = ["w": w.contentMinSize.width, "h": w.contentMinSize.height]
          if w.title.contains("Settings"), let frame = w.contentView?.superview {
            frame.layoutSubtreeIfNeeded()
            w.displayIfNeeded()
            let bounds = frame.bounds
            let rep = NSBitmapImageRep(
              bitmapDataPlanes: nil, pixelsWide: Int(bounds.width * 2), pixelsHigh: Int(bounds.height * 2),
              bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
              colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!.retagging(with: .sRGB)!
            rep.size = bounds.size
            frame.cacheDisplay(in: bounds, to: rep)
            try? rep.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: "\(outDir)/real-settings-window@2x.png"))
          }
        }
        d["windows"] = wins
        let data = try! JSONSerialization.data(withJSONObject: d, options: [.prettyPrinted, .sortedKeys])
        try! data.write(to: URL(fileURLWithPath: "\(outDir)/\(probeName).json"))
        print("✓ \(probeName).json, on screen: \(onScreen())")
        exit(0)
      }
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + 8) { exit(4) }
  }

  var body: some Scene {
    WindowGroup("Arcana", id: "room") {
      Color.clear.frame(minWidth: 940, idealWidth: 1260, minHeight: 660, idealHeight: 860)
    }
    .windowStyle(.hiddenTitleBar)
    .windowResizability(.contentMinSize)
    .defaultSize(width: 1260, height: 860)
    #if MAINWINDOW
    // the room's window is made at launch as the app makes it (its ordering blocked)
    .restorationBehavior(.disabled)
    #else
    .defaultLaunchBehavior(.suppressed)
    .restorationBehavior(.disabled)
    #endif
    Settings {
      #if MAINWINDOW
      SettingsView().background(Opener())
      #else
      SettingsView()
      #endif
    }
    .windowResizability(.contentSize)
  }
}
