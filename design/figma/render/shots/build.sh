#!/bin/bash
# Builds the shot tool from a patched scratch copy of the app's sources and
# renders every pose. Reads the repo; writes only under design/figma/.
#
#   ./build.sh            build, then render everything (shots/ @2x, then shots-window/)
#   ./build.sh build      build only
#   ./build.sh measure    measure a real offscreen titled window (prints the inset)
#   ./build.sh shots [prefix ...]     render stage shots into assets/shots
#   ./build.sh window [prefix ...]    render the window variants into assets/shots-window
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
ASSETS="$REPO/design/figma/assets"
BIN="$HERE/bin"
# the title bar of a 1260 x 860 hiddenTitleBar window on this Mac (./build.sh measure)
INSET="${ARCANA_WINDOW_INSET:-32}"
# never your readings: an in-memory shelf (Keeping.file = nil), and should
# anything look, a throwaway file here
export ARCANA_KEPT="$HERE/throwaway-kept.json"
unset OPENAI_API_KEY

build() {
  rm -rf "$HERE/src" "$HERE/work"
  mkdir -p "$HERE/src" "$HERE/work" "$BIN"
  for f in "$REPO"/Sources/Arcana/*.swift; do
    [[ "$f" == *ArcanaApp.swift ]] || cp "$f" "$HERE/src/"
  done
  python3 "$HERE/patch.py" "$HERE/src"
  python3 "$HERE/mkmain.py" "$REPO/Tools/shot/main.swift" "$HERE/work/main.swift"
  swiftc -O -target arm64-apple-macosx14.0 -o "$BIN/mkshot" \
    "$HERE"/src/*.swift "$HERE/support.swift" "$HERE/measure.swift" "$HERE/work/main.swift"
  swiftc -O -target arm64-apple-macosx14.0 -o "$BIN/imgtool" "$HERE/imgtool.swift"
  echo "built $BIN/mkshot"
}

WINDOW_POSES=(1-invocation 2-holding 3-draw 5-reading 7-inspect 8-five 9-one 10-woven
  44-kept 56-ribbon-hand 62-keys 12-invocation-small 67-closing-prompt)

case "${1:-all}" in
  build) build ;;
  measure)
    mkdir -p "$HERE/measure" "$ASSETS/shots-window"
    ARCANA_SHOT_MEASURE=1 "$BIN/mkshot" "$HERE/measure" | tee "$HERE/measure/measure.txt"
    # the title bar strip as AppKit draws it (inactive traffic lights over the sky), sRGB
    "$BIN/imgtool" srgb "$HERE/measure/appkit-frame-rest-1260x860.png" \
      "$ASSETS/shots-window/titlebar-inactive-1260.png" 0 0 2520 64 ;;
  verify) "$HERE/verify.sh" ;;
  manifest) python3 "$HERE/manifest.py" ;;
  seeds) ARCANA_SHOT_SEEDS=1 "$BIN/mkshot" /dev/null ;;
  shots) shift; mkdir -p "$ASSETS/shots"; ARCANA_SHOT_SCALE=2 "$BIN/mkshot" "$ASSETS/shots" "$@" ;;
  window)
    shift; mkdir -p "$ASSETS/shots-window"
    [[ $# -gt 0 ]] || set -- "${WINDOW_POSES[@]}"
    ARCANA_SHOT_SCALE=2 ARCANA_SHOT_INSET="$INSET" "$BIN/mkshot" "$ASSETS/shots-window" "$@" ;;
  all)
    build
    "$0" shots
    "$0" window
    "$0" measure
    "$0" verify
    "$0" manifest ;;
esac
