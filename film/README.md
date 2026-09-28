# The launch film

Twenty-one seconds, square. Twelve people somewhere quiet at first light,
each with a gold light that is their question. The lights gather into one,
the deck is cut, the Star writes itself, and the day sky answers every one of
them with stars.

Every frame is drawn on a canvas by [`arcana.html`](arcana.html); nothing is
filmed or generated. The places are printed the way a risograph prints, in
four inks that together give the app's sky. The cards are the app's own:
`CardArt.swift` and `Ink.swift` ported stroke for stroke, with the same seeded
pen, so each card is drawn exactly as the app draws it. The sound is the app's
too: the bowls, chimes, drone, swell and card stock of `Sfx.swift`, rebuilt for
Web Audio. Every cue is read off the same timeline that cuts the pictures.

## Rendering

Needs Node 18 or later, Google Chrome and ffmpeg.

```bash
npm install && ./make.sh
```

This writes `out/arcana-final.mp4` in about fifteen seconds: 1080 × 1080,
drawn at 12 frames a second and played at 24, with the score at −16 LUFS.

Open `arcana.html` in Chrome to scrub through the film or play it with sound.
The beat sheet above the timeline, at the foot of the file, says what happens
when.

## Where it comes from

`core.js` and `render.mjs` are the core and renderer of the
hand-drawn-canvas-animation skill by Alexey Fateev
([alesha-pro/tools](https://github.com/alesha-pro/tools)). They are used
unchanged under the MIT License, in [`LICENSE-canvas-core`](LICENSE-canvas-core).
Everything else here was written for Arcana.
