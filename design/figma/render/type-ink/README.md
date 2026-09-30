# type-ink renders

Type and the pen in motion, for the Figma handoff. Everything is drawn offscreen
by the app's own SwiftUI views (ImageRenderer → 8-bit sRGB PNG); no window is
shown, nothing is captured from the screen, nothing is heard.

    ./build.sh                 # every section → design/figma/assets/type-ink/
    ./build.sh quill ink       # only some: type title quill dust ink verse altar thread
    python3 manifest.py        # then rewrite assets/type-ink/manifest.json

- `prepare.py` copies `Sources/Arcana/*.swift` (not ArcanaApp.swift) into `src/`
  and patches the copies only: the audio engine never starts; no key is read
  (env, .env.local, Keychain) and OpenAI is never asked; `Game.threadable` is
  settable; a few file-private views (Title, Stanza, ThreadPanel, Inspector…)
  are made internal; two hooks pose the title's light at a chosen k and a verse
  line part-way through its arrival. Each patch must match, or it stops.
- `tool/` is the renderer (`main.swift` dispatches the sections; the files are
  named so none clashes with a source file on this case-insensitive disk).
- `Keeping.file = nil` before any `Game()`: no kept reading is read or written.
- Stage frames are 1260x828: the default window's content under its 32 pt title
  bar, with the near sky drawn still (`\.stillSky`), as the shot tool does.
- `contact/` holds two small helpers used to check the renders: `contact`
  (a contact sheet) and `px` (sample a pixel).

The stroke-ramp SVGs were checked by importing them into the Figma file through
the bridge (`_render-check` page) and exporting them back; the exports are in
`design/figma/out/_render-check/type-ink-stroke-ramp-*.png`.
