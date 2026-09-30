#!/bin/bash
# Re-renders every sound asset: see README.md. Nothing is played aloud.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
cd "$REPO"
KEEP=()
for f in Sources/Arcana/*.swift; do [[ "$f" == *ArcanaApp.swift ]] || KEEP+=("$f"); done
mkdir -p "$HERE/bin"
swiftc -O -target arm64-apple-macosx14.0 -o "$HERE/bin/mksound" "${KEEP[@]}" "$HERE/main.swift"
cd "$HERE"
rm -rf native
./bin/mksound native            # 44.1 kHz float32 renders + cues-*.json + facts.json
python3 make_assets.py          # -> assets/sound/wav, png, sequences (48 kHz 24-bit, pictures, loudness)
python3 spec.py                 # -> assets/sound/sound-spec.json, manifest.json
rm -f native/*.wav              # the 44.1 kHz masters are regenerated on every run
