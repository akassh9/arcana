#!/bin/bash
# Copies the app's sources into ./src (never touching the repo's own),
# patches the copy (patch.py), and builds ./mksky.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
rm -rf "$HERE/src"
mkdir -p "$HERE/src"
for f in "$REPO"/Sources/Arcana/*.swift; do
  [[ "$f" == *ArcanaApp.swift ]] && continue
  cp "$f" "$HERE/src/"
done
cat > "$HERE/src/SkyClock.swift" <<'SWIFT'
import Foundation
/// Render-tool only: a fixed moment for stills, tonight's date, and switches
/// for what the chamber draws.
enum SkyClock {
  nonisolated(unsafe) static var fixed: TimeInterval?
  nonisolated(unsafe) static var moon = true
  nonisolated(unsafe) static var near = true
  nonisolated(unsafe) static var tonightDate: Date?
  static var now: TimeInterval { fixed ?? Date().timeIntervalSinceReferenceDate }
  static var tonight: Date { tonightDate ?? Date() }
}
SWIFT
python3 "$HERE/patch.py"
swiftc -O -target arm64-apple-macosx14.0 -o "$HERE/mksky" "$HERE"/src/*.swift "$HERE"/tool/*.swift
echo "built $HERE/mksky"
