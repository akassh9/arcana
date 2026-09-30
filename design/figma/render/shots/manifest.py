#!/usr/bin/env python3
"""Writes design/figma/assets/shots/manifest.json from the rendered files."""
import json
import pathlib
import struct

HERE = pathlib.Path(__file__).resolve().parent
ASSETS = HERE.parents[1] / "assets"


def png_size(p):
    with open(p, "rb") as f:
        head = f.read(24)
    return list(struct.unpack(">II", head[16:24]))


# --- what every posed reading shows (deck order seeded: SplitMix64 seed 9) ---
THREE = "Three Fates: The Emperor (What Was), Nine of Pentacles (What Is), The Hermit reversed (What Tends)"
THREE_VERSE = "'Decide once. Hold the line. / Yours, by your own hand. / Solitude turned hiding place.'"
ONE = "One Card: Strength (The Answer)"
ONE_VERSE = "'Do not raise your voice.'"
FIVE = ("The Long Road: Page of Cups (Situation), Six of Cups reversed (Crossing), Six of Swords (Root), "
        "Four of Wands (Counsel), Ten of Cups (Outcome)")
FIVE_VERSE = ("'Take the odd feeling seriously. / Living at an old address. / Row for the calmer water. / "
              "Hang the garland. You made it. / Count the people, not the rooms.'")
ASKED = "'Should I leave the city before winter'"
LONGEST = "'Should I leave the city before winter, or wait for the light to come back' (the most the 560 pt line lays, cut back to a word)"
WOVEN = ("thread 'What was rooted is being lifted into the light. The hand that steadies it is already yours.' / "
         "question 'What would you tend if no one were watching the roots?'")
SHELF = ("kept shelf (invented, relative to the render day 2026-09-30): page 0 The Hermit, 40 days ago (AUGUST 21), "
         "'Is it time to call her'; page 1 The Sun, The High Priestess, Death reversed, 12 days ago (SEPTEMBER 18), "
         "asked + woven thread; page 2 The Fool, The Tower reversed, The Empress, The Star, The World, 3 days ago "
         "(SEPTEMBER 27), no question")

T = "Tools/shot/main.swift"
X = "design/figma/render/shots/mkmain.py (EXTRA)"
R = "Sources/Arcana/RootView.swift"

STAGE = ("Stage render (ImageRenderer): no title bar and no safe area, so the stage is the whole frame. "
         "In the live window the stage sits 32 pt lower and is 32 pt shorter (see shots-window/). "
         "The Metal near sky (dust, ring, ripples) is drawn as its still (stillSky). "
         "The ARCANA title light is held off the word (only 86-title-light shows it). "
         "The moon's phase is the render night's (2026-09-30: WANING GIBBOUS).")
STAGE_HINT = "screen frame (image fill); lay out beside its siblings in the group"

# name: (group, title, description, source, states, extra caveat)
P = {}
def pose(name, group, title, desc, source, states="", caveat=""):
    P[name] = (group, title, desc, source, states, caveat)

G1, G2, G3, G4, G5 = "01 Room at rest", "02 Writing the question", "03 Holding", "04 The draw", "05 The reading"
G6, G7, G8, G9 = "06 The question read back", "07 Find the thread", "08 The altar", "09 The return"
G10, G11, G12, G13, G14 = "10 As Above", "11 What the Moon Keeps", "12 The keys", "13 Window sizes", "14 Sheets"

pose("1-invocation", G1, "Room at rest (Three Fates chosen)",
     "The first screen. Old-key glyph top left, bowl glyph top right, the day moon with 'WANING GIBBOUS' under it, a short gold rule, ARCANA, 'Hold the question in your mind.', the three spreads with THREE FATES bracketed and gold, the squared deck of 78 in its double ring, and PRESS AND HOLD at the foot. It appears on launch and whenever the cards come home.",
     f"{T}:85; {R}:694 (Invocation)", "rest; Three Fates chosen (the default)")
pose("64-chooser-one", G1, "Spread chooser: One Card chosen",
     "The room at rest with ONE CARD bracketed and gold (one diamond, 'the blunt answer'); the other two spreads in grey. Chosen with the left arrow, 1, or a click.",
     f"{X} '64-chooser-one'; {R}:694 (Invocation)", "chooser: One Card")
pose("65-chooser-long-road", G1, "Spread chooser: The Long Road chosen",
     "The room at rest with THE LONG ROAD bracketed and gold (five diamonds, 'five cards, one weight').",
     f"{X} '65-chooser-long-road'; {R}:694 (Invocation)", "chooser: The Long Road")
