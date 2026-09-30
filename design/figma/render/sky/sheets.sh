#!/bin/bash
# Reference strips over the sky, built from mksky's frames (run after mksky).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
A="$HERE/../../assets/sky"
cd "$HERE"
[[ -x pxt ]] || swiftc -O -o pxt px/main.swift
mkdir -p _check
for k in landing cut; do
  for f in "$A"/near/flash-$k-*-1260x860.png; do
    ./pxt over "_check/over-$(basename "$f")" none "$A/backdrop/backdrop-composite-charge-0-1260x860.png" "$f"
  done
  ./pxt sheet "$A/near/flash-$k-strip-over-sky.png" 6 630 "#FFFFFF" _check/over-flash-$k-*.png
done
./pxt sheet "$A/moon/moon-phases-strip-on-sky.png" 16 129 "#DDD8F2" "$A"/moon/moon-phase-*.png
echo "strips built"
