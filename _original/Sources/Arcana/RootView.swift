import SwiftUI

// ===================================================================
//  RootView — the table. Everything is one absolute-positioned stage.
// ===================================================================

struct RootView: View {
  @State private var game: Game
  @FocusState private var focused: Bool
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  @MainActor init(game: Game? = nil) { _game = State(initialValue: game ?? Game()) }

  var body: some View {
    GeometryReader { geo in
      let L = Layout(size: geo.size, slots: game.need, phase: game.phase)

      ZStack {
        Chamber(flashes: game.flashes, reduceMotion: reduceMotion)

        SlotMarks(game: game, layout: L)
          .zIndex(1)

        ForEach(Array(game.order.enumerated()), id: \.element.card.id) { pair in
          CardSprite(index: pair.offset, game: game, layout: L)
        }

        Invocation(game: game)
          .opacity(game.phase == .invocation ? 1 : 0)
          .allowsHitTesting(game.phase == .invocation)
          .zIndex(400)

        Prompt(game: game, layout: L)
          .zIndex(400)

        ThreadPanel(game: game, layout: L)
          .zIndex(500)

        if let s = game.inspecting, s < game.picks.count {
          Inspector(game: game, slot: s, size: geo.size)
            .zIndex(900)
        }

        MuteToggle(game: game)
          .zIndex(950)
      }
      .frame(width: geo.size.width, height: geo.size.height)
      .contentShape(Rectangle())
      .onTapGesture {
        if game.inspecting != nil {
          game.closeInspector()
        } else if game.phase == .invocation {
          game.begin()
        }
      }
    }
    .background(Palette.void)
    .overlay(WindowSetup().frame(width: 0, height: 0))
    .focusable()
    .focusEffectDisabled()
    .focused($focused)
    .onAppear { focused = true }
    .onKeyPress { press in keys(press) }
  }

  private func keys(_ press: KeyPress) -> KeyPress.Result {
    switch press.key.character {
    case "\r":
      if game.phase == .invocation {
        game.begin()
      } else if game.phase == .reading {
        game.inspecting == nil ? game.again() : game.closeInspector()
      }
    case "\u{1b}":
      if game.inspecting != nil {
        game.closeInspector()
      } else if game.phase != .invocation {
        game.again()
      }
    case " ":
      if game.phase == .invocation { game.begin() } else { game.closeInspector() }
    case "1": game.chooseSpread(0)
    case "2": game.chooseSpread(1)
    case "3": game.chooseSpread(2)
    case "m", "M": game.toggleMute()
    default: return .ignored
    }
    return .handled
  }
}

// ===================================================================
//  One card, wherever it currently belongs.
// ===================================================================

private struct CardSprite: View {
  let index: Int
  let game: Game
  let layout: Layout

  private var slot: Int? { game.slotIndex(ofOrder: index) }
  private var isPlaced: Bool { slot != nil }

  /// Cards near the cursor rise with it, the way a held hand does.
  private var lift: CGFloat {
    guard !isPlaced, game.dealt, game.phase == .draw, !game.complete,
      let h = game.hovered
    else { return 0 }
    let d = abs(Double(index - h))
    guard d < 2.5 else { return 0 }
    return CGFloat(pow(1 - d / 2.5, 1.6)) * 38
  }

