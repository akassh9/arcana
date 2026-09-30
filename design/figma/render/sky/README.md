# Sky renders for the Figma handoff

Renders the sky, the moon and every light of Arcana into `../../assets/sky/`,
offscreen only (ImageRenderer, CoreGraphics, and the app's own Metal
`SkyRenderer.still`). No window, no screen capture, no sound, no network, no
Keychain, no kept readings (`Keeping.file = nil`).

## Re-run

```sh
cd design/figma/render/sky
./prepare.sh                 # copy Sources/Arcana (minus ArcanaApp.swift) to ./src, patch the copy, build ./mksky
./mksky ../../assets/sky     # all renders; or give prefixes: backdrop composite wheel moon near answers positions
python3 svg.py               # vector rebuilds (backdrop, glint, star, ring, positions map, curve) + gradients.json + as-above-positions.json
./sheets.sh                  # reference strips (flashes over the sky, moon phases)
python3 manifest.py          # ../../assets/sky/manifest.json
```

## What is here

- `prepare.sh`, `patch.py` — the scratch copy and its patches. The repo's
  sources are never touched. The patches open the sky's file-private views
  (Wheel, Rays, SkyAnswers, MoonView, MoonDisc, NearSky, the seeds), route the
  sky's clock through `SkyClock` (a fixed moment for stills) and
  `Moon.tonight` through `SkyClock.tonight` (2026-09-30 21:00 Chicago), add
  switches to leave the moon or near sky out of the chamber, and turn off the
  OpenAI key lookup (no environment, no `.env.local`, no Keychain).
- `tool/ChamberProbe.swift.part` — appended to the copied `Chamber.swift`, so
  it can call the near sky's own private painters (blooms, glints, ring, motes,
  given dust, flashes) one at a time.
- `tool/main.swift` — the render driver (`mksky`).
- `svg.py` — vector rebuilds from the formulas and the seeds that mksky wrote.
- `px/main.swift` → `pxt` — tiny image utility (diff, stat, pixel, over, sheet)
  used for checks and strips. There is no PIL on this Mac.
- `_check/` — scratch comparisons (Figma round-trips vs Swift renders).

## Checks that were made

- The eight layer PNGs stacked at their layer opacities vs the real Chamber
  composite: 0.46/255 mean.
- `backdrop-native-1260x860.svg` imported into Figma and exported: 0.50/255
  mean, 5 max against the Swift render.
- `engraved-wheel.svg` via Figma vs CoreGraphics stroking the same marks:
  0.12/255 mean.
- Glint, held star and ring SVGs via Figma vs the Metal renders: 0.01-0.04/255
  mean.

The fixed moment is reference time 812000506.125 s (breath 0.88, several
glints lit), chosen deterministically in `main.swift`.
