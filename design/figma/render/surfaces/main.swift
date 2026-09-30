import AppKit
import SwiftUI

// Renders the surfaces around the room for the Figma handoff: Settings in
// every state (the real AppKit field, in an offscreen window, never shown),
// the main window's frame, the keys page and its lines, the moon's door, and
// an invented kept.json. Nothing is put on screen, nothing is read from the
// user's kept readings or Keychain, nothing is sent, nothing sounds.
//
//   bin/surfaces <assets/surfaces dir> <work dir> [part …]
//   parts: settings chrome keys kept sample   (none: all)

_ = NSApplication.shared

let out = CommandLine.arguments[1]
let work = CommandLine.arguments[2]
let parts = Set(CommandLine.arguments.dropFirst(3))
func want(_ p: String) -> Bool { parts.isEmpty || parts.contains(p) }

var report: [String: Any] = [:]

let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!

/// 8 bits a channel, sRGB, whatever it was drawn in.
func flat(_ img: CGImage) -> CGImage {
  let ctx = CGContext(
    data: nil, width: img.width, height: img.height, bitsPerComponent: 8, bytesPerRow: 0,
    space: sRGB, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: img.width, height: img.height))
  return ctx.makeImage()!
}

func write(_ img: CGImage, _ path: String) {
  let url = URL(fileURLWithPath: path)
  try? FileManager.default.createDirectory(
    at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  let rep = NSBitmapImageRep(cgImage: flat(img))
  let png = rep.representation(using: .png, properties: [:])!
  try! png.write(to: url)
  print("✓ \(path.replacingOccurrences(of: out + "/", with: "")) \(img.width)×\(img.height)")
}

/// Points to pixels, top-left origin.
func crop(_ img: CGImage, _ r: CGRect, scale: CGFloat) -> CGImage {
  let px = CGRect(x: r.minX * scale, y: r.minY * scale, width: r.width * scale, height: r.height * scale)
    .integral.intersection(CGRect(x: 0, y: 0, width: img.width, height: img.height))
  return img.cropping(to: px)!
}

@MainActor func render<V: View>(_ view: V, scale: CGFloat) -> CGImage {
  let r = ImageRenderer(content: view)
  r.scale = scale
  // as the shot tool does: through NSImage, then flattened to 8 bits
  let ns = r.nsImage!
  let tiff = ns.tiffRepresentation!
  return NSBitmapImageRep(data: tiff)!.cgImage!
}

/// A view as its window's backing store would hold it, at `scale`, drawn by
/// AppKit itself (cacheDisplay), with the window never ordered in.
@MainActor func cache(_ view: NSView, scale: CGFloat) -> CGImage {
  // never on screen: stop at once if any window of ours is
  let pid = ProcessInfo.processInfo.processIdentifier
  let onScreen = (CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID) as? [[String: Any]] ?? [])
    .filter { ($0[kCGWindowOwnerPID as String] as? Int32) == pid }
  if !onScreen.isEmpty || view.window?.isVisible == true {
    print("× a window is on screen; stopping"); exit(3)
  }
  let b = view.bounds
  let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: Int(b.width * scale), pixelsHigh: Int(b.height * scale),
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  rep.size = b.size
  // drawn in sRGB, as the rest of the handoff is: an untagged (device) rep
  // would shift the pearl a few levels
  let tagged = rep.retagging(with: .sRGB)!
  view.cacheDisplay(in: b, to: tagged)
  return tagged.cgImage!
}

/// A window that draws as the one in front would: lit traffic lights, a
/// focus ring. It is never ordered in.
final class FrontWindow: NSWindow {
  override var isKeyWindow: Bool { true }
  override var isMainWindow: Bool { true }
  override var canBecomeKey: Bool { true }
  // AppKit asks these (private) before it lights the traffic lights and the
  // focus ring; a window never ordered in would otherwise draw as inactive
  @objc func _hasActiveAppearance() -> Bool { true }
  @objc func _hasActiveAppearanceIgnoringKeyFocus() -> Bool { true }
  @objc(_hasActiveAppearanceForStandardWindowButton:) func _lit(_ b: UInt) -> Bool { true }
  @objc func _hasActiveControls() -> Bool { true }
  @objc func _hasKeyAppearance() -> Bool { true }
  @objc func _hasMainAppearance() -> Bool { true }
  @objc func hasKeyAppearance() -> Bool { true }
  @objc func hasMainAppearance() -> Bool { true }
}

