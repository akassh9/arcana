import AppKit
import SwiftUI

// The type scale: every style the app sets, rendered as the app composes it
// (font, tracking, colour, glow, the leading pad on tracked titles), each on
// pearl with a real string from the app, plus the numbers as JSON.

struct TypeSpec {
  let id: String
  let style: String
  let family: String
  let postscript: String
  let codeSize: Double
  let drawnSize: Double
  let tracking: Double
  let colorName: String
  let color: Color
  var glow: (Color, Double, Double)? = nil  // colour, opacity, radius
  var leadingPad: Double = 0
  var lineSpacing: Double = 0
  var column: Double? = nil
  var align: String = "center"
  let textCase: String
  let sample: String
  let source: String
  let usage: String
  var states: String = ""
  let view: AnyView
  /// The font alone, to measure the line box and baseline.
  let font: Font
}

@MainActor func typeSpecs() -> [TypeSpec] {
  let star = deck.first { $0.id == "star" }!
  let starUp = Draw(card: star, reversed: false)
  let lovers = Draw(card: deck.first { $0.id == "lovers" }!, reversed: false)
  let cups6 = Draw(card: deck.first { $0.id == "cups-6" }!, reversed: false)
  let swords6 = Draw(card: deck.first { $0.id == "swords-6" }!, reversed: false)
  let priestess = deck.first { $0.id == "priestess" }!
  let three = Spread.all[1]
  let moonName = Moon.tonight.name
  let T = Palette.text
  var out: [TypeSpec] = []

  func caps(
    _ id: String, _ style: String, _ s: String, size: Double, drawn: Double, tracking: Double,
    colorName: String, color: Color, bold: Bool = false, pad: Double = 0, source: String,
    usage: String, states: String = ""
  ) {
    out.append(
      TypeSpec(
        id: id, style: style, family: "Didot", postscript: bold ? "Didot-Bold" : "Didot",
        codeSize: size, drawnSize: drawn, tracking: tracking, colorName: colorName, color: color,
        leadingPad: pad, textCase: "uppercase (Caps uppercases the string)", sample: s.uppercased(),
        source: source, usage: usage, states: states,
        view: AnyView(
          Caps(text: s, size: CGFloat(size), tracking: CGFloat(tracking), color: color, bold: bold)
            .padding(.leading, CGFloat(pad))),
        font: bold ? .display(CGFloat(size)) : .roman(CGFloat(size))))
  }

  // --- display --------------------------------------------------------------
  out.append(
    TypeSpec(
      id: "display-title", style: "display/title", family: "Didot", postscript: "Didot-Bold",
      codeSize: 62, drawnSize: 62, tracking: 20, colorName: "text", color: T,
      glow: (Palette.goldLit, 0.55, 22), leadingPad: 10, textCase: "as authored", sample: "ARCANA",
      source: "Sources/Arcana/RootView.swift:1029-1057",
      usage: "The wordmark at the top of the opening room; a light passes across it now and then (see title-light).",
      view: AnyView(Title(reduceMotion: false, resting: true)), font: .display(62)))
  out.append(
    TypeSpec(
      id: "display-altar-name", style: "display/altar-name", family: "Didot",
      postscript: "Didot-Bold", codeSize: 32, drawnSize: 32, tracking: 4, colorName: "text",
      color: T, glow: (Palette.goldLit, 0.45, 16), column: 360, align: "leading",
      textCase: "uppercase", sample: priestess.name.uppercased(),
      source: "Sources/Arcana/RootView.swift:1466-1471",
      usage: "The card's name on the altar, in a column at most 360 wide; long names wrap.",
      view: AnyView(
        Text(priestess.name.uppercased()).font(.display(32)).tracking(4).foregroundStyle(T)
          .shadow(color: Palette.goldLit.opacity(0.45), radius: 16)
          .fixedSize(horizontal: false, vertical: true)
          .frame(maxWidth: 360, alignment: .leading)), font: .display(32)))
  out.append(
    TypeSpec(
      id: "display-page-title", style: "display/page-title", family: "Didot",
      postscript: "Didot-Bold", codeSize: 21, drawnSize: 21, tracking: 8, colorName: "text",
      color: T, glow: (Palette.goldLit, 0.45, 14), leadingPad: 8, textCase: "as authored",
      sample: "THE KEYS", source: "Sources/Arcana/Legend.swift:109-114",
      usage: "The keys page title (⌘/ or ?), under a 46x1 goldInk@55% rule 18 above.",
      view: AnyView(
        Text("THE KEYS").font(.display(21)).tracking(8).foregroundStyle(T)
          .shadow(color: Palette.goldLit.opacity(0.45), radius: 14).padding(.leading, 8)),
      font: .display(21)))

  // --- the card's own type (printed on paper #F3EDE0 in the app) -------------
  out.append(
    TypeSpec(
      id: "card-name", style: "card/name", family: "Didot", postscript: "Didot-Bold",
      codeSize: 17, drawnSize: 17, tracking: 1.4, colorName: "ink", color: Palette.ink,
      column: 182, textCase: "uppercase", sample: star.name.uppercased(),
      source: "Sources/Arcana/CardImages.swift:80-88",
      usage: "The printed name on every card face, centred in a 182 pt column at (113, 345) of the 226x400 card; up to 2 lines, shrinks to 70%.",
      view: AnyView(
        Text(star.name.uppercased()).font(.display(17)).tracking(1.4)
          .foregroundStyle(Palette.ink).lineLimit(2).minimumScaleFactor(0.7)
          .multilineTextAlignment(.center).frame(width: 182)), font: .display(17)))
  out.append(
    TypeSpec(
      id: "card-numeral", style: "card/numeral", family: "Didot", postscript: "Didot-Bold",
      codeSize: 15, drawnSize: 15, tracking: 3.2, colorName: "ink", color: Palette.ink,
      textCase: "roman capitals", sample: star.roman, source: "Sources/Arcana/CardImages.swift:73-77",
      usage: "The numeral at the head of every card face, centred at (114, 33); O, I-XXI for the Majors, I-X for pips, none on courts.",
      view: AnyView(Text(star.roman).font(.display(15)).tracking(3.2).foregroundStyle(Palette.ink)),
      font: .display(15)))
  out.append(
    TypeSpec(
      id: "card-essence", style: "card/essence", family: "Didot", postscript: "Didot-Italic",
      codeSize: 12.5, drawnSize: 13, tracking: 0, colorName: "blood (oxblood)",
      color: Palette.blood, column: 182, textCase: "title case as authored", sample: star.essence,
      source: "Sources/Arcana/CardImages.swift:89-94",
      usage: "The essence under the card's name, 4 pt below it; one line, shrinks to 70%.",
      view: AnyView(
        Text(star.essence).font(.italic(12.5)).foregroundStyle(Palette.blood).lineLimit(1)
          .minimumScaleFactor(0.7).frame(width: 182)), font: .italic(12.5)))

  // --- reading ------------------------------------------------------------------
  func verse(_ id: String, _ style: String, _ size: Double, drawn: Double, _ line: String, usage: String)
  {
    out.append(
      TypeSpec(
        id: id, style: style, family: "Didot", postscript: "Didot", codeSize: size,
        drawnSize: drawn, tracking: 0, colorName: "text", color: T.opacity(0.92),
        textCase: "sentence", sample: line, source: "Sources/Arcana/RootView.swift:1196-1244",
        usage: usage,
        states: "lit text@92%; while another line is read text@30%; the line being read glows goldLit@90% r12",
        view: AnyView(
          Text(line).font(.roman(CGFloat(size))).foregroundStyle(T.opacity(0.92)).lineLimit(1)
            .minimumScaleFactor(0.7).frame(height: CGFloat(size) * 1.34)),
        font: .roman(CGFloat(size))))
  }
  verse(
    "verse-one", "verse/one", 27, drawn: 27, lovers.line,
    usage: "One-card reading: the card's line spoken under it. Line box = size x 1.34 (36.2). Shrinks to fit the stage (never under 13).")
  verse(
    "verse-three", "verse/three", 22, drawn: 22, cups6.line,
    usage: "Three-card reading: one line per card, gap 12, line box 29.5.")
  verse(
    "verse-five", "verse/five", 18.5, drawn: 19, swords6.line,
    usage: "Five-card reading (18.5 in code draws 19): gap 8; the box is 18.5 x 1.34 = 24.8 (the box uses the code size). 16 at 940x660, 13 at 940x628.")
  out.append(
    TypeSpec(
      id: "altar-line", style: "altar/line", family: "Didot", postscript: "Didot", codeSize: 25,
      drawnSize: 25, tracking: 0, colorName: "text", color: T.opacity(0.92), column: 360,
      align: "leading", textCase: "sentence", sample: starUp.line,
      source: "Sources/Arcana/RootView.swift:1494-1497",
      usage: "The card's line on the altar, wrapping in the 360 pt column, under a 54x1 text@20% rule.",
      view: AnyView(
        Text(starUp.line).font(.roman(25)).foregroundStyle(T.opacity(0.92))
          .fixedSize(horizontal: false, vertical: true).frame(maxWidth: 360, alignment: .leading)),
      font: .roman(25)))
  out.append(
    TypeSpec(
      id: "thread-body", style: "thread/body", family: "Didot", postscript: "Didot", codeSize: 19,
      drawnSize: 19, tracking: 0, colorName: "text", color: T.opacity(0.92), lineSpacing: 5,
      column: 660, textCase: "sentence", sample: woven.thread,
      source: "Sources/Arcana/RootView.swift:1337-1342",
      usage: "The thread's two sentences, set where the verse was, centred in min(660, 62% of the stage); line spacing +5.",
      view: AnyView(
        Text(woven.thread).font(.roman(19)).foregroundStyle(T.opacity(0.92)).lineSpacing(5)
          .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
          .frame(width: 660)), font: .roman(19)))
  out.append(
    TypeSpec(
      id: "settings-label", style: "settings/label", family: "Didot", postscript: "Didot",
      codeSize: 15, drawnSize: 15, tracking: 0, colorName: "text", color: T,
      align: "leading", textCase: "as authored", sample: "OpenAI key",
      source: "Sources/Arcana/Settings.swift:27-29", usage: "The one label in the Settings window, left of the key field.",
      view: AnyView(Text("OpenAI key").font(.roman(15)).foregroundStyle(T)), font: .roman(15)))

  // --- the voice (italic) --------------------------------------------------------
  out.append(
    TypeSpec(
      id: "voice-question", style: "voice/question", family: "Didot", postscript: "Didot-Italic",
      codeSize: 19, drawnSize: 19, tracking: 0, colorName: "text", color: T.opacity(0.62),
      textCase: "sentence", sample: "Hold the question in your mind.",
      source: "Sources/Arcana/RootView.swift:766-768, 942-952",
      usage: "The invitation under ARCANA. The written question that replaces it is the same italic 19 set by the pen (exact NSFont 19, common ligatures off, one line at most 560 wide) - see quill/.",
      states: "rest text@62%; while the question is held text@(62 + 36 x charge)% with a goldLit@(90 x charge)% r14 glow",
      view: AnyView(Text("Hold the question in your mind.").font(.italic(19)).foregroundStyle(T.opacity(0.62))),
      font: .italic(19)))
  out.append(
    TypeSpec(
      id: "altar-essence", style: "altar/essence", family: "Didot", postscript: "Didot-Italic",
      codeSize: 20, drawnSize: 20, tracking: 0, colorName: "goldInk", color: Palette.goldInk,
      align: "leading", textCase: "title case as authored", sample: star.essence,
      source: "Sources/Arcana/RootView.swift:1486-1488", usage: "The essence on the altar, under the name and numeral.",
      view: AnyView(Text(star.essence).font(.italic(20)).foregroundStyle(Palette.goldInk)),
      font: .italic(20)))
  out.append(
    TypeSpec(
      id: "thread-question", style: "thread/question", family: "Didot", postscript: "Didot-Italic",
      codeSize: 18, drawnSize: 18, tracking: 0, colorName: "goldInk", color: Palette.goldInk,
      glow: (Palette.goldLit, 0.6, 12), lineSpacing: 3, column: 660, textCase: "sentence",
      sample: woven.question, source: "Sources/Arcana/RootView.swift:1353-1359",
      usage: "The question the thread leaves you with, 18 under a 5x5 goldInk diamond; line spacing +3, centred.",
      view: AnyView(
        Text(woven.question).font(.italic(18)).foregroundStyle(Palette.goldInk)
          .shadow(color: Palette.goldLit.opacity(0.6), radius: 12).lineSpacing(3)
          .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
          .frame(width: 660)), font: .italic(18)))
  out.append(
    TypeSpec(
      id: "keys-description", style: "keys/description", family: "Didot",
      postscript: "Didot-Italic", codeSize: 17, drawnSize: 17, tracking: 0, colorName: "text",
      color: T.opacity(0.82), column: 150, align: "leading", textCase: "lowercase as authored",
      sample: "past readings", source: "Sources/Arcana/Legend.swift:135-137",
      usage: "What each key does, on the keys page: left-aligned in a 150 column, 22 right of the keys.",
      view: AnyView(
        Text("past readings").font(.italic(17)).foregroundStyle(T.opacity(0.82))
          .frame(width: 150, alignment: .leading)), font: .italic(17)))
  out.append(
    TypeSpec(
      id: "voice-epigraph", style: "voice/epigraph", family: "Didot", postscript: "Didot-Italic",
      codeSize: 16, drawnSize: 16, tracking: 0, colorName: "text", color: T.opacity(0.62),
      textCase: "sentence", sample: asked, source: "Sources/Arcana/RootView.swift:1003-1016",
      usage: "The question read back above the spread; a 30x1 goldInk@45% rule sits 21 above the line's centre (drawn here too).",
      states: "40% of itself while a card is on the altar",
      view: AnyView(EpigraphLine(text: asked)), font: .italic(16)))
  out.append(
    TypeSpec(
      id: "voice-returned", style: "voice/returned", family: "Didot", postscript: "Didot-Italic",
      codeSize: 13.5, drawnSize: 14, tracking: 0, colorName: "text", color: T.opacity(0.55),
      column: 300, textCase: "sentence", sample: asked, source: "Sources/Arcana/Keeping.swift:1063-1069",
      usage: "A question the moon brings back one lunation later, under 'ONE MOON AGO' (8 above), centred under the moon; up to 3 lines in min(300, ...).",
      view: AnyView(
        Text(asked).font(.italic(13.5)).foregroundStyle(T.opacity(0.55))
          .multilineTextAlignment(.center).lineLimit(3).frame(width: 300)
          .fixedSize(horizontal: false, vertical: true)), font: .italic(13.5)))
  out.append(
    TypeSpec(
      id: "italic-small", style: "italic/small", family: "Didot", postscript: "Didot-Italic",
      codeSize: 13, drawnSize: 13, tracking: 0, colorName: "goldInk", color: Palette.goldInk,
      textCase: "lowercase as authored", sample: "try again",
      source: "Sources/Arcana/RootView.swift:1324-1327; Sources/Arcana/Settings.swift:34-38",
      usage: "'try again' after the thread stays quiet; the Settings lines under the key field.",
      states: "goldInk ('try again', 'The thread is ready.'); text@55% ('For find the thread.', 'Asking OpenAI…', 'Kept in your Keychain.'); blood ('This key won't open the thread.', 'This key is out of credit.')",
      view: AnyView(Text("try again").font(.italic(13)).foregroundStyle(Palette.goldInk)),
      font: .italic(13)))
  out.append(
    TypeSpec(
      id: "spread-sub", style: "spread/sub", family: "Didot", postscript: "Didot-Italic",
      codeSize: 11.5, drawnSize: 12, tracking: 0, colorName: "goldInk", color: Palette.goldInk,
      column: 150, textCase: "lowercase as authored", sample: three.sub,
      source: "Sources/Arcana/RootView.swift:1114-1119",
      usage: "The gloss under each spread's name on the opening room, in a 150x15 box.",
      states: "chosen goldInk; not chosen text@40%",
      view: AnyView(
        Text(three.sub).font(.italic(11.5)).foregroundStyle(Palette.goldInk).lineLimit(1)
          .minimumScaleFactor(0.85).frame(width: 150, height: 15)), font: .italic(11.5)))

  // --- Caps: every label --------------------------------------------------------------
  caps(
    "caps-spread", "caps/spread", Spread.all[0].name, size: 11, drawn: 11, tracking: 3,
    colorName: "text", color: T.opacity(0.48), source: "Sources/Arcana/RootView.swift:1107-1112",
    usage: "A spread's name on the opening room, not chosen (150x15, shrinks to 82%).",
    states: "not chosen: Didot Regular, text@48%; chosen: Didot Bold, text 100% (caps-spread-chosen)")
  caps(
    "caps-spread-chosen", "caps/spread (chosen)", three.name, size: 11, drawn: 11, tracking: 3,
    colorName: "text", color: T, bold: true, source: "Sources/Arcana/RootView.swift:1107-1112",
    usage: "The chosen spread's name: the same caps in Didot Bold at full ink, between gold brackets.")
  caps(
    "caps-altar-label", "caps/altar-label", three.slots[1], size: 10, drawn: 10, tracking: 4.2,
    colorName: "goldInk", color: Palette.goldInk, source: "Sources/Arcana/RootView.swift:1462",
    usage: "The position's name at the head of the altar's column.")
  caps(
    "caps-prompt", "caps/prompt", "draw three", size: 10, drawn: 10, tracking: 4,
    colorName: "text", color: T.opacity(0.52), source: "Sources/Arcana/RootView.swift:1161-1172",
    usage: "The draw's one instruction, 13 under the 6x6 pips.")
  out.append(
    TypeSpec(
      id: "caps-altar-numeral", style: "caps/altar-numeral", family: "Didot", postscript: "Didot",
      codeSize: 10, drawnSize: 10, tracking: 3, colorName: "text / blood",
      color: T.opacity(0.42), textCase: "uppercase", sample: "XVII  · REVERSED",
      source: "Sources/Arcana/RootView.swift:1473-1482",
      usage: "The numeral under the altar name (text@42%) and, if the card came reversed, '· REVERSED' in oxblood 10 to its right ('REVERSED' alone on a court).",
      view: AnyView(
        HStack(spacing: 10) {
          Caps(text: star.roman, size: 10, tracking: 3, color: T.opacity(0.42))
          Caps(text: "· reversed", size: 10, tracking: 3, color: Palette.blood)
        }), font: .roman(10)))
  caps(
    "caps-thread-action", "caps/thread-action", "find the thread", size: 9.5, drawn: 10,
    tracking: 3.8, colorName: "goldInk", color: Palette.goldInk,
    source: "Sources/Arcana/RootView.swift:1294-1305",
    usage: "The one action after a reading (with a key in Settings), 11 right of the thread glyph, in a 200x30 button.")
  caps(
    "caps-thread-status", "caps/thread-status", "letting the cards settle", size: 9.5, drawn: 10,
    tracking: 3.2, colorName: "text", color: T.opacity(0.52),
    source: "Sources/Arcana/RootView.swift:1307-1322",
    usage: "While the thread is being found; and 'THE THREAD STAYED QUIET' if it isn't.")
  out.append(
    TypeSpec(
      id: "caps-altar-keys", style: "caps/altar-keys", family: "Didot", postscript: "Didot",
      codeSize: 9.5, drawnSize: 10, tracking: 2.6, colorName: "text", color: T.opacity(0.5),
      textCase: "uppercase", sample: starUp.keys.joined(separator: " ◆ ").uppercased(),
      source: "Sources/Arcana/RootView.swift:1500-1512",
      usage: "The card's keywords at the foot of the altar column, spaced 10 either side of 4x4 goldInk@55% diamonds.",
      view: AnyView(
        HStack(spacing: 10) {
          ForEach(Array(starUp.keys.enumerated()), id: \.offset) { pair in
            if pair.offset > 0 {
              Rectangle().fill(Palette.goldInk.opacity(0.55)).frame(width: 4, height: 4)
                .rotationEffect(.degrees(45))
            }
            Caps(text: pair.element, size: 9.5, tracking: 2.6, color: T.opacity(0.5))
          }
        }), font: .roman(9.5)))
  caps(
    "caps-foot-press", "caps/foot-press", "press and hold", size: 9, drawn: 9, tracking: 4.2,
    colorName: "goldInk", color: Palette.goldInk.opacity(0.75),
    source: "Sources/Arcana/RootView.swift:445-452",
    usage: "Under the deck on the opening room; it fades as the charge rises (opacity 75% x (1 - charge)).")
  caps(
    "caps-foot-hold", "caps/foot-hold", "hold · return the cards", size: 8.5, drawn: 9, tracking: 4,
    colorName: "goldInk", color: Palette.goldInk.opacity(0.6),
    source: "Sources/Arcana/RootView.swift:1178-1182; Sources/Arcana/Keeping.swift:897",
    usage: "At the foot of the stage (32 above the bottom) once a reading has rung; 'HOLD · RETURN THE CARD' for one card, 'HOLD · REMEMBER' on a kept page.")
  caps(
    "caps-slot", "caps/slot", three.slots[0], size: 9, drawn: 9, tracking: 3.2, colorName: "goldInk",
    color: Palette.goldInk.opacity(0.8), source: "Sources/Arcana/RootView.swift:674-680",
    usage: "The position's name under each slot, hanging 20 under the thread.",
    states: "empty slot text@32%; card face up goldInk@80%; card being read (hovered) goldInk 100%; eased 0.45 s")
  caps(
    "caps-keys-word", "caps/keys-word", "type", size: 9, drawn: 9, tracking: 2.6, colorName: "text",
    color: T.opacity(0.66), pad: 2.6, source: "Sources/Arcana/Legend.swift:124-127",
    usage: "The keys page's one word in place of a key ('TYPE' - your question).")
  caps(
    "caps-keycap", "caps/keycap", "space", size: 9, drawn: 9, tracking: 1.6, colorName: "text",
    color: T.opacity(0.74), pad: 1.6, source: "Sources/Arcana/Legend.swift:169-195",
    usage: "A named key inside its pen-drawn cap on the keys page ('SPACE', 'ESC'); the cap's outline is text@40% at 0.85 pt, min 22x22, 7 of padding either side.")
  caps(
    "caps-moon", "caps/moon", moonName, size: 8, drawn: 8, tracking: 3.6, colorName: "text",
    color: T.opacity(0.4), source: "Sources/Arcana/RootView.swift:736-741; Sources/Arcana/Keeping.swift:1036",
    usage: "Tonight's moon phase, centred 36 under the moon's centre (20 under its rim).",
    states: "moon phase text@40%; a kept reading's date text@55% ('SEPTEMBER 18' / 'SEPTEMBER 18, 2025')")
  caps(
    "caps-whisper", "caps/whisper", "one moon ago", size: 7, drawn: 7, tracking: 3.2,
    colorName: "text", color: T.opacity(0.36), source: "Sources/Arcana/Keeping.swift:1062",
    usage: "The smallest type in the app: over a question the moon brings back.")

  out.append(
    TypeSpec(
      id: "system-field", style: "system/field", family: "SF Pro (system)", postscript: ".AppleSystemUIFont",
      codeSize: 13, drawnSize: 13, tracking: 0, colorName: "placeholderTextColor (system)",
      color: Color(nsColor: .placeholderTextColor), align: "leading", textCase: "as typed",
      sample: "sk-…", source: "Sources/Arcana/Settings.swift:30-32",
      usage: "The Settings key field's placeholder; the field is a system SecureField with a rounded border, 250 wide. The only non-Didot type in the app's own views. Rendered here as its type only (the control's chrome is AppKit's).",
      view: AnyView(Text("sk-…").font(.system(size: 13)).foregroundStyle(Color(nsColor: .placeholderTextColor))),
      font: .system(size: 13)))
  return out
}

