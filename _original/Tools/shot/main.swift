import AppKit
import SwiftUI

// Renders posed frames of the stage to PNG so the layout can be reviewed
// without a display. Not part of the app.

_ = NSApplication.shared

let outDir = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "."
let stage = CGSize(width: 1260, height: 860)

MainActor.assumeIsolated {
  @MainActor func shoot(_ name: String, pose: (Game) -> Void) {
    let g = Game()
    pose(g)
    let renderer = ImageRenderer(
      content: RootView(game: g).frame(width: stage.width, height: stage.height))
    renderer.scale = 1
    guard let ns = renderer.nsImage,
      let tiff = ns.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let png = rep.representation(using: .png, properties: [:])
    else {
      print("× \(name)")
      return
    }
    try? png.write(to: URL(fileURLWithPath: "\(outDir)/\(name).png"))
    print("✓ \(name)")
  }

  shoot("1-invocation") { _ in }
  shoot("2-draw") { g in
    g.phase = .draw
    g.dealt = true
  }
  shoot("3-mid") { g in
    g.phase = .draw
    g.dealt = true
    g.picks = [4]
    g.faceUp = [4]
  }
  shoot("4-reading") { g in
    g.phase = .reading
    g.dealt = true
    g.picks = [4, 9, 15]
    g.faceUp = [4, 9, 15]
  }
  shoot("5-inspect") { g in
    g.phase = .reading
    g.dealt = true
    g.picks = [4, 9, 15]
    g.faceUp = [4, 9, 15]
    g.inspecting = 1
  }
  shoot("6-five") { g in
    g.spreadIndex = 2
    g.phase = .reading
    g.dealt = true
    g.picks = [1, 5, 8, 13, 19]
    g.faceUp = [1, 5, 8, 13, 19]
  }
}
