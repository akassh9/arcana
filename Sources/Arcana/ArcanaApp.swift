import SwiftUI

@main
struct ArcanaApp: App {
  var body: some Scene {
    WindowGroup("Arcana") {
      RootView()
        .frame(
          minWidth: 940, idealWidth: 1260,
          minHeight: 660, idealHeight: 860)
        .preferredColorScheme(.light)
    }
    .windowStyle(.hiddenTitleBar)
    .windowResizability(.contentMinSize)
    .defaultSize(width: 1260, height: 860)
    .commands {
      CommandGroup(replacing: .newItem) {}
      // ⌘? opens this menu; ⌘/ opens the keys straight away
      CommandGroup(replacing: .help) {
        Button("The Keys") { NotificationCenter.default.post(name: .arcanaKeys, object: nil) }
          .keyboardShortcut("/", modifiers: .command)
      }
    }
  }
}
