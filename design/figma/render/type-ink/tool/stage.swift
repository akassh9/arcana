import AppKit
import SwiftUI

// The reading's words on the whole stage (RootView, near sky drawn still,
// 1260x828 = the default window's content under its title bar): the verse
// spoken line by line, the epigraph, the altar's column, the thread panel.

let readme: [(String, Bool)] = [("cups-6", false), ("star", false), ("swords-6", false)]
/// For the recital: no card the sky answers, so the sky stays as it was while the verse is spoken.
let recitalCards: [(String, Bool)] = [("cups-6", false), ("hermit", false), ("swords-6", false)]

@MainActor func shootStage(
  _ rel: String, crops: [(String, CGRect)] = [], full: Bool = true, pose: (Game) -> Void
) {
  let g = freshGame()
  pose(g)
  guard let img = bitmap(stageView(g), scale: 2) else {
    print("× \(rel)")
    return
  }
  if full { writePNG(img, "type-ink/\(rel)@2x.png") }
  for (name, r) in crops {
    if let c = crop(img, r, scale: 2) { writePNG(c, "type-ink/\(name)@2x.png") }
  }
}

@MainActor func renderVerse() {
  let L = Layout(size: stageSize, slots: 3, phase: .reading)
  let v = L.verse(3)
  let verseBox = CGRect(x: 230, y: L.stanzaTop - 18, width: 800, height: v.height + 36)
  let foot = CGRect(x: 230, y: L.stanzaTop - 18, width: 800, height: stageSize.height - L.stanzaTop + 18)
  let epiBox = CGRect(x: 330, y: L.epigraphY - 40, width: 600, height: 64)
  let arriveP = 0.5
  let arriveT = inverse(easeOut, arriveP) * 1.1
  var frames: [[String: Any]] = []

  func frame(_ n: Int, _ tag: String, at: String, _ pose: @escaping (Game) -> Void) {
    let rel = "verse/recital-\(n)-\(tag)"
    shootStage(rel, crops: [("verse/recital-\(n)-\(tag)-verse", foot)]) { g in
      lay(g, spread: 1, recitalCards)
      g.sounded = false
      g.recited = 0
      pose(g)
    }
    frames.append([
      "n": n, "state": tag, "when": at, "stage_png": "type-ink/\(rel)@2x.png",
      "crop_png": "type-ink/verse/recital-\(n)-\(tag)-verse@2x.png",
    ])
  }
  frame(1, "cards-laid", at: "the moment the last card is written (0 s)") { _ in }
  frame(2, "epigraph", at: "0.9 s: the question is read back, arriving over 1.1 s") { g in
    g.quill.poseAsked(asked, at: longAgo)
  }
  frame(3, "line-1-arriving", at: "2.7 s + \(r3(arriveT)) s: the first line half-way through its 1.1 s arrival (opacity 0.5, blur 2.5, 3.5 pt low)") { g in
    g.quill.poseAsked(asked, at: longAgo)
    g.recited = 1
    typeInkLineArrive = [0: arriveP]
  }
  frame(4, "line-1", at: "2.7 s (+1.1 s arrival)") { g in
    typeInkLineArrive = [:]
    g.quill.poseAsked(asked, at: longAgo)
    g.recited = 1
  }
  frame(5, "line-2", at: "4.15 s") { g in
    g.quill.poseAsked(asked, at: longAgo)
    g.recited = 2
  }
  frame(6, "line-3", at: "5.6 s") { g in
    g.quill.poseAsked(asked, at: longAgo)
    g.recited = 3
  }
  frame(7, "rung", at: "7.05 s: light runs the thread and the spread rings as one chord; the way back is offered") { g in
    g.quill.poseAsked(asked, at: longAgo)
    g.recited = 3
    g.sounded = true
  }
  frame(8, "reading-a-line", at: "hovering the middle card: its line is lit, the others dim to 30%") { g in
    g.quill.poseAsked(asked, at: longAgo)
    g.recited = 3
    g.sounded = true
    g.reading = 1
  }
  // the three-card verse alone, without a question, as it lies once spoken
  shootStage("verse/verse-three", crops: [("verse/verse-three-lines", verseBox)], full: false) { g in
    lay(g, spread: 1, recitalCards)
  }
  // one card and five, for the verse's other two sizes
  let L1 = Layout(size: stageSize, slots: 1, phase: .reading)
  let v1 = L1.verse(1)
  shootStage(
    "verse/verse-one", crops: [("verse/verse-one-line", CGRect(x: 180, y: L1.stanzaTop - 18, width: 900, height: v1.height + 36))],
    full: true
  ) { g in lay(g, spread: 0, [("lovers", false)]) }
  let L5 = Layout(size: stageSize, slots: 5, phase: .reading)
  let v5 = L5.verse(5)
  shootStage(
    "verse/verse-five", crops: [("verse/verse-five-lines", CGRect(x: 230, y: L5.stanzaTop - 18, width: 800, height: v5.height + 36))],
    full: true
  ) { g in
    lay(g, spread: 2, [("fool", false), ("tower", true), ("empress", false), ("star", false), ("world", false)])
  }
  // the epigraph alone, arriving (as its insertion transition lerps it) and at rest
  var epi: [CGImage] = []
  for p in [0.0, 0.25, 0.5, 0.75, 1.0] {
    let e = EpigraphLine(text: asked)
      .opacity(p).blur(radius: 5 * (1 - p)).offset(y: 7 * (1 - p))
      .padding(.horizontal, 30).padding(.top, 40).padding(.bottom, 20)
      .background(Palette.pearl)
    if let img = save("type-ink/verse/epigraph-arriving-\(String(format: "%.2f", p))@2x.png", e, scale: 2) {
      epi.append(img)
    }
  }
  shootStage("verse/epigraph-in-room", crops: [("verse/epigraph-in-room", epiBox)], full: false) { g in
    lay(g, spread: 1, recitalCards)
    g.quill.poseAsked(asked, at: longAgo)
  }
  writeJSON(
    [
      "about":
        "The reading spoken back (Game.recite, RootView Stanza/Epigraph), over the Six of Cups, the Hermit and the Six of Swords (none of which the sky answers, so the sky holds still through the recital), asked 'Should I leave the city before winter'. Stage 1260x828 @2x; the -verse crops are the stage from the verse to the foot.",
      "cadence":
        "0.9 s after the last card is written the question is read back (if one was written), then 1.8 s later the first line; a line every 1.45 s; then the thread's light and the chord, and HOLD · RETURN THE CARDS fades in (0.8 s). With Reduce Motion: 0.5 s and 0.15 s.",
      "arrive":
        "Each line, and the epigraph, arrives over 1.1 s easeOut: opacity 0→1, blur 5→0, y +7→0. The epigraph leaves over 0.7 s (opacity) and stays at 40% while a card is on the altar.",
      "verse_layout_3":
        "size \(r2(v.size)) pt Didot, gap \(r2(v.gap)), line box \(r2(v.size * 1.34)), block top \(r2(L.stanzaTop)) pt, column 86% of the stage (1083.6), centred; epigraph centre y \(r2(L.epigraphY))",
      "verse_layout_1": "size \(r2(v1.size)), block top \(r2(L1.stanzaTop))",
      "verse_layout_5": "size \(r2(v5.size)) (draws \(Int(v5.size.rounded()))), gap \(r2(v5.gap)), block top \(r2(L5.stanzaTop))",
      "frames": frames,
      "line_arrival_frame_time_s": r3(arriveT),
    ], "type-ink/verse/recital.json")
  typeInkLineArrive = [:]
}

