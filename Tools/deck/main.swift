import Foundation

// Writes the deck's words as JSON for the reading agents fetch
// (agent/worker.js): each card's name and its two lines, and each
// spread's positions. Only what a reading says, so the link says
// exactly what the app says.

struct Export: Encodable {
  struct Line: Encodable { let id, name, upright, reversed: String }
  struct Positions: Encodable {
    let id, name: String
    let slots: [String]
  }
  let cards: [Line]
  let spreads: [Positions]
}

let export = Export(
  cards: deck.map {
    Export.Line(id: $0.id, name: $0.name, upright: $0.upright, reversed: $0.reversed)
  },
  spreads: Spread.all.map { Export.Positions(id: $0.id, name: $0.name, slots: $0.slots) })

let json = JSONEncoder()
json.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
FileHandle.standardOutput.write(try json.encode(export) + Data("\n".utf8))
