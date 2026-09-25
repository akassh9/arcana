import SwiftUI

// ===================================================================
//  RootView — the table under the sky. One absolute-positioned stage.
// ===================================================================

struct RootView: View {
  @State private var game: Game
  @State private var pointer = Pointer()
  @State private var stage: CGSize = .zero
  @FocusState private var focused: Bool
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  @MainActor init(game: Game? = nil) { _game = State(initialValue: game ?? Game()) }

  // Nothing here ticks. The few things that move by themselves — the
  // near sky, the ring, the light on the title and the thread — each keep
  // a small clock of their own, so a tick redraws only what moves.
  var body: some View {
    GeometryReader { geo in
      let L = Layout(size: geo.size, slots: game.need, phase: game.phase)

      stage(L, insets: geo.safeAreaInsets)
      .frame(width: geo.size.width, height: geo.size.height)
      .onContinuousHover(coordinateSpace: .local) { phase in
        if case .active(let p) = phase {
          pointer.at = CGPoint(
            x: p.x / max(geo.size.width, 1) * 2 - 1, y: p.y / max(geo.size.height, 1) * 2 - 1)
        }
      }
      .onChange(of: geo.size, initial: true) { _, s in stage = s }
    }
    .background(Palette.pearl)
    .overlay(WindowSetup(game: game).frame(width: 0, height: 0))
    .focusable()
    .focusEffectDisabled()
    .focused($focused)
    .onAppear {
      focused = true
      game.quick = reduceMotion
      Sfx.shared.mood(0.42)  // the room is never silent
    }
    .onChange(of: reduceMotion) { _, v in game.quick = v }
    .onKeyPress(phases: .all) { press in keys(press) }
    // a key or button let go while the window is away never arrives
    .onReceive(NotificationCenter.default.publisher(for: NSApplication.didResignActiveNotification)) {
      _ in game.releaseHold()
    }
  }

  @ViewBuilder
  private func stage(_ L: Layout, insets: EdgeInsets) -> some View {
      ZStack {
        Chamber(game: game, pointer: pointer, layout: L, insets: insets, reduceMotion: reduceMotion)

        HoldLayer(game: game, layout: L)
          .zIndex(0.5)

        if game.phase != .invocation && game.inspecting == nil {
          Halos(game: game, layout: L)
            .transition(.opacity)
            .zIndex(0.7)
        }

        HoldRing(game: game, layout: L, reduceMotion: reduceMotion)
          .zIndex(0.8)

        if game.phase != .invocation {
          Thread(game: game, layout: L, reduceMotion: reduceMotion)
            .transition(.opacity)
            .zIndex(0.9)
        }

        SlotMarks(game: game, layout: L)
          .zIndex(1)

        ForEach(Array(game.order.enumerated()), id: \.element.card.id) { pair in
          CardSprite(index: pair.offset, game: game, layout: L)
        }

        // When the table is cleared the room comes back only once the cards
        // are nearly home, so no card passes under the words. It leaves at once.
        Invocation(game: game, layout: L, reduceMotion: reduceMotion, focus: $focused)
          .opacity(game.phase == .invocation ? 1 : 0)
          .animation(
            game.phase == .invocation ? .easeOut(duration: 1.0).delay(0.45) : nil,
            value: game.phase == .invocation)
          .allowsHitTesting(game.phase == .invocation && !game.holding && game.roomLive)
          .zIndex(400)

        Prompt(game: game, layout: L)
          .zIndex(400)

        Epigraph(game: game, layout: L, reduceMotion: reduceMotion)
          .zIndex(405)

        Stanza(game: game, layout: L)
          .zIndex(410)

        ThreadPanel(game: game, layout: L)
          .zIndex(500)

        // The altar is handed its card and name when it opens. While it
        // fades out the table may already be cleared, so it must not look
        // anything up in the game again.
        if let s = game.inspecting, let d = game.draw(atSlot: s) {
          Inspector(
            game: game, draw: d, label: game.spread.slots[s], size: L.size, pointer: pointer,
            reduceMotion: reduceMotion)
          .zIndex(900)
        }

        MuteToggle(game: game)
          .zIndex(950)
      }
      .coordinateSpace(name: "stage")
  }