pose("66-muted", G1, "Sound off: the bowl without its rings",
     "The room at rest with sound muted (m, or a click on the bowl): the bowl glyph top right loses its two sound arcs. Nothing else changes.",
     f"{X} '66-muted'; {R}:1587 (MuteToggle), {R}:1612 (BowlGlyph)", "bowl: off (compare 1-invocation: on)")
pose("86-title-light", G1, "The light crossing ARCANA",
     "The room at rest caught as the slow light passes across the title: a gold band masked by the letters, mid-word. It crosses for about 2.2 s of every 12 s (1.3 s into the period here, k 0.41).",
     f"{X} '86-title-light'; {R}:1029-1057 (Title)", "title light mid-sweep",
     "Timing per _critic.json: visible about 2.2 s of every 12 s, bright centre crossing in about 1.6 s.")
pose("12-invocation-small", G1, "Room at rest, 940 x 660 stage",
     "The room at rest at the minimum window's width. As a stage render it is 660 pt tall, which the live window never gives the stage (its stage is 940 x 628: see 76-min-stage and shots-window/12-invocation-small).",
     f"{T}:268", "rest, small")
pose("76-min-stage", G1, "Room at rest, true minimum stage 940 x 628",
     "The room at rest at the smallest stage the app can have: a 940 x 660 window under its 32 pt title bar. Cards, fan and verse have shrunk toward their floors.",
     f"{X} '76-min-stage'; Sources/Arcana/Game.swift:846-924 (Layout)", "rest, minimum")
pose("52-moon-hover", G1, "The moon under the pointer",
     "The room at rest with the pointer over the moon, which is the door to past readings: a soft pale glow gathers round it. The phase label stays.",
     f"{T}:324; Sources/Arcana/Keeping.swift:979 (MoonDoor), :1028 (KeptMoonLabel)", "moon: hover", "Shelf posed as the three kept readings. " + SHELF)
pose("51-moon-took", G1, "The moon taking a reading",
     "The room just after a reading was returned: the moon's glow, brighter and closer than the hover glow, 1.7 s after it took the reading.",
     f"{T}:320; Sources/Arcana/Keeping.swift (poseGlow)", "moon glow at 1.7 s")
pose("50-brought-back", G1, "One moon ago",
     "The room at rest on the day a reading kept a lunar month ago (29.6 days) comes round again: under the moon, ONE MOON AGO and that reading's question, " + ASKED + ".",
     f"{T}:317; Sources/Arcana/Keeping.swift:1028 (KeptMoonLabel)", "moon label: one moon ago + question")
pose("55-brought-back-small", G1, "One moon ago, small stage, longest question",
     "As 50-brought-back at 940 x 660 with the longest question wrapping to two lines under the moon.",
     f"{T}:333", "small; long question")

pose("19-writing", G2, "Writing the question (wet ink)",
     "The question " + ASKED + " written into the invitation's place under ARCANA; the last four letters are still lit gold and cooling toward ink.",
     f"{T}:145; {R}:756 (QuestionLine), :846 (InkLine)", "writing, wet")
pose("20-written", G2, "The question written (dry)",
     "The same question at rest in ink, before it is held.", f"{T}:146", "written, dry")
pose("26-long", G2, "The longest question",
     "The line at its capacity: " + LONGEST + ".", f"{T}:155", "line full")
pose("26-long-small", G2, "The longest question, 940 x 660",
     "The full line in a small stage.", f"{T}:180", "line full, small")
pose("74-spent", G2, "Line full: the pen's spent touch",
     "A key pressed when the line is full lays nothing: a 2.4 pt gold dot touches the baseline just past the last letter, at its brightest (45 %), and fades over 0.7 s. Shown on the longest line.",
     f"{X} '74-spent'; {R}:896-910 (spent dot)", "spent dot at peak (0.45)")
pose("75-ime-composition", G2, "An input method composing",
     "Typing through an input method (here Japanese): the committed text in ink, the composition not yet committed in gold at 75 %.",
     f"{X} '75-ime-composition'; {R}:888-892 (marked text)", "IME marked text",
     "The Japanese glyphs fall back from Didot to the system's Japanese font, as they would in the app; the app's copy is English-only.")

pose("2-holding", G3, "Holding (no question)",
     "The question held with space, return or a press on the deck, at 0.62 of the 3.2 s breath: the room quiets, the ring's gold arc runs round the deck, dust gathers.",
     f"{T}:86; {R}:438 (HoldRing)", "charge 0.62")
pose("21-giving", G3, "Holding a written question",
     "A written question being given at charge 0.70: its letters thin in order and fall as gold motes into the deck.",
     f"{T}:147", "charge 0.70, giving")