@MainActor func renderAltar() {
  // the altar's column: label, name, numeral (· reversed), essence, rule, line, keys
  let column = CGRect(x: 590, y: 170, width: 420, height: 500)
  let whole = CGRect(x: 230, y: 110, width: 800, height: 620)
  var frames: [[String: Any]] = []
  func altar(_ tag: String, cards: [(String, Bool)], age: Double?) {
    shootStage("altar/altar-\(tag)", crops: [("altar/altar-\(tag)-column", column), ("altar/altar-\(tag)-crop", whole)], full: age == nil) { g in
      lay(g, spread: 1, cards)
      g.poseAnswers(from: Date().timeIntervalSinceReferenceDate - 60)
      g.inspecting = 1
      g.openedAt = age.map { Date().timeIntervalSinceReferenceDate - $0 } ?? longAgo
    }
    frames.append(["state": tag, "age_s": age ?? 60])
  }
  altar("the-star", cards: readme, age: nil)
  altar("the-star-reversed", cards: [("cups-6", false), ("star", true), ("swords-6", false)], age: nil)
  altar("court-reversed", cards: [("swords-3", false), ("wands-queen", true), ("pentacles-10", false)], age: nil)
  for a in [0.25, 0.45, 0.65, 0.85, 1.05, 1.25, 1.5] {
    altar("rising-\(String(format: "%.2f", a))s", cards: readme, age: a)
  }
  writeJSON(
    [
      "about":
        "The altar (RootView Inspector): one card, full size, lit from behind, its words arriving in order in a column at most 360 wide beside it. Stage 1260x828 @2x; -column crops the text, -crop the card and the text.",
      "column":
        "Top to bottom, spacing 16: position label (Caps 10/4.2 goldInk); name (Didot Bold 32, tracking 4, text, glow goldLit@45% r16) with, 8 below, the numeral (Caps 10/3 text@42%) and '· REVERSED' (Caps 10/3 blood) 10 apart; essence (Didot Italic 20, goldInk); a 54x1 rule text@20%; the line (Didot 25, text@92%); 4 more down, the keywords (Caps 9.5→10 / 2.6, text@50%) between 4x4 goldInk@55% diamonds, 10 apart.",
      "rise":
        "Item k (0 label, 1 name+numeral, 2 essence, 3 rule, 4 line, 5 keys) arrives over smoothstep(age, 0.18 + 0.17k, 0.95 + 0.17k): opacity 0→1, y +10→0, blur 4→0. All in place 1.8 s after opening. Reduce Motion: shown at once.",
      "card": "h = min(480, 62% of the stage height) = 480, w = 271.2; gap to the column min(72, 5.5% width) = 69.3.",
      "frames": frames,
    ], "type-ink/altar/altar.json")
}