  private func keys(_ press: KeyPress) -> KeyPress.Result {
    // a key the pen owns is passed on to the page the question is written on
    if let e = NSApp.currentEvent, QuillTextView.owns(e, in: game) { return .ignored }
    let c = press.key.character
    let holdKey = c == "\r" || c == " "

    if press.phase == .up {
      guard holdKey else { return .ignored }
      game.releaseHold(by: .key)
      return .handled
    }
    if press.phase == .repeat { return holdKey ? .handled : .ignored }

    switch c {
    case "\r", " ":
      // held, these ask the question — and, once the reading has been
      // spoken, return the cards
      if game.inspecting != nil {
        game.closeInspector()
      } else {
        game.pressHold(Layout(size: stage, slots: game.need, phase: game.phase), by: .key)
      }
    case "\u{1b}":
      if game.holding && game.phase == .invocation {
        game.releaseHold()
      } else if game.inspecting != nil {
        game.closeInspector()
      } else if game.phase != .invocation {
        game.again()
      }
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
    // a lifted card settles as the room goes quiet
    let read = game.phase == .reading && game.reading == slot && slot != nil && game.hush == 0
    let visualOffset: CGFloat = gone ? 40 : (read ? -12 : -lift)
    let hitEnabled =
      !gone && game.inspecting == nil && game.phase != .invocation && !game.returning
    let sink = game.sinks[index]?.v ?? 0
    // squared up, the deck throws one shadow, from its lowest card;
    // twenty-two of them stacked would pool into a slab
    let shade = game.dealt || isPlaced || index == 0 ? 0.7 : 0

    ZStack {
      FlipCard(
        angle: faceUp ? 180 : 0, draw: game.order[index], size: size,
        ink: game.inked.contains(index) ? 1 : 0, sink: sink
      )
      .shadow(
        color: Palette.shade.opacity(shade * 0.5), radius: lift > 2 ? 28 : 18, x: 0,
        y: lift > 2 ? 20 : 11)
      .shadow(color: Palette.goldLit.opacity(lift > 2 || read ? 0.55 : 0), radius: 26)
      .offset(y: visualOffset)
      .opacity(gone ? 0 : (dimmed ? 0.04 : 1))
      .allowsHitTesting(false)

      Rectangle()
        .fill(.clear)
        .frame(width: size.width, height: size.height)
        .contentShape(Rectangle())
        .onHover { inside in
          if game.phase == .draw, !isPlaced, !game.complete {
            if inside {
              game.hover(index)
            } else if game.hovered == index {
              game.hover(nil)
            }
          } else if game.phase == .reading, let s = slot, game.inspecting == nil, !game.returning {
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
//  The held question — pressing anywhere on the sky, and the ring the
//  light gathers in.
// ===================================================================

private struct HoldLayer: View {
  let game: Game
  let layout: Layout
  @GestureState private var down = false

  // A press is felt once, as it begins. A breath that completes under a
  // finger still resting on the sky must not begin another.
  var body: some View {
    Color.clear
      .contentShape(Rectangle())
      .gesture(DragGesture(minimumDistance: 0).updating($down) { _, held, _ in held = true })
      .onChange(of: down) { _, d in
        d ? game.pressHold(layout, by: .pointer) : game.releaseHold(by: .pointer)
      }
      .allowsHitTesting(game.phase != .draw)
  }
}

private struct HoldRing: View {
  let game: Game
  let layout: Layout
  let reduceMotion: Bool

  var body: some View {
    let r = layout.ringR
    ZStack {
      if game.phase == .invocation {
        Caps(text: "press and hold", size: 9, tracking: 4.2, color: Palette.goldInk.opacity(0.75))
          .chargeOpacity(game) { 1 - $0 }
          .offset(y: r * 1.2 + 26)
          .transition(.opacity)
      }
    }
    .position(layout.deck)
    .allowsHitTesting(false)
    // it comes back with the room, never before it
    .animation(
      game.phase == .invocation ? .easeOut(duration: 1.0).delay(0.45) : .easeOut(duration: 0.6),
      value: game.phase == .invocation)
  }
}

// ===================================================================
//  Halos — the light each card gives off; brighter where the eye rests,
//  and flaring when a card lands or is spoken.
// ===================================================================

private struct Halos: View {
  let game: Game
  let layout: Layout

  var body: some View {
    Group {
      ZStack {
        ForEach(0..<game.need, id: \.self) { i in
          let filled = i < game.picks.count && game.faceUp.contains(game.picks[i])
          let flare = game.flare.contains(i) ? 0.45 : 0
          let rest = game.phase == .reading && game.reading == i ? 0.22 : 0
          let a = filled ? 0.24 + rest + flare : (game.phase == .draw ? 0.08 : 0)
          // the light is laid once and only its strength changes: a gradient
          // whose colours were animated would be painted afresh every frame
          Ellipse()
            .fill(
              RadialGradient(
                colors: [
                  Palette.goldLit, Palette.goldLit.opacity(0.45 / 1.4), Palette.goldLit.opacity(0),
                ],
                center: .center, startRadius: 0, endRadius: layout.slotH * 0.78)
            )
            .frame(width: layout.slotW * 2.6, height: layout.slotH * 1.7)
            .opacity(min(1, a * 1.4))
            .blendMode(.screen)
            .position(layout.slot(i))
        }
      }
    }
    .opacity(1 - game.hush)
    .allowsHitTesting(false)
  }
}

// ===================================================================
//  The thread — a line of light under the spread that is laid down
//  card by card, and that light runs along once the reading is spoken.
// ===================================================================

private struct Thread: View {
  let game: Game
  let layout: Layout
  let reduceMotion: Bool

  var body: some View {
    let h: CGFloat = 40
    let xs = (0..<game.need).map { layout.slot($0).x }

    // light running the thread moves quickly, so it keeps the display's own
    // pace; its clock runs only while it moves
    TimelineView(
      .animation(
        minimumInterval: 1.0 / 120.0, paused: reduceMotion || !game.threadLive || !game.visible)
    ) { tl in
      let now = tl.date.timeIntervalSinceReferenceDate
      let landed = game.landed
      let spark = game.spark
      let weaving = game.weaving
      let reading = game.reading
      let woven = game.weave != nil
      let recitalDone = game.recitalDone

      Canvas { ctx, size in
        let y = size.height / 2
        let base = woven ? 0.62 : (game.phase == .reading ? 0.40 : 0.30)

        func grown(_ slot: Int) -> Double {
          guard let t = landed[slot] else { return 0 }
          return reduceMotion ? 1 : ramp(now - t, 0, 0.9)
        }

        // the wings under a lone card
        if xs.count == 1, let x = xs.first {
          let g = grown(0)
          let w = layout.slotW * 0.55 * g
          for dir in [-1.0, 1.0] {
            var p = Path()
            p.move(to: CGPoint(x: x + dir * 10, y: y))
            p.addLine(to: CGPoint(x: x + dir * (10 + w), y: y))
            ctx.stroke(
              p,
              with: .linearGradient(
                Gradient(colors: [Palette.goldInk.opacity(base), Palette.goldInk.opacity(0)]),
                startPoint: CGPoint(x: x, y: y), endPoint: CGPoint(x: x + dir * (10 + w), y: y)),
              lineWidth: 1)
          }
        }

        // segments, each laid when the card at its far end lands
        for k in 0..<max(0, xs.count - 1) {
          let g = grown(k + 1)
          guard g > 0 else { continue }
          let a = xs[k] + 9, b = xs[k + 1] - 9
          var p = Path()
          p.move(to: CGPoint(x: a, y: y))
          p.addLine(to: CGPoint(x: a + (b - a) * g, y: y))
          ctx.stroke(p, with: .color(Palette.goldLit.opacity(base * 0.45)), lineWidth: 5)
          ctx.stroke(p, with: .color(Palette.goldInk.opacity(base)), lineWidth: 1)
        }

        // a node under every position
        for (i, x) in xs.enumerated() {
          let g = grown(i)
          let lit = reading == i
          let s: CGFloat = lit ? 5.5 : 4.2
          var d = Path()
          d.move(to: CGPoint(x: x, y: y - s))
          d.addLine(to: CGPoint(x: x + s, y: y))
          d.addLine(to: CGPoint(x: x, y: y + s))
          d.addLine(to: CGPoint(x: x - s, y: y))
          d.closeSubpath()
          if g > 0 {
            ctx.fill(d, with: .color(Palette.goldInk.opacity(0.35 + 0.6 * g)))
            let glow = (lit ? 26.0 : 14.0) * g
            ctx.fill(
              Path(ellipseIn: CGRect(x: x - glow, y: y - glow, width: glow * 2, height: glow * 2)),
              with: .radialGradient(
                Gradient(colors: [Palette.goldLit.opacity(0.6 * g), Palette.goldLit.opacity(0)]),
                center: CGPoint(x: x, y: y), startRadius: 0, endRadius: glow))
          } else {
            ctx.stroke(d, with: .color(Palette.goldInk.opacity(0.4)), lineWidth: 0.8)
          }
        }

        // the light that runs the thread
        guard let first = xs.first, let last = xs.last, xs.count > 1 else { return }
        var run: Double?
        if weaving {
          run = 0.5 - 0.5 * cos(now * 1.9)
        } else if let s = spark {
          let age = now - s
          if age < 1.8 {
            run = age / 1.8
          } else if recitalDone {
            let k = (age - 1.8).truncatingRemainder(dividingBy: 13) / 2.2
            if k < 1 { run = k }
          }
        }
        if let r = run {
          let e = r * r * (3 - 2 * r)
          let x = first + (last - first) * e
          let fade = min(1, min(r, 1 - r) * 6)
          for (rad, a) in [(34.0, 0.30), (12.0, 0.55), (2.6, 1.0)] {
            ctx.fill(
              Path(ellipseIn: CGRect(x: x - rad, y: y - rad, width: rad * 2, height: rad * 2)),
              with: .radialGradient(
                Gradient(colors: [Palette.goldLit.opacity(a * fade), Palette.goldLit.opacity(0)]),
                center: CGPoint(x: x, y: y), startRadius: 0, endRadius: rad))
          }
          var trail = Path()
          trail.move(to: CGPoint(x: max(first, x - 90), y: y))
          trail.addLine(to: CGPoint(x: x, y: y))
          ctx.stroke(
            trail,
            with: .linearGradient(
              Gradient(colors: [Palette.goldInk.opacity(0), Palette.goldInk.opacity(0.8 * fade)]),
              startPoint: CGPoint(x: max(first, x - 90), y: y), endPoint: CGPoint(x: x, y: y)),
            lineWidth: 1.4)
        }
      }
    }
    .frame(width: layout.size.width, height: h)
    .position(x: layout.size.width / 2, y: layout.threadY)
    .opacity((game.inspecting == nil ? 1 : 0.1) * (1 - game.hush))
    .allowsHitTesting(false)
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
        let lit = game.reading == i

        Group {
          if !filled {
            Brackets()
              .stroke(Palette.goldInk.opacity(0.42), lineWidth: 1)
              .frame(width: layout.slotW * 1.1, height: layout.slotH * 1.1)
              .position(p)
          }

          Caps(
            text: game.spread.slots[i], size: 9, tracking: 3.2,
            color: shown
              ? (lit ? Palette.goldInk : Palette.goldInk.opacity(0.8))
              : Palette.text.opacity(0.32))
            .position(x: p.x, y: layout.labelY)
            .animation(.easeOut(duration: 0.45), value: shown)
        }
        .opacity(game.phase == .invocation ? 0 : 1)
      }
    }
    .allowsHitTesting(false)
    .opacity((game.inspecting == nil ? 1 : 0.15) * (1 - game.hush))
  }
}

// ===================================================================
//  Opening screen.
// ===================================================================

private struct Invocation: View {
  let game: Game
  let layout: Layout
  let reduceMotion: Bool
  let focus: FocusState<Bool>.Binding

  var body: some View {
    // the room goes quiet while the question is held; only the question stays
    let quiet: (Double) -> Double = { 1 - 0.9 * $0 }
    let ringTop = layout.deck.y - layout.ringR * 1.25 - 16
    let moon = Sky.moonCenter(layout.size)

    ZStack {
      VStack(spacing: 0) {
        // the words are part of the sky: pressing them presses the sky
        Rectangle().fill(Palette.goldInk.opacity(0.55)).frame(width: 46, height: 1)
          .chargeOpacity(game, quiet)
          .allowsHitTesting(false)

        Title(reduceMotion: reduceMotion, resting: !game.visible || game.phase != .invocation)
          .padding(.top, 22)
          .chargeOpacity(game, quiet)
          .allowsHitTesting(false)

        QuestionLine(game: game, layout: layout, reduceMotion: reduceMotion, focus: focus)
          .padding(.top, 14)
          .allowsHitTesting(false)

        HStack(spacing: 34) {
          ForEach(Array(Spread.all.enumerated()), id: \.element.id) { pair in
            SpreadChoice(
              spread: pair.element,
              chosen: game.spreadIndex == pair.offset,
              tap: { game.chooseSpread(pair.offset) })
          }
        }
        .padding(.top, 42)
        .chargeOpacity(game, quiet)
      }
      .position(x: layout.size.width / 2, y: max(170, (40 + ringTop) / 2))

      Caps(
        text: Moon.tonight.name, size: 8, tracking: 3.6,
        color: Palette.text.opacity(0.4))
        .position(x: moon.x, y: moon.y + Sky.moonRadius + 20)
        .chargeOpacity(game, quiet)
        .allowsHitTesting(false)
    }
  }
}

// ===================================================================
//  The question — the invitation, or, if you write, your own words in
//  its place: laid in gold, cooling to ink, given to the deck as dust
//  when the question is held.
// ===================================================================

private struct QuestionLine: View {
  let game: Game
  let layout: Layout
  let reduceMotion: Bool
  let focus: FocusState<Bool>.Binding

  var body: some View {
    let q = game.quill
    let w = q.writing

    Text("Hold the question in your mind.")
      .font(.italic(19))
      .modifier(HeldInk(game: game))
      // the invitation breathes out as your first letter is laid
      .opacity(w ? 0 : 1)
      .blur(radius: w && !reduceMotion ? 4 : 0)
      .animation(w ? .easeOut(duration: 0.25) : .easeOut(duration: 0.6).delay(0.1), value: w)
      .overlay {
        if w {
          // handed its words, so that as it leaves it still shows them
          WrittenLine(
            text: q.text, marked: q.marked, born: q.born, wet: q.wet, spentAt: q.spentAt,
            inkWidth: q.inkWidth, step: q.lastStep, clock: game.chargeClock, giving: q.giving,
            reduceMotion: reduceMotion, resting: !game.visible
          )
          .transition(
            .asymmetric(
              insertion: .identity,
              removal: reduceMotion
                ? .opacity.animation(.easeOut(duration: 0.35))
                : .modifier(active: Lift(on: true), identity: Lift(on: false))
                  .animation(.easeOut(duration: 0.35))))
        }
      }
      .overlay { QuillField(game: game, layout: layout, focus: focus).frame(width: 0, height: 0) }
      .onGeometryChange(for: CGPoint.self) { g in
        let f = g.frame(in: .named("stage"))
        return CGPoint(x: f.midX, y: f.midY)
      } action: { p in
        q.lineCenter = p
      }
      .accessibilityLabel(w ? q.text : "Hold the question in your mind.")
  }
}

/// The line, centred on the invitation. Its ink is laid from the leading
/// edge and never reflows; the line eases to stay centred as it grows.
private struct WrittenLine: View {
  let text: String
  let marked: String
  let born: [TimeInterval]
  let wet: Bool
  let spentAt: TimeInterval
  let inkWidth: CGFloat
  /// How far this change moved the line: a letter glides it a few points,
  /// a paste a long way, and a long way takes a little longer.
  let step: CGFloat
  let clock: ChargeClock
  let giving: Int
  let reduceMotion: Bool
  let resting: Bool

  var body: some View {
    let glide = min(0.6, 0.25 + Double(step) / 700)
    // its clock runs while ink is cooling, or while the question is held
    let ticking = (wet && !reduceMotion) || clock.moving
    Color.clear
      .frame(width: 0, height: 0)
      .overlay(alignment: .leading) {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: resting || !ticking)) { tl in
          let now = tl.date.timeIntervalSinceReferenceDate
          let charge = clock.value(at: now)
          InkLine(
            text: text, marked: marked, born: born, now: now,
            dry: reduceMotion || !wet, rest: 0.62 + 0.36 * charge, charge: charge,
            giving: reduceMotion ? 0 : giving, spentAt: spentAt)
            .shadow(color: Palette.goldLit.opacity(0.9 * charge), radius: 14)
            // with Reduce Motion the question is given as a whole
            .opacity(reduceMotion ? 1 - ramp(charge, 0.35, 0.9) : 1)
        }
        // only the centring glides; the ink itself never animates
        .animation(reduceMotion ? nil : .easeOut(duration: glide)) { $0.offset(x: -inkWidth / 2) }
      }
  }
}

/// A written line of ink. Each glyph is laid lit, as the nib leaves it, and
/// cools from wet gold to the line's ink by its age; while the question is
/// held, each is given in turn, thinning away as its gold goes to the deck.
/// The nib is only that light on the freshest strokes — never a mark of its own.
struct InkLine: View {
  let text: String
  let marked: String
  let born: [TimeInterval]
  let now: TimeInterval
  /// Nothing is cooling, so no age is read: a paused clock shows no stale gold.
  let dry: Bool
  let rest: Double
  let charge: Double
  let giving: Int
  let spentAt: TimeInterval

  var body: some View {
    let restColor = Palette.text.opacity(rest)
    var out = AttributedString()
    var run = ""  // dry glyphs, not being given, share one colour
    func flush() {
      guard !run.isEmpty else { return }
      var a = AttributedString(run)
      a.foregroundColor = restColor
      out += a
      run = ""
    }
    var k = -1
    for (i, ch) in text.enumerated() {
      if !ch.isWhitespace { k += 1 }
      let age = dry ? 60 : now - (i < born.count ? born[i] : 0)
      let given = max(k, 0) < giving ? Quill.loosen(max(k, 0), of: giving, charge) : 0
      if age >= 0.9 && given <= 0 {
        run.append(ch)
        continue
      }
      flush()
      var a = AttributedString(String(ch))
      if age < 0 {
        a.foregroundColor = .clear
      } else {
        let tone = Quill.tone(age: age, rest: rest)
        a.foregroundColor = given > 0 ? tone.opacity(1 - ramp(given, 0.3, 1)) : tone
      }
      out += a
    }
    flush()
    if !marked.isEmpty {
      var m = AttributedString(marked)
      m.foregroundColor = Palette.gold.opacity(0.75)
      out += m
    }

    // a key that found no room: the pen touches the paper just past the
    // last stroke, on the line, and lays nothing
    let spent = dry ? 0 : 0.45 * (1 - ramp(now - spentAt, 0, 0.7))

    return Text(out)
      .font(Font(Quill.font as CTFont))
      .lineLimit(1)
      .fixedSize()
      .contentTransition(.identity)
      .overlay(alignment: Alignment(horizontal: .trailing, vertical: .firstTextBaseline)) {
        if spent > 0.004 {
          Circle().fill(Palette.goldInk).frame(width: 2.4, height: 2.4)
            .alignmentGuide(.firstTextBaseline) { $0[VerticalAlignment.center] + 1.2 }
            .alignmentGuide(HorizontalAlignment.trailing) { $0[.leading] }
            .offset(x: 0.5)
            .opacity(spent)
        }
      }
  }
}

// ===================================================================
//  The charge on screen. Each thing that answers the held question keeps
//  a small clock of its own, running only while the charge moves, and
//  reads the charge from the time. What it wraps is never re-evaluated.
// ===================================================================

/// Fades a view by the charge.
struct ChargeOpacity: ViewModifier {
  let game: Game
  let f: (Double) -> Double

  func body(content: Content) -> some View {
    TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: !game.chargeMoving)) { tl in
      content.opacity(f(game.chargeClock.value(at: tl.date.timeIntervalSinceReferenceDate)))
    }
  }
}

