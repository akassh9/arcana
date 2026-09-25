import SwiftUI

// ===================================================================
//  The card as an object: stock, frame, art, letterpress band.
//  Faces are rasterised once and reused so the table stays at 60fps;
//  only a card that is being revealed is drawn live, stroke by stroke.
// ===================================================================

struct MarksCanvas: View {
  let marks: [Mark]
  let space: CGSize
  var tint: Tint = .card

  var body: some View {
    Canvas(rendersAsynchronously: false) { ctx, size in
      let s = min(size.width / space.width, size.height / space.height)
      ctx.scaleBy(x: s, y: s)
      for m in marks {
        if let f = m.fill { ctx.fill(m.path, with: fillShading(f, m.path, tint)) }
        if let st = m.stroke {
          ctx.stroke(
            m.path, with: .color(tint.of(st)),
            style: StrokeStyle(lineWidth: m.width, lineCap: .round, lineJoin: .round))
        }
      }
    }
    .drawingGroup()
  }
}

/// Gold fills are laid as leaf: a banded gradient across the shape.
private func fillShading(_ c: InkColor, _ path: Path, _ tint: Tint) -> GraphicsContext.Shading {
  guard c == .gold, tint.gilded else { return .color(tint.of(c)) }
  let r = path.boundingRect
  return .linearGradient(
    Palette.leaf,
    startPoint: CGPoint(x: r.minX, y: r.minY),
    endPoint: CGPoint(x: r.maxX, y: r.maxY))
}

private let cardSize = CGSize(width: CardArt.cardW, height: CardArt.cardH)
private let artSize = CGSize(width: CardArt.artW, height: CardArt.artH)

/// The card face at any stage of being drawn. `ink` 1 is the finished card.
struct CardFace: View {
  let draw: Draw
  var ink: Double = 1

