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
      CommandGroup(replacing: .help) {}
    }
  }
}