extension View {
  func chargeOpacity(_ game: Game, _ f: @escaping (Double) -> Double) -> some View {
    modifier(ChargeOpacity(game: game, f: f))
  }
}

/// The invitation's ink, which darkens and gathers a little light while the
/// question is held.
private struct HeldInk: ViewModifier {
  let game: Game

  func body(content: Content) -> some View {
    TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: !game.chargeMoving)) { tl in
      let c = game.chargeClock.value(at: tl.date.timeIntervalSinceReferenceDate)
      content
        .foregroundStyle(Palette.text.opacity(0.62 + 0.36 * c))
        .shadow(color: Palette.goldLit.opacity(0.9 * c), radius: 14)
    }
  }
}

/// The written line leaving when it is let go: it lifts a little and blurs.
private struct Lift: ViewModifier {
  let on: Bool
  func body(content: Content) -> some View {
    content.opacity(on ? 0 : 1).blur(radius: on ? 3 : 0).offset(y: on ? -3 : 0)
  }
}

// ===================================================================
//  The question read back — small, above the spread, as the reading's
//  epigraph. It arrives whole, as a line of the verse does.
// ===================================================================

extension Layout {
  /// The epigraph's centre: a little above the row of cards.
  var epigraphY: CGFloat { max(44, rowY - slotH / 2 - 40) }
}

