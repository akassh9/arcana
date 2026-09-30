#!/bin/bash
# Renders every brand / marketing / history asset for the Figma handoff into
# design/figma/assets/brand. Offline except the three Worker readings (plain
# GETs) and `gh release view`. Nothing goes on screen and nothing is played.
#   ./make.sh            everything
#   ./make.sh logo icon  only those steps (logo icon wordmark film demo readme
#                        history agent release preview manifest)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
OUT="$REPO/design/figma/assets/brand"
BIN="$HERE/bin"; SCR="$HERE/scratch"; R="$HERE/out"
mkdir -p "$BIN" "$SCR" "$R" "$OUT"
IMG="$BIN/img"; BRAND="$BIN/brand"
# never the reader's key: a placeholder in the environment is found before
# .env.local or the Keychain are ever looked at (Weave.swift APIKeyStore)
export OPENAI_API_KEY=sk-design-render-placeholder
cd "$HERE"   # not the repo root, so no .env.local is in reach either

want() { [[ $# -eq 0 || " $STEPS " == *" $1 "* ]]; }
STEPS="${*:-logo icon wordmark film demo readme history agent release preview manifest}"

build() {
  if [[ ! -x "$IMG" || "$HERE/tools/img.swift" -nt "$IMG" ]]; then
    swiftc -O -module-cache-path "$SCR/mc" -o "$IMG" "$HERE/tools/img.swift"
  fi
  if [[ ! -x "$BRAND" || "$HERE/tools/brand/main.swift" -nt "$BRAND" ]]; then
    local F=()
    for f in "$REPO"/Sources/Arcana/*.swift; do [[ "$f" == *ArcanaApp.swift ]] || F+=("$f"); done
    swiftc -O -target arm64-apple-macosx14.0 -module-cache-path "$SCR/mc" -o "$BRAND" \
      "${F[@]}" "$HERE/tools/brand/main.swift" 2> "$SCR/compile.log" || { cat "$SCR/compile.log"; exit 1; }
  fi
}
build

# --- logo -------------------------------------------------------------------------
if want logo; then
  D="$OUT/logo"; mkdir -p "$D"
  L="$REPO/Assets/arcana-logo.png"
  cp "$L" "$D/arcana-logo.png"                                    # as is: untagged RGBA
  "$IMG" ground "$L" "$D/arcana-logo-on-pearl.png" F9F7F2          # Palette.pearl
  "$IMG" ground "$L" "$D/arcana-logo-on-dark.png" 1E1E1E           # a dark Dock / desktop
  "$IMG" rgbonly "$L" "$D/arcana-logo-alpha-ignored.png"            # what a tool that drops alpha shows
  "$IMG" reveal "$L" "$D/arcana-logo-fringe-reveal.png"             # every partly clear pixel at full strength
  # the zoom: the orbit's upper-left planet and its trail, 4x, nearest neighbour
  X=340; Y=190; W=200; H=150
  "$IMG" crop "$D/arcana-logo-on-pearl.png" "$SCR/z-pearl.png" $X $Y $W $H 4 nearest
  "$IMG" crop "$D/arcana-logo-on-dark.png" "$SCR/z-dark.png" $X $Y $W $H 4 nearest
  "$IMG" crop "$D/arcana-logo-alpha-ignored.png" "$SCR/z-rgb.png" $X $Y $W $H 4 nearest
  "$IMG" crop "$D/arcana-logo-fringe-reveal.png" "$SCR/z-reveal.png" $X $Y $W $H 4 nearest
  "$IMG" sheet "$D/arcana-logo-fringe-zoom.png" 2 800 600 24 FFFFFF \
    "1  on pearl #F9F7F2 (as it looks in light UI)=$SCR/z-pearl.png" \
    "2  on #1E1E1E (as composited: fringe alpha at most 16 of 255)=$SCR/z-dark.png" \
    "3  alpha ignored: the stored #E9110F matte=$SCR/z-rgb.png" \
    "4  reveal: partly clear pixels at full strength=$SCR/z-reveal.png"
  "$IMG" fringe "$L" > "$SCR/fringe.txt"
fi

# --- app icon -----------------------------------------------------------------
if want icon; then
  D="$OUT/icon"; mkdir -p "$D"
  rm -rf "$SCR/AppIcon.iconset"
  iconutil -c iconset "$REPO/build/Arcana.app/Contents/Resources/AppIcon.icns" -o "$SCR/AppIcon.iconset"
  ls "$SCR/AppIcon.iconset" > "$SCR/iconset.txt"                   # icon_512x512.png only
  cp "$SCR/AppIcon.iconset/icon_512x512.png" "$D/app-icon-512-shipped.png"
  for s in 16 32 64 128 256 512 1024; do
    "$IMG" resize "$D/app-icon-512-shipped.png" "$D/app-icon-$s.png" $s $s
  done
  "$IMG" icons "$D/app-icon-512-shipped.png" "$D/app-icon-sizes-light-dark.png" ECECEC 1E1E1E
  "$BRAND" icon "$D/fallback-icon.png"
  "$BRAND" iconsvg "$D/fallback-icon.svg"
fi

# --- wordmark in context ------------------------------------------------------------
if want wordmark; then
  D="$OUT/wordmark"; mkdir -p "$D"
  "$BRAND" wordmark "$D/wordmark-arcana.svg" "$R/wordmark-check.png" | tee "$SCR/wordmark.txt"
  # the opening screen @2x, once at rest and three times as the light passes (k = t/3.2)
  for p in 6.0 0.8 1.44 2.08; do "$BRAND" stage "$R/stage-$p.png" 2 $p | tee -a "$SCR/stage.txt"; done
  cp "$R/stage-6.0.png" "$D/opening-screen-rest@2x.png"
  "$IMG" crop "$R/stage-6.0.png" "$D/title-block-rest@2x.png" 700 200 1120 380
  "$IMG" crop "$R/stage-6.0.png" "$D/title-rest@2x.png" 800 280 920 210
  "$IMG" crop "$R/stage-0.8.png" "$D/title-light-k25@2x.png" 800 280 920 210
  "$IMG" crop "$R/stage-1.44.png" "$D/title-light-k45@2x.png" 800 280 920 210
  "$IMG" crop "$R/stage-2.08.png" "$D/title-light-k65@2x.png" 800 280 920 210
fi

# --- the launch film ------------------------------------------------------------------
if want film; then
  D="$OUT/film"; mkdir -p "$D/frames"
  FR="$REPO/film/out/arcana-frames"
  rm -f "$D"/frames/*.png
  while read -r n name; do
    [[ -z "$n" || "$n" == \#* ]] && continue
    "$IMG" tag "$FR/$n.png" "$D/frames/film-$n-$name.png"           # untagged canvas output, read as sRGB
  done < "$HERE/film-frames.txt"
  cp "$REPO/film/out/arcana-contact.jpg" "$D/film-contact-every-6th-frame.jpg"
  cp "$REPO/film/out/arcana-final.mp4" "$D/arcana-launch-film.mp4"
  A=(); for f in "$D"/frames/*.png; do b=$(basename "$f" .png); A+=("${b#film-}=$f"); done
  "$IMG" sheet "$D/film-contact-picks.png" 6 320 320 12 F9F7F2 "${A[@]}"
  python3 "$HERE/tools/film_palette.py" "$REPO/film" "$D/film-palette.json"
fi

# --- the demo -----------------------------------------------------------------------
if want demo; then
  D="$OUT/demo"; mkdir -p "$D/stills"
  rm -f "$D"/stills/*.png
  while read -r t name; do
    [[ -z "$t" || "$t" == \#* ]] && continue
    tt=$(printf "%04.1f" "$t")
    ffmpeg -nostdin -v error -y -ss "$t" -i "$REPO/docs/demo.mp4" -frames:v 1 \
      -vf "scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24" "$SCR/demo.png"
    "$IMG" tag "$SCR/demo.png" "$D/stills/demo-${tt}s-$name.png"
  done < "$HERE/demo-stills.txt"
  cp "$REPO/docs/demo.mp4" "$D/demo.mp4"
  A=(); for f in "$D"/stills/*.png; do b=$(basename "$f" .png); A+=("${b#demo-}=$f"); done
  "$IMG" sheet "$D/demo-contact.png" 4 640 400 14 FFFFFF "${A[@]}"
fi

# --- the README -----------------------------------------------------------------------
if want readme; then
  D="$OUT/readme"; mkdir -p "$D"
  cp "$REPO/docs/arcana.png" "$D/docs-arcana.png"
  python3 "$HERE/tools/readme_structure.py" "$REPO/README.md" "$D/readme-structure.json"
fi

# --- history ------------------------------------------------------------------------------
if want history; then
  D="$OUT/history"; mkdir -p "$D"
  for f in 1-invocation 2-draw 3-mid 4-reading 5-inspect 6-five; do
    cp "$REPO/_original/shots/$f.png" "$D/original-candle-$f.png"
  done
  A=(); for f in 1-invocation 2-draw 3-mid 4-reading 5-inspect 6-five; do A+=("$f=$D/original-candle-$f.png"); done
  "$IMG" sheet "$D/original-candle-contact.png" 3 630 430 14 FFFFFF "${A[@]}"
  git -C "$REPO" log --date=short --stat --format='@@@%h|%ad|%aI|%s' > "$SCR/gitlog.txt"
  git -C "$REPO" log --format='@@@%h%n%b' > "$SCR/gitbodies.txt"
  python3 "$HERE/tools/timeline.py" "$SCR/gitlog.txt" "$SCR/gitbodies.txt" "$D/timeline.json"
fi

# --- the agent Worker (three plain GETs) ---------------------------------------------------
if want agent; then
  D="$OUT/agent"; mkdir -p "$D"
  B=https://arcana.khanikad.workers.dev
  curl -fsS "$B/today" -o "$D/reading-three.txt"
  curl -fsS "$B/today?spread=one" -o "$D/reading-one.txt"
  curl -fsS "$B/today?spread=road" -o "$D/reading-road.txt"
  date -u +%Y-%m-%dT%H:%M:%SZ > "$SCR/agent-fetched.txt"
  python3 "$HERE/tools/agent_info.py" "$REPO" "$(cat "$SCR/agent-fetched.txt")" "$D/worker.json"
fi

# --- the release ----------------------------------------------------------------------------
if want release; then
  D="$OUT/release"; mkdir -p "$D"
  gh release view v1.3 --repo akassh9/arcana --json name,tagName,publishedAt,body,assets > "$D/release-v1.3.json"
fi

# --- the 78-card preview sheets (build/preview, gitignored; copied, never written) ----------
if want preview; then
  D="$OUT/preview"; mkdir -p "$D"
  for f in "$REPO"/build/preview/*.png; do cp "$f" "$D/preview-$(basename "$f")"; done
  cp "$REPO/build/preview/all-lines.md" "$D/preview-all-lines.md"
fi

if want manifest; then python3 "$HERE/tools/manifest.py" "$REPO" "$OUT/manifest.json"; fi
echo "done → $OUT"
