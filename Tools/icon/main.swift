import AppKit
import SwiftUI

// Renders the app icon from the same pen that draws the cards.
struct IconView: View {
  var body: some View {
    ZStack {
      Palette.void
      RadialGradient(
        colors: [Color(red: 0.22, green: 0.17, blue: 0.08), .clear],
        center: .center, startRadius: 40, endRadius: 560)
      MarksCanvas(marks: CardArt.iconMarks(), space: CGSize(width: 1024, height: 1024))
      if let g = Grain.image {
        g.resizable(resizingMode: .tile).blendMode(.overlay).opacity(0.10)
      }
    }
    .frame(width: 1024, height: 1024)
    .clipShape(RoundedRectangle(cornerRadius: 180, style: .continuous))
    .padding(60)
    .frame(width: 1144, height: 1144)
  }
}

_ = NSApplication.shared
let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "icon.png"

MainActor.assumeIsolated {
  let renderer = ImageRenderer(content: IconView())
  renderer.scale = 1
  guard let ns = renderer.nsImage,
    let tiff = ns.tiffRepresentation,
    let rep = NSBitmapImageRep(data: tiff),
    let png = rep.representation(using: .png, properties: [:])
  else {
    print("icon render failed")
    exit(1)
  }
  try? png.write(to: URL(fileURLWithPath: out))
  print("icon → \(out)")
}