private struct Epigraph: View {
  let game: Game
  let layout: Layout
  let reduceMotion: Bool

  var body: some View {
    let q = game.quill
    let shown = game.phase == .reading && q.readBackAt != nil && !q.asked.isEmpty

    ZStack {
      if shown {
        EpigraphLine(text: q.asked)
          .position(x: layout.size.width / 2, y: layout.epigraphY)
          .transition(
            .asymmetric(
              insertion: reduceMotion
                ? .opacity.animation(.easeOut(duration: 0.6))
                : .modifier(active: Arrive(on: true), identity: Arrive(on: false))
                  .animation(.easeOut(duration: 1.1)),
              removal: .opacity.animation(.easeOut(duration: 0.7))))
      }
    }
    .allowsHitTesting(false)
  }
}

/// Handed its words, so that as it leaves it still shows them.
private struct EpigraphLine: View {
  let text: String

  var body: some View {
    Text(text)
      .font(.italic(16))
      .foregroundStyle(Palette.text.opacity(0.62))
      .lineLimit(1)
      .fixedSize()
      .overlay {
        Rectangle().fill(Palette.goldInk.opacity(0.45)).frame(width: 30, height: 1)
          .offset(y: -21)
      }
  }
}

/// How a line of the verse arrives: out of a little blur, settling upward.
private struct Arrive: ViewModifier {
  let on: Bool
  func body(content: Content) -> some View {
    content.opacity(on ? 0 : 1).blur(radius: on ? 5 : 0).offset(y: on ? 7 : 0)
  }
}