pose("3-draw", G4, "The draw: the ribbon of 78",
     "After the cut: all 78 cards dealt face down in a shallow arc, three empty bracketed places with outline diamonds and grey names (WHAT WAS, WHAT IS, WHAT TENDS), and DRAW THREE with three pips.",
     f"{T}:90; {R}:295 (CardSprite), :654 (SlotMarks)", "draw, nothing taken")
pose("56-ribbon-hand", G4, "The draw: a card taken, the hand on the ribbon",
     "Five of Cups taken into What Was; the pointer's card (index 44) lifted from the ribbon with its gold glow; pips 1 of 3.",
     f"{T}:343", "draw, one taken, hover 44")
pose("4-mid", G4, "The draw: one card in place",
     "The Emperor laid in What Was, the first thread node lit, pips one of three.", f"{T}:94", "draw, one taken")
pose("60-ribbon-small", G4, "The draw, 940 x 660, hovered card",
     "The ribbon in a small stage with card 30 lifted under the pointer.", f"{T}:369", "draw, small, hover")
pose("77-min-stage-draw", G4, "The draw, minimum stage 940 x 628",
     "The ribbon, empty places and prompt at the smallest stage.", f"{X} '77-min-stage-draw'", "draw, minimum")

pose("5-reading", G5, "The reading: Three Fates, spoken",
     THREE + ", on a gold thread with a diamond under each, gold position names, the three verse lines " + THREE_VERSE + " and FIND THE THREAD. Posed the moment the verse is spoken, before its chord, so there is no closing prompt yet.",
     f"{T}:102; {R}:506 (Thread), :1209 (Stanza), :1248 (ThreadPanel)", "reading, spoken, before the chord")
pose("6-reading-hover", G5, "The reading: a card under the pointer",
     "The same reading with the pointer on the middle card: it lifts with a halo, its node grows, its verse line stays lit while the others dim.",
     f"{T}:103; {R}:467 (Halos)", "hover slot 1")
pose("67-closing-prompt", G5, "The reading after its chord: closing prompt",
     "The same reading once its chord has rung: 'HOLD · RETURN THE CARDS' appears faintly at the foot of the stage.",
     f"{X} '67-closing-prompt'; {R}:1139 (Prompt)", "reading, sounded")
pose("9-one", G5, "The reading: One Card",
     ONE + ", larger, with THE ANSWER and one 27 pt verse line " + ONE_VERSE + ", FIND THE THREAD.", f"{T}:113", "one card, before the chord")
pose("68-closing-prompt-one", G5, "One Card after its chord",
     "As 9-one with the singular closing prompt 'HOLD · RETURN THE CARD'.", f"{X} '68-closing-prompt-one'; {R}:1139 (Prompt)", "one card, sounded")
pose("8-five", G5, "The reading: The Long Road",
     FIVE + "; five tighter verse lines " + FIVE_VERSE + "; FIND THE THREAD.", f"{T}:112", "five cards, before the chord")
pose("69-closing-prompt-five", G5, "The Long Road after its chord", "As 8-five with 'HOLD · RETURN THE CARDS'.",
     f"{X} '69-closing-prompt-five'", "five cards, sounded")
pose("11-five-small", G5, "The Long Road, 940 x 660", "Five cards in a small stage.", f"{T}:193", "five, small")
pose("78-min-stage-reading", G5, "Three Fates, minimum stage 940 x 628", "The spoken reading with its closing prompt at the smallest stage.",
     f"{X} '78-min-stage-reading'", "three, minimum, sounded")
pose("79-min-stage-five", G5, "The Long Road, minimum stage 940 x 628", "Five cards, verse and prompts at the smallest stage.",
     f"{X} '79-min-stage-five'", "five, minimum, sounded")
pose("57-minors", G5, "A reading of suit cards",
     "Five of Cups, Queen of Cups and The Star, the sky's stars out (the Star is answered); the closing prompt shown.", f"{T}:355", "minors + Star, answered")
pose("73-reading-no-key", G5, "The reading without an OpenAI key",
     "The spoken reading as a downloaded app with no key shows it: no FIND THE THREAD at all, only the verse and the closing prompt.",
     f"{X} '73-reading-no-key'; {R}:1278 (threadable)", "no key")

pose("22-epigraph", G6, "The question read back over Three Fates",
     "The written question " + ASKED + " comes back small and italic under a short gold rule above the spread.", f"{T}:156; {R}:973 (Epigraph)", "epigraph")
