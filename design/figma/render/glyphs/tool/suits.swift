import AppKit
import SwiftUI
@testable import ArcanaKit

// ===================================================================
//  The suits' emblems, the motifs the numbers are told with, and the
//  courts' rank devices — each from Suits.swift's own helpers.
// ===================================================================

@MainActor func buildSuits() {
  let W = CardArt.artW, CX = W / 2
  typealias S = Suits
  func drawn(_ seedName: String, _ f: (inout Pen) -> Void) -> [Item] {
    var p = Pen(seed: seedHash(seedName))
    f(&p)
    return items(p.marks, .card)
  }
  let inks = "card inks: ink #15110E strokes; gold fills as leaf (Palette.leaf, 4 stops, across each shape's own box from its top-left to its bottom-right corner) under a 0.8 pt ink keyline; oxblood #8C2E25 solid; paper #F3EDE0 occluding fills"

  // --- emblems ------------------------------------------------------------
  let emblems: [(String, String, String, String, (inout Pen) -> Void)] = [
    ("emblem-cup", "Cup", "The cups' emblem: a chalice — bowl, rim, knopped stem, foot. Drawn at s 100 (as the Page of Cups').", "Suits.swift:53-88 cup()", { p in S.cup(&p, S.Spot(x: CX, y: 150, s: 100)) }),
    ("emblem-cup-full", "Cup · full", "The chalice with its water laid in leaf (full: true), as the standing cups of the Five, the Knight's.", "Suits.swift:53-88 cup(full: true)", { p in S.cup(&p, S.Spot(x: CX, y: 150, s: 100), full: true) }),
    ("emblem-cup-lidded", "Cup · lidded", "The Queen of Cups' closed cup: a gilded dome and a leaf finial on the rim (lid: true).", "Suits.swift:53-88 cup(lid: true); used 1122", { p in S.cup(&p, S.Spot(x: CX, y: 150, s: 100), lid: true) }),
    ("emblem-cup-fish", "Cup · with fish", "The Page of Cups' cup, a gold fish rising head-up out of it (the cup's `inside` drawing, exactly as the card's).", "Suits.swift:1035-1041", { p in
      S.cup(&p, S.Spot(x: CX, y: 150, s: 100)) { p in
        p.fillSmooth([[CX, 46], [CX + 10, 70], [CX + 7, 94], [CX, 104], [CX - 7, 94], [CX - 10, 70]], .gold)
        p.line(CX, 102, CX - 9, 114, w: 1.2, amp: 0.3)
        p.line(CX, 102, CX + 9, 114, w: 1.2, amp: 0.3)
        p.dot(CX - 3, 62, 1.6, c: .ink)
      }
    }),
    ("emblem-wand", "Wand · ink bud", "The wands' emblem as the courts carry it: a living staff 2.6 pt, the foot turned, five leaves under the head, an ink bud.", "Suits.swift:102-124 wand(); emblem() 1017-1027", { p in S.emblem(&p, .wands, S.Spot(x: CX, y: 124, s: 116)) }),
    ("emblem-wand-gilt", "Wand · gold bud", "The same staff with its bud in leaf (the Page's, the Knight's).", "Suits.swift:1017-1027 emblem(gilt: true)", { p in S.emblem(&p, .wands, S.Spot(x: CX, y: 124, s: 116), gilt: true) }),
    ("emblem-sword", "Sword", "The plain sword of the numbered cards: blade, crossguard, grip and a ringed pommel, 1.5 pt.", "Suits.swift:127-140 sword(), 199-201 straight()", { p in S.straight(&p, [CX, 214], [CX, 40]) }),
    ("emblem-great-sword", "Great sword", "The great sword of the Ace and the courts: two edges and a fuller, a broad guard with oxblood ends, a heavy grip and pommel.", "Suits.swift:183-196 bigSword(); emblem() 1021-1023", { p in S.emblem(&p, .swords, S.Spot(x: CX, y: 136, s: 118)) }),
    ("emblem-great-sword-gilt", "Great sword · gilt guard", "The same with a leaf lozenge on the guard (gilt: the Page's, the Queen's).", "Suits.swift:1021-1023 emblem(gilt: true)", { p in S.emblem(&p, .swords, S.Spot(x: CX, y: 136, s: 118), gilt: true) }),
    ("emblem-pentacle", "Pentacle", "The pentacles' emblem: a rimmed disc with the five-pointed star drawn in it (r 36, the courts' size).", "Suits.swift:217-233 pentacle()", { p in S.emblem(&p, .pentacles, S.Spot(x: CX, y: 124, s: 100)) }),
    ("emblem-pentacle-gilt", "Pentacle · gilt", "The pentacle with its disc laid in leaf under the star.", "Suits.swift:217-233 pentacle(gilt: true)", { p in S.emblem(&p, .pentacles, S.Spot(x: CX, y: 124, s: 100), gilt: true) }),
  ]
  var cells: [Glyph] = []
  for (name, title, desc, src, f) in emblems {
    let (g, o) = cropped(name, drawn(name, f), pad: 4)
    cells.append(g)
    emit(
      g, "suits",
      Meta(
        title: "Emblem · " + title, description: desc, group: "Suit emblems", source: "Sources/Arcana/" + src,
        states: inks, hint: "component",
        caveats: "Seed seedHash(\"\(name)\"); on a card each emblem takes the card's seed, so its wobble differs. Cropped from the 186×248 art space: the frame's top-left is art (\(num(o.x)), \(num(o.y)))."))
  }
  let es = sheet("suit-emblems-sheet", cells, cols: 6, cell: CGSize(width: 110, height: 230), gap: 8, ground: P.paper)
  emit(
    es, "suits",
    Meta(
      title: "Suit emblems", description: "The four emblems and their states, left to right: " + cells.map(\.name).joined(separator: ", ") + ".",
      group: "Suit emblems", source: "Sources/Arcana/Suits.swift:36-233, 1017-1027", states: inks,
      hint: "sheet frame (ground hideable)", caveats: "No labels (no SVG text); the order above names the cells."),
    preview: true)

  // --- motifs ---------------------------------------------------------------
  let motifs: [(String, String, String, (inout Pen) -> Void)] = [
    ("spill", "A cup knocked over on its side, three oxblood drops falling from its rim (cup() turned 90° + spill()), as in the Five of Cups.", "Suits.swift:91-99; used 288-296", { p in
      let o = S.Spot(x: CX - 46, y: 190, s: 48, a: -.pi / 2 - 0.08)
      S.cup(&p, o)
      S.spill(&p, o)
    }),
    ("leaf", "A small almond leaf, from its base toward its tip (width 2.4).", "Suits.swift:143-149", { p in S.leaf(&p, [60, 130], [84, 112]) }),
    ("sprig", "A curved stem with five leaves on alternate sides, hung on bow() between two staves, as the Four of Wands' garland.", "Suits.swift:152-166 sprig(), 204-214 bow(); used 567", { p in
      S.sprig(&p, S.bow([40, 64], [70, 94], [100, 64], steps: 6), leaves: 5, size: 6)
    }),
    ("flower", "Five petals round an open heart (r 7), as round the Queen of Pentacles' ring.", "Suits.swift:169-180; used 1140", { p in S.flower(&p, CX, 112, 7) }),
    ("flower-gilt", "A given flower: its heart laid in leaf (r 8), as the Four of Wands'.", "Suits.swift:169-180 (gilt); used 569", { p in S.flower(&p, CX, 104, 8, gilt: true) }),
    ("sunflower", "A sunflower: twelve petals round a heart of leaf (r 15), the Queen of Wands'.", "Suits.swift:429-435; used 1129", { p in S.sunflower(&p, CX - 26, 96, 15) }),
    ("grapes", "A bunch of ten grapes (s 2.8), hanging at the King of Pentacles' seat.", "Suits.swift:438-441; used 1166", { p in S.grapes(&p, CX + 44, 74, 2.8) }),
    ("butterfly", "A butterfly at rest, wings open (s 7), at the King of Swords' seat.", "Suits.swift:444-450; used 1159", { p in S.butterfly(&p, CX - 58, 56, 7) }),
    ("bird", "A bird in flight seen far off: two bowed strokes (s 7).", "Suits.swift:402-405; used 1053", { p in S.bird(&p, 40, 40, 7) }),
    ("ship", "A small ship under sail (s 8).", "Suits.swift:408-414; used 544", { p in S.ship(&p, 132, 122, 8) }),
    ("ship-gilt", "The ship coming in: its sail in leaf (s 6.5).", "Suits.swift:408-414 (gilt); used 545", { p in S.ship(&p, 160, 124, 6.5, gilt: true) }),
    ("wreath", "A laurel wreath open at the top (r 13), ten leaves.", "Suits.swift:417-426; used 587", { p in S.wreath(&p, 108, 66, 13) }),
    ("pyramid", "A pyramid on the horizon, its shaded face hatched (s 22), the Page of Wands'.", "Suits.swift:453-460; used 1044", { p in S.pyramid(&p, 36, 210, 22) }),
    ("wind", "A wavy stroke of wind.", "Suits.swift:463-470; used 1050", { p in S.wind(&p, 18, 62, 58) }),
    ("rain", "Short slanting strokes of rain across a band, three rows (the Three of Swords').", "Suits.swift:473-482; used 681", { p in S.rain(&p, 20, W - 20, 64, 3) }),
    ("heart", "A heart in leaf (84 wide), the Three of Swords' — heart() gives the points, fillSmooth lays them.", "Suits.swift:485-492; used 682", { p in p.fillSmooth(S.heart(CX, 130, 84), .gold) }),
    ("ground", "The ground: a line across the art and a band of hatching under it (depth 22).", "Suits.swift:495-498", { p in S.ground(&p, 210, depth: 22) }),
    ("cloud", "A bank of cloud (r 72): round scallops above, a softer edge below, filled with the stock so what stands in it rises out of it.", "Suits.swift:374-396; used 1134", { p in S.cloud(&p, CX, 196, 72) }),
    ("ripples", "Water: Pen.ripples, three wavy lines 9 pt apart (the Queen of Cups').", "Ink.swift:281-292; used Suits.swift:1123", { p in p.ripples(W, 196, count: 3, gap: 9) }),
    ("crescent", "A crescent moon in leaf (r 12, bite 8), the Two of Swords'.", "Ink.swift:296-315; used Suits.swift:667", { p in p.crescent(152, 34, 12, bite: 8) }),
  ]
  var mcells: [Glyph] = []
  for (name, desc, src, f) in motifs {
    let (g, o) = cropped("motif-" + name, drawn("motif-" + name, f), pad: 4)
    mcells.append(g)
    emit(
      g, "suits/motifs",
      Meta(
        title: "Motif · " + name, description: desc, group: "Motifs", source: "Sources/Arcana/" + src, states: inks,
        hint: "component",
        caveats: "Drawn once at the size and place of the call site named in source, on its own pen (seed seedHash(\"motif-\(name)\")), then cropped: the frame's top-left is art (\(num(o.x)), \(num(o.y)))."))
  }
  let ms = sheet("motifs-sheet", mcells, cols: 5, cell: CGSize(width: 180, height: 110), gap: 8, ground: P.paper)
  emit(
    ms, "suits",
    Meta(
      title: "Motif library", description: "Every small thing the numbered cards are told with, each helper called once: " + mcells.map { String($0.name.dropFirst(6)) }.joined(separator: ", ") + ". (bow() is the curve under the sprig; heart() gives the points the heart is laid through.)",
      group: "Motifs", source: "Sources/Arcana/Suits.swift:91-498; Ink.swift:281-315", states: inks,
      hint: "sheet frame (ground hideable)", caveats: "Cells are 180×110; the rain, ground and cloud are full art-width and scale to fit only in the sense that they are centred and may touch the cell edge."),
    preview: true)

  // --- court rank devices ------------------------------------------------------
  // taken from the court cards' own marks: page, queen and king lay their
  // device first, the knight's road comes last
  let devices: [(String, String, ArtKind, Range<Int>?, Int?, String)] = [
    ("court-device-page", "Page · the diamond", .court(.cups, .page), 0..<1, nil, "On the ground: a small oxblood lozenge at the top of the art (4 × 5.5), over the thing the page was given."),
    ("court-device-knight-road", "Knight · the road", .court(.cups, .knight), nil, 3, "Carried along the road: three bowed lines across the foot, thinning (1.5, 1.25, 1.0 pt)."),
    ("court-device-knight-furrows", "Knight of Pentacles · the furrows", .court(.pentacles, .knight), nil, 4, "The knight who does not hurry: four straight furrows instead of the road (1.5 → 0.9 pt)."),
    ("court-device-queen", "Queen · the ring", .court(.cups, .queen), 0..<3, nil, "Held in the ring: a hand-wobbled ring (r 66, 1.4 pt) round the emblem, with an oxblood lozenge either side."),
    ("court-device-king", "King · the seat and crown", .court(.cups, .king), 0..<3, nil, "On the squared seat, crowned: a double square (1.8 and 1.0 pt) with a three-pointed crown of leaf on top."),
  ]
  var dcells: [Glyph] = []
  for (name, title, kind, head, tail, desc) in devices {
    let all = CardArt.marks(kind)
    let part = head.map { Array(all[$0]) } ?? Array(all.suffix(tail!))
    let g = Glyph(name: name, size: CGSize(width: CardArt.artW, height: CardArt.artH), items: items(part, .card))
    dcells.append(g)
    emit(
      g, "suits/court",
      Meta(
        title: "Court device · " + title, description: desc + " In the 186×248 art frame, where it sits on the card.",
        group: "Court devices", source: "Sources/Arcana/Suits.swift:1029-1170 (court())", states: inks,
        hint: "component; same size as the card's art panel, which sits at (20, 52) in the 226×400 card",
        caveats: "Cut from the real \(kind.name) card's marks (seed seedHash(\"\(kind.name)\") ^ 0x9E3779B9), so it is stroke for stroke that card's device; the other suits' are the same shapes with their own wobble."))
  }
  // the whole Queen of Cups, drawn by MarksCanvas and from the items, to check the leaf
  do {
    let marks = CardArt.marks(.court(.cups, .queen))
    let g = Glyph(name: "check-queen-of-cups", size: CGSize(width: CardArt.artW, height: CardArt.artH), items: items(marks, .card))
    check("queen-of-cups-art", MarksCanvas(marks: marks, space: g.size), against: g)
  }
  let ds = sheet("court-devices-sheet", dcells, cols: 5, cell: CGSize(width: CardArt.artW, height: CardArt.artH), gap: 12, ground: P.paper)
  emit(
    ds, "suits",
    Meta(
      title: "Court rank devices", description: "How a court card says its rank, each in its art frame: page, knight (road), knight of pentacles (furrows), queen, king.",
      group: "Court devices", source: "Sources/Arcana/Suits.swift:1029-1170", states: inks,
      hint: "sheet frame (ground hideable)", caveats: ""),
    preview: true)
}