/// ARCANA, with a slow light passing across it now and then, like a
/// flame moving past gilt.
private struct Title: View {
  let reduceMotion: Bool
  /// No one can see it; the light waits.
  let resting: Bool

  var body: some View {
    let word = Text("ARCANA").font(.display(62)).tracking(20)
    word
      .foregroundStyle(Palette.text)
      .shadow(color: Palette.goldLit.opacity(0.55), radius: 22)
      .overlay {
        TimelineView(Bursts(period: 12, length: 3.3, fps: 60, paused: reduceMotion || resting)) { tl in
          let k =
            tl.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 12) / 3.2
          LinearGradient(
            stops: [
              .init(color: .clear, location: 0),
              .init(color: Palette.gold.opacity(0.95), location: 0.5),
              .init(color: .clear, location: 1),
            ],
            startPoint: UnitPoint(x: -0.5 + k * 2, y: 0.1),
            endPoint: UnitPoint(x: -0.1 + k * 2, y: 0.9)
          )
          .mask(word)
        }
      }
      .padding(.leading, 10)  // optical correction for the tracked final letter
  }
}

/// A clock that ticks only while something periodic is happening —
/// `length` seconds out of every `period` — and sleeps in between.
private struct Bursts: TimelineSchedule {
  let period: Double
  let length: Double
  let fps: Double
  var paused = false

  func entries(from start: Date, mode: TimelineScheduleMode) -> AnyIterator<Date> {
    var t = start.timeIntervalSinceReferenceDate
    var done = false
    return AnyIterator {
      if paused {
        if done { return nil }
        done = true
        return start
      }
      let phase = t.truncatingRemainder(dividingBy: period)
      if phase > length { t += period - phase }
      let d = Date(timeIntervalSinceReferenceDate: t)
      t += 1 / fps
      return d
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
                .fill(chosen ? Palette.goldInk : Palette.text.opacity(0.28))
                .frame(width: 5, height: 5)
                .rotationEffect(.degrees(45))
                .shadow(color: Palette.goldLit.opacity(chosen ? 0.9 : 0), radius: 4)
            }
          }
          .frame(height: 10)

          // Keep the title on one line in both states. The bold selected
          // face is wider, so letting it wrap made the choice grow on click.
          Caps(
            text: spread.name, size: 11, tracking: 3,
            color: chosen ? Palette.text : Palette.text.opacity(0.48), bold: chosen)
            .lineLimit(1)
            .minimumScaleFactor(0.82)
            .frame(width: 150, height: 15)

          Text(spread.sub)
            .font(.italic(11.5))
            .foregroundStyle(chosen ? Palette.goldInk : Palette.text.opacity(0.4))
            .lineLimit(1)
            .minimumScaleFactor(0.85)
            .frame(width: 150, height: 15)
        }

        if chosen {
          Brackets()
            .stroke(Palette.goldInk.opacity(0.6), lineWidth: 1)
            .frame(width: 150, height: 86)
        }
      }
      .frame(width: 150, height: 86)
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
  }
}

// ===================================================================
//  The draw's one line of instruction, and the quiet way back.
// ===================================================================

private struct Prompt: View {
  let game: Game
  let layout: Layout

