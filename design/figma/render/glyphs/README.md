# Glyphs for the Figma handoff

Every small drawn thing of Arcana as SVG — the room's glyphs, the keys page's
signs and caps, the diamonds, thread and halos, the spread chooser, the suit
emblems, motifs and court devices, and the pen's vocabulary — with @3x PNG
previews of the sheets and a manifest.

    ./run.sh               # copy Sources/Arcana to ./src (patched), build, draw
    ./run.sh --tool-only   # keep ./lib, rebuild only the tool and draw

Writes `design/figma/assets/glyphs/` (SVGs, previews, `manifest.json`) and
`ref/` (checks, not assets).

How it works

- `prepare.py` copies the app's sources (not ArcanaApp.swift) into `src/`,
  opens the private views and helpers it needs (Suits' helpers, KeyGlyph,
  KeySigns, CapShape, KeyCap, BowlGlyph, TurnMark, Brackets, SpreadChoice,
  ThreadGlyph …), sets `Keeping.file = nil` and `WeaveService.ready = false`
  so neither the user's kept.json nor the Keychain is ever touched. The repo
  is never edited.
- `src/` is built once as a testable static library (`lib/`), the tool in
  `tool/` against it: `core.swift` (a glyph as painted paths; the SVG writer;
  a SwiftUI drawer; PNG and diff), `emit.swift` (files, manifest, checks),
  `ui.swift`, `pen.swift`, `suits.swift`, `main.swift`.
- Pen marks come from the app's own static [Mark] arrays and helper calls
  (real seeds); they are written path element by element. Gold fills get
  Palette.leaf as a userSpaceOnUse gradient over the shape's own box, as
  MarksCanvas does.
- `ref/diffs.txt`: each glyph drawn from its items vs the app's own view
  (BowlGlyph, KeyCap, SpreadChoice, Brackets, Thread …), both @3x.
  Pen glyphs, caps with signs, brackets, the thread and a whole Queen of Cups
  art match to the pixel; SPACE/ESC caps and the tiles differ only by their
  type, which the SVGs leave to Figma.
- `figma-check.js`: prepend `const FILES = [...]` (paths under assets/glyphs)
  and run with `node ../../bridge/run.mjs --no-lib <file>`; it imports each
  into the `_render-check` page, exports @3x to
  `design/figma/out/_render-check/glyphs-*.png` and removes it. Compare with
  `ref/mine3x/<name>.png` using `bin/diff a.png b.png`; `bin/contact` lays
  PNGs side by side.