pose("23-epigraph-one", G6, "The question over One Card", "The epigraph above the single card.", f"{T}:160", "epigraph, one")
pose("28-five-asked", G6, "The question over The Long Road", "The epigraph above five cards.", f"{T}:189", "epigraph, five")
pose("25-epigraph-small", G6, "Longest question over One Card, 940 x 660", "The longest question as an epigraph in a small stage.", f"{T}:172", "epigraph, long, small")
pose("00-readme", G6, "The README picture",
     "Six of Cups, The Star, Six of Swords under " + ASKED + "; the Star answered (glints out as stars); verse; FIND THE THREAD; posed before the chord, so no closing prompt. The repo's docs/arcana.png is this pose at @1x.",
     f"{T}:257", "epigraph + Star answered")

pose("70-settling", G7, "Finding the thread: 'letting the cards settle'",
     "After FIND THE THREAD is pressed: the invitation becomes 'LETTING THE CARDS SETTLE' in grey with a small diamond, a bead of light swings along the thread (pinned at 0.62 of its swing), and the closing prompt steps away until the thread is found.",
     f"{X} '70-settling'; {R}:1308-1315 (settling), :594-596 (bead)", "weaving")
pose("71-thread-quiet-retry", G7, "The thread stayed quiet, with 'try again'",
     "The request failed but the key is still good: 'THE THREAD STAYED QUIET' in grey and an italic gold 'try again'.",
     f"{X} '71-thread-quiet-retry'; {R}:1317-1330 (quietFailure)", "weave error, key usable")
pose("72-thread-quiet", G7, "The thread stayed quiet (key refused or out of credit)",
     "The same failure when OpenAI refused the key or it ran out of credit: no 'try again'.",
     f"{X} '72-thread-quiet'; {R}:1323", "weave error, not threadable")
pose("10-woven", G7, "The folio: the thread found",
     "The verse replaced by the found thread: two sentences in ink, a small gold diamond, and a gold italic question (" + WOVEN + ").",
     f"{T}:114; {R}:1333 (finished)", "woven")
pose("24-epigraph-woven", G7, "The folio under the question", "The folio with the written question above the spread.", f"{T}:164", "woven + epigraph")

pose("7-inspect", G8, "The altar: a card opened", "Nine of Pentacles opened full size on a pearl veil: the tilted card with its halo on the left, the text column on the right (WHAT IS, NINE OF PENTACLES, IX, 'The Walled Garden' in italic, its line 'Yours, by your own hand.', its three keys).",
     f"{T}:107; {R}:1387 (Inspector)", "altar open")
pose("58-altar-court", G8, "The altar: a court card reversed", "Queen of Wands reversed: no numeral, a REVERSED label, the reversed line.", f"{T}:359", "altar, court, reversed")
pose("43-altar-asked", G8, "The altar under a question", "The Star on the altar with the question dimmed to 40 % above.", f"{T}:262", "altar + epigraph")
pose("40-altar-moon", G8, "The altar over the Moon's answer", "The Moon on the altar while the sky's lilac moonlight lies over the room.", f"{T}:245", "altar, As Above")

pose("15-returning", G9, "Returning the cards (0.45 of the hold)", "The return held: the room goes quiet, names and verse gone, the ink of the last-drawn card sinking first.",
     f"{T}:121; Sources/Arcana/Game.swift:308 (settleReturn)", "letting 0.45")
pose("16-blank", G9, "Returned: blank stock (0.90)", "Each card pressed back to blank stock keeping only its gold.", f"{T}:122", "letting 0.90")
pose("17-returning-five", G9, "Returning five (0.55)", "The Long Road mid-return, the right-hand cards already blank.", f"{T}:123", "letting 0.55, five")
pose("18-carried", G9, "Returned, the folio's question carried", "Blank cards with the found thread's gold question left on the table.", f"{T}:124", "letting 0.90 + woven")
pose("19-one-blank", G9, "Returned: One Card", "Strength pressed blank.", f"{T}:131", "letting 0.90, one")
pose("27-blank-asked", G9, "Returned under the question", "Blank cards with the written question still above.", f"{T}:176", "letting 0.90 + epigraph")
pose("30-carried-asked", G9, "Returned: question and folio's question", "Both questions stay: the written one above, the folio's below.", f"{T}:181", "letting 0.90 + epigraph + woven")
pose("59-returning-minors", G9, "Returned suit cards keep their gold", "Three of Swords, Ten of Swords, Five of Cups given back: the heart, the dawn, the two standing cups in gold.", f"{T}:365", "letting 0.90, minors")