  private var pips: some View {
    HStack(spacing: 7) {
      ForEach(0..<game.need, id: \.self) { i in
        Rectangle()
          .fill(i < game.picks.count ? Palette.goldInk : Palette.text.opacity(0.2))
          .frame(width: 6, height: 6)
          .rotationEffect(.degrees(45))
      }
    }
  }

  /// The reading has been spoken and its chord has rung; the cards can go
  /// back. While the thread is being found, it waits.
  private var closing: Bool { game.phase == .reading && game.sounded && !game.weaving }
  private var need1: Bool { game.need == 1 }

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
          Caps(text: word, size: 10, tracking: 4, color: Palette.text.opacity(0.52))
        }
        .position(x: layout.size.width / 2, y: max(layout.promptY, layout.labelY + 46))
        .transition(.opacity)
      }

      if closing {
        Caps(
          text: need1 ? "hold · return the card" : "hold · return the cards", size: 8.5,
          tracking: 4, color: Palette.goldInk.opacity(0.6 * (1 - game.hush)))
          .position(x: layout.size.width / 2, y: layout.askY)
          .transition(.opacity)
      }
    }
    .opacity(game.inspecting == nil ? 1 : 0)
    .animation(.easeOut(duration: 0.8), value: closing)
    .allowsHitTesting(false)
  }
}

// ===================================================================
//  The reading, spoken as verse: one line per card, in order.
// ===================================================================

extension Layout {
  /// Type size, line gap and height for `n` lines of verse between the
  /// names and the foot of the stage.
  func verse(_ n: Int) -> (size: CGFloat, gap: CGFloat, height: CGFloat) {
    let pref: CGFloat = n == 1 ? 27 : (n <= 3 ? 22 : 18.5)
    let gap: CGFloat = n >= 5 ? 8 : 12
    let room = inviteY - 24 - stanzaTop
    let fit = (room - CGFloat(max(n - 1, 0)) * gap) / (CGFloat(n) * 1.34)
    let size = max(13, min(pref, fit))
    return (size, gap, CGFloat(n) * size * 1.34 + CGFloat(max(n - 1, 0)) * gap)
  }
}

private struct Stanza: View {
  let game: Game
  let layout: Layout

  var body: some View {
    let v = layout.verse(game.need)
    let shown = game.phase == .reading && game.inspecting == nil && game.weave == nil

    VStack(spacing: v.gap) {
      ForEach(0..<game.need, id: \.self) { i in
        let spoken = i < game.recited
        let lit = game.reading == nil || game.reading == i
        Text(game.draw(atSlot: i)?.line ?? " ")
          .font(.roman(v.size))
          .foregroundStyle(Palette.text.opacity(lit ? 0.92 : 0.30))
          .shadow(color: Palette.goldLit.opacity(game.reading == i ? 0.9 : 0), radius: 12)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
          .frame(height: v.size * 1.34)
          .opacity(spoken ? 1 : 0)
          .offset(y: spoken ? 0 : 7)
          .blur(radius: spoken ? 0 : 5)
      }
    }
    .animation(.easeOut(duration: 0.35), value: game.reading)
    .frame(width: layout.size.width * 0.86)
    .position(x: layout.size.width / 2, y: layout.stanzaTop + v.height / 2)
    .opacity(shown ? 1 : 0)
    .animation(.easeOut(duration: 0.6), value: shown)
    .opacity(1 - game.hush)
    .allowsHitTesting(false)
  }
}

// ===================================================================
//  The thread — a single finished folio, never a chat transcript.
//  It is set in the air where the verse was, not in a box.
// ===================================================================

private struct ThreadPanel: View {
  let game: Game
  let layout: Layout

  private var active: Bool {
    game.phase == .reading && game.inspecting == nil && game.recitalDone
  }

  var body: some View {
    let v = layout.verse(game.need)
    let inviteAt = min(layout.inviteY, layout.stanzaTop + v.height + 44)

    ZStack {
      if active {
        if let result = game.weave {
          finished(result)
            .allowsHitTesting(false)
            .frame(
              width: min(660, layout.size.width * 0.62),
              height: max(120, layout.inviteY + 20 - layout.stanzaTop), alignment: .top
            )
            .position(
              x: layout.size.width / 2, y: (layout.stanzaTop + layout.inviteY + 20) / 2)
            .transition(.opacity)
        } else {
          Group {
            if game.weaving {
              settling
            } else if game.weaveError {
              quietFailure
            } else {
              invitation
            }
          }
          .opacity(1 - game.hush)
          .allowsHitTesting(!game.returning)
          .position(x: layout.size.width / 2, y: inviteAt)
          .transition(.opacity)
        }
      }
    }
    .animation(.easeOut(duration: 0.7), value: active)
    .animation(.easeOut(duration: 0.5), value: game.weave != nil)
    .animation(.easeOut(duration: 0.3), value: game.weaving)
  }

  private var invitation: some View {
    Button(action: { game.findThread() }) {
      HStack(spacing: 11) {
        ThreadGlyph(size: 8)
        Caps(
          text: "find the thread", size: 9.5, tracking: 3.8,
          color: Palette.goldInk)
      }
      .frame(width: 200, height: 30)
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
  }

  private var settling: some View {
    HStack(spacing: 12) {
      ThreadGlyph(size: 7)
      Caps(
        text: "letting the cards settle", size: 9.5, tracking: 3.2,
        color: Palette.text.opacity(0.52))
    }
  }

  private var quietFailure: some View {
    HStack(spacing: 18) {
      Caps(
        text: "the thread stayed quiet", size: 9.5, tracking: 3.2,
        color: Palette.text.opacity(0.52))
      Button("try again") { game.findThread() }
        .buttonStyle(.plain)
        .font(.italic(13))
        .foregroundStyle(Palette.goldInk)
    }
  }

  /// When the cards are returned, the two sentences leave with the room;
  /// the question is the one thing on the table that stays.
  private func finished(_ result: WeaveResult) -> some View {
    VStack(spacing: 18) {
      Group {
        Text(result.thread)
          .font(.roman(19))
          .foregroundStyle(Palette.text.opacity(0.92))
          .lineSpacing(5)
          .multilineTextAlignment(.center)
          .fixedSize(horizontal: false, vertical: true)

        Rectangle()
          .fill(Palette.goldInk)
          .frame(width: 5, height: 5)
          .rotationEffect(.degrees(45))
          .shadow(color: Palette.goldLit, radius: 5)
      }
      .opacity(1 - game.hush)

      // it leaves as the cards turn over, before they pass beneath it
      Text(result.question)
        .font(.italic(18))
        .foregroundStyle(Palette.goldInk)
        .shadow(color: Palette.goldLit.opacity(0.6), radius: 12)
        .lineSpacing(3)
        .multilineTextAlignment(.center)
        .fixedSize(horizontal: false, vertical: true)
        .opacity(game.homeward ? 0 : 1)
    }
  }
}

private struct ThreadGlyph: View {
  let size: CGFloat

