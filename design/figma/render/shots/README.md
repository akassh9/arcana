# shots: every screen state of the room, for the Figma handoff

```
cd design/figma/render/shots
./build.sh            # build, render shots/ and shots-window/, measure, verify, write the manifest
./build.sh build      # build only
./build.sh shots [prefix ...]    # stage shots into ../../assets/shots (@2x)
./build.sh window [prefix ...]   # the real-window variants into ../../assets/shots-window (@2x)
./build.sh measure    # measure a real offscreen titled window (measure/measure.txt, appkit-*.png)
./build.sh verify     # compare the window renders with AppKit's drawing and the Layout formulas (measure/verify.txt)
./build.sh manifest   # ../../assets/shots/manifest.json
```

This reads the repo and never writes to it. Everything it makes goes under `design/figma/`.

- `src/`: a scratch copy of `Sources/Arcana/*.swift` (without `ArcanaApp.swift`), patched by `patch.py`. Every patch must apply the expected number of times, or the build stops. The patches:
  - The sound engine is never started.
  - No OpenAI key is looked for, and the Keychain is never read. Whether the thread is offered is posed per shot.
  - The shuffle is seeded.
  - The thread's bead and the ARCANA light are pinned.
  - The pen's composition and its spent touch can be posed.
  - What the room's GeometryReader sees is recorded.
- `work/main.swift`: made by `mkmain.py` from `Tools/shot/main.swift`. The tool's own poses keep their names. `shoot()` seeds the deck (seed 9), takes a scale, and with `ARCANA_SHOT_INSET=32` renders the whole window: `RootView.safeAreaPadding(.top, 32)`. New poses 64 to 86 are appended. There are also a `ARCANA_SHOT_MEASURE=1` mode (see `measure.swift`) and a `ARCANA_SHOT_SEEDS=1` mode, which lists the cards each seed deals.
- `support.swift`: the hooks the patches call.
- `imgtool.swift`: contact sheets, sRGB conversion, and the shift, centroid and gold-row checks used by `verify.sh`.
- `measure/`: AppKit's own drawing of real offscreen windows, used for layout checks only. It draws stacked card shadows darker than the screen does (compare `docs/demo.mp4` at 24 s).
- `view/`: downscaled copies and contact sheets, made only for looking at the renders.

Nothing goes on screen. Readings are posed in memory (`Keeping.file = nil`, with `ARCANA_KEPT` pointing at a throwaway file here in case anything looks). No network requests are made.
