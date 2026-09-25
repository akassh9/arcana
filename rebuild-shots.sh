#!/bin/bash
# Renders posed frames of the stage to build/shots for visual review.
set -euo pipefail
cd "$(dirname "$0")"
FILES=(Sources/Arcana/*.swift)
KEEP=()
for f in "${FILES[@]}"; do [[ "$f" == *ArcanaApp.swift ]] || KEEP+=("$f"); done
mkdir -p build/shots
swiftc -O -target arm64-apple-macosx14.0 -o build/mkshot "${KEEP[@]}" Tools/shot/main.swift
build/mkshot build/shots "$@"
