#!/bin/bash
# Publishes the reading agents fetch: writes the deck's words out of
# Deck.swift, then deploys the Worker. Needs `wrangler login` once.
set -euo pipefail
cd "$(dirname "$0")/.."

CLANG_CACHE="${CLANG_MODULE_CACHE_PATH:-/tmp/arcana-clang-cache}"
mkdir -p build

echo "▸ the deck's words"
CLANG_MODULE_CACHE_PATH="$CLANG_CACHE" swiftc -o build/deckwords \
  Sources/Arcana/Ink.swift Sources/Arcana/Palette.swift Sources/Arcana/Deck.swift \
  Sources/Arcana/CardArt.swift Sources/Arcana/Suits.swift Tools/deck/main.swift
build/deckwords > agent/deck.json

echo "▸ the worker"
cd agent
if command -v wrangler >/dev/null; then wrangler deploy "$@"; else npx wrangler deploy "$@"; fi
