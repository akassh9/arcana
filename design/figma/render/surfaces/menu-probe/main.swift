import AppKit
import SwiftUI

// The app's own scenes and commands (copied from Sources/Arcana/ArcanaApp.swift),
// run as a background-only process that can never be activated, with its window
// suppressed at launch: SwiftUI builds the menu bar it ships, which is written out
// as JSON, and the process quits. No window is shown; the menu bar is never taken.

extension Notification.Name { static let arcanaKeys = Notification.Name("ArcanaKeys") }

let outPath = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "menus-probe.json"

func mods(_ m: NSEvent.ModifierFlags) -> String {
  var s = ""
  if m.contains(.control) { s += "⌃" }
  if m.contains(.option) { s += "⌥" }
  if m.contains(.shift) { s += "⇧" }
  if m.contains(.command) { s += "⌘" }
  if m.contains(.function) { s += "fn " }
  return s
}

func dump(_ menu: NSMenu) -> [[String: Any]] {
  menu.items.map { i in
    var d: [String: Any] = [:]
    if i.isSeparatorItem { return ["separator": true] }
    d["title"] = i.title
    if !i.keyEquivalent.isEmpty {
      d["key"] = i.keyEquivalent
      d["shortcut"] = mods(i.keyEquivalentModifierMask) + i.keyEquivalent.uppercased()
    }
    if i.isHidden { d["hidden"] = true }
    if i.isAlternate { d["alternate"] = true }
    if let a = i.action { d["action"] = NSStringFromSelector(a) }
    if i.view != nil { d["custom_view"] = String(describing: type(of: i.view!)) }
    if let sub = i.submenu { d["submenu"] = dump(sub); d["submenu_title"] = sub.title }
    return d
  }
}

@MainActor func visibleWindows() -> Int {
  let pid = ProcessInfo.processInfo.processIdentifier
  let on = (CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID) as? [[String: Any]] ?? [])
    .filter { ($0[kCGWindowOwnerPID as String] as? Int32) == pid }
  return on.count + NSApp.windows.filter(\.isVisible).count
}

@main
struct ProbeApp: App {
  init() {
    NSApplication.shared.setActivationPolicy(.prohibited)
    // a guard: should any window of ours ever be visible, take it away and fail
    Timer.scheduledTimer(withTimeInterval: 0.02, repeats: true) { _ in
      MainActor.assumeIsolated {
        if NSApp.windows.contains(where: \.isVisible) {
          NSApp.windows.forEach { $0.orderOut(nil) }
          print("× a window became visible"); exit(3)
        }
      }
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
      MainActor.assumeIsolated {
        var d: [String: Any] = [:]
        d["menus"] = NSApp.mainMenu.map(dump) ?? []
        d["help_menu_title"] = NSApp.helpMenu?.title as Any
        d["windows_menu_title"] = NSApp.windowsMenu?.title as Any
        d["visible_windows"] = visibleWindows()
        d["app_windows"] = NSApp.windows.count
        d["active"] = NSApp.isActive
        d["activation_policy"] = NSApp.activationPolicy().rawValue
        d["os"] = ProcessInfo.processInfo.operatingSystemVersionString
        let data = try! JSONSerialization.data(withJSONObject: d, options: [.prettyPrinted, .sortedKeys])
        try! data.write(to: URL(fileURLWithPath: outPath))
        print("✓ \(outPath) windows visible: \(visibleWindows())")
        exit(0)
      }
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + 8) { exit(4) }  // never waits unbounded
  }

  var body: some Scene {
    WindowGroup("Arcana") {
      Color.clear.frame(minWidth: 940, idealWidth: 1260, minHeight: 660, idealHeight: 860)
        .preferredColorScheme(.light)
    }
    .windowStyle(.hiddenTitleBar)
    .windowResizability(.contentMinSize)
    .defaultSize(width: 1260, height: 860)
    .defaultLaunchBehavior(.suppressed)
    .restorationBehavior(.disabled)
    .commands {
      CommandGroup(replacing: .newItem) {}
      CommandGroup(replacing: .help) {
        Button("The Keys") { NotificationCenter.default.post(name: .arcanaKeys, object: nil) }
          .keyboardShortcut("/", modifiers: .command)
      }
    }

    Settings {
      Color.clear.frame(width: 1, height: 1)
    }
    .windowResizability(.contentSize)
  }
}


