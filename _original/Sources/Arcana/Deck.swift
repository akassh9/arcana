import Foundation

// ===================================================================
//  The deck. One line per card, per orientation. Nothing longer.
// ===================================================================

struct Card: Identifiable, Hashable {
  let id: String
  let art: ArtKind
  let roman: String
  let name: String
  let essence: String   // the red italic line on the face
  let upright: String   // what it says, said once
  let reversed: String
  let keys: [String]
  let keysRev: [String]
}

struct Draw: Hashable {
  let card: Card
  let reversed: Bool
  var line: String { reversed ? card.reversed : card.upright }
  var keys: [String] { reversed ? card.keysRev : card.keys }
}

struct Spread: Identifiable, Hashable {
  let id: String
  let name: String
  let sub: String
  let slots: [String]
  var count: Int { slots.count }

  static let all: [Spread] = [
    Spread(id: "one", name: "One Card", sub: "the blunt answer", slots: ["The Answer"]),
    Spread(
      id: "three", name: "Three Fates", sub: "was · is · tends",
      slots: ["What Was", "What Is", "What Tends"]),
    Spread(
      id: "road", name: "The Long Road", sub: "five cards, one weight",
      slots: ["Situation", "Crossing", "Root", "Counsel", "Outcome"]),
  ]
}

