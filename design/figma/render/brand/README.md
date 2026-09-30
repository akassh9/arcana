# Brand renders (Figma handoff)

Makes everything in `design/figma/assets/brand/` and its `manifest.json`.

    cd design/figma/render/brand
    ./make.sh                      # everything (about 2 min)
    ./make.sh logo icon wordmark   # only some steps
    # steps: logo icon wordmark film demo readme history agent release preview manifest

## What it needs

- The Command Line Tools (`swiftc`, `iconutil`, `sips`), `ffmpeg`/`ffprobe`, `gh`, `curl`, `python3`.
- `build/Arcana.app` (for the shipped `AppIcon.icns`), `film/out/` (the film's frames, contact sheet
  and mp4: `cd film && npm install && ./make.sh`), and `build/preview/` (the 2026-09-26 preview
  sheets). All three are gitignored; they are only read.

## The tools

- `tools/img.swift` → `bin/img`: a small Core Graphics tool (grounds, crops, zooms, the fringe
  reveal, alpha-ignored view, icon sizes, contact sheets, sRGB tagging). No app code.
- `tools/brand/main.swift` → `bin/brand`: compiled with `Sources/Arcana/*.swift` minus
  `ArcanaApp.swift`, as the shot tool is. Modes:
  - `icon OUT.png` / `iconsvg OUT.svg`: the fallback icon (Tools/icon's IconView) and its SVG,
    with `CardArt.iconMarks()` written as paths (gold leaf as the Palette.leaf gradient over each
    shape's bounding box).
  - `wordmark OUT.svg CHECK.png`: ARCANA as Didot-Bold glyph outlines, checked against SwiftUI's
    own `Text` at 4x (prints the mean alpha difference).
  - `stage OUT.png SCALE PHASE`: the opening screen (pose 1-invocation), rendered when
    `t mod 12 = PHASE`, so the title's light is at `k = PHASE / 3.2`.
- `tools/*.py`: the film palette (read from `film/arcana.html`), the README structure, the git
  timeline in eras (design notes written by hand per commit), the Worker notes, the manifest.
- `film-frames.txt`, `demo-stills.txt`: the chosen film frames and demo times. Edit and re-run
  `./make.sh film` or `./make.sh demo manifest`.

## Safety

- Nothing goes on screen: ImageRenderer and Core Graphics only. No sound: `Sfx.shared.enabled`
  is set false first and the main thread never yields, so the drone's fade-in never runs.
- `Keeping.file = nil`: kept readings are never read or written.
- `OPENAI_API_KEY` is set to a placeholder, and the tools run from this folder, so the key lookup
  stops at the environment: no `.env.local`, no Keychain, no network from the app code.
- Network: only the three plain GETs to the Worker and `gh release view v1.3`.
- Nothing in the repo is written; `build/` is only read.

`out/` holds the full stage renders and the wordmark check; `scratch/` is disposable (module
cache, crops, logs; a few files there are from an earlier, interrupted run).
