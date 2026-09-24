# Arcana

A tarot reading room for macOS. Native SwiftUI, no dependencies — every card is
drawn by code and every sound is synthesised at launch.

```bash
./build.sh && open build/Arcana.app
```

## Playing

| | |
|---|---|
| `1` `2` `3` | choose a spread — one card, three fates, the long road |
| `return` | cut the deck / ask again |
| hover the hand | cards rise toward the cursor; click one to draw it |
| hover a drawn card | its line appears at the foot of the table |
| click a drawn card | opens it full size |
| `esc` | close the card / start over |
| `m` | sound on/off |

Cards land reversed about 42% of the time; the art turns with them and an
oxblood diamond appears under the title.

When a spread is complete, **find the thread** is an optional closing ritual.
It returns one finished folio with two short sentences and one question to carry
away. It never streams or opens a chat. The request sends only the selected
spread and Arcana's authored card language.

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
| `Sources/Arcana/CardArt.swift` | the twenty-two compositions, the card frame, the reverse, the app icon |
| `Sources/Arcana/Deck.swift` | the deck. One line per card, per orientation |
| `Sources/Arcana/CardImages.swift` | faces rasterised once via `ImageRenderer`, so the table holds 60fps |
| `Sources/Arcana/Chamber.swift` | candle pool, drifting embers, and the bloom that fires when a card lands |
| `Sources/Arcana/Sfx.swift` | riffle, slide, thud and bell, synthesised into PCM buffers at launch |
| `Assets/arcana-logo.png` | the compass/eclipse mark used for the macOS app icon |
| `Sources/Arcana/Game.swift` | three beats — invocation, draw, reading — plus all stage geometry |
| `Sources/Arcana/RootView.swift` | the table itself: one absolutely-positioned stage |
| `Sources/Arcana/Weave.swift` | the optional, non-streaming spread thread provider |

Type is Didot throughout, which ships with macOS.

### Reviewing the look without a display

`./rebuild-shots.sh` renders posed frames of every phase to `build/shots/`
— useful for judging layout in a diff, or when the screen is not available.

### Notes

* `build.sh` compiles with `swiftc` straight into a signed `.app` bundle,
  packages the logo as `AppIcon.icns`, and needs only the Command Line Tools —
  no Xcode project.
