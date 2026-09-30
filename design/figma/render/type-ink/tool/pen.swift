import AppKit
import SwiftUI

// The question line: the pen's italic laid in gold and cooling to ink, the
// line at its full width, the spent pen's dot, the held line, and the
// question given to the deck as dust. InkLine and Quill are the app's own.

@MainActor let longest = Quill.room(
  for: "Should I leave the city before winter, or wait for the light to come back to me",
  after: "", pasted: true)

@MainActor func inkLine(
  _ text: String, ages: [Double]? = nil, age: Double? = nil, marked: String = "", dry: Bool = false,
  charge: Double = 0, giving: Int = 0, spentAgo: Double? = nil
) -> some View {
  let now = Date().timeIntervalSinceReferenceDate
  let born: [TimeInterval] =
    ages.map { $0.map { now - $0 } } ?? Array(repeating: now - (age ?? 60), count: text.count)
  // as WrittenLine sets it: the rest ink darkens and gathers light with the charge
  return InkLine(
    text: text, marked: marked, born: born, now: now, dry: dry, rest: 0.62 + 0.36 * charge,
    charge: charge, giving: giving, spentAt: spentAgo.map { now - $0 } ?? 0
  )
  .shadow(color: Palette.goldLit.opacity(0.9 * charge), radius: 14)
}

/// One colour, as Quill.tone gives it, in sRGB hex and alpha.
@MainActor func toneRow(_ age: Double, rest: Double = 0.62) -> [String: Any] {
  let c = Quill.tone(age: age, rest: rest)
  let lit = 1 - ramp(age, 0, 0.15), cool = Quill.cool(age)
  return [
    "age_s": age, "hex": hex(c), "alpha": r3(alphaOf(c)), "nib_light": r3(lit), "cooled": r3(cool),
  ]
}

@MainActor func renderQuill() {
  let pad: CGFloat = 24
  func onPearl<V: View>(_ v: V) -> some View {
    v.padding(.horizontal, pad).padding(.vertical, 18).background(Palette.pearl)
  }
  var items: [String: Any] = [:]

  // a word as it is laid: each letter a moment younger than the last (the last not yet on the paper)
  let ages: [Double] = [0.9, 0.6, 0.4, 0.25, 0.1, 0.0, -0.1]
  save("type-ink/quill/laying-winters@3x.png", onPearl(inkLine("winters", ages: ages)), scale: 3)
  items["laying-winters"] = [
    "text": "winters", "ages_s": ages,
    "note": "Letter i was laid ages[i] seconds ago; a negative age is a letter waiting its turn (drawn clear). Same pose as Tools/shot 13c-quill.",
    "tones": ages.filter { $0 >= 0 }.map { toneRow($0) },
  ]

  // a word laid whole (a paste) cooling as one: one frame per age
  let wordAges: [Double] = [0, 0.05, 0.1, 0.15, 0.25, 0.4, 0.6, 0.9]
  var wordShots: [CGImage] = []
  for a in wordAges {
    if let img = save(
      "type-ink/quill/cooling-winter-\(String(format: "%.2f", a))s@3x.png", onPearl(inkLine("winter", age: a)),
      scale: 3)
    {
      wordShots.append(img)
    }
  }
  save(
    "type-ink/quill/cooling-winter-strip@3x.png",
    HStack(spacing: 0) {
      ForEach(0..<wordShots.count, id: \.self) { i in Image(decorative: wordShots[i], scale: 3) }
    }, scale: 3)
  // the ramp, finely, for building the colour change natively
  items["cooling"] = [
    "formula":
      "Per glyph by its age a (s since laid): nib light l = 1 - ramp(a, 0, 0.15); gold g = mix(gold, goldLit, l); cooled t = ramp(a, 0.08, 0.9) (smoothstep); colour = mix(g, text, t) at alpha 1 + (rest - 1) t, rest 0.62 (0.62 + 0.36 x charge while held). ramp is smoothstep between the two ages. A letter older than 0.9 s is plain text@rest.",
    "gold": hex(Palette.gold), "goldLit": hex(Palette.goldLit), "text": hex(Palette.text),
    "first_letter_delay_s": 0.22, "letters_together_gap_s": 0.03,
    "tones": stride(from: 0.0, through: 0.9001, by: 0.05).map { toneRow(r3($0)) },
    "strip_ages_s": wordAges,
  ]

  // the line at its full width
  let w = Quill.measure(longest).width
  save("type-ink/quill/full-width@3x.png", onPearl(inkLine(longest, dry: true)), scale: 3)
  items["full-width"] = [
    "text": longest, "width_pt": r2(w), "room_pt": Double(Quill.room),
    "note": "The longest line the pen lays: a paste cut back to its last whole word inside 560 pt. Pen italic: Didot-Italic 19 exactly (NSFont, not rounded), common ligatures off; dry ink text@62%.",
  ]

  // the spent pen: a key that found no room touches the paper just past the last stroke
  for (name, ago) in [("spent-pen@3x.png", 0.0), ("spent-pen-fading@3x.png", 0.35)] {
    save("type-ink/quill/\(name)", onPearl(inkLine(longest, spentAgo: ago)), scale: 3)
  }
  // the dot close up: the last word and the dot
  let tail = String(longest.split(separator: " ").last ?? "")
  let prefixWidth = Quill.measure(longest).width - Quill.measure(tail).width
  if let img = bitmap(onPearl(inkLine(longest, spentAgo: 0)), scale: 3),
    let c = crop(img, CGRect(x: pad + prefixWidth - 60, y: 0, width: Quill.measure(tail).width + 90, height: 60), scale: 3)
  {
    writePNG(c, "type-ink/quill/spent-pen-detail@3x.png")
  }
  items["spent-pen"] = [
    "dot": "A 2.4 pt disc of goldInk \(hex(Palette.goldInk)) 0.5 pt past the line's trailing edge, its centre 1.2 pt above the baseline; opacity 0.45 x (1 - ramp(age, 0, 0.7)), so it fades over 0.7 s. It lays nothing; the line keeps its width.",
    "frames": ["spent-pen@3x.png: age 0 (45%)", "spent-pen-fading@3x.png: age 0.35 s (22.5%)"],
  ]

  // an input method's composition (a dead key, before its letter): gold at 75%
  save(
    "type-ink/quill/composing@3x.png",
    onPearl(inkLine("Should I go back to the caf", marked: "´", dry: true)), scale: 3)
  items["composing"] = [
    "note": "Text an input method is still composing (here the dead key ´ before its é) is set in gold \(hex(Palette.gold)) at 75% after the laid ink; it is laid, and cools, when committed.",
  ]

  // the pen's italic never forms fi / fl (ligatures off), the invitation's does
  save(
    "type-ink/quill/ligatures@3x.png",
    onPearl(
      VStack(alignment: .leading, spacing: 10) {
        inkLine("find the first flight", dry: true)
        Text("find the first flight").font(.italic(19)).foregroundStyle(Palette.text.opacity(0.62))
      }), scale: 3)
  items["ligatures"] = [
    "note": "Top: the pen (Quill.font, ligatures off), so a colour change between two letters never breaks an fi apart. Bottom: the same words in the invitation's Font.italic(19), which does form fi / fl. In Figma, turn off common ligatures for the written question.",
  ]

  // held: the ink darkens and gathers light; from 0.45 each letter is given in turn
  let n = asked.filter { !$0.isWhitespace }.count
  var held: [[String: Any]] = []
  for c in [0.0, 0.25, 0.44, 0.52, 0.6, 0.68, 0.76, 0.85] {
    let name = "type-ink/quill/held-\(String(format: "%.2f", c))@3x.png"
    save(name, onPearl(inkLine(asked, dry: true, charge: c, giving: n).padding(14)), scale: 3)
    held.append(["charge": c, "png": name, "rest_alpha": r3(0.62 + 0.36 * c), "glow_alpha": r3(0.9 * c)])
  }
  items["held"] = [
    "note":
      "The written question while it is held (charge 0…1 over 3.2 s). Rest ink text@(62 + 36c)%, glow goldLit@(90c)% r14. Letter k of n (not counting spaces) begins to be given at charge 0.45 + 0.25 k/(n-1) (0.70 for a single letter) and thins over the next 0.10 of charge: opacity 1 - ramp(given, 0.3, 1). Letting go drains the charge at 2x and the letters ink again.",
    "letters": n, "frames": held,
  ]
  writeJSON(items, "type-ink/quill/quill.json")
}

