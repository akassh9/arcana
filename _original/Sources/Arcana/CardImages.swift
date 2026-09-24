import SwiftUI

// ===================================================================
//  The card as an object: stock, frame, art, letterpress band.
//  Faces are rasterised once and reused so the table stays at 60fps.
// ===================================================================

struct MarksCanvas: View {
  let marks: [Mark]
  let space: CGSize

  var body: some View {
    Canvas(rendersAsynchronously: false) { ctx, size in
      let s = min(size.width / space.width, size.height / space.height)
      ctx.scaleBy(x: s, y: s)
      for m in marks {
        if let f = m.fill {
          ctx.fill(m.path, with: .color(Palette.of(f)))
        }
        if let st = m.stroke {
          ctx.stroke(
            m.path, with: .color(Palette.of(st)),
            style: StrokeStyle(lineWidth: m.width, lineCap: .round, lineJoin: .round))
        }
      }
    }
    .drawingGroup()
  }
}

private let cardSize = CGSize(width: CardArt.cardW, height: CardArt.cardH)
private let artSize = CGSize(width: CardArt.artW, height: CardArt.artH)

struct CardFaceStatic: View {
  let draw: Draw

  var body: some View {
    ZStack {
      Palette.paper
      MarksCanvas(marks: CardArt.frameMarks(), space: cardSize)

      MarksCanvas(marks: CardArt.marks(draw.card.art), space: artSize)
        .frame(width: CardArt.artW, height: CardArt.artH)
        .rotationEffect(.degrees(draw.reversed ? 180 : 0))
        .position(x: 113, y: 176)

      Text(draw.card.roman)
        .font(.display(15))
        .tracking(3.2)
        .foregroundStyle(Palette.ink)
        .position(x: 114, y: 33)

      VStack(spacing: 4) {
        Text(draw.card.name.uppercased())
          .font(.display(17))
          .tracking(1.4)
          .foregroundStyle(Palette.ink)
          .lineLimit(2)
          .minimumScaleFactor(0.7)
          .multilineTextAlignment(.center)
        Text(draw.card.essence)
          .font(.italic(12.5))
          .foregroundStyle(Palette.blood)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        if draw.reversed {
          Rectangle()
            .fill(Palette.blood)
            .frame(width: 5, height: 5)
            .rotationEffect(.degrees(45))
            .padding(.top, 4)
        }
      }
      .frame(width: 182)
      .position(x: 113, y: 345)

      if let g = Grain.image {
        g.resizable(resizingMode: .tile)
          .blendMode(.multiply)
          .opacity(0.5)
          .allowsHitTesting(false)
      }
    }
    .frame(width: CardArt.cardW, height: CardArt.cardH)
    .clipped()
  }
}

struct CardBackStatic: View {
  var body: some View {
    ZStack {
      Palette.backStock
      MarksCanvas(marks: CardArt.backMarks(), space: cardSize)
      RadialGradient(
        colors: [.clear, Palette.ink.opacity(0.17)],
        center: .center, startRadius: 40, endRadius: 210)
        .blendMode(.multiply)
      if let g = Grain.image {
        g.resizable(resizingMode: .tile)
          .blendMode(.multiply)
          .opacity(0.5)
          .allowsHitTesting(false)
      }
    }
    .frame(width: CardArt.cardW, height: CardArt.cardH)
    .clipped()
  }
}

@MainActor
final class CardImages {
  static let shared = CardImages()
  private var faces: [String: Image] = [:]
  private var backCache: Image?
  private let scale: CGFloat = 2.5

  private func render<V: View>(_ view: V) -> Image {
    let renderer = ImageRenderer(content: view)
    renderer.scale = scale
    if let ns = renderer.nsImage { return Image(nsImage: ns) }
    return Image(systemName: "rectangle")
  }

  func back() -> Image {
    if let b = backCache { return b }
    let img = render(CardBackStatic())
    backCache = img
    return img
  }

  func face(_ draw: Draw) -> Image {
    let key = draw.card.id + (draw.reversed ? "/r" : "/u")
    if let f = faces[key] { return f }
    let img = render(CardFaceStatic(draw: draw))
    faces[key] = img
    return img
  }

  /// Called before a card starts moving, so the flip never hitches.
  func prewarm(_ draw: Draw) { _ = face(draw) }
}

// --- the flip -------------------------------------------------------

/// Animates the turn itself: the face is swapped exactly at the edge.
struct FlipCard: View, Animatable {
  var angle: Double
  let draw: Draw
  let size: CGSize

  var animatableData: Double {
    get { angle }
    set { angle = newValue }
  }

  var body: some View {
    ZStack {
      CardImages.shared.back()
        .interpolation(.high)
        .resizable()
        .opacity(angle < 90 ? 1 : 0)
      CardImages.shared.face(draw)
        .interpolation(.high)
        .resizable()
        .rotation3DEffect(.degrees(180), axis: (x: 0, y: 1, z: 0))
        .opacity(angle < 90 ? 0 : 1)
    }
    .frame(width: size.width, height: size.height)
    .rotation3DEffect(.degrees(angle), axis: (x: 0, y: 1, z: 0), perspective: 0.4)
  }
}
