import AppKit
import SwiftUI

// Renders posed frames of the stage to PNG so the layout can be reviewed
// without a display. Not part of the app.

_ = NSApplication.shared

let outDir = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "."
let stage = CGSize(width: 1260, height: 860)

MainActor.assumeIsolated {
  @MainActor func save<V: View>(_ name: String, _ view: V, scale: CGFloat = 1) {
    let renderer = ImageRenderer(content: view)
    renderer.scale = scale
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

  @MainActor func shoot(_ name: String, size: CGSize = stage, pose: (Game) -> Void) {
    let g = Game()
    pose(g)
    save(name, RootView(game: g).frame(width: size.width, height: size.height))
  }

  let long = Date().timeIntervalSinceReferenceDate - 60

  @MainActor func read(_ g: Game, spread: Int, picks: [Int]) {
    g.spreadIndex = spread
    g.phase = .reading
    g.dealt = true
    g.picks = picks
    g.faceUp = Set(picks)
    g.inked = Set(picks)
    g.recited = picks.count
    for s in 0..<picks.count { g.landed[s] = long }
  }

  /// A spread whose chord has rung, being returned: held to `L`.
  @MainActor func returning(_ g: Game, spread: Int, picks: [Int], at L: Double) {
    read(g, spread: spread, picks: picks)
    g.sounded = true
    g.returning = true
    g.letting = L
    g.sinks = Dictionary(uniqueKeysWithValues: picks.map { ($0, Sink()) })
    g.settleReturn(sounding: false)
  }

  shoot("1-invocation") { _ in }
  shoot("2-holding") { g in
    g.holding = true
    g.poseCharge(0.62)
  }
  shoot("3-draw") { g in
    g.phase = .draw
    g.dealt = true
  }
  shoot("4-mid") { g in
    g.phase = .draw
    g.dealt = true
    g.picks = [4]
    g.faceUp = [4]
    g.inked = [4]
    g.landed[0] = long
  }
  shoot("5-reading") { g in read(g, spread: 1, picks: [4, 9, 15]) }
  shoot("6-reading-hover") { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.reading = 1
  }
  shoot("7-inspect") { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.inspecting = 1
    g.openedAt = long
  }
  shoot("8-five") { g in read(g, spread: 2, picks: [1, 5, 8, 13, 19]) }
  shoot("9-one") { g in read(g, spread: 0, picks: [6]) }
  shoot("10-woven") { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.weave = WeaveResult(
      thread:
        "What was rooted is being lifted into the light. The hand that steadies it is already yours.",
      question: "What would you tend if no one were watching the roots?")
  }
  shoot("15-returning") { g in returning(g, spread: 1, picks: [4, 9, 15], at: 0.45) }
  shoot("16-blank") { g in returning(g, spread: 1, picks: [4, 9, 15], at: 0.90) }
  shoot("17-returning-five") { g in returning(g, spread: 2, picks: [1, 5, 8, 13, 19], at: 0.55) }
  shoot("18-carried") { g in
    returning(g, spread: 1, picks: [4, 9, 15], at: 0.90)
    g.weave = WeaveResult(
      thread:
        "What was rooted is being lifted into the light. The hand that steadies it is already yours.",
      question: "What would you tend if no one were watching the roots?")
  }
  shoot("19-one-blank") { g in returning(g, spread: 0, picks: [6], at: 0.90) }
  // the question, written
  let asked = "Should I leave the city before winter"
  // as long a line as the pen will lay: the capacity, cut back to a word
  let longest = Quill.room(
    for: "Should I leave the city before winter, or wait for the light to come back to me",
    after: "", pasted: true)
  @MainActor func wetTail(_ s: String) -> [Double] {
    let tail: [Double] = [0.62, 0.40, 0.22, 0.06]
    return (0..<s.count).map { i in
      let j = i - (s.count - tail.count)
      return j >= 0 ? tail[j] : 60
    }
  }
  shoot("19-writing") { g in g.quill.pose(asked, ages: wetTail(asked), wet: true) }
  shoot("20-written") { g in g.quill.pose(asked) }
  shoot("21-giving") { g in
    g.quill.pose(asked)
    g.quill.beginGiving()
    g.quill.poseGiving(center: CGPoint(x: 630, y: 259))
    g.quill.peak = 0.70
    g.holding = true
    g.poseCharge(0.70)
  }
  shoot("26-long") { g in g.quill.pose(longest) }
  shoot("22-epigraph") { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.quill.poseAsked(asked, at: long)
  }
  shoot("23-epigraph-one") { g in
    read(g, spread: 0, picks: [6])
    g.quill.poseAsked(asked, at: long)
  }
  shoot("24-epigraph-woven") { g in
    read(g, spread: 1, picks: [4, 9, 15])
    g.quill.poseAsked(asked, at: long)
    g.weave = WeaveResult(
      thread:
        "What was rooted is being lifted into the light. The hand that steadies it is already yours.",
      question: "What would you tend if no one were watching the roots?")
  }
  shoot("25-epigraph-small", size: CGSize(width: 940, height: 660)) { g in
    read(g, spread: 0, picks: [6])
    g.quill.poseAsked(longest, at: long)
  }
  shoot("27-blank-asked") { g in
    returning(g, spread: 1, picks: [4, 9, 15], at: 0.90)
    g.quill.poseAsked(asked, at: long)
  }
  shoot("26-long-small", size: CGSize(width: 940, height: 660)) { g in g.quill.pose(longest) }
  shoot("30-carried-asked") { g in
    returning(g, spread: 1, picks: [4, 9, 15], at: 0.90)
    g.quill.poseAsked(asked, at: long)
    g.weave = WeaveResult(
      thread:
        "What was rooted is being lifted into the light. The hand that steadies it is already yours.",
      question: "What would you tend if no one were watching the roots?")
  }
  shoot("28-five-asked") { g in
    read(g, spread: 2, picks: [1, 5, 8, 13, 19])
    g.quill.poseAsked(asked, at: long)
  }
  shoot("11-five-small", size: CGSize(width: 940, height: 660)) { g in
    read(g, spread: 2, picks: [1, 5, 8, 13, 19])
  }
  shoot("12-invocation-small", size: CGSize(width: 940, height: 660)) { _ in }

  // a card being written, left to right: 12% … finished
  let d = Draw(card: deck[17], reversed: false)
  let steps: [Double] = [0.08, 0.2, 0.34, 0.5, 0.68, 0.86, 1]
  save(
    "13-ink",
    HStack(spacing: 18) {
      ForEach(steps, id: \.self) { k in
        InkFace(ink: k, draw: d, size: CGSize(width: 150, height: 265))
      }
    }
    .padding(30)
    .background(Palette.pearl),
    scale: 2)

  // a card given back, left to right: its ink sinking into the stock
  let sinking = [Draw(card: deck[10], reversed: false), Draw(card: deck[19], reversed: true)]
  save(
    "13b-sink",
    VStack(spacing: 18) {
      ForEach(sinking, id: \.card.id) { d in
        HStack(spacing: 18) {
          ForEach([0.0, 0.25, 0.5, 0.75, 1.0], id: \.self) { k in
            InkFace(ink: 1, draw: d, size: CGSize(width: 150, height: 265), sink: pow(k, 1.8))
          }
        }
      }
    }
    .padding(30)
    .background(Palette.pearl),
    scale: 2)

  // a word as it is laid, each letter a moment younger than the last (the
  // last not yet on the paper); then a pasted word, laid whole, cooling as one;
  // then a line of fi and fl, whose ligatures the pen never forms
  let now = Date().timeIntervalSinceReferenceDate
  let ages: [Double] = [0.9, 0.6, 0.4, 0.25, 0.1, 0.0, -0.1]
  save(
    "13c-quill",
    VStack(alignment: .leading, spacing: 14) {
      InkLine(
        text: "winters", marked: "", born: ages.map { now - $0 }, now: now,
        dry: false, rest: 0.62, charge: 0, giving: 0, spentAt: 0)
      ForEach([0.0, 0.1, 0.3, 0.6, 0.9], id: \.self) { age in
        InkLine(
          text: "winter", marked: "", born: Array(repeating: now - age, count: 6), now: now,
          dry: false, rest: 0.62, charge: 0, giving: 0, spentAt: 0)
      }
      InkLine(
        text: "find the first flight", marked: "", born: [], now: now,
        dry: true, rest: 0.62, charge: 0, giving: 0, spentAt: now - 0.1)
    }
    .padding(30)
    .background(Palette.pearl),
    scale: 3)

  save(
    "14-back",
    HStack(spacing: 30) {
      CardImages.shared.back().resizable().frame(width: 226, height: 400)
      CardImages.shared.face(Draw(card: deck[18], reversed: false)).resizable()
        .frame(width: 226, height: 400)
    }
    .padding(40)
    .background(Palette.pearl),
    scale: 2)
}