  var body: some View {
    let faceUp = game.faceUp.contains(index)
    let size =
      isPlaced
      ? CGSize(width: layout.slotW, height: layout.slotH)
      : CGSize(width: layout.fanW, height: layout.fanH)

    // Keep the pointer target at the card's resting position. The card face
    // itself moves when hovered; making the hit target move with it causes
    // onHover to fire an exit as soon as the lift animation starts.
    let anchor: (point: CGPoint, angle: Double) = {
      if let s = slot {
        return (layout.slot(s), Double((s % 2 == 0 ? -1 : 1)) * 0.7)
      }
      return game.dealt
        ? layout.fan(index, of: game.order.count, lift: 0)
        : layout.stack(index, of: game.order.count)
    }()

    let gone = game.phase == .reading && !isPlaced
    let dimmed = game.inspecting != nil
    let read = game.phase == .reading && game.reading == slot && slot != nil
    let visualOffset: CGFloat = gone ? 40 : (read ? -12 : -lift)
    let hitEnabled = !gone && game.inspecting == nil

    ZStack {
      FlipCard(angle: faceUp ? 180 : 0, draw: game.order[index], size: size)
        .shadow(color: .black.opacity(0.7), radius: lift > 2 ? 26 : 16, x: 0, y: lift > 2 ? 18 : 10)
        .shadow(color: Palette.gold.opacity(lift > 2 || read ? 0.22 : 0), radius: 30)
        .offset(y: visualOffset)
        .opacity(gone ? 0 : (dimmed ? 0.16 : 1))
        .allowsHitTesting(false)

      Rectangle()
        .fill(.clear)
        .frame(width: size.width, height: size.height)
        .contentShape(Rectangle())
        .onHover { inside in
          if game.phase == .draw, !isPlaced, !game.complete {
            if inside {
              game.hovered = index
            } else if game.hovered == index {
              game.hovered = nil
            }
          } else if game.phase == .reading, let s = slot, game.inspecting == nil {
            withAnimation(.easeOut(duration: 0.22)) {
              if inside {
                game.reading = s
              } else if game.reading == s {
                game.reading = nil
              }
            }
          }
          if inside && game.inspecting == nil {
            NSCursor.pointingHand.set()
          } else {
            NSCursor.arrow.set()
          }
        }
        .onTapGesture {
          if let s = slot {
            if game.phase == .reading { game.inspect(slot: s) }
          } else if game.phase == .draw {
            game.take(index, landing: layout.slot(game.picks.count))
          }
        }
        .allowsHitTesting(hitEnabled)
    }
    .rotationEffect(.degrees(anchor.angle))
    .position(anchor.point)
    .animation(.spring(response: 0.3, dampingFraction: 0.7), value: read)
    .zIndex(isPlaced ? 100 + Double(slot ?? 0) : (lift > 2 ? 90 : Double(index)))
    .animation(.spring(response: 0.3, dampingFraction: 0.68), value: lift)
    .animation(.easeOut(duration: 0.5), value: gone)
    .animation(
      .spring(response: 0.72, dampingFraction: 0.8)
        .delay(Double(index) * 0.013),
      value: game.dealt)
  }
}

// ===================================================================
//  Empty slots, and the names once they are filled.
// ===================================================================

private struct Brackets: Shape {
  func path(in r: CGRect) -> Path {
    let l = min(r.width, r.height) * 0.13
    var p = Path()
    for (cx, cy) in [(r.minX, r.minY), (r.maxX, r.minY), (r.minX, r.maxY), (r.maxX, r.maxY)] {
      let sx: CGFloat = cx == r.minX ? 1 : -1
      let sy: CGFloat = cy == r.minY ? 1 : -1
      p.move(to: CGPoint(x: cx + sx * l, y: cy))
      p.addLine(to: CGPoint(x: cx, y: cy))
      p.addLine(to: CGPoint(x: cx, y: cy + sy * l))
    }
    return p
  }
}

private struct SlotMarks: View {
  let game: Game
  let layout: Layout

  var body: some View {
    ZStack {
      ForEach(0..<game.need, id: \.self) { i in
        let p = layout.slot(i)
        let filled = i < game.picks.count
        let shown = filled && game.faceUp.contains(game.picks[i])

        Group {
          if !filled {
            Brackets()
              .stroke(Palette.gold.opacity(0.3), lineWidth: 1)
              .frame(width: layout.slotW * 1.1, height: layout.slotH * 1.1)
              .position(p)
          }

          Caps(
            text: game.spread.slots[i], size: 9, tracking: 3.2,
            color: shown ? Palette.gold.opacity(0.9) : Palette.paper.opacity(0.26))
            .position(x: p.x, y: p.y + layout.slotH / 2 + 22)
            .animation(.easeOut(duration: 0.45), value: shown)
        }
        .opacity(game.phase == .invocation ? 0 : 1)
      }
    }
    .allowsHitTesting(false)
    .opacity(game.inspecting == nil ? 1 : 0.15)
  }
}

// ===================================================================
//  Opening screen.
// ===================================================================

private struct Invocation: View {
  let game: Game