pose("35a-moon-before", G10, "The Moon drawn, before the sky answers", "The Lovers, The Moon, Justice, spoken, the sky not yet answering.", f"{T}:233", "before answer")
pose("35-moon", G10, "The sky answers the Moon", "The same reading after the answer: a lilac half-light from the moon over the room, a pale halo keeping its face readable.", f"{T}:231", "Moon upright, answered")
pose("36-moon-reversed", G10, "The Moon reversed", "The lilac clears off the sky to a plain pale blue.", f"{T}:234", "Moon reversed")
pose("31-wheel", G10, "The sky answers the Wheel", "The Tower, Wheel of Fortune, The Hermit: the engraved sky wheel has turned one house (30 degrees); closing prompt shown.", f"{T}:222", "Wheel upright")
pose("32-wheel-reversed", G10, "The Wheel reversed, 7 s in", "The wheel turning a house and coming back, caught 7 s into its 14 s.", f"{T}:223", "Wheel reversed, 7 s")
pose("33-star", G10, "The sky answers the Star", "The Empress, The Star, The Chariot: the sky's glints held lit as stars.", f"{T}:226", "Star upright")
pose("34-star-reversed", G10, "The Star reversed, 16 s in", "One star at a time comes out and goes in again: the third, at its height.", f"{T}:228", "Star reversed, 16.1 s")
pose("37-sun", G10, "The sky answers the Sun", "The Magician, The Sun, The World: first light rises into morning, the rays reach further.", f"{T}:237", "Sun upright")
pose("38-sun-reversed", G10, "The Sun reversed", "The light comes up white and the colour drains out.", f"{T}:238", "Sun reversed")
pose("39-heavens", G10, "All four at once", "The Long Road with The Star, The Moon, Wheel of Fortune, The Sun and The Fool: every answer composed.", f"{T}:241", "four answers")
pose("41-returning-star", G10, "The Star's answer leaving with its ink", "The Star reading given back at 0.55: the stars go as the ink sinks.", f"{T}:250", "answer + return")
pose("42-one-moon", G10, "One Card: The Moon", "The Moon alone, answered; singular prompt 'HOLD · RETURN THE CARD'.", f"{T}:254", "one, Moon")

pose("44-kept", G11, "What the Moon Keeps: a kept reading", "The moon's door open on a kept Three Fates (Sun, High Priestess, Death reversed) shown as blank stock with its gold, the question above, the folio's question below, page chevrons, the moon's date label SEPTEMBER 18 and 'HOLD · REMEMBER'. " + SHELF,
     f"{T}:293; Sources/Arcana/Keeping.swift", "door open, page 1")
pose("45-kept-rising", G11, "Remembering: ink rising (0.45)", "The kept cards' ink rising back while the hold is held.", f"{T}:297", "rising 0.45")
pose("46-kept-remembered", G11, "Remembered", "The kept reading fully inked, its three lines recited.", f"{T}:301", "rising 1, lines 3")
pose("47-kept-threaded", G11, "Remembered with its folio", "The remembered reading with the thread that was found for it.", f"{T}:305", "remembered + thread")
pose("48-kept-five", G11, "A kept Long Road (blank)", "Page 2: The Fool, The Tower reversed, The Empress, The Star, The World as blank stock, SEPTEMBER 27.", f"{T}:309", "page 2")
pose("49-kept-one", G11, "A kept One Card, remembered", "Page 0: The Hermit, 'Is it time to call her', AUGUST 21.", f"{T}:313", "page 0, remembered")
pose("53-kept-small", G11, "A kept Long Road remembered, 940 x 660", "Page 2 remembered in a small stage.", f"{T}:336", "page 2, small")
pose("54-kept-altar", G11, "A kept card on the altar", "Death reversed from the kept reading, opened on the altar.", f"{T}:328", "kept altar")

pose("62-keys", G12, "The keys", "The keys page over the room: THE KEYS and seven lines (choose, your question, hold, past readings, forget a reading, back, settings), the key glyph lit.", f"{T}:377; Sources/Arcana/Legend.swift", "keys open")
pose("63-keys-small", G12, "The keys, minimum stage 940 x 628", "The keys page at the smallest stage.", f"{T}:378", "keys, minimum")

pose("80-large-1728", G13, "Large window 1728 x 1117: at rest", "The room at rest on a MacBook Pro 16 screen's worth of points. The sky, wheel and ring scale with the window; the type and chooser don't, so the room is sparser.", f"{X} '80-large-1728'", "rest, large",
     "Stage = whole frame (full screen hides the title bar). On a notched display full screen may reserve the camera housing; not modelled.")