let deck: [Card] = [
  Card(
    id: "fool", art: .fool, roman: "O", name: "The Fool", essence: "Leap Without Ledger",
    upright: "Begin before you are ready.", reversed: "All ledge, no leap.",
    keys: ["beginning", "faith", "open road"], keysRev: ["freefall", "hesitation", "no plan"]),
  Card(
    id: "magician", art: .magician, roman: "I", name: "The Magician",
    essence: "As Above, So Below",
    upright: "You already hold every tool.", reversed: "Skill spent on seeming.",
    keys: ["will", "craft", "focus"], keysRev: ["bluff", "scatter", "performance"]),
  Card(
    id: "priestess", art: .priestess, roman: "II", name: "The High Priestess",
    essence: "The Sealed Door",
    upright: "You know. You cannot say it yet.", reversed: "You talked over yourself.",
    keys: ["intuition", "patience", "the unsaid"], keysRev: ["noise", "self-deceit", "override"]),
  Card(
    id: "empress", art: .empress, roman: "III", name: "The Empress",
    essence: "Abundant Ground",
    upright: "Tend it and it grows.", reversed: "Dug up to check the roots.",
    keys: ["growth", "care", "season"], keysRev: ["neglect", "smother", "depletion"]),
  Card(
    id: "emperor", art: .emperor, roman: "IV", name: "The Emperor", essence: "The Iron Seat",
    upright: "Decide once. Hold the line.", reversed: "The rule outlived its reason.",
    keys: ["structure", "limit", "command"], keysRev: ["rigidity", "control", "brittle"]),
  Card(
    id: "hierophant", art: .hierophant, roman: "V", name: "The Hierophant",
    essence: "The Old Order",
    upright: "Learn the form before breaking it.", reversed: "A rite no one can explain.",
    keys: ["tradition", "mentor", "proven"], keysRev: ["dogma", "hollow", "dissent"]),
  Card(
    id: "lovers", art: .lovers, roman: "VI", name: "The Lovers", essence: "Two Made One",
    upright: "Choose what you can stand inside.", reversed: "A split you keep managing.",
    keys: ["union", "choice", "alignment"], keysRev: ["division", "drift", "deferral"]),
  Card(
    id: "chariot", art: .chariot, roman: "VII", name: "The Chariot", essence: "Reins and Road",
    upright: "Point the horses. Hold the road.", reversed: "Motion in four directions.",
    keys: ["drive", "heading", "momentum"], keysRev: ["stall", "scatter", "force"]),
  Card(
    id: "strength", art: .strength, roman: "VIII", name: "Strength", essence: "The Gentle Hand",
    upright: "Do not raise your voice.", reversed: "Force standing in for patience.",
    keys: ["composure", "nerve", "quiet"], keysRev: ["escalation", "doubt", "fray"]),
  Card(
    id: "hermit", art: .hermit, roman: "IX", name: "The Hermit", essence: "One Lamp, One Path",
    upright: "Subtract everyone. Keep the lamp.", reversed: "Solitude turned hiding place.",
    keys: ["solitude", "search", "counsel"], keysRev: ["isolation", "avoidance", "drift"]),
  Card(
    id: "wheel", art: .wheel, roman: "X", name: "Wheel of Fortune", essence: "The Turning Rim",
    upright: "The turn has started. Join it.", reversed: "The same loop, unedited.",
    keys: ["change", "cycle", "timing"], keysRev: ["resistance", "repeat", "off-beat"]),
  Card(
    id: "justice", art: .justice, roman: "XI", name: "Justice", essence: "The Level Scale",
    upright: "Drop the story. Read the ledger.", reversed: "A scale quietly thumbed.",
    keys: ["truth", "consequence", "measure"], keysRev: ["bias", "evasion", "debt"]),
  Card(
    id: "hanged", art: .hanged, roman: "XII", name: "The Hanged Man",
    essence: "Inverted Sight",
    upright: "Hang there. It turns over.", reversed: "Delay dressed as depth.",
    keys: ["suspension", "reframe", "pause"], keysRev: ["stalling", "martyrdom", "waste"]),
  Card(
    id: "death", art: .death, roman: "XIII", name: "Death", essence: "The Clean Break",
    upright: "It is over. Take the clearance.", reversed: "An ending paid in instalments.",
    keys: ["ending", "transit", "clearance"], keysRev: ["clinging", "dread", "half-cut"]),
  Card(
    id: "temperance", art: .temperance, roman: "XIV", name: "Temperance",
    essence: "The Measured Pour",
    upright: "The answer is a proportion.", reversed: "Corrections loud as noise.",
    keys: ["balance", "blend", "dose"], keysRev: ["excess", "lurch", "impatience"]),
  Card(
    id: "devil", art: .devil, roman: "XV", name: "The Devil", essence: "The Willing Chain",
    upright: "Name what the chain pays you.", reversed: "The grip loosens once seen.",
    keys: ["attachment", "appetite", "bargain"], keysRev: ["release", "clarity", "refusal"]),
  Card(
    id: "tower", art: .tower, roman: "XVI", name: "The Tower", essence: "The Sudden Bolt",
    upright: "Built wrong. Corrected fast.", reversed: "A known crack, lived around.",
    keys: ["rupture", "reveal", "collapse"], keysRev: ["postponed", "near miss", "dread"]),
  Card(
    id: "star", art: .star, roman: "XVII", name: "The Star", essence: "Water Under Starlight",
    upright: "Less than you can, every day.", reversed: "Waiting to feel hopeful first.",
    keys: ["hope", "repair", "clear sky"], keysRev: ["discouragement", "stall", "closed sky"]),
  Card(
    id: "moon", art: .moon, roman: "XVIII", name: "The Moon", essence: "The Long Tide",
    upright: "Too dim to read. Go slowly.", reversed: "The fog thins. It was ordinary.",
    keys: ["uncertainty", "dream", "half-light"], keysRev: ["clearing", "exposure", "relief"]),
  Card(
    id: "sun", art: .sun, roman: "XIX", name: "The Sun", essence: "Unshaded Noon",
    upright: "It works. You may enjoy it.", reversed: "Brightness you are performing.",
    keys: ["clarity", "vitality", "plain good"], keysRev: ["glare", "forced", "overexposed"]),
  Card(
    id: "judgement", art: .judgement, roman: "XX", name: "Judgement",
    essence: "The Sounding Call",
    upright: "Only you can pronounce it.", reversed: "Reproach instead of a verdict.",
    keys: ["reckoning", "summons", "account"], keysRev: ["self-reproach", "deaf ear", "delay"]),
  Card(
    id: "world", art: .world, roman: "XXI", name: "The World", essence: "The Closed Circle",
    upright: "Finished. Mark it before the next.", reversed: "The last tenth, left open.",
    keys: ["completion", "return", "whole"], keysRev: ["loose end", "false finish", "drag"]),
]
