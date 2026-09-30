# Sound assets (Figma hand-off, category "sound")

Re-run everything with `./run.sh` (about 2 minutes). Outputs go to
`design/figma/assets/sound/`; nothing in the repo proper is touched, nothing is
played aloud, no user data is read.

- `main.swift` — the offline tool `mksound`, compiled with `Sources/Arcana/*.swift`
  (all but `ArcanaApp.swift`) so every sample comes from the app's own `Synth`
  (`Sfx.swift:369-536`). It never touches `Sfx.shared` (that starts the live engine).
  It writes to `native/` (44.1 kHz float32, the app's own format):
  - `dry-*.wav` — every voice as Synth makes it: bright bowls on the spread notes,
    dark bowls an octave down, the unheard G5 door bell, the 15 chimes, the drone
    loop, the swell, tick, slide, thud, riffle, and four spread chords (mirroring
    `Sfx.chord`).
  - `room-*.wav` — single voices through a rebuilt Sfx graph (offline
    `AVAudioEngine` in manual rendering mode: cathedral 42 / medium room 12, drone
    dry, master 0.5) at their usual gain.
  - `seq-*.wav` — timed event sequences with the drone: as the app plays them
    (12 air / 6 hand round-robin players with `.interrupts`, player volumes
    carried through one session) and `-intended` (every sound on its own player at
    its exact gain and sample).
  - `cues-*.json` (what sounded when) and `facts.json` (tables computed with the
    app's functions: Hz, partials, phases, riffle onsets, chime tames, pans,
    measured peaks and buffer-end levels).
- `make_assets.py` — afconvert to 48 kHz 24-bit (the drone resampled over three
  laps and the middle one kept, so it still loops), ffmpeg `showwavespic` /
  `showspectrumpic` pictures (2400 x 600, pearl/gold/ink), EBU R128 + astats
  loudness, cue lists.
- `spec.py` — writes `sound-spec.json` and `manifest.json`.
- `probe/` — the offline measurements behind two notes in the spec: `ramp.swift`
  (AVAudioMixerNode eases a player-volume change over ~1024 frames) and
  `onset3.swift` (a buffer scheduled "now" starts a block or more later offline;
  explicit future times are ignored once rendering has begun), plus
  `onsets.py` / `eventpeaks.py` checks.

Offline facts worth knowing: onsets land within one 64-frame block (1.5 ms) of
their times and vary by that much run to run, so renders are not bit-identical.