  var body: some View {
    VStack(spacing: 0) {
      Spacer()

      Rectangle().fill(Palette.gold.opacity(0.5)).frame(width: 46, height: 1)

      Text("ARCANA")
        .font(.display(62))
        .tracking(20)
        .foregroundStyle(Palette.paper)
        .padding(.top, 22)
        .padding(.leading, 10)  // optical correction for the tracked final letter

      Text("Hold the question in your mind.")
        .font(.italic(19))
        .foregroundStyle(Palette.paper.opacity(0.52))
        .padding(.top, 14)

      HStack(spacing: 34) {
        ForEach(Array(Spread.all.enumerated()), id: \.element.id) { pair in
          SpreadChoice(
            spread: pair.element,
            chosen: game.spreadIndex == pair.offset,
            tap: { game.chooseSpread(pair.offset) })
        }
      }
      .padding(.top, 44)

      Caps(text: "press return to cut the deck", size: 9.5, tracking: 4, color: Palette.gold.opacity(0.62))
        .padding(.top, 46)

      Spacer()
      Spacer()
    }
  }
}

private struct SpreadChoice: View {
  let spread: Spread
  let chosen: Bool
  let tap: () -> Void

  var body: some View {
    Button(action: tap) {
      ZStack {
        VStack(spacing: 9) {
          HStack(spacing: 5) {
            ForEach(0..<spread.count, id: \.self) { _ in
              Rectangle()
                .fill(chosen ? Palette.gold : Palette.paper.opacity(0.32))
                .frame(width: 5, height: 5)
                .rotationEffect(.degrees(45))
            }
          }
          .frame(height: 10)

          // Keep the title on one line in both states. The bold selected
          // face is wider, so letting it wrap made the choice grow on click.
          Caps(
            text: spread.name, size: 11, tracking: 3,
            color: chosen ? Palette.paper : Palette.paper.opacity(0.4), bold: chosen)
            .lineLimit(1)
            .minimumScaleFactor(0.82)
            .frame(width: 150, height: 15)

          Text(spread.sub)
            .font(.italic(11.5))
            .foregroundStyle(chosen ? Palette.gold.opacity(0.85) : Palette.paper.opacity(0.24))
            .lineLimit(1)
            .minimumScaleFactor(0.85)
            .frame(width: 150, height: 15)
        }

        if chosen {
          Brackets()
            .stroke(Palette.gold.opacity(0.55), lineWidth: 1)
            .frame(width: 150, height: 86)
        }
      }
      .frame(width: 150, height: 86)
    }
    .buttonStyle(.plain)
  }
}

// ===================================================================
//  One line of text at the bottom — the only running copy in the app.
// ===================================================================

private struct Prompt: View {
  let game: Game
  let layout: Layout

  private var pips: some View {
    HStack(spacing: 7) {
      ForEach(0..<game.need, id: \.self) { i in
        Rectangle()
          .fill(i < game.picks.count ? Palette.gold : Palette.paper.opacity(0.22))
          .frame(width: 6, height: 6)
          .rotationEffect(.degrees(45))
      }
    }
  }

  private var word: String {
    switch game.need {
    case 1: return "draw one card"
    case 3: return "draw three"
    default: return "draw five"
    }
  }

  var body: some View {
    ZStack {
      if game.phase == .draw && !game.complete {
        VStack(spacing: 13) {
          pips
          Caps(text: word, size: 10, tracking: 4, color: Palette.paper.opacity(0.42))
        }
        .position(x: layout.size.width / 2, y: layout.promptY)
      }

      if game.phase == .reading && game.weave == nil && !game.weaving && !game.weaveError {
        VStack(spacing: 18) {
          if let s = game.reading, let d = game.draw(atSlot: s) {
            Text(d.line)
              .font(.roman(22))
              .foregroundStyle(Palette.paper.opacity(0.92))
              .id(s)
              .transition(.opacity)
          } else {
            Caps(
              text: "hover to read  ·  click to open", size: 10, tracking: 4,
              color: Palette.paper.opacity(0.38))
          }
          Caps(text: "return · ask again", size: 9, tracking: 4, color: Palette.gold.opacity(0.5))
        }
        .frame(height: 70)
        .position(x: layout.size.width / 2, y: layout.promptY)
      }
    }
    .opacity(game.inspecting == nil ? 1 : 0)
    .allowsHitTesting(false)
  }
}