  var body: some View {
    let finished = ink >= 0.999
    ZStack {
      Palette.paper

      if finished {
        MarksCanvas(marks: CardArt.frame, space: cardSize)
      } else {
        InkCanvas(marks: CardArt.frame, space: cardSize, progress: ramp(ink, 0, 0.22), spread: 0.5)
      }

      Group {
        if finished {
          MarksCanvas(marks: CardArt.art(draw.card.art), space: artSize)
        } else {
          InkCanvas(
            marks: CardArt.art(draw.card.art), space: artSize,
            progress: clamp01((ink - 0.05) / 0.87), spread: 0.62)
        }
      }
      .frame(width: CardArt.artW, height: CardArt.artH)
      .rotationEffect(.degrees(draw.reversed ? 180 : 0))
      .position(x: 113, y: 176)

      Text(draw.card.roman)
        .font(.display(15))
        .tracking(3.2)
        .foregroundStyle(Palette.ink)
        .position(x: 114, y: 33)
        .opacity(ramp(ink, 0.46, 0.74))

      VStack(spacing: 4) {
        Text(draw.card.name.uppercased())
          .font(.display(17))
          .tracking(1.4)
          .foregroundStyle(Palette.ink)
          .lineLimit(2)
          .minimumScaleFactor(0.7)
          .multilineTextAlignment(.center)
          .opacity(ramp(ink, 0.62, 0.9))
        Text(draw.card.essence)
          .font(.italic(12.5))
          .foregroundStyle(Palette.blood)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
          .opacity(ramp(ink, 0.72, 1))
        if draw.reversed {
          Rectangle()
            .fill(Palette.blood)
            .frame(width: 5, height: 5)
            .rotationEffect(.degrees(45))
            .padding(.top, 4)
            .opacity(ramp(ink, 0.8, 1))
        }
      }
      .frame(width: 182)
      .position(x: 113, y: 345)

      // old stock under candlelight — a breath of shadow at the edges
      RadialGradient(
        colors: [.clear, Palette.candle.opacity(0.16)],
        center: .center, startRadius: 110, endRadius: 250)
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

/// Marks being written: each line is laid down from its start, led by a
/// bright nib, and cools from gold into ink as it dries.
struct InkCanvas: View {
  let marks: [Mark]
  let space: CGSize
  let progress: Double
  /// How much of the timeline the starts are spread across; the rest is
  /// the time each line takes. Lower is more simultaneous.
  var spread: Double = 0.6

  var body: some View {
    Canvas(rendersAsynchronously: false) { ctx, size in
      let s = min(size.width / space.width, size.height / space.height)
      ctx.scaleBy(x: s, y: s)
      let n = Double(max(marks.count - 1, 1))
      let len = 1 - spread

      for (i, m) in marks.enumerated() {
        let start = Double(i) / n * spread
        let local = clamp01((progress - start) / len)
        guard local > 0 else { continue }
        let e = 1 - pow(1 - local, 2.2)  // quick to start, careful to finish

        if let f = m.fill {
          let a = ramp(local, 0.35, 1)
          ctx.opacity = a
          ctx.fill(m.path, with: fillShading(f, m.path, .card))
          ctx.opacity = 1
        }

        guard let st = m.stroke else { continue }
        let drawn = e >= 0.999 ? m.path : m.path.trimmedPath(from: 0, to: e)
        let cool = ramp(local, 0.25, 1)
        let style = StrokeStyle(lineWidth: m.width, lineCap: .round, lineJoin: .round)
        ctx.stroke(drawn, with: .color(Palette.gold.opacity(1 - cool)), style: style)
        ctx.stroke(drawn, with: .color(Palette.of(st).opacity(cool)), style: style)

        // the nib: a point of light where the line is being laid
        if local < 1 {
          let tip = m.path.trimmedPath(from: max(0, e - 0.06), to: e)
          ctx.stroke(
            tip, with: .color(Palette.goldLit.opacity(0.9 * (1 - local))),
            style: StrokeStyle(lineWidth: m.width * 2.4, lineCap: .round))
        }
      }
    }
  }
}

/// Marks pressed into the stock rather than printed on it: each line a
/// groove, its upper wall in shade and its lower wall catching the light
/// from the upper left. `flip` turns the light with art that is drawn
/// upside down, so it always falls from the same side.
struct Pressed: View {
  let marks: [Mark]
  let space: CGSize
  var strength = 1.0
  var flip: CGFloat = 1

  var body: some View {
    ZStack {
      MarksCanvas(marks: marks, space: space, tint: .only(Color.white.opacity(0.95 * strength)))
        .offset(x: 0.7 * flip, y: 0.8 * flip)
      MarksCanvas(marks: marks, space: space, tint: .only(Palette.shade.opacity(0.24 * strength)))
        .offset(x: -0.5 * flip, y: -0.6 * flip)
      MarksCanvas(marks: marks, space: space, tint: .only(Palette.shade.opacity(0.08 * strength)))
    }
  }
}

/// A face once its ink has sunk into the stock: the heavy lines left as
/// grooves, the leaf left where it was laid, the type gone with the ink.
/// The same grammar as the reverse — stock, pressed lines, one gold.
struct CardBlank: View {
  let draw: Draw
  /// The face stock is a shade lighter than the back's, so the light
  /// catches a groove on it a little less.
  static let strength = 0.85

  var body: some View {
    ZStack {
      Palette.paper

      Pressed(marks: CardArt.pressedFrame, space: cardSize, strength: Self.strength)

      ZStack {
        Pressed(
          marks: CardArt.pressedArt(draw.card.art), space: artSize, strength: Self.strength,
          flip: draw.reversed ? -1 : 1)
        MarksCanvas(marks: CardArt.leafArt(draw.card.art), space: artSize)
      }
      .frame(width: CardArt.artW, height: CardArt.artH)
      .rotationEffect(.degrees(draw.reversed ? 180 : 0))
      .position(x: 113, y: 176)

      RadialGradient(
        colors: [.clear, Palette.candle.opacity(0.16)],
        center: .center, startRadius: 110, endRadius: 250)
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

/// The reverse: heavy stock with the rose pressed into it and one sun of
/// gold leaf.
struct CardBackStatic: View {
  var stock = Palette.backStock

  var body: some View {
    ZStack {
      stock
      Pressed(marks: CardArt.backEmbossMarks(), space: cardSize)
      MarksCanvas(
        marks: CardArt.backGoldMarks(), space: cardSize,
        tint: Tint(ink: Palette.goldDeep, accent: Palette.gold, gold: Palette.gold, paper: stock))
      if let g = Grain.image {
        g.resizable(resizingMode: .tile)
          .blendMode(.multiply)
          .opacity(0.35)
          .allowsHitTesting(false)
      }
      // the edge of the stock
      Rectangle().strokeBorder(Palette.shade.opacity(0.13), lineWidth: 1.2)
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
    let img = render(CardFace(draw: draw))
    faces[key] = img
    return img
  }

  /// Called before a card starts moving, so the flip never hitches.
  func prewarm(_ draw: Draw) {
    _ = face(draw)
    _ = CardArt.art(draw.card.art)
  }

  /// The face once its ink has sunk. Made while the reading is spoken, kept
  /// only until the cards are home — each is a couple of megabytes.
  private var blanks: [String: Image] = [:]

  func blank(_ draw: Draw) -> Image {
    let key = draw.card.id + (draw.reversed ? "/r" : "/u")
    if let b = blanks[key] { return b }
    let img = render(CardBlank(draw: draw))
    blanks[key] = img
    return img
  }

  func forgetBlanks() { blanks = [:] }

  /// Once the cards are home, their faces are let go too; the next reading
  /// makes its own as each card is taken, before it moves.
  func forgetFaces() { faces = [:] }
}

// --- the flip, and the writing ---------------------------------------

/// Animates the turn itself: the face is swapped exactly at the edge.
struct FlipCard: View, Animatable {
  var angle: Double
  let draw: Draw
  let size: CGSize
  var ink: Double = 1
  /// How far a finished face's ink has sunk into the stock, 0…1.
  var sink: Double = 0

  var animatableData: Double {
    get { angle }
    set { angle = newValue }
  }

  var body: some View {
    ZStack {
      if angle < 90 {
        CardImages.shared.back()
          .interpolation(.high)
          .resizable()
      } else {
        InkFace(ink: ink, draw: draw, size: size, sink: sink)
          .rotation3DEffect(.degrees(180), axis: (x: 0, y: 1, z: 0))
      }
    }
    .frame(width: size.width, height: size.height)
    .rotation3DEffect(.degrees(angle), axis: (x: 0, y: 1, z: 0), perspective: 0.4)
  }
}

/// A face that is still being written is drawn live; a finished one is
/// the cached raster. A face being given back is its raster fading off
/// the pressed blank beneath it — nothing on it moves.
struct InkFace: View, Animatable {
  var ink: Double
  let draw: Draw
  let size: CGSize
  var sink: Double = 0

  var animatableData: Double {
    get { ink }
    set { ink = newValue }
  }

  var body: some View {
    if ink >= 0.999 {
      ZStack {
        if sink > 0.001 {
          CardImages.shared.blank(draw)
            .interpolation(.high)
            .resizable()
        }
        if sink < 0.999 {
          CardImages.shared.face(draw)
            .interpolation(.high)
            .resizable()
            .opacity(1 - sink)
        }
      }
      .frame(width: size.width, height: size.height)
    } else {
      CardFace(draw: draw, ink: ink)
        .scaleEffect(size.width / CardArt.cardW)
        .frame(width: size.width, height: size.height)
    }
  }
}
