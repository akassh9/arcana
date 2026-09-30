# cards — renderer for the Figma handoff

Renders all 78 Arcana cards as Figma assets into `design/figma/assets/cards/`. It uses the app's own
drawing code: `cardkit/main.swift` is compiled together with `Sources/Arcana/*.swift` (all of them except
`ArcanaApp.swift`), like `rebuild-shots.sh` does. Everything is drawn offscreen with ImageRenderer. No window
is opened, nothing is read from or written to the user's data (`Keeping.file = nil`), and nothing is sent over the network.

## Re-run

```
design/figma/render/cards/build.sh                 # faces, svg, shared, deck  (~40 s incl. compile)
design/figma/render/cards/build.sh faces only=fool,cups-7   # a subset
design/figma/render/cards/build.sh typecheck       # Swift renders for comparisons -> check/
python3 design/figma/render/cards/make_deck.py      # check/deck-measured.json + art-notes.json -> assets/cards/deck.json
python3 design/figma/render/cards/make_manifest.py  # -> assets/cards/manifest.json
```

Modes of `cardkit`:
- `faces`: `faces/`, `faces-reversed/`, `blanks/`, `blanks-reversed/` PNG @3x (678x1200, 8-bit sRGB, opaque) via CardFace / CardBlank.
- `svg`: `art/<id>.svg` (CardArt.art), `blank-art/<id>-blank.svg` (pressedArt as three emboss passes, plus leafArt), `leaf/<id>-leaf.svg` (leafArt). Marks become paths in draw order. They are grouped by role, and a mark joins an earlier group of its role only if nothing drawn in between overlaps it, so the stacking stays exact.
- `shared`: face frame / blank frame / layered back SVGs, back PNG, the grain tile (checked: identical to Grain.image), the vignette layer, stock PNGs. It also writes `check/vignette-profile.json`.
- `deck`: `check/deck-measured.json`. The type frames come from SwiftUI (GeometryReader on CardFace's own modifiers, at 3x). The ink boxes come from 4x renders. The name line breaks were found by pixel-matching manual breaks against SwiftUI's own wrap.

`art-notes.json` holds the per-card prose (what the art shows, where the gold and oxblood are). It was taken from
the design inventory (cards.json / minors.json), so make_deck.py doesn't need the inventory.

## Checks (check/)

- `compare/` (a small tool): `work/compare a.png b.png strip.png [bg]` writes an a | b | diff x4 strip and prints stats.
  `BANDS=` prints ink boxes per band, `MEAN=` mean colours, `CROP=` crops the strip.
- `sheet/`: `work/sheet out.png cols cellW files…` makes a contact sheet.
- `figma-testcard.js` / `figma-typecheck.js`: bridge steps. The first builds the native Figma test card (Hierophant), the second the type
  checks. Run them with `node design/figma/bridge/run.mjs --no-lib <file>`. Exports land in `design/figma/out/_render-check/`,
  and everything they create is removed again.
- `check/cmp/`: the comparison strips (Swift | Figma | diff).

`work/` holds the binaries and the module cache. `work/probe` is a probe left by an earlier attempt.
