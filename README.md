# Arcana

A tarot reading room for macOS. Native SwiftUI, no dependencies — every card is
drawn by code and every sound is synthesised at launch.

```bash
./build.sh && open build/Arcana.app
```

A reading is a small crossing. You arrive in the sky at first light — pale
blue overhead, dawn rising from below the table, tonight's real moon still up
in the corner. You ask by holding: the room goes quiet, gold dust gathers to
the deck, the drone swells, and on the last breath the deck is cut. If you
wrote your question first, its gold goes in with the dust, and it comes back
above the spread before the verse answers it. Each card
you draw writes itself in gold that cools to ink and rings its own bowl; a
thread of light is laid beneath the spread as it grows. Then the reading is
spoken back as verse, one line per card, and the whole spread sounds as one
chord. When it is over you hold once more, and the cards are returned: the ink
sinks into the stock, the gold stays, and they go home to the deck.

## Playing

| | |
|---|---|
| `1` `2` `3` | choose a spread — one card, three fates, the long road. Once you are writing, they are only numbers |
| type | before you hold, you may write the question. It is laid in gold and cools to ink; the hold gives it to the deck as dust, and it is read back above the spread. It is kept nowhere and sent nowhere |
| press and hold | anywhere on the sky, or hold `space` / `return` — asks the question and cuts the deck. While writing, a tapped `space` is a space. Let go early and the light drains back |
| sweep the hand | the fan is an instrument: each card chimes as the cursor crosses it, low on the left, high on the right |
| click a card | draw it; it lands, turns, and writes itself |
| hover a drawn card | its line brightens in the verse, its light and node rise |
| click a drawn card | opens it on the altar — it turns toward the pointer |
| press and hold, again | press and hold the sky, or hold `space` / `return`, once the reading has been spoken: return the cards |
| `esc` | let go / take back what you wrote / close the card / start over |
| `m` | sound on/off. Before the ask it is a letter; the bowl, top right, always works |

Cards land reversed about 42% of the time; the art turns with them, an oxblood
diamond appears under the title, and the card's bowl sounds an octave lower in
a darker voice.

With Reduce Motion on, the hold is short, cards appear already written, and the
sky is still.

When a spread is complete, **find the thread** is an optional closing ritual.
It returns one finished folio with two short sentences and one question to carry
away, set in the air where the verse was. When the cards are returned, its
question stays over the blank cards until they turn. It never streams or opens a
chat. The request sends only the selected spread and Arcana's authored card
language. A question you write is never part of that request.

To enable it locally, put an OpenAI key in `.env.local`:

```text
OPENAI_API_KEY=your-key-here
```

`ARCANA_AI_MODEL` is optional and defaults to `gpt-5`. The app requests a
structured result with `store: false` and keeps the folio only in the current
reading.

## How it is built

| file | |
|---|---|
| `Sources/Arcana/Ink.swift` | a pen that draws like a hand — every stroke bowed, every vertex nudged by a seeded generator, so a card is identical each run but never mechanical |
| `Sources/Arcana/CardArt.swift` | the twenty-two compositions, the card frame, the blind-embossed reverse with its one sun of gold leaf, the celestial wheel, the app icon; and what each card leaves in the stock when its ink has sunk |
| `Sources/Arcana/Deck.swift` | the deck. One line per card, per orientation; one note per position |
| `Sources/Arcana/CardImages.swift` | faces rasterised once via `ImageRenderer`; a card being revealed is drawn live, stroke by stroke, then swapped for its raster. A card being returned is its raster fading off its pressed blank — the same grammar as the reverse: stock, pressed lines, one gold |
| `Sources/Arcana/Chamber.swift` | the sky at first light: pale blue, lilac, rose, dawn and its rays, the engraved wheel, the daytime moon, and the near sky — gold dust and soft blooms that breathe, glints, the hold ring, blooms and ripples |
| `Sources/Arcana/Moon.swift` | tonight's moon phase, reckoned from a known new moon |
| `Sources/Arcana/Sfx.swift` | singing bowls, chimes, the swell, a drone that breathes with the sky, and the hand sounds — synthesised off the main thread at launch, played through two rooms |
| `Assets/arcana-logo.png` | the compass/eclipse mark used for the macOS app icon |
| `Sources/Arcana/Game.swift` | the beats — the held question, the draw, the writing, the recital, the return — plus all stage geometry |
| `Sources/Arcana/RootView.swift` | the table itself: one absolutely-positioned stage, the thread, the verse, the altar |
| `Sources/Arcana/Weave.swift` | the optional, non-streaming spread thread provider |
| `Sources/Arcana/Quill.swift` | the written question — laid by the pen in gold, cooling to ink, given to the deck with the dust, read back above the spread; held in memory only |
| `Sources/Arcana/QuillInput.swift` | the invisible page it is typed on — a real text view, so accents, dead keys and input methods work, with nothing drawn |

Type is Didot throughout, which ships with macOS.

### Sound

Every position in a spread has a note from one C-major pentatonic, so any spread
is a consonant chord. The drone loops every twenty seconds without a seam —
each partial completes a whole number of cycles — and swells on a ten-second
period, started in phase with the sky's breathing, so light and sound breathe
together at six breaths a minute. Bowls, chimes and the swell go through a
cathedral reverb; card stock stays in a small room.

### Keeping it quiet on the CPU

SwiftUI re-renders whatever a clock touches, so the rule here is: large
things never move by themselves. The sky's gradients, rays and wheel are
drawn once and change only while the question is held. Everything that moves
on its own lives in small leaf views with their own clocks — the near-sky
canvas at 20fps, the title's light only during its sweep, the thread only while
light is running along it, the written line only while its ink is wet. When the cards are returned, each redraws only while
its own ink is sinking, and the sky is never touched — a return costs less than
the ask. Idle, the app sits around 10–11% of one core —
about where it was before the sky was added.

### Reviewing the look without a display

`./rebuild-shots.sh` renders posed frames of every phase — including a card
mid-writing and the question mid-hold — to `build/shots/`, useful for judging
layout in a diff, or when the screen is not available.

### Notes

* `build.sh` compiles with `swiftc` straight into a signed `.app` bundle,
  packages the logo as `AppIcon.icns`, and needs only the Command Line Tools —
  no Xcode project.
* `_original/` holds the sources, a build and renders of the version before the
  redesign, for comparison.