pose("81-large-1728-reading", G13, "Large window 1728 x 1117: Three Fates", "The spoken reading with its closing prompt; cards stop growing at 262 pt.", f"{X} '81-large-1728-reading'", "reading, large")
pose("82-large-1728-draw", G13, "Large window 1728 x 1117: the draw", "The ribbon spans 0.74 of the width; the cards stay 178 pt.", f"{X} '82-large-1728-draw'", "draw, large")
pose("83-large-2560", G13, "Large window 2560 x 1440: at rest (@1.5x)", "The room at rest on a 2560 x 1440 display.", f"{X} '83-large-2560'", "rest, large")
pose("84-large-2560-reading", G13, "Large window 2560 x 1440: Three Fates (@1.5x)", "The spoken reading, small in a large sky.", f"{X} '84-large-2560-reading'", "reading, large")
pose("85-large-2560-altar", G13, "Large window 2560 x 1440: the altar (@1.5x)", "Nine of Pentacles on the altar; the altar card caps at 480 pt.", f"{X} '85-large-2560-altar'", "altar, large")

SHEETS = {
    "61-suits": (1.5, "Every suit card", "All 56 suit cards upright, a suit to a row (Wands, Cups, Swords, Pentacles), 113 x 200 pt each on pearl.", f"{T}:382", "reference image (the cards family has the vector faces)"),
    "13-ink": (2, "A card writing itself", "The Star writing itself left to right at 8, 20, 34, 50, 68, 86 and 100 % ink, 150 x 265 pt each.", f"{T}:401; Sources/Arcana/Ink.swift (InkFace)", "strip of 7 frames"),
    "13b-sink": (2, "A card given back", "Wheel of Fortune and The Sun reversed sinking into the stock at 0, 25, 50, 75, 100 % of the return.", f"{T}:414", "2 strips of 5 frames"),
    "13c-quill": (3, "The pen's ink, close up", "A word as it is laid (each letter younger), a pasted word cooling as one (0 to 0.9 s), and a dry line without ligatures.", f"{T}:434; {R}:846 (InkLine)", "reference image"),
    "14-back": (2, "Card back and a face", "The blind-embossed back and The Moon's face, 226 x 400 pt each.", f"{T}:453; Sources/Arcana/CardImages.swift", "reference image"),
}

ORDER = [
    "1-invocation", "64-chooser-one", "65-chooser-long-road", "66-muted", "86-title-light", "12-invocation-small", "76-min-stage",
    "52-moon-hover", "51-moon-took", "50-brought-back", "55-brought-back-small",
    "19-writing", "20-written", "26-long", "26-long-small", "74-spent", "75-ime-composition", "13c-quill",
    "2-holding", "21-giving",
    "3-draw", "56-ribbon-hand", "4-mid", "60-ribbon-small", "77-min-stage-draw", "13-ink",
    "5-reading", "6-reading-hover", "67-closing-prompt", "9-one", "68-closing-prompt-one", "8-five", "69-closing-prompt-five",
    "11-five-small", "78-min-stage-reading", "79-min-stage-five", "57-minors", "73-reading-no-key",
    "22-epigraph", "23-epigraph-one", "28-five-asked", "25-epigraph-small", "00-readme",
    "70-settling", "71-thread-quiet-retry", "72-thread-quiet", "10-woven", "24-epigraph-woven",
    "7-inspect", "58-altar-court", "43-altar-asked", "40-altar-moon",
    "15-returning", "16-blank", "17-returning-five", "18-carried", "19-one-blank", "27-blank-asked", "30-carried-asked",
    "59-returning-minors", "13b-sink",
    "35a-moon-before", "35-moon", "36-moon-reversed", "31-wheel", "32-wheel-reversed", "33-star", "34-star-reversed",
    "37-sun", "38-sun-reversed", "39-heavens", "41-returning-star", "42-one-moon",
    "44-kept", "45-kept-rising", "46-kept-remembered", "47-kept-threaded", "48-kept-five", "49-kept-one", "53-kept-small", "54-kept-altar",
    "62-keys", "63-keys-small",
    "80-large-1728", "81-large-1728-reading", "82-large-1728-draw", "83-large-2560", "84-large-2560-reading", "85-large-2560-altar",
    "61-suits", "14-back",
]

GROUP_OF_SHEET = {"13c-quill": G2, "13-ink": G4, "13b-sink": G9, "61-suits": G14, "14-back": G14}

on_disk = {p.stem for p in (ASSETS / "shots").glob("*.png")}
missing = on_disk - set(ORDER)
assert not missing, f"not in ORDER: {missing}"
lost = set(ORDER) - on_disk
assert not lost, f"not rendered: {lost}"

