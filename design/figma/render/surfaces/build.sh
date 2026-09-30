#!/bin/bash
# Builds the surfaces tool from patched copies of the app's sources (never the repo's own files).
set -euo pipefail
cd "$(dirname "$0")"
python3 patch_sources.py
mkdir -p bin work
export CLANG_MODULE_CACHE_PATH="$PWD/work/clang-cache"
swiftc -O -target arm64-apple-macosx14.0 -o bin/surfaces src/*.swift main.swift