// ===================================================================
//  The thread — a single finished folio, never a chat transcript.
// ===================================================================

private struct ThreadPanel: View {
  let game: Game
  let layout: Layout

  private var active: Bool {
    game.phase == .reading && game.inspecting == nil
  }

  private var panelWidth: CGFloat {
    min(720, max(500, layout.size.width * 0.64))
  }

  private var panelY: CGFloat {
    layout.promptY + (game.weave == nil ? -34 : 8)
  }

  var body: some View {
    Group {
      if active {
        if let result = game.weave {
          finished(result)
        } else if game.weaving {
          settling
        } else if game.weaveError {
          quietFailure
        } else {
          invitation
        }
      }
    }
    .frame(width: panelWidth, height: game.weave == nil ? 34 : 164)
    .position(x: layout.size.width / 2, y: panelY)
    .opacity(active ? 1 : 0)
    .animation(.easeOut(duration: 0.38), value: game.weave != nil)
    .animation(.easeOut(duration: 0.24), value: game.weaving)
    .transition(.opacity.combined(with: .scale(scale: 0.98)))
  }

  private var invitation: some View {
    Button(action: { game.findThread() }) {
      HStack(spacing: 11) {
        ThreadGlyph(size: 8)
        Caps(
          text: "find the thread", size: 9.5, tracking: 3.8,
          color: Palette.gold.opacity(0.78))
      }
      .frame(width: 190, height: 30)
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .help("Find a quiet thread through the spread")
  }

  private var settling: some View {
    HStack(spacing: 12) {
      ThreadGlyph(size: 7)
      Caps(
        text: "letting the cards settle", size: 9.5, tracking: 3.2,
        color: Palette.paper.opacity(0.42))
    }
  }

  private var quietFailure: some View {
    HStack(spacing: 18) {
      Caps(
        text: "the thread stayed quiet", size: 9.5, tracking: 3.2,
        color: Palette.paper.opacity(0.42))
      Button("try again") { game.findThread() }
        .buttonStyle(.plain)
        .font(.italic(13))
        .foregroundStyle(Palette.gold.opacity(0.78))
    }
  }

  private func finished(_ result: WeaveResult) -> some View {
    ZStack {
      Rectangle()
        .fill(Palette.void.opacity(0.97))
        .overlay(Rectangle().stroke(Palette.gold.opacity(0.18), lineWidth: 1))

      Brackets()
        .stroke(Palette.gold.opacity(0.42), lineWidth: 1)
        .frame(width: panelWidth - 18, height: 146)

      HStack(spacing: 24) {
        VStack(alignment: .leading, spacing: 10) {
          Caps(text: "the thread", size: 8.5, tracking: 3.8, color: Palette.gold.opacity(0.76))
          Text(result.thread)
            .font(.roman(17))
            .foregroundStyle(Palette.paper.opacity(0.92))
            .lineSpacing(3)
            .multilineTextAlignment(.leading)
            .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: panelWidth * 0.57, alignment: .leading)

        Rectangle()
          .fill(Palette.gold.opacity(0.3))
          .frame(width: 1, height: 66)

        VStack(alignment: .leading, spacing: 10) {
          Caps(text: "carry this", size: 8.5, tracking: 3.8, color: Palette.gold.opacity(0.76))
          Text(result.question)
            .font(.italic(15))
            .foregroundStyle(Palette.gold.opacity(0.92))
            .lineSpacing(2)
            .multilineTextAlignment(.leading)
            .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: panelWidth * 0.27, alignment: .leading)
      }
      .padding(.horizontal, 35)
    }
  }
}

private struct ThreadGlyph: View {
  let size: CGFloat

  var body: some View {
    ZStack {
      Rectangle()
        .fill(Palette.gold.opacity(0.86))
        .frame(width: size, height: size)
        .rotationEffect(.degrees(45))
      Rectangle()
        .fill(Palette.gold.opacity(0.35))
        .frame(width: 1, height: 18)
    }
    .frame(width: 18, height: 18)
  }
}

// ===================================================================
//  Full-size card, with the one line that belongs to it.
// ===================================================================

private struct Inspector: View {
  let game: Game
  let slot: Int
  let size: CGSize