  var body: some View {
    ZStack {
      Rectangle()
        .fill(Palette.goldInk.opacity(0.9))
        .frame(width: size, height: size)
        .rotationEffect(.degrees(45))
      Rectangle()
        .fill(Palette.goldInk.opacity(0.4))
        .frame(width: 1, height: 18)
    }
    .frame(width: 18, height: 18)
  }
}

// ===================================================================
//  The altar — one card, full size, lit from behind; it turns toward
//  the hand, light slides over its leaf, and its words arrive in order.
// ===================================================================

private struct Inspector: View {
  let game: Game
  let draw: Draw
  let label: String
  let size: CGSize
  let pointer: Pointer
  let reduceMotion: Bool
  /// Its words are still rising into place; until they have, its clock
  /// runs quick, and then settles to the pace of the card's slow float.
  @State private var arriving = true

  var body: some View {
    let d = draw
    let h = min(480, size.height * 0.62)
    let w = h * 0.565
    // Once it is closing, it takes no clicks, its clock rests and the card
    // stops turning. A clock still running would keep turning the card toward
    // a moving hand, each turn a spring begun afresh, and SwiftUI does not
    // finish taking away a view that is still animating: the altar would stay,
    // unseen, over the whole table, and take every click.
    let open = game.inspecting != nil

    TimelineView(
      .animation(
        minimumInterval: arriving ? 1.0 / 60.0 : 1.0 / 30.0,
        paused: reduceMotion || !game.visible || !open)
    ) { tl in
      let now = tl.date.timeIntervalSinceReferenceDate
      let age = reduceMotion ? 10 : now - game.openedAt
      let b = reduceMotion ? 0.5 : Sky.breath(now)

      ZStack {
        Palette.pearl.opacity(0.84).ignoresSafeArea()

        HStack(spacing: min(72, size.width * 0.055)) {
          ZStack {
            Ellipse()
              .fill(
                RadialGradient(
                  colors: [
                    Palette.goldLit.opacity(0.55 + 0.12 * b), Palette.dawn.opacity(0.35),
                    Palette.dawn.opacity(0),
                  ],
                  center: .center, startRadius: 0, endRadius: h * 0.9)
              )
              .frame(width: h * 1.9, height: h * 1.9)
              .blendMode(.screen)

            AltarCard(
              draw: d, width: w, height: h,
              tilt: reduceMotion ? .zero : pointer.follow(now: now),
              breath: b, float: reduceMotion ? 0 : sin(now * 2 * .pi / 10) * 3, turning: open)
          }
          .frame(width: w, height: h)

          VStack(alignment: .leading, spacing: 16) {
            Caps(text: label, size: 10, tracking: 4.2, color: Palette.goldInk)
              .rise(age, 0)

            VStack(alignment: .leading, spacing: 8) {
              Text(d.card.name.uppercased())
                .font(.display(32))
                .tracking(4)
                .foregroundStyle(Palette.text)
                .shadow(color: Palette.goldLit.opacity(0.45), radius: 16)
                .fixedSize(horizontal: false, vertical: true)
              HStack(spacing: 10) {
                Caps(text: d.card.roman, size: 10, tracking: 3, color: Palette.text.opacity(0.42))
                if d.reversed {
                  Caps(
                    text: "· reversed", size: 10, tracking: 3,
                    color: Palette.blood)
                }
              }
            }
            .rise(age, 1)

            Text(d.card.essence)
              .font(.italic(20))
              .foregroundStyle(Palette.goldInk)
              .rise(age, 2)

            Rectangle().fill(Palette.text.opacity(0.2)).frame(width: 54, height: 1)
              .rise(age, 3)

            Text(d.line)
              .font(.roman(25))
              .foregroundStyle(Palette.text.opacity(0.92))
              .fixedSize(horizontal: false, vertical: true)
              .rise(age, 4)

            HStack(spacing: 10) {
              ForEach(Array(d.keys.enumerated()), id: \.offset) { pair in
                if pair.offset > 0 {
                  Rectangle()
                    .fill(Palette.goldInk.opacity(0.55))
                    .frame(width: 4, height: 4)
                    .rotationEffect(.degrees(45))
                }
                Caps(
                  text: pair.element, size: 9.5, tracking: 2.6, color: Palette.text.opacity(0.5))
              }
            }
            .padding(.top, 4)
            .rise(age, 5)
          }
          .frame(maxWidth: 360, alignment: .leading)
        }
      }
    }
    .transition(.opacity)
    .contentShape(Rectangle())
    .onTapGesture { game.closeInspector() }
    .allowsHitTesting(open)
    .task(id: game.openedAt) {
      // the last of its words is in place 1.8 s after it opens
      arriving = true
      try? await Task.sleep(nanoseconds: 1_900_000_000)
      if !Task.isCancelled { arriving = false }
    }
  }
}

private struct AltarCard: View {
  let draw: Draw
  let width: CGFloat
  let height: CGFloat
  let tilt: CGPoint
  let breath: Double
  let float: Double
  /// The altar is open, so the card turns toward the hand; as it closes, the
  /// last turn is let go at once rather than left to settle.
  let turning: Bool