items = []
for i, name in enumerate(ORDER):
    f = ASSETS / "shots" / f"{name}.png"
    px = png_size(f)
    if name in SHEETS:
        scale, title, desc, source, hint = SHEETS[name]
        items.append(dict(
            file=f"shots/{name}.png", title=title, description=desc, kind="png", px=px, scale=scale,
            pt=[round(px[0] / scale, 1), round(px[1] / scale, 1)], vector=False, group=GROUP_OF_SHEET[name],
            order=i, source=source, states="composite sheet (not a room state)", figma_hint=hint,
            caveats=f"The shot tool's own composite at its fixed scale @{scale}x (ARCANA_SHOT_SCALE does not apply). Raster; the cards family carries vector card art."))
        continue
    group, title, desc, source, states, caveat = P[name]
    scale = 1.5 if name.startswith(("83-", "84-", "85-")) else 2
    pt = [round(px[0] / scale, 1), round(px[1] / scale, 1)]
    items.append(dict(
        file=f"shots/{name}.png", title=title, description=desc, kind="png", px=px, scale=scale, pt=pt,
        vector=False, group=group, order=i, source=source, states=states,
        figma_hint=STAGE_HINT + f" ({int(pt[0])} x {int(pt[1])} pt)",
        caveats=(STAGE + (" " + caveat if caveat else "")).strip()))

# --- the real window ---
WIN = [
    ("1-invocation", "Room at rest"), ("2-holding", "Holding"), ("3-draw", "The draw"), ("5-reading", "Three Fates, spoken"),
    ("67-closing-prompt", "Three Fates after its chord"), ("7-inspect", "The altar"), ("8-five", "The Long Road"),
    ("9-one", "One Card"), ("10-woven", "The folio"), ("44-kept", "What the Moon Keeps"),
    ("56-ribbon-hand", "The draw, a card taken"), ("62-keys", "The keys"), ("12-invocation-small", "Minimum window at rest"),
]
CHROME = ("Traffic lights (drawn natively in Figma, not in the PNG): close, minimise, zoom, each 14 x 14 pt at x 9, 32, 55 and y 9 "
          "from the window's top-left (centres (16,16), (39,16), (62,16); 23 pt apart); title bar 32 pt, transparent, no title.")
# mean abs error of the whole frame against AppKit's drawing of the real window (verify.sh)
DIRECT = {"1-invocation": "1.07", "12-invocation-small": "1.10", "67-closing-prompt": "1.98",
          "3-draw": "4.10, nearly all of it AppKit's darker card shadows", "62-keys": "0.68"}
for j, (name, what) in enumerate(WIN):
    f = ASSETS / "shots-window" / f"{name}.png"
    px = png_size(f)
    pt = [px[0] / 2, px[1] / 2]
    small = name == "12-invocation-small"
    stage = "940 x 628" if small else "1260 x 828"
    items.append(dict(
        file=f"shots-window/{name}.png", title=f"Window: {what}" + (" (940 x 660)" if small else " (1260 x 860)"),
        description=(f"The {what.lower()} as the live window lays it out: the whole {int(pt[0])} x {int(pt[1])} pt window, the sky filling it "
                     f"under the hidden title bar, the stage ({stage} pt) starting 32 pt down. Same pose, cards and copy as shots/{name}.png."),
        kind="png", px=px, scale=2, pt=pt, vector=False, group="15 The real window", order=len(ORDER) + j,
        source=f"{T} (pose '{name}') rendered with ARCANA_SHOT_INSET=32: RootView.safeAreaPadding(.top, 32) (mkmain.py); {R}:19-24, Sources/Arcana/Chamber.swift:161-236",
        states=next((P[name][4] for k in [0] if name in P), ""),
        figma_hint=f"window frame {int(pt[0])} x {int(pt[1])} pt with the image as fill; add the traffic lights natively on top. " + CHROME,
        caveats=("The room's GeometryReader reports the same size (" + stage + ") and top inset (32) here as in a real offscreen titled window, "
                 "so every position is the live one. "
                 + ("This frame was also compared pixel by pixel with AppKit's own drawing of that window: aligned at 0 px offset "
                    f"(mean error {DIRECT[name]}/255). " if name in DIRECT else
                    "(Pixel comparison with AppKit was run on the rest, minimum, reading, draw and keys frames; this pose shares their layout.) ")
                 + "The traffic lights are absent (ImageRenderer draws only the content); the window's rounded corners are not drawn.")))