  var body: some View {
    let d = game.order[game.picks[slot]]
    let h = min(430, size.height * 0.56)

    ZStack {
      Color.black.opacity(0.94).ignoresSafeArea()

      HStack(spacing: min(64, size.width * 0.05)) {
        CardImages.shared.face(d)
          .interpolation(.high)
          .resizable()
          .frame(width: h * 0.565, height: h)
          .shadow(color: .black.opacity(0.8), radius: 40, y: 20)

        VStack(alignment: .leading, spacing: 16) {
          Caps(
            text: game.spread.slots[slot], size: 10, tracking: 4.2,
            color: Palette.gold.opacity(0.85))

          VStack(alignment: .leading, spacing: 8) {
            Text(d.card.name.uppercased())
              .font(.display(32))
              .tracking(4)
              .foregroundStyle(Palette.paper)
              .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 10) {
              Caps(text: d.card.roman, size: 10, tracking: 3, color: Palette.paper.opacity(0.35))
              if d.reversed {
                Caps(text: "· reversed", size: 10, tracking: 3, color: Palette.blood)
              }
            }
          }

          Text(d.card.essence)
            .font(.italic(20))
            .foregroundStyle(Palette.gold)

          Rectangle().fill(Palette.paper.opacity(0.16)).frame(width: 54, height: 1)

          Text(d.line)
            .font(.roman(24))
            .foregroundStyle(Palette.paper.opacity(0.92))
            .fixedSize(horizontal: false, vertical: true)

          HStack(spacing: 10) {
            ForEach(Array(d.keys.enumerated()), id: \.offset) { pair in
              if pair.offset > 0 {
                Rectangle()
                  .fill(Palette.gold.opacity(0.5))
                  .frame(width: 4, height: 4)
                  .rotationEffect(.degrees(45))
              }
              Caps(text: pair.element, size: 9.5, tracking: 2.6, color: Palette.paper.opacity(0.45))
            }
          }
          .padding(.top, 4)

          Caps(text: "esc", size: 9, tracking: 4, color: Palette.paper.opacity(0.28))
            .padding(.top, 10)
        }
        .frame(maxWidth: 340, alignment: .leading)
      }
    }
    .transition(.opacity.combined(with: .scale(scale: 0.97)))
    .onTapGesture { game.closeInspector() }
  }
}

private struct MuteToggle: View {
  let game: Game

  var body: some View {
    VStack {
      HStack {
        Spacer()
        Button(action: { game.toggleMute() }) {
          Image(systemName: game.muted ? "speaker.slash" : "speaker.wave.2")
            .font(.system(size: 12, weight: .light))
            .foregroundStyle(Palette.paper.opacity(game.muted ? 0.3 : 0.5))
            .frame(width: 26, height: 26)
        }
        .buttonStyle(.plain)
        .help(game.muted ? "Sound off (M)" : "Sound on (M)")
      }
      Spacer()
    }
    .padding(18)
  }
}

// ===================================================================
//  Window — a chrome-less, centred stage that never opens too small.
// ===================================================================

struct WindowSetup: NSViewRepresentable {
  func makeNSView(context: Context) -> NSView {
    let probe = NSView()
    DispatchQueue.main.async {
      guard let window = probe.window else { return }
      window.titlebarAppearsTransparent = true
      window.backgroundColor = .black
      window.isOpaque = true
      window.standardWindowButton(.zoomButton)?.isHidden = false

      guard let screen = window.screen ?? NSScreen.main else { return }
      let room = screen.visibleFrame
      let want = NSSize(
        width: min(1260, room.width - 80),
        height: min(860, room.height - 80))
      let tooSmall = window.frame.width < want.width - 1 || window.frame.height < want.height - 1
      let stranded = !room.intersects(window.frame)
      guard tooSmall || stranded else { return }
      window.setFrame(
        NSRect(
          x: room.midX - want.width / 2, y: room.midY - want.height / 2,
          width: want.width, height: want.height),
        display: true, animate: false)
    }
    return probe
  }

  func updateNSView(_ nsView: NSView, context: Context) {}
}
