#!/bin/bash
# Checks the window renders against AppKit's own drawing of a real offscreen
# window (measure/appkit-*.png) and against the layout formulas (Game.swift Layout).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"
W=../../assets/shots-window; S=../../assets/shots; M=measure; T=bin/imgtool
{
echo "== rest: moon box"; $T shift $W/1-invocation.png $M/appkit-rest-1260x860.png 2127 223 80 80 90
echo "== rest: deck box"; $T shift $W/1-invocation.png $M/appkit-rest-1260x860.png 1160 1150 200 350 90
echo "== rest: title + chooser box"; $T shift $W/1-invocation.png $M/appkit-rest-1260x860.png 700 300 1120 560 90
echo "== rest: whole"; $T shift $W/1-invocation.png $M/appkit-rest-1260x860.png 0 0 2520 1720 40
echo "== minimum window rest: whole"; $T shift $W/12-invocation-small.png $M/appkit-rest-940x660.png 0 0 1880 1320 40
echo "== reading: middle card box"; $T shift $W/67-closing-prompt.png $M/appkit-reading-1260x860.png 1160 420 200 480 90
echo "== reading: whole"; $T shift $W/67-closing-prompt.png $M/appkit-reading-1260x860.png 0 0 2520 1720 40
echo "== draw: whole"; $T shift $W/3-draw.png $M/appkit-draw-1260x860.png 0 0 2520 1720 40
echo "== keys: whole"; $T shift $W/62-keys.png $M/appkit-keys-1260x860.png 0 0 2520 1720 40
echo "== CONTROL: plain 1260x860 stage shot vs the real window"; $T shift $S/1-invocation.png $M/appkit-rest-1260x860.png 0 0 2520 1720 90
echo "== thread y, window (formula: 32 + 0.36*828 + 256.68/2 + 26 = 484.42 pt = 968.8 px)"; $T gold $W/67-closing-prompt.png 1434 900 1050
echo "== thread y, plain stage (formula: 0.36*860 + 266.6/2 + 26 = 466.6 pt = 933.2 px)"; $T gold $S/67-closing-prompt.png 1434 850 1050
echo "== moon, lit-part centroid, window (disc centre formula 1083.6, 131.36 pt = 2167.2, 262.7 px)"; $T bright $W/1-invocation.png 2107 203 120 120 246
echo "== moon, lit-part centroid, plain stage (disc centre formula 1083.6, 103.2 pt = 2167.2, 206.4 px)"; $T bright $S/1-invocation.png 2107 150 120 120 246
} | tee "$HERE/measure/verify.txt"