/// The window server clips a window to its corner radius (AppKit reports
/// 16 pt on this Mac for both windows); a backing-store capture is square.
func rounded(_ img: CGImage, radius: CGFloat, scale: CGFloat) -> CGImage {
  let ctx = CGContext(
    data: nil, width: img.width, height: img.height, bitsPerComponent: 8, bytesPerRow: 0,
    space: sRGB, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  let r = CGRect(x: 0, y: 0, width: img.width, height: img.height)
  ctx.addPath(CGPath(roundedRect: r, cornerWidth: radius * scale, cornerHeight: radius * scale, transform: nil))
  ctx.clip()
  ctx.draw(img, in: r)
  return ctx.makeImage()!
}

@MainActor func cornerRadius(_ w: NSWindow) -> Double {
  let sel = NSSelectorFromString("_cornerRadius")
  guard let m = class_getInstanceMethod(type(of: w), sel) else { return -1 }
  typealias F = @convention(c) (AnyObject, Selector) -> Double
  return unsafeBitCast(method_getImplementation(m), to: F.self)(w, sel)
}

func rectDict(_ r: CGRect) -> [String: Double] {
  ["x": r.minX, "y": r.minY, "w": r.width, "h": r.height]
}

MainActor.assumeIsolated {
  // no reading of the user's is read or written: the moon keeps only what is posed here
  Keeping.file = nil
  let long = Date().timeIntervalSinceReferenceDate - 60

  // =================================================================
  //  Settings, ⌘, — every state, the real SecureField
  // =================================================================
  if want("settings") {
    // an invented key, never a real one: only its length shows, as dots
    let fake = "sk-proj-INVENTEDxFORxTHExFIGMAxRENDERxONLYx0000"
    typealias H = SettingsView.Heard
    let states: [(String, String, H?, Bool, String)] = [
      ("empty", "", nil, false, "For find the thread."),
      ("typing", fake, nil, false, "For find the thread."),
      ("checking", fake, .asking, false, "Asking OpenAI…"),
      ("ready", fake, .said(.ready), false, "The thread is ready."),
      ("refused", fake, .said(.refused), false, "This key won't open the thread."),
      ("out-of-credit", fake, nil, true, "This key is out of credit."),
      ("unreachable", fake, .said(.unreachable), false, "OpenAI couldn't be reached."),
    ]
    var geo: [String: Any] = [:]
    for (name, key, heard, dry, _) in states {
      SettingsPose.key = key
      SettingsPose.heard = heard
      OpenAIKey.dry = dry ? [OpenAIKey.digest(key)] : []
      let host = NSHostingView(rootView: SettingsView())
      let content = host.fittingSize
      // the style SwiftUI's own Settings window has (read from it by
      // settings-probe): titled, closable, full-size content; not
      // miniaturizable, not resizable, so minimise and zoom are greyed
      let win = FrontWindow(
        contentRect: NSRect(origin: .zero, size: content),
        styleMask: [.titled, .closable, .fullSizeContentView], backing: .buffered, defer: false)
      win.isReleasedWhenClosed = false
      win.title = "Arcana Settings"
      win.appearance = NSAppearance(named: .aqua)
      host.sizingOptions = []
      win.contentView = host
      let bar = win.frame.height - win.contentLayoutRect.height
      win.setFrame(NSRect(x: 0, y: 0, width: content.width, height: content.height + bar), display: false)
      host.layoutSubtreeIfNeeded()
      // the field, focused, as it is when the window opens
      func fields(_ v: NSView) -> [NSTextField] {
        ((v as? NSTextField).map { [$0] } ?? []) + v.subviews.flatMap(fields)
      }
      let fs = fields(host)
      if let f = fs.first {
        win.makeFirstResponder(f)
        // the caret after the last letter, as after pasting, nothing selected
        let end = NSRange(location: (key as NSString).length, length: 0)
        f.currentEditor()?.selectedRange = end
        (f.currentEditor() as? NSTextView)?.scrollRangeToVisible(end)
      }
      win.displayIfNeeded()
      RunLoop.main.run(until: Date().addingTimeInterval(0.25))
      host.layoutSubtreeIfNeeded()
      let frame = win.contentView!.superview!
      frame.layoutSubtreeIfNeeded()
      RunLoop.main.run(until: Date().addingTimeInterval(0.1))
      write(rounded(cache(frame, scale: 2), radius: cornerRadius(win), scale: 2), "\(out)/settings/settings-window-\(name)@2x.png")
      write(cache(host, scale: 2), "\(work)/settings-content-\(name)@2x.png")
      if name == "empty" {
        var buttons: [String: Any] = [:]
        for (n, b) in [("close", NSWindow.ButtonType.closeButton), ("minimize", .miniaturizeButton), ("zoom", .zoomButton)] {
          if let btn = win.standardWindowButton(b) {
            // in window points, top-left origin
            let r = btn.convert(btn.bounds, to: nil)
            buttons[n] = [
              "x": r.minX, "y": win.frame.height - r.maxY, "w": r.width, "h": r.height,
              "enabled": btn.isEnabled,
            ] as [String: Any]
          }
        }
        let field = fs.first.map { f -> [String: Double] in
          let r = f.convert(f.bounds, to: nil)
          return ["x": r.minX, "y": win.frame.height - r.maxY, "w": r.width, "h": r.height]
        }
        geo = [
          "window_pt": ["w": win.frame.width, "h": win.frame.height],
          "content_pt": ["w": content.width, "h": content.height],
          "titlebar_h_pt": win.frame.height - win.contentLayoutRect.height,
          "title": win.title,
          "corner_radius_pt": cornerRadius(win),
          "style": "titled, closable, fullSizeContentView (styleMask 32771, as SwiftUI's Settings window has); not miniaturizable, not resizable: minimise and zoom greyed",
          "traffic_lights_pt": buttons,
          "secure_field_pt": field as Any,
          "field_class": fs.first.map { String(describing: type(of: $0)) } as Any,
        ]
      }
      win.close()
    }
    // SwiftUI's own Settings window, drawn by settings-probe as it is (never
    // key, so inactive): the ground truth the posed windows were matched to
    let real = "\(work)/real-settings-window@2x.png"
    if let d = FileManager.default.contents(atPath: real), let img = NSBitmapImageRep(data: d)?.cgImage {
      write(rounded(img, radius: 16, scale: 2), "\(out)/settings/settings-window-real-swiftui-inactive@2x.png")
    }
    report["settings"] = geo
  }

  // =================================================================
  //  The main window: hidden, transparent title bar over the sky
  // =================================================================
  if want("chrome") {
    var sizes: [String: Any] = [:]
    // three readings, posed in memory only (the shot tool's shelf)
    func shelfForWindow() -> [Kept] {
      func k(_ cards: [(String, Bool)], _ spread: Int, _ days: Double, _ q: String, _ t: WeaveResult? = nil) -> Kept {
        Kept(
          at: Date().addingTimeInterval(-days * 86_400), spread: Spread.all[spread],
          draws: cards.map { c in Draw(card: deck.first { $0.id == c.0 }!, reversed: c.1) },
          question: q, thread: t)
      }
      return [
        k([("hermit", false)], 0, 40, "Is it time to call her"),
        k([("sun", false), ("priestess", false), ("death", true)], 1, 12, "Should I leave the city before winter",
          WeaveResult(
            thread: "What was rooted is being lifted into the light. The hand that steadies it is already yours.",
            question: "What would you tend if no one were watching the roots?")),
        k([("fool", false), ("tower", true), ("empress", false), ("star", false), ("world", false)], 2, 3, ""),
      ]
    }
    let variants: [(String, CGSize, (Game) -> Void)] = [
      ("default", CGSize(width: 1260, height: 860), { _ in }),
      ("minimum", CGSize(width: 940, height: 660), { _ in }),
      ("default-keys-open", CGSize(width: 1260, height: 860), { g in g.legend = true }),
      ("minimum-keys-open", CGSize(width: 940, height: 660), { g in g.legend = true }),
      ("default-kept-three-cards", CGSize(width: 1260, height: 860), { g in
        g.keeping.pose(shelfForWindow())
        g.keeping.poseOpen(page: 1)
      }),
    ]
    for (name, size, pose) in variants {
      let g = Game()
      pose(g)
      let host = NSHostingView(
        rootView: RootView(game: g)
          .frame(maxWidth: .infinity, maxHeight: .infinity)
          .preferredColorScheme(.light)
          .environment(\.stillSky, true))
      let win = FrontWindow(
        contentRect: NSRect(origin: .zero, size: size),
        styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
        backing: .buffered, defer: false)
      win.isReleasedWhenClosed = false
      win.title = "Arcana"
      win.titleVisibility = .hidden
      win.titlebarAppearsTransparent = true
      win.appearance = NSAppearance(named: .aqua)
      win.backgroundColor = NSColor(red: 0.978, green: 0.968, blue: 0.948, alpha: 1)
      // as the app's .windowResizability(.contentMinSize): the room sets only a floor
      host.sizingOptions = []
      win.contentView = host
      // the window's frame is the stage plus its title bar, both 1260×860 in all
      win.setFrame(NSRect(origin: .zero, size: size), display: false)
      host.layoutSubtreeIfNeeded()
      win.displayIfNeeded()
      RunLoop.main.run(until: Date().addingTimeInterval(0.4))
      // the room grows a window smaller than it likes as it opens (WindowSetup);
      // the reader can then make it as small as 940×660
      win.setFrame(NSRect(origin: .zero, size: size), display: false)
      host.layoutSubtreeIfNeeded()
      win.displayIfNeeded()
      RunLoop.main.run(until: Date().addingTimeInterval(0.4))
      let frame = win.contentView!.superview!
      frame.layoutSubtreeIfNeeded()
      let shot = rounded(cache(frame, scale: 2), radius: cornerRadius(win), scale: 2)
      write(shot, "\(out)/window/window-\(name)-\(Int(size.width))x\(Int(size.height))@2x.png")
      // the title bar's strip: the traffic lights over the sky, the old key under them
      if name == "default" || name == "minimum" { write(crop(shot, CGRect(x: 0, y: 0, width: 300, height: 90), scale: 2), "\(out)/window/window-\(name)-corner-lights-and-key@2x.png") }
      var buttons: [String: Any] = [:]
      for (n, b) in [("close", NSWindow.ButtonType.closeButton), ("minimize", .miniaturizeButton), ("zoom", .zoomButton)] {
        if let btn = win.standardWindowButton(b) {
          let r = btn.convert(btn.bounds, to: nil)
          buttons[n] = [
            "x": r.minX, "y": win.frame.height - r.maxY, "w": r.width, "h": r.height,
            "enabled": btn.isEnabled, "hidden": btn.isHidden,
          ] as [String: Any]
          // each light alone, lit, at 2x
          if name == "default" {
            write(cache(btn, scale: 2), "\(out)/window/traffic-light-\(n)@2x.png")
          }
        }
      }
      sizes[name] = [
        "window_pt": ["w": win.frame.width, "h": win.frame.height],
        "content_layout_rect_pt": rectDict(win.contentLayoutRect),
        "titlebar_h_pt": win.frame.height - win.contentLayoutRect.height,
        "traffic_lights_pt": buttons,
        "safe_area_top_pt": host.safeAreaInsets.top,
        "corner_radius_pt": cornerRadius(win),
      ]
      win.close()
    }
    // the frame alone: lights and edge over nothing, for laying over any stage
    do {
      let size = CGSize(width: 1260, height: 860)
      let win = FrontWindow(
        contentRect: NSRect(origin: .zero, size: size),
        styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
        backing: .buffered, defer: false)
      win.isReleasedWhenClosed = false
      win.titleVisibility = .hidden
      win.titlebarAppearsTransparent = true
      win.appearance = NSAppearance(named: .aqua)
      win.isOpaque = false
      win.backgroundColor = .clear
      let empty = NSView(frame: NSRect(origin: .zero, size: size))
      win.contentView = empty
      win.displayIfNeeded()
      let frame = win.contentView!.superview!
      let img = cache(frame, scale: 2)
      write(crop(img, CGRect(x: 0, y: 0, width: 1260, height: 32), scale: 2), "\(out)/window/window-titlebar-overlay-1260@2x.png")
      win.close()
    }
    report["chrome"] = sizes
  }

  // =================================================================
  //  The keys page
  // =================================================================
  if want("keys") {
    var rows: [String: Any] = [:]
    for (name, size, scale) in [
      ("keys-page-1260x860", CGSize(width: 1260, height: 860), 2.0),
      ("keys-page-940x628", CGSize(width: 940, height: 628), 2.0),
    ] {
      let g = Game()
      g.legend = true
      LegendProbe.rows = [:]
      let img = render(
        RootView(game: g).frame(width: size.width, height: size.height).environment(\.stillSky, true),
        scale: scale)
      write(img, "\(out)/keys/\(name)@2x.png")
      rows[name] = [
        "title": rectDict(LegendProbe.title),
        "rows": (0..<LegendLine.all.count).map { rectDict(LegendProbe.rows[$0] ?? .zero) },
      ]
    }
    // the lines at 3x, cut from the page as it is laid over the default stage
    let g = Game()
    g.legend = true
    LegendProbe.rows = [:]
    let size = CGSize(width: 1260, height: 860)
    let img = render(
      RootView(game: g).frame(width: size.width, height: size.height).environment(\.stillSky, true),
      scale: 3)
    let names = ["left-right-choose", "type-your-question", "space-hold", "up-past-readings",
      "command-delete-forget-a-reading", "esc-back", "command-comma-settings"]
    var cuts: [[String: Double]] = []
    for (i, n) in names.enumerated() {
      guard let r = LegendProbe.rows[i] else { continue }
      // the whole line, 322 pt, with a margin of sky about it
      let c = r.insetBy(dx: -18, dy: -7)
      cuts.append(rectDict(c))
      write(crop(img, c, scale: 3), "\(out)/keys/keys-row-\(i + 1)-\(n)@3x.png")
    }
    let t = LegendProbe.title.insetBy(dx: -40, dy: -18)
    write(crop(img, t, scale: 3), "\(out)/keys/keys-title@3x.png")
    rows["crops_pt"] = cuts
    rows["title_crop_pt"] = rectDict(t)
    report["keys"] = rows
  }

  // =================================================================
  //  What the moon keeps
  // =================================================================
  if want("kept") {
    let asked = "Should I leave the city before winter"
    let longest = Quill.room(
      for: "Should I leave the city before winter, or wait for the light to come back to me",
      after: "", pasted: true)
    func kept(
      _ cards: [(String, Bool)], spread: Int, daysAgo: Double, question: String = "",
      thread: WeaveResult? = nil
    ) -> Kept {
      Kept(
        at: Date().addingTimeInterval(-daysAgo * 86_400), spread: Spread.all[spread],
        draws: cards.map { c in Draw(card: deck.first { $0.id == c.0 }!, reversed: c.1) },
        question: question, thread: thread)
    }
    let woven = WeaveResult(
      thread:
        "What was rooted is being lifted into the light. The hand that steadies it is already yours.",
      question: "What would you tend if no one were watching the roots?")
    let shelf = [
      kept([("hermit", false)], spread: 0, daysAgo: 40, question: "Is it time to call her"),
      kept(
        [("sun", false), ("priestess", false), ("death", true)], spread: 1, daysAgo: 12,
        question: asked, thread: woven),
      kept(
        [("fool", false), ("tower", true), ("empress", false), ("star", false), ("world", false)],
        spread: 2, daysAgo: 3),
    ]
    let stage = CGSize(width: 1260, height: 860)
    let small = CGSize(width: 940, height: 660)

    @MainActor func shoot(_ name: String, size: CGSize = stage, pose: (Game) -> Void) -> CGImage {
      let g = Game()
      pose(g)
      let img = render(
        RootView(game: g).frame(width: size.width, height: size.height).environment(\.stillSky, true),
        scale: 2)
      write(img, "\(out)/moon-door/\(name)@2x.png")
      return img
    }

    let one = shoot("kept-page-one-card") { g in
      g.keeping.pose(shelf)
      g.keeping.poseOpen(page: 0)
    }
    let three = shoot("kept-page-three-cards") { g in
      g.keeping.pose(shelf)
      g.keeping.poseOpen(page: 1)
    }
    let five = shoot("kept-page-five-cards") { g in
      g.keeping.pose(shelf)
      g.keeping.poseOpen(page: 2)
    }
    _ = shoot("kept-page-rising") { g in
      g.keeping.pose(shelf)
      g.keeping.poseOpen(page: 1, rising: 0.45)
    }
    _ = shoot("kept-page-remembered") { g in
      g.keeping.pose(shelf)
      g.keeping.poseOpen(page: 1, rising: 1, lines: 3)
    }
    _ = shoot("kept-page-threaded") { g in
      g.keeping.pose(shelf)
      g.keeping.poseOpen(page: 1, rising: 1, lines: 3, threaded: true)
    }
    _ = shoot("kept-page-one-card-remembered") { g in
      g.keeping.pose(shelf)
      g.keeping.poseOpen(page: 0, rising: 1, lines: 1)
    }
    _ = shoot("kept-page-altar") { g in
      g.keeping.pose(shelf)
      g.keeping.poseOpen(page: 1, rising: 1, lines: 3, threaded: true)
      g.keeping.poseAltar(2, at: long)
    }
    _ = shoot("kept-page-five-cards-940x660", size: small) { g in
      g.keeping.pose(shelf)
      g.keeping.poseOpen(page: 2, rising: 1, lines: 5)
    }
    let back = shoot("moon-one-moon-ago") { g in
      g.keeping.pose([kept([("moon", false), ("star", false), ("sun", true)], spread: 1, daysAgo: 29.6, question: asked)])
    }
    _ = shoot("moon-one-moon-ago-940x660", size: small) { g in
      g.keeping.pose([kept([("moon", false), ("star", false), ("sun", true)], spread: 1, daysAgo: 29.6, question: longest)])
    }
    let took = shoot("moon-breath-glow") { g in
      g.keeping.pose(shelf)
      g.keeping.poseGlow(at: Date().timeIntervalSinceReferenceDate - 1.7)
    }
    let hover = shoot("moon-hover") { g in
      g.keeping.pose(shelf)
      g.keeping.moonHover = true
    }
    let rest = shoot("moon-at-rest") { g in
      g.keeping.pose(shelf)
    }
    TurnPose.hover = true
    let lit = shoot("kept-page-three-cards-chevrons-hover") { g in
      g.keeping.pose(shelf)
      g.keeping.poseOpen(page: 1)
    }
    TurnPose.hover = false

    // --- details, cut from the pages at 2x ---
    let moon = Sky.moonCenter(stage)
    let r = Sky.moonRadius
    func detail(_ img: CGImage, _ at: CGRect, _ name: String) -> [String: Double] {
      // whole points, so each detail is an even number of pixels
      let rect = CGRect(x: at.minX.rounded(), y: at.minY.rounded(), width: at.width.rounded(), height: at.height.rounded())
      write(crop(img, rect, scale: 2), "\(out)/moon-door/\(name)@2x.png")
      return rectDict(rect)
    }
    var cuts: [String: Any] = [:]
    // the moon's corner: the moon, its label or its question
    let corner = CGRect(x: moon.x - 170, y: moon.y - 40, width: 340, height: 200)
    cuts["date-label"] = detail(three, CGRect(x: moon.x - 110, y: moon.y - 40, width: 220, height: 100), "detail-date-label")
    cuts["one-moon-ago"] = detail(back, corner, "detail-one-moon-ago")
    cuts["breath-glow"] = detail(took, CGRect(x: moon.x - 110, y: max(0, moon.y - 110), width: 220, height: 220), "detail-moon-breath-glow")
    cuts["moon-hover"] = detail(hover, CGRect(x: moon.x - 70, y: moon.y - 70, width: 140, height: 140), "detail-moon-hover")
    cuts["moon-rest"] = detail(rest, CGRect(x: moon.x - 70, y: moon.y - 70, width: 140, height: 140), "detail-moon-rest")
    // HOLD · REMEMBER, at the foot of the page
    let L3 = Layout(size: stage, slots: 3, phase: .reading)
    cuts["hold-remember"] = detail(three, CGRect(x: stage.width / 2 - 150, y: L3.askY - 24, width: 300, height: 48), "detail-hold-remember")
    // the chevrons, either side of the spread
    let reach = L3.slotW / 2 + 58
    let left = max(30, L3.slot(0).x - reach)
    let right = min(stage.width - 30, L3.slot(2).x + reach)
    let box = { (x: CGFloat) in CGRect(x: x - 60, y: L3.rowY - 80, width: 120, height: 160) }
    cuts["chevron-left"] = detail(three, box(left), "detail-chevron-left-rest")
    cuts["chevron-right"] = detail(three, box(right), "detail-chevron-right-rest")
    _ = detail(lit, box(left), "detail-chevron-left-hover")
    _ = detail(lit, box(right), "detail-chevron-right-hover")
    // the chevron in context: the spread's first card with the mark beside it
    let ctx = CGRect(x: left - 50, y: L3.rowY - L3.slotH / 2 - 30, width: L3.slot(0).x - left + L3.slotW / 2 + 70, height: L3.slotH + 60)
    cuts["chevron-in-context"] = detail(three, ctx, "detail-chevron-left-in-context")
    cuts["chevron_pts"] = ["left": ["x": left, "y": L3.rowY], "right": ["x": right, "y": L3.rowY]]
    // the page's written question over the spread
    cuts["question"] = detail(three, CGRect(x: stage.width / 2 - 260, y: L3.epigraphY - 30, width: 520, height: 60), "detail-kept-question")
    let L1 = Layout(size: stage, slots: 1, phase: .reading)
    let L5 = Layout(size: stage, slots: 5, phase: .reading)
    cuts["layouts"] = [
      "1": ["rowY": L1.rowY, "slotW": L1.slotW, "slotH": L1.slotH, "slots": [rectDict(CGRect(origin: L1.slot(0), size: .zero))], "askY": L1.askY, "epigraphY": L1.epigraphY],
      "3": ["rowY": L3.rowY, "slotW": L3.slotW, "slotH": L3.slotH, "slots": (0..<3).map { ["x": L3.slot($0).x, "y": L3.slot($0).y] }, "askY": L3.askY, "epigraphY": L3.epigraphY],
      "5": ["rowY": L5.rowY, "slotW": L5.slotW, "slotH": L5.slotH, "slots": (0..<5).map { ["x": L5.slot($0).x, "y": L5.slot($0).y] }, "askY": L5.askY, "epigraphY": L5.epigraphY],
      "moon": ["x": moon.x, "y": moon.y, "r": r],
    ]
    report["kept"] = cuts
    _ = one
    _ = five
  }

  // =================================================================
  //  kept.json, invented, in the app's own encoding
  // =================================================================
  if want("sample") {
    let f = ISO8601DateFormatter()
    func at(_ s: String) -> Date { f.date(from: s)! }
    func k(_ date: String, _ spread: Int, _ cards: [(String, Bool)], _ q: String, _ t: WeaveResult? = nil, back: String? = nil) -> Kept {
      var x = Kept(
        at: at(date), spread: Spread.all[spread],
        draws: cards.map { c in Draw(card: deck.first { $0.id == c.0 }!, reversed: c.1) },
        question: q, thread: t)
      x.broughtBack = back.map(at)
      // fixed, plainly invented ids, so the sample is the same at every run
      x.id = UUID(uuidString: String(format: "1A7E0000-0000-4000-8000-%012d", Int(date.prefix(10).replacingOccurrences(of: "-", with: ""))!))!
      return x
    }
    let shelf = Keeping.Shelf(readings: [
      k("2026-08-18T21:42:07Z", 0, [("hermit", false)], "Is it time to call her", back: "2026-09-17T08:03:51Z"),
      k(
        "2026-09-18T22:15:30Z", 1, [("sun", false), ("priestess", false), ("death", true)],
        "Should I leave the city before winter",
        WeaveResult(
          thread: "What was rooted is being lifted into the light. The hand that steadies it is already yours.",
          question: "What would you tend if no one were watching the roots?")),
      k("2026-09-27T20:31:12Z", 2, [("fool", false), ("tower", true), ("empress", false), ("star", false), ("world", false)], ""),
      k("2026-09-29T23:04:45Z", 1, [("cups-5", false), ("wands-queen", true), ("pentacles-10", false)], "What am I still carrying"),
    ])
    var text = String(data: try! Keeping.encoder.encode(shelf), encoding: .utf8)!
    // decodes as the app decodes it, before the note is added
    let back = try! Keeping.decoder.decode(Keeping.Shelf.self, from: Data(text.utf8))
    precondition(back.readings.count == 4)
    let note = "INVENTED EXAMPLE for the design handoff: not a real reading and not the user's file. It shows what ~/Library/Application Support/Arcana/kept.json holds, written by the app's own encoder (Keeping.swift:499-514). This _invented key is not in the real file; the app ignores unknown keys."
    precondition(text.hasPrefix("{\n"))
    text = "{\n  \"_invented\" : \"\(note)\",\n" + text.dropFirst(2)
    let withNote = try! Keeping.decoder.decode(Keeping.Shelf.self, from: Data(text.utf8))
    precondition(withNote.readings.count == 4)
    try! text.write(toFile: "\(out)/kept-sample.json", atomically: true, encoding: .utf8)
    print("✓ kept-sample.json")
  }

  if parts.contains("colortest") {
    let v = HStack(spacing: 0) {
      Palette.pearl.frame(width: 20, height: 20)
      Palette.text.frame(width: 20, height: 20)
      Palette.goldInk.frame(width: 20, height: 20)
      Palette.blood.frame(width: 20, height: 20)
    }
    write(render(v, scale: 2), "\(work)/ct-renderer.png")
    for cs in [("none", nil), ("srgb", NSColorSpace.sRGB), ("p3", NSColorSpace.displayP3)] as [(String, NSColorSpace?)] {
      let host = NSHostingView(rootView: v)
      let win = FrontWindow(contentRect: NSRect(x: 0, y: 0, width: 80, height: 20), styleMask: [.borderless], backing: .buffered, defer: false)
      win.isReleasedWhenClosed = false
      if let c = cs.1 { win.colorSpace = c }
      win.contentView = host
      host.layoutSubtreeIfNeeded(); win.displayIfNeeded()
      RunLoop.main.run(until: Date().addingTimeInterval(0.2))
      write(cache(host, scale: 2), "\(work)/ct-cache-\(cs.0).png")
      print(cs.0, win.colorSpace?.localizedName ?? "-", NSScreen.main?.colorSpace?.localizedName ?? "-")
      win.close()
    }
  }

  let data = try! JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys])
  let name = parts.isEmpty ? "all" : parts.sorted().joined(separator: "-")
  try! data.write(to: URL(fileURLWithPath: "\(work)/geometry-\(name).json"))
  print("✓ geometry-\(name).json")
}
