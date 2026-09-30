#!/bin/bash
# Re-renders every type-ink asset into design/figma/assets/type-ink.
#   ./build.sh            all sections
#   ./build.sh quill ink  only these (type title quill dust ink verse altar thread)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"
python3 prepare.py
mkdir -p bin
swiftc -O -target arm64-apple-macosx14.0 -o bin/typeink src/*.swift tool/*.swift
bin/typeink "$here/../../assets" "$@"
