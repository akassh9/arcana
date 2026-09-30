# surfaces: renders for the Figma handoff

This folder renders the surfaces around the room into `design/figma/assets/surfaces/`: Settings, the main window's frame, the menus, the keys page, the moon's door (kept readings), an invented kept.json, and notes on system surfaces. Everything is drawn offscreen. No window is put on screen, nothing sounds, no network request is made, and neither the Keychain nor the user's kept.json is read.

## Re-run

```sh
cd design/figma/render/surfaces
./build.sh                                  # copies Sources/Arcana into src/, patches the copies, compiles bin/surfaces
bin/surfaces ../../assets/surfaces work     # all parts; or name some: settings chrome keys kept sample
python3 make_menus.py                       # menus.json from work/menus-probe.json
python3 make_manifest.py                    # manifest.json, geometry.json, system-surfaces.json
```

The two probes run the app's own SwiftUI scenes. Each is a background-only process (LSBackgroundOnly, activation policy `.prohibited`), so it can never take the menu bar. A watchdog exits the moment any of its windows is on screen, and a hard limit of 8 s means it never waits unbounded.

```sh
# the menu bar (ArcanaApp.swift's scenes and commands, the room's window suppressed at launch)
swiftc -O -target arm64-apple-macosx15.0 -parse-as-library -o menu-probe/Arcana menu-probe/main.swift \
  -Xlinker -sectcreate -Xlinker __TEXT -Xlinker __info_plist -Xlinker menu-probe/Info.plist
menu-probe/Arcana work/menus-probe.json

# SwiftUI's own Settings window, and with -D MAINWINDOW its room window too. Every NSWindow ordering
# method is a no-op and every window starts at alpha 0, so neither ever reaches the screen.
export CLANG_MODULE_CACHE_PATH=$PWD/work/clang-cache
swiftc -O -target arm64-apple-macosx15.0 -parse-as-library -o settings-probe/Arcana src/*.swift settings-probe/main.swift \
  -Xlinker -sectcreate -Xlinker __TEXT -Xlinker __info_plist -Xlinker settings-probe/Info.plist
settings-probe/Arcana work          # work/settings-probe.json + work/real-settings-window@2x.png
swiftc -O -D MAINWINDOW -target arm64-apple-macosx15.0 -parse-as-library -o settings-probe/Arcana-window src/*.swift \
  settings-probe/main.swift -Xlinker -sectcreate -Xlinker __TEXT -Xlinker __info_plist -Xlinker settings-probe/Info.plist
settings-probe/Arcana-window work/wp   # work/wp/window-probe.json (both windows' style, size, buttons)
```

## What the patches do (patch_sources.py; the repo is never touched)

- **Sfx**: the audio engine never starts.
- **Weave / Settings**: no key from env, `.env.local` or the Keychain, and no check with OpenAI.
- **SettingsView**: takes its state from `SettingsPose` (key, heard), with no `.task` or `.onChange`.
- **Keeping**: `OpenAIKey.dry` and `digest` are internal, so "out of credit" can be posed. `Shelf` and its coder are internal for kept-sample.json. TurnMark's hover can be posed (`TurnPose`).
- **Legend**: private views become internal. `LegendProbe` records where the title and each line land, for the crops.
- `Keeping.file = nil` is set before any `Game()`, so readings exist in memory only.

## How each surface is drawn

- **Settings and window**: the real AppKit views, drawn with `NSHostingView` and `cacheDisplay` of the window's theme frame. They sit in an `NSWindow` subclass that answers the private active-appearance questions with yes, so the lights and caret draw as in the front window. The window is never ordered in. The corners are then clipped to the 16 pt radius AppKit reports (`_cornerRadius`).
- **Stage frames**: `ImageRenderer` with `.environment(\.stillSky, true)`, as in `Tools/shot`. Keys and kept pages use this framing.
- `bin/sheet` and `bin/crop` are small helpers for looking at the renders, not assets.