f = ASSETS / "shots-window" / "titlebar-inactive-1260.png"
px = png_size(f)
items.append(dict(
    file="shots-window/titlebar-inactive-1260.png", title="Title bar strip as AppKit draws it (inactive)",
    description="The top 32 pt of a 1260 pt wide window at rest: the three traffic lights in their inactive grey over the sky, as AppKit drew an offscreen (never key) window. Reference for the native chrome.",
    kind="png", px=px, scale=2, pt=[px[0] / 2, px[1] / 2], vector=False, group="15 The real window", order=len(ORDER) + len(WIN),
    source="design/figma/render/shots/measure.swift (NSThemeFrame cacheDisplay)", states="inactive window",
    figma_hint="reference only: draw the chrome natively. " + CHROME,
    caveats="Inactive (grey) buttons only: an offscreen window is never key, so the red/yellow/green active look and the hover glyphs are not captured."))

manifest = dict(
    category="shots",
    tool=("cd design/figma/render/shots && ./build.sh   (copies Sources/Arcana minus ArcanaApp.swift into src/, patches the copy "
          "with patch.py, makes work/main.swift from Tools/shot/main.swift with mkmain.py, compiles with swiftc -target "
          "arm64-apple-macosx14.0, renders shots/ at ARCANA_SHOT_SCALE=2, shots-window/ with ARCANA_SHOT_INSET=32, measures a real "
          "offscreen window, verifies, and writes this manifest). Subcommands: build | shots [prefix...] | window [prefix...] | measure | verify | manifest."),
    notes=(
        "Every pose of the repo's shot tool (Tools/shot/main.swift, names unchanged) re-rendered on 2026-09-30 at @2x, plus new poses 64-86 "
        "for states no shot showed, plus shots-window/ (the live window's layout). "
        "DETERMINISM: the scratch copy seeds the shuffle (SplitMix64, seed 9) so every posed reading shows the same cards: " + THREE + "; "
        + ONE + "; " + FIVE + ". Poses built from named cards (As Above, minors, kept) show those cards. The ARCANA light is held off the word except in 86-title-light. "
        "The moon's phase and the kept readings' dates follow the render day (2026-09-30: WANING GIBBOUS; SEPTEMBER 18, AUGUST 21, SEPTEMBER 27). "
        "THE THREAD: 'FIND THE THREAD' is shown as it is with a usable OpenAI key (the scratch copy never looks for a key); 73-reading-no-key shows the room without one. "
        "SAFETY: no key or Keychain is read, the sound engine is never started, readings are posed in memory (Keeping.file = nil), nothing goes on screen. "
        "THE REAL WINDOW (measured offscreen with styleMask [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], "
        "titlebarAppearsTransparent, titleVisibility .hidden, as .windowStyle(.hiddenTitleBar) makes on macOS 26.6): title bar 32.0 pt at both "
        "1260 x 860 and 940 x 660; contentLayoutRect 1260 x 828 / 940 x 628; the hosting view's safeAreaInsets.top 32; RootView's GeometryReader "
        "sees 1260 x 828 (940 x 628) with insets top 32, leading/trailing/bottom 0. " + CHROME + " "
        "REPRODUCTION: RootView.safeAreaPadding(.top, 32) in a 1260 x 860 ImageRenderer frame makes the GeometryReader report exactly the same "
        "size and insets, so the stage is laid out 32 pt down while Chamber stretches the sky over the whole window. Checked numerically: "
        "(1) against AppKit's own cacheDisplay of the real offscreen window, the window renders align at 0 px vertical offset (mean abs error "
        "0.68/255 on the moon, 1.0 on the title and chooser, 1.1 whole room at rest, 1.1 minimum window, 2.0 reading, 0.68 keys), while the plain "
        "stage shot is off by 39 px at best; (2) against Layout: the thread in the three-card reading lies at 968 px (formula 32 + 0.36 x 828 + "
        "256.68/2 + 26 = 484.42 pt = 968.8 px), the plain stage's at 933 px (formula 933.2); the moon's lit-part centroid moves 55.6 px between the "
        "plain and window renders (formula 56.3 px: max(70, 0.12H) + inset). "
        "SHADOWS: AppKit's cacheDisplay draws the stacked card shadows much darker (the ribbon, error 4.1/255); the real screen recording "
        "docs/demo.mp4 (t = 24 s) matches the ImageRenderer's lighter shadows, so the renders here are the faithful ones and the AppKit captures "
        "(render/shots/measure/) are for layout checks only. The window's rounded corners and the active traffic-light colours are not captured. "
        "Stage shots (shots/) remain what the shot tool always drew: no safe area, the stage = the frame. Figma should present the shots-window "
        "frames as the screens and the shots/ frames as the state catalogue."),
    items=items,
)
out = ASSETS / "shots" / "manifest.json"
out.write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
print(f"wrote {out} with {len(items)} items")
