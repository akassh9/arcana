import Foundation

// ===================================================================
//  The deck. One line per card, per orientation. Nothing longer.
//  The twenty-two first, then the four suits of fourteen.
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
  /// The note each position sounds, as MIDI. All from one pentatonic, so
  /// any spread is a consonant chord; a reversed card sounds an octave
  /// under, in a darker voice.
  let notes: [Int]
  var count: Int { slots.count }

  static let all: [Spread] = [
    Spread(
      id: "one", name: "One Card", sub: "the blunt answer", slots: ["The Answer"],
      notes: [67]),
    Spread(
      id: "three", name: "Three Fates", sub: "was · is · tends",
      slots: ["What Was", "What Is", "What Tends"],
      notes: [60, 64, 67]),
    Spread(
      id: "road", name: "The Long Road", sub: "five cards, one weight",
      slots: ["Situation", "Crossing", "Root", "Counsel", "Outcome"],
      notes: [60, 62, 55, 69, 76]),
  ]
}

let deck: [Card] = majors + minors

private let majors: [Card] = [
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

// --- the minor arcana ------------------------------------------------

enum Suit: String, CaseIterable {
  case wands, cups, swords, pentacles
  var name: String { rawValue.capitalized }
}

enum Court: String, CaseIterable {
  case page, knight, queen, king
  var name: String { rawValue.capitalized }
}

private let numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
private let numbers = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"]

/// The words for one card of a suit: its essence, its two lines, its keys.
private struct Words {
  let essence: String
  let upright: String
  let reversed: String
  let keys: [String]
  let keysRev: [String]
}

/// Ace to ten, then page, knight, queen and king.
private let written: [Suit: [Words]] = [
  .cups: [
    Words(
      essence: "The Brimming Cup",
      upright: "Let it fill before you pour.", reversed: "A cup held upside down.",
      keys: ["new feeling", "openness", "overflow"], keysRev: ["blocked", "emptiness", "holding back"]),
    Words(
      essence: "The Answered Cup",
      upright: "It is mutual. Say so.", reversed: "One side always pouring.",
      keys: ["mutuality", "bond", "exchange"], keysRev: ["imbalance", "distance", "misreading"]),
    Words(
      essence: "The Shared Toast",
      upright: "Good news wants company.", reversed: "One round too many.",
      keys: ["friendship", "celebration", "company"],
      keysRev: ["overindulgence", "gossip", "left out"]),
    Words(
      essence: "The Overlooked Cup",
      upright: "Look up. Something is offered.", reversed: "Awake again, and thirsty.",
      keys: ["apathy", "turning inward", "overlooked"], keysRev: ["awakening", "appetite", "saying yes"]),
    Words(
      essence: "The Spilled Three",
      upright: "Three spilled. Two still standing.", reversed: "You turn round. Two were waiting.",
      keys: ["loss", "regret", "grief"], keysRev: ["acceptance", "forgiveness", "moving on"]),
    Words(
      essence: "The Old Garden",
      upright: "The old street is smaller now.", reversed: "Living at an old address.",
      keys: ["memory", "innocence", "kindness"], keysRev: ["nostalgia", "idealising", "stuck"]),
    Words(
      essence: "Cups in the Clouds",
      upright: "Pick one. The rest are weather.", reversed: "Wanting all seven, holding none.",
      keys: ["options", "imagination", "wishful thinking"], keysRev: ["indecision", "fantasy", "mirage"]),
    Words(
      essence: "The Quiet Leaving",
      upright: "Leave while it is still standing.", reversed: "Packed for years. Still here.",
      keys: ["departure", "disillusion", "search"], keysRev: ["staying on", "fear of change", "drift"]),
    Words(
      essence: "The Wish Granted",
      upright: "Granted. Now let it be enough.", reversed: "A full shelf, and still hungry.",
      keys: ["wish granted", "contentment", "pleasure"], keysRev: ["smugness", "surfeit", "hollow win"]),
    Words(
      essence: "The Arc of Cups",
      upright: "Count the people, not the rooms.", reversed: "Happier in the photographs.",
      keys: ["belonging", "harmony", "home"], keysRev: ["strain", "pretence", "estrangement"]),
    Words(
      essence: "The Fish in the Cup",
      upright: "Take the odd feeling seriously.", reversed: "A feeling you laughed off.",
      keys: ["curiosity", "hunch", "message"], keysRev: ["immaturity", "dismissal", "moodiness"]),
    Words(
      essence: "The Slow Gallop",
      upright: "Go to them. Carry it level.", reversed: "Charming, and gone by morning.",
      keys: ["invitation", "romance", "idealism"], keysRev: ["flattery", "vanishing", "letdown"]),
    Words(
      essence: "The Lidded Cup",
      upright: "Feel everything. Spill nothing.", reversed: "Holding every cup but yours.",
      keys: ["compassion", "intuition", "depth"], keysRev: ["overwhelm", "codependence", "self-neglect"]),
    Words(
      essence: "Calm Over Deep Water",
      upright: "The sea is rough. You are not.", reversed: "Composure used as a weapon.",
      keys: ["steadiness", "diplomacy", "generosity"],
      keysRev: ["coldness", "manipulation", "volatility"]),
  ],
  .wands: [
    Words(
      essence: "The Budding Staff",
      upright: "It caught. Feed it.", reversed: "A match struck in the rain.",
      keys: ["spark", "desire", "first move"], keysRev: ["damp", "no spark", "false start"]),
    Words(
      essence: "The World in Hand",
      upright: "The wall is not the edge.", reversed: "Always the map, never the road.",
      keys: ["planning", "vision", "the next step"], keysRev: ["playing safe", "second-guessing", "comfort zone"]),
    Words(
      essence: "Ships on the Horizon",
      upright: "It is on its way. Keep watch.", reversed: "Waiting at the wrong shore.",
      keys: ["foresight", "expansion", "anticipation"], keysRev: ["setbacks", "frustration", "short sight"]),
    Words(
      essence: "The Garland Raised",
      upright: "Hang the garland. You made it.", reversed: "A garland on a shaky gate.",
      keys: ["homecoming", "milestone", "welcome"],
      keysRev: ["instability", "tension at home", "transience"]),
    Words(
      essence: "The Mock Battle",
      upright: "It is a scrimmage, not a war.", reversed: "Peace kept by saying nothing.",
      keys: ["competition", "friction", "sparring"], keysRev: ["truce", "unspoken tension", "sulking"]),
    Words(
      essence: "The Laurel Carried",
      upright: "You won. Let them see it.", reversed: "Applause you keep checking for.",
      keys: ["victory", "recognition", "confidence"], keysRev: ["vanity", "fall from grace", "wanting applause"]),
    Words(
      essence: "The High Ground",
      upright: "Hold your ground. It is yours.", reversed: "Defending a hill no one wants.",
      keys: ["defence", "conviction", "standing firm"],
      keysRev: ["exhaustion", "giving ground", "needless fight"]),
    Words(
      essence: "Staves in Flight",
      upright: "It is moving. Keep up.", reversed: "In flight, and nowhere to land.",
      keys: ["speed", "momentum", "news"], keysRev: ["delay", "scattered", "crossed wires"]),
    Words(
      essence: "The Last Stave",
      upright: "One more. You have done harder.", reversed: "On guard long after the fight.",
      keys: ["resilience", "persistence", "boundaries"], keysRev: ["paranoia", "fatigue", "defensiveness"]),
    Words(
      essence: "The Bundle Carried",
      upright: "Put one down. Any one.", reversed: "Carrying it to prove you can.",
      keys: ["burden", "responsibility", "overload"], keysRev: ["proving", "breaking point", "setting down"]),
    Words(
      essence: "The First Flame",
      upright: "Try it. Report back.", reversed: "Excited, then elsewhere.",
      keys: ["enthusiasm", "exploration", "discovery"], keysRev: ["flightiness", "distraction", "half-begun"]),
    Words(
      essence: "The Charge",
      upright: "Go now. Aim on the way.", reversed: "Speed mistaken for direction.",
      keys: ["passion", "adventure", "boldness"], keysRev: ["recklessness", "haste", "burnout"]),
    Words(
      essence: "The Sunflower Throne",
      upright: "Be seen. It warms the room.", reversed: "Bright, and hard to stand near.",
      keys: ["warmth", "courage", "presence"], keysRev: ["jealousy", "temper", "dimming"]),
    Words(
      essence: "The Flowering Staff",
      upright: "Lead by going first.", reversed: "Leading, and no one behind.",
      keys: ["leadership", "honour", "big picture"], keysRev: ["domineering", "impulsiveness", "empty command"]),
  ],
  .swords: [
    Words(
      essence: "The Crowned Blade",
      upright: "Say the true thing plainly.", reversed: "Sharp, and aimed at nothing.",
      keys: ["clarity", "truth", "breakthrough"], keysRev: ["confusion", "harsh words", "fog"]),
    Words(
      essence: "The Blindfold",
      upright: "Not deciding is deciding.", reversed: "The blindfold slipped. You saw.",
      keys: ["stalemate", "avoidance", "hard choice"], keysRev: ["overload", "revelation", "no more hiding"]),
    Words(
      essence: "The Pierced Heart",
      upright: "It hurts because it mattered.", reversed: "Picking at the stitches.",
      keys: ["heartbreak", "sorrow", "truth that hurts"], keysRev: ["dwelling", "reopening", "slow mending"]),
    Words(
      essence: "The Knight at Rest",
      upright: "Lie down. It will keep.", reversed: "Resting with one eye open.",
      keys: ["rest", "recovery", "stillness"], keysRev: ["restlessness", "overdoing it", "no let-up"]),
    Words(
      essence: "The Emptied Field",
      upright: "Won. Look who is still here.", reversed: "Walking back to say sorry.",
      keys: ["conflict", "winning ugly", "defeat"], keysRev: ["reconciliation", "amends", "lingering grudge"]),
    Words(
      essence: "The Crossing",
      upright: "Row for the calmer water.", reversed: "Rowing back to the storm.",
      keys: ["transition", "passage", "calmer water"], keysRev: ["unfinished business", "turning back", "old waters"]),
    Words(
      essence: "The Quiet Theft",
      upright: "Clever is not the same as clean.", reversed: "Caught, and almost relieved.",
      keys: ["strategy", "stealth", "getting away"], keysRev: ["confession", "conscience", "found out"]),
    Words(
      essence: "The Open Fence",
      upright: "The gap was always there.", reversed: "Untying it, one knot at a time.",
      keys: ["restriction", "self-doubt", "paralysis"], keysRev: ["release", "new sight", "walking out"]),
    Words(
      essence: "The Night Watch",
      upright: "Worse at night. Wait for day.", reversed: "Said out loud, it shrinks.",
      keys: ["anxiety", "sleeplessness", "rumination"], keysRev: ["confiding", "lightening", "morning"]),
    Words(
      essence: "Dawn Behind the Blades",
      upright: "The worst is done. Look east.", reversed: "Standing up, still sore.",
      keys: ["rock bottom", "ending", "last blow"], keysRev: ["survival", "getting up", "lingering pain"]),
    Words(
      essence: "The Watchful Wind",
      upright: "Ask the next question.", reversed: "Asking to catch them out.",
      keys: ["inquiry", "vigilance", "new ideas"], keysRev: ["gossip", "cynicism", "all talk"]),
    Words(
      essence: "Into the Wind",
      upright: "Say it, then stand by it.", reversed: "Right, and running people over.",
      keys: ["urgency", "directness", "ambition"], keysRev: ["tactlessness", "rashness", "aggression"]),
    Words(
      essence: "The Raised Hand",
      upright: "Be kind, and be exact.", reversed: "Precise, and cold with it.",
      keys: ["clarity", "boundaries", "candour"], keysRev: ["bitterness", "severity", "cutting words"]),
    Words(
      essence: "The Upright Blade",
      upright: "Decide by the facts. Say why.", reversed: "Reason used to win, not to see.",
      keys: ["discernment", "authority", "reason"], keysRev: ["cruelty", "sophistry", "abuse of power"]),
  ],
  .pentacles: [
    Words(
      essence: "The Garden Gate",
      upright: "Something real. Plant it.", reversed: "A seed kept in the pocket.",
      keys: ["opportunity", "prosperity", "a seed"], keysRev: ["missed chance", "poor planning", "hoarding"]),
    Words(
      essence: "The Endless Juggle",
      upright: "Keep both moving. Loosely.", reversed: "Juggling to avoid choosing.",
      keys: ["balance", "adaptability", "flow"], keysRev: ["overcommitment", "disorder", "dropped balls"]),
    Words(
      essence: "The Carved Arch",
      upright: "Good work needs three hands.", reversed: "Everyone building their own arch.",
      keys: ["teamwork", "workmanship", "collaboration"], keysRev: ["disharmony", "working alone", "shoddy work"]),
    Words(
      essence: "The Tight Grip",
      upright: "Save it, but let it breathe.", reversed: "Holding on until it spoils.",
      keys: ["security", "saving", "control"], keysRev: ["greed", "possessiveness", "scarcity"]),
    Words(
      essence: "The Lit Window",
      upright: "The light is on. Knock.", reversed: "Coming in from the cold.",
      keys: ["hardship", "exclusion", "need"], keysRev: ["recovery", "shelter", "help accepted"]),
    Words(
      essence: "The Fair Measure",
      upright: "Give freely. Receive as freely.", reversed: "A gift with strings.",
      keys: ["giving", "sharing", "fairness"], keysRev: ["strings attached", "debt", "one-sided giving"]),
    Words(
      essence: "The Patient Vine",
      upright: "Ripening takes the time it takes.", reversed: "Picking the fruit green.",
      keys: ["patience", "investment", "assessment"], keysRev: ["impatience", "wasted effort", "second thoughts"]),
    Words(
      essence: "The Workbench",
      upright: "Again, and a little better.", reversed: "Polishing what no one needs.",
      keys: ["diligence", "practice", "mastery"], keysRev: ["perfectionism", "busywork", "rote"]),
    Words(
      essence: "The Walled Garden",
      upright: "Yours, by your own hand.", reversed: "Earning, but never arriving.",
      keys: ["independence", "abundance", "refinement"], keysRev: ["overwork", "hustle", "hollow luxury"]),
    Words(
      essence: "The Tree of Ten",
      upright: "Build what outlasts you.", reversed: "An inheritance of arguments.",
      keys: ["legacy", "inheritance", "lineage"], keysRev: ["family disputes", "squandering", "broken legacy"]),
    Words(
      essence: "The Coin Studied",
      upright: "Learn it slowly. Properly.", reversed: "Plans that never meet the ground.",
      keys: ["study", "promise", "a first step"], keysRev: ["procrastination", "daydreaming", "no follow-through"]),
    Words(
      essence: "The Still Horse",
      upright: "Slow, steady, and finished.", reversed: "Routine that has become a rut.",
      keys: ["reliability", "routine", "thoroughness"], keysRev: ["stagnation", "boredom", "stubbornness"]),
    Words(
      essence: "The Rose Bower",
      upright: "Feed people. It counts.", reversed: "Tending the house, not the home.",
      keys: ["nurture", "practicality", "comfort"], keysRev: ["smothering", "overextension", "worry"]),
    Words(
      essence: "The Fruitful Seat",
      upright: "Grow it well. Share the harvest.", reversed: "Counting it instead of living.",
      keys: ["stewardship", "providing", "plenty"], keysRev: ["materialism", "inflexibility", "status"]),
  ],
]

private let minors: [Card] = Suit.allCases.flatMap { suit -> [Card] in
  let words = written[suit]!
  let pips = (1...10).map { n in
    let w = words[n - 1]
    return Card(
      id: "\(suit.rawValue)-\(n == 1 ? "ace" : String(n))", art: .pip(suit, n),
      roman: numerals[n - 1], name: "\(numbers[n - 1]) of \(suit.name)", essence: w.essence,
      upright: w.upright, reversed: w.reversed, keys: w.keys, keysRev: w.keysRev)
  }
  let courts = Court.allCases.enumerated().map { k, court in
    let w = words[10 + k]
    return Card(
      id: "\(suit.rawValue)-\(court.rawValue)", art: .court(suit, court),
      roman: "", name: "\(court.name) of \(suit.name)", essence: w.essence,
      upright: w.upright, reversed: w.reversed, keys: w.keys, keysRev: w.keysRev)
  }
  return pips + courts
}