/// The question given to the deck as dust: the whole stage (the near sky
/// drawn still), cut to the line and the deck.
@MainActor func renderDust() {
  // find where the question line sits: the room measures it as it is laid out
  let probe = freshGame()
  probe.quill.pose(asked)
  _ = bitmap(stageView(probe), scale: 1)
  let centre = probe.quill.lineCenter
  print("question line centre in the stage: \(centre)")
  let L = Layout(size: stageSize, slots: 3, phase: .invocation)
  // from above the title (the room going quiet) to under PRESS AND HOLD
  let cut = CGRect(x: 290, y: 105, width: 680, height: L.deck.y + L.ringR * 1.2 + 26 + 18 - 105)
  var frames: [[String: Any]] = []
  for (i, c) in [0.44, 0.5, 0.58, 0.66, 0.74, 0.84, 0.94].enumerated() {
    let g = freshGame()
    g.quill.pose(asked)
    g.quill.beginGiving()
    g.quill.poseGiving(center: centre.y > 0 ? centre : CGPoint(x: 630, y: 247))
    g.quill.peak = c
    g.holding = true
    g.poseCharge(c)
    let name = "type-ink/quill/given-as-dust-\(i + 1)-charge-\(String(format: "%.2f", c))@3x.png"
    if let img = bitmap(stageView(g), scale: 3) {
      if let k = crop(img, cut, scale: 3) { writePNG(k, name) }
      if i == 3, let small = bitmap(stageView(g), scale: 2) {
        writePNG(small, "type-ink/quill/given-as-dust-stage@2x.png")
      }
    }
    frames.append([
      "png": name, "charge": c, "held_for_s": r3(c * 3.2),
      "crop_in_stage_pt": [r2(cut.minX), r2(cut.minY), r2(cut.width), r2(cut.height)],
    ])
  }
  writeJSON(
    [
      "about":
        "The question given as dust (Chamber.paintGiven, RootView WrittenLine/InkLine): while the question is held, each letter thins and its gold leaves as one mote of the room's dust, falling from its letter and turning in to the deck, in the order it was written. Stage 1260x828 (the default window under its title bar), near sky drawn still, cropped.",
      "mote":
        "Each mote: a disc of gold r = (0.8 + 1.3 x rand) x (1 + 0.5 c) at alpha a x light, inside a goldLit disc 3.6 r at 22% of that; a = 0.9 x ramp(given, 0.3, 0.7) x (1 - ramp(u, 0.9, 1)); flight u = ((peak - start - 0.02) / 0.28)^1.35; it turns (0.6 + 0.9 rand) u² radians round the deck as it closes in. The charge never pulls a mote back: let go and it fades where it is while its letter inks again.",
      "line_centre_pt": [r2(centre.x), r2(centre.y)],
      "frames": frames,
    ], "type-ink/quill/given-as-dust.json")
}