  var body: some View {
    CardImages.shared.face(draw)
      .interpolation(.high)
      .resizable()
      .frame(width: width, height: height)
      .overlay {
        // a band of light that slides over the card as it turns
        LinearGradient(
          stops: [
            .init(color: .clear, location: 0),
            .init(color: .white.opacity(0.0), location: 0.34),
            .init(color: .white.opacity(0.30), location: 0.5),
            .init(color: .white.opacity(0.0), location: 0.66),
            .init(color: .clear, location: 1),
          ],
          startPoint: UnitPoint(x: -0.2 + tilt.x * 0.7, y: -0.1 + tilt.y * 0.5),
          endPoint: UnitPoint(x: 1.0 + tilt.x * 0.7, y: 1.1 + tilt.y * 0.5)
        )
        .blendMode(.softLight)
      }
      .rotation3DEffect(
        .degrees(Double(tilt.y) * -6), axis: (x: 1, y: 0, z: 0), perspective: 0.45)
      .rotation3DEffect(
        .degrees(Double(tilt.x) * 8), axis: (x: 0, y: 1, z: 0), perspective: 0.45)
      .shadow(color: Palette.shade.opacity(0.32), radius: 36, y: 22)
      .shadow(color: Palette.goldLit.opacity(0.30 + 0.15 * breath), radius: 50)
      .offset(y: float)
      .animation(
        turning ? .interactiveSpring(response: 0.8, dampingFraction: 0.86) : nil, value: tilt)
  }
}

private extension View {
  /// Arrive in order: the k-th element of the altar's text settles in
  /// a beat after the one before.
  func rise(_ age: Double, _ k: Int) -> some View {
    let t = ramp(age, 0.18 + Double(k) * 0.17, 0.95 + Double(k) * 0.17)
    return self
      .opacity(t)
      .offset(y: (1 - t) * 10)
      .blur(radius: (1 - t) * 4)
  }
}

private struct MuteToggle: View {
  let game: Game

  var body: some View {
    VStack {
      HStack {
        Spacer()
        Button(action: { game.toggleMute() }) {
          BowlGlyph(ringing: !game.muted)
            .frame(width: 26, height: 26)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Sound")
        .accessibilityValue(game.muted ? "Off" : "On")
        .accessibilityAddTraits(.isToggle)
      }
      Spacer()
    }
    .padding(18)
  }
}

/// Sound, drawn by the same pen as the cards: a singing bowl, with its
/// note rising off it while the room is heard, and still when it is not.
private struct BowlGlyph: View {
  let ringing: Bool

  private static let space = CGSize(width: 24, height: 24)

  private static let bowl: [Mark] = {
    var p = Pen(seed: 404)
    p.line(4.6, 12.2, 19.4, 12.2, w: 1.05, amp: 0.25)
    p.smooth([[4.6, 12.2], [6.4, 16.2], [12, 18.2], [17.6, 16.2], [19.4, 12.2]], closed: false, w: 1.05)
    p.line(9.6, 19.8, 14.4, 19.8, w: 1.0, amp: 0.2)
    return p.marks
  }()

  private static let note: [Mark] = {
    var p = Pen(seed: 405)
    p.smooth([[8.2, 9.0], [12, 7.6], [15.8, 9.0]], closed: false, w: 0.9)
    p.smooth([[6.2, 5.9], [12, 3.9], [17.8, 5.9]], closed: false, w: 0.9)
    return p.marks
  }()

  var body: some View {
    let ink = Palette.text.opacity(ringing ? 0.5 : 0.3)
    ZStack {
      MarksCanvas(marks: Self.bowl, space: Self.space, tint: .only(ink))
      MarksCanvas(marks: Self.note, space: Self.space, tint: .only(ink))
        .opacity(ringing ? 1 : 0)
    }
    .animation(.easeOut(duration: 0.35), value: ringing)
  }
}

// ===================================================================
//  Window — a chrome-less, centred stage that never opens too small.
// ===================================================================

struct WindowSetup: NSViewRepresentable {
  let game: Game

  func makeCoordinator() -> Watcher { Watcher() }

  func makeNSView(context: Context) -> NSView {
    let probe = NSView()
    let watcher = context.coordinator
    DispatchQueue.main.async {
      guard let window = probe.window else { return }
      watcher.watch(window, game: game)
      window.titlebarAppearsTransparent = true
      window.backgroundColor = NSColor(
        red: 0.978, green: 0.968, blue: 0.948, alpha: 1)
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

  static func dismantleNSView(_ nsView: NSView, coordinator: Watcher) { coordinator.stop() }

  /// Whether anyone can see the room: the window is on screen and not
  /// covered, minimised or hidden, the screens are awake, and this is the
  /// user's session. Kept as one flag on the game, which changes rarely.
  @MainActor
  final class Watcher {
    private var tokens: [(NotificationCenter, NSObjectProtocol)] = []
    private weak var window: NSWindow?
    private weak var game: Game?
    private var awake = true
    private var here = true

    func watch(_ window: NSWindow, game: Game) {
      guard self.window == nil else { return }
      self.window = window
      self.game = game
      let local = NotificationCenter.default
      let shared = NSWorkspace.shared.notificationCenter
      observe(local, NSWindow.didChangeOcclusionStateNotification, window) { _ in }
      observe(shared, NSWorkspace.screensDidSleepNotification) { $0.awake = false }
      observe(shared, NSWorkspace.screensDidWakeNotification) { $0.awake = true }
      observe(shared, NSWorkspace.sessionDidResignActiveNotification) { $0.here = false }
      observe(shared, NSWorkspace.sessionDidBecomeActiveNotification) { $0.here = true }
      update()
    }

    func stop() {
      for (center, token) in tokens { center.removeObserver(token) }
      tokens = []
    }

    private func observe(
      _ center: NotificationCenter, _ name: Notification.Name, _ object: AnyObject? = nil,
      _ change: @escaping @MainActor (Watcher) -> Void
    ) {
      let token = center.addObserver(forName: name, object: object, queue: .main) { [weak self] _ in
        MainActor.assumeIsolated {
          guard let self else { return }
          change(self)
          self.update()
        }
      }
      tokens.append((center, token))
    }

    private func update() {
      guard let window, let game else { return }
      let seen = window.occlusionState.contains(.visible) && awake && here
      if game.visible != seen { game.visible = seen }
    }
  }
}