@MainActor func renderThread() {
  let L = Layout(size: stageSize, slots: 3, phase: .reading)
  let panel = CGRect(x: 250, y: L.stanzaTop - 20, width: 760, height: stageSize.height - L.stanzaTop + 20)
  var states: [[String: Any]] = []
  func state(_ tag: String, _ what: String, _ pose: @escaping (Game) -> Void) {
    shootStage("thread/thread-\(tag)", crops: [("thread/thread-\(tag)-panel", panel)]) { g in
      lay(g, spread: 1, readme)
      g.poseAnswers(from: Date().timeIntervalSinceReferenceDate - 60)
      g.threadable = true
      pose(g)
    }
    states.append([
      "state": tag, "what": what, "stage_png": "type-ink/thread/thread-\(tag)@2x.png",
      "panel_png": "type-ink/thread/thread-\(tag)-panel@2x.png",
    ])
  }
  state("offered", "With a key in Settings, once the verse is spoken: FIND THE THREAD (Caps 9.5→10 / 3.8 goldInk) 11 right of the thread glyph (an 8x8 goldInk@90% diamond on an 18-tall 1 pt goldInk@40% stem), a 200x30 button, 44 under the verse.") { _ in }
  state("settling", "While OpenAI is asked: LETTING THE CARDS SETTLE (Caps 10 / 3.2 text@52%) beside a 7 pt glyph; light swings along the thread.") { g in
    g.weaving = true
  }
  state("quiet", "If it fails: THE THREAD STAYED QUIET (Caps 10 / 3.2 text@52%) and, 18 to its right, 'try again' (Didot Italic 13, goldInk).") { g in
    g.weaveError = true
  }
  state("quiet-refused", "If OpenAI refused the key: the same words without 'try again'.") { g in
    g.weaveError = true
    g.threadable = false
  }
  state("found", "The thread: two sentences (Didot 19, text@92%, line spacing +5, centred, min(660, 62%) wide), a 5x5 goldInk diamond with a goldLit r5 glow 18 below, then its question (Didot Italic 18, goldInk, glow goldLit@60% r12, line spacing +3) 18 below that.") { g in
    g.weave = woven
  }
  state("found-asked", "The thread over a reading whose question was written: the epigraph stays above the cards.") { g in
    g.weave = woven
    g.quill.poseAsked(asked, at: longAgo)
  }
  writeJSON(
    [
      "about":
        "The thread panel (RootView ThreadPanel), over the README's reading (the Six of Cups, the Star, the Six of Swords; the sky has answered the Star): set in the air where the verse was, never in a box. Stage 1260x828 @2x; -panel crops from the verse's top to the foot. The panel's states cross-fade (0.3-0.7 s).",
      "states": states,
    ], "type-ink/thread/thread.json")
}
