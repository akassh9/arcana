#!/bin/bash
# Draws Arcana's glyphs to design/figma/assets/glyphs (see README.md).
set -euo pipefail
cd "$(dirname "$0")"
T=arm64-apple-macosx14.0
if [[ "${1:-}" != "--tool-only" ]]; then
  python3 prepare.py
  mkdir -p lib
  swiftc -O -enable-testing -target $T -module-name ArcanaKit -emit-library -static \
    -emit-module -emit-module-path lib/ArcanaKit.swiftmodule -o lib/libArcanaKit.a src/*.swift
fi
mkdir -p bin ref
swiftc -O -target $T -I lib -L lib -lArcanaKit -o bin/glyphs tool/*.swift
OUT=../../assets/glyphs
rm -rf "$OUT"/ui "$OUT"/pen "$OUT"/suits
bin/glyphs "$OUT" ref
