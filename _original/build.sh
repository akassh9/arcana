#!/bin/bash
# Builds Arcana.app from source. No Xcode project, no dependencies.
set -euo pipefail
cd "$(dirname "$0")"

TARGET="arm64-apple-macosx14.0"
[ "$(uname -m)" = "x86_64" ] && TARGET="x86_64-apple-macosx14.0"

APP="build/Arcana.app"
SRC=(Sources/Arcana/*.swift)
CLANG_CACHE="${CLANG_MODULE_CACHE_PATH:-/tmp/arcana-clang-cache}"

echo "▸ compiling"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
CLANG_MODULE_CACHE_PATH="$CLANG_CACHE" swiftc -O -parse-as-library -target "$TARGET" \
  -o "$APP/Contents/MacOS/Arcana" "${SRC[@]}"

cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Arcana</string>
  <key>CFBundleDisplayName</key><string>Arcana</string>
  <key>CFBundleExecutable</key><string>Arcana</string>
  <key>CFBundleIdentifier</key><string>local.arcana.reader</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>14.0</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.entertainment</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSSupportsAutomaticGraphicsSwitching</key><true/>
</dict>
</plist>
PLIST

echo "▸ icon"
if sips -z 512 512 Assets/arcana-logo.png --out build/app-icon-512.png >/dev/null \
   && sips -s format icns build/app-icon-512.png --out "$APP/Contents/Resources/AppIcon.icns" >/dev/null; then
  echo "  app icon ← Assets/arcana-logo.png"
else
  echo "  logo asset unavailable; trying the code-drawn fallback"
  if CLANG_MODULE_CACHE_PATH="$CLANG_CACHE" swiftc -O -target "$TARGET" -o build/mkicon \
       Sources/Arcana/Ink.swift Sources/Arcana/Palette.swift Sources/Arcana/Deck.swift \
       Sources/Arcana/CardArt.swift Sources/Arcana/CardImages.swift \
       Tools/icon/main.swift \
     && build/mkicon build/icon.png; then
    ICONSET=build/AppIcon.iconset
    mkdir -p "$ICONSET"
    for s in 16 32 128 256 512; do
      sips -z $s $s build/icon.png --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
      sips -z $((s*2)) $((s*2)) build/icon.png --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
    done
    if ! iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"; then
      echo "  (skipped — iconutil rejected the generated iconset)"
    fi
  else
    echo "  (skipped — icon render unavailable)"
  fi
fi

codesign --force --sign - "$APP" >/dev/null 2>&1 || true
echo "▸ built $APP"
