#!/bin/bash
# Builds cardkit against the app's own sources and renders the card assets.
#   design/figma/render/cards/build.sh [faces] [svg] [shared] [deck] [typecheck] [only=fool,cups-7]
# No mode = everything except typecheck. Output: design/figma/assets/cards; scratch: render/cards/check.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
KEEP=()
for f in "$REPO"/Sources/Arcana/*.swift; do [[ "$f" == *ArcanaApp.swift ]] || KEEP+=("$f"); done
mkdir -p "$HERE/work/mc" "$HERE/check"
if [[ ! -x "$HERE/work/cardkit" || "$HERE/cardkit/main.swift" -nt "$HERE/work/cardkit" ]]; then
  swiftc -O -target arm64-apple-macosx14.0 -module-cache-path "$HERE/work/mc" \
    -o "$HERE/work/cardkit" "${KEEP[@]}" "$HERE/cardkit/main.swift" 2>&1 | grep -E "error" || true
fi
CHECK="$HERE/check" "$HERE/work/cardkit" "$REPO/design/figma/assets/cards" "$@"