/// The line box SwiftUI gives one line of `font`, and where its baseline and
/// cap tops fall in it, measured from an H set at 8x.
@MainActor func lineMetrics(_ font: Font) -> (height: Double, baseline: Double, capTop: Double) {
  let s: CGFloat = 8
  let v = Text("H").font(font).foregroundStyle(.black).background(Color.white)
  let size = idealSize(Text("H").font(font))
  guard let img = bitmap(v, scale: s), let b = inkBounds(img, scale: s, bg: (255, 255, 255), tol: 100)
  else { return (Double(size.height), 0, 0) }
  return (Double(size.height), r2(b.maxY), r2(b.minY))
}

@MainActor func renderType() {
  let pad: CGFloat = 40
  var rows: [[String: Any]] = []
  let specs = typeSpecs()
  for (i, s) in specs.enumerated() {
    let file = "type-ink/type/\(String(format: "%02d", i + 1))-\(s.id)@2x.png"
    let frame = idealSize(s.view)
    // whole points, so no half-covered pixel rings the ground
    let img = save(
      file,
      s.view.padding(pad)
        .frame(
          width: frame.width.rounded(.up) + 2 * pad, height: frame.height.rounded(.up) + 2 * pad,
          alignment: .topLeading
        )
        .background(Palette.pearl), scale: 2)
    let ink = img.flatMap { inkBounds($0, scale: 2, bg: (249, 247, 242), tol: 6) }
    let m = lineMetrics(s.font)
    var row: [String: Any] = [
      "order": i + 1, "id": s.id, "style": s.style, "family": s.family, "postscript": s.postscript,
      "size_in_code": s.codeSize, "size_drawn": s.drawnSize,
      "tracking_pt": s.tracking, "tracking_px_at_1x": s.tracking,
      "tracking_percent": r2(CGFloat(s.tracking / s.drawnSize * 100)),
      "line_box_pt": m.height, "baseline_from_line_top_pt": m.baseline,
      "cap_top_from_line_top_pt": m.capTop,
      "line_spacing_extra_pt": s.lineSpacing,
      "line_pitch_pt": s.lineSpacing > 0 ? m.height + s.lineSpacing : m.height,
      "color_token": s.colorName, "color_hex": hex(s.color), "opacity": r3(alphaOf(s.color)),
      "case": s.textCase, "sample": s.sample, "align": s.align,
      "leading_pad_pt": s.leadingPad, "source": s.source, "usage": s.usage,
      "png": file, "png_scale": 2,
      "text_frame_in_png_pt": [
        "x": Double(pad), "y": Double(pad), "w": r2(frame.width), "h": r2(frame.height),
      ],
    ]
    if let c = s.column { row["column_pt"] = c }
    if !s.states.isEmpty { row["states"] = s.states }
    if let g = s.glow {
      row["glow"] = [
        "color_token": g.0 == Palette.goldLit ? "goldLit" : "?", "color_hex": hex(g.0),
        "opacity": g.1, "radius_pt": g.2,
        "figma": "Drop shadow, x 0 y 0, blur \(Int(g.2 * 2)) (SwiftUI radius x 2 is the closest Figma blur), spread 0, \(hex(g.0)) at \(Int(g.1 * 100))%",
      ]
    }
    if let ink { row["drawn_bounds_in_png_pt_incl_glow"] = ["x": r2(ink.minX), "y": r2(ink.minY), "w": r2(ink.width), "h": r2(ink.height)] }
    if let img { row["png_px"] = [img.width, img.height] }
    rows.append(row)
  }
  writeJSON(
    [
      "about":
        "Every type style Arcana sets, as rendered by SwiftUI in the app's own code (ImageRenderer @2x, 8-bit sRGB on pearl #F9F7F2). Each PNG has the style's text frame at (40, 40) pt; glows spill into the margin. Sizes: Font.custom rounds to whole points (halves up), so size_drawn is what to set in Figma. Tracking: SwiftUI adds it after every glyph, the last included; centred titles shift right by leading_pad_pt to compensate. Line box: the height SwiftUI gives one line (Figma line-height in px); the baseline sits baseline_from_line_top_pt below the box's top. Opacities are applied to the colour (fill opacity in Figma), not to the layer.",
      "ground": "#F9F7F2",
      "styles": rows,
    ], "type-ink/type/type-scale.json")
}
